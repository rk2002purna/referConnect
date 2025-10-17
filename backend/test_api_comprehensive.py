#!/usr/bin/env python3
"""
Comprehensive API Test Script for ReferConnect Backend
Tests all authentication endpoints and core functionality
"""

import requests
import json
import time
from typing import Dict, Any

# API Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.user_data = {}
        
    def print_header(self, title: str):
        print(f"\n{'='*60}")
        print(f"🧪 {title}")
        print(f"{'='*60}")
        
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
    
    def test_health_check(self):
        """Test health check endpoint"""
        self.print_header("Health Check")
        
        # Health check is at root level, not under /api/v1
        try:
            response = self.session.get(f"{BASE_URL}/health")
            result = {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "headers": dict(response.headers)
            }
        except Exception as e:
            result = {
                "status_code": 0,
                "data": {"error": str(e)},
                "headers": {}
            }
        
        success = result["status_code"] == 200 and "status" in result["data"]
        
        self.print_result(
            "Health Check",
            success,
            f"Status: {result['status_code']}, Response: {result['data']}"
        )
        
        return success
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        self.print_header("User Registration")
        
        # Test data - use unique emails to avoid conflicts
        import time
        timestamp = int(time.time())
        test_users = [
            {
                "email": f"testuser1_{timestamp}@acme.com",
                "password": "TestPassword123!",
                "role": "employee"
            },
            {
                "email": f"testuser2_{timestamp}@example.com", 
                "password": "TestPassword123!",
                "role": "jobseeker"
            }
        ]
        
        # Store emails for login test
        self._test_emails = [user["email"] for user in test_users]
        
        success_count = 0
        
        for i, user_data in enumerate(test_users, 1):
            result = self.make_request("POST", "/auth/register", user_data)
            success = result["status_code"] == 201 and "id" in result["data"]
            
            if success:
                self.user_data[f"user{i}"] = result["data"]
                success_count += 1
                
            self.print_result(
                f"Register User {i} ({user_data['email']})",
                success,
                f"Status: {result['status_code']}, ID: {result['data'].get('id', 'N/A')}"
            )
        
        return success_count == len(test_users)
    
    def test_user_login(self):
        """Test user login endpoint"""
        self.print_header("User Login")
        
        # Test login for registered users - use the same emails from registration
        if not hasattr(self, '_test_emails'):
            # Fallback to existing users if registration failed
            login_data = [
                {
                    "email": "testuser1@acme.com",
                    "password": "TestPassword123!"
                },
                {
                    "email": "testuser2@example.com",
                    "password": "TestPassword123!"
                }
            ]
        else:
            login_data = [
                {
                    "email": self._test_emails[0],
                    "password": "TestPassword123!"
                },
                {
                    "email": self._test_emails[1],
                    "password": "TestPassword123!"
                }
            ]
        
        success_count = 0
        
        for i, login_info in enumerate(login_data, 1):
            result = self.make_request("POST", "/auth/login", login_info)
            success = result["status_code"] == 200 and "access_token" in result["data"]
            
            if success:
                self.tokens[f"user{i}"] = result["data"]["access_token"]
                self.tokens[f"refresh_user{i}"] = result["data"]["refresh_token"]
                success_count += 1
                
            self.print_result(
                f"Login User {i} ({login_info['email']})",
                success,
                f"Status: {result['status_code']}, Token: {'Yes' if success else 'No'}"
            )
        
        return success_count == len(login_data)
    
    def test_token_refresh(self):
        """Test token refresh endpoint"""
        self.print_header("Token Refresh")
        
        if not self.tokens:
            self.print_result("Token Refresh", False, "No tokens available")
            return False
        
        # Get refresh token from stored tokens
        refresh_token = None
        for key, token in self.tokens.items():
            if key.startswith("refresh_"):
                refresh_token = token
                break
        
        if not refresh_token:
            self.print_result("Token Refresh", False, "No refresh token available")
            return False
            
        refresh_data = {"refresh_token": refresh_token}
        
        result = self.make_request("POST", "/auth/refresh", refresh_data)
        success = result["status_code"] == 200 and "access_token" in result["data"]
        
        if success:
            self.tokens["refreshed"] = result["data"]["access_token"]
            
        self.print_result(
            "Token Refresh",
            success,
            f"Status: {result['status_code']}, New Token: {'Yes' if success else 'No'}"
        )
        
        return success
    
    def test_get_current_user(self):
        """Test get current user endpoint"""
        self.print_header("Get Current User")
        
        if not self.tokens:
            self.print_result("Get Current User", False, "No tokens available")
            return False
        
        success_count = 0
        
        for user_name, token in self.tokens.items():
            # Skip refresh tokens - they're not access tokens
            if user_name.startswith("refresh_"):
                continue
                
            headers = {"Authorization": f"Bearer {token}"}
            result = self.make_request("GET", "/auth/me", headers=headers)
            success = result["status_code"] == 200 and "email" in result["data"]
            
            if success:
                success_count += 1
                
            self.print_result(
                f"Get User Info ({user_name})",
                success,
                f"Status: {result['status_code']}, Email: {result['data'].get('email', 'N/A')}"
            )
        
        return success_count > 0
    
    def test_invalid_credentials(self):
        """Test invalid credentials handling"""
        self.print_header("Invalid Credentials Test")
        
        # Test invalid login
        invalid_login = {
            "email": "nonexistent@example.com",
            "password": "WrongPassword123!"
        }
        
        result = self.make_request("POST", "/auth/login", invalid_login)
        success = result["status_code"] == 401
        
        self.print_result(
            "Invalid Login",
            success,
            f"Status: {result['status_code']}, Expected: 401"
        )
        
        # Test invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token_here"}
        result = self.make_request("GET", "/auth/me", headers=invalid_headers)
        success = result["status_code"] == 401
        
        self.print_result(
            "Invalid Token",
            success,
            f"Status: {result['status_code']}, Expected: 401"
        )
        
        return success
    
    def test_duplicate_registration(self):
        """Test duplicate email registration"""
        self.print_header("Duplicate Registration Test")
        
        # Try to register same email again
        duplicate_user = {
            "email": "testuser1@acme.com",
            "password": "TestPassword123!",
            "role": "employee"
        }
        
        result = self.make_request("POST", "/auth/register", duplicate_user)
        success = result["status_code"] == 400
        
        self.print_result(
            "Duplicate Email Registration",
            success,
            f"Status: {result['status_code']}, Expected: 400"
        )
        
        return success
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Comprehensive API Tests for ReferConnect Backend")
        print(f"🌐 Testing against: {BASE_URL}")
        
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Token Refresh", self.test_token_refresh),
            ("Get Current User", self.test_get_current_user),
            ("Invalid Credentials", self.test_invalid_credentials),
            ("Duplicate Registration", self.test_duplicate_registration)
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
        
        print(f"\n📊 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Your API is working perfectly!")
        else:
            print("⚠️  Some tests failed. Check the details above.")
        
        return results

def main():
    """Main function to run API tests"""
    print("🔧 ReferConnect API Tester")
    print("=" * 50)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Server is not responding properly")
            return
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to server. Make sure it's running on localhost:8000")
        print("💡 Run: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return
    
    # Run tests
    tester = APITester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    if all(results.values()):
        exit(0)
    else:
        exit(1)

if __name__ == "__main__":
    main()
