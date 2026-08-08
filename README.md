# ServeSA

## Overview

ServeSA is a civic **report-and-resolve** Progressive Web App for South African municipalities — plus two-way engagement via **Municipal Updates** and **Community Ideas**. It is intentionally **not** a social network.

## Features (implemented)

### Civic reporting loop
- Case creation wizard with photos and SA location bounds
- Authoritative GIS ward/municipality resolution (BigQuery)
- Municipal ops workspace (`/ops`) — queues, assign, notes, public case updates
- Field worker mode and citizen case tracking

### Community engagement
- **Municipal Updates** (`/updates`) — verified municipal communications with typed update kinds and lifecycle
- **Community Ideas** (`/ideas`) — constructive suggestions, one support per citizen, official responses only
- **Community Insights** (`/ops/community`) — deterministic aggregates with metric provenance (no predictive AI)
- Ops Communications workspace under `/ops/community`

### Security posture
- Privileged mutations via Cloud Functions + Admin SDK only
- JWT custom claims for municipality isolation
- Notification send callables are **admin-gated** (event-driven delivery preferred)

### Technical stack
- **Frontend**: Next.js + TypeScript + Tailwind (SA civic design system)
- **Backend**: Firebase Cloud Functions v2 + **Node.js 22**
- **Database**: Firestore (operational) + BigQuery (GIS / analytics)
- **Auth**: Firebase Auth + custom claims
- **Region**: africa-south1 (primary)

> **Note:** Automated SLA breach engine and full multi-channel push/email/WhatsApp fan-out are architected but not marketed as generally available until separately certified. Production deploy is **manual** (`workflow_dispatch` only).

## Repository structure

```
servesa/
├── apps/web/                 # Citizen + ops PWA
├── apps/functions/           # Callables, triggers, community modules
├── packages/case-contract/   # Shared Zod contracts (cases, updates, ideas)
├── infra/                    # Rules, indexes, scripts, CI helpers
├── docs/                     # ADRs, runbooks, certifications
└── tools/                    # Seed, pilot, loadtest
```

## Quick start

### Prerequisites

- Node.js 20+
- Google Cloud SDK
- Firebase CLI
- Git

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/servesa.git
cd servesa

# Install dependencies
npm install

# Install workspace dependencies
npm run install:all
```

### 2. Environment Configuration

```bash
# Copy environment templates
cp apps/web/.env.example apps/web/.env.local
cp apps/functions/.env.example apps/functions/.env.local

# Configure your environment variables
# See Environment Variables section below
```

### 3. Infrastructure Setup

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
export REGION="africa-south1"

# Run infrastructure scripts (in order)
cd infra/scripts

# 1. Enable Google Cloud APIs
./01_enable_apis.sh

# 2. Setup IAM and service accounts
./02_iam_bootstrap.sh

# 3. Configure secrets
./03_secrets_bootstrap.sh

# 4. Create BigQuery GIS dataset
./04_bq_create_geo.sh

# 5. Load ward data
./05_bq_load_wards.sh

# 6. Setup GitHub OIDC
./06_oidc_github.sh
```

### 4. Seed Data

```bash
# Load municipalities and service catalog
cd tools/seed
npm install
npm run seed:municipalities
```

### 5. Development

```bash
# Start development servers
npm run dev

# This will start:
# - Web app: http://localhost:3000
# - Functions emulator: http://localhost:5001
# - Firestore emulator: http://localhost:8080
```

### 6. Deployment

```bash
# Deploy to production
npm run deploy

# Or deploy individual components
npm run deploy:functions
npm run deploy:web
```

## 🔧 Environment Variables

### Web App (.env.local)
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id

# API Endpoints
NEXT_PUBLIC_API_BASE_URL=https://your-region-your-project.cloudfunctions.net
NEXT_PUBLIC_OPEN311_ENDPOINT=https://your-region-your-project.cloudfunctions.net/api/open311
```

### Functions (.env.local)
```bash
# Project Configuration
PROJECT_ID=your_project_id
REGION=africa-south1
ENVIRONMENT=production

