const { execSync } = require('child_process');

module.exports = async () => {
  execSync('node scripts/e2e-test-users.js cleanup-test', { stdio: 'inherit' });
};
