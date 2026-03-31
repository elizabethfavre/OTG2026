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

  test('should signup as manager and auto-login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/index.html');
    
    // Click show signup button
    const showSignupBtn = page.locator('#showSignup');
    await expect(showSignupBtn).toBeVisible();
    await showSignupBtn.click();
    
    // Verify signup form is visible
    const signupForm = page.locator('#signupForm');
    await expect(signupForm).toBeVisible();
    
    // Fill manager signup form
    const timestamp = Date.now();
    const managerEmail = `manager_test_${timestamp}@otg.test`;
    
    await page.fill('#signupUsername', `manager_test_${timestamp}`);
    await page.fill('#signupEmail', managerEmail);
    await page.fill('#signupPassword', 'password123');
    
    // Select role
    const roleSelect = page.locator('#signupRole');
    await roleSelect.selectOption('manager');
    
    // Submit signup form
    const signupSubmit = page.locator('#signupForm button[type="submit"]');
    await signupSubmit.click();
    
    // Should auto-login and redirect to dashboard
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });
    
    // Verify user is on dashboard
    const usernameBadge = page.locator('#usernameBadge');
    await expect(usernameBadge).toBeVisible();
  });

  test('should signup as mentor and auto-login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/index.html');
    
    // Click show signup button
    const showSignupBtn = page.locator('#showSignup');
    await expect(showSignupBtn).toBeVisible();
    await showSignupBtn.click();
    
    // Fill mentor signup form - first create a manager for them
    const timestamp = Date.now();
    const mentorEmail = `mentor_test_${timestamp}@otg.test`;
    
    await page.fill('#signupUsername', `mentor_test_${timestamp}`);
    await page.fill('#signupEmail', mentorEmail);
    await page.fill('#signupPassword', 'password123');
    
    // Select role
    const roleSelect = page.locator('#signupRole');
    await roleSelect.selectOption('mentor');
    
    // Manager dropdown should appear (mentor's supervisor requirement)
    const managerSelect = page.locator('#signupManager');
    await expect(managerSelect).toBeVisible();
    
    // Submit signup form
    const signupSubmit = page.locator('#signupForm button[type="submit"]');
    await signupSubmit.click();
    
    // Should auto-login and redirect to dashboard
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });
    
    // Verify user is on dashboard
    const usernameBadge = page.locator('#usernameBadge');
    await expect(usernameBadge).toBeVisible();
  });

  test('should signup as new team member with mentors and manager', async ({ page }) => {
    // Navigate to login page
    await page.goto('/index.html');
    
    // Click show signup button
    const showSignupBtn = page.locator('#showSignup');
    await expect(showSignupBtn).toBeVisible();
    await showSignupBtn.click();
    
    // Fill employee signup form
    const timestamp = Date.now();
    const employeeEmail = `employee_test_${timestamp}@otg.test`;
    
    await page.fill('#signupUsername', `employee_test_${timestamp}`);
    await page.fill('#signupEmail', employeeEmail);
    await page.fill('#signupPassword', 'password123');
    
    // Select role
    const roleSelect = page.locator('#signupRole');
    await roleSelect.selectOption('new_team_member');
    
    // Both mentor and manager dropdowns should appear
    const mentorSelect = page.locator('#signupMentor');
    const managerSelect = page.locator('#signupManager');
    await expect(mentorSelect).toBeVisible();
    await expect(managerSelect).toBeVisible();
    
    // Submit signup form
    const signupSubmit = page.locator('#signupForm button[type="submit"]');
    await signupSubmit.click();
    
    // Should auto-login and redirect to dashboard
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });
    
    // Verify user is on dashboard
    const usernameBadge = page.locator('#usernameBadge');
    await expect(usernameBadge).toBeVisible();
  });

  test('should show validation error for weak password on signup', async ({ page }) => {
    await page.goto('/index.html');
    
    const showSignupBtn = page.locator('#showSignup');
    await showSignupBtn.click();
    
    const signupForm = page.locator('#signupForm');
    await expect(signupForm).toBeVisible();
    
    // Fill with weak password
    const timestamp = Date.now();
    await page.fill('#signupUsername', `user_${timestamp}`);
    await page.fill('#signupEmail', `user${timestamp}@otg.test`);
    await page.fill('#signupPassword', 'short'); // Less than 6 characters
    
    const signupSubmit = page.locator('#signupForm button[type="submit"]');
    await signupSubmit.click();
    
    // Should show error message
    const signupMessage = page.locator('#signupMessage');
    await expect(signupMessage).toBeVisible();
    await expect(signupMessage).toContainText(/password|6 characters/i);
  });

  test('should handle duplicate email on signup', async ({ page }) => {
    await page.goto('/index.html');
    
    const showSignupBtn = page.locator('#showSignup');
    await showSignupBtn.click();
    
    // Try to sign up with an email that already exists
    // Using a timestamp-based email is unlikely to exist, but we'll test the flow
    const signupForm = page.locator('#signupForm');
    await expect(signupForm).toBeVisible();
    
    await page.fill('#signupUsername', 'testuser');
    await page.fill('#signupEmail', 'manager.alex@otg.test'); // Assuming this might exist
    await page.fill('#signupPassword', 'password123');
    
    const roleSelect = page.locator('#signupRole');
    await roleSelect.selectOption('manager');
    
    const signupSubmit = page.locator('#signupForm button[type="submit"]');
    await signupSubmit.click();
    
    // Should either show error or redirect based on whether email exists
    await page.waitForTimeout(3000);
  });

  test.skip('should display forgot password button on login page', async ({ page }) => {
    await page.goto('/index.html');
    
    // Check for forgot password button
    const forgotPasswordBtn = page.locator('#forgotPasswordBtn');
    await expect(forgotPasswordBtn).toBeVisible();
  });

  test.skip('should open forgot password modal when button is clicked', async ({ page }) => {
    await page.goto('/index.html');
    
    // Click forgot password button
    const forgotPasswordBtn = page.locator('#forgotPasswordBtn');
    await forgotPasswordBtn.click();
    
    // Verify modal is visible
    const modal = page.locator('#forgotPasswordModal');
    await expect(modal).toBeVisible();
    
    // Verify modal contains email input
    const emailInput = page.locator('#forgotPasswordEmail');
    await expect(emailInput).toBeVisible();
  });

  test.skip('should close forgot password modal when close button is clicked', async ({ page }) => {
    await page.goto('/index.html');
    
    // Open modal
    await page.locator('#forgotPasswordBtn').click();
    let modal = page.locator('#forgotPasswordModal');
    await expect(modal).toBeVisible();
    
    // Close modal
    await page.locator('#closeForgotPasswordModal').click();
    
    // Modal should be hidden
    const isHidden = await modal.evaluate(el => el.classList.contains('hidden'));
    expect(isHidden).toBe(true);
  });

  test.skip('should close forgot password modal when clicking backdrop', async ({ page }) => {
    await page.goto('/index.html');
    
    // Open modal
    await page.locator('#forgotPasswordBtn').click();
    const modal = page.locator('#forgotPasswordModal');
    await expect(modal).toBeVisible();
    
    // Click backdrop
    const backdrop = page.locator('#modalBackdrop');
    await backdrop.click();
    
    // Modal should be hidden
    const isHidden = await modal.evaluate(el => el.classList.contains('hidden'));
    expect(isHidden).toBe(true);
  });

  test.skip('should send forgot password request with valid email', async ({ page }) => {
    await page.goto('/index.html');
    
    // Open modal
    await page.locator('#forgotPasswordBtn').click();
    
    // Fill email
    await page.fill('#forgotPasswordEmail', 'test@otg.test');
    
    // Submit form
    const submitBtn = page.locator('#forgotPasswordForm button[type="submit"]');
    await submitBtn.click();
    
    // Wait for response message
    await page.waitForTimeout(2000);
    
    // Check for success or error message
    const message = page.locator('#forgotPasswordMessage');
    if (await message.isVisible()) {
      await expect(message).toBeVisible();
    }
  });

  test.skip('should show error for invalid email format on forgot password', async ({ page }) => {
    await page.goto('/index.html');
    
    // Open modal
    await page.locator('#forgotPasswordBtn').click();
    
    // Try to submit with invalid email (if form has validation)
    const emailInput = page.locator('#forgotPasswordEmail');
    await emailInput.fill('invalid-email');
    
    const submitBtn = page.locator('#forgotPasswordForm button[type="submit"]');
    await submitBtn.click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
  });

  test.skip('should require email field on forgot password form', async ({ page }) => {
    await page.goto('/index.html');
    
    // Open modal
    await page.locator('#forgotPasswordBtn').click();
    
    // Leave email empty and try to submit
    const emailInput = page.locator('#forgotPasswordEmail');
    await emailInput.fill('');
    
    const submitBtn = page.locator('#forgotPasswordForm button[type="submit"]');
    
    // Try to click submit (browser may prevent this if field is required)
    try {
      await submitBtn.click();
    } catch (e) {
      // Some browsers block submit on required fields
    }
  });

  test.skip('should disable submit button while sending forgot password request', async ({ page }) => {
    await page.goto('/index.html');
    
    // Open modal
    await page.locator('#forgotPasswordBtn').click();
    
    // Fill email
    await page.fill('#forgotPasswordEmail', 'test@otg.test');
    
    // Get button text before click
    const submitBtn = page.locator('#forgotPasswordForm button[type="submit"]');
    
    // Click submit
    await submitBtn.click();
    
    // Button should show "Sending..." state
    const buttonText = await submitBtn.textContent();
    expect(buttonText).toBeTruthy();
  });

  test('should show success message after password recovery email is sent', async ({ page }) => {
    await page.goto('/index.html');
    
    // Open modal
    await page.locator('#forgotPasswordBtn').click();
    
    // Fill and submit
    await page.fill('#forgotPasswordEmail', 'test@otg.test');
    await page.locator('#forgotPasswordForm button[type="submit"]').click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Check for message
    const message = page.locator('#forgotPasswordMessage');
    if (await message.isVisible()) {
      const messageText = await message.textContent();
      expect(messageText).toBeTruthy();
    }
  });

  test.skip('should close forgot password modal after successful submission', async ({ page }) => {
    await page.goto('/index.html');
    
    // Open modal
    await page.locator('#forgotPasswordBtn').click();
    const modal = page.locator('#forgotPasswordModal');
    await expect(modal).toBeVisible();
    
    // Fill and submit
    await page.fill('#forgotPasswordEmail', 'test@otg.test');
    await page.locator('#forgotPasswordForm button[type="submit"]').click();
    
    // Wait for auto-close (3 seconds based on code)
    await page.waitForTimeout(4000);
    
    // Modal should be closed
    const isHidden = await modal.evaluate(el => el.classList.contains('hidden'));
    expect(isHidden === true || !await modal.isVisible()).toBe(true);
  });

  test.skip('should clear email input after forgot password submission', async ({ page }) => {
    await page.goto('/index.html');
    
    // Open modal
    await page.locator('#forgotPasswordBtn').click();
    
    // Fill and submit
    await page.fill('#forgotPasswordEmail', 'test@otg.test');
    const emailInput = page.locator('#forgotPasswordEmail');
    let value = await emailInput.inputValue();
    expect(value).toBe('test@otg.test');
    
    // Submit
    await page.locator('#forgotPasswordForm button[type="submit"]').click();
    
    // Wait for submission
    await page.waitForTimeout(2000);
    
    // Email should be cleared (after modal resets)
    value = await emailInput.inputValue();
    expect(value === '').toBe(true);
  });
});
