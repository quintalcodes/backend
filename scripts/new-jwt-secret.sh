#!/usr/bin/env bash
# dont forget chmod +x generate-jwt-secret.sh 
set -e
secret=$(openssl rand -base64 32)
echo "Add this to backend/.env:"
echo "JWT_SECRET=\"$secret\""
