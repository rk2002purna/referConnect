-- Add phone_country_code column to users table
-- Run this SQL command on your production database

-- Check if column already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'phone_country_code'
    ) THEN
        -- Add the column
        ALTER TABLE users 
        ADD COLUMN phone_country_code VARCHAR(10) DEFAULT '+91';
        
        RAISE NOTICE 'phone_country_code column added successfully';
    ELSE
        RAISE NOTICE 'phone_country_code column already exists';
    END IF;
END $$;
