import { test } from '@playwright/test';

test('Direct Backend API Test', async ({ page }) => {
  await page.goto('http://localhost:5500');
  
  // Make a direct fetch call from the browser
  const response = await page.evaluate(async () => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'alex.manager@company.com',
          password: 'MgrAlex#2026!'
        })
      });
      
      const status = res.status;
      const ok = res.ok;
      console.log('Response status:', status, 'ok:', ok);
      
      // Try to read response
      let body;
      try {
        body = await res.json();
      } catch (e) {
        body = await res.text();
      }
      
      console.log('Response body:', JSON.stringify(body));
      return { status, ok, body };
    } catch (error) {
      console.error('Fetch error:', error.message);
      return { error: error.message };
    }
  });
  
  console.log('Final response:', JSON.stringify(response));
});
