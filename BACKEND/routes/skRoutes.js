import express from 'express';
import * as skController from '../controllers/skController.js';

const skRoutes = express.Router();

// the SK reviews the applications of the students
// WBS 3.1.1 [Backend] Display, search, and view scholarship applications
skRoutes.get('/applications', skController.getApplications);
skRoutes.get('/applications/approved-count', skController.getApprovedCount);

// WBS 3.1.2 [Backend] Review and validate scholarship requirements
skRoutes.get('/documents/:id/file', skController.getDocumentFile);

// WBS 3.1.2 [Backend] Review and validate scholarship requirements
// WBS 3.1.3 [Backend] Manage scholarship requirement resubmissions
skRoutes.put('/applications/:appId/documents', skController.reviewDocument);

export default skRoutes;