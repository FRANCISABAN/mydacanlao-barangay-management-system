// SK - API AT MGA HELPER
// Dito ang API, checks, at simpleng helper functions.

// --- skCommonApi ---
// SK side only. Talks to the backend (BACKEND/app.js, port 3000) which also sends Gmail emails.
// Relative URL: gumagana sa PC at phone gamit ang iisang Vite link.
const BASE = import.meta.env?.VITE_API_URL || '/backend';

// Kumukuha o nagsa-save ng data sa backend.
export const call = async (path, options = {}) => {
    let response;

    try {
        response = await fetch(BASE + path, {
            headers: { 'Content-Type': 'application/json' },
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
        throw new Error(data?.error || `The backend returned an error (${response.status}). Check the backend console.`);
    }

    return data;
}

// Inihahanda ang data bago ipadala.
export const send = (method, body) => ({ method, body: JSON.stringify(body) });

// Email notifications ay idinadaan sa BACKEND (wala nang frontend email server).
// WBS 3.1.5 [Frontend] Manage in-system and email notifications
export const sendEmails = async (messages) => {
    try {
        const response = await call('/notifications/send-email', send('POST', { messages }));
        return { ok: response.ok === true, error: response.error || '' };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

// --- skCommonHelpers ---
// Shared helpers of the SK site only (no React in here). The other site has its own copy in common/student/.

export const DEFAULT_REQS = ['Barangay Clearance', 'Report Card', 'Certificate of Enrollment', 'Proof of Income'];

/* ===== scholarship rules ===== */
// the documents an application must have
// Kinukuha ang documents na kailangan.
export const requirementsOf = (app, scholarships) => {
    const scholarship = scholarships.find((s) => s.id === app.sid);
    return scholarship?.reqs?.length ? scholarship.reqs : DEFAULT_REQS;
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

// Bumabati ayon sa oras.
export const greeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Magandang umaga' : hour < 18 ? 'Magandang hapon' : 'Magandang gabi';
}

// Ginagawang initials ang pangalan.
export const initials = (name) => {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// --- skFunctions ---
// Helpers used only by the SK side (no React in here).
// trimmed, no empty rows, no duplicates
// Tinatanggal ang blank at duplicate na requirements.
// WBS 3.1.7 [Frontend] Create and publish scholarship programs
export const cleanList = (list) => [...new Set(list.map((x) => x.trim()).filter(Boolean))];

// the "+" button on the scholarship form adds the first of these that is not in the list yet
const SUGGESTED_REQS = ['Barangay Indigency', 'Birth Certificate', 'Valid ID', 'Certificate of Good Moral Character', 'Parent or Guardian ID', 'Recent 2x2 Photo'];

// Nagmumungkahi ng dagdag na requirement.
export const nextSuggestion = (current) => {
    const have = current.map((x) => x.trim().toLowerCase());
    return SUGGESTED_REQS.find((x) => !have.includes(x.toLowerCase())) || '';
}

// --- skCommonNotify ---
// Emails students through the BACKEND. Used by the SK site.

// Gumagawa at nagpapadala ng email notification.
// WBS 3.1.5 [Frontend] Manage in-system and email notifications
export const notifyStudents = async (students, emails, subject, text, showToast) => {
    const messages = emails.map((to) => ({ to, name: studentOf(students, to).name, subject, text }));
    if (!messages.length) return;

    showToast('Saved. Sending email...');
    const result = await sendEmails(messages);
    showToast(result.ok
        ? `Email sent to ${messages.length} student${messages.length > 1 ? 's' : ''}.`
        : `Saved, but the email was not sent. ${result.error}`);
}
