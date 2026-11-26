import express from 'express';
import * as studentController from '../controllers/studentController.js';
import { requireStudent } from '../utils/auth.js';

const studentRoutes = express.Router();

studentRoutes.get('/all', studentController.getAllStudents);
// WBS 4.1.1 [Backend] Implement student account registration
studentRoutes.post('/send-otp', studentController.sendRegistrationOTP);
studentRoutes.post('/register', studentController.createAccount);
