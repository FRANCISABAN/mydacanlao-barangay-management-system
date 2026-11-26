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

// WBS 3.1.2 [Backend] Review and validate scholarship requirements
export const getDocumentFile = async (req, res) => {
    try {
        const file = await skServices.fetchDocumentFile(req.params.id);
        res.status(200).json({ success: true, message: file });
    } catch (e) {
        fail(res, e);
    }
}

// WBS 3.1.2 [Backend] Review and validate scholarship requirements
// WBS 3.1.3 [Backend] Manage scholarship requirement resubmissions
export const reviewDocument = async (req, res) => {
    const { requirement, status, note } = req.body;

    try {
        const result = await skServices.reviewDocument(req.params.appId, { requirement, status, note });
        res.status(200).json({ success: true, message: result });
    } catch (e) {
        fail(res, e);
    }
}