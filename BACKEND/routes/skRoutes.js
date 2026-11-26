import express from 'express';
import * as skController from '../controllers/skController.js';

const skRoutes = express.Router();
// SK accounts are inserted in the database (see database.sql), so there is only a login.
// WBS 3.1.6 [Backend] Implement SK role-based access permissions
skRoutes.post('/login', skController.login);

// scholarships belong to the SK
// WBS 3.1.7 [Backend] Create and publish scholarship programs
skRoutes.get('/scholarship/all', skController.getAllScholarships);
skRoutes.post('/scholarship', skController.createScholarship);
skRoutes.put('/scholarship/:id', skController.updateScholarship);
skRoutes.delete('/scholarship/:id', skController.deleteScholarship);

// WBS 3.1.1 [Backend] Display, search, and view scholarship applications
skRoutes.get('/applications', skController.getApplications);
skRoutes.get('/applications/approved-count', skController.getApprovedCount);

// WBS 3.1.2 [Backend] Review and validate scholarship requirements
skRoutes.get('/documents/:id/file', skController.getDocumentFile);

// WBS 3.1.2 [Backend] Review and validate scholarship requirements
// WBS 3.1.3 [Backend] Manage scholarship requirement resubmissions
skRoutes.put('/applications/:appId/documents', skController.reviewDocument);

// WBS 3.1.3 [Backend] Manage scholarship requirement resubmissions
// WBS 3.1.4 [Backend] Manage scholarship application statuses and decisions
skRoutes.put('/applications/:appId/reject', skController.rejectApplication);

// WBS 3.1.4 [Backend] Manage scholarship application statuses and decisions
skRoutes.put('/applications/:appId/approve', skController.approveApplication);

export default skRoutes;