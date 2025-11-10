-- Seed Verified Companies Data
-- Run this in pgAdmin Query Tool on the ReferConnect database after creating tables

-- Insert verified companies
INSERT INTO verified_companies (name, domain, industry, size, verified)
VALUES 
    ('Google', 'google.com', 'Technology', '10,000+', TRUE),
    ('Microsoft', 'microsoft.com', 'Technology', '10,000+', TRUE),
    ('Apple', 'apple.com', 'Technology', '10,000+', TRUE),
    ('Amazon', 'amazon.com', 'E-commerce', '10,000+', TRUE),
    ('Meta', 'meta.com', 'Technology', '10,000+', TRUE),
    ('Netflix', 'netflix.com', 'Entertainment', '1,000-10,000', TRUE),
    ('Tesla', 'tesla.com', 'Automotive', '1,000-10,000', TRUE),
    ('Uber', 'uber.com', 'Transportation', '1,000-10,000', TRUE),
    ('Airbnb', 'airbnb.com', 'Hospitality', '1,000-10,000', TRUE),
    ('Stripe', 'stripe.com', 'Fintech', '100-1,000', TRUE),
    ('Wipro', 'wipro.com', 'IT Services', '10,000+', TRUE),
    ('Infosys', 'infosys.com', 'IT Services', '10,000+', TRUE),
    ('TCS', 'tcs.com', 'IT Services', '10,000+', TRUE),
    ('Accenture', 'accenture.com', 'Consulting', '10,000+', TRUE),
    ('IBM', 'ibm.com', 'Technology', '10,000+', TRUE),
    ('Oracle', 'oracle.com', 'Technology', '10,000+', TRUE),
    ('Salesforce', 'salesforce.com', 'Technology', '10,000+', TRUE),
    ('Adobe', 'adobe.com', 'Technology', '1,000-10,000', TRUE),
    ('Spotify', 'spotify.com', 'Entertainment', '1,000-10,000', TRUE),
    ('Zoom', 'zoom.us', 'Technology', '1,000-10,000', TRUE),
    ('NRLord', 'nrlord.com', 'Technology', '1-100', TRUE)
ON CONFLICT (domain) DO NOTHING;

-- Insert into regular companies table as well
INSERT INTO companies (name, domain, industry, size, is_verified)
VALUES 
    ('Google', 'google.com', 'Technology', '10,000+', TRUE),
    ('Microsoft', 'microsoft.com', 'Technology', '10,000+', TRUE),
    ('Apple', 'apple.com', 'Technology', '10,000+', TRUE),
    ('Amazon', 'amazon.com', 'E-commerce', '10,000+', TRUE),
    ('Meta', 'meta.com', 'Technology', '10,000+', TRUE),
    ('Netflix', 'netflix.com', 'Entertainment', '1,000-10,000', TRUE),
    ('Tesla', 'tesla.com', 'Automotive', '1,000-10,000', TRUE),
    ('Uber', 'uber.com', 'Transportation', '1,000-10,000', TRUE),
    ('Airbnb', 'airbnb.com', 'Hospitality', '1,000-10,000', TRUE),
    ('Stripe', 'stripe.com', 'Fintech', '100-1,000', TRUE),
    ('Wipro', 'wipro.com', 'IT Services', '10,000+', TRUE),
    ('Infosys', 'infosys.com', 'IT Services', '10,000+', TRUE),
    ('TCS', 'tcs.com', 'IT Services', '10,000+', TRUE),
    ('Accenture', 'accenture.com', 'Consulting', '10,000+', TRUE),
    ('IBM', 'ibm.com', 'Technology', '10,000+', TRUE),
    ('Oracle', 'oracle.com', 'Technology', '10,000+', TRUE),
    ('Salesforce', 'salesforce.com', 'Technology', '10,000+', TRUE),
    ('Adobe', 'adobe.com', 'Technology', '1,000-10,000', TRUE),
    ('Spotify', 'spotify.com', 'Entertainment', '1,000-10,000', TRUE),
    ('Zoom', 'zoom.us', 'Technology', '1,000-10,000', TRUE),
    ('NRLord', 'nrlord.com', 'Technology', '1-100', TRUE)
ON CONFLICT (domain) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Companies seeded successfully!';
END $$;


