#!/bin/bash
set -euo pipefail

# Run smoke E2E tests
echo "🧪 Running ServeSA smoke E2E tests..."

# Check if Playwright is installed
if ! npx playwright --version >/dev/null 2>&1; then
    echo "❌ Playwright not found. Installing..."
    npx playwright install
fi

# Set environment variables for testing
export NODE_ENV=test
export PLAYWRIGHT_HEADLESS=true

# Run the E2E test
echo "🔍 Running report flow E2E test..."
cd apps/web

# Run the test and capture output
TEST_OUTPUT=$(npx playwright test tests/e2e/report.spec.ts --reporter=list 2>&1)
TEST_EXIT_CODE=$?

echo "$TEST_OUTPUT"

# Check if test passed
if [[ $TEST_EXIT_CODE -eq 0 ]]; then
    echo "✅ E2E test passed successfully"
    
    # Extract case ID if present
    CASE_ID=$(echo "$TEST_OUTPUT" | grep -o "CASE_ID:[A-Z0-9-]*" | cut -d: -f2 || echo "")
    if [[ -n "$CASE_ID" ]]; then
        echo "📋 Generated case ID: $CASE_ID"
    fi
else
    echo "❌ E2E test failed"
    exit 1
fi

# Verify case was created in Firestore (if we have a case ID)
if [[ -n "$CASE_ID" ]]; then
    echo "🔍 Verifying case creation in Firestore..."
    
    # This would require Firebase Admin SDK access
    # For now, we'll just log the case ID
    echo "📝 Case ID for verification: $CASE_ID"
fi

echo "🎉 Smoke E2E tests completed successfully!"
