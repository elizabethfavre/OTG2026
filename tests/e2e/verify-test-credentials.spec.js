import { test } from '@playwright/test';
import { getE2ETestUsers } from './test-users.js';

const seededUsers = getE2ETestUsers();

test('verify which test credentials work', async ({ page }) => {
  await page.goto('/index.html');
  
  // Test credentials we created
  const credentialsToTest = [
    { email: seededUsers.manager.email, password: seededUsers.manager.password, name: 'Test User - seeded manager' },
    { email: seededUsers.mentorPrimary.email, password: seededUsers.mentorPrimary.password, name: 'Test User - seeded mentor primary' },
    { email: seededUsers.employeePrimary.email, password: seededUsers.employeePrimary.password, name: 'Test User - seeded employee primary' },
    { email: seededUsers.mentorSecondary.email, password: seededUsers.mentorSecondary.password, name: 'Test User - seeded mentor secondary' },
    { email: seededUsers.employeeReassign.email, password: seededUsers.employeeReassign.password, name: 'Test User - seeded employee reassign' },
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
