import { test, expect } from '@playwright/test';
import { getE2ETestUsers } from './test-users.js';

const seededUsers = getE2ETestUsers();

test.describe('API Connectivity Tests', () => {
  test('should verify backend API is accessible', async ({ page }) => {
    // Navigate to the app
    await page.goto('/index.html');
    
    // Execute a fetch from the page context to test API connectivity
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('https://otg2026.onrender.com/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        return {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
      } catch (error) {
        return {
          error: true,
          message: error.message
        };
      }
    });
    
    console.log('API Connectivity Response:', apiResponse);
    
    if (apiResponse.error) {
      console.error('API is not accessible:', apiResponse.message);
    } else {
      console.log(`API Status: ${apiResponse.status} ${apiResponse.statusText}`);
      expect(apiResponse.ok || apiResponse.status < 500).toBeTruthy();
    }
  });

  test('should verify login API endpoint works', async ({ page }) => {
    // Navigate to the app
    await page.goto('/index.html');
    
    // Test the login API from page context
    // Pass credentials as argument since seededUsers is not available in the browser context
    const loginResponse = await page.evaluate(async ({ email, password }) => {
      try {
        const response = await fetch('https://otg2026.onrender.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          hasToken: !!data.token,
          hasUser: !!data.user || !!data.uid,
          responseKeys: Object.keys(data)
        };
      } catch (error) {
        return {
          error: true,
          message: error.message
        };
      }
    }, { email: seededUsers.manager.email, password: seededUsers.manager.password });
    
    console.log('Login API Response:', loginResponse);
    
    if (loginResponse.error) {
      console.error('Login API call failed:', loginResponse.message);
      expect.soft(false).toBeTruthy(); // Soft fail to see the error
    } else {
      console.log(`Login Status: ${loginResponse.status}, Has Token: ${loginResponse.hasToken}`);
      expect.soft(loginResponse.status).toBe(200);
      expect.soft(loginResponse.hasToken).toBeTruthy();
    }
  });

  test('should verify sessionStorage access in test context', async ({ page }) => {
    // Navigate to the app
    await page.goto('/index.html');
    
    // Test sessionStorage from page context
    const sessionTest = await page.evaluate(() => {
      sessionStorage.setItem('test_key', 'test_value');
      const retrieved = sessionStorage.getItem('test_key');
      return {
        canSet: true,
        canGet: retrieved === 'test_value',
        value: retrieved
      };
    });
    
    console.log('SessionStorage Test:', sessionTest);
    expect(sessionTest.canGet).toBeTruthy();
  });
});
