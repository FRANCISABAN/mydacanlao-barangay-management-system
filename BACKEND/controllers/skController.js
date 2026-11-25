import * as skServices from '../services/skServices.js';

/* ===== reviewing the applications of the students ===== */
const fail = (res, e) => {
    console.log(e);
    res.status(e.statusCode || 500).json({
        success: false,
        error: e.message || "Internal Server Error"
    });
}

// WBS 3.1.1 [Backend] Display, search, and view scholarship applications
export const getApplications = async (req, res) => {
    try {
        const applications = await skServices.fetchApplications();
        res.status(200).json(applications);
    } catch (e) {
        fail(res, e);
    }
}

export const getApprovedCount = async (req, res) => {
    try {
        const total = await skServices.countApproved();
        res.status(200).json({ success: true, message: total });
    } catch (e) {
        fail(res, e);
    }
}