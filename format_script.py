import re

file_path = "/Users/eby/Documents/My Projects/Crystal Events/website 2/Crystal Events V1/frontend/src/pages/admin/EventDetails.jsx"

with open(file_path, 'r') as f:
    content = f.read()

# Remove error state
content = re.sub(r'const \[error, setError\] = useState\(\'\'\);\n\s*', '', content)

# Remove setError('');
content = re.sub(r'setError\(\'\'\);\n\s*', '', content)

# Replace setError('string')
content = re.sub(r'setError\(([\'\`].*?[\'\`])\);', r"addToast(\1, 'error');", content)

# Replace setError(messages)
content = re.sub(r'setError\(messages\);', r"addToast(messages, 'error');", content)

# Special case: quote error
content = content.replace(
    "setError(d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : 'Failed to save quote.');",
    "addToast(d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : 'Failed to save quote.', 'error');"
)

# Remove the AnimatePresence block for error
error_block_regex = re.compile(
    r'\s*\{\/\* Feedback \*\/\}\s*<AnimatePresence>\s*\{error && \(\s*<motion\.div.*?>\s*<AlertCircle.*?\/><span>\{error\}<\/span>\s*<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>',
    re.DOTALL
)
content = error_block_regex.sub('', content)

with open(file_path, 'w') as f:
    f.write(content)

print("done")
