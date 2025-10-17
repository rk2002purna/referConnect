# Employee Profile System

A comprehensive employee profile management system for the ReferConnect referral-based job platform. This system provides a complete profile management experience with inline editing, verification workflows, and comprehensive analytics.

## 🚀 Features

### Core Profile Management
- **Basic Information**: Name, email, bio, LinkedIn, phone, location
- **Company Details**: Job title, department, office location, years at company
- **Profile Picture**: Upload and manage profile photos with drag-and-drop support
- **Real-time Editing**: Inline editing with save/cancel functionality

### Email Verification System
- **Company Email Verification**: OTP-based verification for company email changes
- **Re-verification Workflow**: Automatic re-verification when email is changed
- **Verification Status Tracking**: Real-time status updates and notifications

### Referral Preferences
- **Role Selection**: Multi-select roles for referral preferences
- **Referral Methods**: Platform portal, direct ATS, or email introduction
- **Notification Settings**: Customizable notification preferences
- **Custom Roles**: Add custom roles beyond predefined options

### Privacy & Compliance
- **Profile Visibility**: Control who can see your profile (all users, company-only, private)
- **Contact Info Settings**: Toggle visibility of contact information
- **Referral History**: Control visibility of referral activity
- **Compliance Tracking**: GDPR compliance and referral guidelines acknowledgment

### Analytics & Metrics
- **Referral Statistics**: Total referrals, successful hires, success rate
- **Rewards Tracking**: Monetary rewards earned from successful referrals
- **Profile Completion**: Real-time completion percentage and missing fields
- **Activity Tracking**: Last activity and engagement metrics

## 🏗️ Architecture

### Backend Components

#### Models
- **User**: Basic user information and authentication
- **Employee**: Employee-specific profile data
- **Company**: Company information and verification
- **EmployeeVerification**: Email verification tracking
- **Referral**: Referral activity and statistics

#### Services
- **EmployeeProfileService**: Core profile management logic
- **OTPService**: Email verification and OTP handling
- **EmailService**: Email notifications and communications
- **AnalyticsService**: Metrics and statistics calculation

#### API Endpoints
```
GET    /api/v1/employee-profile/me              # Get profile
PUT    /api/v1/employee-profile/me              # Update profile
POST   /api/v1/employee-profile/me/profile-picture  # Upload picture
POST   /api/v1/employee-profile/me/verify-email     # Initiate verification
GET    /api/v1/employee-profile/me/metrics          # Get metrics
GET    /api/v1/employee-profile/me/completion       # Get completion status
```

### Frontend Components

#### React Component
- **EmployeeProfile.jsx**: Main profile management component
- **Inline Editing**: Real-time editing with validation
- **Image Upload**: Drag-and-drop profile picture upload
- **Responsive Design**: Mobile-first responsive layout

#### HTML Template
- **employee_profile.html**: Complete HTML template with Alpine.js
- **Interactive UI**: Real-time updates and smooth animations
- **Accessibility**: WCAG compliant design patterns

## 📊 Data Models

### EmployeeProfileResponse
```json
{
  "user_id": 1,
  "email": "sarah.johnson@techcorp.com",
  "first_name": "Sarah",
  "last_name": "Johnson",
  "profile_picture": "/uploads/profile_pictures/1_abc123.jpg",
  "bio": "Experienced software engineer...",
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
      "location": "San Francisco, CA"
    },
    "job_title": "Senior Software Engineer",
    "department": "Platform Engineering",
    "office_location": "San Francisco, CA",
    "years_at_company": "3-4 years"
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
  }
}
```

## 🔧 Installation & Setup

### Backend Setup
1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run database migrations:
```bash
alembic upgrade head
```

3. Start the server:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup
1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

## 🧪 Testing

### Run Comprehensive Tests
```bash
python test_employee_profile.py
```

### Test Coverage
- ✅ Profile retrieval and updates
- ✅ Email verification workflow
- ✅ Image upload functionality
- ✅ Referral preferences management
- ✅ Privacy settings configuration
- ✅ Compliance tracking
- ✅ Metrics calculation
- ✅ Validation error handling
- ✅ Unauthorized access protection

