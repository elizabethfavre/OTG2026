#!/usr/bin/env node

import https from 'https';

const testUsers = [
  { email: 'manager_alex@otg.test', password: 'password123', username: 'manager_alex', role: 'manager' },
  { email: 'manager_jordan@otg.test', password: 'password123', username: 'manager_jordan', role: 'manager' },
  { email: 'mentor_casey@otg.test', password: 'password123', username: 'mentor_casey', role: 'mentor', managerId: 'manager_alex' },
  { email: 'mentor_blake@otg.test', password: 'password123', username: 'mentor_blake', role: 'mentor', managerId: 'manager_alex' },
  { email: 'employee_sierra@otg.test', password: 'password123', username: 'employee_sierra', role: 'new_team_member', managerId: 'manager_alex', mentorId: 'mentor_casey' },
];

async function deleteUser(email) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email });
    
    const options = {
      hostname: 'otg2026.onrender.com',
      port: 443,
      path: '/api/admin/delete-user',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || ''}`
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

async function createUser(user) {
  return new Promise((resolve) => {
    const data = JSON.stringify(user);
    
    const options = {
      hostname: 'otg2026.onrender.com',
      port: 443,
      path: '/api/auth/signup',
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
          resolve({ status: res.statusCode, data: parsed, body: responseData });
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

async function setupUsers() {
  console.log('Setting up test users...\n');
  
  for (const user of testUsers) {
    try {
      const result = await createUser(user);
      
      if (result.status === 201) {
        console.log(`✅ Created: ${user.email}`);
      } else if (result.status === 409) {
        console.log(`ℹ️  ${user.email}: Already exists`);
      } else if (result.status === 400 && result.data?.error?.includes('already in use')) {
        console.log(`⚠️  ${user.email}: Email already in use - might need manual cleanup in Firebase`);
        console.log(`   Response: ${result.data.error}`);
      } else {
        console.log(`⚠️  ${user.email}: Status ${result.status}`);
        if (result.data) {
          const errorMsg = typeof result.data === 'string' ? result.data.substring(0, 150) : JSON.stringify(result.data).substring(0, 150);
          console.log(`   Response: ${errorMsg}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${user.email}: ${error.message}`);
    }
  }
  
  console.log('\nDone! Test users setup complete.');
}

setupUsers();
