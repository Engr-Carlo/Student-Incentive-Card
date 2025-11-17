-- =====================================================
-- INCENTIVE CARD SYSTEM v4 - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Copy this entire file and run it in pgAdmin 4
-- Database: incentive_card
-- =====================================================

-- Drop all existing tables
DROP TABLE IF EXISTS admin_package_access CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- =====================================================
-- TABLE: students
-- =====================================================
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    program VARCHAR(100) NOT NULL,
    year_level VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: admins
-- =====================================================
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: packages
-- =====================================================
CREATE TABLE packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold')),
    benefits TEXT[] NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    competition_level VARCHAR(50) NOT NULL,
    created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: admin_package_access
-- =====================================================
CREATE TABLE admin_package_access (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    granted_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(admin_id, package_id)
);

-- =====================================================
-- TABLE: cards
-- =====================================================
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    issued_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Unused' CHECK (status IN ('Unused', 'Redeemed')),
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    redeemed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_packages_tier ON packages(tier);
CREATE INDEX idx_packages_is_active ON packages(is_active);
CREATE INDEX idx_packages_created_by ON packages(created_by);
CREATE INDEX idx_admin_package_access_admin_id ON admin_package_access(admin_id);
CREATE INDEX idx_admin_package_access_package_id ON admin_package_access(package_id);
CREATE INDEX idx_cards_package_id ON cards(package_id);
CREATE INDEX idx_cards_student_id ON cards(student_id);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_cards_issued_by ON cards(issued_by);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Sample Student
-- Login: sample@sample / password123
INSERT INTO students (student_id, email, password_hash, first_name, last_name, program, year_level) VALUES
('0001', 'sample@sample', '$2b$10$eqbmGivMuwV9SmY.yKN9oe/4VMm.QS7peONiRcY/be2mZkk6m1USS', 'Sam', 'Ple', 'BS Computer Engineering', '3rd Year');

-- Admin Accounts
-- Super Admin: engrcarlo@admin.com / engrcarlopassword
-- Regular Admin: admin@admin.com / admin123
INSERT INTO admins (email, password_hash, first_name, last_name, role) VALUES
('engrcarlo@admin.com', '$2b$10$D6ZH84iDocetSl0Tx/G9xuqZaoINxWkz7/j6ONNJ9Tp6sM0pS3RSi', 'Carlo', 'Engineer', 'super_admin'),
('admin@admin.com', '$2b$10$759wwL9auuflBwTlPwDonudbPxNZhu79KirulVmTadhM0E7qLXm.W', 'Admin', 'User', 'admin');

-- Sample Packages (created by Engr Carlo)
INSERT INTO packages (name, tier, benefits, event_type, competition_level, created_by) VALUES
('Chess Tournament Winner', 'Gold', ARRAY['1 Quiz Exemption', '1 Activity Exemption', '+2 Pts in Exam'], 'Chess', 'Regional', 1),
('Hackathon Participant', 'Silver', ARRAY['1 Quiz Exemption', '1 Activity Exemption'], 'Programming', 'National', 1),
('Seminar Attendance', 'Bronze', ARRAY['1 Activity Exemption'], 'Seminar', 'Local', 1);

-- Package Access for Regular Admin
-- admin@admin.com can only access Seminar Attendance package
INSERT INTO admin_package_access (admin_id, package_id, granted_by) VALUES
(2, 3, 1);

-- Sample Cards issued to Student 0001
INSERT INTO cards (package_id, student_id, status, issued_date, issued_by) VALUES
(1, '0001', 'Unused', CURRENT_DATE, 1),
(2, '0001', 'Unused', CURRENT_DATE - INTERVAL '5 days', 1),
(3, '0001', 'Redeemed', CURRENT_DATE - INTERVAL '10 days', 2);

-- =====================================================
-- VERIFICATION QUERIES (Optional - Run after schema)
-- =====================================================
-- Uncomment to verify data:

-- SELECT * FROM students;
-- SELECT * FROM admins;
-- SELECT * FROM packages;
-- SELECT * FROM admin_package_access;
-- SELECT * FROM cards;

-- =====================================================
-- LOGIN CREDENTIALS
-- =====================================================
-- STUDENT PORTAL (http://localhost:5173)
--   Email: sample@sample
--   Password: password123
--
-- ADMIN PORTAL (http://localhost:5174/login)
--   Super Admin - engrcarlo@admin.com / engrcarlopassword
--   Regular Admin - admin@admin.com / admin123
-- =====================================================
