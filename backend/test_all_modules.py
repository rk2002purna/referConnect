#!/usr/bin/env python3
"""
Comprehensive test for all ReferConnect Backend modules
Tests authentication, users, jobs, referrals, search, notifications, analytics, and trust
"""

import requests
import json
import time
from typing import Dict, Any

# API Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

class AllModulesTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_data = {}
        
    def print_header(self, title: str):
        print(f"\n{'='*70}")
        print(f"🧪 {title}")
        print(f"{'='*70}")
        
    def print_result(self, test_name: str, success: bool, details: str = ""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   📝 {details}")
            
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> Dict:
        """Make HTTP request and return response data"""
        url = f"{API_BASE}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "headers": dict(response.headers)
            }
        except Exception as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "headers": {}
            }
    
    def test_authentication_module(self):
        """Test authentication endpoints"""
        self.print_header("Authentication Module")
        
        # Test registration
        user_data = {
            "email": f"testuser_{int(time.time())}@example.com",
            "password": "TestPassword123!",
            "role": "employee"
        }
        
        result = self.make_request("POST", "/auth/register", user_data)
        success = result["status_code"] in [200, 201]
        self.print_result("User Registration", success, f"Status: {result['status_code']}")
        
        if success:
            self.test_data["user_email"] = user_data["email"]
            
            # Test login
            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }
            
            result = self.make_request("POST", "/auth/login", login_data)
            success = result["status_code"] == 200 and "access_token" in result["data"]
            self.print_result("User Login", success, f"Status: {result['status_code']}")
            
            if success:
                self.tokens["user"] = result["data"]["access_token"]
                
                # Test get current user
                headers = {"Authorization": f"Bearer {self.tokens['user']}"}
                result = self.make_request("GET", "/auth/me", headers=headers)
                success = result["status_code"] == 200
                self.print_result("Get Current User", success, f"Status: {result['status_code']}")
        
        return success
    
    def test_user_module(self):
        """Test user management endpoints"""
        self.print_header("User Management Module")
        
        if not self.tokens.get("user"):
            self.print_result("User Module Tests", False, "No authentication token")
            return False
        
        headers = {"Authorization": f"Bearer {self.tokens['user']}"}
        
        # Test get my profile
        result = self.make_request("GET", "/users/me", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get My Profile", success, f"Status: {result['status_code']}")
        
        # Test create employee profile
        profile_data = {
            "company_domain": "example.com",
            "title": "Senior Developer",
            "badges": "Python, FastAPI"
        }
        
        result = self.make_request("POST", "/users/me/employee", profile_data, headers)
        success = result["status_code"] in [200, 201, 400]  # 400 if already exists
        self.print_result("Create Employee Profile", success, f"Status: {result['status_code']}")
        
        # Test get employee profile
        result = self.make_request("GET", "/users/me/employee", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get Employee Profile", success, f"Status: {result['status_code']}")
        
        return success
    
    def test_job_module(self):
        """Test job management endpoints"""
        self.print_header("Job Management Module")
        
        if not self.tokens.get("user"):
            self.print_result("Job Module Tests", False, "No authentication token")
            return False
        
        headers = {"Authorization": f"Bearer {self.tokens['user']}"}
        
        # Test create job
        job_data = {
            "title": "Senior Python Developer",
            "description": "We are looking for a senior Python developer with FastAPI experience.",
            "location": "Remote",
            "employment_type": "full_time",
            "skills": "Python, FastAPI, SQLAlchemy",
            "min_experience": 3,
            "company_domain": "example.com"
        }
        
        result = self.make_request("POST", "/jobs/", job_data, headers)
        success = result["status_code"] in [200, 201]
        self.print_result("Create Job", success, f"Status: {result['status_code']}")
        
        if success and "id" in result["data"]:
            self.test_data["job_id"] = result["data"]["id"]
        
        # Test search jobs
        result = self.make_request("GET", "/jobs/", headers=headers)
        success = result["status_code"] == 200 and "jobs" in result["data"]
        self.print_result("Search Jobs", success, f"Status: {result['status_code']}")
        
        # Test get my jobs
        result = self.make_request("GET", "/jobs/my/jobs", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get My Jobs", success, f"Status: {result['status_code']}")
        
        return success
    
    def test_referral_module(self):
        """Test referral management endpoints"""
        self.print_header("Referral Management Module")
        
        if not self.tokens.get("user") or not self.test_data.get("job_id"):
            self.print_result("Referral Module Tests", False, "No token or job ID")
            return False
        
        headers = {"Authorization": f"Bearer {self.tokens['user']}"}
        
        # Test search referrals
        result = self.make_request("GET", "/referrals/", headers=headers)
        success = result["status_code"] == 200 and "referrals" in result["data"]
        self.print_result("Search Referrals", success, f"Status: {result['status_code']}")
        
        # Test get my referrals
        result = self.make_request("GET", "/referrals/my/referrals", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get My Referrals", success, f"Status: {result['status_code']}")
        
        # Test get referral stats
        result = self.make_request("GET", "/referrals/stats/overview", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get Referral Stats", success, f"Status: {result['status_code']}")
        
        return success
    
    def test_search_module(self):
        """Test search endpoints"""
        self.print_header("Search Module")
        
        if not self.tokens.get("user"):
            self.print_result("Search Module Tests", False, "No authentication token")
            return False
        
        headers = {"Authorization": f"Bearer {self.tokens['user']}"}
        
        # Test search all
        result = self.make_request("GET", "/search/?query=python", headers=headers)
        success = result["status_code"] == 200 and "results" in result["data"]
        self.print_result("Search All", success, f"Status: {result['status_code']}")
        
        # Test search jobs only
        result = self.make_request("GET", "/search/?query=developer&search_type=jobs", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Search Jobs", success, f"Status: {result['status_code']}")
        
        # Test search suggestions
        result = self.make_request("GET", "/search/suggestions?query=python", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Search Suggestions", success, f"Status: {result['status_code']}")
        
        # Test search analytics
        result = self.make_request("GET", "/search/analytics", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Search Analytics", success, f"Status: {result['status_code']}")
        
        return success
    
    def test_notification_module(self):
        """Test notification endpoints"""
        self.print_header("Notification Module")
        
        if not self.tokens.get("user"):
            self.print_result("Notification Module Tests", False, "No authentication token")
            return False
        
        headers = {"Authorization": f"Bearer {self.tokens['user']}"}
        
        # Test get notifications
        result = self.make_request("GET", "/notifications/", headers=headers)
        success = result["status_code"] == 200 and "notifications" in result["data"]
        self.print_result("Get Notifications", success, f"Status: {result['status_code']}")
        
        # Test get notification preferences
        result = self.make_request("GET", "/notifications/preferences", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get Notification Preferences", success, f"Status: {result['status_code']}")
        
        # Test update notification preferences
        preferences_data = {
            "user_id": 1,  # Will be ignored
            "email_notifications": True,
            "in_app_notifications": True,
            "sms_notifications": False,
            "push_notifications": True,
            "referral_notifications": True,
            "job_notifications": True,
            "system_notifications": True
        }
        
        result = self.make_request("PUT", "/notifications/preferences", preferences_data, headers)
        success = result["status_code"] == 200
        self.print_result("Update Notification Preferences", success, f"Status: {result['status_code']}")
        
        # Test get notification stats
        result = self.make_request("GET", "/notifications/stats/overview", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get Notification Stats", success, f"Status: {result['status_code']}")
        
        return success
    
    def test_analytics_module(self):
        """Test analytics endpoints"""
        self.print_header("Analytics Module")
        
        if not self.tokens.get("user"):
            self.print_result("Analytics Module Tests", False, "No authentication token")
            return False
        
        headers = {"Authorization": f"Bearer {self.tokens['user']}"}
        
        # Test get my analytics
        result = self.make_request("GET", "/analytics/my/stats", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get My Analytics", success, f"Status: {result['status_code']}")
        
        # Test get referral analytics
        result = self.make_request("GET", "/analytics/referrals", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get Referral Analytics", success, f"Status: {result['status_code']}")
        
        # Test get job analytics
        result = self.make_request("GET", "/analytics/jobs", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get Job Analytics", success, f"Status: {result['status_code']}")
        
        # Test get leaderboard
        result = self.make_request("GET", "/analytics/leaderboard/referrals", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get Leaderboard", success, f"Status: {result['status_code']}")
        
        return success
    
    def test_trust_module(self):
        """Test trust/fraud endpoints"""
        self.print_header("Trust/Fraud Module")
        
        if not self.tokens.get("user"):
            self.print_result("Trust Module Tests", False, "No authentication token")
            return False
        
        headers = {"Authorization": f"Bearer {self.tokens['user']}"}
        
        # Test get my trust score
        result = self.make_request("GET", "/trust/my/score", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get My Trust Score", success, f"Status: {result['status_code']}")
        
        # Test calculate trust score
        result = self.make_request("POST", "/trust/my/score/calculate", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Calculate Trust Score", success, f"Status: {result['status_code']}")
        
        # Test get trust analysis
        result = self.make_request("GET", "/trust/my/analysis", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get Trust Analysis", success, f"Status: {result['status_code']}")
        
        # Test get fraud alerts
        result = self.make_request("GET", "/trust/my/fraud-alerts", headers=headers)
        success = result["status_code"] == 200
        self.print_result("Get Fraud Alerts", success, f"Status: {result['status_code']}")
        
        return success
    
    def run_all_tests(self):
        """Run all module tests"""
        print("🚀 Starting Comprehensive Test Suite for ReferConnect Backend")
        print(f"🌐 Testing against: {BASE_URL}")
        
        # Check if server is running
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            if response.status_code != 200:
                print("❌ Server is not responding properly")
                return False
        except requests.exceptions.RequestException:
            print("❌ Cannot connect to server. Make sure it's running on localhost:8000")
            return False
        
        tests = [
            ("Authentication Module", self.test_authentication_module),
            ("User Management Module", self.test_user_module),
            ("Job Management Module", self.test_job_module),
            ("Referral Management Module", self.test_referral_module),
            ("Search Module", self.test_search_module),
            ("Notification Module", self.test_notification_module),
            ("Analytics Module", self.test_analytics_module),
            ("Trust/Fraud Module", self.test_trust_module),
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            try:
                results[test_name] = test_func()
            except Exception as e:
                print(f"❌ {test_name} - Exception: {e}")
                results[test_name] = False
        
        # Summary
        self.print_header("Test Summary")
        passed = sum(results.values())
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\n📊 Overall: {passed}/{total} modules passed")
        
        if passed == total:
            print("🎉 All modules are working perfectly!")
        else:
            print("⚠️  Some modules failed. Check the details above.")
        
        return results

def main():
    """Main function to run all module tests"""
    print("🔧 ReferConnect All Modules Tester")
    print("=" * 50)
    
    tester = AllModulesTester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    if all(results.values()):
        exit(0)
    else:
        exit(1)

if __name__ == "__main__":
    main()