# Firebase Admin
FIREBASE_ADMIN_KEY=your_service_account_key_json

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Secrets (from Secret Manager)
GMAIL_API_KEY=projects/your_project/secrets/servesa-gmail-api-key/versions/latest
MAPS_API_KEY=projects/your_project/secrets/servesa-maps-api-key/versions/latest
RECAPTCHA_SECRET_KEY=projects/your_project/secrets/servesa-recaptcha-secret-key/versions/latest
JWT_SECRET=projects/your_project/secrets/servesa-jwt-secret/versions/latest
```

## 🗺️ Key Features

### 1. Case Creation Flow
- **Multi-step wizard** with category selection, description, location, and review
- **Geolocation integration** with automatic ward/municipality resolution
- **Image upload** with client-side compression and validation
- **SLA calculation** based on category, priority, and municipality
- **Real-time validation** and error handling

### 2. Geospatial Resolution
- **BigQuery GIS integration** for accurate ward resolution
- **Fallback mechanisms** for coordinates outside ward boundaries
- **Caching system** to improve performance
- **Confidence scoring** based on distance from ward centroid

### 3. SLA Management
- **Automated SLA calculation** using municipality-specific configurations
- **Breach monitoring** with scheduled checks
- **Notification system** for approaching and breached SLAs
- **Performance reporting** and analytics

### 4. Public Map
- **Interactive visualization** of cases across South Africa
- **Heatmap functionality** for case density analysis
- **Filtering capabilities** by category, status, and time range
- **De-identified data** for privacy compliance

### 5. User Dashboard
- **Case tracking** with real-time status updates
- **Search and filtering** capabilities
- **Notification management** with read/unread status
- **Performance metrics** and SLA compliance

## 🔒 Security & Compliance

### POPIA Compliance
- **Data minimization** - only collect necessary information
- **Consent management** - explicit consent for data processing
- **Data retention** - automated cleanup of old data
- **Access controls** - role-based permissions
- **Audit logging** - comprehensive activity tracking

### Security Measures
- **Firebase Security Rules** - strict database access controls
- **Authentication** - Firebase Auth with Google OAuth
- **Input validation** - Zod schema validation
- **Rate limiting** - API request throttling
- **HTTPS enforcement** - secure communication

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Google Cloud Monitoring** - infrastructure metrics
- **Firebase Performance** - app performance tracking
- **Custom metrics** - business-specific KPIs
- **Error tracking** - comprehensive error logging

### Analytics
- **Google Analytics 4** - user behavior tracking
- **BigQuery integration** - data warehouse for analytics
- **Custom dashboards** - operational insights
- **SLA reporting** - performance metrics

## 🧪 Testing

### Test Coverage
- **Unit tests** - 90%+ coverage target
- **Integration tests** - API and database testing
- **E2E tests** - Playwright for user workflows
- **Security tests** - authentication and authorization
- **Performance tests** - load and stress testing

### Running Tests
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Deployment
```bash
# Deploy to production
npm run deploy:prod

# This includes:
# - Cloud Functions deployment
# - Web app deployment
# - Database migrations
# - Configuration updates
```

### Staging Deployment
```bash
# Deploy to staging
npm run deploy:staging
```

### CI/CD Pipeline
- **GitHub Actions** - automated testing and deployment
- **Workload Identity Federation** - secure authentication
- **Environment-specific deployments** - dev/staging/prod
- **Rollback capabilities** - quick recovery from issues

## 📚 Documentation

### Technical Documentation
- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Security Model](docs/security.md)

### Operational Documentation
- [Deployment Guide](docs/deployment.md)
- [Monitoring Guide](docs/monitoring.md)
- [Troubleshooting Guide](docs/troubleshooting.md)
- [Runbook](RUNBOOK.md)

### User Documentation
- [User Guide](docs/user-guide.md)
- [Admin Guide](docs/admin-guide.md)
- [API Reference](docs/api-reference.md)

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Code Standards
- **TypeScript** - strict type checking
- **ESLint** - code quality enforcement
- **Prettier** - code formatting
- **Conventional Commits** - commit message format

### Pull Request Process
- **Automated testing** - all tests must pass
- **Code review** - at least one approval required
- **Security scan** - vulnerability assessment
- **Performance check** - performance regression detection

## 📞 Support

### Getting Help
- **Documentation** - comprehensive guides and references
- **Issues** - GitHub issues for bug reports and feature requests
- **Discussions** - GitHub discussions for questions and ideas
- **Email** - support@servesa.co.za for urgent issues

### Community
- **Contributors** - see [CONTRIBUTORS.md](CONTRIBUTORS.md)
- **Changelog** - see [CHANGELOG.md](CHANGELOG.md)
- **Roadmap** - see [ROADMAP.md](ROADMAP.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud Platform** - infrastructure and services
- **Firebase** - backend-as-a-service platform
- **Next.js** - React framework
- **Tailwind CSS** - utility-first CSS framework
- **shadcn/ui** - component library
- **South African Municipalities** - data and requirements

---

**ServeSA** - Connecting South Africans with quality service delivery. 🇿🇦
