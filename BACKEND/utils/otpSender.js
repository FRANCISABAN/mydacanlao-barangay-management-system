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
