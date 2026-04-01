#!/usr/bin/env node

import https from 'https';

const testUsers = [
  // Managers
  { username: 'manager_alex', email: 'alex.manager@company.com', password: 'MgrAlex#2026!', role: 'manager' },
  { username: 'manager_jordan', email: 'jordan.manager@company.com', password: 'MgrJordan#2026!', role: 'manager' },
  
  // Mentors (assigned to managers)
  { username: 'mentor_casey', email: 'casey.mentor@company.com', password: 'MentorCasey#2026!', role: 'mentor', managerId: 'manager_alex' },
  { username: 'mentor_blake', email: 'blake.mentor@company.com', password: 'MentorBlake#2026!', role: 'mentor', managerId: 'manager_alex' },
  
  // New Employees (assigned to mentors and managers)
  { username: 'employee_sierra', email: 'sierra.emp@company.com', password: 'EmpSierra#2026!', role: 'new_team_member', managerId: 'manager_alex', mentorId: 'mentor_casey' },
];

async function createUser(user) {
  return new Promise((resolve, reject) => {
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
      res.on('data', (chunk) => {
        responseData += chunk;
      });
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
      reject(error);
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
      } else {
        console.log(`⚠️  ${user.email}: Status ${result.status}`);
        if (result.data) {
          console.log(`     Response: ${JSON.stringify(result.data).substring(0, 200)}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${user.email}: ${error.message}`);
    }
  }
  
  console.log('\nDone! Test users setup complete.');
}

setupUsers();
