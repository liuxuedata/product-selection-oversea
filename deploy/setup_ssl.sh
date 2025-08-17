#!/bin/bash
set -e

domain=$1
email=$2

if [ -z "$domain" ] || [ -z "$email" ]; then
  echo "Usage: $0 <domain> <email>"
  exit 1
fi

# Obtain SSL certificates using certbot Docker image
# This assumes the certs volume exists from docker-compose.yml
 docker run --rm -it \
  -v $(pwd)/certs:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  --preferred-challenges http \
  -d "$domain" --agree-tos -m "$email" --non-interactive
