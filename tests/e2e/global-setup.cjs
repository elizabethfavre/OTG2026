const { execSync } = require('child_process');

module.exports = async () => {
  execSync('node scripts/e2e-test-users.js setup-test', { stdio: 'inherit' });
};
