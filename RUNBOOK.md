# ServeSA Phase-1 Runbook

## Overview
This runbook provides operational procedures for ServeSA Phase-1, including deployment, monitoring, troubleshooting, and maintenance tasks.

## Table of Contents
1. [Deployment Procedures](#deployment-procedures)
2. [Monitoring and Alerting](#monitoring-and-alerting)
3. [Troubleshooting](#troubleshooting)
4. [Maintenance Tasks](#maintenance-tasks)
5. [Emergency Procedures](#emergency-procedures)
6. [Performance Optimization](#performance-optimization)
7. [Community Engagement](#community-engagement)

## Community Engagement

See `docs/runbooks/COMMUNITY_ENGAGEMENT.md` and `docs/architecture/ADR_COMMUNITY_ENGAGEMENT.md`.

Citizen routes: `/updates`, `/ideas`. Ops: `/ops/community`. Deploy Firestore indexes for `municipal_updates` / `community_ideas` before enabling production traffic. Do not expose push/email send callables to ordinary users.

## Deployment Procedures

### Initial Setup

#### 1. Prerequisites Check
```bash
# Verify Google Cloud SDK
gcloud version

# Verify Firebase CLI
firebase --version

# Verify Node.js version
node --version  # Should be 22+

# Verify project access
gcloud auth list
gcloud config get-value project
```

#### 2. Environment Setup
```bash
# Set environment variables
export PROJECT_ID="servesa-aad53"
export REGION="africa-south1"
export ENVIRONMENT="production"

# Configure gcloud
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION
```

#### 3. Infrastructure Deployment
```bash
# Run infrastructure scripts in order
cd infra/scripts

# 1. Enable APIs
./01_enable_apis.sh

# 2. Setup IAM
./02_iam_bootstrap.sh

# 3. Setup secrets
./03_secrets_bootstrap.sh

# 4. Create BigQuery dataset
./04_bq_create_geo.sh

# 5. Load ward data
./05_bq_load_wards.sh

# 6. Setup GitHub OIDC
./06_oidc_github.sh
```

#### 4. Application Deployment
```bash
# Deploy Cloud Functions
cd apps/functions
npm install
npm run build
firebase deploy --only functions

# Deploy web application
cd ../web
npm install
npm run build
firebase deploy --only hosting
```

### Continuous Deployment

#### GitHub Actions Pipeline
```yaml
# Triggered on push to main branch
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: servesa-aad53
          channelId: live
```

## Monitoring and Alerting

### Key Metrics to Monitor

#### 1. Application Performance
- **Page Load Time**: Target < 3 seconds
- **API Response Time**: Target < 500ms
- **Error Rate**: Target < 1%
- **Uptime**: Target 99.9%

#### 2. Database Performance
- **Firestore Read Latency**: Target < 100ms
- **Firestore Write Latency**: Target < 200ms
- **BigQuery Query Time**: Target < 5 seconds
- **Connection Pool Usage**: Monitor for exhaustion

#### 3. Infrastructure Metrics
- **Cloud Functions Execution Time**: Target < 10 seconds
- **Memory Usage**: Monitor for leaks
- **CPU Usage**: Target < 80%
- **Storage Usage**: Monitor growth

### Monitoring Setup

#### 1. Google Cloud Monitoring
```bash
# Enable monitoring APIs
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com

# Create monitoring workspace
gcloud monitoring workspaces create --display-name="ServeSA Monitoring"
```

#### 2. Alerting Policies
```yaml
# High Error Rate Alert
displayName: "High Error Rate"
conditions:
  - displayName: "Error rate > 5%"
    conditionThreshold:
      filter: 'resource.type="cloud_function"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.05
      duration: 300s

# High Latency Alert
displayName: "High API Latency"
conditions:
  - displayName: "API latency > 1s"
    conditionThreshold:
      filter: 'resource.type="cloud_function"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 1000
      duration: 300s
```

#### 3. Logging Configuration
```javascript
// Structured logging in Cloud Functions
const { logger } = require('firebase-functions/v2')

logger.info('Case created', {
  caseId: caseData.caseId,
  category: caseData.category,
  priority: caseData.priority,
  userId: caseData.userId,
  municipalityId: caseData.location.municipalityId
})
```

### Dashboard Setup

#### 1. Google Cloud Console Dashboard
```yaml
# Create custom dashboard
displayName: "ServeSA Operations Dashboard"
gridLayout:
  columns: "2"
  widgets:
    - title: "API Response Time"
      xyChart:
        dataSets:
          - timeSeriesQuery:
              timeSeriesFilter:
                filter: 'resource.type="cloud_function"'
                aggregations:
                  - alignmentPeriod: 60s
                    perSeriesAligner: ALIGN_MEAN
    - title: "Error Rate"
      xyChart:
        dataSets:
          - timeSeriesQuery:
              timeSeriesFilter:
                filter: 'resource.type="cloud_function"'
                aggregations:
                  - alignmentPeriod: 60s
                    perSeriesAligner: ALIGN_RATE
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Cloud Functions Failures

**Issue**: Function timeout
```bash
# Check function logs
firebase functions:log --only servesa-api

# Increase timeout
firebase functions:config:set timeout=540

# Redeploy function
firebase deploy --only functions:servesa-api
```

**Issue**: Memory exhaustion
```bash
# Check memory usage
gcloud functions describe servesa-api --region=africa-south1

# Increase memory allocation
firebase functions:config:set memory=2GB

# Redeploy function
firebase deploy --only functions:servesa-api
```

#### 2. Database Issues

**Issue**: Firestore quota exceeded
```bash
# Check quota usage
gcloud firestore databases describe --database="(default)"

# Increase quota limits
gcloud firestore databases update --database="(default)" --quota=1000000
```

**Issue**: BigQuery query timeout
```sql
-- Optimize query with partitioning
SELECT * FROM `servesa-aad53.geo.wards`
WHERE DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
```

#### 3. Authentication Issues

**Issue**: Firebase Auth token validation fails
```bash
# Check Firebase project settings
firebase projects:list
firebase use servesa-aad53

# Verify authentication configuration
firebase auth:export users.json
```

**Issue**: OIDC authentication fails
```bash
# Check Workload Identity Federation
gcloud iam workload-identity-pools describe servesa-github-pool --location=global

# Verify service account permissions
gcloud projects get-iam-policy servesa-aad53
```

#### 4. Notification Issues

**Issue**: FCM notifications not delivered
```bash
# Check FCM configuration
firebase projects:list
firebase use servesa-aad53

# Test FCM token
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_TOKEN",
    "notification": {
      "title": "Test",
      "body": "Test message"
    }
  }'
```

### Debugging Procedures

#### 1. Function Debugging
```bash
# Enable debug logging
firebase functions:config:set debug=true

# View real-time logs
firebase functions:log --only servesa-api --follow

# Test function locally
firebase emulators:start --only functions
```

#### 2. Database Debugging
```bash
# Check Firestore rules
firebase firestore:rules:get

# Test Firestore queries
firebase firestore:indexes:list

# Export data for analysis
firebase firestore:export gs://servesa-backup/
```

#### 3. Performance Debugging
```bash
# Profile Cloud Functions
gcloud functions describe servesa-api --region=africa-south1

# Check BigQuery performance
bq query --use_legacy_sql=false "
  SELECT 
    creation_time,
    total_bytes_processed,
    total_slot_ms
  FROM \`servesa-aad53.__TABLES__\`
  ORDER BY creation_time DESC
  LIMIT 10
"
```

## Maintenance Tasks

### Daily Tasks

#### 1. Health Check
```bash
# Check application status
curl -f https://servesa-aad53.web.app/health

# Check API endpoints
curl -f https://africa-south1-servesa-aad53.cloudfunctions.net/servesa-api/health

# Check database connectivity
firebase firestore:indexes:list
```

#### 2. Log Review
```bash
# Review error logs
firebase functions:log --only servesa-api --level=error

# Check authentication logs
firebase auth:export users.json
```

### Weekly Tasks

#### 1. Performance Review
```bash
# Generate performance report
gcloud monitoring metrics list --filter="metric.type:cloudfunctions"

# Check SLA compliance
curl -X GET https://africa-south1-servesa-aad53.cloudfunctions.net/servesa-api/sla-report
```

#### 2. Security Review
```bash
# Check IAM permissions
gcloud projects get-iam-policy servesa-aad53

# Review audit logs
gcloud logging read "resource.type=cloud_function" --limit=100
```

### Monthly Tasks

#### 1. Data Backup
```bash
# Backup Firestore data
firebase firestore:export gs://servesa-backup/monthly/

# Backup BigQuery data
bq extract servesa-aad53:geo.wards gs://servesa-backup/bigquery/wards_$(date +%Y%m).json

# Backup configuration
firebase functions:config:get > config_backup_$(date +%Y%m).json
```

#### 2. Dependency Updates
```bash
# Update npm packages
npm audit fix
npm update

# Update Firebase CLI
npm install -g firebase-tools@latest

# Update Google Cloud SDK
gcloud components update
```

## Emergency Procedures

### Service Outage Response

#### 1. Immediate Actions
```bash
# 1. Check service status
curl -f https://servesa-aad53.web.app/health

# 2. Check Cloud Functions
firebase functions:log --only servesa-api --limit=50

# 3. Check database
firebase firestore:indexes:list

# 4. Notify stakeholders
# Send notification to team via Slack/Email
```

#### 2. Rollback Procedure
```bash
# Rollback to previous deployment
firebase hosting:clone servesa-aad53:live:previous servesa-aad53:live

# Rollback Cloud Functions
firebase functions:rollback --only servesa-api

# Restore database from backup if needed
firebase firestore:import gs://servesa-backup/emergency/
```

#### 3. Communication Plan
```markdown
## Emergency Communication Template

**Subject**: ServeSA Service Outage - [Severity Level]

**Status**: [Investigating/Identified/Monitoring/Resolved]

**Impact**: 
- [Description of impact]
- [Affected users/features]

**Timeline**:
- [Time] - Issue detected
- [Time] - Investigation started
- [Time] - Root cause identified
- [Time] - Fix deployed
- [Time] - Service restored

**Next Steps**:
- [Action items]
- [Prevention measures]
```

### Data Breach Response

#### 1. Immediate Actions
```bash
# 1. Isolate affected systems
gcloud compute instances stop [instance-name]

# 2. Preserve evidence
gcloud logging read "resource.type=cloud_function" --limit=1000 > breach_evidence.log

# 3. Notify security team
# Contact security@servesa.co.za

# 4. Assess scope
firebase auth:export users.json
```

#### 2. Investigation Steps
```bash
# Review access logs
gcloud logging read "resource.type=cloud_function" --filter="severity>=ERROR"

# Check authentication logs
firebase auth:export users.json

# Review IAM permissions
gcloud projects get-iam-policy servesa-aad53
```

## Performance Optimization

### Database Optimization

#### 1. Firestore Optimization
```javascript
// Use batch operations
const batch = db.batch()
cases.forEach(case => {
  const docRef = db.collection('cases').doc(case.id)
  batch.set(docRef, case)
})
await batch.commit()

// Use composite indexes
firebase firestore:indexes:create
```

#### 2. BigQuery Optimization
```sql
-- Use partitioning and clustering
CREATE OR REPLACE TABLE `servesa-aad53.geo.case_analytics`
PARTITION BY DATE(created_at)
CLUSTER BY municipality_id, category
AS SELECT * FROM `servesa-aad53.geo.case_analytics_temp`
```

### Caching Strategy

#### 1. Application Caching
```javascript
// Cache georesolve results
const cacheKey = `georesolve_${lat}_${lng}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

// Cache service catalog
const catalog = await db.collection('config').doc('service_catalog').get()
await redis.setex('service_catalog', 3600, JSON.stringify(catalog.data()))
```

#### 2. CDN Configuration
```yaml
# Firebase Hosting configuration
hosting:
  public: build
  ignore:
    - firebase.json
    - **/.*
    - **/node_modules/**
  headers:
    - pattern: "**/*.js"
      headers:
        - key: Cache-Control
          value: "public, max-age=31536000"
    - pattern: "**/*.css"
      headers:
        - key: Cache-Control
          value: "public, max-age=31536000"
```

### Monitoring and Alerting Setup

#### 1. Custom Metrics
```javascript
// Track custom metrics
const { Monitoring } = require('@google-cloud/monitoring')
const monitoring = new Monitoring.MetricServiceClient()

await monitoring.createTimeSeries({
  name: monitoring.projectPath(process.env.PROJECT_ID),
  timeSeries: [{
    metric: {
      type: 'custom.googleapis.com/servesa/case_creation_rate',
      labels: { category: caseData.category }
    },
    resource: {
      type: 'cloud_function',
      labels: { function_name: 'servesa-api' }
    },
    points: [{
      interval: { endTime: { seconds: Date.now() / 1000 } },
      value: { doubleValue: 1.0 }
    }]
  }]
})
```

#### 2. Performance Budgets
```yaml
# Lighthouse CI configuration
ci:
  collect:
    url: ['https://servesa-aad53.web.app']
    startServerCommand: 'npm run start'
    startServerReadyPattern: 'Local:'
  assert:
    assertions:
      'categories:performance': ['error', { minScore: 0.9 }]
      'categories:accessibility': ['error', { minScore: 0.9 }]
      'first-contentful-paint': ['error', { maxNumericValue: 2000 }]
      'largest-contentful-paint': ['error', { maxNumericValue: 3000 }]
```

## Contact Information

### Emergency Contacts
- **Technical Lead**: tech-lead@servesa.co.za
- **DevOps Engineer**: devops@servesa.co.za
- **Security Team**: security@servesa.co.za
- **Product Owner**: product@servesa.co.za

### Escalation Matrix
1. **Level 1**: On-call engineer (24/7)
2. **Level 2**: DevOps engineer (business hours)
3. **Level 3**: Technical lead (emergency only)
4. **Level 4**: CTO (critical issues only)

### Documentation Links
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [ServeSA Architecture](https://docs.servesa.co.za/architecture)
- [API Documentation](https://docs.servesa.co.za/api)
