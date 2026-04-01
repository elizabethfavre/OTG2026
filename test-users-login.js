#!/usr/bin/env node

import https from 'https';

async function testLogin(email, password) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email, password });
    
    const options = {
      hostname: 'otg2026.onrender.com',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ status: 0, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Testing if test users can now log in...\n');
  
  const testUsers = [
    { email: 'manager_alex@otg.test', password: 'password123' },
    { email: 'mentor_casey@otg.test', password: 'password123' },
    { email: 'employee_sierra@otg.test', password: 'password123' }
  ];

  for (const user of testUsers) {
    const result = await testLogin(user.email, user.password);
    if (result.status === 200) {
      console.log(`✅ ${user.email}: Successfully logged in!`);
      if (result.data.user) {
        console.log(`   User ID: ${result.data.user.uid}`);
      }
    } else if (result.status === 401) {
      console.log(`❌ ${user.email}: Invalid credentials`);
    } else {
      console.log(`⚠️  ${user.email}: Status ${result.status}`);
      if (result.data?.error) {
        console.log(`   Error: ${result.data.error}`);
      }
    }
  }
}

main();
