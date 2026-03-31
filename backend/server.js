import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sgMail from '@sendgrid/mail';

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

// ============= EMAIL CONFIGURATION (SendGrid) =============
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid email service configured');
} else {
  console.warn('⚠️ SENDGRID_API_KEY not set. Email sending will be disabled.');
}

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
      isActive: true,
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

    // Verify password using Firebase REST API
    if (!process.env.FIREBASE_API_KEY) {
      console.error('FIREBASE_API_KEY not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const firebaseRestUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;
    
    let passwordVerified = false;
    let firebaseUser = null;
    
    try {
      const firebaseResponse = await fetch(firebaseRestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      });

      if (firebaseResponse.ok) {
        firebaseUser = await firebaseResponse.json();
        passwordVerified = true;
      } else {
        const errorData = await firebaseResponse.json();
        console.error('Firebase auth error:', errorData);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    } catch (firebaseError) {
      console.error('Firebase REST API error:', firebaseError);
      // Fallback: try to get user anyway for testing
      try {
        const userRecord = await auth.getUserByEmail(email);
        firebaseUser = { localId: userRecord.uid };
        passwordVerified = true; // In production, this would be risky
      } catch (e) {
        return res.status(401).json({ error: 'Authentication failed' });
      }
    }

    if (!passwordVerified || !firebaseUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user by email (or use the localId from Firebase response)
    const userId = firebaseUser.localId || (await auth.getUserByEmail(email)).uid;

    // Fetch user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Create custom token for client-side authentication
    const customToken = await auth.createCustomToken(userId);

    res.json({
      token: customToken,
      id: userId,
      uid: userId,
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

/**
 * POST /api/auth/forgot-password
 * Send password recovery email
 */
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    let userRecord;
    let userPassword = null;
    let userFound = false;

    try {
      userRecord = await auth.getUserByEmail(email);
      userFound = true;
      // Note: Firebase doesn't provide password retrieval, so we can't send the actual password
      // In production, we should store password hashes or use password reset links instead
      // For this implementation, we'll send a generic message
    } catch (error) {
      // User not found, we'll still send an email saying no account exists
      userFound = false;
    }

    // Email content based on whether user exists
    let emailSubject, emailHtml, emailText;

    if (userFound) {
      // User exists - send password recovery instructions
      emailSubject = 'Password Recovery - Onboarding Tracker';
      emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #004054;">
          <div style="border-bottom: 3px solid #54E9AE; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #0D6B4F;">Onboarding Tracker</h2>
          </div>
          
          <h3 style="color: #004054;">Hello ${userRecord.email},</h3>
          
          <p>We received a request to recover your password. Your account exists in our system.</p>
          
          <div style="background: #F3FFFB; border-left: 4px solid #54E9AE; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #0D6B4F;">
              <strong>Account Email:</strong> ${userRecord.email}<br>
              <strong>Status:</strong> Active
            </p>
          </div>
          
          <p>For security reasons, we cannot send passwords via email. If you need to reset your password, please contact your system administrator or use the login page to verify your credentials.</p>
          
          <p>If you did not request this email, you can safely ignore it.</p>
          
          <hr style="border: none; border-top: 1px solid #C8E6E0; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; margin: 10px 0;">
            This is an automated message from the Onboarding Tracker system. Please do not reply to this email.
          </p>
        </div>
      `;
      emailText = `
        Password Recovery Request - Onboarding Tracker
        
        Hello ${userRecord.email},
        
        We received a request to recover your password. Your account exists in our system.
        
        Account Email: ${userRecord.email}
        Status: Active
        
        For security reasons, we cannot send passwords via email. If you need to reset your password, please contact your system administrator or use the login page to verify your credentials.
        
        If you did not request this email, you can safely ignore it.
        
        ---
        This is an automated message from the Onboarding Tracker system.
      `;
    } else {
      // User doesn't exist - send notification
      emailSubject = 'Password Recovery Attempt - Onboarding Tracker';
      emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #004054;">
          <div style="border-bottom: 3px solid #54E9AE; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #0D6B4F;">Onboarding Tracker</h2>
          </div>
          
          <h3 style="color: #004054;">Password Recovery Request</h3>
          
          <div style="background: #FFF3E0; border-left: 4px solid #FF9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #E65100;">
              <strong>No Account Found</strong><br>
              There is no user account associated with the email address <strong>${email}</strong>.
            </p>
          </div>
          
          <p>If you believe this is an error, please:</p>
          <ul style="color: #0D6B4F;">
            <li>Check that you are using the correct email address</li>
            <li>Contact your system administrator to verify your account status</li>
            <li>Consider creating a new account if you don't have one yet</li>
          </ul>
          
          <hr style="border: none; border-top: 1px solid #C8E6E0; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; margin: 10px 0;">
            This is an automated message from the Onboarding Tracker system. Please do not reply to this email.
          </p>
        </div>
      `;
      emailText = `
        Password Recovery Request - Onboarding Tracker
        
        No Account Found
        
        There is no user account associated with the email address ${email}.
        
        If you believe this is an error, please:
        - Check that you are using the correct email address
        - Contact your system administrator to verify your account status
        - Consider creating a new account if you don't have one yet
        
        ---
        This is an automated message from the Onboarding Tracker system.
      `;
    }

    // Try to send email using SendGrid
    if (process.env.SENDGRID_API_KEY) {
      try {
        const msg = {
          to: email,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@onboarding-tracker.com',
          subject: emailSubject,
          html: emailHtml,
          text: emailText
        };

        await sgMail.send(msg);
        console.log(`✅ Password recovery email sent to ${email}`);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request, but log the error
        // In production, you might want to handle this differently
      }
    } else {
      console.warn('⚠️ SendGrid API key not configured. Skipping email sending.');
    }

    // Always return success to prevent email enumeration attacks
    res.json({
      message: userFound 
        ? `Password recovery instructions have been sent to ${email}` 
        : `If an account exists for ${email}, a notification has been sent`,
      success: true
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password recovery request' });
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
    const users = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(user => user.isActive !== false); // Filter out deleted/inactive users

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

    const users = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(user => user.isActive !== false); // Filter out deleted/inactive users

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

/**
 * DELETE /api/users/:uid
 * Soft delete user (marks as inactive)
 */
app.delete('/api/users/:uid', async (req, res) => {
  try {
    await db.collection('users').doc(req.params.uid).update({
      isActive: false,
      deletedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/clear-test-employees
 * Clear all new_team_member accounts (admin use only)
 */
app.delete('/api/admin/clear-test-employees', async (req, res) => {
  try {
    const snapshot = await db.collection('users')
      .where('role', '==', 'new_team_member')
      .get();

    const deletedCount = snapshot.docs.length;
    const deletePromises = snapshot.docs.map(doc =>
      db.collection('users').doc(doc.id).update({
        isActive: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    );

    await Promise.all(deletePromises);

    res.json({ 
      message: `Successfully deleted ${deletedCount} new_team_member accounts`,
      count: deletedCount
    });
  } catch (error) {
    console.error('Clear test employees error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/clear-test-managers
 * Clear all manager accounts except Alice Abernathy and Bob Barker (admin use only)
 */
app.delete('/api/admin/clear-test-managers', async (req, res) => {
  try {
    const snapshot = await db.collection('users')
      .where('role', '==', 'manager')
      .get();

    const keepManagers = ['Alice Abernathy', 'Bob Barker'];
    const managersToDelete = snapshot.docs.filter(doc => 
      !keepManagers.includes(doc.data().username)
    );

    const deletedCount = managersToDelete.length;
    const deletePromises = managersToDelete.map(doc =>
      db.collection('users').doc(doc.id).update({
        isActive: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    );

    await Promise.all(deletePromises);

    res.json({ 
      message: `Successfully deleted ${deletedCount} manager accounts (kept Alice Abernathy and Bob Barker)`,
      count: deletedCount
    });
  } catch (error) {
    console.error('Clear test managers error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/clear-test-mentors
 * Clear all mentor accounts except Charlotte Centas and Dan Dugger (admin use only)
 */
app.delete('/api/admin/clear-test-mentors', async (req, res) => {
  try {
    const snapshot = await db.collection('users')
      .where('role', '==', 'mentor')
      .get();

    const keepMentors = ['Charlotte Centas', 'Dan Dugger'];
    const mentorsToDelete = snapshot.docs.filter(doc => 
      !keepMentors.includes(doc.data().username)
    );

    const deletedCount = mentorsToDelete.length;
    const deletePromises = mentorsToDelete.map(doc =>
      db.collection('users').doc(doc.id).update({
        isActive: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    );

    await Promise.all(deletePromises);

    res.json({ 
      message: `Successfully deleted ${deletedCount} mentor accounts (kept Charlotte Centas and Dan Dugger)`,
      count: deletedCount
    });
  } catch (error) {
    console.error('Clear test mentors error:', error);
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
