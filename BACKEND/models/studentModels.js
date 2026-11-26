import pool from '../config/db.js';

// columns that are safe to send to the frontend (never the password hash)
const PUBLIC = 'id, name, email, address';

export const fetchAllStudents = async () => {
 const [rows] = await pool.query(`SELECT ${PUBLIC} FROM student`);
 return rows;
};

export const findStudentById = async (id) => {
  const [rows] = await pool.query(`SELECT ${PUBLIC} FROM student WHERE id = ?`, [id]);
  return rows;
};

// includes the password hash, only used by the login check
// WBS 4.1.1 [Backend] Implement student account registration
// WBS 4.1.2 [Backend] Implement student login and logout
export const findStudentByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM student WHERE email = ?', [email]);
  return rows;
};

//insert
// WBS 4.1.1 [Backend] Implement student account registration
export const insertStudent = async (student) => {
  const [result] = await pool.query(
    "INSERT INTO student (name, email, address, password) VALUES (?, ?, ?, ?)",
    [student.name, student.email, student.address, student.password]
  );
  return result.insertId;
}

//update
export const update = async (student) => {
  const [result] = await pool.query(
    "UPDATE student SET name = ?, address = ? WHERE id = ?",
    [student.name, student.address, student.id]
  );
  return result.affectedRows;
};

//delete
export const remove = async (id) => {
  const [result] = await pool.query (
    "DELETE FROM student WHERE id = ?",[id]
  );
  return result.affectedRows;
}


/* ===== the student's applications and uploaded documents ===== */
// the file itself is in the uploads folder, the database only has its name (file_path).
const DOC_COLS = "id, application_id, requirement, file_name, file_path, student_name, status, note, UNIX_TIMESTAMP(uploaded_at) * 1000 AS uploaded_at";

// WBS 4.2.1 [Backend] View available scholarships and create applications
export const findScholarshipForApply = async (id) => {
  const [rows] = await pool.query("SELECT id, title, DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline, requirements FROM sk_scholarship WHERE id = ?", [id]);
  return rows;
};

export const findApplicationById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM application WHERE id = ?', [id]);
  return rows;
};

export const findApplicationOfStudent = async (studentId, scholarshipId) => {
  const [rows] = await pool.query('SELECT id FROM application WHERE student_id = ? AND scholarship_id = ?', [studentId, scholarshipId]);
  return rows;
};

// WBS 4.2.1 [Backend] View available scholarships and create applications
export const insertApplication = async (studentId, scholarshipId) => {
  const [result] = await pool.query(
    "INSERT INTO application (student_id, scholarship_id, status) VALUES (?, ?, 'Draft')",
    [studentId, scholarshipId]
  );
  return result.insertId;
};

// only these columns can be changed
// WBS 4.3.2 [Backend] Submit and resubmit scholarship applications
export const updateApplication = async (id, changes) => {
  const allowed = ['status', 'note', 'submitted_at'];
  const keys = Object.keys(changes).filter((k) => allowed.includes(k));
  if (keys.length === 0) return 0;

  const [result] = await pool.query(
    `UPDATE application SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
    [...keys.map((k) => changes[k]), id]
  );
  return result.affectedRows;
};

// WBS 4.3.1 [Backend] Upload and manage scholarship requirements
export const findDocument = async (applicationId, requirement) => {
  const [rows] = await pool.query('SELECT id, status, file_path FROM application_document WHERE application_id = ? AND requirement = ?', [applicationId, requirement]);
  return rows;
};

export const listUploadedRequirements = async (applicationId) => {
  const [rows] = await pool.query('SELECT requirement FROM application_document WHERE application_id = ?', [applicationId]);
  return rows.map((r) => r.requirement);
};

export const countDocumentsChangedSince = async (applicationId, time) => {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM application_document WHERE application_id = ? AND UNIX_TIMESTAMP(uploaded_at) >= FLOOR(? / 1000)', [applicationId, time]);
  return rows[0].total;
};

// a new file, or a replacement of the old file for the same requirement (it goes back to "Uploaded")
export const saveDocument = async (doc) => {
  await pool.query(
    `INSERT INTO application_document (application_id, requirement, file_name, file_path, student_name, status, note, uploaded_at)
     VALUES (?, ?, ?, ?, ?, 'Uploaded', '', FROM_UNIXTIME(? / 1000))
     ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), file_path = VALUES(file_path), student_name = VALUES(student_name),
                             status = 'Uploaded', note = '', uploaded_at = VALUES(uploaded_at)`,
    [doc.application_id, doc.requirement, doc.file_name, doc.file_path, doc.student_name, doc.uploaded_at]
  );
};

// WBS 4.4.1 [Backend] Display scholarship notifications and email updates
// ---------- in-system notifications ----------
export const insertNotification = async (studentId, subject, message) => {
  await pool.query(
    'INSERT INTO notification (student_id, subject, message, created_at) VALUES (?, ?, ?, ?)',
    [studentId, subject, message, Date.now()]
  );
};

export const fetchNotifications = async (studentId) => {
  const [rows] = await pool.query(
    'SELECT id, subject, message, is_read, created_at FROM notification WHERE student_id = ? ORDER BY id DESC LIMIT 100',
    [studentId]
  );
  return rows;
};

export const markNotificationsRead = async (studentId) => {
  await pool.query('UPDATE notification SET is_read = 1 WHERE student_id = ?', [studentId]);
};
