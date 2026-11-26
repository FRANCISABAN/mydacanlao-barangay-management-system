import { randomBytes } from 'node:crypto';

// Login sessions of the students. They are kept in memory: restarting the backend logs everyone out.
const sessions = new Map(); // token -> { studentId, expiresAt }
const SESSION_LIFE = 8 * 60 * 60 * 1000; // 8 hours

// Makes a random token after a successful login or register.
// WBS 4.1.2 [Backend] Implement student login and logout
export const startSession = (studentId) => {
    const token = randomBytes(32).toString('hex');
    sessions.set(token, { studentId: Number(studentId), expiresAt: Date.now() + SESSION_LIFE });
    return token;
};

// The token comes in the header:  Authorization: Bearer <token>
export const tokenOf = (req) => (req.headers.authorization || '').replace('Bearer ', '');

// Logout: the token stops working.
export const endSession = (token) => sessions.delete(token);

// Middleware: only the logged-in student can open his own /student/:id/... routes.
// WBS 4.1.2 [Backend] Implement student login and logout
// WBS 4.4.2 [Backend] Track scholarship application and requirement statuses
export const requireStudent = (req, res, next) => {
    const session = sessions.get(tokenOf(req));
    if (!session || session.expiresAt < Date.now()) {
        return res.status(401).json({ error: 'Please log in again.' });
    }
    if (session.studentId !== Number(req.params.id)) {
        return res.status(403).json({ error: 'You can only open your own records.' });
    }
    next();
};
