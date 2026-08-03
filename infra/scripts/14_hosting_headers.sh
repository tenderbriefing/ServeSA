#!/bin/bash
set -euo pipefail

# Apply hosting headers
echo "🔒 Applying ServeSA hosting headers..."

# Check required environment variables
PROJECT_ID=${PROJECT_ID:-}
REGION=${REGION:-africa-south1}

if [[ -z "$PROJECT_ID" ]]; then
    echo "❌ PROJECT_ID environment variable is required"
    exit 1
fi

echo "✅ Project ID: $PROJECT_ID"
echo "✅ Region: $REGION"

# Check if _headers.json exists
if [[ ! -f "apps/web/public/_headers.json" ]]; then
    echo "❌ _headers.json not found in apps/web/public/"
    exit 1
fi

echo "✅ Found _headers.json"

# Check if firebase.json exists
if [[ ! -f "firebase.json" ]]; then
    echo "❌ firebase.json not found in project root"
    exit 1
fi

echo "✅ Found firebase.json"

# Update firebase.json to include headers
echo "🔧 Updating firebase.json with headers configuration..."

# Create a backup of firebase.json
cp firebase.json firebase.json.backup

# Update firebase.json to include headers
cat > firebase.json <<EOF
{
  "hosting": {
    "public": "apps/web/out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' https://maps.googleapis.com 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.googleusercontent.com; connect-src 'self' https://firestore.googleapis.com https://firebaseinstallations.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://maps.googleapis.com; frame-ancestors 'none'; base-uri 'self'"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "Permissions-Policy",
            "value": "geolocation=(self), camera=()"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "apps/functions",
    "runtime": "nodejs20"
  }
}
EOF

echo "✅ Updated firebase.json with headers"

# Deploy to apply headers
echo "🚀 Deploying to apply headers..."
firebase deploy --only hosting --project="$PROJECT_ID" --non-interactive

echo "🎉 Hosting headers applied successfully!"