## 📱 Usage Examples

### Update Basic Information
```python
import requests

# Update basic profile information
response = requests.put(
    "http://localhost:8000/api/v1/employee-profile/me",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "first_name": "Sarah",
        "last_name": "Johnson",
        "bio": "Experienced software engineer...",
        "linkedin_url": "https://linkedin.com/in/sarah-johnson-dev",
        "phone": "+1 (555) 123-4567",
        "location": "San Francisco, CA"
    }
)
```

### Update Company Details
```python
# Update company information
response = requests.put(
    "http://localhost:8000/api/v1/employee-profile/me",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "job_title": "Senior Software Engineer",
        "department": "Platform Engineering",
        "office_location": "San Francisco, CA",
        "years_at_company": "3-4 years"
    }
)
```

### Configure Referral Preferences
```python
# Set referral preferences
response = requests.put(
    "http://localhost:8000/api/v1/employee-profile/me",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "referral_roles": ["Software Engineer", "Frontend Developer"],
        "preferred_referral_method": "platform_portal",
        "notification_preferences": {
            "new_referral_requests": True,
            "referral_status_updates": True,
            "weekly_activity_summary": False
        }
    }
)
```

### Upload Profile Picture
```python
# Upload profile picture
with open("profile_picture.jpg", "rb") as f:
    response = requests.post(
        "http://localhost:8000/api/v1/employee-profile/me/profile-picture",
        headers={"Authorization": "Bearer YOUR_TOKEN"},
        files={"file": ("profile_picture.jpg", f, "image/jpeg")}
    )
```

## 🔒 Security Features

### Email Verification
- OTP-based verification for company email changes
- Domain validation against company records
- Time-limited verification tokens
- Automatic re-verification workflow

### Data Validation
- Input sanitization and validation
- URL format validation for LinkedIn profiles
- Email format validation
- File type and size validation for uploads

### Access Control
- JWT-based authentication
- Role-based access control (employee-only endpoints)
- CSRF protection
- Rate limiting on sensitive endpoints

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first responsive layout
- Touch-friendly interface elements
- Optimized for all screen sizes
- Accessible design patterns

### Interactive Elements
- Real-time form validation
- Smooth animations and transitions
- Drag-and-drop file upload
- Inline editing with save/cancel

### Visual Feedback
- Loading states and progress indicators
- Success/error notifications
- Profile completion progress bar
- Verification status indicators

## 📈 Performance Optimizations

### Backend
- Database query optimization
- Caching for frequently accessed data
- Lazy loading of profile images
- Efficient JSON serialization

### Frontend
- Component lazy loading
- Image optimization and compression
- Efficient state management
- Minimal re-renders

## 🔮 Future Enhancements

### Planned Features
- **Advanced Analytics**: Detailed referral performance metrics
- **Social Integration**: LinkedIn profile sync and validation
- **Bulk Operations**: Batch profile updates and imports
- **API Rate Limiting**: Advanced rate limiting and throttling
- **Real-time Notifications**: WebSocket-based real-time updates
- **Profile Templates**: Pre-configured profile templates for different roles

### Integration Opportunities
- **HR Systems**: Integration with popular HR platforms
- **ATS Integration**: Direct integration with applicant tracking systems
- **Slack/Teams**: Notification integration with team communication tools
- **Calendar Integration**: Meeting scheduling for referral discussions

## 🐛 Troubleshooting

### Common Issues

#### Email Verification Not Working
- Check if company domain is properly configured
- Verify OTP service is running
- Check email service configuration

#### Profile Picture Upload Fails
- Verify file size is under 5MB
- Check file type is supported (JPEG, PNG, GIF, WebP)
- Ensure upload directory has write permissions

#### Profile Updates Not Saving
- Check authentication token is valid
- Verify all required fields are provided
- Check for validation errors in response

### Debug Mode
Enable debug logging by setting:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📞 Support

For technical support or feature requests:
- Create an issue in the project repository
- Contact the development team
- Check the API documentation for detailed endpoint information

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
