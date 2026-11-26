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


//delete



/* ===== the student's applications and uploaded documents ===== */
// the file itself is in the uploads folder, the database only has its name (file_path).
const DOC_COLS = "id, application_id, requirement, file_name, file_path, student_name, status, note, UNIX_TIMESTAMP(uploaded_at) * 1000 AS uploaded_at";

// WBS 4.4.2 [Backend] Track scholarship application and requirement statuses — implementation in later step




// WBS 4.2.1 [Backend] View available scholarships and create applications
export const findScholarshipForApply = async (id) => {
  const [rows] = await pool.query("SELECT id, title, DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline, requirements FROM sk_scholarship WHERE id = ?", [id]);
  return rows;
};

export const findApplicationById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM application WHERE id = ?', [id]);
  return rows;
};



// WBS 4.2.1 [Backend] View available scholarships and create applications — implementation in later step


// only these columns can be changed
// WBS 4.3.2 [Backend] Submit and resubmit scholarship applications — implementation in later step


// WBS 4.3.1 [Backend] Upload and manage scholarship requirements — implementation in later step






// a new file, or a replacement of the old file for the same requirement (it goes back to "Uploaded")


// WBS 4.4.1 [Backend] Display scholarship notifications and email updates
// ---------- in-system notifications ----------
export const insertNotification = async (studentId, subject, message) => {
  await pool.query(
    'INSERT INTO notification (student_id, subject, message, created_at) VALUES (?, ?, ?, ?)',
    [studentId, subject, message, Date.now()]
  );
};




