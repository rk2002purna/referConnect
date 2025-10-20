"""
Email service supporting multiple free email providers
"""
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
import httpx
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
import os
from pathlib import Path

# Get the project root directory
project_root = Path(__file__).parent.parent.parent
env_path = project_root / '.env'
print(f"Loading .env from: {env_path}")
print(f".env exists: {env_path.exists()}")

load_dotenv(env_path)

class EmailService:
    def __init__(self):
        print(f"EmailService Initialization Debug")
        print(f"SENDGRID_API_KEY: {'Set' if os.getenv('SENDGRID_API_KEY') else 'Not set'}")
        print(f"SENDGRID_FROM_EMAIL: {'Set' if os.getenv('SENDGRID_FROM_EMAIL') else 'Not set'}")
        
        self.providers = {
            'gmail': {
                'smtp_server': 'smtp.gmail.com',
                'smtp_port': 587,
                'email': os.getenv('GMAIL_EMAIL'),
                'password': os.getenv('GMAIL_APP_PASSWORD')
            },
            'outlook': {
                'smtp_server': 'smtp-mail.outlook.com',
                'smtp_port': 587,
                'email': os.getenv('OUTLOOK_EMAIL'),
                'password': os.getenv('OUTLOOK_PASSWORD')
            },
            'yahoo': {
                'smtp_server': 'smtp.mail.yahoo.com',
                'smtp_port': 587,
                'email': os.getenv('YAHOO_EMAIL'),
                'password': os.getenv('YAHOO_APP_PASSWORD')
            },
            'resend': {
                'api_key': os.getenv('RESEND_API_KEY'),
                'from_email': os.getenv('RESEND_FROM_EMAIL', 'onboarding@resend.dev')
            },
            'sendgrid': {
                'api_key': os.getenv('SENDGRID_API_KEY'),
                'from_email': os.getenv('SENDGRID_FROM_EMAIL')
            }
        }
        
        print(f"SendGrid config: api_key={'Set' if self.providers['sendgrid']['api_key'] else 'Not set'}, from_email={'Set' if self.providers['sendgrid']['from_email'] else 'Not set'}")
        
        # Determine which service to use (priority order)
        self.active_service = self._get_active_service()
        print(f"Active service determined: {self.active_service}")
        
    def _get_active_service(self) -> str:
        """Determine which email service to use based on available credentials"""
        # Check Resend first (most reliable for free tier)
        if self.providers['resend']['api_key']:
            return 'resend'
        
        # Check SendGrid
        if self.providers['sendgrid']['api_key']:
            return 'sendgrid'
            
        # Check SMTP providers
        for provider in ['gmail', 'outlook', 'yahoo']:
            if (self.providers[provider]['email'] and 
                self.providers[provider]['password']):
                return provider
                
        # Fallback to console logging
        return 'console'
    
    async def send_otp_email(self, to_email: str, otp_code: str, company_name: str) -> bool:
        """Send OTP email using the active service"""
        
        if self.active_service == 'console':
            return await self._send_console_email(to_email, otp_code, company_name)
        elif self.active_service == 'resend':
            return await self._send_resend_email(to_email, otp_code, company_name)
        elif self.active_service == 'sendgrid':
            return await self._send_sendgrid_email(to_email, otp_code, company_name)
        else:
            return await self._send_smtp_email(to_email, otp_code, company_name)
    
    async def _send_console_email(self, to_email: str, otp_code: str, company_name: str) -> bool:
        """Send OTP to console (fallback)"""
        print(f"\n{'='*50}")
        print(f"📧 OTP EMAIL")
        print(f"{'='*50}")
        print(f"To: {to_email}")
        print(f"Subject: Your ReferConnect Verification Code for {company_name}")
        print(f"Code: {otp_code}")
        print(f"Company: {company_name}")
        print(f"Expires: 10 minutes")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*50}\n")
        return True
    
    async def _send_resend_email(self, to_email: str, otp_code: str, company_name: str) -> bool:
        """Send OTP using Resend API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {self.providers['resend']['api_key']}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": self.providers['resend']['from_email'],
                        "to": [to_email],
                        "subject": f"Your ReferConnect Verification Code for {company_name}",
                        "html": self._get_otp_email_template(otp_code, company_name)
                    }
                )
                
                if response.status_code == 200:
                    print(f"✅ OTP sent via Resend to {to_email}")
                    return True
                else:
                    print(f"❌ Resend failed: {response.text}")
                    return await self._send_console_email(to_email, otp_code, company_name)
                    
        except Exception as e:
            print(f"❌ Resend error: {e}")
            return await self._send_console_email(to_email, otp_code, company_name)
    
    async def _send_sendgrid_email(self, to_email: str, otp_code: str, company_name: str) -> bool:
        """Send OTP using SendGrid API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers={
                        "Authorization": f"Bearer {self.providers['sendgrid']['api_key']}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "personalizations": [{
                            "to": [{"email": to_email}]
                        }],
                        "from": {"email": self.providers['sendgrid']['from_email']},
                        "subject": f"Your ReferConnect Verification Code for {company_name}",
                        "content": [{
                            "type": "text/html",
                            "value": self._get_otp_email_template(otp_code, company_name)
                        }]
                    }
                )
                
                print(f"SendGrid Response: Status {response.status_code}")
                print(f"SendGrid Response Body: {response.text}")
                
                if response.status_code == 202:
                    print(f"✅ OTP sent via SendGrid to {to_email}")
                    return True
                else:
                    print(f"❌ SendGrid failed: {response.text}")
                    return await self._send_console_email(to_email, otp_code, company_name)
                    
        except Exception as e:
            print(f"❌ SendGrid error: {e}")
            return await self._send_console_email(to_email, otp_code, company_name)
    
    async def _send_smtp_email(self, to_email: str, otp_code: str, company_name: str) -> bool:
        """Send OTP using SMTP"""
        provider = self.providers[self.active_service]
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"Your ReferConnect Verification Code for {company_name}"
            message["From"] = f"ReferConnect <{provider['email']}>"
            message["To"] = to_email
            
            # Create HTML content
            html_content = self._get_otp_email_template(otp_code, company_name)
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Create secure connection and send email
            context = ssl.create_default_context()
            with smtplib.SMTP(provider['smtp_server'], provider['smtp_port']) as server:
                server.starttls(context=context)
                server.login(provider['email'], provider['password'])
                server.sendmail(provider['email'], to_email, message.as_string())
            
            print(f"✅ OTP sent via {self.active_service.upper()} to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ {self.active_service.upper()} SMTP error: {e}")
            return await self._send_console_email(to_email, otp_code, company_name)
    
    def _get_otp_email_template(self, otp_code: str, company_name: str) -> str:
        """Generate beautiful HTML email template for OTP"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your ReferConnect Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                        ReferConnect
                    </h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                        Professional Referral Network
                    </p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; text-align: center;">
                        Email Verification
                    </h2>
                    
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Hello! You're verifying your email for <strong>{company_name}</strong> on ReferConnect.
                    </p>
                    
                    <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                        <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">
                            Your Verification Code
                        </p>
                        <div style="background-color: #667eea; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; border-radius: 8px; margin: 10px 0; font-family: 'Courier New', monospace;">
                            {otp_code}
                        </div>
                        <p style="color: #666666; font-size: 12px; margin: 10px 0 0 0;">
                            This code expires in 10 minutes
                        </p>
                    </div>
                    
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="color: #856404; font-size: 14px; margin: 0; font-weight: bold;">
                            ⚠️ Security Notice
                        </p>
                        <p style="color: #856404; font-size: 13px; margin: 5px 0 0 0;">
                            Never share this code with anyone. ReferConnect will never ask for your verification code via phone or email.
                        </p>
                    </div>
                    
                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                        If you didn't request this verification, please ignore this email or contact our support team.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #666666; font-size: 12px; margin: 0 0 10px 0;">
                        This email was sent by ReferConnect
                    </p>
                    <p style="color: #999999; font-size: 11px; margin: 0;">
                        © 2024 ReferConnect. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

# Global email service instance
email_service = EmailService()
