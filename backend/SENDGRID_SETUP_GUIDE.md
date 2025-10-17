# SendGrid OTP Email Setup Guide

Complete guide to set up SendGrid for OTP email verification in ReferConnect.

## 🚀 Quick Start

### 1. Create SendGrid Account
1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Click "Start for Free"
3. Sign up with your email address
4. Verify your email address

### 2. Get API Key
1. Log in to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **"Create API Key"**
4. Choose **"Restricted Access"**
5. Give it a name: "ReferConnect OTP"
6. Under **Mail Send**, select **"Full Access"**
7. Click **"Create & View"**
8. **Copy the API key** (you won't see it again!)

### 3. Verify Sender Email
1. Go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in the form:
   - **From Name**: ReferConnect
   - **From Email**: your-email@domain.com
   - **Reply To**: your-email@domain.com
   - **Company Address**: Your company address
4. Click **"Create"**
5. Check your email and click the verification link

### 4. Update Configuration
Update your `.env` file:
```env
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=your-verified-email@domain.com
```

### 5. Test the Setup
```bash
python sendgrid_demo.py
```

## 📧 SendGrid Features

### Free Tier Limits
- **100 emails per day**
- **40,000 emails for first 30 days**
- **Unlimited contacts**
- **Basic analytics**

### Paid Plans
- **Essentials**: $19.95/month (100,000 emails)
- **Pro**: $89.95/month (1,000,000 emails)
- **Premier**: Custom pricing

## 🔧 Configuration Options

### Environment Variables
```env
# Required
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=your-verified-email@domain.com

# Optional (for advanced features)
SENDGRID_TEMPLATE_ID=your_template_id
SENDGRID_CATEGORY=otp-verification
```

### Email Service Priority
The system automatically selects email providers in this order:
1. **SendGrid** (if API key configured)
2. **Resend** (if API key configured)
3. **Gmail SMTP** (if credentials configured)
4. **Console logging** (fallback)

## 🧪 Testing

### Test Scripts
```bash
# Test SendGrid configuration
python test_sendgrid_otp.py

# Demo SendGrid functionality
python sendgrid_demo.py

# Test complete OTP system
python test_otp_system.py
```

### Manual Testing
```python
from app.services.email_service import email_service

# Test email sending
result = await email_service.send_otp_email(
    to_email="test@example.com",
    otp_code="123456",
    company_name="Test Company"
)
print(f"Email sent: {result}")
```

## 📊 Monitoring

### SendGrid Dashboard
- **Activity**: View sent emails
- **Statistics**: Open rates, clicks, bounces
- **Suppressions**: Bounced/unsubscribed emails
- **API Keys**: Manage API keys

### Application Logs
The system logs:
- Email sending attempts
- SendGrid API responses
- Fallback to console logging
- Error messages

## 🔒 Security Best Practices

### API Key Security
- Store API key in environment variables
- Never commit API keys to version control
- Use restricted access API keys
- Rotate keys regularly

### Email Security
- Verify sender domains
- Use SPF, DKIM, and DMARC records
- Monitor bounce rates
- Handle unsubscribes properly

## 🚨 Troubleshooting

### Common Issues

#### 1. "Invalid API Key" Error
```
{"errors":[{"message":"The provided authorization grant is invalid, expired, or revoked"}]}
```
**Solution**: Check API key is correct and has Mail Send permissions

#### 2. "Sender Not Verified" Error
```
{"errors":[{"message":"The from address does not match a verified Sender Identity"}]}
```
**Solution**: Verify sender email in SendGrid dashboard

#### 3. "Rate Limit Exceeded" Error
```
{"errors":[{"message":"Rate limit exceeded"}]}
```
**Solution**: Wait or upgrade to higher plan

#### 4. Emails Going to Spam
**Solutions**:
- Verify sender domain
- Set up SPF record
- Use professional email address
- Avoid spam trigger words

### Debug Mode
Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Performance Optimization

### Batch Sending
For multiple emails, use SendGrid's batch API:
```python
# Send multiple OTPs at once
emails = [
    {"to": "user1@example.com", "otp": "123456"},
    {"to": "user2@example.com", "otp": "789012"}
]
```

### Template Usage
Create reusable email templates in SendGrid:
1. Go to **Email API** → **Dynamic Templates**
2. Create template with OTP placeholder
3. Use template ID in configuration

### Monitoring
Set up alerts for:
- High bounce rates
- API key usage
- Rate limit warnings
- Failed deliveries

## 🔄 Migration from Other Services

### From Gmail SMTP
```env
# Remove Gmail config
# GMAIL_EMAIL=...
# GMAIL_APP_PASSWORD=...

# Add SendGrid config
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=your-email@domain.com
```

### From Resend
```env
# Keep both for redundancy
RESEND_API_KEY=re_your_key_here
SENDGRID_API_KEY=SG.your_key_here

# SendGrid will be used first (higher priority)
```

## 📞 Support

### SendGrid Support
- **Documentation**: [https://docs.sendgrid.com](https://docs.sendgrid.com)
- **Support Center**: [https://support.sendgrid.com](https://support.sendgrid.com)
- **Status Page**: [https://status.sendgrid.com](https://status.sendgrid.com)

### Application Support
- Check application logs
- Test with `sendgrid_demo.py`
- Verify configuration with `test_sendgrid_otp.py`

## ✅ Checklist

Before going live:
- [ ] SendGrid account created
- [ ] API key generated with Mail Send permissions
- [ ] Sender email verified
- [ ] Environment variables configured
- [ ] Test emails sent successfully
- [ ] Monitoring set up
- [ ] Backup email service configured
- [ ] Rate limits understood
- [ ] Security best practices implemented

---

**Need Help?** Run `python sendgrid_demo.py` to test your setup or check the application logs for detailed error messages.
