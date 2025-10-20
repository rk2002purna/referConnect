-- Seed script to populate verified_companies table
-- Run this script to add companies to your database

-- Create verified_companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS verified_companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    industry VARCHAR(100),
    size VARCHAR(50),
    verified BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert companies data
INSERT OR REPLACE INTO verified_companies (id, name, domain, industry, size, verified) VALUES
(1, 'Google', 'google.com', 'Technology', '10,000+', 1),
(2, 'Microsoft', 'microsoft.com', 'Technology', '10,000+', 1),
(3, 'Apple', 'apple.com', 'Technology', '10,000+', 1),
(4, 'Amazon', 'amazon.com', 'E-commerce', '10,000+', 1),
(5, 'Meta', 'meta.com', 'Technology', '10,000+', 1),
(6, 'Netflix', 'netflix.com', 'Entertainment', '1,000-10,000', 1),
(7, 'Tesla', 'tesla.com', 'Automotive', '1,000-10,000', 1),
(8, 'Uber', 'uber.com', 'Transportation', '1,000-10,000', 1),
(9, 'Airbnb', 'airbnb.com', 'Hospitality', '1,000-10,000', 1),
(10, 'Stripe', 'stripe.com', 'Fintech', '100-1,000', 1),
(11, 'Wipro', 'wipro.com', 'IT Services', '10,000+', 1),
(12, 'Infosys', 'infosys.com', 'IT Services', '10,000+', 1),
(13, 'TCS', 'tcs.com', 'IT Services', '10,000+', 1),
(14, 'Accenture', 'accenture.com', 'Consulting', '10,000+', 1),
(15, 'IBM', 'ibm.com', 'Technology', '10,000+', 1),
(16, 'Oracle', 'oracle.com', 'Technology', '10,000+', 1),
(17, 'Salesforce', 'salesforce.com', 'Technology', '10,000+', 1),
(18, 'Adobe', 'adobe.com', 'Technology', '1,000-10,000', 1),
(19, 'Spotify', 'spotify.com', 'Entertainment', '1,000-10,000', 1),
(20, 'Zoom', 'zoom.us', 'Technology', '1,000-10,000', 1),
(21, 'NRLord', 'nrlord.com', 'Technology', '1-100', 1);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verified_companies_domain ON verified_companies(domain);
CREATE INDEX IF NOT EXISTS idx_verified_companies_name ON verified_companies(name);
CREATE INDEX IF NOT EXISTS idx_verified_companies_industry ON verified_companies(industry);







