// Import Backend API functions (secure proxy)
import { 
  backendSignOut, 
  getUserByUid, 
  getAllUsers, 
  getUsersByRole, 
  onAuthStateChanged,
  getCurrentUser
} from './backend-api.js';

const logoutBtn = document.getElementById('logoutBtn');
const checklist = document.getElementById('checklist');
const summary = document.getElementById('summary');
const successMessage = document.getElementById('successMessage');
const progressText = document.getElementById('progressText');
const usernameBadge = document.getElementById('usernameBadge');
const userTypeBadge = document.getElementById('userTypeBadge');
const locationSearch = document.getElementById('locationSearch');
const locationSuggestions = document.getElementById('locationSuggestions');
const locationError = document.getElementById('locationError');
const timeResult = document.getElementById('timeResult');
const locationName = document.getElementById('locationName');
const locationTime = document.getElementById('locationTime');
const newMemberTile = document.getElementById('newMemberTile');
const mentorTile = document.getElementById('mentorTile');
const managerTile = document.getElementById('managerTile');
const managerInfo = document.getElementById('managerInfo');
const mentorInfo = document.getElementById('mentorInfo');
const mentorReports = document.getElementById('mentorReports');
const noMentorReports = document.getElementById('noMentorReports');
const managerTeamSections = document.getElementById('managerTeamSections');
const noManagerReports = document.getElementById('noManagerReports');
const addTaskContainer = document.getElementById('addTaskContainer');
const addTaskCircleBtn = document.getElementById('addTaskCircleBtn');
const addTaskModal = document.getElementById('addTaskModal');
const taskDescription = document.getElementById('taskDescription');
const modalAddBtn = document.getElementById('modalAddBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

const STORAGE_KEYS = {
  checklistPrefix: 'app_checklist_state_', // key per uid
};

const WORLD_CITIES = [
  // USA Timezones
  { label: 'New York, USA (Eastern)', tz: 'America/New_York', tzName: 'Eastern', tzAbbr: ['EST', 'EDT'] },
  { label: 'Chicago, USA (Central)', tz: 'America/Chicago', tzName: 'Central', tzAbbr: ['CST', 'CDT'] },
  { label: 'Denver, USA (Mountain)', tz: 'America/Denver', tzName: 'Mountain', tzAbbr: ['MST', 'MDT'] },
  { label: 'San Francisco, USA (Pacific)', tz: 'America/Los_Angeles', tzName: 'Pacific', tzAbbr: ['PST', 'PDT'] },
  { label: 'Anchorage, USA (Alaska)', tz: 'America/Anchorage', tzName: 'Alaska', tzAbbr: ['AKST', 'AKDT'] },
  { label: 'Honolulu, USA (Hawaii)', tz: 'Pacific/Honolulu', tzName: 'Hawaii', tzAbbr: ['HST'] },
  // Europe
  { label: 'Glasgow, Scotland', tz: 'Europe/London', tzName: 'GMT/BST', tzAbbr: ['GMT', 'BST'] },
  { label: 'London, UK', tz: 'Europe/London', tzName: 'GMT/BST', tzAbbr: ['GMT', 'BST'] },
  { label: 'Dublin, Ireland', tz: 'Europe/Dublin', tzName: 'GMT/IST', tzAbbr: ['GMT', 'IST'] },
  { label: 'Paris, France', tz: 'Europe/Paris', tzName: 'CET/CEST', tzAbbr: ['CET', 'CEST'] },
  { label: 'Berlin, Germany', tz: 'Europe/Berlin', tzName: 'CET/CEST', tzAbbr: ['CET', 'CEST'] },
  { label: 'Madrid, Spain', tz: 'Europe/Madrid', tzName: 'CET/CEST', tzAbbr: ['CET', 'CEST'] },
  { label: 'Amsterdam, Netherlands', tz: 'Europe/Amsterdam', tzName: 'CET/CEST', tzAbbr: ['CET', 'CEST'] },
  // Asia
  { label: 'Mumbai, India', tz: 'Asia/Kolkata', tzName: 'IST', tzAbbr: ['IST'] },
  { label: 'Delhi, India', tz: 'Asia/Kolkata', tzName: 'IST', tzAbbr: ['IST'] },
  { label: 'Tokyo, Japan', tz: 'Asia/Tokyo', tzName: 'JST', tzAbbr: ['JST'] },
  { label: 'Seoul, South Korea', tz: 'Asia/Seoul', tzName: 'KST', tzAbbr: ['KST'] },
  { label: 'Singapore', tz: 'Asia/Singapore', tzName: 'SGT', tzAbbr: ['SGT'] },
  { label: 'Beijing, China', tz: 'Asia/Shanghai', tzName: 'CST', tzAbbr: ['CST'] },
  { label: 'Dubai, UAE', tz: 'Asia/Dubai', tzName: 'GST', tzAbbr: ['GST'] },
  // Australia
  { label: 'Sydney, Australia', tz: 'Australia/Sydney', tzName: 'AEST/AEDT', tzAbbr: ['AEST', 'AEDT'] },
  { label: 'Melbourne, Australia', tz: 'Australia/Melbourne', tzName: 'AEST/AEDT', tzAbbr: ['AEST', 'AEDT'] },
  { label: 'Brisbane, Australia', tz: 'Australia/Brisbane', tzName: 'AEST', tzAbbr: ['AEST'] },
  { label: 'Perth, Australia', tz: 'Australia/Perth', tzName: 'AWST', tzAbbr: ['AWST'] },
  { label: 'Adelaide, Australia', tz: 'Australia/Adelaide', tzName: 'ACST/ACDT', tzAbbr: ['ACST', 'ACDT'] },
  // Americas
  { label: 'Toronto, Canada', tz: 'America/Toronto', tzName: 'Eastern', tzAbbr: ['EST', 'EDT'] },
  { label: 'Mexico City, Mexico', tz: 'America/Mexico_City', tzName: 'Central', tzAbbr: ['CST', 'CDT'] },
  { label: 'São Paulo, Brazil', tz: 'America/Sao_Paulo', tzName: 'BRT/BRST', tzAbbr: ['BRT', 'BRST'] },
  // Africa
  { label: 'Cape Town, South Africa', tz: 'Africa/Johannesburg', tzName: 'SAST', tzAbbr: ['SAST'] },
  { label: 'Nairobi, Kenya', tz: 'Africa/Nairobi', tzName: 'EAT', tzAbbr: ['EAT'] }
];

let selectedCity = null;
let timeInterval = null;
let displayUser = null;
let currentUser = null;
let allUsers = [];

const ROLE_CHECKLIST = {
  manager: [
    'Review team performance metrics',
    'Approve project plans',
    'Schedule one-on-one meetings'
  ],
  mentor: [
    'Review mentee progress',
    'Prepare coaching material',
    'Provide weekly feedback'
  ],
  new_team_member: [
    'Complete onboarding checklist',
    'Set up development environment',
    'Meet your mentor/team lead'
  ]
};

const SUCCESS_MESSAGES = {
  25: "Great start! You're 25% there. 🚀",
  50: "Halfway there! You're crushing it! 💪",
  75: "Almost done! Keep the momentum going! ⚡",
  100: "Congratulations! You've completed everything! 🎉"
};

let inactivityTimer = null;
const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes
let autoSyncInterval = null;
const AUTO_SYNC_INTERVAL = 2 * 60 * 1000; // Auto-save every 2 minutes

function getChecklistKey(uid) {
  return `${STORAGE_KEYS.checklistPrefix}${uid}`;
}

async function loadAllUsersFromFirebase() {
  try {
    allUsers = await getAllUsers();
    return allUsers;
  } catch (err) {
    console.error('Error loading users from Firebase:', err);
    return [];
  }
}

function getUserByUIDLocal(uid) {
  return allUsers.find(u => u.id === uid);
}

function getUserByUsernameLocal(username) {
  return allUsers.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
}

function getDirectReports(managerUid) {
  return allUsers.filter(u => u.managerId === managerUid);
}

function getMenteesByMentor(mentorUid) {
  return allUsers.filter(u => u.role === 'new_team_member' && u.mentorId === mentorUid);
}

function getNewEmployeesManagedByManager(managerUid) {
  return allUsers.filter(u => u.role === 'new_team_member' && u.managerId === managerUid);
}

const CUSTOM_TASKS_PREFIX = 'custom_tasks_';

function getCustomTasksKey(uid) {
  return `${CUSTOM_TASKS_PREFIX}${uid}`;
}

function loadCustomTasks(uid) {
  const raw = localStorage.getItem(getCustomTasksKey(uid));
  if (!raw) return [];
  try {
    const tasks = JSON.parse(raw);
    return Array.isArray(tasks) ? tasks : [];
  } catch (e) {
    return [];
  }
}

function saveCustomTasks(uid, tasks) {
  localStorage.setItem(getCustomTasksKey(uid), JSON.stringify(tasks));
}

function deleteCustomTask(uid, taskIndex) {
  const tasks = loadCustomTasks(uid);
  tasks.splice(taskIndex, 1);
  saveCustomTasks(uid, tasks);
}

function addCustomTask(uid, taskDescription) {
  const tasks = loadCustomTasks(uid);
  tasks.push(taskDescription);
  saveCustomTasks(uid, tasks);
}

function deleteTaskAndRefresh(uid, taskIndex) {
  deleteCustomTask(uid, taskIndex);
  setChecklistItems(displayUser.role, displayUser.id);
  loadChecklistState(displayUser.id);
  updateChecklistSummary();
}

function setChecklistItems(role, uid) {
  const defaultTasks = ROLE_CHECKLIST[role] || ROLE_CHECKLIST.new_team_member;
  const customTasks = uid ? loadCustomTasks(uid) : [];
  
  let html = '';
  
  // Add default tasks
  html += defaultTasks
    .map(task => `<li><label><input type="checkbox" /> ${task}</label></li>`)
    .join('');
  
  // Add custom tasks with delete button
  if (customTasks.length > 0) {
    html += '<li style="border-top: 1px solid #C8E6E0; padding-top: 1rem; margin-top: 1rem;"></li>';
    html += customTasks
      .map((task, idx) => `
        <li>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <label style="flex: 1; display: flex; align-items: center; gap: 0.6rem; cursor: pointer;">
              <input type="checkbox" />
              <span>${task}</span>
            </label>
            <button class="delete-task-btn" data-uid="${uid}" data-idx="${idx}" title="Delete task">−</button>
          </div>
        </li>
      `).join('');
  }
  
  checklist.innerHTML = html;
}

function saveChecklistState() {
  // Only save if we're on our own dashboard
  if (!currentUser?.uid) return;
  if (!displayUser || displayUser.id !== currentUser.uid) return;
  
  const items = checklist.querySelectorAll('li');
  const state = [...items].map(li => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    return checkbox ? checkbox.checked : false;
  });
  localStorage.setItem(getChecklistKey(currentUser.uid), JSON.stringify(state));
}

