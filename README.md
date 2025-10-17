# ReferConnect - Professional Referral Platform

A comprehensive referral platform that connects job seekers with employees at verified companies, enabling professional referrals and job opportunities.

## 🚀 Features

### 🔐 Authentication & User Management
- **User Registration & Login**: Secure JWT-based authentication
- **Role-based Access**: Separate flows for Job Seekers and Employees
- **Email Verification**: OTP-based email verification system
- **Profile Management**: Comprehensive user profile system

### 👤 Job Seeker Features
- **Onboarding Wizard**: Step-by-step profile completion
- **Resume Upload**: Secure file upload and storage
- **Skills & Experience Tracking**: Detailed professional background
- **Job Search**: Browse and apply for job opportunities
- **Application Tracking**: Monitor application status
- **Referral Requests**: Request referrals from employees

### 🏢 Employee Features
- **Company Verification**: Email-based company verification
- **Job Posting**: Create and manage job postings
- **Referral Management**: Track and manage referrals
- **Employee Dashboard**: Comprehensive dashboard for employees
- **Profile Management**: Professional profile with badges and achievements

### 🏛️ Company Management
- **Verified Companies**: Pre-verified company database
- **Company Search**: Search and select from verified companies
- **Domain Verification**: Automatic email domain verification
- **Company Profiles**: Detailed company information

### 📊 Profile Completion System
- **Progress Tracking**: Real-time profile completion percentage
- **Smart Recommendations**: Suggests missing profile fields
- **Role-specific Requirements**: Different completion criteria for job seekers vs employees
- **Completion Thresholds**: 80% for job seekers, 70% for employees

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Lucide React** for icons
- **Context API** for state management

### Backend
- **FastAPI** (Python 3.8+)
- **SQLAlchemy** with SQLModel for ORM
- **SQLite** database
- **Pydantic** for data validation
- **JWT** for authentication
- **SendGrid** for email services
- **Alembic** for database migrations

## 📁 Project Structure

```
referconnect-frontend/
├── src/
│   ├── components/
│   │   ├── layout/           # Layout components
│   │   ├── onboarding/       # Onboarding wizard components
│   │   ├── ui/              # Reusable UI components
│   │   └── verification/    # Company verification components
│   ├── contexts/            # React contexts
│   ├── pages/              # Page components
│   ├── lib/                # API and utility functions
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
└── package.json

referconnect-backend/
├── app/
│   ├── api/v1/endpoints/   # API endpoints
│   ├── core/              # Core configuration
│   ├── models/            # Database models
│   ├── schemas/           # Pydantic schemas
│   └── services/          # Business logic
├── alembic/               # Database migrations
└── requirements.txt
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Git

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rk2002purna/referConnect.git
   cd referConnect/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your API URL
   ```

4. **Start development server**
   ```bash
   npm start
   ```

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd ../backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Database setup**
   ```bash
   alembic upgrade head
   python seed_verification_data.py
   ```

6. **Start development server**
   ```bash
   uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000 --reload
   ```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_DEBUG=false
```

#### Backend (.env)
```env
DATABASE_URL=sqlite:///./referconnect.db
SECRET_KEY=your-secret-key
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=your-email@domain.com
```

## 📱 User Flows

### Job Seeker Flow
1. **Registration** → Basic info and role selection
2. **Onboarding** → Complete profile with skills, experience, resume
3. **Job Search** → Browse and apply for jobs
4. **Application Tracking** → Monitor application status
5. **Referral Requests** → Request referrals from employees

### Employee Flow
1. **Registration** → Basic info and role selection
2. **Company Verification** → Verify company email or upload ID
3. **Onboarding** → Complete professional profile
4. **Job Posting** → Create and manage job postings
5. **Referral Management** → Track and manage referrals

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (RBAC)
- **Input Validation** with Pydantic schemas
- **SQL Injection Protection** with SQLAlchemy ORM
- **CORS Configuration** for secure cross-origin requests
- **File Upload Security** with type and size validation

## 📊 Database Schema

### Core Tables
- **users**: User accounts and basic information
- **job_seekers**: Job seeker specific data
- **employees**: Employee specific data
- **companies**: Company information
- **verified_companies**: Pre-verified company database
- **experiences**: Work experience records
- **educations**: Education records
- **certifications**: Professional certifications

## 🧪 Testing

### Frontend Testing
```bash
npm test
```

### Backend Testing
```bash
pytest
```

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the build/ directory to your hosting service
```

### Backend Deployment
```bash
# Use a production WSGI server like Gunicorn
gunicorn app.main:create_app --factory
```

## 📈 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh access token

### Profile Management
- `GET /api/v1/profile/me` - Get user profile
- `PUT /api/v1/profile/me` - Update user profile
- `GET /api/v1/profile/me/completion` - Get profile completion status
- `PUT /api/v1/profile/me/jobseeker` - Update job seeker profile
- `PUT /api/v1/profile/me/employee` - Update employee profile

### Company Verification
- `GET /api/v1/verification/companies` - List verified companies
- `POST /api/v1/verification/send-otp` - Send verification OTP
- `POST /api/v1/verification/verify-otp` - Verify OTP

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Development**: FastAPI, SQLAlchemy, Python
- **Frontend Development**: React, TypeScript, Tailwind CSS
- **Database Design**: SQLite with proper normalization
- **Authentication**: JWT-based security system

## 🐛 Known Issues

- None currently reported

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced job matching algorithms
- [ ] Mobile app development
- [ ] Analytics dashboard
- [ ] Integration with LinkedIn API
- [ ] Advanced search filters
- [ ] Referral tracking and analytics

## 📞 Support

For support, email support@referconnect.com or create an issue in the repository.

---

**ReferConnect** - Connecting professionals through trusted referrals 🚀