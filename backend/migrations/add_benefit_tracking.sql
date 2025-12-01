-- Add columns to track individual benefit redemptions
DO $$ 
BEGIN
    -- Add column to track which benefits have been redeemed (array of benefit names)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cards' AND column_name='redeemed_benefits') THEN
        ALTER TABLE cards ADD COLUMN redeemed_benefits TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added redeemed_benefits column';
    END IF;
    
    -- Add column to track if ALL benefits have been used
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cards' AND column_name='all_benefits_used') THEN
        ALTER TABLE cards ADD COLUMN all_benefits_used BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added all_benefits_used column';
    END IF;
END $$;

-- Update existing cards to have empty redeemed_benefits array
UPDATE cards SET redeemed_benefits = '{}' WHERE redeemed_benefits IS NULL;
