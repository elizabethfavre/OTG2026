#!/usr/bin/env node

import https from 'https';

// This is the Firebase API key from firebase-config.js
const FIREBASE_API_KEY = 'AIzaSyBcsy4hf2_CP3-udVuDGaVyFesesvaPaRw';

async function testFirebaseLogin(email, password) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      email,
      password,
      returnSecureToken: true
    });
    
    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      port: 443,
      path: `/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
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
  console.log('Testing Firebase REST API login directly...\n');
  
  const testUsers = [
    { email: 'alex.manager@company.com', password: 'MgrAlex#2026!' },
    { email: 'casey.mentor@company.com', password: 'MentorCasey#2026!' },
    { email: 'sierra.emp@company.com', password: 'EmpSierra#2026!' },
    { email: 'jordan.manager@company.com', password: 'MgrJordan#2026!' },
  ];

  for (const user of testUsers) {
    const result = await testFirebaseLogin(user.email, user.password);
    console.log(`\nTesting ${user.email}:`);
    console.log(`  Status: ${result.status}`);
    if (result.status === 200) {
      console.log(`  ✅ Login successful!`);
      console.log(`  UID: ${result.data.localId}`);
    } else if (result.status === 400) {
      console.log(`  ❌ Firebase error`);
      if (result.data?.error?.message) {
        console.log(`     ${result.data.error.message}`);
      } else {
        console.log(`     ${JSON.stringify(result.data).substring(0, 200)}`);
      }
    } else {
      console.log(`  Data:`, result.data || result.error);
    }
  }
}

main();
