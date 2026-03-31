# Backend Setup Guide

This guide explains how to set up the secure backend proxy for your OTG application.

## Why a Backend Proxy?

Your Firebase API key is currently exposed in the browser, which is a security risk. A backend proxy:
- Keeps Firebase credentials **server-side only** (never sent to browser)
- Provides a secure API layer between frontend and Firebase
- Allows for better access control and audit logging
- Enables migration to other backends (like Blackbaud) without frontend changes

---

## Step 1: Get Firebase Service Account Key

**⚠️ SECURITY WARNING:** Never commit this file to GitHub!

### Instructions:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`otg-27cac`)
3. Click the **gear icon** (Settings) → **Project Settings**
4. Go to the **"Service Accounts"** tab
5. Click **"Generate New Private Key"** (on the right side)
6. A JSON file will download automatically
7. Save it as `backend/serviceAccountKey.json`

**✅ The `.gitignore` already protects this file**

---

## Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

This installs:
- `express` - Web server
- `firebase-admin` - Firebase server SDK
- `cors` - Cross-origin requests
- `dotenv` - Environment variables

---

## Step 3: Create `.env` File

1. Copy `backend/.env.example` to `backend/.env`:
```bash
cp .env.example .env
```

2. Edit `backend/.env`:
```
FIREBASE_SERVICE_ACCOUNT=<leave as is, it will use serviceAccountKey.json>
FRONTEND_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

---

## Step 4: Run Locally

### Terminal 1 - Start Backend:
```bash
cd backend
npm start
```

You should see:
```
✅ Firebase Admin SDK initialized
✅ Backend server running on port 3000
```

### Terminal 2 - Start Frontend:
```bash
npm run dev
# or open index.html with Live Server
```

Visit: `http://localhost:5500` (or your Live Server port)

---

## Step 5: Update Frontend to Use Backend

### Option A: Complete Migration (Recommended)

Update `app.js` to use the new backend API:

```javascript
// Replace Firebase imports with:
import { 
  backendSignIn, 
  backendSignUp, 
  backendSignOut,
  getAllUsers,
  getUserByUid,
  onAuthStateChanged 
} from './backend-api.js';

// Then replace Firebase calls:
// OLD: const result = await firebaseSignIn(email, password);
// NEW: const result = await backendSignIn(email, password);
```

See `backend-api.js` for all available functions.

### Option B: Keep for Now (Testing)

Keep using Firebase while testing the backend separately. Both can coexist.

---

## Step 6: Deploy Backend

### Option A: Deploy to Render (Free, Easy)

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Create **"New Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - Add `NODE_ENV=production`
     - Add `FIREBASE_SERVICE_ACCOUNT=<entire JSON from serviceAccountKey.json>`
5. Click **"Deploy"**

Your backend URL: `https://your-app-name.onrender.com`

### Option B: Deploy to Heroku

1. Go to [heroku.com](https://heroku.com) → Sign up
2. Install Heroku CLI
3. Push code:
```bash
heroku login
heroku create your-app-name
heroku config:set FIREBASE_SERVICE_ACCOUNT='<entire JSON>'
git push heroku main
```

Your backend URL: `https://your-app-name.herokuapp.com`

---

## Step 7: Update Frontend for Production

Edit `backend-api.js` (top of file):

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.onrender.com/api'  // ← Update this
  : 'http://localhost:3000/api';
```

---

## Step 8: Deploy Frontend Again

Once your backend is live:

1. Push your code to GitHub:
```bash
git add .
git commit -m "Add backend API support"
git push origin main
```

2. Netlify will auto-redeploy
3. Test the live site with your new backend

---

## Testing the Backend

### Check if backend is running:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{"status":"healthy","timestamp":"2026-03-31T..."}
```

### Test login endpoint:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager_alex@company.com","password":"MgrAlex#2026!"}'
```

---

## Troubleshooting

### "Cannot find module 'firebaseserviceAccountKey.json'"
- Make sure the file exists at `backend/serviceAccountKey.json`
- Check the filename spelling (case-sensitive)

### CORS errors in browser console
- Check that `FRONTEND_URL` in `backend/.env` matches your frontend URL
- For production: Update Netlify URL in `.env`

### Backend works locally but not on Render
- Verify `FIREBASE_SERVICE_ACCOUNT` env var is set correctly
- Check Render logs for error messages

### "Repository not found" when connecting to Firebase
- Verify Firebase service account key is valid
- Try getting a new key from Firebase console

---

## Security Checklist

✅ Firebase credentials only in `serviceAccountKey.json` (gitignored)
✅ Backend API keys stored as environment variables (not in code)
✅ CORS configured to only allow frontend URL
✅ No sensitive data logged to console in production
✅ API validates all user inputs before database operations

---

## Next Steps

After backend is live:
1. ✅ Remove `firebase-config.js` from frontend
2. ✅ Remove direct Firebase imports from frontend
3. ✅ Use `backend-api.js` functions instead
4. ✅ Test all authentication flows
5. ✅ Share new API URL with team

---

## Support

For issues, check:
- Backend console logs: `npm start` output
- Render/Heroku logs: Dashboard → "Logs" tab
- Browser DevTools: Network tab (check API responses)
- `backend/server.js` comments for endpoint documentation
