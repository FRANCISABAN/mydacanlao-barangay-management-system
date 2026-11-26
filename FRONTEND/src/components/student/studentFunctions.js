// STUDENT - API AT MGA HELPER
// Dito ang API, checks, at simpleng helper functions.

// --- studentCommonApi ---
// STUDENT side only. Talks to the backend (BACKEND/app.js, port 3000) which also sends Gmail emails.
// Relative URL: gumagana sa PC at phone gamit ang iisang Vite link.
const BASE = import.meta.env?.VITE_API_URL || '/backend';

// WBS 4.1.2 [Frontend] Implement student login and logout
// Login session of the student. It is saved in sessionStorage, so a refresh does not log the student out.
const TOKEN_KEY = 'studentToken';
const ME_KEY = 'studentMe';

export const getToken = () => {
    try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

export const getSavedStudent = () => {
    try { return getToken() ? JSON.parse(sessionStorage.getItem(ME_KEY)) : null; } catch { return null; }
}

// saveSession(token, student) after login; saveSession() after logout
export const saveSession = (token, student) => {
    try {
        if (token) {
            sessionStorage.setItem(TOKEN_KEY, token);
            sessionStorage.setItem(ME_KEY, JSON.stringify(student));
        } else {
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(ME_KEY);
        }
    } catch { /* storage blocked: the student just logs in again after a refresh */ }
}

// Kumukuha o nagsa-save ng data sa backend. The token goes with every request.
export const call = async (path, options = {}) => {
    let response;
    const token = getToken();

    try {
        response = await fetch(BASE + path, {
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
            ...options,
        });
    } catch {
        throw new Error('Cannot reach the backend. Start it: open BACKEND, then run  node app.js');
    }

    let data = null;
    try {
        data = await response.json();
    } catch {
        // the backend sent no JSON
    }

    if (!response.ok) {
        const error = new Error(data?.error || `The backend returned an error (${response.status}). Check the backend console.`);
        error.status = response.status; // 401 = the session ended
        throw error;
    }

    return data;
}

// Inihahanda ang data bago ipadala.
export const send = (method, body) => ({ method, body: JSON.stringify(body) });

// Email notifications ay idinadaan sa BACKEND (wala nang frontend email server).
export const sendEmails = async (messages) => {
    try {
        const response = await call('/notifications/send-email', send('POST', { messages }));
        return { ok: response.ok === true, error: response.error || '' };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

// --- studentCommonHelpers ---
// Shared helpers of the student site only (no React in here). The other site has its own copy in common/sk/.

export const DEFAULT_REQS = ['Barangay Clearance', 'Report Card', 'Certificate of Enrollment', 'Proof of Income'];

/* ===== scholarship rules ===== */
// the documents an application must have
// Kinukuha ang documents na kailangan.
export const requirementsOf = (app, scholarships) => {
    const scholarship = scholarships.find((s) => s.id === app.sid);
    return scholarship?.reqs?.length ? scholarship.reqs : DEFAULT_REQS;
}

// Tinitingnan kung puwede pang mag-apply.
// WBS 4.1.1 [Frontend] Implement student account registration
export const isValidAddress = (address) => {
    const words = String(address).toLowerCase().replace(/[^a-z0-9ñ\s]/g, ' ').split(/\s+/);
    return ['dacanlao', 'calaca', 'batangas'].every((w) => words.includes(w));
}

/* ===== uploaded files ===== */
