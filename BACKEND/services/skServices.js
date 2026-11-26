import * as skModels from '../models/skModels.js';
import ValidationError from '../utils/ValidationError.js';
import bcrypt from 'bcryptjs';
import { toApplications, requirementsOf, toId, readFileAsDataUri } from './studentServices.js';


const doesSkExist = async (email) => {
const existing = await skModels.findSkByEmail(email);
if (existing.length > 0) {
    return {result: true, sk: existing[0]};
}
return {result: false, sk: undefined};
};

// SK accounts are NOT created through the website. They are inserted in the database (see database.sql).
// WBS 3.1.6 [Backend] Implement SK role-based access permissions
export const login = async (sk) => {
    if (!sk.email || !sk.password) {
        throw new ValidationError('Email and password are required!', 400);
    }

    const existing = await doesSkExist(sk.email);
    if (!existing.result) {
        throw new ValidationError('Wrong email or password.', 401);
    }

    const isCorrectPassword = await bcrypt.compare(sk.password, existing.sk.password);

    if (!isCorrectPassword) {
        throw new ValidationError('Wrong email or password.', 401);
    }

    const { id, name, email, position } = existing.sk;
    return { id, name, email, position };
}

// WBS 3.1.7 [Backend] Create and publish scholarship programs
/* ===== scholarships (posted and managed by the SK) ===== */
// the frontend sends / receives { title, desc, deadline, reqs: [..] }
// the database saves { title, description, deadline, requirements: '["..",".."]' }
const toApi = (row) => {
    let reqs = [];
    try { reqs = JSON.parse(row.requirements) || []; } catch { reqs = []; }
    return { id: row.id, sk_id: row.sk_id, title: row.title, desc: row.description, deadline: row.deadline, reqs };
}

const cleanScholarship = (scholarship) => {
    const reqs = Array.isArray(scholarship.reqs) ? scholarship.reqs.map((x) => String(x).trim()).filter(Boolean) : [];

    if (!scholarship.title || !scholarship.desc || !scholarship.deadline || reqs.length === 0) {
        throw new ValidationError('Title, description, deadline and at least one requirement are required!', 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scholarship.deadline)) {
        throw new ValidationError('Deadline must look like 2026-12-15', 400);
    }

    return {
        title: scholarship.title.trim(),
        description: scholarship.desc.trim(),
        deadline: scholarship.deadline,
        requirements: JSON.stringify(reqs)
    };
}

export const fetchAllScholarships = async () => {
 const scholarships = await skModels.fetchAllScholarships();
 return scholarships.map(toApi);
}

const doesScholarshipExist = async (scholarship) => {
    let existing;
    if(Object.hasOwn(scholarship, "id")) {
       existing = await skModels.findScholarshipById(scholarship.id);
    } else {
       existing = await skModels.findScholarshipByTitleAndDeadline(scholarship);
    }
  if (existing.length > 0) {
    return true;

    }

 return false;
}

export const createScholarship = async (scholarship) => {
    const cleaned = cleanScholarship(scholarship);

    const existing = await doesScholarshipExist(cleaned);
    if (existing) {
        throw new ValidationError('Scholarship already exists', 409);
    }

 const scholarshipId = await skModels.insertScholarship({ sk_id: scholarship.sk_id || null, ...cleaned });
 return scholarshipId;
}

export const updateScholarship = async (scholarship) => {
    const cleaned = cleanScholarship(scholarship);

    const existing = await doesScholarshipExist({ id: scholarship.id });
    if (!existing) {
        throw new ValidationError('Scholarship does not exist!', 404);
    }

    const updatedRows = await skModels.updateScholarship({ id: scholarship.id, ...cleaned });
    return updatedRows;
}

export const deleteScholarship = async (id) => {
    const existing = await doesScholarshipExist({id});
    if (!existing) {
        throw new ValidationError('Scholarship does not exist!', 404);
    }
    const deletedScholarship = await skModels.removeScholarship(id);
    return deletedScholarship;
}

/* ===== reviewing the applications of the students ===== */
// WBS 3.1.1 [Backend] Display, search, and view scholarship applications
export const fetchApplications = async () => {
    const apps = await skModels.fetchAllApplications();
    const docs = await skModels.fetchDocumentsOf(apps.map((a) => a.id));
    return toApplications(apps, docs);
}

export const countApproved = async () => {
    return await skModels.countApprovedApplications();
}

// the SK can only review an application that the student already submitted
const submittedApplication = async (applicationId) => {
    const rows = await skModels.findApplicationById(toId(applicationId, 'application id'));
    if (rows.length === 0) {
        throw new ValidationError('Application not found.', 404);
    }
    if (rows[0].status === 'Draft') {
        throw new ValidationError('The student has not submitted this application yet.', 409);
    }
    return rows[0];
}

// WBS 3.1.2 [Backend] Review and validate scholarship requirements
export const fetchDocumentFile = async (documentId) => {
    const rows = await skModels.findDocumentFile(toId(documentId, 'document id'));
    const file_data = rows.length > 0 ? readFileAsDataUri(rows[0].file_path) : '';
    if (!file_data) {
        throw new ValidationError('File not found.', 404);
    }
    return { file_name: rows[0].file_name, file_data };
}

// WBS 3.1.2 [Backend] Review and validate scholarship requirements
// WBS 3.1.3 [Backend] Manage scholarship requirement resubmissions
// status is "Valid" or "Revise" (a comment is required for Revise)
export const reviewDocument = async (applicationId, review) => {
    const app = await submittedApplication(applicationId);
    const note = String(review.note || '').trim();

    if (!['Valid', 'Revise'].includes(review.status)) {
        throw new ValidationError('Status must be Valid or Revise.', 400);
    }
    if (review.status === 'Revise' && !note) {
        throw new ValidationError('Write a comment first so the student knows why.', 400);
    }

    const doc = (await skModels.findDocument(app.id, review.requirement))[0];
    if (!doc) {
        throw new ValidationError('The student has not uploaded that document.', 404);
    }

    await skModels.updateDocumentReview(doc.id, review.status, review.status === 'Valid' ? '' : note);

    if (app.status === 'Pending') {
        await skModels.updateApplication(app.id, { status: 'Under Review' });
    }
    return true;
}

// WBS 3.1.3 [Backend] Manage scholarship requirement resubmissions
// WBS 3.1.4 [Backend] Manage scholarship application statuses and decisions
export const rejectApplication = async (applicationId, noteText) => {
    const app = await submittedApplication(applicationId);
    const note = String(noteText || '').trim();

    if (!note) {
        throw new ValidationError('Write a comment first so the student knows why.', 400);
    }

    return await skModels.updateApplication(app.id, { status: 'Rejected', note, rejected_at: Date.now() });
}

// WBS 3.1.4 [Backend] Manage scholarship application statuses and decisions
// approve = every document is uploaded and none needs revision
export const approveApplication = async (applicationId) => {
    const app = await submittedApplication(applicationId);

    const scholarship = (await skModels.findScholarshipById(app.scholarship_id))[0];
    if (!scholarship) {
        throw new ValidationError('Scholarship does not exist!', 404);
    }

    const docs = await skModels.fetchDocumentsOf([app.id]);
    const notReady = requirementsOf({ requirements: scholarship.requirements }).some((r) => {
        const doc = docs.find((d) => d.requirement === r);
        return !doc || doc.status === 'Revise';
    });
    if (notReady) {
        throw new ValidationError('Cannot approve yet. A document is missing or needs revision.', 400);
    }

    return await skModels.updateApplication(app.id, { status: 'Approved' });
}