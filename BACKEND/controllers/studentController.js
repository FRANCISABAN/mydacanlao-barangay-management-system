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

// WBS 4.1.2 [Backend] Implement student login and logout — implementation in later step




//delete



/* ===== applications and uploaded documents of the student ===== */
const fail = (res, e) => {
    console.log(e);
    res.status(e.statusCode || 500).json({
        success: false,
        error: e.message || "Internal Server Error"
    });
}

// WBS 4.2.1 [Backend] View available scholarships and create applications
// WBS 4.4.2 [Backend] Track scholarship application and requirement statuses — implementation in later step


// WBS 4.2.1 [Backend] View available scholarships and create applications — implementation in later step


// WBS 4.3.1 [Backend] Upload and manage scholarship requirements — implementation in later step


// WBS 4.3.2 [Backend] Submit and resubmit scholarship applications — implementation in later step


// WBS 4.3.2 [Backend] Submit and resubmit scholarship applications — implementation in later step


// WBS 4.1.2 [Backend] Implement student login and logout
// Logout: the token of the student stops working.


// WBS 4.4.1 [Backend] Display scholarship notifications and email updates — implementation in later step



