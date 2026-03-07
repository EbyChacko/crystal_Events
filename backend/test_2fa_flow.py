import requests
import pyotp
import time

BASE_URL = 'http://localhost:8000/api'
client = requests.Session()

# Login
login_data = {'username': 'admin', 'password': 'password123'} # Replace with actual credentials or just create a user in DB
print("Logging in...")
response = client.post(f"{BASE_URL}/auth/login/", json=login_data)
if response.status_code != 200:
    print("Login failed:", response.json())
else:
    client.headers.update({'Authorization': f"Bearer {response.json()['access']}"})
    print("Logged in successfully.")
    
    # Disable first
    print("Disabling 2FA if enabled...")
    client.post(f"{BASE_URL}/auth/2fa/disable/")
    
    # Setup
    print("Setting up 2FA...")
    setup_resp = client.get(f"{BASE_URL}/auth/2fa/setup/")
    if setup_resp.status_code == 200:
        secret = setup_resp.json()['secret']
        print("Setup successful. Secret:", secret)
        
        # Generate OTP
        totp = pyotp.TOTP(secret)
        otp = totp.now()
        print("Generated OTP:", otp)
        
        # Verify
        verify_resp = client.post(f"{BASE_URL}/auth/2fa/verify-setup/", json={'otp': otp})
        print("Verify response status:", verify_resp.status_code)
        print("Verify response body:", verify_resp.json())
    else:
        print("Setup failed:", setup_resp.json())
