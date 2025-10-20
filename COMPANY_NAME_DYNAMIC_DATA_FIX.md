# Company Name Dynamic Data Fix

## Problem
The "Company Information" section in the employee profile was showing static data:
- Company Name: "TechCorp Inc." (hardcoded)
- Years at Company: 0 (hardcoded)

The data should be dynamically populated from the onboarding flow where users select their company and enter their information.

## Solution Overview

### Data Flow
1. **Company Selection** (Onboarding Step 3 - Company Search):
   - User searches and selects their company
   - Company data is saved to `data.verification.company_name`, `data.verification.company_id`, and `data.verification.company_domain`

2. **Company Information** (Onboarding Step 6 - Company Info):
   - User enters job title, department, years at company, and office location
   - Data is saved to `data.employee` object

3. **Onboarding Completion**:
   - All company data is collected and saved to localStorage as `employee_company_data`
   - Data structure:
     ```json
     {
       "company_name": "Selected Company Name",
       "company_industry": "Technology",
       "company_email": "user@company.com",
       "office_location": "City, State",
       "job_title": "Software Engineer",
       "department": "Engineering",
       "years_at_company": 3
     }
     ```

4. **Employee Profile Loading**:
   - Profile loads data from localStorage (`employee_company_data`)
   - Falls back to verification data if localStorage is empty
   - Displays dynamic data in the Company Information section

## Changes Made

### 1. OnboardingWizard.tsx
**File**: `src/components/onboarding/OnboardingWizard.tsx`

**Changes**:
- Added company data collection during onboarding completion
- Saves all company-related data to localStorage
- Added comprehensive console logging for debugging

**Key Code Section** (lines 298-320):
```typescript
// Save employee company data to localStorage for the EmployeeProfile component
const companyData = {
  company_name: data.verification?.company_name || '',
  company_industry: 'Technology',
  company_email: data.verification?.company_email || data.email,
  office_location: data.employee?.office_location || data.location || '',
  job_title: data.employee?.job_title || '',
  department: data.employee?.department || '',
  years_at_company: data.employee?.years_at_company || 0
}

localStorage.setItem('employee_company_data', JSON.stringify(companyData))
```

### 2. EmployeeProfile.tsx
**File**: `src/pages/EmployeeProfile.tsx`

**Changes**:
- Updated company data type definition to include `company_name`
- Removed hardcoded fallback values
- Changed priority to use localStorage data first, then verification data
- Added comprehensive console logging for debugging

**Key Code Sections**:

**Data Loading** (lines 181-216):
```typescript
// Load company data from localStorage
const savedCompanyData = localStorage.getItem('employee_company_data')
let companyData: {
  company_name?: string
  company_industry?: string
  company_email?: string
  office_location?: string
  job_title?: string
  department?: string
  years_at_company?: number
} = {}

if (savedCompanyData) {
  companyData = JSON.parse(savedCompanyData)
}
```

**Data Mapping** (line 218):
```typescript
company_name: companyData.company_name || verification?.company_name || '',
years_at_company: companyData.years_at_company || 0,
```

## Testing Instructions

### 1. Test New Employee Onboarding
1. Register as a new employee user
2. Go through the onboarding process:
   - **Basic Info**: Enter name, phone, location
   - **Verification Method**: Select email or ID card verification
   - **Company Search**: Search and select your company (e.g., "Google", "Microsoft")
   - **Company Email**: Enter company email
   - **OTP Verification**: Verify email with OTP
   - **Company Info**: Enter:
     - Job Title (e.g., "Software Engineer")
     - Department (e.g., "Engineering")
     - Years at Company (e.g., 3)
     - Office Location (e.g., "San Francisco, CA")
   - **Referral Preferences**: Set preferences
3. Complete onboarding
4. Navigate to Employee Profile
5. **Verify**: Company Information section should show:
   - Company Name: Your selected company (not "TechCorp Inc.")
   - Years at Company: Your entered value (not 0)
   - Job Title, Department, Office Location: Your entered values

### 2. Debugging Steps

#### Check Browser Console
Open browser DevTools (F12) and check console logs:

**During Onboarding Completion**:
- Look for: `"Company selected:"` - should show the selected company object
- Look for: `"Updated verification data:"` - should include company_name
- Look for: `"Onboarding completion - verification data:"` - should include company_name
- Look for: `"Company data to be saved:"` - should show all company data
- Look for: `"Verification - data saved to localStorage:"` - should show JSON string

**During Profile Loading**:
- Look for: `"Loaded company data from localStorage:"` - should show parsed company data
- Look for: `"Final company name mapping:"` - should show the resolved company name

#### Check localStorage
In browser DevTools Console, run:
```javascript
// Check if data is saved
localStorage.getItem('employee_company_data')

// Parse and view data
JSON.parse(localStorage.getItem('employee_company_data'))
```

Expected output:
```json
{
  "company_name": "Google",
  "company_industry": "Technology",
  "company_email": "user@google.com",
  "office_location": "Mountain View, CA",
  "job_title": "Software Engineer",
  "department": "Engineering",
  "years_at_company": 3
}
```

### 3. Test Existing Employee
For employees who have already completed onboarding:

**Option A: Clear localStorage and Re-onboard**
1. In browser console: `localStorage.removeItem('employee_company_data')`
2. Go through onboarding again
3. Check if data is now saved correctly

**Option B: Manually Set localStorage**
1. In browser console:
```javascript
localStorage.setItem('employee_company_data', JSON.stringify({
  company_name: "Your Company Name",
  company_industry: "Technology",
  company_email: "you@company.com",
  office_location: "Your Location",
  job_title: "Your Title",
  department: "Your Department",
  years_at_company: 5
}))
```
2. Reload the Employee Profile page
3. Verify the data is displayed

## Known Issues & Limitations

1. **Backend Limitation**: The backend doesn't currently store all company fields (department, years_at_company, etc.), so we're using localStorage as a workaround.

2. **Company Industry**: Currently defaulted to "Technology". To make this dynamic, the Company table in the backend needs to include an industry field.

3. **Data Persistence**: If a user clears their browser data, the company information will be lost. Consider implementing backend storage for these fields in the future.

4. **Multiple Devices**: Since data is stored in localStorage, it won't sync across devices. Users will need to re-enter information on different devices.

## Future Enhancements

1. **Backend Storage**: Add company information fields to the User or EmployeeProfile model in the backend
2. **Dynamic Industry**: Fetch company industry from the Companies table
3. **Company Logo**: Integrate company logo display from company data
4. **Real-time Sync**: Use API to store and retrieve company data instead of localStorage

## Console Logs for Debugging

All console logs are prefixed with clear descriptions:
- `"Company selected:"` - When user selects a company
- `"Updated verification data:"` - After verification data is updated
- `"Updating onboarding data with:"` - Every time onboarding data changes
- `"Onboarding completion - verification data:"` - During onboarding save
- `"Company data to be saved:"` - Before saving to localStorage
- `"Loaded company data from localStorage:"` - When profile loads data
- `"Final company name mapping:"` - Final resolution of company name

These logs help trace the data flow from company selection through to profile display.

