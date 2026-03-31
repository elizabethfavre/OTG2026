# 2026OTG - Onboarding Tracking Application

A web-based onboarding platform designed to track and manage employee onboarding at Blackbaud. The application supports role-based workflows for managers, mentors, and new team members with task checklists, relationship mapping, and timezone awareness.

## Features

- **User Authentication** — Email/password login and signup with role-based access control
- **Role-Based Dashboard** — Customized experience for managers, mentors, and new team members
- **Task Management** — Interactive checklists tailored to each user role
- **User Relationships** — Track manager-mentor-employee hierarchies
- **Timezone Support** — Global location and timezone selection with automatic time display
- **Persistent Data** — Cloud-based data storage with session management
- **Test Accounts** — Pre-configured test users for easy evaluation

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6 modules)
- **Backend/Database:** Firebase (Firestore + Authentication)
- **Hosting:** Currently Firebase; planned migration to Blackbaud server

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (Firebase-dependent)
- Optional: Node.js and local web server for development

### Running Locally

**Option 1: Direct File Access (Quick Demo)**
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Log in with test credentials (see below)

**Option 2: Local Web Server (Recommended)**
```powershell
# Using Python (if installed)
python -m http.server 8000

# Or using Node.js
npx http-server
```
Then visit `http://localhost:8000`

#### Test Accounts

The application comes with pre-configured test users in a realistic organizational hierarchy:
- **2 Managers** leading the organization
- **4 Mentors** (2 per manager) overseeing onboarding
- **8 New Employees** (2 per mentor) going through onboarding

#### Manager Accounts

| Username | Password | Email |
|----------|----------|-------|
| manager_alex | MgrAlex#2026! | alex.manager@company.com |
| manager_jordan | MgrJordan#2026! | jordan.manager@company.com |

#### Mentor Accounts

| Username | Password | Email | Reports To |
|----------|----------|-------|------------|
| mentor_casey | MentorCasey#2026! | casey.mentor@company.com | manager_alex |
| mentor_blake | MentorBlake#2026! | blake.mentor@company.com | manager_alex |
| mentor_drew | MentorDrew#2026! | drew.mentor@company.com | manager_jordan |
| mentor_morgan | MentorMorgan#2026! | morgan.mentor@company.com | manager_jordan |

#### Employee Accounts

| Username | Password | Email | Mentor | Manager |
|----------|----------|-------|--------|---------|
| employee_sierra | EmpSierra#2026! | sierra.emp@company.com | mentor_casey | manager_alex |
| employee_taylor | EmpTaylor#2026! | taylor.emp@company.com | mentor_casey | manager_alex |
| employee_chris | EmpChris#2026! | chris.emp@company.com | mentor_blake | manager_alex |
| employee_alex | EmpAlex#2026! | alex.emp@company.com | mentor_blake | manager_alex |
| employee_jordan | EmpJordan#2026! | jordan.emp@company.com | mentor_drew | manager_jordan |
| employee_casey | EmpCasey#2026! | casey.emp@company.com | mentor_drew | manager_jordan |
| employee_blair | EmpBlair#2026! | blair.emp@company.com | mentor_morgan | manager_jordan |
| employee_morgan | EmpMorgan#2026! | morgan.emp@company.com | mentor_morgan | manager_jordan |

#### Organization Hierarchy

```
manager_alex
├── mentor_casey
│   ├── employee_sierra
│   └── employee_taylor
└── mentor_blake
    ├── employee_chris
    └── employee_alex

manager_jordan
├── mentor_drew
│   ├── employee_jordan
│   └── employee_casey
└── mentor_morgan
    ├── employee_blair
    └── employee_morgan
```

## Project Structure

```
2026OTG/
├── index.html              # Login page
├── dashboard.html          # Main dashboard
├── app.js                  # Login & signup logic
├── dashboard.js            # Dashboard functionality
├── firebase-config.js      # Firebase configuration (gitignored)
├── firebase-init.js        # Firebase setup & utilities (gitignored)
├── style.css               # Global styles
├── .gitignore              # Git ignore rules
├── LICENSE                 # MIT License
└── README.md               # This file
```

