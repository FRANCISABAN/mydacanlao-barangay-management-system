import express from 'express';
import * as skController from '../controllers/skController.js';

const skRoutes = express.Router();

// the SK reviews the applications of the students
// WBS 3.1.1 [Backend] Display, search, and view scholarship applications
skRoutes.get('/applications', skController.getApplications);
skRoutes.get('/applications/approved-count', skController.getApprovedCount);

export default skRoutes;