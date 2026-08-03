import { test, expect, Page } from '@playwright/test';

test.describe('ServeSA Report Flow', () => {
  test('should complete report flow and generate case ID', async ({ page }: { page: Page }) => {
    // Mock geolocation to Johannesburg coordinates
    await page.addInitScript(() => {
              navigator.geolocation.getCurrentPosition = (success) => {
          success({
            coords: {
              latitude: -26.2041,
              longitude: 28.0473,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
              toJSON: () => ({})
            },
            timestamp: Date.now()
          } as GeolocationPosition);
        };
    });

    // Navigate to report page
    await page.goto('/report');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Report');
    
    // Fill in the report form
    await page.fill('[data-testid="title"]', 'Test Case - Water Leak');
    await page.fill('[data-testid="description"]', 'There is a water leak in the street outside my house. Water is flowing continuously.');
    await page.selectOption('[data-testid="category"]', 'water');
    await page.selectOption('[data-testid="priority"]', 'medium');
    
    // Accept terms and conditions
    await page.check('[data-testid="consent"]');
    
    // Submit the form
    await page.click('[data-testid="submit"]');
    
    // Wait for submission to complete
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Extract case ID from success message
    const successMessage = await page.locator('[data-testid="success-message"]').textContent();
    const caseIdMatch = successMessage?.match(/CASE-[A-Z0-9-]+/);
    
    if (caseIdMatch) {
      const caseId = caseIdMatch[0];
      console.log(`CASE_ID:${caseId}`);
      
      // Verify case ID format
      expect(caseId).toMatch(/^CASE-[A-Z0-9-]+$/);
    } else {
      throw new Error('Case ID not found in success message');
    }
    
    // Verify we can view the case
    await page.click('[data-testid="view-case"]');
    
    // Should navigate to case view page
    await expect(page).toHaveURL(/\/case\/CASE-/);
    await expect(page.locator('h1')).toContainText('Case Details');
  });

  test('should handle geolocation errors gracefully', async ({ page }: { page: Page }) => {
    // Mock geolocation error
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (success, error) => {
        if (error) {
          error({
            code: 1,
            message: 'User denied geolocation',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3
          } as GeolocationPositionError);
        }
      };
    });

    await page.goto('/report');
    
    // Should show manual location input
    await expect(page.locator('[data-testid="manual-location"]')).toBeVisible();
    
    // Fill in manual location
    await page.fill('[data-testid="address"]', '123 Test Street, Johannesburg');
    await page.fill('[data-testid="lat"]', '-26.2041');
    await page.fill('[data-testid="lng"]', '28.0473');
    
    // Continue with form
    await page.fill('[data-testid="title"]', 'Test Case - Manual Location');
    await page.fill('[data-testid="description"]', 'Test case with manual location input');
    await page.selectOption('[data-testid="category"]', 'roads');
    await page.selectOption('[data-testid="priority"]', 'low');
    await page.check('[data-testid="consent"]');
    
    await page.click('[data-testid="submit"]');
    
    // Should still complete successfully
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }: { page: Page }) => {
    await page.goto('/report');
    
    // Try to submit without filling required fields
    await page.click('[data-testid="submit"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="description-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="consent-error"]')).toBeVisible();
    
    // Form should not submit
    await expect(page.locator('[data-testid="success-message"]')).not.toBeVisible();
  });
});
