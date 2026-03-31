import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  // Try to load from environment variable (Heroku/Cloud)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Try to load from local file (development)
    const keyPath = path.join(__dirname, 'serviceAccountKey.json');
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    serviceAccount = JSON.parse(keyContent);
  }
} catch (error) {
  console.error('Error loading Firebase credentials:', error.message);
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

// ============= AUTH ENDPOINTS =============

/**
 * POST /api/auth/signup
 * Create a new user account
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, username, role, managerId, mentorId } = req.body;

    if (!email || !password || !username || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Firebase auth user
    const userRecord = await auth.createUser({
      email,
      password
    });

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      username,
      email,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    };

    if (managerId) userData.managerId = managerId;
    if (mentorId) userData.mentorId = mentorId;

    await db.collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      username,
      role
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Sign in user and return auth token
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user by email
    const userRecord = await auth.getUserByEmail(email);

    // Fetch user data from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Create custom token for client-side authentication
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.json({
      token: customToken,
      uid: userRecord.uid,
      email: userData.email,
      username: userData.username,
      role: userData.role
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

/**
 * POST /api/auth/logout
 * Handle logout (mainly for audit trail)
 */
app.post('/api/auth/logout', async (req, res) => {
  try {
    // Client handles token deletion
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= USER ENDPOINTS =============

/**
 * GET /api/users
 * Get all users (for dropdowns, etc.)
 */
app.get('/api/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:uid
 * Get specific user by UID
 */
app.get('/api/users/:uid', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: userDoc.id,
      ...userDoc.data()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/role/:role
 * Get all users with specific role
 */
app.get('/api/users/role/:role', async (req, res) => {
  try {
    const snapshot = await db.collection('users')
      .where('role', '==', req.params.role)
      .get();

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(users);
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/:uid
 * Update user data
 */
app.put('/api/users/:uid', async (req, res) => {
  try {
    const { username, role, managerId, mentorId, timezone } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (managerId !== undefined) updateData.managerId = managerId;
    if (mentorId !== undefined) updateData.mentorId = mentorId;
    if (timezone) updateData.timezone = timezone;

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('users').doc(req.params.uid).update(updateData);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= CHECKLIST/TASKS ENDPOINTS =============

/**
 * GET /api/users/:uid/checklist
 * Get user's task checklist
 */
app.get('/api/users/:uid/checklist', async (req, res) => {
  try {
    const checklistDoc = await db.collection('users').doc(req.params.uid)
      .collection('checklist').doc('tasks').get();

    if (!checklistDoc.exists) {
      return res.json({ tasks: [] });
    }

    res.json(checklistDoc.data());
  } catch (error) {
    console.error('Get checklist error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/:uid/checklist
 * Add task to checklist
 */
app.post('/api/users/:uid/checklist', async (req, res) => {
  try {
    const { task } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Task description required' });
    }

    const checklistRef = db.collection('users').doc(req.params.uid)
      .collection('checklist').doc('tasks');

    await checklistRef.update({
      tasks: admin.firestore.FieldValue.arrayUnion({
        id: Date.now(),
        title: task,
        completed: false,
        createdAt: new Date()
      })
    });

    res.json({ message: 'Task added successfully' });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/:uid/checklist/:taskId
 * Update task completion status
 */
app.put('/api/users/:uid/checklist/:taskId', async (req, res) => {
  try {
    const { completed } = req.body;

    const checklistRef = db.collection('users').doc(req.params.uid)
      .collection('checklist').doc('tasks');

    const checklistDoc = await checklistRef.get();
    const tasks = checklistDoc.data()?.tasks || [];

    const updatedTasks = tasks.map(task => 
      task.id === parseInt(req.params.taskId) 
        ? { ...task, completed }
        : task
    );

    await checklistRef.set({ tasks: updatedTasks });

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= HEALTH CHECK =============

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// ============= ERROR HANDLING =============

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============= START SERVER =============

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
  console.log(`📝 API Base URL: http://localhost:${PORT}/api`);
});
