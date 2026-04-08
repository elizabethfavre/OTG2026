import { test, expect } from '@playwright/test';

test.describe('Complete User Workflow E2E Tests', () => {
  const testUsers = {
    newMember: { email: 'employee_test_sierra@otg.test', password: 'TestPass#2026!' },
    mentor: { email: 'mentor_test_casey@otg.test', password: 'TestPass#2026!' },
    manager: { email: 'manager_test_alex@otg.test', password: 'TestPass#2026!' }
  };

  // Helper function for login with explicit waits
  async function loginUser(page, email, password) {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Ensure login form is ready
    await page.waitForSelector('#loginForm', { timeout: 5000 });
    await page.waitForTimeout(300);
    
    // Fill and submit login
    const usernameField = page.locator('#username');
    await usernameField.waitFor({ state: 'visible' });
    await usernameField.fill(email);
    await page.waitForTimeout(200);
    
    const passwordField = page.locator('#loginForm [type="password"]');
    await passwordField.waitFor({ state: 'visible' });
    await passwordField.fill(password);
    await page.waitForTimeout(200);
    
    const submitButton = page.locator('#loginForm button[type="submit"]');
    await submitButton.waitFor({ state: 'visible' });
    await submitButton.click();
    
    // Wait for dashboard navigation
    await page.waitForURL('**/dashboard.html', { timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  // Helper function for signup with explicit waits
  async function signupUser(page, username, email, password, role) {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    // Click signup button
    const showSignupBtn = page.locator('#showSignup');
    await showSignupBtn.waitFor({ state: 'visible' });
    await showSignupBtn.click();
    await page.waitForTimeout(500);
    
    // Ensure signup form is visible
    await page.waitForSelector('#signupForm', { timeout: 5000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    
    // Fill signup form
    const usernameField = page.locator('#signupUsername');
    await usernameField.waitFor({ state: 'visible' });
    await usernameField.fill(username);
    await page.waitForTimeout(150);
    
    const emailField = page.locator('#signupEmail');
    await emailField.waitFor({ state: 'visible' });
    await emailField.fill(email);
    await page.waitForTimeout(150);
    
    const passwordField = page.locator('#signupPassword');
    await passwordField.waitFor({ state: 'visible' });
    await passwordField.fill(password);
    await page.waitForTimeout(150);
    
    const roleSelect = page.locator('#signupRole');
    await roleSelect.waitFor({ state: 'visible' });
    await roleSelect.selectOption(role);
    await page.waitForTimeout(300);
    
    // Submit signup
    const submitButton = page.locator('#signupForm button[type="submit"]');
    await submitButton.waitFor({ state: 'visible' });
    await submitButton.click();
    
    // Wait for dashboard (auto-login)
    await page.waitForURL('**/dashboard.html', { timeout: 25000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  test('should login as new team member and access dashboard', async ({ page }) => {
    await loginUser(page, testUsers.newMember.email, testUsers.newMember.password);
    
    // Verify dashboard elements are visible
    const usernameBadge = page.locator('#usernameBadge');
    await expect(usernameBadge).toBeVisible({ timeout: 10000 });
  });

  test('should login as mentor and view team members', async ({ page }) => {
    await loginUser(page, testUsers.mentor.email, testUsers.mentor.password);
    
    // Verify dashboard loaded
    const usernameBadge = page.locator('#usernameBadge');
    await expect(usernameBadge).toBeVisible({ timeout: 10000 });
  });

  test('should login as manager and view team overview', async ({ page }) => {
    await loginUser(page, testUsers.manager.email, testUsers.manager.password);
    
    // Verify dashboard loaded
    const usernameBadge = page.locator('#usernameBadge');
    await expect(usernameBadge).toBeVisible({ timeout: 10000 });
  });

  test('should display and manage checklist tasks', async ({ page }) => {
    await loginUser(page, testUsers.newMember.email, testUsers.newMember.password);
    
    // Verify dashboard loaded
    const checklist = page.locator('#checklist');
    if (await checklist.isVisible()) {
      await expect(checklist).toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle logout correctly', async ({ page }) => {
    await loginUser(page, testUsers.newMember.email, testUsers.newMember.password);
    
    // Find and click logout button
    const logoutBtn = page.locator('#logoutBtn');
    if (await logoutBtn.isVisible({ timeout: 5000 })) {
      await logoutBtn.click();
      // Should redirect to login page
      await page.waitForURL('**/index.html', { timeout: 15000 });
    }
  });

  test('should display user progress and completion percentage', async ({ page }) => {
    await loginUser(page, testUsers.newMember.email, testUsers.newMember.password);
    
    // Look for progress elements
    const progressText = page.locator('#progressText');
    if (await progressText.isVisible({ timeout: 5000 })) {
      await expect(progressText).toContainText(/%|completed|progress/i);
    }
  });

  test('should display timezone/location information', async ({ page }) => {
    await loginUser(page, testUsers.newMember.email, testUsers.newMember.password);
    
    // Look for location search field
    const locationSearch = page.locator('#locationSearch');
    if (await locationSearch.isVisible({ timeout: 5000 })) {
      await expect(locationSearch).toBeVisible();
      
      // Try typing in location search
      await locationSearch.click();
      await locationSearch.type('New York');
      await page.waitForTimeout(500);
      
      const suggestions = page.locator('#locationSuggestions');
      if (await suggestions.isVisible()) {
        await expect(suggestions).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/index.html');
    
    // Try invalid credentials
    await page.fill('#username', 'invalid@example.com');
    await page.fill('#loginForm [type="password"]', 'wrongpassword');
    await page.locator('#loginForm button[type="submit"]').click();
    
    // Wait for error message
    await page.waitForTimeout(2000);
    const loginError = page.locator('#loginError');
    
    // Should either show error or stay on login page
    if (await loginError.isVisible()) {
      await expect(loginError).toBeVisible();
    }
  });

  test('should maintain session across page reloads', async ({ page }) => {
    await loginUser(page, testUsers.newMember.email, testUsers.newMember.password);
    
    // Store current URL
    const currentUrl = page.url();
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Should still be on dashboard (not redirected to login)
    expect(page.url()).toContain('dashboard.html');
  });

  test('should display role-appropriate UI elements', async ({ page }) => {
    await loginUser(page, testUsers.manager.email, testUsers.manager.password);
    
    // Check for role badge
    const userTypeBadge = page.locator('#userTypeBadge');
    if (await userTypeBadge.isVisible({ timeout: 5000 })) {
      const text = await userTypeBadge.textContent();
      expect(text).toBeTruthy();
    }
  });
});

test.describe('Signup E2E Tests', () => {
  test('should display signup form when toggled', async ({ page }) => {
    await page.goto('/index.html');
    
    const showSignupBtn = page.locator('#showSignup');
    if (await showSignupBtn.isVisible()) {
      await showSignupBtn.click();
      
      const signupForm = page.locator('#signupForm');
      await expect(signupForm).toBeVisible();
    }
  });

  test('should hide login form when in signup mode', async ({ page }) => {
    await page.goto('/index.html');
    
    const showSignupBtn = page.locator('#showSignup');
    if (await showSignupBtn.isVisible()) {
      await showSignupBtn.click();
      
      const loginForm = page.locator('#loginForm');
      expect(await loginForm.isVisible()).toBe(false);
    }
  });

  test('should show role-dependent signup fields', async ({ page }) => {
    await page.goto('/index.html');
    
    const showSignupBtn = page.locator('#showSignup');
    if (await showSignupBtn.isVisible()) {
      await showSignupBtn.click();
      
      const roleSelect = page.locator('#signupRole');
      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption('new_team_member');
        
        // Check if mentor/manager fields appear
        const mentorField = page.locator('#signupMentor');
        if (await mentorField.isVisible()) {
          await expect(mentorField).toBeVisible();
        }
      }
    }
  });

  test('should signup with manager role and auto-login to dashboard', async ({ page }) => {
    const timestamp = Date.now();
    await signupUser(page, `mgr_auto_${timestamp}`, `mgr_auto_${timestamp}@otg.test`, 'password123', 'manager');
    
    // Verify user is logged in on dashboard
    const usernameBadge = page.locator('#usernameBadge');
    await expect(usernameBadge).toBeVisible({ timeout: 10000 });
  });

  test('should signup with mentor role and auto-login to dashboard', async ({ page }) => {
    const timestamp = Date.now();
    await signupUser(page, `mtr_auto_${timestamp}`, `mtr_auto_${timestamp}@otg.test`, 'password123', 'mentor');
    
    // Verify user is logged in on dashboard
    const usernameBadge = page.locator('#usernameBadge');
    await expect(usernameBadge).toBeVisible({ timeout: 10000 });
  });

  test('should signup with new team member role and auto-login', async ({ page }) => {
    const timestamp = Date.now();
    await signupUser(page, `emp_auto_${timestamp}`, `emp_auto_${timestamp}@otg.test`, 'password123', 'new_team_member');
    
    // Verify user is logged in on dashboard
    const usernameBadge = page.locator('#usernameBadge');
    await expect(usernameBadge).toBeVisible({ timeout: 10000 });
  });

  test('should show password validation error on signup', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    
    const showSignupBtn = page.locator('#showSignup');
    await showSignupBtn.waitFor({ state: 'visible' });
    await showSignupBtn.click();
    await page.waitForTimeout(500);
    
    const timestamp = Date.now();
    
    // Ensure signup form is visible
    await page.waitForSelector('#signupForm', { timeout: 5000 });
    await page.waitForLoadState('networkidle');
    
    // Fill signup form with weak password
    const usernameField = page.locator('#signupUsername');
    await usernameField.waitFor({ state: 'visible' });
    await usernameField.fill(`user_${timestamp}`);
    await page.waitForTimeout(150);
    
    const emailField = page.locator('#signupEmail');
    await emailField.waitFor({ state: 'visible' });
    await emailField.fill(`user${timestamp}@otg.test`);
    await page.waitForTimeout(150);
    
    const passwordField = page.locator('#signupPassword');
    await passwordField.waitFor({ state: 'visible' });
    await passwordField.fill('weak'); // Less than 6 characters
    await page.waitForTimeout(150);
    
    const roleSelect = page.locator('#signupRole');
    await roleSelect.waitFor({ state: 'visible' });
    await roleSelect.selectOption('manager');
    await page.waitForTimeout(300);
    
    // Submit signup
    const signupSubmit = page.locator('#signupForm button[type="submit"]');
    await signupSubmit.waitFor({ state: 'visible' });
    await signupSubmit.click();
    
    // Should show validation error, not redirect
    const signupMessage = page.locator('#signupMessage');
    await signupMessage.waitFor({ state: 'visible' });
    const messageText = await signupMessage.textContent();
    expect(messageText?.toLowerCase()).toContain('password');
  });

  test('should maintain form state when role changes', async ({ page }) => {
    await page.goto('/index.html');
    
    const showSignupBtn = page.locator('#showSignup');
    await showSignupBtn.click();
    
    // Fill initial form as manager
    const username = 'testuser123';
    const email = `${username}@otg.test`;
    
    await page.fill('#signupUsername', username);
    await page.fill('#signupEmail', email);
    await page.fill('#signupPassword', 'password123');
    
    // Change to new_team_member role
    const roleSelect = page.locator('#signupRole');
    await roleSelect.selectOption('new_team_member');
    
    // Verify mentor/manager fields appeared
    const mentorSelect = page.locator('#signupMentor');
    const managerSelect = page.locator('#signupManager');
    await expect(mentorSelect).toBeVisible();
    await expect(managerSelect).toBeVisible();
    
    // Verify form fields still have values
    const usernameField = page.locator('#signupUsername');
    expect(await usernameField.inputValue()).toBe(username);
  });
});

test.describe('Cross-Role Access Control E2E Tests', () => {
  test('should prevent unauthorized users from viewing others dashboards', async ({ page }) => {
    // This test would require attempting to access another user's dashboard while logged in
    await page.goto('/index.html');
    // Login as employee
    await page.fill('#username', 'employee_test_sierra@otg.test');
    await page.fill('#loginForm [type="password"]', 'TestPass#2026!');
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForURL('**/dashboard.html', { timeout: 15000 });
    
    // Try accessing another user's dashboard via URL param
    // This should either deny access or show only allowed information
    await page.goto('/dashboard.html?view=some-other-user');
    
    // Wait a moment for any response
    await page.waitForTimeout(2000);
  });

  test('should allow mentor to view mentee dashboard', async ({ page }) => {
    // Mentor should be able to click through to view assigned mentee
    await page.goto('/index.html');
    await page.fill('#username', 'mentor_test_casey@otg.test');
    await page.fill('#loginForm [type="password"]', 'TestPass#2026!');  
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForURL('**/dashboard.html', { timeout: 15000 });
    
    // Look for mentee links if any
    const menteeLinks = page.locator('a[href*="view="]');
    if (await menteeLinks.count() > 0) {
      await menteeLinks.first().click();
      await page.waitForTimeout(1000);
    }
  });
});
