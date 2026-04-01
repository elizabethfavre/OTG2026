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
      console.log(`Attempting to create: ${user.email}`);
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      }).catch(err => {
        console.log(`  Fetch error: ${err.message}`);
        throw err;
      });

      console.log(`  Response status: ${response.status}`);
      
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.log(`  JSON parse error: ${parseErr.message}`);
        data = { error: 'Could not parse response' };
      }
      
      if (response.ok) {
        console.log(`✅ Created: ${user.email}\n`);
      } else if (response.status === 409) {
        console.log(`ℹ️  ${user.email}: Already exists\n`);
      } else {
        console.log(`⚠️  ${user.email}: ${data.error || response.statusText}\n`);
      }
    } catch (error) {
      console.log(`❌ ${user.email}: ${error.message}\n`);
    }
  }

  console.log('Done! Test users processed.');
}

createTestUsers();
