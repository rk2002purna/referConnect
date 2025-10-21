import requests
import json

# Test the /me endpoint step by step
base_url = "http://127.0.0.1:8000"

# Step 1: Login to get token
login_data = {
    "email": "test@example.com",
    "password": "testpassword123"
}

try:
    print("Step 1: Logging in...")
    login_response = requests.post(f"{base_url}/api/v1/auth/login", json=login_data)
    print(f"Login status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        login_result = login_response.json()
        token = login_result["access_token"]
        print(f"Token received: {token[:20]}...")
        
        # Step 2: Test /me endpoint
        print("\nStep 2: Testing /me endpoint...")
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{base_url}/api/v1/auth/me", headers=headers)
        print(f"Me endpoint status: {me_response.status_code}")
        
        if me_response.status_code == 200:
            me_result = me_response.json()
            print("Me endpoint successful!")
            print(f"User ID: {me_result['id']}")
            print(f"Email: {me_result['email']}")
            print(f"Role: {me_result['role']}")
        else:
            print(f"Me endpoint error: {me_response.text}")
    else:
        print(f"Login error: {login_response.text}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
