#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run migrations during build (old server still running — zero downtime)
python manage.py migrate

# Collect static files
python manage.py collectstatic --no-input
