import requests
import pyotp
import sys

BASE_URL = 'http://localhost:8000/api'

# 1. Login to get token
print("1. Logging in...")
res = requests.post(f"{BASE_URL}/auth/login/", json={
    "username": "admin",
    "password": "password" # update with correct pass if needed
})
if res.status_code != 200:
    res = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": "admin",
        "password": "1234"
    })

print("Login response:", res.json())
token = res.json().get('access')

if not token:
    print("Cannot test, 2fa required or login failed.")
    sys.exit(0)

headers = {'Authorization': f'Bearer {token}'}

# Check initial user profile
res = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
print("Initial /auth/me/: ", res.json().get('two_factor_enabled'))

# Setup 2FA
print("\n2. Initiating 2FA setup...")
res = requests.get(f"{BASE_URL}/auth/2fa/setup/", headers=headers)
data = res.json()
secret = data.get('secret')

# Verify Setup
print("\n3. Verifying setup...")
totp = pyotp.TOTP(secret)
otp = totp.now()
res = requests.post(f"{BASE_URL}/auth/2fa/verify-setup/", json={"otp": otp}, headers=headers)
print("Verify setup response:", res.json())

# Check user profile again (UI does this via fetchUser())
res = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
print("After setup /auth/me/: ", res.json().get('two_factor_enabled'))

# Disable 2FA
print("\n4. Disabling 2FA...")
res = requests.post(f"{BASE_URL}/auth/2fa/disable/", headers=headers)

# Check user profile again
res = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
print("After disable /auth/me/: ", res.json().get('two_factor_enabled'))
