# Firebase Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: **chofetz-chaim-app** (or your preferred name)
4. Disable Google Analytics (optional) or configure it
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (</>)
2. Register app with nickname: "Chofetz Chaim Web App"
3. **Don't check** "Also set up Firebase Hosting" (we're using our own server)
4. Click "Register app"
5. **Copy the firebaseConfig object** - you'll need this!

## Step 3: Enable Authentication

1. In the left sidebar, click "Build" → "Authentication"
2. Click "Get started"
3. Click on "Email/Password" under Sign-in method
4. Enable "Email/Password"
5. Click "Save"

## Step 4: Set Up Firestore Database

1. In the left sidebar, click "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in **test mode**" (we'll secure it later)
4. Select your region (choose closest to your users)
5. Click "Enable"

## Step 5: Configure Firestore Security Rules

Once created, click "Rules" tab and replace with:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
                           resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                      request.resource.data.userId == request.auth.uid;
    }
  }
}
\`\`\`

Click "Publish"

## Step 6: Add Firebase Config to Your App

1. Open `public/firebase-config.js`
2. Replace the placeholder config with your actual Firebase config:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
\`\`\`

## Step 7: Test Your App

1. Start your server: `npm run dev`
2. Open http://localhost:3000
3. Try signing up with a test email and password
4. Check Firebase Console → Authentication to see your new user
5. Check Firestore → conversations to see saved chats

## Firestore Data Structure

Your app creates these collections:

### `users` collection:
\`\`\`
{
  name: "User Name",
  email: "user@example.com",
  createdAt: timestamp,
  streakCount: 0,
  totalConversations: 0,
  lastActive: timestamp
}
\`\`\`

### `conversations` collection:
\`\`\`
{
  userId: "user-firebase-uid",
  date: "Mon Dec 01 2025",
  messages: [
    {
      user: "What is lashon hara?",
      bot: "Lashon hara refers to...",
      timestamp: "2025-12-01T..."
    }
  ],
  createdAt: timestamp
}
\`\`\`

## Troubleshooting

**Firebase not defined error:**
- Make sure you're using a modern browser that supports ES modules
- Check browser console for CORS errors

**Authentication fails:**
- Verify Email/Password is enabled in Firebase Console
- Check that your firebaseConfig is correct

**Can't save conversations:**
- Check Firestore security rules
- Make sure user is authenticated before saving
- Check browser console for permission errors

## Security Best Practices (Production)

Before going live, update Firestore rules to be more secure:
- Add data validation
- Limit document sizes
- Add rate limiting
- Use Firebase App Check for additional security

## Next Steps

- Set up custom domain in Firebase Hosting (optional)
- Configure password reset emails
- Add social authentication (Google, etc.)
- Set up Firebase Storage for profile pictures
- Add Cloud Functions for backend logic
