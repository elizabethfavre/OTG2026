/**
 * Backend API Adapter
 * Replace direct Firebase calls with backend API calls
 * Use this in app.js and dashboard.js instead of firebase-init.js
 */

// Set your backend URL
const API_BASE_URL = 'http://localhost:3000/api'; // Use local backend for testing

let currentToken = null;
let currentUser = null;

// ============= AUTH FUNCTIONS =============

export async function backendSignUp(email, password, username, role, manager, mentor) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        username,
        role,
        managerId: manager,
        mentorId: mentor
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.error };
    }

    const data = await response.json();
    return { success: true, user: data };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, message: error.message };
  }
}

export async function backendSignIn(email, password) {
  try {
    console.log('[DEBUG] Attempting login for email:', email);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    console.log('[DEBUG] Login response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[ERROR] Login failed with status', response.status, ':', error);
      return { success: false, message: error.error };
    }

    const data = await response.json();
    console.log('[DEBUG] Login successful, user data received:', { uid: data.uid, email: data.email });
    
    currentToken = data.token;
    currentUser = data;

    // Store in session
    sessionStorage.setItem('authToken', data.token);
    sessionStorage.setItem('currentUser', JSON.stringify(data));
    console.log('[DEBUG] Session data stored in sessionStorage');

    return { success: true, user: data };
  } catch (error) {
    console.error('[ERROR] Login fetch error:', error.message, error);
    return { success: false, message: error.message };
  }
}

export async function backendSignOut() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    currentToken = null;
    currentUser = null;
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: error.message };
  }
}

// ============= USER FUNCTIONS =============

export async function getAllUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const users = await response.json();
    return users;
  } catch (error) {
    console.error('Get users error:', error);
    return [];
  }
}

export async function getUserByUid(uid) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${uid}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export async function getUsersByRole(role) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/role/${role}`);

    if (!response.ok) {
      throw new Error('Failed to fetch users by role');
    }

    return await response.json();
  } catch (error) {
    console.error('Get users by role error:', error);
    return [];
  }
}

export async function updateUser(uid, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, message: error.message };
  }
}

// ============= CHECKLIST FUNCTIONS =============

export async function getUserChecklist(uid) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${uid}/checklist`);

    if (!response.ok) {
      return { tasks: [] };
    }

    return await response.json();
  } catch (error) {
    console.error('Get checklist error:', error);
    return { tasks: [] };
  }
}

export async function addChecklistTask(uid, taskDescription) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${uid}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: taskDescription })
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Add task error:', error);
    return { success: false, message: error.message };
  }
}

export async function updateChecklistTask(uid, taskId, completed) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${uid}/checklist/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Update task error:', error);
    return { success: false, message: error.message };
  }
}

// ============= AUTH STATE LISTENER =============

export function onAuthStateChanged(callback) {
  // Check if user is already logged in
  const token = sessionStorage.getItem('authToken');
  const userJson = sessionStorage.getItem('currentUser');

  if (token && userJson) {
    currentToken = token;
    currentUser = JSON.parse(userJson);
    callback(currentUser);
  } else {
    callback(null);
  }

  // Simple check every 30 seconds
  setInterval(() => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      callback(null);
    }
  }, 30000);
}

export function getCurrentUser() {
  return currentUser;
}

export function getAuthToken() {
  return currentToken;
}