function loadChecklistState(uid) {
  if (!uid) return;
  const raw = localStorage.getItem(getChecklistKey(uid));
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    const checkboxes = checklist.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb, index) => {
      if (typeof state[index] === 'boolean') cb.checked = state[index];
    });
  } catch (error) {
    console.warn('Invalid checklist state, resetting', error);
    localStorage.removeItem(getChecklistKey(uid));
  }
}

function updateChecklistSummary() {
  const items = checklist.querySelectorAll('input[type="checkbox"]');
  const checked = [...items].filter(item => item.checked).length;
  const total = items.length;
  const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
  
  summary.textContent = `${checked} / ${total} completed`;
  
  // Show encouragement message
  if (percentage > 0) {
    successMessage.classList.remove('hidden');
    successMessage.textContent = SUCCESS_MESSAGES[Math.floor(percentage / 25) * 25] || 'You\'re making great progress!';
    if (percentage === 100) {
      successMessage.style.background = '#E8F7F1';
      successMessage.style.borderColor = '#20B997';
      successMessage.style.color = '#1B7A6E';
    }
  } else {
    successMessage.classList.add('hidden');
  }
  
  // Update progress text
  if (percentage > 0 && percentage < 100) {
    progressText.textContent = `You're ${percentage}% of the way there!`;
  } else if (percentage === 100) {
    progressText.textContent = 'All tasks completed! Great work!';
  } else {
    progressText.textContent = '';
  }
  
  saveChecklistState();
}

