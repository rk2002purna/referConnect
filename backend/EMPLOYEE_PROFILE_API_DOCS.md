# Employee Profile API Documentation

## Overview

The Employee Profile API provides comprehensive profile management functionality for employees on the ReferConnect platform. This includes basic information management, company details, referral preferences, privacy settings, and analytics.

## Base URL

```
http://localhost:8000/api/v1/employee-profile
```

## Authentication

All endpoints require Bearer token authentication:

```http
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get Employee Profile

Retrieve comprehensive employee profile information.

```http
GET /me
```

**Response:**
```json
{
  "user_id": 1,
  "email": "sarah.johnson@techcorp.com",
  "first_name": "Sarah",
  "last_name": "Johnson",
  "profile_picture": "/uploads/profile_pictures/1_abc123.jpg",
  "bio": "Experienced software engineer with 8+ years in fintech...",
  "linkedin_url": "https://linkedin.com/in/sarah-johnson-dev",
  "phone": "+1 (555) 123-4567",
  "location": "San Francisco, CA",
  "company_details": {
    "company": {
      "id": 1,
      "name": "TechCorp Inc.",
      "domain": "techcorp.com",
      "industry": "Technology",
      "size": "1000+",
      "logo_url": null,
      "location": "San Francisco, CA"
    },
    "job_title": "Senior Software Engineer",
    "department": "Platform Engineering",
    "office_location": "San Francisco, CA",
    "years_at_company": "3-4 years",
    "start_date": "2021-03-15"
  },
  "is_email_verified": true,
  "verification_status": "verified",
  "last_verified": "2024-11-15T10:30:00Z",
  "referral_preferences": {
    "roles": ["Software Engineer", "Frontend Developer"],
    "preferred_method": "platform_portal",
    "notification_preferences": {
      "new_referral_requests": true,
      "referral_status_updates": true,
      "weekly_activity_summary": false
    }
  },
  "privacy_settings": {
    "profile_visibility": "all_users",
    "show_contact_info": true,
    "show_referral_history": true
  },
  "compliance_settings": {
    "referral_guidelines_acknowledged": true,
    "data_processing_consent": true,
    "marketing_consent": false
  },
  "metrics": {
    "total_referrals": 12,
    "successful_hires": 4,
    "success_rate": 33.33,
    "rewards_earned": 2400.0,
    "profile_completion": 85,
    "last_activity": "2024-11-15T14:30:00Z"
  },
  "created_at": "2021-03-15T09:00:00Z",
  "updated_at": "2024-11-15T14:30:00Z"
}
```

### 2. Update Employee Profile

Update employee profile information with comprehensive data.

```http
PUT /me
```

**Request Body:**
```json
{
  "first_name": "Sarah",
  "last_name": "Johnson",
  "bio": "Updated bio information",
  "linkedin_url": "https://linkedin.com/in/sarah-johnson-dev",
  "phone": "+1 (555) 123-4567",
  "location": "San Francisco, CA",
  "profile_picture": "/uploads/profile_pictures/1_abc123.jpg",
  "job_title": "Senior Software Engineer",
  "department": "Platform Engineering",
  "office_location": "San Francisco, CA",
  "years_at_company": "3-4 years",
  "company_email": "sarah.johnson@techcorp.com",
  "referral_roles": ["Software Engineer", "Frontend Developer"],
  "preferred_referral_method": "platform_portal",
  "notification_preferences": {
    "new_referral_requests": true,
    "referral_status_updates": true,
    "weekly_activity_summary": false
  },
  "profile_visibility": "all_users",
  "show_contact_info": true,
  "show_referral_history": true,
  "referral_guidelines_acknowledged": true,
  "data_processing_consent": true,
  "marketing_consent": false
}
```

**Response:** Same as GET /me

### 3. Upload Profile Picture

Upload a profile picture for the employee.

```http
POST /me/profile-picture
```

**Request:** Multipart form data
- `file`: Image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response:**
```json
{
  "profile_picture_url": "/uploads/profile_pictures/1_abc123.jpg",
  "message": "Profile picture uploaded successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file type or size
- `413 Payload Too Large`: File too large

### 4. Initiate Email Verification

Initiate email verification process for company email changes.

```http
POST /me/verify-email
```

**Request Body:**
```json
{
  "company_email": "sarah.johnson@techcorp.com",
  "company_id": 1
}
```

**Response:**
```json
{
  "message": "Verification email sent. Please check your inbox and enter the OTP.",
  "verification_required": true,
  "otp_sent": true
}
```

**Error Responses:**
- `400 Bad Request`: Invalid email domain or company not found
- `422 Unprocessable Entity`: Invalid email format

### 5. Get Profile Metrics

Retrieve employee profile metrics and statistics.

```http
GET /me/metrics
```

**Response:**
```json
{
  "metrics": {
    "total_referrals": 12,
    "successful_hires": 4,
    "success_rate": 33.33,
    "rewards_earned": 2400.0,
    "profile_completion": 85,
    "last_activity": "2024-11-15T14:30:00Z"
  },
  "verification_status": "verified",
  "profile_completion": 85,
  "last_verified": "2024-11-15T10:30:00Z"
}
```

### 6. Get Profile Completion

Get detailed profile completion information.

```http
GET /me/completion
```

**Response:**
```json
{
  "completion_percentage": 85,
  "missing_fields": [
    "Department",
    "Office Location",
    "Referral Roles"
  ],
  "sections_complete": {
    "basic_info": 100,
    "company_details": 66.67,
    "referral_preferences": 0,
    "verification": 100
  }
}
```

## Error Responses

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Access denied (not an employee) |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong",
  "error_code": "VALIDATION_ERROR",
  "field_errors": {
    "email": "Invalid email format",
    "phone": "Phone number is required"
  }
}
```

## Validation Rules

### Basic Information
- `first_name`: String, max 100 characters
- `last_name`: String, max 100 characters
- `bio`: String, max 1000 characters
- `linkedin_url`: Valid URL format
- `phone`: String, max 20 characters
- `location`: String, max 255 characters

### Company Details
- `job_title`: String, max 255 characters
- `department`: String, max 255 characters
- `office_location`: String, max 255 characters
- `years_at_company`: One of: "0-1 years", "1-2 years", "2-3 years", "3-4 years", "4-5 years", "5+ years"

### Referral Preferences
- `referral_roles`: Array of strings, max 10 roles
- `preferred_referral_method`: One of: "platform_portal", "direct_ats", "email_intro"
- `notification_preferences`: Object with boolean values

### Privacy Settings
- `profile_visibility`: One of: "all_users", "company_only", "private"
- `show_contact_info`: Boolean
- `show_referral_history`: Boolean

### Compliance Settings
- `referral_guidelines_acknowledged`: Boolean
- `data_processing_consent`: Boolean
- `marketing_consent`: Boolean

## Rate Limiting

- Profile updates: 10 requests per minute
- Image uploads: 5 requests per minute
- Email verification: 3 requests per hour

## Examples

### Complete Profile Update

```bash
curl -X PUT "http://localhost:8000/api/v1/employee-profile/me" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Sarah",
    "last_name": "Johnson",
    "bio": "Experienced software engineer with 8+ years in fintech.",
    "linkedin_url": "https://linkedin.com/in/sarah-johnson-dev",
    "phone": "+1 (555) 123-4567",
    "location": "San Francisco, CA",
    "job_title": "Senior Software Engineer",
    "department": "Platform Engineering",
    "office_location": "San Francisco, CA",
    "years_at_company": "3-4 years",
    "referral_roles": ["Software Engineer", "Frontend Developer"],
    "preferred_referral_method": "platform_portal",
    "notification_preferences": {
      "new_referral_requests": true,
      "referral_status_updates": true,
      "weekly_activity_summary": false
    },
    "profile_visibility": "all_users",
    "show_contact_info": true,
    "show_referral_history": true,
    "referral_guidelines_acknowledged": true,
    "data_processing_consent": true,
    "marketing_consent": false
  }'
