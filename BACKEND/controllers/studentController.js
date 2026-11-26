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

