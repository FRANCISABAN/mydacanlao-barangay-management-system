import * as studentModels from '../models/studentModels.js';
import ValidationError from '../utils/ValidationError.js';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sendOTP, verifyOTP, clearOTP } from '../utils/otpSender.js';


// WBS 4.1.1 [Backend] Implement student account registration
/* ===== student address ===== */
// Only addresses in Barangay Dacanlao, City of Calaca, Batangas are allowed.
// The format does not matter (order, commas, "Brgy.", "City of", capital letters), but the barangay,
// the municipality and the province must all be there.
//   OK : "Dacanlao City of Calaca Batangas", "Brgy. Dacanlao, Calaca City, Batangas"
//   BAD: "City of Calaca Batangas" (no barangay)
const REQUIRED = ['dacanlao', 'calaca', 'batangas'];

const isValidAddress = (address) => {
    const words = String(address || '')
        .toLowerCase()
        .replace(/[^a-z0-9ñ\s]/g, ' ')
        .split(/\s+/);
    return REQUIRED.every((w) => words.includes(w));
};

const ADDRESS_ERROR =
    'Address must include the barangay, municipality and province, and must be in Dacanlao, City of Calaca, Batangas.';


// WBS 4.1.1 [Backend] Implement student account registration
export const requestRegistrationOTP = async (email) => {
    const cleaned = String(email || '').trim().toLowerCase();
    if (!validator.isEmail(cleaned)) throw new ValidationError('Enter a valid email.', 400);
    if (await doesStudentExist({ email: cleaned })) {
        throw new ValidationError('An account with that email already exists!', 409);
    }
    return sendOTP(cleaned);
}

// WBS 4.1.1 [Backend] Implement student account registration
export const createAccount = async (student) => {
    if (!student.name || !student.email || !student.address || !student.password) {
        throw new ValidationError('Name, address, email and password are required!', 400);
    }
    if (!isValidAddress(student.address)) {
        throw new ValidationError(ADDRESS_ERROR, 400);
    }
    student.email = String(student.email).trim().toLowerCase();
    if (!validator.isEmail(student.email)) {
        throw new ValidationError('improper email format!', 400);
    }

    const existing = await doesStudentExist(student);
    if (existing) {
        throw new ValidationError('An account with that email already exists!', 409);
    }

    // Kailangan ang tamang email OTP bago i-save ang account.
    verifyOTP(student.email, student.otp);

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(student.password, salt);
    const address = student.address.trim();

    const studentId = await studentModels.insertStudent({ ...student, address, password: hashedPassword });

    if (!studentId || studentId <= 0) {
        throw new Error('unable to create account.please try again later!');
    }

    clearOTP(student.email);
    return publicStudent({ id: studentId, name: student.name, email: student.email, address });
}

