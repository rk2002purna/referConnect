#!/usr/bin/env python3
"""
Debug script to help troubleshoot email issues
"""
import asyncio
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.email_service import email_service
from app.api.v1.endpoints.verification_simple import send_otp, verify_otp, SendOTPRequest, VerifyOTPRequest

async def debug_email_issue():
    print("🔍 Email Debugging Tool")
    print("=" * 60)
    print(f"Debug started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. Check configuration
    print("\n1️⃣ Configuration Check")
    print("-" * 30)
    print(f"Active Provider: {email_service.active_service}")
    print(f"SendGrid API Key: {email_service.providers['sendgrid']['api_key'][:15]}...")
    print(f"SendGrid From Email: {email_service.providers['sendgrid']['from_email']}")
    
    # 2. Test direct email service
    print("\n2️⃣ Direct Email Service Test")
    print("-" * 30)
    
    test_emails = [
        "xebagoc282@fanlvr.com",
        "test@example.com"
    ]
    
    for email in test_emails:
        print(f"\nSending test email to: {email}")
        result = await email_service.send_otp_email(
            to_email=email,
            otp_code="123456",
            company_name="Debug Test"
        )
        print(f"Result: {'✅ Success' if result else '❌ Failed'}")
    
    # 3. Test verification endpoint
    print("\n3️⃣ Verification Endpoint Test")
    print("-" * 30)
    
    try:
        request = SendOTPRequest(
            company_id=7,
            company_email="xebagoc282@fanlvr.com"
        )
        
        result = await send_otp(request)
        print(f"Send OTP Result: {result}")
        
        if result.success:
            print("✅ OTP sent via verification endpoint")
            print(f"Service used: {result.service_used}")
            print(f"Expires at: {result.expires_at}")
        else:
            print("❌ OTP sending failed via verification endpoint")
            
    except Exception as e:
        print(f"❌ Error testing verification endpoint: {e}")
    
    # 4. Check SendGrid API directly
    print("\n4️⃣ SendGrid API Direct Test")
    print("-" * 30)
    
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {email_service.providers['sendgrid']['api_key']}",
                    "Content-Type": "application/json"
                },
                json={
                    "personalizations": [{
                        "to": [{"email": "xebagoc282@fanlvr.com"}]
                    }],
                    "from": {"email": email_service.providers['sendgrid']['from_email']},
                    "subject": "Debug Test Email",
                    "content": [{
                        "type": "text/plain",
                        "value": "This is a debug test email from ReferConnect."
                    }]
                }
            )
            
            print(f"SendGrid API Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 202:
                print("✅ SendGrid API is working correctly")
            else:
                print("❌ SendGrid API returned an error")
                
    except Exception as e:
        print(f"❌ Error testing SendGrid API: {e}")
    
    # 5. Troubleshooting tips
    print("\n5️⃣ Troubleshooting Tips")
    print("-" * 30)
    print("If emails are not being received:")
    print("1. Check your spam/junk folder")
    print("2. Verify the sender email is authenticated in SendGrid")
    print("3. Check SendGrid dashboard for delivery status")
    print("4. Make sure you're testing the correct endpoint")
    print("5. Check if the backend server is running")
    print("6. Verify the frontend is calling the right URL")
    
    print(f"\nDebug completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    asyncio.run(debug_email_issue())
