# 🔒 ServeSA Security Setup Guide

## ⚠️ IMPORTANT: Service Account Key Security

The Firebase service account key you provided contains sensitive credentials. Follow these security best practices:

### 1. Never Commit Credentials to Git

**DO NOT** commit the service account key to version control. The `.env` files are already in `.gitignore` to prevent accidental commits.

### 2. Secure Environment Setup

#### For Cloud Functions:
```bash
cd apps/functions
cp env.example .env
```

#### For Web App:
```bash
cd apps/web
cp env.example .env.local
```

### 3. Required Firebase Configuration

You need to get the following values from your Firebase Console:

1. **Firebase Console**: https://console.firebase.google.com/project/servesa-aad53
2. **Project Settings** → **General** → **Your apps** → **Web app**

#### Web App Environment Variables Needed:

```env
# Get these from Firebase Console → Project Settings → General → Your apps → Web app
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...  # From Firebase config
NEXT_PUBLIC_FIREBASE_APP_ID=1:115054458571031:web:...  # From Firebase config
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=115054458571031  # From Firebase config

# Google Maps API Key (create in Google Cloud Console)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...  # Create in Google Cloud Console

# Google Analytics 4 (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Create GA4 property
```

### 4. Google Cloud Console Setup

1. **Enable Required APIs**:
   ```bash
   gcloud services enable \
     firebase.googleapis.com \
     firestore.googleapis.com \
     storage.googleapis.com \
     cloudfunctions.googleapis.com \
     bigquery.googleapis.com \
     aiplatform.googleapis.com \
     vision.googleapis.com \
     maps-backend.googleapis.com \
     analytics.googleapis.com
   ```

2. **Create Google Maps API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create API key with restrictions for Maps JavaScript API, Geocoding API, Places API

3. **Set up BigQuery**:
   ```bash
   # Create geo dataset
   bq mk --location=africa-south1 servesa-aad53:geo
   
   # Create wards table
   bq mk --table \
     --location=africa-south1 \
     servesa-aad53:geo.wards \
     ward_id:STRING,muni_code:STRING,geom:GEOGRAPHY
   ```

### 5. Firebase Project Setup

1. **Enable Authentication**:
   - Firebase Console → Authentication → Sign-in method
   - Enable Google, Email/Password, Phone

2. **Set up Firestore**:
   - Firebase Console → Firestore Database → Create database
   - Start in production mode
   - Choose location: `africa-south1`

3. **Set up Storage**:
   - Firebase Console → Storage → Get started
   - Choose location: `africa-south1`

4. **Deploy Security Rules**:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

### 6. Environment Variables Checklist

#### Cloud Functions (.env):
- ✅ FIREBASE_PROJECT_ID=servesa-aad53
- ✅ FIREBASE_PRIVATE_KEY_ID=948e53bf08a0a3b5ad8d4b67dab8affb7378484b
- ✅ FIREBASE_PRIVATE_KEY=... (from service account)
- ✅ FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@servesa-aad53.iam.gserviceaccount.com
- ✅ FIREBASE_CLIENT_ID=115054458571031236165
- ✅ GOOGLE_CLOUD_PROJECT=servesa-aad53
- ✅ REGION=africa-south1
- ✅ VERTEX_PROJECT_ID=servesa-aad53
- ✅ APP_URL=https://servesa-aad53.web.app
- ✅ API_BASE_URL=https://africa-south1-servesa-aad53.cloudfunctions.net

#### Web App (.env.local):
- ⏳ NEXT_PUBLIC_FIREBASE_API_KEY=... (get from Firebase Console)
- ⏳ NEXT_PUBLIC_FIREBASE_APP_ID=... (get from Firebase Console)
- ⏳ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=... (get from Firebase Console)
- ⏳ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=... (create in Google Cloud Console)
- ✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=servesa-aad53.firebaseapp.com
- ✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID=servesa-aad53
- ✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=servesa-aad53.appspot.com
- ✅ NEXT_PUBLIC_API_BASE_URL=https://africa-south1-servesa-aad53.cloudfunctions.net

### 7. Next Steps

1. **Get Firebase Web App Config**:
   - Go to Firebase Console → Project Settings → General
   - Scroll to "Your apps" section
   - Click on the web app or create one
   - Copy the config values

2. **Create Google Maps API Key**:
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Create API key with appropriate restrictions

3. **Test the Setup**:
   ```bash
   # Install dependencies
   npm install
   
   # Start development
   npm run dev
   ```

### 8. Security Best Practices

- ✅ Service account key is in `.env` (not committed to git)
- ✅ Environment files are in `.gitignore`
- ✅ Use environment-specific configurations
- ✅ Rotate keys regularly
- ✅ Use least privilege principle for API keys
- ✅ Monitor usage and set up alerts

### 9. Production Deployment

When ready for production:

1. **Set up Firebase Hosting**:
   ```bash
   firebase init hosting
   ```

2. **Deploy Functions**:
   ```bash
   cd apps/functions
   npm run build
   firebase deploy --only functions
   ```

3. **Deploy Web App**:
   ```bash
   cd apps/web
   npm run build
   firebase deploy --only hosting
   ```

## 🚨 Security Reminders

- Never share service account keys publicly
- Use environment variables for all sensitive data
- Regularly rotate credentials
- Monitor for unusual activity
- Keep dependencies updated
- Use HTTPS in production

---

**Need Help?** Check the main README.md for detailed setup instructions or create an issue in the repository.
