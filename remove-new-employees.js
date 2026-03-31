const API_URL = 'https://otg2026.onrender.com/api';

async function removeNewEmployeeAccounts() {
  console.log('Fetching all users...\n');
  
  try {
    // Get all users
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const users = await response.json();
    
    // Filter for new_team_member accounts
    const newEmployees = users.filter(u => u.role === 'new_team_member');
    
    if (newEmployees.length === 0) {
      console.log('No new employee accounts found.');
      return;
    }
    
    console.log(`Found ${newEmployees.length} new employee account(s):\n`);
    newEmployees.forEach(u => {
      console.log(`  - ${u.username} (${u.email})`);
    });
    
    console.log('\nDeleting new employee accounts...\n');
    
    // Delete each new employee account
    for (const user of newEmployees) {
      try {
        const deleteResponse = await fetch(`${API_URL}/users/${user.id}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Deleted: ${user.username}`);
        } else {
          console.log(`❌ Failed to delete ${user.username}`);
        }
      } catch (error) {
        console.log(`❌ Error deleting ${user.username}: ${error.message}`);
      }
    }
    
    console.log('\nDone! All new employee accounts have been removed.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

removeNewEmployeeAccounts();
