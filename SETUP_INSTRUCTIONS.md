# 🚀 Quick Start - Firebase Configuration Needed

Your Chofetz Chaim app is almost ready! You just need to configure Firebase.

## Current Status ✅

- ✅ Frontend UI with login/signup
- ✅ Chat interface with AI responses  
- ✅ Dashboard with stats
- ✅ Firebase integration code ready
- ⚠️ **Firebase config needs your credentials**

## What You Need to Do:

### 1. Create a Firebase Project (5 minutes)

1. Visit: https://console.firebase.google.com/
2. Click "Add project"
3. Name it: "Chofetz Chaim App"
4. Follow the wizard

### 2. Enable Firebase Services

**Authentication:**
- Go to Authentication → Get Started
- Enable "Email/Password"

**Firestore:**
- Go to Firestore Database → Create Database
- Start in "test mode"
- Choose your region

### 3. Get Your Config

1. Project Overview → Settings (gear icon) → Project settings
2. Scroll to "Your apps" → Click Web icon (</>)
3. Register app: "Chofetz Chaim Web"
4. **Copy the firebaseConfig object**

### 4. Add Config to Your App

Open: `public/firebase-config.js`

Replace this:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

With YOUR actual config (looks like):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA1B2C3D4E5F6...",
  authDomain: "chofetz-chaim-app.firebaseapp.com",
  projectId: "chofetz-chaim-app",
  storageBucket: "chofetz-chaim-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

### 5. Test It!

1. Server is already running at http://localhost:3000
2. Click "Sign Up" 
3. Create an account
4. Start chatting!

## Detailed Guide

For step-by-step instructions with screenshots, see: `FIREBASE_SETUP.md`

## Need Help?

Common issues:
- **"Firebase not configured"**: Make sure you saved `firebase-config.js`
- **"Auth not enabled"**: Enable Email/Password in Firebase Console
- **"Permission denied"**: Check Firestore security rules in `FIREBASE_SETUP.md`

## Test Without Firebase (Temporary)

The app will show errors without Firebase, but the AI chat still works if you:
1. Comment out the Firebase imports in `public/app.js`
2. Use the old localStorage-based code (we can revert if needed)

---

**Your app is ready to go once you add your Firebase config! 🎉**
