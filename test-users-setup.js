import fetch from 'node-fetch';

const API_URL = 'https://otg2026.onrender.com/api';

const testUsers = [
  { email: 'manager_alex@otg.test', password: 'password123', username: 'manager_alex', role: 'manager' },
  { email: 'manager_jordan@otg.test', password: 'password123', username: 'manager_jordan', role: 'manager' },
  { email: 'mentor_casey@otg.test', password: 'password123', username: 'mentor_casey', role: 'mentor', managerId: 'manager_alex' },
  { email: 'mentor_blake@otg.test', password: 'password123', username: 'mentor_blake', role: 'mentor', managerId: 'manager_alex' },
  { email: 'employee_sierra@otg.test', password: 'password123', username: 'employee_sierra', role: 'new_team_member', managerId: 'manager_alex', mentorId: 'mentor_casey' },
];

async function createTestUsers() {
  console.log('Creating test users...\n');
  
  for (const user of testUsers) {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });

      if (response.ok) {
        console.log(`✅ Created: ${user.email}`);
      } else {
        const error = await response.json();
        console.log(`⚠️  ${user.email}: ${error.error}`);
      }
    } catch (error) {
      console.log(`❌ ${user.email}: ${error.message}`);
    }
  }

  console.log('\nDone! Test users created.');
}

createTestUsers();
