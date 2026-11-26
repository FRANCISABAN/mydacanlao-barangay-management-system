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
// WBS 4.2.1 [Frontend] View available scholarships and create applications
export const isOpen = (scholarship) => {
    return !scholarship.deadline || new Date(scholarship.deadline + 'T23:59:59') >= new Date();
}

// a closed scholarship stays in the list for one more day (it shows "Closed"), then it disappears
// Tinitingnan kung dapat pang ipakita ang scholarship.
export const isListed = (scholarship) => {
    if (!scholarship.deadline) return true;
    const lastDayShown = new Date(scholarship.deadline + 'T23:59:59');
    lastDayShown.setDate(lastDayShown.getDate() + 1);
    return lastDayShown >= new Date();
}

// counts by calendar day: 0 = the deadline is today
const daysLeft = (scholarship) => {
    return Math.round((new Date(scholarship.deadline + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5);
}

// Text kung ilang araw pa ang deadline.
// WBS 4.2.1 [Frontend] View available scholarships and create applications
export const deadlineText = (scholarship) => {
    if (!isOpen(scholarship)) return 'Closed';
    const n = daysLeft(scholarship);
    return n > 1 ? n + ' days left' : n === 1 ? '1 day left' : 'Last day';
}

// Kulay para sa deadline.
export const deadlineClass = (scholarship) => {
    if (!isOpen(scholarship)) return 'bad';
    return daysLeft(scholarship) <= 7 ? 'warn' : 'good';
}

/* ===== scholarships from the backend ===== */
// scholarship from the backend = { id, title, desc, deadline, reqs }
// Inaayos ang scholarship data mula sa backend.
export const toScholarship = (row) => ({
    id: String(row.id),
    title: row.title,
    desc: row.desc || '',
    deadline: row.deadline || '',
    reqs: Array.isArray(row.reqs) && row.reqs.length ? row.reqs : DEFAULT_REQS.slice(),
});

/* ===== people ===== */
// Hinahanap ang student gamit ang email.
export const findStudent = (students, email) => {
    return students.find((s) => String(s.email).toLowerCase() === String(email).toLowerCase());
}

// the student of an application (falls back to the email if the backend does not know the student)
// Kinukuha ang detalye ng student.
export const studentOf = (students, email) => {
    return findStudent(students, email) || { name: String(email).split('@')[0], email, address: '' };
}

// Ginagawang initials ang pangalan.
export const initials = (name) => {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// --- studentFunctions ---
// Helpers used only by the STUDENT side (no React in here).

// Bumabati ayon sa oras.
export const greeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Magandang umaga' : hour < 18 ? 'Magandang hapon' : 'Magandang gabi';
}

// Only addresses in Dacanlao, City of Calaca, Batangas are allowed (any format, but barangay + municipality + province must be there)
// Tinitingnan kung pasok ang address.
// WBS 4.1.1 [Frontend] Implement student account registration
export const isValidAddress = (address) => {
    const words = String(address).toLowerCase().replace(/[^a-z0-9ñ\s]/g, ' ').split(/\s+/);
    return ['dacanlao', 'calaca', 'batangas'].every((w) => words.includes(w));
}

/* ===== uploaded files ===== */
// WBS 4.3.1 [Frontend] Upload and manage scholarship requirements
export const MAX_FILE_MB = 3;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// what the upload buttons accept (the backend checks the type and size again)
export const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

// returns the problem as text, or '' when the file is fine
// Tinitingnan ang size at uri ng file.
export const checkFile = (file) => {
    if (!IMAGE_TYPES.includes(file.type) && file.type !== 'application/pdf') {
        return 'Only JPG, PNG, WEBP images or PDF files are allowed.';
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
        return `The file is too big. The maximum is ${MAX_FILE_MB} MB.`;
    }
    return '';
}

// Gives back { type, data } where data is the file as text (a data URL) that the backend saves.
// Images are shrunk first. A PDF is sent as it is, so the SK can open it.
// Binabasa at inaayos ang ia-upload na file.
export const readUpload = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read that file.'));
        reader.onload = () => {
            if (file.type === 'application/pdf') {
                resolve({ type: 'application/pdf', data: reader.result });
                return;
            }

            const image = new Image();
            image.onload = () => {
                const scale = Math.min(1, 900 / Math.max(image.width, image.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);
                canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve({ type: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.72) });
            };
            image.onerror = () => reject(new Error('Could not read that image.'));
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

// --- studentCommonNotify ---
// Emails students through the BACKEND. Used by the student site.

// Gumagawa at nagpapadala ng email notification.
// WBS 4.4.1 [Frontend] Display scholarship notifications and email updates
export const notifyStudents = async (students, emails, subject, text, showToast) => {
    const messages = emails.map((to) => ({ to, name: studentOf(students, to).name, subject, text }));
    if (!messages.length) return;

    showToast('Saved. Sending email...');
    const result = await sendEmails(messages);
    showToast(result.ok
        ? `Email sent to ${messages.length} student${messages.length > 1 ? 's' : ''}.`
        : `Saved, but the email was not sent. ${result.error}`);
}
