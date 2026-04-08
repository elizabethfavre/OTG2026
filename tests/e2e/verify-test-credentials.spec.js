import { test } from '@playwright/test';

test('verify which test credentials work', async ({ page }) => {
  await page.goto('/index.html');
  
  // Test credentials we created
  const credentialsToTest = [
    { email: 'manager_test_alex@otg.test', password: 'TestPass#2026!', name: 'Test User - manager_test_alex' },
    { email: 'mentor_test_casey@otg.test', password: 'TestPass#2026!', name: 'Test User - mentor_test_casey' },
    { email: 'employee_test_sierra@otg.test', password: 'TestPass#2026!', name: 'Test User - employee_test_sierra' },
    { email: 'mentor_test_dash@otg.test', password: 'TestPass#2026!', name: 'Test User - mentor_test_dash' },
    { email: 'employee_test_reassign@otg.test', password: 'TestPass#2026!', name: 'Test User - employee_test_reassign' },
  ];
  
  for (const cred of credentialsToTest) {
    console.log(`\n╔════════════════════════════════════════`);
    console.log(`║ Testing: ${cred.name}`);
    console.log(`║ Email: ${cred.email}`);
    console.log(`╚════════════════════════════════════════`);
    
    const response = await page.evaluate(async (creds) => {
      try {
        const res = await fetch('https://otg2026.onrender.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: creds.email, password: creds.password })
        });
        
        const data = await res.json();
        return {
          status: res.status,
          statusText: res.statusText,
          hasToken: !!data.token,
          hasError: !!data.error,
          error: data.error,
          uid: data.uid,
          username: data.username,
          role: data.role
        };
      } catch (error) {
        return {
          error: true,
          message: error.message
        };
      }
    }, { email: cred.email, password: cred.password });
    
    if (response.error && response.message) {
      console.log(`Result: NETWORK ERROR - ${response.message}`);
    } else if (response.status === 200) {
      console.log(`✅ SUCCESS (200)`);
      console.log(`   UID: ${response.uid}`);
      console.log(`   Username: ${response.username}`);
      console.log(`   Role: ${response.role}`);
      console.log(`   Token: ${response.hasToken ? 'YES' : 'NO'}`);
    } else {
      console.log(`❌ FAILED (${response.status} ${response.statusText})`);
      console.log(`   Error: ${response.error}`);
    }
  }
});
