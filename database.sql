CREATE DATABASE IF NOT EXISTS `system`;
USE `system`;

-- STEP 1: student table
CREATE TABLE IF NOT EXISTS student (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(100) NOT NULL,
  email    VARCHAR(150) NOT NULL UNIQUE,
  address  VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- STEP 2: sk table
CREATE TABLE IF NOT EXISTS sk (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(100) NOT NULL,
  email    VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  position VARCHAR(100) NOT NULL DEFAULT 'SK Officer'
);

-- STEP 4: scholarships posted by the SK
CREATE TABLE IF NOT EXISTS sk_scholarship (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  sk_id        INT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT NOT NULL,
  deadline     DATE NOT NULL,
  requirements TEXT NOT NULL,
  FOREIGN KEY (sk_id) REFERENCES sk(id) ON DELETE SET NULL
);

-- STEP 6: applications
CREATE TABLE IF NOT EXISTS application (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  student_id     INT NOT NULL,
  scholarship_id INT NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'Draft',
  note           TEXT NULL,
  submitted_at   BIGINT NULL,
  rejected_at    BIGINT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_application (student_id, scholarship_id),
  FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
  FOREIGN KEY (scholarship_id) REFERENCES sk_scholarship(id) ON DELETE CASCADE
);

-- STEP 7: uploaded documents
CREATE TABLE IF NOT EXISTS application_document (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  requirement    VARCHAR(255) NOT NULL,
  file_name      VARCHAR(255) NOT NULL,
  file_path      VARCHAR(255) NOT NULL,
  student_name   VARCHAR(100) NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'Uploaded',
  note           TEXT NULL,
  uploaded_at    DATETIME NOT NULL,
  UNIQUE KEY one_file_per_requirement (application_id, requirement),
  FOREIGN KEY (application_id) REFERENCES application(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject    VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,          -- 0 = new, 1 = already opened
  created_at BIGINT NOT NULL,                        -- time in milliseconds
  FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
);