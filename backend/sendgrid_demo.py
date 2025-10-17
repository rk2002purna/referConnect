#!/usr/bin/env python3
"""
SendGrid OTP Demo - Shows how to use SendGrid with real API key
"""
import asyncio
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.email_service import email_service
from app.services.otp_service import OTPService

class MockDB:
    """Mock database for demo"""
    def __init__(self):
        self.otps = []
        self.verifications = []
    
    def add(self, obj):
        if hasattr(obj, 'id'):
            obj.id = len(self.otps) + 1
        self.otps.append(obj)
    
    def commit(self):
        pass
    
    def refresh(self, obj):
        pass
    
    def get(self, model, id):
        if model.__name__ == 'VerifiedCompany':
            return type('Company', (), {'id': id, 'name': 'Demo Company'})()
        return None
    
    def exec(self, query):
        class MockResult:
            def first(self):
                return None
            def all(self):
                return []
        return MockResult()

async def demo_sendgrid_otp():
    """Demo SendGrid OTP functionality"""
    print("🚀 SendGrid OTP Email Demo")
    print("=" * 50)
    
    # Check configuration
    sendgrid_key = os.getenv('SENDGRID_API_KEY')
    sendgrid_email = os.getenv('SENDGRID_FROM_EMAIL')
    
    print(f"Active Email Service: {email_service.active_service}")
    print(f"SendGrid API Key: {'✅ Set' if sendgrid_key else '❌ Not set'}")
    print(f"SendGrid From Email: {sendgrid_email}")
    
    if not sendgrid_key or sendgrid_key == 'SG.test_key_replace_with_real_key':
        print("\n⚠️  Using test API key. SendGrid will fail and fallback to console.")
        print("To use real SendGrid:")
        print("1. Get API key from https://sendgrid.com")
        print("2. Update .env: SENDGRID_API_KEY=your_real_api_key")
        print("3. Verify sender email in SendGrid dashboard")
    
    # Demo OTP generation
    print("\n🔐 OTP Generation Demo")
    print("-" * 30)
    
    db = MockDB()
    otp_service = OTPService(db)
    
    # Generate some OTPs
    for i in range(3):
        otp = otp_service.generate_otp()
        print(f"Generated OTP {i+1}: {otp}")
    
    # Demo email sending
    print("\n📧 Email Sending Demo")
    print("-" * 30)
    
    test_emails = [
        "test1@example.com",
        "test2@company.com", 
        "user@demo.org"
    ]
    
    for i, email in enumerate(test_emails, 1):
        otp_code = otp_service.generate_otp()
        company_name = f"Demo Company {i}"
        
        print(f"\nSending OTP {i}:")
        print(f"  To: {email}")
        print(f"  Code: {otp_code}")
        print(f"  Company: {company_name}")
        
        result = await email_service.send_otp_email(
            to_email=email,
            otp_code=otp_code,
            company_name=company_name
        )
        
        print(f"  Result: {'✅ Success' if result else '❌ Failed'}")
    
    # Demo email template
    print("\n🎨 Email Template Demo")
    print("-" * 30)
    
    template = email_service._get_otp_email_template("123456", "Demo Company")
    print(f"Template length: {len(template)} characters")
    print(f"Contains HTML: {'<html>' in template.lower()}")
    print(f"Contains OTP: {'123456' in template}")
    print(f"Contains company: {'Demo Company' in template}")
    
    # Show template preview
    print("\n📄 Template Preview (first 500 chars):")
    print("-" * 50)
    print(template[:500] + "...")
    
    print("\n✅ SendGrid OTP Demo completed!")
    print("\nTo use with real SendGrid:")
    print("1. Sign up at https://sendgrid.com")
    print("2. Get API key from Settings > API Keys")
    print("3. Verify sender email in Settings > Sender Authentication")
    print("4. Update .env with real credentials")
    print("5. Restart the application")

if __name__ == "__main__":
    asyncio.run(demo_sendgrid_otp())
