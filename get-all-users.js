#!/usr/bin/env node

import https from 'https';

async function getUsers() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'otg2026.onrender.com',
      port: 443,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
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

    req.end();
  });
}

async function main() {
  console.log('Fetching all users from backend...\n');
  
  const result = await getUsers();
  console.log(`Status: ${result.status}\n`);
  
  if (Array.isArray(result.data)) {
    console.log(`✅ Found ${result.data.length} users:\n`);
    result.data.forEach(user => {
      console.log(`- ${user.username} (${user.role}) - ${user.email}`);
    });
    
    // Look for Alice
    const alice = result.data.find(u => u.username?.toLowerCase().includes('alice') || u.email?.toLowerCase().includes('alice'));
    if (alice) {
      console.log(`\n🎯 FOUND ALICE:`);
      console.log(`   Username: ${alice.username}`);
      console.log(`   Email: ${alice.email}`);
      console.log(`   Role: ${alice.role}`);
    }
  } else {
    console.log('Error fetching users:');
    console.log(JSON.stringify(result.data, null, 2));
  }
}

main();
