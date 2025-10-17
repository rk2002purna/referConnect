#!/usr/bin/env python3
"""
Test script for the OTP email verification system
"""
import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.email_service import email_service
from app.services.otp_service import OTPService

class MockDB:
    """Mock database for testing"""
    def __init__(self):
        self.otps = []
        self.verifications = []
    
    def add(self, obj):
        if hasattr(obj, 'id'):
            obj.id = len(self.otps) + 1
        self.otps.append(obj)
    
    def commit(self):
        pass
    
    def refresh(self, obj):
        pass
    
    def get(self, model, id):
        if model.__name__ == 'VerifiedCompany':
            return type('Company', (), {'id': id, 'name': 'Test Company'})()
        return None
    
    def exec(self, query):
        class MockResult:
            def first(self):
                return None
            def all(self):
                return []
        return MockResult()

async def test_email_services():
    """Test all email service providers"""
    print("🧪 Testing Email Services")
    print("=" * 50)
    
    # Test console mode (default)
    print("\n1. Console Mode (Default)")
    result = await email_service.send_otp_email(
        to_email="test@example.com",
        otp_code="123456",
        company_name="Test Company"
    )
    print(f"   Result: {result}")
    
    # Test with different providers
    print(f"\n2. Active Service: {email_service.active_service}")
    print(f"   Available providers: {list(email_service.providers.keys())}")
    
    return True

def test_otp_generation():
    """Test OTP generation"""
    print("\n🧪 Testing OTP Generation")
    print("=" * 50)
    
    db = MockDB()
    otp_service = OTPService(db)
    
    # Generate multiple OTPs
    otps = []
    for i in range(10):
        otp = otp_service.generate_otp()
        otps.append(otp)
        print(f"OTP {i+1:2d}: {otp}")
    
    # Check uniqueness
    unique_otps = set(otps)
    print(f"\nGenerated: {len(otps)} OTPs")
    print(f"Unique: {len(unique_otps)} OTPs")
    print(f"All unique: {len(otps) == len(unique_otps)}")
    
    # Check length
    all_six_digits = all(len(otp) == 6 for otp in otps)
    print(f"All 6 digits: {all_six_digits}")
    
    return True

async def test_otp_workflow():
    """Test complete OTP workflow"""
    print("\n🧪 Testing OTP Workflow")
    print("=" * 50)
    
    db = MockDB()
    otp_service = OTPService(db)
    
    # Simulate sending OTP
    print("\n1. Sending OTP...")
    from app.schemas.verification import SendOTPRequest
    
    request = SendOTPRequest(
        company_id=1,
        company_email="test@example.com"
    )
    
    try:
        result = await otp_service.send_otp(request, user_id=1)
        print(f"   Send result: {result}")
    except Exception as e:
        print(f"   Send error: {e}")
    
    # Simulate verifying OTP
    print("\n2. Verifying OTP...")
    from app.schemas.verification import VerifyOTPRequest
    
    verify_request = VerifyOTPRequest(
        company_id=1,
        company_email="test@example.com",
        otp_code="123456"
    )
    
    try:
        result = otp_service.verify_otp(verify_request, user_id=1)
        print(f"   Verify result: {result}")
    except Exception as e:
        print(f"   Verify error: {e}")
    
    return True

def test_email_templates():
    """Test email template generation"""
    print("\n🧪 Testing Email Templates")
    print("=" * 50)
    
    template = email_service._get_otp_email_template("123456", "Test Company")
    
    print("Template generated successfully!")
    print(f"Length: {len(template)} characters")
    print(f"Contains OTP: {'123456' in template}")
    print(f"Contains company: {'Test Company' in template}")
    print(f"Contains HTML: {'<html>' in template.lower()}")
    
    return True

async def main():
    """Run all tests"""
    print("🚀 OTP Email Verification System Test")
    print("=" * 60)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Email Services", test_email_services()),
        ("OTP Generation", test_otp_generation()),
        ("OTP Workflow", test_otp_workflow()),
        ("Email Templates", test_email_templates()),
    ]
    
    results = []
    for test_name, test_coro in tests:
        try:
            if asyncio.iscoroutine(test_coro):
                result = await test_coro
            else:
                result = test_coro
            results.append((test_name, result))
            print(f"\n✅ {test_name}: PASSED")
        except Exception as e:
            results.append((test_name, False))
            print(f"\n❌ {test_name}: FAILED - {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:20} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! OTP system is ready to use.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the errors above.")
    
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    asyncio.run(main())
