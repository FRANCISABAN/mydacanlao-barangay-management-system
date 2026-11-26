import * as studentServices from '../services/studentServices.js';
import { startSession, endSession, tokenOf } from '../utils/auth.js';

export const getAllStudents = async (req, res) => {
    try{
        const students = await studentServices.fetchAllStudents();
        res.status(200).json(students);
    }catch(e){
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: e.message || "Internal Server Error"
        });
    }
}

// Magpadala ng OTP sa Gmail ng bagong student.
// WBS 4.1.1 [Backend] Implement student account registration
export const sendRegistrationOTP = async (req, res) => {
    try {
        const result = await studentServices.requestRegistrationOTP(req.body.email);
        res.status(200).json({ success: true, message: result.message });
    } catch (e) {
        res.status(e.statusCode || 500).json({ error: e.message || 'Internal Server Error' });
    }
}

// WBS 4.1.1 [Backend] Implement student account registration
export const createAccount = async (req, res) => {
    const {name, email, address, password, otp} = req.body;
    const student = {name, email, address, password, otp};

    try{
        const result = await studentServices.createAccount(student);
        res.status(200).json({
            success: true,
            message: result,
            token: startSession(result.id)
        });
    }catch(e){
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: e.message || "Internal Server Error"
        });
    }
}

// WBS 4.1.2 [Backend] Implement student login and logout
export const login = async (req, res) => {
    const {email, password} = req.body;
    const student = {email, password};

    try{
        const result = await studentServices.login(student);
        res.status(200).json({
            success: true,
            message: result,
            token: startSession(result.id)
        });
    }catch(e){
        res.status(e.statusCode || 500).json({
            error: e.message || "Internal Server Error"
        });
    }
}

export const editStudent = async (req, res) => {
    const {name, address} = req.body;
    const { id } = req.params;
    const student = {id, name, address};

    try {
        const updatedStudent = await studentServices.updateStudent(student);
        res.status(200).json({
            success: true,
            message: updatedStudent
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            success: false,
            error: e.message
        });
    }
}

//delete
export const deleteStudent = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedStudent = await studentServices.deleteStudent(parseInt(id));
        res.status(200).json({
            success: true,
            message: deletedStudent
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            success: false,
            error: e.message
        });
    }
}


/* ===== applications and uploaded documents of the student ===== */
const fail = (res, e) => {
    console.log(e);
    res.status(e.statusCode || 500).json({
        success: false,
        error: e.message || "Internal Server Error"
    });
}

// WBS 4.2.1 [Backend] View available scholarships and create applications
// WBS 4.4.2 [Backend] Track scholarship application and requirement statuses
export const getApplications = async (req, res) => {
    try {
        const applications = await studentServices.fetchApplications(req.params.id);
        res.status(200).json(applications);
    } catch (e) {
        fail(res, e);
    }
}

// WBS 4.2.1 [Backend] View available scholarships and create applications
export const applyForScholarship = async (req, res) => {
    try {
        const applicationId = await studentServices.applyForScholarship(req.params.id, req.body.scholarship_id);
        res.status(200).json({ success: true, message: applicationId });
    } catch (e) {
        fail(res, e);
    }
}

// WBS 4.1.2 [Backend] Implement student login and logout
// Logout: the token of the student stops working.
export const logout = (req, res) => {
    endSession(tokenOf(req));
    res.status(200).json({ success: true });
}

