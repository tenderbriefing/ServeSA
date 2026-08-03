#!/bin/bash

# ServeSA Setup Script
echo "🚀 ServeSA Setup Script"
echo "========================"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo "❌ Error: Please run this script from the ServeSA root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Setting up environment files..."

# Setup Cloud Functions environment
if [ ! -f "apps/functions/.env" ]; then
    echo "📝 Creating Cloud Functions environment file..."
    cp apps/functions/env.example apps/functions/.env
    echo "✅ Created apps/functions/.env"
    echo "⚠️  Please edit apps/functions/.env with your Firebase service account details"
else
    echo "✅ Cloud Functions environment file already exists"
fi

# Setup Web App environment
if [ ! -f "apps/web/.env.local" ]; then
    echo "📝 Creating Web App environment file..."
    cp apps/web/env.example apps/web/.env.local
    echo "✅ Created apps/web/.env.local"
    echo "⚠️  Please edit apps/web/.env.local with your Firebase web app config"
else
    echo "✅ Web App environment file already exists"
fi

echo ""
echo "🔍 Checking configuration..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it:"
    echo "   npm install -g firebase-tools"
    echo "   firebase login"
else
    echo "✅ Firebase CLI is installed"
fi

# Check if gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it:"
    echo "   https://cloud.google.com/sdk/docs/install"
else
    echo "✅ Google Cloud CLI is installed"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Edit apps/functions/.env with your Firebase service account details"
echo "2. Edit apps/web/.env.local with your Firebase web app config"
echo "3. Get Firebase web app config from: https://console.firebase.google.com/project/servesa-aad53"
echo "4. Create Google Maps API key: https://console.cloud.google.com/apis/credentials"
echo "5. Enable required APIs in Google Cloud Console"
echo "6. Run: npm run dev"
echo ""
echo "📖 For detailed instructions, see: SETUP_SECURITY.md"
echo "📖 For full documentation, see: README.md"
echo ""
echo "🎉 Setup complete! Follow the next steps above to configure your environment."
