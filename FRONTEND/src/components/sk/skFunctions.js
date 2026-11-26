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

// Hinahanap ang student gamit ang email.
export const findStudent = (students, email) => {
    return students.find((s) => String(s.email).toLowerCase() === String(email).toLowerCase());
}

// the student of an application (falls back to the email if the backend does not know the student)
// Kinukuha ang detalye ng student.
export const studentOf = (students, email) => {
    return findStudent(students, email) || { name: String(email).split('@')[0], email, address: '' };
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