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

