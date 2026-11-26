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


// WBS 4.3.1 [Backend] Upload and manage scholarship requirements
/* ===== uploaded files (the SK site reads them too) ===== */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// the browser sends the file as text (base64), so 4,200,000 characters is about a 3 MB file
const MAX_FILE_MB = 3;
const MAX_DATA_CHARS = 4200000;

// the files are saved in the BACKEND/uploads folder. The database only keeps the file name.
const UPLOAD_DIR = fileURLToPath(new URL('../uploads/', import.meta.url));

const EXTENSION_OF = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' };
const TYPE_OF = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' };

// the file type is found from the file extension (example: app3_171.jpg -> image/jpeg)
const typeOfFile = (fileName) => {
    return TYPE_OF[path.extname(fileName || '').toLowerCase()] || '';
}

// dataUri looks like data:image/png;base64,.... Gives back the name of the saved file.
const saveUploadedFile = (applicationId, dataUri, type) => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const name = `app${applicationId}_${Date.now()}_${Math.floor(Math.random() * 1e6)}${EXTENSION_OF[type]}`;
    const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
    fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(base64, 'base64'));
    return name;
}

// gives the file back as data:<type>;base64,... (empty text when the file is missing)
export const readFileAsDataUri = (fileName) => {
    if (!fileName) return '';
    const file = path.join(UPLOAD_DIR, path.basename(fileName));
    if (!fs.existsSync(file)) return '';
    return `data:${typeOfFile(fileName)};base64,${fs.readFileSync(file).toString('base64')}`;
}

// used when a student replaces a file
const deleteUploadedFile = (fileName) => {
    if (!fileName) return;
    try {
        fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(fileName)));
    } catch {
        // already gone, nothing to do
    }
}

// Makes an uploaded image smaller before it is saved: at most 900 px on the longest side, saved as JPEG.
// It gets the image as a data URL and gives back { type, data }. A PDF never comes here.
// Needs the "sharp" package (run npm install in BACKEND).
const shrinkImage = async (dataUrl, type) => {
    let sharp;
    try {
        sharp = (await import('sharp')).default;
    } catch {
        // not installed yet: keep the image that the frontend already made smaller, so uploads still work
        console.warn('The "sharp" package is not installed, so the backend did not shrink the image. Open BACKEND and run: npm install');
        return { type, data: dataUrl };
    }

    try {
        const input = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
        const output = await sharp(input)
            .rotate()
            .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 72 })
            .toBuffer();

        return { type: 'image/jpeg', data: 'data:image/jpeg;base64,' + output.toString('base64') };
    } catch {
        throw new ValidationError('The image could not be read. Try another file.', 400);
    }
}


// WBS 4.4.2 [Backend] Track scholarship application and requirement statuses
/* ===== the shape of an application (the SK site uses these too) ===== */
// the frontend sends / receives { id, uid, sid, status, note, sat, rejAt, reqs: { "Report Card": { id, name, type, status, note, img, at } } }
export const toApplications = (apps, docs) => {
    return apps.map((a) => {
        const reqs = {};
        docs.filter((d) => d.application_id === a.id).forEach((d) => {
            const type = typeOfFile(d.file_path);
            reqs[d.requirement] = {
                id: String(d.id),
                name: d.file_name,
                by: d.student_name,
                type,
                status: d.status,
                note: d.note || '',
                // only images get a preview, a PDF is opened by the SK in a new tab
                img: type.startsWith('image/') ? readFileAsDataUri(d.file_path) : '',
                at: Number(d.uploaded_at),
            };
        });

        return {
            id: String(a.id),
            uid: a.uid,
            sid: String(a.scholarship_id),
            status: a.status,
            note: a.note || '',
            sat: a.submitted_at ? Number(a.submitted_at) : undefined,
            rejAt: a.rejected_at ? Number(a.rejected_at) : undefined,
            reqs,
        };
    });
}

// the requirements of a scholarship are saved as a JSON list
export const requirementsOf = (scholarship) => {
    try {
        return JSON.parse(scholarship.requirements) || [];
    } catch {
        return [];
    }
}

export const toId = (value, label) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        throw new ValidationError(`Invalid ${label}.`, 400);
    }
    return n;
}


/* ===== student account ===== */
// remove the password hash before anything leaves the backend
const publicStudent = ({ id, name, email, address }) => ({ id, name, email, address });

export const fetchAllStudents = async () => {
 const students = await studentModels.fetchAllStudents();
 return students;
}

const doesStudentExist = async (student) => {
    let existing;
    if(Object.hasOwn(student, "id")) {
       existing = await studentModels.findStudentById(student.id);
    } else {
       existing = await studentModels.findStudentByEmail(student.email);
    }
  if (existing.length > 0) {
    return true;

    }

 return false;
}

// Nagpapadala ng verification code bago mag-register.
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
// WBS 4.4.2 [Backend] Track scholarship application and requirement statuses
const ownApplication = async (studentId, applicationId) => {
    const sid = await mustHaveStudent(studentId);
    const rows = await studentModels.findApplicationById(toId(applicationId, 'application id'));
    if (rows.length === 0 || rows[0].student_id !== sid) {
        throw new ValidationError('Application not found.', 404);
    }
    return rows[0];
}

