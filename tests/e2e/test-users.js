import fs from 'fs';
import path from 'path';

const STATE_FILE = path.join(process.cwd(), 'tests', 'e2e', '.test-users.json');

export function getE2ETestUsers() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`Missing generated test user state file: ${STATE_FILE}`);
  }

  const raw = fs.readFileSync(STATE_FILE, 'utf8');
  return JSON.parse(raw);
}
