import { test } from '@playwright/test';

test('Debug: Try logging in and check for errors', async ({ page }) => {
  await page.goto('http://localhost:5500');
  await page.waitForLoadState('networkidle');
  
  // Capture all network responses
  page.on('response', response => {
    if (response.url().includes('/api/auth/login')) {
      console.log(`[Network] Login response status: ${response.status()}`);
      response.json().then(data => {
        console.log('[Network] Login response body:', JSON.stringify(data));
      }).catch(() => {
        // Silent fail for non-JSON responses
      });
    }
  });
  
  // Enable console logging
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('error', err => console.log(`[error] ${err}`));
  
  // Fill login form
  await page.fill('#username', 'manager_test_alex@otg.test');
  await page.fill('#loginForm [type="password"]', 'TestPass#2026!');
  
  // Submit form
  const submitButton = page.locator('#loginForm button[type="submit"]');
  await submitButton.click();
  
  // Wait and check what happens
  await page.waitForTimeout(5000);
  
  console.log('URL after 5 seconds:', page.url());
  
  // Check for error messages
  const loginError = page.locator('#loginError');
  const errorVisible = await loginError.isVisible().catch(() => false);
  if (errorVisible) {
    const errorText = await loginError.textContent();
    console.log('Login Error Message:', errorText);
  }
  
  // Check sessionStorage
  const authToken = await page.evaluate(() => sessionStorage.getItem('authToken'));
  const currentUser = await page.evaluate(() => sessionStorage.getItem('currentUser'));
  console.log('AuthToken:', authToken ? 'EXISTS: ' + authToken.substring(0, 50) + '...' : 'MISSING');
  console.log('CurrentUser:', currentUser);
});