async function syncChecklistChangesToBackend() {
  try {
    // Save all unsaved checklist changes to backend before logout
    if (!currentUser?.uid) return true; // No user to save for
    
    // Only sync if user has permission to modify this checklist
    if (!canModifyChecklist()) {
      console.log('[DEBUG] No permission to modify checklist, skipping sync');
      return true;
    }
    
    console.log('[DEBUG] Syncing checklist changes to backend before logout...');
    
    // Get current checkbox states
    const items = checklist.querySelectorAll('li');
    const currentState = [...items].map(li => {
      const checkbox = li.querySelector('input[type="checkbox"]');
      return checkbox ? checkbox.checked : false;
    });
    
    // Get saved state to find what changed
    const raw = localStorage.getItem(getChecklistKey(displayUser.id));
    const savedState = raw ? JSON.parse(raw) : [];
    
    console.log('[DEBUG] Current state:', currentState.length, 'items');
    console.log('[DEBUG] Saved state:', savedState.length, 'items');
    
    // Send updates for any changed items
    let syncPromises = [];
    let changedCount = 0;
    
    for (let idx = 0; idx < currentState.length; idx++) {
      const isChecked = currentState[idx];
      const wasSaved = idx < savedState.length ? savedState[idx] : false;
      
      // Sync if state changed from what was saved
      if (wasSaved !== isChecked) {
        changedCount++;
        console.log(`[DEBUG] Syncing task ${idx}: was=${wasSaved}, now=${isChecked}`);
        syncPromises.push(
          updateChecklistTask(displayUser.id, idx, isChecked)
            .then(result => {
              console.log(`[DEBUG] Task ${idx} sync response:`, result);
              return result;
            })
            .catch(err => {
              console.error(`[ERROR] Error syncing task ${idx}:`, err);
              // Continue even if one sync fails
              return true;
            })
        );
      }
    }
    
    // Wait for all syncs to complete
    if (syncPromises.length > 0) {
      console.log(`[DEBUG] Syncing ${changedCount} changed tasks to backend...`);
      const results = await Promise.all(syncPromises);
      console.log('[DEBUG] All checklist changes synced to backend, results:', results);
    } else {
      console.log('[DEBUG] No checklist changes to sync');
    }
    
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to sync checklist changes:', error);
    // Don't throw - allow logout to proceed even if sync fails
    return true;
  }
}

