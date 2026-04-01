#!/usr/bin/env node

import https from 'https';

async function testBackendLogin(email, password) {
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
      },
      rejectUnauthorized: false  // Ignore SSL errors
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
  console.log('Testing backend login with correct credentials...\n');
  
  const testUsers = [
    { email: 'alex.manager@company.com', password: 'MgrAlex#2026!' },
    { email: 'casey.mentor@company.com', password: 'MentorCasey#2026!' },
    { email: 'sierra.emp@company.com', password: 'EmpSierra#2026!' },
    { email: 'jordan.manager@company.com', password: 'MgrJordan#2026!' },
  ];

  for (const user of testUsers) {
    const result = await testBackendLogin(user.email, user.password);
    console.log(`\nTesting ${user.email}:`);
    console.log(`  Status: ${result.status}`);
    if (result.status === 200) {
      console.log(`  ✅ Login successful!`);
      if (result.data.role) {
        console.log(`  Role: ${result.data.role}`);
      }
    } else {
      console.log(`  Error: ${result.data?.error || 'Unknown error'}`);
    }
  }
}

main();