// WBS 4.2.1 [Backend] View available scholarships and create applications
const scholarshipOf = async (scholarshipId) => {
    const rows = await studentModels.findScholarshipForApply(scholarshipId);
    if (rows.length === 0) {
        throw new ValidationError('Scholarship does not exist!', 404);
    }
    return rows[0];
}

const isOpen = (scholarship) => new Date(scholarship.deadline + 'T23:59:59') >= new Date();

// WBS 4.4.2 [Backend] Track scholarship application and requirement statuses
export const fetchApplications = async (studentId) => {
    const id = await mustHaveStudent(studentId);
    const apps = await studentModels.fetchApplicationsByStudent(id);
    const docs = await studentModels.fetchDocumentsOf(apps.map((a) => a.id));
    return toApplications(apps, docs);
}

// apply = start a Draft. Not allowed after the deadline, and not twice.
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

// WBS 4.3.1 [Backend] Upload and manage scholarship requirements
export const uploadDocument = async (studentId, applicationId, file) => {
    const app = await ownApplication(studentId, applicationId);
    const { requirement, file_name, file_type, file_data } = file;

    if (!requirement || !file_name || !file_type || !file_data) {
        throw new ValidationError('Requirement, file name, file type and file are required!', 400);
    }
    if (!ALLOWED_TYPES.includes(file_type)) {
        throw new ValidationError('Only JPG, PNG, WEBP images or PDF files are allowed.', 400);
    }
    if (typeof file_data !== 'string' || !file_data.startsWith(`data:${file_type};base64,`)) {
        throw new ValidationError('The file is not valid.', 400);
    }
    if (file_data.length > MAX_DATA_CHARS) {
        throw new ValidationError(`The file is too big. The maximum is ${MAX_FILE_MB} MB.`, 400);
    }

    const scholarship = await scholarshipOf(app.scholarship_id);
    if (!requirementsOf(scholarship).includes(requirement)) {
        throw new ValidationError('That document is not required for this scholarship.', 400);
    }

    const existing = (await studentModels.findDocument(app.id, requirement))[0];
    if (existing && existing.status === 'Valid') {
        throw new ValidationError('This document is already validated and locked.', 409);
    }
    const needsRevision = existing && existing.status === 'Revise';
    if (app.status === 'Approved' && !needsRevision) {
        throw new ValidationError('This application is already approved.', 409);
    }

    // images are made smaller here too (the frontend already shrinks them, but the backend does not trust it)
    const saved = file_type.startsWith('image/') ? await shrinkImage(file_data, file_type) : { type: file_type, data: file_data };

    // the file is saved in the uploads folder, the database only keeps its name and who sent it
    const student = (await studentModels.findStudentById(app.student_id))[0];
    const filePath = saveUploadedFile(app.id, saved.data, saved.type);
    await studentModels.saveDocument({
        application_id: app.id,
        requirement,
        file_name: String(file_name).slice(0, 255),
        file_path: filePath,
        student_name: student.name,
        uploaded_at: Date.now(),
    });
    // the old file of this requirement is not needed anymore
    if (existing) deleteUploadedFile(existing.file_path);

    // a corrected document goes back to the SK for review
    if (needsRevision && (app.status === 'Pending' || app.status === 'Approved')) {
        await studentModels.updateApplication(app.id, { status: 'Under Review' });
    }

    return { needsRevision: Boolean(needsRevision) };
}

// submit = Draft -> Pending. Only when every document is uploaded.
// WBS 4.3.2 [Backend] Submit and resubmit scholarship applications
export const submitApplication = async (studentId, applicationId) => {
    const app = await ownApplication(studentId, applicationId);

    if (app.status !== 'Draft') {
        throw new ValidationError('Only a draft can be submitted.', 409);
    }

    const scholarship = await scholarshipOf(app.scholarship_id);
    const uploaded = await studentModels.listUploadedRequirements(app.id);
    const missing = requirementsOf(scholarship).filter((r) => !uploaded.includes(r));
    if (missing.length > 0) {
        throw new ValidationError(`Upload every document first. Missing: ${missing.join(', ')}`, 400);
    }

    return await studentModels.updateApplication(app.id, { status: 'Pending', submitted_at: Date.now() });
}

// resubmit = Rejected -> Pending. Only when at least one document was changed after the rejection.
export const resubmitApplication = async (studentId, applicationId) => {
    const app = await ownApplication(studentId, applicationId);

    if (app.status !== 'Rejected') {
        throw new ValidationError('Only a rejected application can be resubmitted.', 409);
    }

    const changed = await studentModels.countDocumentsChangedSince(app.id, app.rejected_at || 0);
    if (changed === 0) {
        throw new ValidationError('Change at least one document before you resubmit.', 400);
    }

    return await studentModels.updateApplication(app.id, { status: 'Pending', note: '' });
}


// WBS 4.4.1 [Backend] Display scholarship notifications and email updates
/* ===== in-system notifications of one student ===== */
export const fetchNotifications = async (studentId) => {
    const id = await mustHaveStudent(studentId);
    const rows = await studentModels.fetchNotifications(id);
    return rows.map((n) => ({ id: n.id, subject: n.subject, text: n.message, read: !!n.is_read, at: Number(n.created_at) }));
}

export const readNotifications = async (studentId) => {
    const id = await mustHaveStudent(studentId);
    await studentModels.markNotificationsRead(id);
    return { ok: true };
}