async function logoutAndRedirect(message) {
  try {
    // Sync any unsaved changes before logging out
    console.log('[DEBUG] Preparing to logout, syncing changes first...');
    await syncChecklistChangesToBackend();
    
    // Clear session
    await backendSignOut();
    sessionStorage.removeItem('app_session_user');
    localStorage.clear();
    
    if (message) {
      alert(message);
    }
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  } catch (error) {
    console.error('[ERROR] Logout error:', error);
    // Force logout anyway
    localStorage.clear();
    sessionStorage.clear();
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  }
}

function formatTimeForTimezone(timezone) {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(now);
  return formatted;
}

function updateTimeDisplay() {
  if (!selectedCity) return;
  const formattedTime = formatTimeForTimezone(selectedCity.tz);
  locationName.textContent = selectedCity.label;
  locationTime.textContent = formattedTime;
  timeResult.classList.remove('hidden');
}

function clearSuggestions() {
  locationSuggestions.innerHTML = '';
  locationSuggestions.classList.add('hidden');
}

function highlightMatch(label, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return label;

  const labelLower = label.toLowerCase();
  const start = labelLower.indexOf(normalized);
  if (start === -1) return label;

  const end = start + normalized.length;
  return `${label.slice(0, start)}<strong>${label.slice(start, end)}</strong>${label.slice(end)}`;
}

