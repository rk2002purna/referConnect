-- SQL script to add yopmail.com to the companies list
-- This script works for both PostgreSQL (main app) and SQLite (seed data)

-- For PostgreSQL companies table (main application)
-- Insert yopmail.com into the companies table
INSERT INTO companies (name, domain, industry, size, description, website, is_verified) 
VALUES (
    'YOPmail', 
    'yopmail.com', 
    'Email Services', 
    '1-100', 
    'Temporary email service provider for testing and privacy', 
    'https://yopmail.com', 
    TRUE
) 
ON CONFLICT (domain) DO UPDATE SET
    name = EXCLUDED.name,
    industry = EXCLUDED.industry,
    size = EXCLUDED.size,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    is_verified = EXCLUDED.is_verified,
    updated_at = CURRENT_TIMESTAMP;

-- For SQLite verified_companies table (seed data)
-- Insert yopmail.com into the verified_companies table
INSERT OR REPLACE INTO verified_companies (name, domain, industry, size, verified) 
VALUES (
    'YOPmail', 
    'yopmail.com', 
    'Email Services', 
    '1-100', 
    1
);

-- Verify the insertion
SELECT 'PostgreSQL companies table:' as table_name, id, name, domain, industry, size, is_verified 
FROM companies 
WHERE domain = 'yopmail.com'
UNION ALL
SELECT 'SQLite verified_companies table:' as table_name, id, name, domain, industry, size, verified 
FROM verified_companies 
WHERE domain = 'yopmail.com';
