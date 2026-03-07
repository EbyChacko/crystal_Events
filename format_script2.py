import re

file_path = "/Users/eby/Documents/My Projects/Crystal Events/website 2/Crystal Events V1/frontend/src/pages/admin/UserDetails.jsx"

with open(file_path, 'r') as f:
    content = f.read()

# Replace onClick handlers that have setError('');
content = content.replace("onClick={() => { setShowEditModal(true); setError(''); }}", "onClick={() => { setShowEditModal(true); }}")
content = content.replace("onClick={() => { setChangingPassword(true); setError(''); }}", "onClick={() => { setChangingPassword(true); }}")
content = content.replace("onClick={() => { setChangingPassword(false); setPasswordData({ password: '', confirmPassword: '' }); setError(''); }}", "onClick={() => { setChangingPassword(false); setPasswordData({ password: '', confirmPassword: '' }); }}")

with open(file_path, 'w') as f:
    f.write(content)

print("done")
