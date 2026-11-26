import pool from '../config/db.js';
// includes the password hash, only used by the login check
// WBS 3.1.6 [Backend] Implement SK role-based access permissions
export const findSkByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM sk WHERE email = ?', [email]);
  return rows;
};

/* ===== applications of the students (the SK reviews them) ===== */
// the file itself is in the uploads folder, the database only has its name (file_path).
const DOC_COLS = "id, application_id, requirement, file_name, file_path, student_name, status, note, UNIX_TIMESTAMP(uploaded_at) * 1000 AS uploaded_at";

// WBS 3.1.1 [Backend] Display, search, and view scholarship applications
export const fetchAllApplications = async () => {
  const [rows] = await pool.query(
    `SELECT a.id, a.student_id, s.email AS uid, a.scholarship_id, a.status, a.note, a.submitted_at, a.rejected_at
     FROM application a JOIN student s ON s.id = a.student_id ORDER BY a.id`);
  return rows;
};

export const fetchDocumentsOf = async (applicationIds) => {
  if (applicationIds.length === 0) return [];
  const [rows] = await pool.query(`SELECT ${DOC_COLS} FROM application_document WHERE application_id IN (?)`, [applicationIds]);
  return rows;
};

export const countApprovedApplications = async () => {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM application WHERE status = 'Approved'");
  return rows[0].total;
};

// the name of the saved file, only used when the SK opens a PDF
// WBS 3.1.2 [Backend] Review and validate scholarship requirements
export const findDocumentFile = async (id) => {
  const [rows] = await pool.query('SELECT file_name, file_path FROM application_document WHERE id = ?', [id]);
  return rows;
};

// WBS 3.1.2 [Backend] Review and validate scholarship requirements
// WBS 3.1.3 [Backend] Manage scholarship requirement resubmissions
export const updateDocumentReview = async (id, status, note) => {
  const [result] = await pool.query('UPDATE application_document SET status = ?, note = ? WHERE id = ?', [status, note, id]);
  return result.affectedRows;
};

// only these columns can be changed
// WBS 3.1.4 [Backend] Manage scholarship application statuses and decisions
export const updateApplication = async (id, changes) => {
  const allowed = ['status', 'note', 'rejected_at'];
  const keys = Object.keys(changes).filter((k) => allowed.includes(k));
  if (keys.length === 0) return 0;

  const [result] = await pool.query(
    `UPDATE application SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
    [...keys.map((k) => changes[k]), id]
  );
  return result.affectedRows;
};

