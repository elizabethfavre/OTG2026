#!/usr/bin/env node

import https from 'https';
import fs from 'fs';
import path from 'path';

const RAW_API_BASE = process.env.OTG_API_BASE || 'https://otg2026.onrender.com/api';
const API_BASE = RAW_API_BASE.endsWith('/') ? RAW_API_BASE : `${RAW_API_BASE}/`;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPass#2026!';
const STATE_FILE = path.join(process.cwd(), 'tests', 'e2e', '.test-users.json');

function buildE2ETestUsers() {
  const runId = Date.now();
  return {
    manager: {
      username: `manager_test_alex_${runId}`,
      email: `manager_test_alex_${runId}@otg.test`,
      password: TEST_PASSWORD,
      role: 'manager'
    },
    mentorPrimary: {
      username: `mentor_test_casey_${runId}`,
      email: `mentor_test_casey_${runId}@otg.test`,
      password: TEST_PASSWORD,
      role: 'mentor'
    },
    mentorSecondary: {
      username: `mentor_test_dash_${runId}`,
      email: `mentor_test_dash_${runId}@otg.test`,
      password: TEST_PASSWORD,
      role: 'mentor'
    },
    employeePrimary: {
      username: `employee_test_sierra_${runId}`,
      email: `employee_test_sierra_${runId}@otg.test`,
      password: TEST_PASSWORD,
      role: 'new_team_member'
    },
    employeeReassign: {
      username: `employee_test_reassign_${runId}`,
      email: `employee_test_reassign_${runId}@otg.test`,
      password: TEST_PASSWORD,
      role: 'new_team_member'
    }
  };
}

function httpRequest(method, path, payload = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const body = payload ? JSON.stringify(payload) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        let parsed = {};
        try {
          parsed = responseData ? JSON.parse(responseData) : {};
        } catch {
          parsed = { raw: responseData };
        }

        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function apiGetUsers(limit = 500, offset = 0) {
  const result = await httpRequest('GET', `users?limit=${limit}&offset=${offset}`);
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`GET /users failed with ${result.status}`);
  }

  return Array.isArray(result.data) ? result.data : (result.data.users || []);
}

async function apiDeleteUser(uid) {
  const result = await httpRequest('DELETE', `users/${uid}`);
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`DELETE /users/${uid} failed with ${result.status}: ${JSON.stringify(result.data)}`);
  }
}

async function apiSignUp(payload) {
  const result = await httpRequest('POST', 'auth/signup', payload);
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`POST /auth/signup failed with ${result.status}: ${JSON.stringify(result.data)}`);
  }
  return result.data;
}

export async function fetchAllActiveUsers() {
  const all = [];
  const pageSize = 500;
  let offset = 0;

  while (true) {
    const users = await apiGetUsers(pageSize, offset);
    if (users.length === 0) break;
    all.push(...users);

    if (users.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

export async function cleanupTestUsers() {
  const users = await fetchAllActiveUsers();
  const testUsers = users.filter((u) =>
    String(u.username || '').toLowerCase().includes('test') ||
    String(u.email || '').toLowerCase().includes('test')
  );

  for (const user of testUsers) {
    await apiDeleteUser(user.id || user.uid);
  }

  return testUsers.length;
}

export async function resetAllUsers() {
  let deleted = 0;

  while (true) {
    const users = await apiGetUsers(500, 0);
    if (users.length === 0) break;

    for (const user of users) {
      await apiDeleteUser(user.id || user.uid);
      deleted += 1;
    }
  }

  return deleted;
}

export async function createBaselineTestUsers() {
  // Ensure clean test namespace first.
  await cleanupTestUsers();

  const E2E_TEST_USERS = buildE2ETestUsers();

  const created = {};

  const manager = await apiSignUp(E2E_TEST_USERS.manager);
  created.manager = manager;

  const mentorPrimary = await apiSignUp({
    ...E2E_TEST_USERS.mentorPrimary,
    managerId: manager.uid
  });
  created.mentorPrimary = mentorPrimary;

  const mentorSecondary = await apiSignUp({
    ...E2E_TEST_USERS.mentorSecondary,
    managerId: manager.uid
  });
  created.mentorSecondary = mentorSecondary;

  const employeePrimary = await apiSignUp({
    ...E2E_TEST_USERS.employeePrimary,
    managerId: manager.uid,
    mentorId: mentorPrimary.uid
  });
  created.employeePrimary = employeePrimary;

  const employeeReassign = await apiSignUp({
    ...E2E_TEST_USERS.employeeReassign,
    managerId: manager.uid,
    mentorId: mentorPrimary.uid
  });
  created.employeeReassign = employeeReassign;

  const statePayload = {
    manager: { email: E2E_TEST_USERS.manager.email, password: TEST_PASSWORD, username: E2E_TEST_USERS.manager.username },
    mentorPrimary: { email: E2E_TEST_USERS.mentorPrimary.email, password: TEST_PASSWORD, username: E2E_TEST_USERS.mentorPrimary.username },
    mentorSecondary: { email: E2E_TEST_USERS.mentorSecondary.email, password: TEST_PASSWORD, username: E2E_TEST_USERS.mentorSecondary.username },
    employeePrimary: { email: E2E_TEST_USERS.employeePrimary.email, password: TEST_PASSWORD, username: E2E_TEST_USERS.employeePrimary.username },
    employeeReassign: { email: E2E_TEST_USERS.employeeReassign.email, password: TEST_PASSWORD, username: E2E_TEST_USERS.employeeReassign.username }
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(statePayload, null, 2), 'utf8');

  return created;
}

if (process.argv[1] && process.argv[1].endsWith('e2e-test-users.js')) {
  const mode = process.argv[2];

  try {
    if (mode === 'reset-all') {
      const count = await resetAllUsers();
      console.log(`Deleted active users: ${count}`);
    } else if (mode === 'cleanup-test') {
      const count = await cleanupTestUsers();
      console.log(`Deleted test users: ${count}`);
      if (fs.existsSync(STATE_FILE)) {
        fs.unlinkSync(STATE_FILE);
      }
    } else if (mode === 'setup-test') {
      await createBaselineTestUsers();
      console.log('Created baseline test users successfully.');
    } else {
      console.log('Usage: node scripts/e2e-test-users.js [reset-all|setup-test|cleanup-test]');
      process.exit(1);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