## Architecture

### Authentication Flow
1. User enters credentials on login/signup page
2. Firebase Authentication validates credentials
3. User document created in Firestore with role and relationships
4. Session stored in browser storage
5. User redirected to dashboard

### Data Model

**Users Collection:**
- `email` — User email address
- `username` — Unique username
- `role` — 'manager', 'mentor', or 'new_team_member'
- `managerId` — Reference to manager user (if applicable)
- `mentorId` — Reference to mentor user (if applicable)

**Tasks:**
- Role-specific task lists defined in dashboard
- Task completion state stored per user

## Features by Role

### Managers
- View team performance metrics
- Approve project plans
- Schedule one-on-one meetings
- See all direct and indirect reports

### Mentors
- Review mentee progress
- Prepare coaching material
- Provide weekly feedback
- View assigned mentees

### New Team Members
- Complete onboarding checklist
- Set up development environment
- Meet mentor/team lead
- Track progress

## Testing

### Automated Testing

The project includes automated unit and end-to-end (E2E) tests using **Jest** and **Playwright**.

#### Setup Testing Environment

```bash
npm install
```

#### Run Tests

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode (rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

#### Test Structure

```
tests/
├── unit/                      # Unit tests
│   ├── auth.test.js          # Authentication logic tests
│   └── roles.test.js         # Role-based access control tests
└── e2e/                       # End-to-end tests
    ├── authentication.spec.js # Login/signup workflows
    └── dashboard.spec.js      # Dashboard functionality
```

#### Test Coverage

Unit tests cover:
- User session management
- Email and password validation
- Role-based permissions
- User hierarchy relationships
- Role-specific task lists

E2E tests cover:
- Login and signup flows
- Error handling
- Dashboard display
- Role-specific UI elements
- Task management workflows

### Manual Testing

See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for manual test scenarios covering:
- Authentication (login, signup, logout)
- User management and hierarchies
- Role-based access control
- Dashboard functionality
- Data persistence

## Future Roadmap

- **Blackbaud Server Migration** — Move from Firebase to Blackbaud-hosted backend for enterprise compliance
- **API Layer** — Create REST API for decoupled frontend/backend architecture
- **Additional Roles** — Support more granular permission levels
- **Mobile App** — Native mobile application for on-the-go access
- **Notifications** — Email/push notifications for task reminders
- **Performance Analytics** — Advanced reporting and onboarding metrics

## Environment Configuration

This application uses Firebase for development. For production deployment to Blackbaud:

1. Create a `.env.local` file with Blackbaud API credentials
2. Update API endpoints in `firebase-init.js`
3. Implement Blackbaud authentication layer
4. Migrate Firestore data to Blackbaud database

See [ENTERPRISE_REQUIREMENTS.md](ENTERPRISE_REQUIREMENTS.md) for detailed migration specifications.

## Security Notes

⚠️ **Important:** 
- Firebase configuration is stored in `firebase-config.js` which is gitignored
- Never commit API keys or credentials to version control
- For production use, implement a backend proxy to hide Firebase keys
- Consider creating a separate Firebase project for production

## Deployment Options

### Option 1: Netlify (Recommended)
```bash
# Deploy directly from GitHub
1. Push code to GitHub
2. Connect repository to Netlify
3. Netlify auto-deploys on push
```

### Option 2: Vercel
```bash
# Similar to Netlify
npm i -g vercel
vercel
```

### Option 3: Self-hosted Backend
Deploy with Node.js/Express backend that proxies Firebase calls for enhanced security.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License — See [LICENSE](LICENSE) for details. You are free to use, modify, and distribute this software.

## Contributing

For team contributions:
1. Clone the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## Contact & Support

For questions or issues, contact the development team or open an issue on GitHub.

---

**Last Updated:** March 2026  
**Status:** Active Development (Pre-Production)  
**Next Phase:** Blackbaud Server Migration
