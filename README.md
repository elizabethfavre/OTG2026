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

### Test Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | admin123! | Manager |
| mentor | mentor123! | Mentor |
| demo | demo123! | New Team Member |
| admin1 | admin123! | Manager |
| mentor1 | mentor123! | Mentor |
| new1 | new123! | New Team Member |

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

See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for comprehensive test scenarios covering:
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
