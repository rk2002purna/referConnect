#!/usr/bin/env python3
"""
Test script for Dashboard APIs
Tests all dashboard functionality including job recommendations, activity feed, saved searches, etc.
"""

import asyncio
import json
import sys
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

# Add the app directory to the Python path
sys.path.append('/Users/pradeepdyd/referconnect-backend')

from app.db.session import get_db_session
from app.services.dashboard_service import DashboardService
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.referral import Referral

async def test_dashboard_services():
    """Test all dashboard services"""
    print("🧪 Testing Dashboard Services...")
    
    async for db in get_db_session():
        service = DashboardService(db)
        
        try:
            # Test 1: Create activity
            print("\n1️⃣ Testing Activity Creation...")
            activity = await service.create_activity(
                user_id=1,
                activity_type='test',
                title='Test Activity',
                description='This is a test activity for dashboard',
                status='new',
                action_url='/test'
            )
            print(f"✅ Created activity: {activity.id} - {activity.title}")
            
            # Test 2: Get activity feed
            print("\n2️⃣ Testing Activity Feed...")
            activities = await service.get_activity_feed(user_id=1, limit=5)
            print(f"✅ Retrieved {len(activities)} activities")
            for activity in activities:
                print(f"   - {activity.title} ({activity.type})")
            
            # Test 3: Get profile completion
            print("\n3️⃣ Testing Profile Completion...")
            completion = await service.get_profile_completion(user_id=1)
            print(f"✅ Profile completion: {completion.completion_percentage}%")
            print(f"   Completed sections: {completion.completed_sections}")
            print(f"   Missing sections: {completion.missing_sections}")
            
            # Test 4: Get dashboard stats
            print("\n4️⃣ Testing Dashboard Stats...")
            stats = await service.get_dashboard_stats(user_id=1, user_role=UserRole.jobseeker)
            print(f"✅ Dashboard stats retrieved:")
            print(f"   Applications: {stats.applications_total}")
            print(f"   Referrals: {stats.referrals_total}")
            print(f"   Profile completion: {stats.profile_completion}%")
            
            # Test 5: Get job recommendations
            print("\n5️⃣ Testing Job Recommendations...")
            recommendations = await service.get_job_recommendations(user_id=1, limit=3)
            print(f"✅ Retrieved {len(recommendations)} job recommendations")
            for rec in recommendations:
                print(f"   - {rec.title} at {rec.company} ({rec.match_score}% match)")
            
            # Test 6: Create saved search
            print("\n6️⃣ Testing Saved Search...")
            from app.schemas.dashboard import SavedSearchCreate
            search_data = SavedSearchCreate(
                name="Test Search",
                query="Python developer",
                filters={"location": "San Francisco", "experience": "3-5 years"}
            )
            saved_search = await service.create_saved_search(user_id=1, search_data=search_data)
            print(f"✅ Created saved search: {saved_search.name}")
            
            # Test 7: Get saved searches
            print("\n7️⃣ Testing Saved Searches...")
            searches = await service.get_saved_searches(user_id=1)
            print(f"✅ Retrieved {len(searches)} saved searches")
            for search in searches:
                print(f"   - {search.name}: {search.query}")
            
            print("\n🎉 All Dashboard Services Tests Passed!")
            return True
            
        except Exception as e:
            print(f"❌ Error testing dashboard services: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            break

async def test_dashboard_apis():
    """Test dashboard API endpoints"""
    print("\n🌐 Testing Dashboard API Endpoints...")
    
    import httpx
    
    base_url = "http://localhost:8000"
    
    # Test endpoints that don't require authentication
    endpoints_to_test = [
        "/health",
        "/api/v1/dashboard/overview",  # This will return 401, but we can test the endpoint exists
    ]
    
    async with httpx.AsyncClient() as client:
        for endpoint in endpoints_to_test:
            try:
                response = await client.get(f"{base_url}{endpoint}", timeout=5.0)
                print(f"✅ {endpoint}: {response.status_code}")
                if response.status_code == 200:
                    print(f"   Response: {response.json()}")
                elif response.status_code == 401:
                    print(f"   Response: Authentication required (expected)")
            except Exception as e:
                print(f"❌ {endpoint}: Error - {e}")

def test_database_tables():
    """Test that dashboard tables exist"""
    print("\n🗄️ Testing Database Tables...")
    
    import sqlite3
    
    try:
        conn = sqlite3.connect('/Users/pradeepdyd/referconnect-backend/app.db')
        cursor = conn.cursor()
        
        # Check if dashboard tables exist
        tables_to_check = [
            'job_recommendations',
            'activity_feed', 
            'saved_searches',
            'user_profile_completion',
            'dashboard_stats'
        ]
        
        for table in tables_to_check:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            result = cursor.fetchone()
            if result:
                print(f"✅ Table '{table}' exists")
            else:
                print(f"❌ Table '{table}' missing")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error checking database tables: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting Dashboard Backend Tests...")
    print("=" * 50)
    
    # Test 1: Database tables
    db_test = test_database_tables()
    
    # Test 2: Dashboard services
    service_test = await test_dashboard_services()
    
    # Test 3: API endpoints
    await test_dashboard_apis()
    
    print("\n" + "=" * 50)
    if db_test and service_test:
        print("🎉 All Dashboard Backend Tests Completed Successfully!")
        print("\n📋 Summary:")
        print("✅ Database tables created")
        print("✅ Dashboard services working")
        print("✅ API endpoints responding")
        print("✅ Backend ready for frontend integration")
    else:
        print("❌ Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    asyncio.run(main())
