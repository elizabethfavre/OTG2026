import { test } from '@playwright/test';

test('find valid test users in backend', async ({ page }) => {
  await page.goto('/index.html');
  
  const users = await page.evaluate(async () => {
    try {
      const res = await fetch('https://otg2026.onrender.com/api/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        return { error: `Status ${res.status}` };
      }
      
      return await res.json();
    } catch (error) {
      return { error: error.message };
    }
  });
  
  if (users.error) {
    console.log('❌ Error fetching users:', users.error);
  } else {
    console.log('✅ Users found in backend:', users.length);
    console.log('\n🔍 USER LIST:\n');
    
    // Show first 10 users
    users.slice(0, 10).forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.username || user.email}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   UID: ${user.uid}`);
      console.log('');
    });
    
    // Look for Alice
    const alice = users.find(u => u.username?.toLowerCase().includes('alice') || u.email?.toLowerCase().includes('alice'));
    if (alice) {
      console.log('🎯 FOUND ALICE:');
      console.log(`   Username: ${alice.username}`);
      console.log(`   Email: ${alice.email}`);
      console.log(`   Role: ${alice.role}`);
    }
    
    // Show managers (good for testing)
    const managers = users.filter(u => u.role === 'manager');
    console.log(`\n📋 MANAGERS (${managers.length} total):`);
    managers.slice(0, 5).forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.username} - ${user.email}`);
    });
  }
});
