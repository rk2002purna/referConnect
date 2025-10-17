# ReferConnect Backend API

A robust FastAPI-based backend service for the ReferConnect professional referral platform.

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Role-based access control (Job Seeker, Employee)
- Secure password hashing with bcrypt
- CORS configuration for frontend integration

### 📊 Database Management
- SQLAlchemy ORM with SQLModel
- SQLite database with proper relationships
- Alembic database migrations
- Seeded verification data for companies

### 📧 Email Services
- SendGrid integration for email delivery
- OTP-based email verification
- Company verification emails
- Fallback email service support

### 🏢 Company Verification
- Pre-verified company database
- Domain-based email verification
- Company search and filtering
- Verification status tracking

### 👤 Profile Management
- Comprehensive user profiles
- Role-specific profile data
- Profile completion tracking
- File upload for resumes and documents

## 🛠️ Technology Stack

- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLModel** - SQL databases in Python, designed for simplicity
- **Pydantic** - Data validation using Python type annotations
- **Alembic** - Database migration tool
- **SendGrid** - Email delivery service
- **JWT** - JSON Web Token authentication
- **SQLite** - Lightweight database

## 📁 Project Structure

```
app/
├── api/
│   └── v1/
│       └── endpoints/          # API route handlers
│           ├── auth.py         # Authentication endpoints
│           ├── profile.py      # Profile management
│           └── verification.py # Company verification
├── core/
│   ├── config.py              # Application configuration
│   ├── security.py            # Security utilities
│   └── email.py               # Email service
├── models/
│   ├── base.py                # Base model classes
│   ├── user.py                # User-related models
│   └── verification.py        # Verification models
├── schemas/
│   ├── auth.py                # Authentication schemas
│   ├── profile.py             # Profile schemas
│   └── verification.py        # Verification schemas
├── services/
│   ├── auth_service.py        # Authentication logic
│   ├── profile_service.py     # Profile management
│   └── email_service.py       # Email handling
└── main.py                    # FastAPI application

alembic/                       # Database migrations
requirements.txt               # Python dependencies
.env.example                   # Environment variables template
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip (Python package installer)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rk2002purna/referConnect.git
   cd referConnect/backend
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

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=sqlite:///./referconnect.db

# Security
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=your-email@domain.com

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

# Debug
DEBUG=True
```

## 📊 Database Schema

### Core Models

#### User Model
```python
class User(TimestampedModel):
    id: Optional[int] = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    email_domain: str = Field(index=True)
    is_email_verified: bool = Field(default=False)
    is_active: bool = Field(default=True)
    role: UserRole = Field(index=True)
    hashed_password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    # ... other fields
```

#### Job Seeker Model
```python
class JobSeeker(TimestampedModel):
    id: Optional[int] = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    skills: Optional[str] = None
    years_experience: Optional[int] = None
    current_company: Optional[str] = None
    privacy_excluded_companies: Optional[str] = None
    trust_score: int = Field(default=0)
    resume_filename: Optional[str] = None
    resume_path: Optional[str] = None
```

#### Employee Model
```python
class Employee(TimestampedModel):
    id: Optional[int] = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    company_id: Optional[int] = Field(foreign_key="companies.id")
    title: Optional[str] = None
    badges: Optional[str] = None
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/refresh` - Refresh access token

### Profile Management
- `GET /api/v1/profile/me` - Get user profile
- `PUT /api/v1/profile/me` - Update user profile
- `GET /api/v1/profile/me/completion` - Get profile completion status
- `PUT /api/v1/profile/me/jobseeker` - Update job seeker profile
- `PUT /api/v1/profile/me/employee` - Update employee profile

### Company Verification
- `GET /api/v1/verification/companies` - List verified companies
- `GET /api/v1/verification/status` - Get verification status
- `POST /api/v1/verification/send-otp` - Send verification OTP
- `POST /api/v1/verification/verify-otp` - Verify OTP

### Health Check
- `GET /health` - API health status

## 🧪 Testing

### Run Tests
```bash
pytest
```

### Run with Coverage
```bash
pytest --cov=app
```

## 📈 Database Migrations

### Create Migration
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply Migrations
```bash
alembic upgrade head
```

### Rollback Migration
```bash
alembic downgrade -1
```

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   export DATABASE_URL=postgresql://user:password@localhost/referconnect
   export SECRET_KEY=your-production-secret-key
   export SENDGRID_API_KEY=your-production-sendgrid-key
   ```

2. **Database Migration**
   ```bash
   alembic upgrade head
   ```

3. **Start Production Server**
   ```bash
   gunicorn app.main:create_app --factory -w 4 -k uvicorn.workers.UvicornWorker
   ```

### Docker Deployment

```dockerfile
FROM python:3.8-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **Input Validation** with Pydantic schemas
- **SQL Injection Protection** with SQLAlchemy ORM
- **CORS Configuration** for secure cross-origin requests
- **Rate Limiting** (can be added with FastAPI middleware)

## 📝 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL in .env file
   - Ensure database file exists and is accessible

2. **Email Service Error**
   - Verify SENDGRID_API_KEY is correct
   - Check SENDGRID_FROM_EMAIL is valid

3. **CORS Error**
   - Add frontend URL to ALLOWED_ORIGINS
   - Check CORS configuration

## 📞 Support

For support, email backend-support@referconnect.com or create an issue in the repository.

---

**ReferConnect Backend** - Powering professional referrals with FastAPI 🚀