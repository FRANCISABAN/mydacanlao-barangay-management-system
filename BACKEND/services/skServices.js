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