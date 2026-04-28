#!/usr/bin/env bash
set -o errexit

# Start the application server (migrations run during build)
gunicorn crystal_events_backend.wsgi:application
