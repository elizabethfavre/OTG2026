// Import Firebase functions
import { auth, db, initializeFirestore, firebaseSignIn, firebaseSignOut, firebaseSignUp, getUserByUid, getAllUsers, getUsersByRole } from './firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

// Initialize Firestore with test data on page load
initializeFirestore().catch(err => console.error('Failed to initialize Firestore:', err));

// Track current authenticated user
let currentUser = null;
let allUsers = [];

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    // Fetch user document from Firestore
    const userDoc = await getUserByUid(user.uid);
    if (userDoc) {
      sessionStorage.setItem('app_session_user', JSON.stringify({ 
        uid: user.uid, 
        email: user.email, 
        username: userDoc.username, 
        role: userDoc.role 
      }));
    }
  } else {
    currentUser = null;
    sessionStorage.removeItem('app_session_user');
  }
});

// Fetch all users for dropdowns
async function loadAllUsers() {
  allUsers = await getAllUsers();
}

function randomizeLoginFieldNames() {
  const a = document.getElementById('username');
  const b = document.getElementById('password');
  if (a && b) {
    const suffix = Math.random().toString(36).substring(2, 10);
    a.name = `user_${suffix}`;
    b.name = `pass_${suffix}`;
    a.autocomplete = 'new-username';
    b.autocomplete = 'new-password';
  }
}

function clearLoginFields() {
  loginForm.reset();
  const usernameField = loginForm.querySelector('[type="email"], [id="username"]');
  const passwordField = loginForm.querySelector('[type="password"]');
  if (usernameField) usernameField.value = '';
  if (passwordField) passwordField.value = '';
  randomizeLoginFieldNames();
}

function suggestUsername(username) {
  let candidate;
  let index = 1;
  do {
    candidate = `${username}${index}`;
    index += 1;
  } while (allUsers.find(u => u.username === candidate));
  return candidate;
}

// Login form submission - using Firebase Auth
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = loginForm.username.value.trim(); // Accept email as username
  const password = loginForm.password.value;

  try {
    const result = await firebaseSignIn(email, password);
    if (result.success) {
      // Auth state listener will handle navigation
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } else {
      loginError.textContent = result.message || 'Login failed.';
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    loginError.textContent = 'An error occurred during login.';
    loginError.classList.remove('hidden');
  }
});

// Signup behavior
const showSignupBtn = document.getElementById('showSignup');
const signupForm = document.getElementById('signupForm');
const signupMessage = document.getElementById('signupMessage');
const signupRole = document.getElementById('signupRole');
const signupMentor = document.getElementById('signupMentor');
const signupManager = document.getElementById('signupManager');
const mentorLabel = document.getElementById('mentorLabel');
const managerLabel = document.getElementById('managerLabel');

function updateSignupRoleFields() {
  const role = signupRole.value;
  mentorLabel.classList.add('hidden');
  signupMentor.classList.add('hidden');
  managerLabel.classList.add('hidden');
  signupManager.classList.add('hidden');

  if (role === 'new_team_member') {
    // New team members need a mentor and manager
    mentorLabel.classList.remove('hidden');
    signupMentor.classList.remove('hidden');
    managerLabel.classList.remove('hidden');
    signupManager.classList.remove('hidden');
  } else if (role === 'mentor') {
    // Mentors need a manager
    managerLabel.classList.remove('hidden');
    signupManager.classList.remove('hidden');
  }
}

async function populateSupervisors() {
  // Load all users if not already loaded
  if (allUsers.length === 0) {
    console.log('Loading users from Firestore for supervisors dropdown...');
    allUsers = await getAllUsers();
    console.log('Loaded users:', allUsers);
  }

  // Populate mentor dropdown with available mentors
  const mentors = allUsers.filter(u => u.role === 'mentor');
  console.log('Available mentors:', mentors);
  signupMentor.innerHTML = '<option value="">-- No Mentor --</option>';
  mentors.forEach(m => {
    const option = document.createElement('option');
    option.value = m.id; // Use uid
    option.textContent = m.username;
    signupMentor.appendChild(option);
  });

  // Populate manager dropdown with available managers
  const managers = allUsers.filter(u => u.role === 'manager');
  console.log('Available managers:', managers);
  signupManager.innerHTML = '<option value="">-- No Manager --</option>';
  managers.forEach(m => {
    const option = document.createElement('option');
    option.value = m.id; // Use uid
    option.textContent = m.username;
    signupManager.appendChild(option);
  });
}

showSignupBtn.addEventListener('click', async () => {
  signupForm.classList.toggle('hidden');
  signupMessage.textContent = '';
  if (!signupForm.classList.contains('hidden')) {
    signupForm.reset();
    await populateSupervisors();
    updateSignupRoleFields();
  }
});

signupRole.addEventListener('change', updateSignupRoleFields);

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('signupUsername').value.trim();
  const email = document.getElementById('signupEmail') ? document.getElementById('signupEmail').value.trim() : username + '@example.com';
  const password = document.getElementById('signupPassword').value;
  const role = signupRole.value;
  const mentorId = signupMentor.value || null;
  const managerId = signupManager.value || null;

  console.log('Signup form submitted:', { username, email, role, managerId, mentorId });
  console.log('Manager dropdown value:', signupManager.value);
  console.log('Manager dropdown element:', signupManager);

  // Validate password strength
  if (password.length < 6) {
    signupMessage.textContent = 'Password must be at least 6 characters.';
    signupMessage.style.color = '#dc2626';
    return;
  }

  const result = await firebaseSignUp(email, password, username, role, managerId, mentorId);
  console.log('FirebaseSignUp result:', result);
  signupMessage.textContent = result.message;
  signupMessage.style.color = result.success ? '#16a34a' : '#dc2626';

  if (result.success) {
    setTimeout(() => {
      signupForm.classList.add('hidden');
      signupForm.reset();
      signupMessage.textContent = '';
      updateSignupRoleFields();
      allUsers = []; // Clear cache to refresh users list
    }, 900);
  }
});

// Check auth state on page load
const sessionUser = sessionStorage.getItem('app_session_user');
if (sessionUser) {
  // User is logged in, redirect to dashboard
  window.location.href = 'dashboard.html';
} else {
  // Clear login fields on fresh login and after logout.
  clearLoginFields();
}

// Also clear login fields whenever the page is focused (in case of back navigation).
window.addEventListener('focus', () => {
  if (!sessionStorage.getItem('app_session_user')) {
    clearLoginFields();
  }
});


