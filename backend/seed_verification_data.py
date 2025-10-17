#!/usr/bin/env python3
"""
Seed script to populate verified companies data
Run this after running the database migration
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, create_engine
from app.models.verification import VerifiedCompany
from app.core.config import settings

def seed_verified_companies():
    """Seed the verified_companies table with sample data"""
    
    # Create database engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Sample companies data
    companies_data = [
        {"name": "Google", "domain": "google.com", "industry": "Technology", "size": "10,000+", "verified": True},
        {"name": "Microsoft", "domain": "microsoft.com", "industry": "Technology", "size": "10,000+", "verified": True},
        {"name": "Apple", "domain": "apple.com", "industry": "Technology", "size": "10,000+", "verified": True},
        {"name": "Amazon", "domain": "amazon.com", "industry": "E-commerce", "size": "10,000+", "verified": True},
        {"name": "Meta", "domain": "meta.com", "industry": "Technology", "size": "10,000+", "verified": True},
        {"name": "Netflix", "domain": "netflix.com", "industry": "Entertainment", "size": "1,000-10,000", "verified": True},
        {"name": "Tesla", "domain": "tesla.com", "industry": "Automotive", "size": "1,000-10,000", "verified": True},
        {"name": "Uber", "domain": "uber.com", "industry": "Transportation", "size": "1,000-10,000", "verified": True},
        {"name": "Airbnb", "domain": "airbnb.com", "industry": "Hospitality", "size": "1,000-10,000", "verified": True},
        {"name": "Stripe", "domain": "stripe.com", "industry": "Fintech", "size": "100-1,000", "verified": True},
        {"name": "Wipro", "domain": "wipro.com", "industry": "IT Services", "size": "10,000+", "verified": True},
        {"name": "Infosys", "domain": "infosys.com", "industry": "IT Services", "size": "10,000+", "verified": True},
        {"name": "TCS", "domain": "tcs.com", "industry": "IT Services", "size": "10,000+", "verified": True},
        {"name": "Accenture", "domain": "accenture.com", "industry": "Consulting", "size": "10,000+", "verified": True},
        {"name": "IBM", "domain": "ibm.com", "industry": "Technology", "size": "10,000+", "verified": True},
        {"name": "Oracle", "domain": "oracle.com", "industry": "Technology", "size": "10,000+", "verified": True},
        {"name": "Salesforce", "domain": "salesforce.com", "industry": "Technology", "size": "10,000+", "verified": True},
        {"name": "Adobe", "domain": "adobe.com", "industry": "Technology", "size": "1,000-10,000", "verified": True},
        {"name": "Spotify", "domain": "spotify.com", "industry": "Entertainment", "size": "1,000-10,000", "verified": True},
        {"name": "Zoom", "domain": "zoom.us", "industry": "Technology", "size": "1,000-10,000", "verified": True},
        {"name": "Foxroids", "domain": "foxroids.com", "industry": "Technology", "size": "1-100", "verified": True},
    ]
    
    with Session(engine) as session:
        # Check if companies already exist
        existing_companies = session.query(VerifiedCompany).count()
        if existing_companies > 0:
            print(f"Found {existing_companies} existing companies. Skipping seed.")
            return
        
        # Insert companies
        for company_data in companies_data:
            company = VerifiedCompany(**company_data)
            session.add(company)
        
        session.commit()
        print(f"Successfully seeded {len(companies_data)} companies!")
        
        # Verify the data
        total_companies = session.query(VerifiedCompany).count()
        print(f"Total companies in database: {total_companies}")

if __name__ == "__main__":
    seed_verified_companies()







