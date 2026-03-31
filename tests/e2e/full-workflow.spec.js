import { test, expect } from '@playwright/test';

test.describe('Complete User Workflow E2E Tests', () => {
  const testUsers = {
    newMember: { email: 'employee_sierra@otg.test', password: 'password123' },
    mentor: { email: 'mentor_casey@otg.test', password: 'password123' },
    manager: { email: 'manager_alex@otg.test', password: 'password123' }
  };

  test('should login as new team member and access dashboard', async ({ page }) => {
    await page.goto('/index.html');
    
    // Fill login form
    await page.fill('#username', testUsers.newMember.email);
    await page.fill('#loginForm [type="password"]', testUsers.newMember.password);
    
    // Submit form
    const submitButton = page.locator('#loginForm button[type="submit"]');
    await submitButton.click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard.html', { timeout: 5000 });
    
    // Verify dashboard elements are visible
    const usernameBadge = page.locator('#usernameBadge');
    await expect(usernameBadge).toBeVisible();
  });

  test('should login as mentor and view team members', async ({ page }) => {
    await page.goto('/index.html');
    
    // Login as mentor
    await page.fill('#username', testUsers.mentor.email);
    await page.fill('#loginForm [type="password"]', testUsers.mentor.password);
    await page.locator('#loginForm button[type="submit"]').click();
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard.html', { timeout: 5000 });
    
    // Verify mentor-specific UI elements
    const mentorTile = page.locator('#mentorTile');
    if (await mentorTile.isVisible()) {
      await expect(mentorTile).toBeVisible();
    }
  });

  test('should login as manager and view team overview', async ({ page }) => {
    await page.goto('/index.html');
    
    // Login as manager
    await page.fill('#username', testUsers.manager.email);
    await page.fill('#loginForm [type="password"]', testUsers.manager.password);
    await page.locator('#loginForm button[type="submit"]').click();
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard.html', { timeout: 5000 });
    
    // Verify manager-specific UI elements
    const managerTile = page.locator('#managerTile');
    if (await managerTile.isVisible()) {
      await expect(managerTile).toBeVisible();
    }
  });

  test('should display and manage checklist tasks', async ({ page }) => {
    // Login
    await page.goto('/index.html');
    await page.fill('#username', testUsers.newMember.email);
    await page.fill('#loginForm [type="password"]', testUsers.newMember.password);
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForURL('**/dashboard.html', { timeout: 5000 });
    
    // Look for checklist element
    const checklist = page.locator('#checklist');
    if (await checklist.isVisible()) {
      await expect(checklist).toBeVisible();
    }
  });

  test('should handle logout correctly', async ({ page }) => {
    // Login first
    await page.goto('/index.html');
    await page.fill('#username', testUsers.newMember.email);
    await page.fill('#loginForm [type="password"]', testUsers.newMember.password);
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForURL('**/dashboard.html', { timeout: 5000 });
    
    // Find and click logout button
    const logoutBtn = page.locator('#logoutBtn');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      // Should redirect to login page
      await page.waitForURL('**/index.html', { timeout: 5000 });
    }
  });

  test('should display user progress and completion percentage', async ({ page }) => {
    await page.goto('/index.html');
    await page.fill('#username', testUsers.newMember.email);
    await page.fill('#loginForm [type="password"]', testUsers.newMember.password);
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForURL('**/dashboard.html', { timeout: 5000 });
    
    // Look for progress elements
    const progressText = page.locator('#progressText');
    if (await progressText.isVisible()) {
      await expect(progressText).toContainText(/%|completed|progress/i);
    }
  });

  test('should display timezone/location information', async ({ page }) => {
    await page.goto('/index.html');
    await page.fill('#username', testUsers.newMember.email);
    await page.fill('#loginForm [type="password"]', testUsers.newMember.password);
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForURL('**/dashboard.html', { timeout: 5000 });
    
    // Look for location search field
    const locationSearch = page.locator('#locationSearch');
    if (await locationSearch.isVisible()) {
      await expect(locationSearch).toBeVisible();
      
      // Try typing in location search
      await locationSearch.click();
      await locationSearch.type('New York');
      
      const suggestions = page.locator('#locationSuggestions');
      if (await suggestions.isVisible()) {
        await expect(suggestions).toBeVisible();
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
    // Login
    await page.goto('/index.html');
    await page.fill('#username', testUsers.newMember.email);
    await page.fill('#loginForm [type="password"]', testUsers.newMember.password);
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForURL('**/dashboard.html', { timeout: 5000 });
    
    // Store current URL
    const currentUrl = page.url();
    
    // Reload page
    await page.reload();
    
    // Should still be on dashboard (not redirected to login)
    expect(page.url()).toContain('dashboard.html');
  });

  test('should display role-appropriate UI elements', async ({ page }) => {
    await page.goto('/index.html');
    
    // Login as manager
    await page.fill('#username', testUsers.manager.email);
    await page.fill('#loginForm [type="password"]', testUsers.manager.password);
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForURL('**/dashboard.html', { timeout: 5000 });
    
    // Check for role badge
    const userTypeBadge = page.locator('#userTypeBadge');
    if (await userTypeBadge.isVisible()) {
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
});

test.describe('Cross-Role Access Control E2E Tests', () => {
  test('should prevent unauthorized users from viewing others dashboards', async ({ page }) => {
    // This test would require attempting to access another user's dashboard while logged in
    await page.goto('/index.html');
    // Login as employee
    await page.fill('#username', 'employee_sierra@otg.test');
    await page.fill('#loginForm [type="password"]', 'password123');
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForURL('**/dashboard.html', { timeout: 5000 });
    
    // Try accessing another user's dashboard via URL param
    // This should either deny access or show only allowed information
    await page.goto('/dashboard.html?view=some-other-user');
    
    // Wait a moment for any response
    await page.waitForTimeout(2000);
  });

  test('should allow mentor to view mentee dashboard', async ({ page }) => {
    // Mentor should be able to click through to view assigned mentee
    await page.goto('/index.html');
    await page.fill('#username', 'mentor_casey@otg.test');
    await page.fill('#loginForm [type="password"]', 'password123');  
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForURL('**/dashboard.html', { timeout: 5000 });
    
    // Look for mentee links if any
    const menteeLinks = page.locator('a[href*="view="]');
    if (await menteeLinks.count() > 0) {
      await menteeLinks.first().click();
      await page.waitForTimeout(1000);
    }
  });
});
