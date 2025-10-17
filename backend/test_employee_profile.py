#!/usr/bin/env python3
"""
Comprehensive test suite for Employee Profile functionality
Tests all API endpoints, data validation, and business logic
"""

import requests
import json
import pytest
from datetime import datetime
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test.employee@techcorp.com"
TEST_PASSWORD = "testpassword123"

class EmployeeProfileTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.employee_id = None

    def authenticate(self, email: str, password: str) -> bool:
        """Authenticate and get access token"""
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={"email": email, "password": password}
            )
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_id = data.get("user_id")
                self.session.headers.update({
                    "Authorization": f"Bearer {self.auth_token}"
                })
                return True
            return False
        except Exception as e:
            print(f"Authentication failed: {e}")
            return False

    def test_get_employee_profile(self) -> Dict[str, Any]:
        """Test getting employee profile"""
        print("Testing GET /employee-profile/me...")
        
        response = self.session.get(f"{self.base_url}/employee-profile/me")
        
        if response.status_code == 200:
            profile = response.json()
            print("✅ Profile retrieved successfully")
            print(f"   User: {profile.get('first_name')} {profile.get('last_name')}")
            print(f"   Email: {profile.get('email')}")
            print(f"   Verification: {'Verified' if profile.get('is_email_verified') else 'Pending'}")
            print(f"   Profile Completion: {profile.get('metrics', {}).get('profile_completion', 0)}%")
            return profile
        else:
            print(f"❌ Failed to get profile: {response.status_code} - {response.text}")
            return {}

    def test_update_basic_info(self) -> bool:
        """Test updating basic information"""
        print("\nTesting PUT /employee-profile/me (Basic Info)...")
        
        update_data = {
            "first_name": "Sarah",
            "last_name": "Johnson",
            "bio": "Experienced software engineer with 8+ years in fintech. Passionate about building scalable systems and mentoring junior developers.",
            "linkedin_url": "https://linkedin.com/in/sarah-johnson-dev",
            "phone": "+1 (555) 123-4567",
            "location": "San Francisco, CA"
        }
        
        response = self.session.put(
            f"{self.base_url}/employee-profile/me",
            json=update_data
        )
        
        if response.status_code == 200:
            print("✅ Basic information updated successfully")
            return True
        else:
            print(f"❌ Failed to update basic info: {response.status_code} - {response.text}")
            return False

    def test_update_company_details(self) -> bool:
        """Test updating company details"""
        print("\nTesting PUT /employee-profile/me (Company Details)...")
        
        update_data = {
            "job_title": "Senior Software Engineer",
            "department": "Platform Engineering",
            "office_location": "San Francisco, CA",
            "years_at_company": "3-4 years"
        }
        
        response = self.session.put(
            f"{self.base_url}/employee-profile/me",
            json=update_data
        )
        
        if response.status_code == 200:
            print("✅ Company details updated successfully")
            return True
        else:
            print(f"❌ Failed to update company details: {response.status_code} - {response.text}")
            return False

    def test_update_referral_preferences(self) -> bool:
        """Test updating referral preferences"""
        print("\nTesting PUT /employee-profile/me (Referral Preferences)...")
        
        update_data = {
            "referral_roles": ["Software Engineer", "Frontend Developer", "DevOps Engineer", "Product Manager"],
            "preferred_referral_method": "platform_portal",
            "notification_preferences": {
                "new_referral_requests": True,
                "referral_status_updates": True,
                "weekly_activity_summary": False
            }
        }
        
        response = self.session.put(
            f"{self.base_url}/employee-profile/me",
            json=update_data
        )
        
        if response.status_code == 200:
            print("✅ Referral preferences updated successfully")
            return True
        else:
            print(f"❌ Failed to update referral preferences: {response.status_code} - {response.text}")
            return False

    def test_update_privacy_settings(self) -> bool:
        """Test updating privacy settings"""
        print("\nTesting PUT /employee-profile/me (Privacy Settings)...")
        
        update_data = {
            "profile_visibility": "all_users",
            "show_contact_info": True,
            "show_referral_history": True
        }
        
        response = self.session.put(
            f"{self.base_url}/employee-profile/me",
            json=update_data
        )
        
        if response.status_code == 200:
            print("✅ Privacy settings updated successfully")
            return True
        else:
            print(f"❌ Failed to update privacy settings: {response.status_code} - {response.text}")
            return False

    def test_update_compliance_settings(self) -> bool:
        """Test updating compliance settings"""
        print("\nTesting PUT /employee-profile/me (Compliance Settings)...")
        
        update_data = {
            "referral_guidelines_acknowledged": True,
            "data_processing_consent": True,
            "marketing_consent": False
        }
        
        response = self.session.put(
            f"{self.base_url}/employee-profile/me",
            json=update_data
        )
        
        if response.status_code == 200:
            print("✅ Compliance settings updated successfully")
            return True
        else:
            print(f"❌ Failed to update compliance settings: {response.status_code} - {response.text}")
            return False

    def test_email_verification_initiation(self) -> bool:
        """Test initiating email verification"""
        print("\nTesting POST /employee-profile/me/verify-email...")
        
        verification_data = {
            "company_email": "sarah.johnson@techcorp.com",
            "company_id": 1
        }
        
        response = self.session.post(
            f"{self.base_url}/employee-profile/me/verify-email",
            json=verification_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Email verification initiated successfully")
            print(f"   Verification Required: {result.get('verification_required')}")
            print(f"   OTP Sent: {result.get('otp_sent')}")
            return True
        else:
            print(f"❌ Failed to initiate email verification: {response.status_code} - {response.text}")
            return False

    def test_get_profile_metrics(self) -> bool:
        """Test getting profile metrics"""
        print("\nTesting GET /employee-profile/me/metrics...")
        
        response = self.session.get(f"{self.base_url}/employee-profile/me/metrics")
        
        if response.status_code == 200:
            metrics = response.json()
            print("✅ Profile metrics retrieved successfully")
            print(f"   Total Referrals: {metrics.get('metrics', {}).get('total_referrals', 0)}")
            print(f"   Successful Hires: {metrics.get('metrics', {}).get('successful_hires', 0)}")
            print(f"   Success Rate: {metrics.get('metrics', {}).get('success_rate', 0)}%")
            print(f"   Profile Completion: {metrics.get('profile_completion', 0)}%")
            return True
        else:
            print(f"❌ Failed to get profile metrics: {response.status_code} - {response.text}")
            return False

    def test_get_profile_completion(self) -> bool:
        """Test getting profile completion details"""
        print("\nTesting GET /employee-profile/me/completion...")
        
        response = self.session.get(f"{self.base_url}/employee-profile/me/completion")
        
        if response.status_code == 200:
            completion = response.json()
            print("✅ Profile completion details retrieved successfully")
            print(f"   Completion Percentage: {completion.get('completion_percentage', 0)}%")
            print(f"   Missing Fields: {len(completion.get('missing_fields', []))}")
            print(f"   Sections Complete: {completion.get('sections_complete', {})}")
            return True
        else:
            print(f"❌ Failed to get profile completion: {response.status_code} - {response.text}")
            return False

    def test_upload_profile_picture(self) -> bool:
        """Test uploading profile picture"""
        print("\nTesting POST /employee-profile/me/profile-picture...")
        
        # Create a dummy image file
        dummy_image_content = b"dummy image content for testing"
        files = {
            'file': ('test_image.jpg', dummy_image_content, 'image/jpeg')
        }
        
        response = self.session.post(
            f"{self.base_url}/employee-profile/me/profile-picture",
            files=files
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Profile picture uploaded successfully")
            print(f"   Image URL: {result.get('profile_picture_url')}")
            return True
        else:
            print(f"❌ Failed to upload profile picture: {response.status_code} - {response.text}")
            return False

    def test_validation_errors(self) -> bool:
        """Test validation error handling"""
        print("\nTesting validation error handling...")
        
        # Test invalid email format
        invalid_data = {
            "company_email": "invalid-email-format"
        }
        
        response = self.session.put(
            f"{self.base_url}/employee-profile/me",
            json=invalid_data
        )
        
        if response.status_code == 422:
            print("✅ Email validation working correctly")
        else:
            print(f"❌ Email validation not working: {response.status_code}")
            return False
        
        # Test invalid referral method
        invalid_data = {
            "preferred_referral_method": "invalid_method"
        }
        
        response = self.session.put(
            f"{self.base_url}/employee-profile/me",
            json=invalid_data
        )
        
        if response.status_code == 422:
            print("✅ Referral method validation working correctly")
        else:
            print(f"❌ Referral method validation not working: {response.status_code}")
            return False
        
        return True

    def test_unauthorized_access(self) -> bool:
        """Test unauthorized access protection"""
        print("\nTesting unauthorized access protection...")
        
        # Remove authorization header
        original_headers = self.session.headers.copy()
        del self.session.headers['Authorization']
        
        response = self.session.get(f"{self.base_url}/employee-profile/me")
        
        if response.status_code == 401:
            print("✅ Unauthorized access properly blocked")
            result = True
        else:
            print(f"❌ Unauthorized access not blocked: {response.status_code}")
            result = False
        
        # Restore authorization header
        self.session.headers.update(original_headers)
        return result

    def run_comprehensive_test(self) -> Dict[str, bool]:
        """Run all tests and return results"""
        print("🚀 Starting Comprehensive Employee Profile Test Suite")
        print("=" * 60)
        
        # Authenticate first
        if not self.authenticate(TEST_EMAIL, TEST_PASSWORD):
            print("❌ Authentication failed. Please check credentials.")
            return {"authentication": False}
        
        print(f"✅ Authenticated as {TEST_EMAIL}")
        
        # Run all tests
        results = {
            "authentication": True,
            "get_profile": self.test_get_employee_profile() != {},
            "update_basic_info": self.test_update_basic_info(),
            "update_company_details": self.test_update_company_details(),
            "update_referral_preferences": self.test_update_referral_preferences(),
            "update_privacy_settings": self.test_update_privacy_settings(),
            "update_compliance_settings": self.test_update_compliance_settings(),
            "email_verification": self.test_email_verification_initiation(),
            "get_metrics": self.test_get_profile_metrics(),
            "get_completion": self.test_get_profile_completion(),
            "upload_picture": self.test_upload_profile_picture(),
            "validation_errors": self.test_validation_errors(),
            "unauthorized_access": self.test_unauthorized_access()
        }
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 All tests passed! Employee Profile functionality is working correctly.")
        else:
            print("⚠️  Some tests failed. Please check the implementation.")
        
        return results

def main():
    """Main test runner"""
    tester = EmployeeProfileTester(BASE_URL)
    results = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if all(results.values()):
        exit(0)
    else:
        exit(1)

if __name__ == "__main__":
    main()
