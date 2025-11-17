-- Incentive Card System Database Schema
-- PostgreSQL

-- Drop tables if they exist
DROP TABLE IF EXISTS proof_submissions CASCADE;
DROP TABLE IF EXISTS redemption_requests CASCADE;
DROP TABLE IF EXISTS cards CASCADE;

-- Cards table
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    event VARCHAR(200) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold')),
    benefits TEXT[] NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Unused' CHECK (status IN ('Unused', 'Redeemed')),
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    redeemed_date DATE,
    qr_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Redemption Requests table
CREATE TABLE redemption_requests (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    course VARCHAR(100) NOT NULL,
    benefit VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Denied')),
    submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proof Submissions table
CREATE TABLE proof_submissions (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    files TEXT[] NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Denied')),
    submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_cards_student_id ON cards(student_id);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_redemption_requests_status ON redemption_requests(status);
CREATE INDEX idx_proof_submissions_status ON proof_submissions(status);

-- Insert sample data
INSERT INTO cards (student_id, student_name, event, tier, benefits, status, issued_date, qr_code) VALUES
('2021-12345', 'Juan Dela Cruz', 'Programming Competition 2024', 'Gold', ARRAY['1 Quiz Exemption', '1 Activity Exemption', '+2 Pts in Exam'], 'Unused', '2024-11-10', 'qr-1-2024-11-10'),
('2021-12345', 'Juan Dela Cruz', 'Hackathon Winner', 'Silver', ARRAY['1 Quiz Exemption', '1 Activity Exemption'], 'Unused', '2024-10-15', 'qr-2-2024-10-15'),
('2021-12345', 'Juan Dela Cruz', 'Research Presentation', 'Bronze', ARRAY['1 Activity Exemption'], 'Redeemed', '2024-09-20', 'qr-3-2024-09-20');

-- Update redeemed card
UPDATE cards SET redeemed_date = '2024-10-01' WHERE id = 3;

-- Insert sample redemption request
INSERT INTO redemption_requests (card_id, student_id, student_name, course, benefit, status, submitted_date) VALUES
(3, '2021-12345', 'Juan Dela Cruz', 'ECE101', '1 Activity Exemption', 'Approved', '2024-10-01');
