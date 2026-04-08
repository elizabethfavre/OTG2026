import { test, expect } from '@playwright/test';
import { getE2ETestUsers } from './test-users.js';

const seededUsers = getE2ETestUsers();

test.describe('Login with seeded test users', () => {
  async function loginAndCheck(page, email, password, expectedRole) {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#loginForm', { timeout: 5000 });

    await page.fill('#username', email);
    await page.fill('#loginForm [type="password"]', password);
    await page.locator('#loginForm button[type="submit"]').click();

    await page.waitForURL('**/dashboard.html', { timeout: 45000 });
    await page.waitForLoadState('networkidle');

    const usernameBadge = page.locator('#usernameBadge');
    await expect(usernameBadge).toBeVisible({ timeout: 10000 });
  }

  test('login as seeded manager', async ({ page }) => {
    await loginAndCheck(page, seededUsers.manager.email, seededUsers.manager.password, 'manager');
  });

  test('login as seeded mentor (primary)', async ({ page }) => {
    await loginAndCheck(page, seededUsers.mentorPrimary.email, seededUsers.mentorPrimary.password, 'mentor');
  });

  test('login as seeded employee (primary)', async ({ page }) => {
    await loginAndCheck(page, seededUsers.employeePrimary.email, seededUsers.employeePrimary.password, 'new_team_member');
  });

  test('validate seeded credentials via API before UI login', async ({ page }) => {
    await page.goto('/index.html');

    const result = await page.evaluate(async ({ email, password }) => {
      try {
        const res = await fetch('https://otg2026.onrender.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        return { status: res.status, hasToken: !!data.token, role: data.role, uid: data.uid };
      } catch (err) {
        return { error: err.message };
      }
    }, { email: seededUsers.manager.email, password: seededUsers.manager.password });

    console.log('Seeded manager login result:', result);
    expect(result.status).toBe(200);
    expect(result.hasToken).toBe(true);
  });
});
