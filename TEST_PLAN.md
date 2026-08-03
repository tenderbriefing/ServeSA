# ServeSA Phase-1 Test Plan

## Overview
This document outlines the testing strategy for ServeSA Phase-1 implementation, covering unit tests, integration tests, and end-to-end tests.

## Test Categories

### 1. Unit Tests

#### 1.1 SLA Calculator Tests
- **File**: `apps/functions/src/utils/slaCalculator.test.ts`
- **Coverage**: All SLA calculation functions
- **Test Cases**:
  - Calculate SLA target for different categories and priorities
  - Check SLA breach detection
  - Calculate time remaining until SLA breach
  - Get SLA status descriptions
  - Calculate response times
  - Generate SLA performance metrics
  - Priority multipliers
  - SLA adjustments for external factors

#### 1.2 Georesolve Tests
- **File**: `apps/functions/src/routing/georesolve.test.ts`
- **Coverage**: Georesolve functionality
- **Test Cases**:
  - Resolve coordinates to ward and municipality
  - Handle coordinates outside South Africa bounds
  - Test fallback to nearest ward
  - Cache georesolve results
  - Calculate confidence based on distance
  - Batch georesolve operations
  - Get ward statistics

#### 1.3 Case Creation Tests
- **File**: `apps/functions/src/cases/createCase.test.ts`
- **Coverage**: Case creation and validation
- **Test Cases**:
  - Validate case creation schema
  - Create case with valid data
  - Handle invalid input data
  - Test georesolve integration
  - Verify SLA calculation
  - Check notification sending
  - Test case status updates
  - Verify access permissions

#### 1.4 Notification Tests
- **File**: `apps/functions/src/notifications/notifications.test.ts`
- **Coverage**: Notification functionality
- **Test Cases**:
  - Send push notifications
  - Send bulk notifications
  - Send notifications by role
  - Store notifications in Firestore
  - Mark notifications as read
  - Get user notifications
  - Get unread notification count
  - Update FCM tokens

### 2. Integration Tests

#### 2.1 API Endpoint Tests
- **File**: `apps/functions/src/__tests__/api.test.ts`
- **Coverage**: HTTP endpoints
- **Test Cases**:
  - Case creation endpoint
  - Georesolve endpoint
  - SLA monitoring endpoint
  - Authentication and authorization
  - Error handling
  - Rate limiting
  - Request validation

#### 2.2 Firestore Integration Tests
- **File**: `apps/functions/src/__tests__/firestore.test.ts`
- **Coverage**: Database operations
- **Test Cases**:
  - Case CRUD operations
  - User profile management
  - Notification storage
  - Analytics data updates
  - Batch operations
  - Transaction handling

#### 2.3 BigQuery Integration Tests
- **File**: `apps/functions/src/__tests__/bigquery.test.ts`
- **Coverage**: BigQuery operations
- **Test Cases**:
  - Ward resolution queries
  - Analytics data queries
  - Performance optimization
  - Error handling
  - Data validation

### 3. End-to-End Tests

#### 3.1 Playwright E2E Tests
- **File**: `apps/web/e2e/`
- **Coverage**: User workflows
- **Test Cases**:

##### 3.1.1 Report Flow (`/report` page)
```typescript
describe('Report Flow', () => {
  test('Complete case submission flow', async ({ page }) => {
    // Navigate to report page
    await page.goto('/report')
    
    // Step 1: Select category
    await page.click('[data-testid="category-water"]')
    await page.fill('[data-testid="title-input"]', 'Water leak test case')
    await page.fill('[data-testid="description-input"]', 'Test description for water leak')
    await page.click('[data-testid="next-button"]')
    
    // Step 2: Location
    await page.fill('[data-testid="location-input"]', 'Johannesburg, South Africa')
    await page.click('[data-testid="next-button"]')
    
    // Step 3: Review and submit
    await page.click('[data-testid="consent-checkbox"]')
    await page.click('[data-testid="submit-button"]')
    
    // Verify success
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
  
  test('Form validation', async ({ page }) => {
    await page.goto('/report')
    
    // Try to submit without required fields
    await page.click('[data-testid="submit-button"]')
    
    // Verify validation errors
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="description-error"]')).toBeVisible()
  })
  
  test('Geolocation integration', async ({ page }) => {
    await page.goto('/report')
    
    // Mock geolocation
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: { latitude: -26.2041, longitude: 28.0473 },
          timestamp: Date.now()
        } as GeolocationPosition)
      }
    })
    
    await page.click('[data-testid="use-location-button"]')
    
    // Verify location is filled
    await expect(page.locator('[data-testid="location-input"]')).toHaveValue(/Johannesburg/)
  })
})
```

