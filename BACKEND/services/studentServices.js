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

// WBS 4.1.2 [Backend] Implement student login and logout
export const login = async (student) => {
    if (!student.email || !student.password) {
        throw new ValidationError('Email and password are required!', 400);
    }

    const existing = await studentModels.findStudentByEmail(student.email);
    if (existing.length === 0) {
        throw new ValidationError('Wrong email or password.', 401);
    }

    const isCorrectPassword = await bcrypt.compare(student.password, existing[0].password);

    if (!isCorrectPassword) {
        throw new ValidationError('Wrong email or password.', 401);
    }

    return publicStudent(existing[0]);
}

export const updateStudent = async (student) => {
    if (!student.name || !student.address) {
        throw new ValidationError('Name and address are required!', 400);
    }
    if (!isValidAddress(student.address)) {
        throw new ValidationError(ADDRESS_ERROR, 400);
    }

    const existing = await doesStudentExist({ id: student.id });
    if (!existing) {
        throw new ValidationError('Student does not exist!', 404);
    }

    const updatedRows = await studentModels.update({ ...student, address: student.address.trim() });
    return updatedRows;
}

export const deleteStudent = async (id) => {
     const existing = await doesStudentExist({id});
    if (!existing) {
        throw new ValidationError('Student does not exist!', 404);
    }
    const deletedStudent = await studentModels.remove(id);
    return deletedStudent;
}


/* ===== applications and uploaded documents of the student ===== */
const mustHaveStudent = async (studentId) => {
    const id = toId(studentId, 'student id');
    const existing = await doesStudentExist({ id });
    if (!existing) {
        throw new ValidationError('Student does not exist!', 404);
    }
    return id;
}

// the application must belong to this student
// WBS 4.2.1 [Backend] View available scholarships and create applications
const scholarshipOf = async (scholarshipId) => {
    const rows = await studentModels.findScholarshipForApply(scholarshipId);
    if (rows.length === 0) {
        throw new ValidationError('Scholarship does not exist!', 404);
    }
    return rows[0];
}

const isOpen = (scholarship) => new Date(scholarship.deadline + 'T23:59:59') >= new Date();

// WBS 4.2.1 [Backend] View available scholarships and create applications
export const applyForScholarship = async (studentId, scholarshipId) => {
    const id = await mustHaveStudent(studentId);
    const scholarship = await scholarshipOf(toId(scholarshipId, 'scholarship id'));

    if (!isOpen(scholarship)) {
        throw new ValidationError('This scholarship is closed.', 400);
    }

    const existing = await studentModels.findApplicationOfStudent(id, scholarship.id);
    if (existing.length > 0) {
        throw new ValidationError('You already applied for this scholarship.', 409);
    }

    try {
        return await studentModels.insertApplication(id, scholarship.id);
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
            throw new ValidationError('You already applied for this scholarship.', 409);
        }
        throw e;
    }
}

