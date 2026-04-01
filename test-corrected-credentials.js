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
      rejectUnauthorized: false
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
  console.log('Testing login with CORRECTED test user credentials...\n');
  
  const testUsers = [
    { email: 'alex.manager@company.com', password: 'MgrAlex#2026!' },
    { email: 'casey.mentor@company.com', password: 'MentorCasey#2026!' },
    { email: 'sierra.emp@company.com', password: 'EmpSierra#2026!' },
  ];

  for (const user of testUsers) {
    const result = await testBackendLogin(user.email, user.password);
    console.log(`${user.email}:`);
    if (result.status === 200) {
      console.log(`  ✅ Login successful! Role: ${result.data.role}`);
    } else {
      console.log(`  ❌ Status ${result.status}: ${result.data?.error}`);
    }
  }
}

main();
