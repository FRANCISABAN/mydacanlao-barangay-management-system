import express from 'express';
import * as studentController from '../controllers/studentController.js';
import { requireStudent } from '../utils/auth.js';

const studentRoutes = express.Router();

studentRoutes.get('/all', studentController.getAllStudents);
// WBS 4.1.1 [Backend] Implement student account registration
studentRoutes.post('/send-otp', studentController.sendRegistrationOTP);
studentRoutes.post('/register', studentController.createAccount);
// WBS 4.1.2 [Backend] Implement student login and logout — implementation in later step

// applications and uploaded documents of one student
// WBS 4.2.1 [Backend] View available scholarships and create applications
// WBS 4.4.2 [Backend] Track scholarship application and requirement statuses
// WBS 4.2.1 [Backend] View available scholarships and create applications
// WBS 4.3.1 [Backend] Upload and manage scholarship requirements
// WBS 4.3.2 [Backend] Submit and resubmit scholarship applications — implementation in later step

// in-system notifications of the student
// WBS 4.4.1 [Backend] Display scholarship notifications and email updates — implementation in later step

export default studentRoutes;
