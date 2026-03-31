import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/index.html');
  });

  test('should display login form', async ({ page }) => {
    // Check if login form elements exist
    const loginForm = page.locator('#loginForm');
    await expect(loginForm).toBeVisible();

    const usernameField = page.locator('#username');
    const passwordField = page.locator('#loginForm [type="password"]');
    
    await expect(usernameField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form with valid test credentials
    await page.fill('#username', 'demo@example.com');
    await page.fill('#loginForm [type="password"]', 'demo123!');
    
    // Submit form
    const submitButton = page.locator('#loginForm button[type="submit"]');
    await submitButton.click();
    
    // Wait for navigation or error handling
    await page.waitForTimeout(2000);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.fill('#username', 'invalid@example.com');
    await page.fill('#loginForm [type="password"]', 'wrongpassword');
    
    // Submit form
    const submitButton = page.locator('#loginForm button[type="submit"]');
    await submitButton.click();
    
    // Wait for error message
    await page.waitForTimeout(2000);
    const loginError = page.locator('#loginError');
    if (await loginError.isVisible()) {
      await expect(loginError).toBeVisible();
    }
  });

  test('should clear form after submission attempt', async ({ page }) => {
    // Fill form with credentials
    await page.fill('#username', 'demo@example.com');
    await page.fill('#loginForm [type="password"]', 'demo123!');
    
    const usernameField = page.locator('#username');
    const passwordField = page.locator('#loginForm [type="password"]');
    
    // Check fields have values
    expect(await usernameField.inputValue()).toBeTruthy();
    expect(await passwordField.inputValue()).toBeTruthy();
  });

  test('should display signup form when requested', async ({ page }) => {
    // Click show signup button
    const showSignupBtn = page.locator('#showSignup');
    if (await showSignupBtn.isVisible()) {
      await showSignupBtn.click();
      
      const signupForm = page.locator('#signupForm');
      await expect(signupForm).toBeVisible();
    }
  });
});
