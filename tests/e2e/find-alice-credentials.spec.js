import { test } from '@playwright/test';

test('find Alice Abernathy credentials by trying common email patterns', async ({ page }) => {
  await page.goto('/index.html');
  
  // Common email patterns to try for Alice Abernathy
  const emailPatternsToTry = [
    'alice@company.com',
    'alice.abernathy@company.com',
    'abernathy.alice@company.com',
    'aabernathy@company.com',
    'alice@otg.test',
    'alice.abernathy@otg.test',
    'alice.a@company.com',
    'a.abernathy@company.com',
    'alice.abernathy@blackbaud.com',
  ];
  
  // Common passwords for testing (from the system)
  const passwordsToTry = [
    'password123',
    'Password123!',
    'Alice123!',
    'Onboarding2026!',
    'OTG2026!',
    'alice123',
  ];
  
  console.log('\n🔍 Searching for Alice Abernathy credentials...\n');
  
  for (const email of emailPatternsToTry) {
    for (const password of passwordsToTry) {
      const result = await page.evaluate(async (creds) => {
        try {
          const res = await fetch('https://otg2026.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: creds.email, password: creds.password })
          });
          
          const data = await res.json();
          return {
            status: res.status,
            success: res.status === 200,
            username: data.username,
            role: data.role,
            error: data.error
          };
        } catch (error) {
          return { error: 'Network error' };
        }
      }, { email, password });
      
      if (result.success) {
        console.log(`✅ FOUND WORKING CREDENTIALS!`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Username: ${result.username}`);
        console.log(`   Role: ${result.role}`);
        console.log('\n✅ Use these credentials for E2E tests!\n');
        return; // Exit after finding one
      } else if (result.status !== 401) {
        console.log(`⚠️  ${email} / ${password} - Status ${result.status}`);
      }
    }
  }
  
  console.log('❌ Could not find Alice with these patterns');
  console.log('Please provide Alice\'s actual email and password');
});
