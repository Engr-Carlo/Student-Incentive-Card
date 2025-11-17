-- Complete Database Schema for Incentive Card System v3
-- Package-based system where admins create reusable packages

-- Drop all existing tables
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Students table (for authentication and profile)
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

-- Packages table (reusable benefit packages created by admin)
CREATE TABLE packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold')),
    benefits TEXT[] NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    competition_level VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cards table (cards issued to students by scanning their student QR code)
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'Unused' CHECK (status IN ('Unused', 'Redeemed')),
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    redeemed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_packages_tier ON packages(tier);
CREATE INDEX idx_packages_is_active ON packages(is_active);
CREATE INDEX idx_cards_package_id ON cards(package_id);
CREATE INDEX idx_cards_student_id ON cards(student_id);
CREATE INDEX idx_cards_status ON cards(status);

-- Insert sample data for testing

-- Sample student (password: "password123" hashed with bcrypt)
INSERT INTO students (student_id, email, password_hash, first_name, last_name, program, year_level) VALUES
('0001', 'sample@sample', '$2b$10$rKZJvFQXgHZ0123456789.N7zWCJXQVKlR0oXs3oq8bxPqGHbx2G', 'Sam', 'Ple', 'BS Computer Engineering', '3rd Year');

-- Sample packages
INSERT INTO packages (name, tier, benefits, event_type, competition_level) VALUES
('Chess Tournament Winner', 'Gold', ARRAY['1 Quiz Exemption', '1 Activity Exemption', '+2 Pts in Exam'], 'Chess', 'Regional'),
('Hackathon Participant', 'Silver', ARRAY['1 Quiz Exemption', '1 Activity Exemption'], 'Programming', 'National'),
('Seminar Attendance', 'Bronze', ARRAY['1 Activity Exemption'], 'Seminar', 'Local');

-- Sample cards issued to student
INSERT INTO cards (package_id, student_id, status, issued_date) VALUES
(1, '0001', 'Unused', CURRENT_DATE),
(2, '0001', 'Unused', CURRENT_DATE - INTERVAL '5 days'),
(3, '0001', 'Redeemed', CURRENT_DATE - INTERVAL '10 days');
