import * as skModels from '../models/skModels.js';
import ValidationError from '../utils/ValidationError.js';
import bcrypt from 'bcryptjs';
import { toApplications, requirementsOf, toId, readFileAsDataUri } from './studentServices.js';

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