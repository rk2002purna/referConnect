# Employee Verification System

This document describes the complete employee verification system implementation for ReferConnect.

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
cd /Users/pradeepdyd/referconnect-backend
python setup_verification.py
```

This will:
- Run database migrations
- Seed verified companies data
- Start the FastAPI server at http://localhost:8000

### 2. Start the Frontend

```bash
cd /Users/pradeepdyd/referconnect-frontend
npm start
```

The frontend will be available at http://localhost:3000

## 📋 API Endpoints

### Company Management
- `GET /api/v1/verification/companies?query=search_term` - Search verified companies
- `POST /api/v1/verification/companies` - Create new verified company (admin only)

### Email Verification
- `POST /api/v1/verification/send-otp` - Send OTP to company email
- `POST /api/v1/verification/verify-otp` - Verify OTP code

### ID Card Verification
- `POST /api/v1/verification/upload-id-card` - Upload ID card for manual review

### Verification Status
- `GET /api/v1/verification/status` - Get user's verification status
- `PUT /api/v1/verification/status` - Update verification status

### Admin Endpoints
- `GET /api/v1/verification/admin/pending` - Get pending verifications
- `POST /api/v1/verification/admin/{id}/approve` - Approve verification
- `POST /api/v1/verification/admin/{id}/reject` - Reject verification

## 🗄️ Database Schema

### Tables Created

1. **verified_companies** - List of verified companies
2. **employee_verifications** - User verification status
3. **otp_verifications** - OTP management
4. **id_card_verifications** - Manual verification queue

### Sample Data

The system comes pre-loaded with 20 verified companies including:
- Google, Microsoft, Apple, Amazon, Meta
- Netflix, Tesla, Uber, Airbnb, Stripe
- Wipro, Infosys, TCS, Accenture, IBM
- Oracle, Salesforce, Adobe, Spotify, Zoom

## 🔄 Verification Flow

### Email Verification Flow
1. User selects "Company Email Verification"
2. User searches and selects their company
3. User enters their company email address
4. System sends OTP to company email
5. User enters OTP code
6. Verification is complete

### ID Card Verification Flow
1. User selects "ID Card Upload"
2. User searches and selects their company
3. User uploads selfie and company ID card
4. Admin reviews the documents
5. Admin approves or rejects verification
6. User is notified of the result

## 🛠️ Technical Implementation

### Backend (FastAPI)
- **Models**: SQLModel-based database models
- **Services**: Business logic layer
- **Endpoints**: RESTful API endpoints
- **Authentication**: JWT-based auth
- **File Upload**: Secure file handling

### Frontend (React + TypeScript)
- **Components**: Modular verification components
- **API Integration**: Axios-based API calls
- **State Management**: React Context + useState
- **UI**: Tailwind CSS with custom components

### Key Features
- ✅ Real-time company search
- ✅ OTP generation and validation
- ✅ File upload with validation
- ✅ Admin approval workflow
- ✅ Error handling and fallbacks
- ✅ Loading states and user feedback

## 🔧 Configuration

### Environment Variables
```bash
# Backend
DATABASE_URL=sqlite:///./referconnect.db
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Frontend
REACT_APP_API_URL=http://localhost:8000/api/v1
```

### Database Migration
```bash
# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"
```

## 🧪 Testing

### Test the API
1. Visit http://localhost:8000/docs for interactive API documentation
2. Use the "Try it out" feature to test endpoints
3. Check the database for data persistence

### Test the Frontend
1. Register as an employee
2. Select verification method
3. Search for companies
4. Complete verification flow

## 🚨 Troubleshooting

### Common Issues

1. **"Failed to load companies"**
   - Check if backend server is running
   - Verify database migration completed
   - Check console for API errors

2. **Database connection errors**
   - Ensure SQLite database file exists
   - Check DATABASE_URL configuration
   - Run migrations manually

3. **CORS errors**
   - Verify CORS_ALLOWED_ORIGINS includes frontend URL
   - Check if backend is running on correct port

4. **File upload errors**
   - Check uploads directory permissions
   - Verify file size limits (5MB)
   - Ensure proper file types (JPEG, PNG, PDF)

### Debug Steps

1. Check backend logs for errors
2. Verify database tables exist
3. Test API endpoints directly
4. Check browser network tab for failed requests
5. Verify authentication tokens

## 📈 Next Steps

### Planned Enhancements
- [ ] Email service integration (Resend/SendGrid)
- [ ] Real-time notifications
- [ ] Advanced admin dashboard
- [ ] Bulk company import
- [ ] Verification analytics
- [ ] Mobile app support

### Production Considerations
- [ ] Database optimization
- [ ] Caching layer
- [ ] Rate limiting
- [ ] Security hardening
- [ ] Monitoring and logging
- [ ] Backup strategy

## 📞 Support

For issues or questions:
1. Check this README first
2. Review API documentation at /docs
3. Check console logs for errors
4. Verify database state

## 🎉 Success!

If everything is working correctly, you should see:
- ✅ Backend server running on port 8000
- ✅ Frontend running on port 3000
- ✅ Company search working with real data
- ✅ Verification flow completing successfully
- ✅ Database populated with sample companies

The verification system is now fully integrated and ready for use! 🚀







