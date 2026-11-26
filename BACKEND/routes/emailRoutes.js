import express from 'express';
import validator from 'validator';
import * as studentModels from '../models/studentModels.js';
import { sendGmail } from '../utils/otpSender.js';

const emailRoutes = express.Router();
const requests = new Map();

// WBS 3.1.5 [Backend] Manage in-system and email notifications
// WBS 4.4.1 [Backend] Display scholarship notifications and email updates
emailRoutes.post('/send-email', async (req, res) => {
    // Simpleng limit: 10 requests per minute per IP.
    const ip = req.ip;
    const now = Date.now();
    const recent = (requests.get(ip) || []).filter((time) => now - time < 60000);
    if (recent.length >= 10) {
        return res.status(429).json({ ok: false, error: 'Too many email requests. Try again later.' });
    }
    requests.set(ip, [...recent, now]);

    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 200) {
        return res.status(400).json({ ok: false, error: 'Send 1 to 200 messages.' });
    }
    for (const mail of messages) {
        if (!validator.isEmail(String(mail?.to || '')) ||
            typeof mail.subject !== 'string' || !mail.subject.trim() || mail.subject.length > 200 ||
            typeof mail.text !== 'string' || !mail.text.trim() || mail.text.length > 5000) {
            return res.status(400).json({ ok: false, error: 'Invalid email message.' });
        }
    }

    try {
        // Hindi puwedeng magpadala sa random emails; registered students lang.
        const students = await studentModels.fetchAllStudents();
        const allowed = new Set(students.map((s) => s.email.toLowerCase()));
        if (messages.some((m) => !allowed.has(m.to.toLowerCase()))) {
            return res.status(403).json({ ok: false, error: 'Recipient is not a registered student.' });
        }

        // In-system notification: saved first, so the student can read it in the website even if Gmail fails.
        const idOf = new Map(students.map((s) => [s.email.toLowerCase(), s.id]));
        for (const mail of messages) {
            await studentModels.insertNotification(idOf.get(mail.to.toLowerCase()), mail.subject, mail.text);
        }

        for (const mail of messages) {
            const name = String(mail.name || 'Student').slice(0, 100);
            await sendGmail({
                to: mail.to, subject: mail.subject,
                text: `Hi ${name},\n\n${mail.text}\n\nSK Scholarship Portal`,
            });
        }
        return res.json({ ok: true, sent: messages.length });
    } catch (error) {
        return res.status(error.statusCode || 502).json({ ok: false, error: error.message || 'Email sending failed.' });
    }
});

export default emailRoutes;
