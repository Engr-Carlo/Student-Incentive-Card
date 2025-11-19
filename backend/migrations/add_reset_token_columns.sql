-- Add reset token columns to students table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='students' AND column_name='reset_token') THEN
        ALTER TABLE students ADD COLUMN reset_token VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='students' AND column_name='reset_token_created_at') THEN
        ALTER TABLE students ADD COLUMN reset_token_created_at TIMESTAMP;
    END IF;
END $$;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_students_reset_token ON students(reset_token);
