# OTP Email Verification System

A comprehensive OTP (One-Time Password) email verification system supporting multiple free email providers with automatic fallback and beautiful HTML email templates.

## 🚀 Features

- **Multiple Email Providers**: Support for Resend, SendGrid, Gmail, Outlook, and Yahoo
- **Automatic Fallback**: Falls back to console logging if email services fail
- **Beautiful HTML Templates**: Professional, responsive email templates
- **Rate Limiting**: Prevents spam with 1-minute cooldown between requests
- **Security Features**: 
  - 6-digit secure OTP codes
  - 10-minute expiration
  - Maximum 3 verification attempts
  - Automatic cleanup of expired OTPs
- **Database Integration**: Full SQLModel integration with proper indexing
- **RESTful API**: Clean REST endpoints for OTP operations

## 📧 Supported Email Providers

### 1. Resend (Recommended)
- **Free Tier**: 3,000 emails/month
- **Setup**: Get API key from [resend.com](https://resend.com)
- **Configuration**:
  ```env
  RESEND_API_KEY=your_api_key_here
  RESEND_FROM_EMAIL=onboarding@resend.dev
  ```

### 2. SendGrid
- **Free Tier**: 100 emails/day
- **Setup**: Get API key from [sendgrid.com](https://sendgrid.com)
- **Configuration**:
  ```env
  SENDGRID_API_KEY=your_api_key_here
  SENDGRID_FROM_EMAIL=your_verified_email@domain.com
  ```

### 3. Gmail SMTP
- **Free**: Unlimited (with App Password)
- **Setup**: Enable 2FA and generate App Password
- **Configuration**:
  ```env
  GMAIL_EMAIL=your_email@gmail.com
  GMAIL_APP_PASSWORD=your_app_password_here
  ```

### 4. Outlook SMTP
- **Free**: Unlimited
- **Configuration**:
  ```env
  OUTLOOK_EMAIL=your_email@outlook.com
  OUTLOOK_PASSWORD=your_password_here
  ```

### 5. Yahoo SMTP
- **Free**: Unlimited (with App Password)
- **Setup**: Enable 2FA and generate App Password
- **Configuration**:
  ```env
  YAHOO_EMAIL=your_email@yahoo.com
  YAHOO_APP_PASSWORD=your_app_password_here
  ```

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
pip install httpx aiofiles
```

### 2. Database Migration
The OTP table is automatically created. If you need to create it manually:
```sql
CREATE TABLE otp_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES verified_companies(id)
);
```

### 3. Environment Configuration
Add to your `.env` file:
```env
# Choose one or more email providers
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev

# OR
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=your_verified_email@domain.com

# OR
GMAIL_EMAIL=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password_here
```

## 📚 API Endpoints

### Send OTP
```http
POST /api/v1/otp/send-otp
Content-Type: application/json
Authorization: Bearer <token>

{
    "company_id": 1,
    "company_email": "user@company.com"
}
```

**Response:**
```json
{
    "success": true,
    "message": "OTP sent successfully",
    "expires_at": "2024-01-01T12:00:00Z",
    "service_used": "resend"
}
```

### Verify OTP
```http
POST /api/v1/otp/verify-otp
Content-Type: application/json
Authorization: Bearer <token>

{
    "company_id": 1,
    "company_email": "user@company.com",
    "otp_code": "123456"
}
```

**Response:**
```json
{
    "success": true,
    "message": "OTP verified successfully",
    "verification_id": 123
}
```

### Get Verification Status
```http
GET /api/v1/otp/status
Authorization: Bearer <token>
```

**Response:**
```json
{
    "verified_companies": [
        {
            "company_id": 1,
            "company_email": "user@company.com",
            "verified_at": "2024-01-01T12:00:00Z",
            "method": "email"
        }
    ]
}
```

## 🔧 Usage Examples

### Python Service Usage
```python
from app.services.otp_service import OTPService
from app.schemas.verification import SendOTPRequest, VerifyOTPRequest

# Initialize service
otp_service = OTPService(db)

# Send OTP
request = SendOTPRequest(
    company_id=1,
    company_email="user@company.com"
)
result = await otp_service.send_otp(request, user_id=1)

# Verify OTP
verify_request = VerifyOTPRequest(
    company_id=1,
    company_email="user@company.com",
    otp_code="123456"
)
result = otp_service.verify_otp(verify_request, user_id=1)
```

### Direct Email Service Usage
```python
from app.services.email_service import email_service

# Send OTP email
result = await email_service.send_otp_email(
    to_email="user@company.com",
    otp_code="123456",
    company_name="Test Company"
)
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
python test_otp_system.py
```

This will test:
- Email service functionality
- OTP generation and uniqueness
- Complete OTP workflow
- Email template generation

## 🔒 Security Features

1. **Rate Limiting**: 1-minute cooldown between OTP requests
2. **Attempt Limiting**: Maximum 3 verification attempts per OTP
3. **Expiration**: OTPs expire after 10 minutes
4. **Secure Generation**: Cryptographically secure random OTPs
5. **Automatic Cleanup**: Expired OTPs are automatically cleaned up
6. **Database Constraints**: Foreign key constraints ensure data integrity

## 📊 Monitoring & Logging

The system provides comprehensive logging:
- Email sending attempts and results
- OTP generation and verification
- Error handling and fallbacks
- Service provider selection

## 🎨 Email Template

The system includes a beautiful, responsive HTML email template with:
- Professional design with gradient header
- Clear OTP code display
- Security warnings
- Company branding
- Mobile-responsive layout

## 🔄 Service Priority

The system automatically selects email providers in this order:
1. Resend (if API key available)
2. SendGrid (if API key available)
3. Gmail SMTP (if credentials available)
4. Outlook SMTP (if credentials available)
5. Yahoo SMTP (if credentials available)
6. Console logging (fallback)

## 🚨 Error Handling

The system gracefully handles:
- Email service failures (falls back to console)
- Network timeouts
- Invalid credentials
- Rate limiting
- Database errors
- Invalid OTP codes

## 📈 Performance

- **OTP Generation**: < 1ms
- **Email Sending**: 1-5 seconds (depending on provider)
- **Database Operations**: < 10ms
- **Template Generation**: < 1ms

## 🔧 Configuration Options

You can customize the OTP system by modifying the `OTPService` class:
- `otp_length`: Length of OTP code (default: 6)
- `otp_expiry_minutes`: OTP expiration time (default: 10)
- `max_attempts`: Maximum verification attempts (default: 3)

## 📝 License

This OTP system is part of the ReferConnect project and follows the same license terms.

---

**Need Help?** Check the test script `test_otp_system.py` for usage examples or contact the development team.
