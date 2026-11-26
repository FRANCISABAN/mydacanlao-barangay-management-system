// Gmail OTP at email notifications. BACKEND lang ang gumagamit nito.
import nodemailer from 'nodemailer';
import validator from 'validator';
import ValidationError from './ValidationError.js';

// Gumagamit ng Gmail App Password, hindi normal Gmail password.
// Kapag hindi makakonekta sa 465, susubukan ang 587.
// WBS 3.1.5 [Backend] Manage in-system and email notifications
// WBS 4.4.1 [Backend] Display scholarship notifications and email updates
export const sendGmail = async ({ to, subject, text }) => {
    const user = process.env.GMAIL_USER;
    const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
    if (!user || !pass) {
        throw new ValidationError('Set GMAIL_USER and GMAIL_APP_PASSWORD in BACKEND/.env.', 503);
    }
    if (!validator.isEmail(String(to || ''))) {
        throw new ValidationError('Invalid email address.', 400);
    }

    let lastError;
    for (const port of [465, 587]) {
        const gmail = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port,
            secure: port === 465,
            requireTLS: port === 587,
            auth: { user, pass },
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 15000,
        });
        try {
            await gmail.sendMail({ from: user, to, subject, text });
            return;
        } catch (error) {
            lastError = error;
            // Ulitin lang sa ibang port kapag network connection ang problema.
            if (!['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'ENETUNREACH',
                   'EHOSTUNREACH', 'ENOTFOUND', 'ESOCKET', 'ECONNECTION'].includes(error.code)) {
                break;
            }
            console.error(`Gmail port ${port}: ${error.code}`);
        } finally {
            gmail.close();
        }
    }
    console.error('Gmail send failed:', lastError?.code || 'error');
    throw new ValidationError('Could not send Gmail. Check the App Password or network SMTP ports (465/587).', 502);
};