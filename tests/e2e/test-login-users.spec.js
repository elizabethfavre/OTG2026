import { test } from '@playwright/test';

test.describe('Login with Test Users', () => {
  test('Login with manager_alex', async ({ page }) => {
    await page.goto('http://localhost:5500');
    
    // Try to login
    await page.fill('input[name="username"]', 'manager_alex@otg.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait a bit for the response
    await page.waitForTimeout(3000);
    
    // Check if we got a token
    const authToken = await page.evaluate(() => sessionStorage.getItem('authToken'));
    const currentUser = await page.evaluate(() => sessionStorage.getItem('currentUser'));
    
    console.log('Auth Token:', authToken ? 'EXISTS' : 'MISSING');
    console.log('Current User:', currentUser);
    console.log('URL:', page.url());
  });

  test('Try alternative emails for alice', async ({ page }) => {
    const emails = [
      'alice.abernathy@otg.test',
      'alice@otg.test',
      'aalice@otg.test',
      'abernathy@otg.test',
      'alice.abernathy@example.com'
    ];

    for (const email of emails) {
      await page.goto('http://localhost:5500');
      await page.fill('input[name="username"]', email);
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      const authToken = await page.evaluate(() => sessionStorage.getItem('authToken'));
      if (authToken) {
        console.log(`✅ Found working email: ${email}`);
        break;
      } else {
        console.log(`❌ No match: ${email}`);
      }
    }
  });
});
