#!/usr/bin/env python3
"""
Test SendGrid OTP email system
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

async def test_sendgrid_configuration():
    """Test SendGrid configuration"""
    print("🔧 Testing SendGrid Configuration")
    print("=" * 50)
    
    # Check environment variables
    sendgrid_key = os.getenv('SENDGRID_API_KEY')
    sendgrid_email = os.getenv('SENDGRID_FROM_EMAIL')
    
    print(f"SendGrid API Key: {'✅ Set' if sendgrid_key else '❌ Not set'}")
    print(f"SendGrid From Email: {'✅ Set' if sendgrid_email else '❌ Not set'}")
    
    if sendgrid_key:
        print(f"API Key (first 10 chars): {sendgrid_key[:10]}...")
    if sendgrid_email:
        print(f"From Email: {sendgrid_email}")
    
    # Check email service configuration
    print(f"\nEmail Service Active Provider: {email_service.active_service}")
    print(f"SendGrid Config: {email_service.providers['sendgrid']}")
    
    return bool(sendgrid_key and sendgrid_email)

async def test_sendgrid_email():
    """Test sending email via SendGrid"""
    print("\n📧 Testing SendGrid Email Sending")
    print("=" * 50)
    
    # Test email sending
    test_email = "test@example.com"  # Use a test email
    otp_code = "123456"
    company_name = "Test Company"
    
    print(f"Sending OTP to: {test_email}")
    print(f"OTP Code: {otp_code}")
    print(f"Company: {company_name}")
    
    try:
        result = await email_service.send_otp_email(
            to_email=test_email,
            otp_code=otp_code,
            company_name=company_name
        )
        
        print(f"\nEmail sending result: {result}")
        
        if result:
            print("✅ Email sent successfully via SendGrid!")
        else:
            print("❌ Email sending failed")
            
        return result
        
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False

async def test_sendgrid_with_real_email():
    """Test with a real email address (if configured)"""
    print("\n📧 Testing with Real Email Address")
    print("=" * 50)
    
    # You can replace this with a real email for testing
    real_email = input("Enter a real email address to test (or press Enter to skip): ").strip()
    
    if not real_email:
        print("Skipping real email test")
        return True
    
    otp_code = "789012"
    company_name = "ReferConnect Test"
    
    print(f"Sending OTP to: {real_email}")
    print(f"OTP Code: {otp_code}")
    print(f"Company: {company_name}")
    
    try:
        result = await email_service.send_otp_email(
            to_email=real_email,
            otp_code=otp_code,
            company_name=company_name
        )
        
        print(f"\nEmail sending result: {result}")
        
        if result:
            print("✅ Email sent successfully! Check your inbox.")
        else:
            print("❌ Email sending failed")
            
        return result
        
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False

def show_sendgrid_setup_instructions():
    """Show SendGrid setup instructions"""
    print("\n📋 SendGrid Setup Instructions")
    print("=" * 50)
    print("1. Go to https://sendgrid.com")
    print("2. Sign up for a free account (100 emails/day)")
    print("3. Verify your email address")
    print("4. Go to Settings > API Keys")
    print("5. Create a new API key with 'Mail Send' permissions")
    print("6. Copy the API key and update your .env file:")
    print("   SENDGRID_API_KEY=your_actual_api_key_here")
    print("7. Set your verified sender email:")
    print("   SENDGRID_FROM_EMAIL=your_verified_email@domain.com")
    print("\nNote: For testing, you can use any email as the 'to' address,")
    print("but the 'from' email must be verified in SendGrid.")

async def main():
    """Main test function"""
    print("🚀 SendGrid OTP Email System Test")
    print("=" * 60)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test configuration
    config_ok = await test_sendgrid_configuration()
    
    if not config_ok:
        print("\n⚠️  SendGrid not properly configured!")
        show_sendgrid_setup_instructions()
        return
    
    # Test email sending
    email_ok = await test_sendgrid_email()
    
    # Test with real email (optional)
    if email_ok:
        real_email_ok = await test_sendgrid_with_real_email()
    else:
        real_email_ok = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Configuration: {'✅ PASSED' if config_ok else '❌ FAILED'}")
    print(f"Email Sending: {'✅ PASSED' if email_ok else '❌ FAILED'}")
    print(f"Real Email Test: {'✅ PASSED' if real_email_ok else '⏭️  SKIPPED'}")
    
    if config_ok and email_ok:
        print("\n🎉 SendGrid OTP system is working correctly!")
        print("You can now use the OTP endpoints with SendGrid email service.")
    else:
        print("\n⚠️  Some tests failed. Please check the configuration.")
    
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    asyncio.run(main())
