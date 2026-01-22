# 🕊️ Lashon Hara Screening System

## Overview
This document describes the comprehensive lashon hara (negative speech) screening and moderation system implemented in the Chofetz Chaim live chat.

## Features

### 1. 🛡️ Automatic Content Screening
Messages are automatically screened before being posted to the chat. The system checks for:

#### Detection Categories:
- **Negative Speech Patterns**
  - English: hate, stupid, idiot, loser, worthless, etc.
  - Hebrew: שונא, טיפש, מטומטם, גרוע, רע, etc.

- **Gossip Indicators**
  - Phrases like "did you hear", "I heard that", "rumor", "apparently"
  - Secret-sharing language: "don't tell anyone", "between you and me"

- **Judgmental Language**
  - "always fails", "never succeeds", "terrible at", "incompetent"

- **Mockery & Belittling**
  - "what a joke", "ridiculous", "embarrassing"

- **Pattern Recognition**
  - Regex patterns detect common gossip structures
  - Example: "she is so...", "can't believe he..."

- **Aggressive Tone Detection**
  - Excessive capitals (>60% of message)
  - Multiple exclamation/question marks (3+)
  - Negative emoji patterns

### 2. 🚨 Warning Modal
When lashon hara is detected, users see a beautiful educational modal that includes:

- **Visual Design**
  - Animated dove and warning icon (🕊️⚠️)
  - Clean, professional layout
  - Pulse animation on icon
  - Smooth slide-up entrance

- **Educational Content**
  - Clear explanation of the violation
  - Torah quote: "The tongue has the power of life and death" - Mishlei 18:21
  - Positive guidelines:
    ✓ Speak kindly about others
    ✓ Judge favorably (Dan L'Kaf Zechut)
    ✓ Share Torah insights and encouragement
    ✗ Avoid gossip, negativity, and criticism

- **User Experience**
  - "I Understand" button to acknowledge
  - Auto-dismiss after 10 seconds
  - Message is NOT posted

### 3. 🚩 Flag & Report System
Users can flag inappropriate messages that bypass the automatic filter:

#### How It Works:
1. **Flag Button**: Visible on all messages from other users
2. **Immediate Action**: 
   - First flag (1/2): Message is hidden and sent for review
   - Second flag (2/2): Message is automatically deleted
3. **User Protection**: Users can't flag the same message twice
4. **Visual Feedback**: Flag count displayed with animated badge

#### What Happens When Flagged:
- Message hidden from public view immediately
- Added to moderation queue for review
- User who posted sees "⚠️ This message is under review"
- After 2 flags: Auto-deleted and moved to review archive

### 4. 📋 Moderation & Review System

#### Three Firebase Collections:
1. **`moderationLog`** - Tracks all blocked attempts
   ```javascript
   {
     userId: string,
     userName: string,
     message: string,
     reason: string,
     keyword: string | null,
     timestamp: timestamp,
     action: 'blocked'
   }
   ```

2. **`moderationQueue`** - Flagged messages pending review
   ```javascript
   {
     messageId: string,
     userId: string,
     userName: string,
     message: string,
     timestamp: timestamp,
     flagCount: number,
     flaggedBy: array,
     status: 'pending_review',
     createdAt: timestamp
   }
   ```

3. **`flaggedMessages`** - Auto-deleted messages archive
   ```javascript
   {
     originalId: string,
     userId: string,
     userName: string,
     message: string,
     timestamp: timestamp,
     flagCount: number,
     flaggedBy: array,
     deletedAt: timestamp,
     status: 'auto-deleted',
     reviewed: boolean
   }
   ```

### 5. 🎨 Enhanced Visual Design

#### Message States:
- **Normal Messages**: Clean white/blue bubbles
- **Own Flagged Messages**: Semi-transparent with review notice
- **Flagged by Others**: Hidden from view (not rendered)
- **Flag Badge**: Animated red badge with flag count

#### CSS Features:
- Smooth animations on all interactions
- Responsive flag buttons with hover effects
- Color-coded warning states
- RTL (Right-to-Left) support for Hebrew
- Mobile-responsive design

### 6. 🔒 Security Features

- Messages logged before deletion (audit trail)
- User ID tracking for accountability
- Timestamp-based moderation
- Cannot flag own messages
- Cannot double-flag messages
- Automatic cleanup after threshold

## User Flow Examples

### Example 1: Automatic Block
1. User types: "I heard that Sarah is such a liar"
2. System detects "liar" (negative speech)
3. Warning modal appears
4. Message NOT posted
5. Logged in `moderationLog`

### Example 2: Community Flagging
1. User posts borderline inappropriate message
2. First user flags → Message hidden, in queue
3. Second user flags → Message auto-deleted
4. Saved to `flaggedMessages` for review

### Example 3: Own Message Review
1. User's message is flagged
2. They see it with "⚠️ This message is under review"
3. Others don't see it
4. Moderator can review and restore if appropriate

## Implementation Files

### Modified Files:
1. **`public/app.js`**
   - `screenForLashonHara()` - Enhanced detection function
   - `showLashonHaraWarning()` - Modal display function
   - `sendCommunityMessage()` - Updated with screening
   - `flagMessage()` - Enhanced flagging system
   - `addMessageToChat()` - Hide flagged messages

2. **`public/styles.css`**
   - `.lashon-hara-modal` - Warning modal styles
   - `.flag-btn` - Enhanced flag button
   - `.flag-count` - Animated badge
   - `.message-hidden-notice` - Review notice
   - Animations and transitions

## Future Enhancements

### Potential Additions:
1. **Admin Dashboard**
   - View all flagged messages
   - Restore false positives
   - Ban repeat offenders
   - Analytics on violations

2. **AI-Powered Detection**
   - Integrate OpenAI Moderation API
   - Context-aware analysis
   - Sentiment analysis
   - Multi-language support

3. **User Education**
   - Daily lashon hara tip
   - Learning from violations
   - Progress tracking
   - Positive speech badges

4. **Appeal System**
   - Users can appeal blocks
   - Moderator review process
   - Automatic un-flagging

5. **Customizable Sensitivity**
   - User preference for strictness
   - Community voting on keywords
   - Dynamic learning from flags

## Testing

### Test Cases:
1. ✅ Send message with "hate" → Blocked
2. ✅ Send message with "I heard that..." → Blocked
3. ✅ Flag message → Hidden and queued
4. ✅ Flag twice → Auto-deleted
5. ✅ View own flagged message → See review notice
6. ✅ Cannot double-flag
7. ✅ Hebrew negative words detected

## Monitoring

### Key Metrics to Track:
- Number of blocked messages per day
- Most common violation types
- False positive rate
- Average flag count before deletion
- User engagement after warnings

## Technical Notes

### Performance:
- Client-side screening (no API calls)
- Instant feedback to users
- Minimal database writes
- Efficient regex patterns

### Scalability:
- Firebase handles real-time sync
- Indexed queries for fast lookup
- Pagination for large message lists
- Automatic cleanup of old logs

## Support

For issues or suggestions, contact the development team.

---

**Remember:** The goal is not to punish, but to educate and create a positive, Torah-guided conversation space. 🕊️
