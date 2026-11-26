import * as skServices from '../services/skServices.js';

// WBS 3.1.6 [Backend] Implement SK role-based access permissions
export const login = async (req, res) => {
    const {email, password} = req.body;
    const sk = {email, password};

    try{
        const result = await skServices.login(sk);
        res.status(200).json({
            success: true,
            message: result
        });
    }catch(e){
        res.status(e.statusCode || 500).json({
            error: e.message || "Internal Server Error"
        });
    }
}
// WBS 3.1.7 [Backend] Create and publish scholarship programs
/* ===== scholarships (posted and managed by the SK) ===== */
export const getAllScholarships = async (req, res) => {
    try{
        const scholarships = await skServices.fetchAllScholarships();
        res.status(200).json(scholarships);
    }catch(e){
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: e.message || "Internal Server Error"
        });
    }
}

export const createScholarship = async (req, res) => {
    const {sk_id, title, desc, deadline, reqs} = req.body;
    const scholarship = {sk_id, title, desc, deadline, reqs};

    try{
        const scholarshipId = await skServices.createScholarship(scholarship);
        res.status(200).json({
            success: true,
            message: scholarshipId
        });
    }catch(e){
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: e.message
        });
    }
}

export const updateScholarship = async (req, res) => {
    const {title, desc, deadline, reqs} = req.body;
    const { id } = req.params;
    const scholarship = {id, title, desc, deadline, reqs};

    try {
        const updatedScholarship = await skServices.updateScholarship(scholarship);
        res.status(200).json({
            success: true,
            message: updatedScholarship
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
export const deleteScholarship = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedScholarship = await skServices.deleteScholarship(parseInt(id));
        res.status(200).json({
            success: true,
            message: deletedScholarship
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            success: false,
            error: e.message
        });
    }
}

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

// WBS 3.1.3 [Backend] Manage scholarship requirement resubmissions
// WBS 3.1.4 [Backend] Manage scholarship application statuses and decisions
export const rejectApplication = async (req, res) => {
    try {
        const result = await skServices.rejectApplication(req.params.appId, req.body.note);
        res.status(200).json({ success: true, message: result });
    } catch (e) {
        fail(res, e);
    }
}

// WBS 3.1.4 [Backend] Manage scholarship application statuses and decisions
export const approveApplication = async (req, res) => {
    try {
        const result = await skServices.approveApplication(req.params.appId);
        res.status(200).json({ success: true, message: result });
    } catch (e) {
        fail(res, e);
    }
}