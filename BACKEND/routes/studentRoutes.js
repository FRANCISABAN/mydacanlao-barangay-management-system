import express from 'express';
import * as studentController from '../controllers/studentController.js';
import { requireStudent } from '../utils/auth.js';

const studentRoutes = express.Router();

studentRoutes.get('/all', studentController.getAllStudents);
// WBS 4.1.1 [Backend] Implement student account registration
studentRoutes.post('/send-otp', studentController.sendRegistrationOTP);
studentRoutes.post('/register', studentController.createAccount);
// WBS 4.1.2 [Backend] Implement student login and logout
studentRoutes.post('/login', studentController.login);
studentRoutes.post('/logout', studentController.logout);
studentRoutes.put('/:id', requireStudent, studentController.editStudent);
studentRoutes.delete('/:id', requireStudent, studentController.deleteStudent);

// applications and uploaded documents of one student
// WBS 4.2.1 [Backend] View available scholarships and create applications
// WBS 4.4.2 [Backend] Track scholarship application and requirement statuses
studentRoutes.get('/:id/applications', requireStudent, studentController.getApplications);
// WBS 4.2.1 [Backend] View available scholarships and create applications
studentRoutes.post('/:id/applications', requireStudent, studentController.applyForScholarship);
// WBS 4.3.1 [Backend] Upload and manage scholarship requirements
studentRoutes.put('/:id/applications/:appId/documents', requireStudent, studentController.uploadDocument);
