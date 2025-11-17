-- Complete Database Schema for Incentive Card System
-- Drop all existing tables
DROP TABLE IF EXISTS proof_submissions CASCADE;
DROP TABLE IF EXISTS redemption_requests CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
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

-- Cards table (linked to students)
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    event VARCHAR(200) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold')),
    benefits TEXT[] NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Unused' CHECK (status IN ('Unused', 'Redeemed')),
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    redeemed_date DATE,
    qr_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Redemption Requests table (submitted by admin on behalf of student)
CREATE TABLE redemption_requests (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    course VARCHAR(100) NOT NULL,
    benefit VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Denied')),
    submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    processed_by VARCHAR(100),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proof Submissions table (submitted by admin)
CREATE TABLE proof_submissions (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    event_name VARCHAR(200) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    files TEXT[] NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Denied')),
    submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    processed_by VARCHAR(100),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_cards_student_id ON cards(student_id);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_redemption_requests_student_id ON redemption_requests(student_id);
CREATE INDEX idx_redemption_requests_status ON redemption_requests(status);
CREATE INDEX idx_proof_submissions_student_id ON proof_submissions(student_id);
CREATE INDEX idx_proof_submissions_status ON proof_submissions(status);

-- Insert sample student account (password: "password123" - you should hash this in production)
INSERT INTO students (student_id, email, password_hash, first_name, last_name, program, year_level) VALUES
('2021-12345', 'juan.delacruz@university.edu', '$2b$10$rKZJvFQXgHZ0123456789O', 'Juan', 'Dela Cruz', 'BS Computer Engineering', '3rd Year'),
('2021-54321', 'maria.santos@university.edu', '$2b$10$rKZJvFQXgHZ0123456789O', 'Maria', 'Santos', 'BS Computer Science', '2nd Year');

-- Insert sample cards
INSERT INTO cards (student_id, event, tier, benefits, status, issued_date, qr_code) VALUES
('2021-12345', 'Programming Competition 2024', 'Gold', ARRAY['1 Quiz Exemption', '1 Activity Exemption', '+2 Pts in Exam'], 'Unused', '2024-11-10', 'qr-1-2024-11-10'),
('2021-12345', 'Hackathon Winner', 'Silver', ARRAY['1 Quiz Exemption', '1 Activity Exemption'], 'Unused', '2024-10-15', 'qr-2-2024-10-15'),
('2021-12345', 'Research Presentation', 'Bronze', ARRAY['1 Activity Exemption'], 'Redeemed', '2024-09-20', 'qr-3-2024-09-20');

-- Update redeemed card
UPDATE cards SET redeemed_date = '2024-10-01' WHERE id = 3;

-- Insert sample redemption request
INSERT INTO redemption_requests (card_id, student_id, course, benefit, status, submitted_date) VALUES
(3, '2021-12345', 'ECE101', '1 Activity Exemption', 'Approved', '2024-10-01');