async function renderSuggestions(query) {
  const rawText = query.trim();
  
  if (!rawText) {
    // Show popular cities if input is empty
    const sortedCities = WORLD_CITIES.slice().sort((a, b) => a.label.localeCompare(b.label));
    locationSuggestions.innerHTML = sortedCities
      .slice(0, 15)
      .map(city => `<li class="suggestion-item" data-tz="${city.tz}" data-label="${city.label}">${city.label}</li>`)
      .join('');
    locationSuggestions.classList.remove('hidden');
    
    document.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const tz = item.dataset.tz;
        const label = item.dataset.label;
        selectedCity = { label, tz };
        locationSearch.value = label;
        locationError.classList.add('hidden');
        clearSuggestions();
        updateTimeDisplay();
        if (timeInterval) clearInterval(timeInterval);
        timeInterval = setInterval(updateTimeDisplay, 1000);
      });
    });
    return;
  }

  if (rawText.length > 100) {
    locationError.textContent = 'Max 100 characters allowed.';
    locationError.classList.remove('hidden');
    clearSuggestions();
    return;
  }

  locationError.classList.add('hidden');
  locationSuggestions.innerHTML = '<li class="suggestion-item no-match">Searching...</li>';
  locationSuggestions.classList.remove('hidden');

  try {
    // Use Open-Meteo free geocoding API (no key required)
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(rawText)}&count=10&language=en&format=json`
    );
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      locationSuggestions.innerHTML = '<li class="suggestion-item no-match">No matching cities found.</li>';
      locationSuggestions.classList.remove('hidden');
      return;
    }

    // Format results for display
    const suggestions = data.results.map((result, idx) => {
      const countryName = result.country || '';
      const adminName = result.admin1 || '';
      const label = `${result.name}${adminName ? ', ' + adminName : ''}${countryName ? ', ' + countryName : ''}`;
      const timezone = result.timezone || 'UTC';
      return {
        label,
        tz: timezone,
        resultData: result
      };
    });

    locationSuggestions.innerHTML = suggestions
      .map(s => `<li class="suggestion-item" data-tz="${s.tz}" data-label="${s.label}">${highlightMatch(s.label, rawText)}</li>`)
      .join('');
    locationSuggestions.classList.remove('hidden');

    document.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const tz = item.dataset.tz;
        const label = item.dataset.label;
        selectedCity = { label, tz };
        locationSearch.value = label;
        locationError.classList.add('hidden');
        clearSuggestions();
        updateTimeDisplay();
        if (timeInterval) clearInterval(timeInterval);
        timeInterval = setInterval(updateTimeDisplay, 1000);
      });
    });
  } catch (err) {
    console.error('Error fetching city suggestions:', err);
    locationError.textContent = 'Error searching cities. Please try again.';
    locationError.classList.remove('hidden');
    clearSuggestions();
  }
}

function validateLocationSelection() {
  if (!selectedCity) {
    locationError.textContent = 'Please select a city from the suggestions.';
    locationError.classList.remove('hidden');
    timeResult.classList.add('hidden');
    return false;
  }
  locationError.classList.add('hidden');
  return true;
}

function displayNewMemberTeam() {
  if (displayUser.role !== 'new_team_member') return;

  newMemberTile.classList.remove('hidden');
  
  // Check if current user is a manager viewing their own employee
  const isManagerViewingEmployee = currentUser.role === 'manager' && displayUser.id !== currentUser.uid && displayUser.managerId === currentUser.uid;
  
  // Display manager
  const manager = displayUser.managerId ? allUsers.find(u => u.id === displayUser.managerId) : null;
  if (manager) {
    managerInfo.innerHTML = `
      <strong>${manager.username}</strong>
      <p>Manager</p>
      ${isManagerViewingEmployee ? '<button class="edit-btn" onclick="editEmployeeManager()">Change Manager</button>' : ''}
    `;
  } else {
    managerInfo.innerHTML = '<p class="intro">No manager assigned.</p>';
    if (isManagerViewingEmployee) {
      managerInfo.innerHTML += '<button class="edit-btn" onclick="editEmployeeManager()">Assign Manager</button>';
    }
  }

  // Display mentor
  const mentor = displayUser.mentorId ? allUsers.find(u => u.id === displayUser.mentorId) : null;
  if (mentor) {
    mentorInfo.innerHTML = `
      <strong>${mentor.username}</strong>
      <p>Mentor</p>
      ${isManagerViewingEmployee ? '<button class="edit-btn" onclick="editEmployeeMentor()">Change Mentor</button>' : ''}
    `;
  } else {
    mentorInfo.innerHTML = '<p class="intro">No mentor assigned.</p>';
    if (isManagerViewingEmployee) {
      mentorInfo.innerHTML += '<button class="edit-btn" onclick="editEmployeeMentor()">Assign Mentor</button>';
    }
  }
}

async function editEmployeeManager() {
  // Only managers can edit
  if (currentUser.role !== 'manager') {
    alert('Only managers can change employee assignments.');
    return;
  }

  // Build dropdown of available managers
  const managers = allUsers.filter(u => u.role === 'manager' && u.isActive !== false);
  managers.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
  
  let optionsHTML = '<option value="">-- No Manager --</option>';
  managers.forEach(m => {
    const selected = m.id === displayUser.managerId ? ' selected' : '';
    optionsHTML += `<option value="${m.id}"${selected}>${m.username}</option>`;
  });

  const newManagerId = prompt('Select new manager:\n\n(This will be shown as a dropdown in a real implementation)\n\nCurrent managers:\n' + managers.map(m => `${m.username} (${m.id})`).join('\n'));
  
  if (newManagerId !== null) {
    // Find the manager object
    const selectedManager = managers.find(m => m.id === newManagerId) || null;
    if (!selectedManager && newManagerId !== '') {
      alert('Invalid manager selection');
      return;
    }

    await updateEmployeeAssignment(displayUser.id, newManagerId || null, displayUser.mentorId);
  }
}

async function editEmployeeMentor() {
  // Only managers can edit
  if (currentUser.role !== 'manager') {
    alert('Only managers can change employee assignments.');
    return;
  }

  // Build dropdown of available mentors
  const mentors = allUsers.filter(u => u.role === 'mentor' && u.isActive !== false);
  mentors.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
  
  let optionsHTML = '<option value="">-- No Mentor --</option>';
  mentors.forEach(m => {
    const selected = m.id === displayUser.mentorId ? ' selected' : '';
    optionsHTML += `<option value="${m.id}"${selected}>${m.username}</option>`;
  });

  const newMentorId = prompt('Select new mentor:\n\n(This will be shown as a dropdown in a real implementation)\n\nCurrent mentors:\n' + mentors.map(m => `${m.username} (${m.id})`).join('\n'));
  
  if (newMentorId !== null) {
    // Find the mentor object
    const selectedMentor = mentors.find(m => m.id === newMentorId) || null;
    if (!selectedMentor && newMentorId !== '') {
      alert('Invalid mentor selection');
      return;
    }

    await updateEmployeeAssignment(displayUser.id, displayUser.managerId, newMentorId || null);
  }
}

async function updateEmployeeAssignment(employeeId, newManagerId, newMentorId) {
  try {
    console.log('[DEBUG] Updating employee assignment:', { employeeId, newManagerId, newMentorId, currentUserId: currentUser.uid });
    
    const apiUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api'
      : 'https://otg2026.onrender.com/api';
    const response = await fetch(`${apiUrl}/users/${employeeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        managerId: newManagerId,
        mentorId: newMentorId,
        currentUserId: currentUser.uid
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update employee assignment');
    }

    alert('Employee assignment updated successfully!');
    
    // Update local displayUser to reflect changes
    displayUser.managerId = newManagerId;
    displayUser.mentorId = newMentorId;
    
    // Refresh the display
    displayNewMemberTeam();
  } catch (error) {
    console.error('[ERROR] Update assignment error:', error);
    alert(`Failed to update assignment: ${error.message}`);
  }
}

