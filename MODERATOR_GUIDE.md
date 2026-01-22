# 🛠️ Moderator Setup Guide

## Quick Start for Moderators

### Accessing the Moderation System

Currently, the moderation data is stored in Firebase. Here's how to access it:

## Firebase Console Access

1. **Log into Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Navigate to Firestore Database**
   - Click "Firestore Database" in left sidebar
   - You'll see all collections

### Collections to Monitor

#### 1. `moderationLog` - Blocked Messages
**Purpose**: Track all automatically blocked messages

**View this to**:
- See what users are attempting to post
- Identify repeat offenders
- Analyze common violations
- Improve keyword list

**Fields**:
- `userId` - Who tried to post
- `userName` - Display name
- `message` - What they tried to say
- `reason` - Why it was blocked
- `keyword` - Specific trigger word
- `timestamp` - When it happened
- `action` - Always "blocked"

**To review**:
```
Firestore → moderationLog → [Sort by timestamp, descending]
```

#### 2. `moderationQueue` - Flagged Messages (Pending)
**Purpose**: Messages with 1 flag, waiting for review

**View this to**:
- Review borderline content
- Decide if it should be deleted
- Take action on reported content

**Fields**:
- `messageId` - Original message ID
- `userId` - Message author
- `message` - The actual content
- `flagCount` - Number of flags (should be 1)
- `flaggedBy` - Array of user IDs who flagged
- `status` - "pending_review"

**Actions you can take**:
1. **Keep the message**: Delete from `moderationQueue`, update original message to `flagged: false, hidden: false`
2. **Remove the message**: Delete from both `moderationQueue` and `communityChat`

#### 3. `flaggedMessages` - Auto-Deleted Archive
**Purpose**: Messages that received 2+ flags and were auto-deleted

**View this to**:
- Review what was removed
- Restore false positives
- Permanent ban repeat offenders

**Fields**:
- `originalId` - Original message ID
- `userId` - Author
- `message` - Content
- `flagCount` - How many flags it got
- `flaggedBy` - Who flagged it
- `deletedAt` - When it was removed
- `status` - "auto-deleted"
- `reviewed` - Boolean (mark as reviewed)

**To restore a message**:
1. Copy the message data
2. Create new document in `communityChat`
3. Update `reviewed: true` in `flaggedMessages`

## Manual Actions via Firebase Console

### Example 1: Review Flagged Message
```
1. Go to Firestore → moderationQueue
2. Find the message
3. Read the content
4. Decide:
   - If appropriate: Delete from queue, unhide in communityChat
   - If inappropriate: Delete from both collections
```

### Example 2: Restore Auto-Deleted Message
```
1. Go to Firestore → flaggedMessages
2. Find the message you want to restore
3. Copy all fields
4. Go to communityChat collection
5. Add new document with the copied fields
6. Update flaggedMessages document: reviewed: true
```

### Example 3: Ban User
```
1. Go to Firestore → users
2. Find user by ID (from moderationLog)
3. Add field: banned: true, bannedAt: [timestamp]
4. (Future: App will check this field before allowing posts)
```

## Recommended Moderation Workflow

### Daily Tasks (5-10 minutes)
1. Check `moderationLog` for patterns
2. Review `moderationQueue` for pending flags
3. Verify `flaggedMessages` auto-deletes are correct

### Weekly Tasks (15-30 minutes)
1. Analyze violation trends
2. Update keyword list if needed
3. Restore any false positives
4. Identify repeat offenders

### Monthly Tasks (30-60 minutes)
1. Generate moderation report
2. Update community guidelines
3. Improve detection algorithms
4. User education content

## Building a Moderator Dashboard (Future Enhancement)

You can create a simple admin page:

```javascript
// Example: Load moderation queue
async function loadModerationQueue() {
  const q = query(
    collection(db, 'moderationQueue'),
    where('status', '==', 'pending_review'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    const data = doc.data();
    // Display in admin UI
    console.log(`Flagged: ${data.message} by ${data.userName}`);
  });
}

// Approve message (remove from queue, unhide)
async function approveMessage(messageId) {
  // Delete from moderation queue
  await deleteDoc(doc(db, 'moderationQueue', messageId));
  
  // Unhide original message
  await updateDoc(doc(db, 'communityChat', messageId), {
    flagged: false,
    hidden: false,
    moderatorApproved: true
  });
}

// Confirm deletion
async function confirmDeletion(messageId, originalMessage) {
  // Delete from moderation queue
  await deleteDoc(doc(db, 'moderationQueue', messageId));
  
  // Ensure deleted from chat
  await deleteDoc(doc(db, 'communityChat', messageId));
  
  // Mark as reviewed in archive
  const archiveQuery = query(
    collection(db, 'flaggedMessages'),
    where('originalId', '==', messageId)
  );
  const snapshot = await getDocs(archiveQuery);
  snapshot.forEach(async (doc) => {
    await updateDoc(doc.ref, { reviewed: true });
  });
}
```

## Security Rules

Make sure your Firebase Security Rules protect these collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Only authenticated users can read/write community chat
    match /communityChat/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null;
    }
    
    // Moderation collections - restrict to admins
    match /moderationLog/{logId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      allow create: if request.auth != null; // Allow logging
    }
    
    match /moderationQueue/{queueId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      allow create: if request.auth != null; // Allow flagging
    }
    
    match /flaggedMessages/{flagId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      allow create: if request.auth != null; // Allow auto-deletion
    }
  }
}
```

## Making Users Admins

To grant moderator access:

```
1. Go to Firestore → users → [user-id]
2. Add field: isAdmin: true
3. Save
```

Or via code:
```javascript
await updateDoc(doc(db, 'users', userId), {
  isAdmin: true,
  adminSince: serverTimestamp()
});
```

## Useful Firebase Console Queries

### Find repeat offenders
1. Go to moderationLog
2. Click "Filter"
3. Add: `userId` == `[specific-user-id]`
4. See all their violations

### See recent flags
1. Go to moderationQueue
2. Sort by `createdAt` descending
3. Review newest first

### Check auto-deletions
1. Go to flaggedMessages
2. Filter: `reviewed` == false
3. Review unreviewed deletions

## Analytics Ideas

Track these metrics in a separate `moderationStats` collection:

```javascript
{
  date: '2025-12-25',
  blockedMessages: 15,
  flaggedMessages: 8,
  autoDeleted: 3,
  restored: 1,
  topKeywords: ['hate', 'stupid', 'idiot'],
  topViolators: [userId1, userId2]
}
```

## Support & Questions

If you need help with moderation:
1. Check the `LASHON_HARA_SCREENING.md` documentation
2. Test the system yourself by trying to post violations
3. Review Firebase Console data
4. Contact the development team

---

**Remember**: We moderate with love and education, not punishment. The goal is to help users grow in their Shmiras HaLashon practice. 🕊️
