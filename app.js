// Import Backend API functions (secure proxy)
import { 
  backendSignIn, 
  backendSignUp, 
  backendSignOut,
  getAllUsers, 
  getUsersByRole,
  getUserByUid,
  onAuthStateChanged
} from './backend-api.js';

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

// Track current authenticated user
let currentUser = null;
let allUsers = [];

// Listen for auth state changes
onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    // User document is already in currentUser from backend
    sessionStorage.setItem('app_session_user', JSON.stringify({ 
      uid: user.uid, 
      email: user.email, 
      username: user.username, 
      role: user.role 
    }));
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

// Login form submission - using Backend API
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = loginForm.username.value.trim(); // Accept email as username
  const password = loginForm.password.value;

  try {
    const result = await backendSignIn(email, password);
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

  const result = await backendSignUp(email, password, username, role, managerId, mentorId);
  console.log('Backend signup result:', result);
  signupMessage.textContent = result.message;
  signupMessage.style.color = result.success ? '#16a34a' : '#dc2626';

  if (result.success) {
    // Automatically log in the new user and redirect to dashboard
    setTimeout(async () => {
      try {
        const loginResult = await backendSignIn(email, password);
        if (loginResult.success) {
          // Auth state listener will handle the redirect
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 500);
        } else {
          // Fallback: show message and let user manually log in
          signupMessage.textContent = 'Account created! Please log in.';
          signupMessage.style.color = '#16a34a';
          signupForm.classList.add('hidden');
          signupForm.reset();
          updateSignupRoleFields();
          allUsers = [];
        }
      } catch (err) {
        console.error('Auto-login after signup failed:', err);
        signupMessage.textContent = 'Account created! Please log in.';
        signupMessage.style.color = '#16a34a';
        signupForm.classList.add('hidden');
        signupForm.reset();
        updateSignupRoleFields();
        allUsers = [];
      }
    }, 900);
  }
});

// Forgot Password Modal
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const forgotPasswordMessage = document.getElementById('forgotPasswordMessage');

if (forgotPasswordForm) {
  console.log('✓ Forgot password form found');
} else {
  console.error('✗ Forgot password form NOT found - HTML element missing');
}

// Open forgot password modal
forgotPasswordBtn.addEventListener('click', () => {
  forgotPasswordModal.classList.remove('hidden');
  modalBackdrop.classList.remove('hidden');
  document.getElementById('forgotPasswordEmail').value = '';
  forgotPasswordMessage.classList.add('hidden');
});

// Close forgot password modal
closeForgotPasswordModal.addEventListener('click', () => {
  forgotPasswordModal.classList.add('hidden');
  modalBackdrop.classList.add('hidden');
});

// Close modal when clicking on backdrop
modalBackdrop.addEventListener('click', () => {
  forgotPasswordModal.classList.add('hidden');
  modalBackdrop.classList.add('hidden');
});

// Prevent modal from closing when clicking inside it
forgotPasswordModal.addEventListener('click', (e) => {
  e.stopPropagation();
});

// Handle forgot password form submission
forgotPasswordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  console.log('Forgot password form submitted');
  
  const email = document.getElementById('forgotPasswordEmail').value.trim();
  console.log('Email entered:', email);
  
  if (!email) {
    forgotPasswordMessage.textContent = 'Please enter your email address.';
    forgotPasswordMessage.className = 'modal-message error';
    forgotPasswordMessage.classList.remove('hidden');
    return;
  }

  try {
    // Disable submit button during request
    const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    // Call backend endpoint to send password reset email
    console.log('Calling API: POST https://otg2026.onrender.com/api/auth/forgot-password');
    const response = await fetch('https://otg2026.onrender.com/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    console.log('API Response status:', response.status);
    const result = await response.json();
    console.log('API Response body:', result);

    if (response.ok) {
      forgotPasswordMessage.textContent = `Password recovery email sent to ${email}. Please check your email (including spam folder).`;
      forgotPasswordMessage.className = 'modal-message success';
      forgotPasswordMessage.classList.remove('hidden');
      
      // Clear form but keep modal open for user to close
      forgotPasswordForm.reset();
    } else {
      console.error('API returned error status:', response.status);
      console.error('Error response:', result);
      forgotPasswordMessage.textContent = result.message || 'Failed to send password recovery email.';
      forgotPasswordMessage.className = 'modal-message error';
      forgotPasswordMessage.classList.remove('hidden');
    }

    // Re-enable submit button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    forgotPasswordMessage.textContent = 'An error occurred. Please try again.';
    forgotPasswordMessage.className = 'modal-message error';
    forgotPasswordMessage.classList.remove('hidden');
    
    // Re-enable submit button
    const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
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