function displayMentorTeam() {
  if (displayUser.role !== 'mentor') return;

  mentorTile.classList.remove('hidden');
  
  const mentees = getMenteesByMentor(displayUser.id);
  if (mentees.length === 0) {
    noMentorReports.classList.remove('hidden');
    mentorReports.innerHTML = '';
    return;
  }

  noMentorReports.classList.add('hidden');
  mentorReports.innerHTML = mentees.map(mentee => `
    <li>
      <div class="member-info">
        <span class="member-name">${mentee.username}</span>
        <span class="member-role">New Team Member</span>
      </div>
      <button onclick="window.location.href='dashboard.html?view=${mentee.id}'">View Dashboard</button>
    </li>
  `).join('');
}

function displayManagerTeam() {
  if (displayUser.role !== 'manager') return;

  console.log('[DEBUG] displayManagerTeam called for:', displayUser.username);
  console.log('[DEBUG] displayUser.id:', displayUser.id);
  console.log('[DEBUG] allUsers count:', allUsers.length);
  
  managerTile.classList.remove('hidden');
  
  const reports = getDirectReports(displayUser.id);
  console.log('[DEBUG] Direct reports found:', reports.length, reports.map(r => r.username));
  
  // Also get mentors of new employees managed by this manager
  const newEmployees = getNewEmployeesManagedByManager(displayUser.id);
  const mentorsOfNewEmployees = newEmployees
    .map(emp => allUsers.find(u => u.id === emp.mentorId))
    .filter(m => m && m.id);
  
  if (reports.length === 0 && mentorsOfNewEmployees.length === 0) {
    noManagerReports.classList.remove('hidden');
    managerTeamSections.innerHTML = '';
    return;
  }

  noManagerReports.classList.add('hidden');

  // Group by role
  const mentors = reports.filter(r => r.role === 'mentor');
  const directNewMembers = reports.filter(r => r.role === 'new_team_member');
  
  // Combine mentors (direct reports + mentors of new employees), removing duplicates
  const allMentors = [...mentors, ...mentorsOfNewEmployees];
  const uniqueMentors = Array.from(new Map(allMentors.map(m => [m.id, m])).values());

  let html = '';

  if (uniqueMentors.length > 0) {
    html += '<div class="team-section"><h4>Mentors</h4>';
    html += '<ul class="team-list">';
    html += uniqueMentors.map(mentor => `
      <li>
        <div class="member-info">
          <span class="member-name">${mentor.username}</span>
          <span class="member-role">Mentor</span>
        </div>
        <button onclick="window.location.href='dashboard.html?view=${mentor.id}'">View Dashboard</button>
      </li>
    `).join('');
    html += '</ul></div>';
  }

  if (directNewMembers.length > 0) {
    html += '<div class="team-section"><h4>Team Members</h4>';
    html += '<ul class="team-list">';
    html += directNewMembers.map(member => `
      <li>
        <div class="member-info">
          <span class="member-name">${member.username}</span>
          <span class="member-role">New Team Member</span>
        </div>
        <button onclick="window.location.href='dashboard.html?view=${member.id}'">View Dashboard</button>
      </li>
    `).join('');
    html += '</ul></div>';
  }

  managerTeamSections.innerHTML = html;
}

function resetInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  inactivityTimer = setTimeout(() => {
    logoutAndRedirect('Logged out due to 10 minutes of inactivity.');
  }, INACTIVITY_LIMIT);
}

['mousemove', 'click', 'keydown', 'scroll', 'touchstart'].forEach(eventName => {
  window.addEventListener(eventName, resetInactivityTimer);
});

logoutBtn.addEventListener('click', () => {
  logoutAndRedirect('Your session has ended. See you next time!');
});

locationSearch.addEventListener('input', (e) => {
  selectedCity = null;
  locationError.classList.add('hidden');
  renderSuggestions(e.target.value);
});

locationSearch.addEventListener('blur', () => {
  setTimeout(() => {
    clearSuggestions();
    validateLocationSelection();
  }, 200);
});

checklist.addEventListener('change', (e) => {
  // Check if current user has permission to modify this checklist
  if (!canModifyChecklist()) {
    // Prevent the change from persisting
    const checkbox = e.target;
    if (checkbox.type === 'checkbox') {
      console.warn('[WARNING] Attempt to modify checklist without permission prevented');
      // Revert the change
      checkbox.checked = !checkbox.checked;
      alert('You do not have permission to modify this checklist.');
      return;
    }
  }
  updateChecklistSummary();
  resetInactivityTimer();
});

  // Handle delete task button clicks using event delegation
checklist.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-task-btn')) {
    if (!canModifyChecklist()) {
      alert('You do not have permission to modify this checklist.');
      return;
    }
    
    const uid = e.target.dataset.uid;
    const idx = parseInt(e.target.dataset.idx, 10);
    if (uid && idx >= 0) {
      deleteCustomTask(uid, idx);
      // Rebuild checklist and save fresh checkbox state
      setChecklistItems(displayUser.role, displayUser.id);
      // Clear the old checkbox state to avoid state mismatch
      localStorage.removeItem(getChecklistKey(displayUser.id));
      updateChecklistSummary();
    }
  }
});

function canModifyChecklist() {
  // Can modify own dashboard
  if (currentUser?.uid && displayUser && displayUser.id === currentUser.uid) {
    return true;
  }
  
  // Manager can modify direct reports (new_team_members)
  const isManager = currentUser?.role === 'manager';
  const displayIsNewTeamMember = displayUser?.role === 'new_team_member';
  const managerMatch = displayUser?.managerId === currentUser?.uid;
  
  if (isManager && displayIsNewTeamMember && managerMatch) {
    return true;
  }
  
  // Mentor can modify their mentees
  const isMentor = currentUser?.role === 'mentor';
  const mentorMatch = displayUser?.mentorId === currentUser?.uid;
  
  if (isMentor && displayIsNewTeamMember && mentorMatch) {
    return true;
  }
  
  return false;
}

function openAddTaskModal() {
  if (!canModifyChecklist()) {
    alert('You do not have permission to modify this checklist.');
    return;
  }
  addTaskModal.classList.remove('hidden');
  taskDescription.focus();
}

function closeAddTaskModal() {
  addTaskModal.classList.add('hidden');
  taskDescription.value = '';
}

function submitAddTask() {
  if (!canModifyChecklist()) {
    alert('You do not have permission to modify this checklist.');
    return;
  }
  
  const desc = taskDescription.value.trim();
  if (!desc) {
    alert('Please enter a task description.');
    return;
  }
  
  addCustomTask(displayUser.id, desc);
  closeAddTaskModal();
  setChecklistItems(displayUser.role, displayUser.id);
  // Clear stale checkbox state to avoid mismatch with new task list
  localStorage.removeItem(getChecklistKey(displayUser.id));
  updateChecklistSummary();
}

addTaskCircleBtn.addEventListener('click', openAddTaskModal);
modalAddBtn.addEventListener('click', submitAddTask);
modalCancelBtn.addEventListener('click', closeAddTaskModal);
closeModalBtn.addEventListener('click', closeAddTaskModal);

// Close modal when clicking outside of it
addTaskModal.addEventListener('click', (e) => {
  if (e.target === addTaskModal) {
    closeAddTaskModal();
  }
});

// Submit on Enter key
taskDescription.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    submitAddTask();
  }
});

// Tab functionality for Resources section
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    
    // Remove active class from all buttons and content
    tabBtns.forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked button and corresponding content
    btn.classList.add('active');
    const activeContent = document.getElementById(tabName);
    if (activeContent) {
      activeContent.classList.add('active');
    }
  });
});

