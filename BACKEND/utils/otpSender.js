// Gmail OTP at email notifications. BACKEND lang ang gumagamit nito.
import nodemailer from 'nodemailer';
import { randomInt, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import validator from 'validator';
import ValidationError from './ValidationError.js';

const codes = new Map(); // Pansamantalang OTP; mawawala kapag nag-restart ang backend.
const secret = randomBytes(32);
const OTP_LIFE = 5 * 60 * 1000; // 5 minutes
const RESEND_WAIT = 60 * 1000; // 1 minute bago mag-resend
const MAX_TRIES = 5;

const cleanEmail = (email) => String(email || '').trim().toLowerCase();
const hashCode = (email, code) => createHmac('sha256', secret).update(email + ':' + code).digest();

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

// Gumagawa at nagpapadala ng OTP; hindi ibinabalik ang code sa website.
// WBS 4.1.1 [Backend] Implement student account registration
export const sendOTP = async (email) => {
    email = cleanEmail(email);
    if (!validator.isEmail(email)) throw new ValidationError('Enter a valid email.', 400);

    const old = codes.get(email);
    const now = Date.now();
    if (old && now - old.sentAt < RESEND_WAIT) {
        throw new ValidationError('Wait 1 minute before requesting another code.', 429);
    }
    // Linisin ang mga expired OTP para hindi lumaki ang memory.
    for (const [key, record] of codes) {
        if (record.expiresAt < now) codes.delete(key);
    }

    const otp = String(randomInt(100000, 1000000));
    await sendGmail({
        to: email,
        subject: 'SK Scholarship - Verification Code',
        text: `Your verification code is ${otp}. It expires in 5 minutes. Do not share this code.`,
    });
    codes.set(email, {
        hash: hashCode(email, otp), sentAt: Date.now(),
        expiresAt: Date.now() + OTP_LIFE, tries: 0,
    });
    return { message: 'OTP sent to your Gmail.', expiresInSeconds: 300 };
};

// Chine-check ang OTP bago gumawa ng student account.
export const verifyOTP = (email, otp) => {
    email = cleanEmail(email);
    const entry = codes.get(email);
    if (!entry || entry.expiresAt < Date.now()) {
        codes.delete(email);
        throw new ValidationError('OTP expired or missing. Request a new code.', 400);
    }
    if (entry.tries >= MAX_TRIES) {
        codes.delete(email);
        throw new ValidationError('Too many attempts. Request a new OTP.', 429);
    }
    entry.tries += 1;
    if (!/^\d{6}$/.test(String(otp || '')) || !timingSafeEqual(entry.hash, hashCode(email, String(otp)))) {
        throw new ValidationError('Wrong OTP. Check your Gmail and try again.', 400);
    }
    return true;
};

// Tanggalin ang OTP kapag successful na ang registration.
export const clearOTP = (email) => codes.delete(cleanEmail(email));