```

### Upload Profile Picture

```bash
curl -X POST "http://localhost:8000/api/v1/employee-profile/me/profile-picture" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@profile_picture.jpg"
```

### Initiate Email Verification

```bash
curl -X POST "http://localhost:8000/api/v1/employee-profile/me/verify-email" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_email": "sarah.johnson@techcorp.com",
    "company_id": 1
  }'
```

## SDK Examples

### Python

```python
import requests

# Get profile
response = requests.get(
    "http://localhost:8000/api/v1/employee-profile/me",
    headers={"Authorization": "Bearer YOUR_TOKEN"}
)
profile = response.json()

# Update profile
update_data = {
    "first_name": "Sarah",
    "last_name": "Johnson",
    "bio": "Updated bio"
}
response = requests.put(
    "http://localhost:8000/api/v1/employee-profile/me",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json=update_data
)
```

### JavaScript

```javascript
// Get profile
const response = await fetch('http://localhost:8000/api/v1/employee-profile/me', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const profile = await response.json();

// Update profile
const updateResponse = await fetch('http://localhost:8000/api/v1/employee-profile/me', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    first_name: 'Sarah',
    last_name: 'Johnson',
    bio: 'Updated bio'
  })
});
```

## Changelog

### Version 1.0.0
- Initial release
- Basic profile management
- Email verification system
- Referral preferences
- Privacy settings
- Analytics and metrics
- Profile picture upload
- Comprehensive validation