// Listen for auth state and initialize dashboard
onAuthStateChanged(async (user) => {
  console.log('[DEBUG] Dashboard: onAuthStateChanged triggered with user:', user ? { uid: user.uid, email: user.email } : 'null');
  
  if (!user) {
    // Not authenticated, redirect to login
    console.log('[DEBUG] No user authenticated, redirecting to index.html');
    window.location.href = 'index.html';
    return;
  }

  console.log('[DEBUG] Dashboard: User authenticated, initializing dashboard...');
  // User data is already in currentUser from backend
  currentUser = user;
  sessionStorage.setItem('app_session_user', JSON.stringify({ uid: user.uid, email: user.email, username: user.username, role: user.role }));

  // Load all users for the app
  console.log('[DEBUG] Dashboard: Loading users from API...');
  try {
    await loadAllUsersFromFirebase();
    console.log('[DEBUG] Dashboard: Users loaded successfully:', allUsers.length, 'users');
  } catch (err) {
    console.error('[ERROR] Dashboard: Failed to load users:', err);
    // Continue anyway - we can still show the dashboard with minimal functionality
  }

  // Determine which user's dashboard to display
  const urlParams = new URLSearchParams(window.location.search);
  const viewUid = urlParams.get('view');

  displayUser = currentUser;
  
  if (viewUid && viewUid !== currentUser.uid) {
    const requestedUser = getUserByUIDLocal(viewUid);
    
    if (requestedUser) {
      // Check if current user has permission to view this user
      const directReports = getDirectReports(currentUser.uid);
      const mentees = getMenteesByMentor(currentUser.uid);
      const newEmployees = getNewEmployeesManagedByManager(currentUser.uid);
      
      const canView = 
        (currentUser.role === 'manager' && directReports.some(r => r.id === viewUid)) ||
        (currentUser.role === 'mentor' && mentees.some(r => r.id === viewUid)) ||
        (currentUser.role === 'manager' && requestedUser.role === 'mentor' && newEmployees.some(emp => emp.mentorId === viewUid));
      
      if (canView) {
        displayUser = requestedUser;
        // Add a navigation/options header section
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const navContainer = document.createElement('div');
        navContainer.style.cssText = 'background: #FFF8E8; border-bottom: 3px solid #FFB700; padding: 1.5rem; margin-bottom: 2rem; border-radius: 8px; grid-column: 1 / -1;';
        navContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
            <div>
              <h3 style="margin: 0 0 0.5rem 0; color: #004054;">Viewing ${displayUser.username}'s Dashboard</h3>
              <p style="margin: 0; font-size: 0.9rem; color: #0D6B4F;">You have permission to view this team member's progress</p>
            </div>
            <a href="dashboard.html" style="padding: 0.6rem 1.2rem; background: #54E9AE; color: #004054; text-decoration: none; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; white-space: nowrap;">← Back to My Dashboard</a>
          </div>
        `;
        dashboardGrid.insertAdjacentElement('afterbegin', navContainer);
      }
    }
  }

  const displayRole = displayUser.role ? displayUser.role.replace(/_/g, ' ') : 'new team member';

  // Display username and user type in badge
  if (displayUser.id === currentUser.uid) {
    usernameBadge.textContent = displayUser.username;
    userTypeBadge.textContent = displayRole;
  } else {
    // Show current user info when viewing a reportee's dashboard
    const currentRole = currentUser.role ? currentUser.role.replace(/_/g, ' ') : 'new team member';
    usernameBadge.textContent = currentUser.username;
    userTypeBadge.textContent = currentRole;
  }

  // Set up checklist
  setChecklistItems(displayUser.role, displayUser.id);
  if (displayUser.id === currentUser.uid) {
    loadChecklistState(displayUser.id);
    addTaskContainer.classList.remove('hidden');
  } else {
    // When viewing another user's dashboard:
    // - Load their checklist state (if supervisor has permission, changes will sync)
    // - Don't disable checkboxes - let canModifyChecklist() handle permission checks
    // - Hide add task container unless supervisor has permission
    const raw = localStorage.getItem(getChecklistKey(displayUser.id));
    if (raw) {
      try {
        const state = JSON.parse(raw);
        const checkboxes = checklist.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((cb, index) => {
          if (typeof state[index] === 'boolean') cb.checked = state[index];
        });
      } catch (error) {
        console.warn('Invalid checklist state', error);
      }
    }
    // Show/hide add task container based on permissions
    if (canModifyChecklist()) {
      addTaskContainer.classList.remove('hidden');
    } else {
      addTaskContainer.classList.add('hidden');
    }
  }

  updateChecklistSummary();
  resetInactivityTimer();
  
  // Display team tiles based on role
  displayNewMemberTeam();
  displayMentorTeam();
  displayManagerTeam();
});
