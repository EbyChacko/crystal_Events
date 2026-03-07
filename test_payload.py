import requests
import json

BASE_URL = 'http://localhost:8000/api'

# Login
res = requests.post(f"{BASE_URL}/auth/login/", json={"username": "admin", "password": "password"})
if res.status_code != 200:
    res = requests.post(f"{BASE_URL}/auth/login/", json={"username": "admin", "password": "1234"})

token = res.json().get('access')
headers = {'Authorization': f'Bearer {token}'}

res = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
print(json.dumps(res.json(), indent=2))