##### 3.1.2 Explore Flow (`/explore` page)
```typescript
describe('Explore Flow', () => {
  test('Map rendering and interaction', async ({ page }) => {
    await page.goto('/explore')
    
    // Verify map loads
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()
    
    // Test filters
    await page.click('[data-testid="category-filter"]')
    await page.click('[data-testid="filter-water"]')
    
    // Verify filtered results
    await expect(page.locator('[data-testid="case-marker"]')).toHaveCount(5)
  })
  
  test('Heatmap visualization', async ({ page }) => {
    await page.goto('/explore')
    
    // Toggle heatmap
    await page.click('[data-testid="heatmap-toggle"]')
    
    // Verify heatmap is visible
    await expect(page.locator('[data-testid="heatmap-layer"]')).toBeVisible()
  })
  
  test('Case details modal', async ({ page }) => {
    await page.goto('/explore')
    
    // Click on a case marker
    await page.click('[data-testid="case-marker"]')
    
    // Verify modal opens
    await expect(page.locator('[data-testid="case-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="case-title"]')).toBeVisible()
  })
})
```

##### 3.1.3 Dashboard Flow (`/dashboard` page)
```typescript
describe('Dashboard Flow', () => {
  test('User case management', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    
    await page.goto('/dashboard')
    
    // Verify user cases are displayed
    await expect(page.locator('[data-testid="case-list"]')).toBeVisible()
    
    // Test case filtering
    await page.click('[data-testid="status-filter"]')
    await page.click('[data-testid="filter-in-progress"]')
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'water leak')
    await page.keyboard.press('Enter')
  })
  
  test('Case status updates', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Click on a case
    await page.click('[data-testid="case-item"]')
    
    // Update status
    await page.click('[data-testid="status-dropdown"]')
    await page.click('[data-testid="status-resolved"]')
    
    // Verify status update
    await expect(page.locator('[data-testid="status-badge"]')).toHaveText('Resolved')
  })
})
```

#### 3.2 Performance Tests
- **File**: `tests/performance/`
- **Coverage**: Performance benchmarks
- **Test Cases**:
  - Page load times
  - API response times
  - Database query performance
  - Image upload performance
  - Concurrent user load

### 4. Security Tests

#### 4.1 Authentication Tests
- **File**: `tests/security/auth.test.ts`
- **Coverage**: Security measures
- **Test Cases**:
  - Firebase Authentication
  - Role-based access control
  - Token validation
  - Session management
  - Password policies

#### 4.2 Authorization Tests
- **File**: `tests/security/authorization.test.ts`
- **Coverage**: Access control
- **Test Cases**:
  - User permissions
  - Municipality access control
  - Case ownership validation
  - Admin privileges
  - Data isolation

#### 4.3 Data Protection Tests
- **File**: `tests/security/data-protection.test.ts`
- **Coverage**: POPIA compliance
- **Test Cases**:
  - Personal data handling
  - Consent management
  - Data retention
  - Data anonymization
  - Audit logging

### 5. Accessibility Tests

#### 5.1 WCAG Compliance
- **File**: `tests/accessibility/wcag.test.ts`
- **Coverage**: Accessibility standards
- **Test Cases**:
  - Keyboard navigation
  - Screen reader compatibility
  - Color contrast
  - Alt text for images
  - Focus management

### 6. Mobile Tests

#### 6.1 Responsive Design
- **File**: `tests/mobile/responsive.test.ts`
- **Coverage**: Mobile compatibility
- **Test Cases**:
  - Mobile viewport rendering
  - Touch interactions
  - PWA functionality
  - Offline capabilities
  - App installation

## Test Environment Setup

### Prerequisites
- Node.js 20+
- Firebase CLI
- Google Cloud SDK
- Playwright
- Jest

### Local Development
```bash
# Install dependencies
npm install

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test
```

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
- name: Run Tests
  run: |
    npm run test:unit
    npm run test:integration
    npm run test:e2e
    npm run test:security
    npm run test:accessibility
```

## Test Data Management

### Seed Data
- Test municipalities
- Test cases
- Test users with different roles
- Test notifications

### Test Database
- Separate Firestore project for testing
- Automated cleanup after tests
- Isolated test data

## Coverage Requirements

### Code Coverage Targets
- Unit tests: 90%+
- Integration tests: 80%+
- E2E tests: Critical paths only

### Performance Targets
- Page load time: < 3 seconds
- API response time: < 500ms
- Database queries: < 100ms

## Reporting

### Test Reports
- Jest coverage reports
- Playwright test results
- Performance benchmarks
- Security scan results

### Continuous Monitoring
- Automated test execution
- Failure notifications
- Performance regression detection
- Security vulnerability scanning

## Maintenance

### Test Maintenance
- Regular test updates
- Dependency updates
- Test data refresh
- Performance baseline updates

### Documentation
- Test case documentation
- Setup instructions
- Troubleshooting guide
- Best practices
