# Database Setup for Employee Verification

This document explains how to set up the database for the employee verification system.

## Database Schema

The verification system requires the following tables:

### 1. verified_companies
Stores the list of verified companies that employees can select from.

```sql
CREATE TABLE verified_companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    industry VARCHAR(100),
    size VARCHAR(50),
    verified BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. employee_verifications
Tracks the verification status of each employee.

```sql
CREATE TABLE employee_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    verification_method VARCHAR(20) NOT NULL, -- 'email' or 'id_card'
    status VARCHAR(20) NOT NULL, -- 'pending_email', 'pending_id_card', 'verified', 'rejected', 'expired'
    personal_email VARCHAR(255),
    company_email VARCHAR(255),
    verified_at DATETIME,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES verified_companies(id)
);
```

### 3. otp_verifications
Manages OTP codes for email verification.

```sql
CREATE TABLE otp_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES verified_companies(id)
);
```

### 4. id_card_verifications
Handles manual ID card verification requests.

```sql
CREATE TABLE id_card_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    selfie_url VARCHAR(500),
    id_card_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    rejection_reason TEXT,
    reviewed_by INTEGER,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES verified_companies(id)
);
```

## Setup Instructions

### 1. Run the Seed Script

Execute the `seed_companies.sql` script to populate the verified companies:

```bash
# Using SQLite command line
sqlite3 referconnect.db < seed_companies.sql

# Or using a SQLite GUI tool like DB Browser for SQLite
```

### 2. Verify the Data

Check that the companies were inserted correctly:

```sql
SELECT * FROM verified_companies ORDER BY name;
```

You should see 20 companies including Google, Microsoft, Apple, Amazon, Meta, Netflix, Tesla, Uber, Airbnb, Stripe, Wipro, Infosys, TCS, Accenture, IBM, Oracle, Salesforce, Adobe, Spotify, and Zoom.

### 3. API Endpoints

The frontend expects these API endpoints to be available:

- `GET /api/v1/verification/companies?query=search_term` - Search companies
- `POST /api/v1/verification/send-otp` - Send OTP to company email
- `POST /api/v1/verification/verify-otp` - Verify OTP code
- `POST /api/v1/verification/upload-id-card` - Upload ID card for verification
- `GET /api/v1/verification/status` - Get user's verification status

## Adding New Companies

To add new companies to the database:

```sql
INSERT INTO verified_companies (name, domain, industry, size, verified) 
VALUES ('New Company', 'newcompany.com', 'Technology', '100-1,000', 1);
```

## Backend Implementation

The backend should implement the verification API endpoints that:

1. **Search Companies**: Query the `verified_companies` table with search filters
2. **Send OTP**: Generate and store OTP in `otp_verifications` table
3. **Verify OTP**: Check OTP validity and update verification status
4. **Upload ID Card**: Store file URLs in `id_card_verifications` table
5. **Get Status**: Return current verification status for the user

## Security Considerations

- OTP codes should expire after 5 minutes
- Rate limit OTP requests (max 3 per hour per user)
- Validate file uploads (image types, size limits)
- Sanitize all user inputs
- Use HTTPS for all API endpoints
- Store file uploads securely (AWS S3, etc.)

## Testing

Test the verification flow with different scenarios:

1. **Email Verification**:
   - Select a company
   - Enter valid company email
   - Receive and verify OTP

2. **ID Card Verification**:
   - Select a company
   - Upload selfie and ID card
   - Wait for admin approval

3. **Error Cases**:
   - Invalid email domains
   - Expired OTP codes
   - Invalid file uploads
   - Network failures







