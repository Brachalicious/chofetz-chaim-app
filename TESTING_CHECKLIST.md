# ✅ Testing Checklist - Lashon Hara Screening System

## Pre-Testing Setup

- [ ] Firebase is connected and working
- [ ] User is logged in to the app
- [ ] Navigate to "Learning Together" tab
- [ ] Switch to "💬 Live Chat" mode
- [ ] Select "🌍 Community Room"

---

## Test 1: Automatic Blocking - English Keywords

### Test messages that SHOULD be blocked:

1. **Test:** Type: `"I hate that person"`
   - [ ] Warning modal appears
   - [ ] Message shows lashon hara icon (🕊️⚠️)
   - [ ] Educational content displays
   - [ ] Message NOT posted to chat
   - [ ] Input field cleared after clicking "I Understand"

2. **Test:** Type: `"She is so stupid"`
   - [ ] Blocked with warning modal
   - [ ] Not posted

3. **Test:** Type: `"Did you hear about the loser?"`
   - [ ] Blocked (contains both gossip indicator + insult)
   - [ ] Not posted

4. **Test:** Type: `"He's such an idiot"`
   - [ ] Blocked
   - [ ] Not posted

5. **Test:** Type: `"What a disgusting person"`
   - [ ] Blocked
   - [ ] Not posted

---

## Test 2: Automatic Blocking - Hebrew Keywords

1. **Test:** Type: `"הוא שונא"`
   - [ ] Blocked
   - [ ] Warning appears

2. **Test:** Type: `"היא טיפשה"`
   - [ ] Blocked
   - [ ] Warning appears

3. **Test:** Type: `"הם גרועים"`
   - [ ] Blocked
   - [ ] Warning appears

---

## Test 3: Gossip Pattern Detection

1. **Test:** Type: `"I heard that Sarah failed"`
   - [ ] Blocked (gossip indicator)
   - [ ] Warning appears

2. **Test:** Type: `"Did you hear about John?"`
   - [ ] Blocked
   - [ ] Warning appears

3. **Test:** Type: `"Apparently she's terrible"`
   - [ ] Blocked (gossip + negative)
   - [ ] Warning appears

4. **Test:** Type: `"Between you and me, he's awful"`
   - [ ] Blocked
   - [ ] Warning appears

---

## Test 4: Aggressive Tone Detection

1. **Test:** Type: `"WHY ARE YOU SO TERRIBLE????"`
   - [ ] Blocked (excessive caps + multiple punctuation)
   - [ ] Warning appears

2. **Test:** Type: `"HATE HATE HATE!!!!!!"`
   - [ ] Blocked
   - [ ] Warning appears

3. **Test:** Type: `"What!!! How!!! Why!!!"`
   - [ ] Blocked (multiple exclamation marks)
   - [ ] Warning appears

---

## Test 5: Valid Messages (Should NOT be blocked)

These should post successfully:

1. **Test:** Type: `"I love learning about Shmiras HaLashon"`
   - [ ] Message posts successfully
   - [ ] Appears in chat
   - [ ] No warning

2. **Test:** Type: `"What a beautiful teaching from the Chofetz Chaim"`
   - [ ] Posts successfully
   - [ ] No warning

3. **Test:** Type: `"Can someone help me understand this concept?"`
   - [ ] Posts successfully
   - [ ] No warning

4. **Test:** Type: `"Shabbat Shalom everyone! 🕊️"`
   - [ ] Posts successfully
   - [ ] No warning

5. **Test:** Type: `"I heard this amazing shiur today"`
   - [ ] Posts successfully (positive context)
   - [ ] No warning

---

## Test 6: Flagging System

### Setup: Use two different user accounts (User A and User B)

1. **User A:** Post a borderline message: `"This is a test message"`
   - [ ] Message appears in chat

2. **User B:** Click the "🚩 Report" button on User A's message
   - [ ] Confirmation dialog appears
   - [ ] After confirming, see: "✓ Message flagged and hidden!"
   - [ ] Flag count shows: 1/2
   - [ ] Message HIDDEN from User B's view
   - [ ] User A still sees their message with "⚠️ This message is under review"

3. **User A:** Check if they can still see their message
   - [ ] Message visible with review notice
   - [ ] Notice says "⚠️ This message is under review"

4. **User C (third account):** Flag the same message
   - [ ] Confirmation dialog appears
   - [ ] After confirming, see: "⚠️ Message removed!"
   - [ ] Message completely deleted from chat
   - [ ] Auto-delete notice appears

5. **Check Firebase:**
   - [ ] Message NOT in `communityChat` collection
   - [ ] Message archived in `flaggedMessages` collection
   - [ ] Has fields: `originalId`, `flagCount: 2`, `deletedAt`, `status: 'auto-deleted'`

---

## Test 7: Cannot Double-Flag

1. **User A:** Post message
2. **User B:** Flag it once
   - [ ] Successfully flagged
3. **User B:** Try to flag same message again
   - [ ] Alert: "You have already flagged this message."
   - [ ] Cannot flag again

---

## Test 8: Cannot Flag Own Messages

1. **User A:** Post message
2. **User A:** Look for flag button on own message
   - [ ] No flag button visible on own messages
   - [ ] Only visible on others' messages

---

## Test 9: Warning Modal Features

1. **Trigger warning modal** (send any blocked message)
2. **Check modal content:**
   - [ ] Dove icon (🕊️⚠️) animates (pulse effect)
   - [ ] Title: "Lashon Hara Detected"
   - [ ] Torah quote appears: "The tongue has the power of life and death"
   - [ ] Four guidelines listed (✓ and ✗)
   - [ ] "I Understand" button present

3. **Test modal interactions:**
   - [ ] Click "I Understand" - modal closes
   - [ ] Wait 10 seconds - modal auto-closes
   - [ ] Input field cleared after modal closes

4. **Check modal styling:**
   - [ ] Smooth fade-in animation
   - [ ] Slide-up effect
   - [ ] Professional appearance
   - [ ] Responsive on mobile

---

## Test 10: Moderation Logging

### Check Firebase Collections:

1. **After blocking a message:**
   - [ ] New document in `moderationLog` collection
   - [ ] Contains: `userId`, `userName`, `message`, `reason`, `timestamp`
   - [ ] `action` field = "blocked"

2. **After flagging a message (1 flag):**
   - [ ] New document in `moderationQueue` collection
   - [ ] Contains: `messageId`, `flagCount: 1`, `status: 'pending_review'`
   - [ ] `flaggedBy` array has one user ID

3. **After auto-deletion (2 flags):**
   - [ ] Document removed from `communityChat`
   - [ ] New document in `flaggedMessages` collection
   - [ ] Contains: `originalId`, `flagCount: 2`, `status: 'auto-deleted'`
   - [ ] `reviewed` field = false

---

## Test 11: Visual Design

1. **Flag button styling:**
   - [ ] Red/orange color scheme
   - [ ] Hover effect (scale up)
   - [ ] Smooth transition
   - [ ] "🚩 Report" text

2. **Flag count badge:**
   - [ ] Red circle with white text
   - [ ] Animated pulse effect
   - [ ] Shows next to timestamp
   - [ ] Tooltip on hover

3. **Flagged message appearance:**
   - [ ] Semi-transparent background
   - [ ] Red left border
   - [ ] Review notice styling (yellow background)

4. **Chat message layout:**
   - [ ] Own messages: blue gradient, right-aligned
   - [ ] Other messages: white, left-aligned
   - [ ] Smooth slide-in animation on new messages

---

## Test 12: Hebrew/RTL Support

1. **Switch language to Hebrew:**
   - [ ] Click "עברית" button

2. **Test Hebrew blocking:**
   - [ ] Type Hebrew negative words
   - [ ] Warning appears correctly

3. **Check RTL layout:**
   - [ ] Text direction reversed
   - [ ] Flag buttons positioned correctly
   - [ ] Modal text aligned right
   - [ ] Border on correct side

---

## Test 13: Mobile Responsiveness

1. **On mobile device or narrow window:**
   - [ ] Warning modal scales properly
   - [ ] Chat messages readable
   - [ ] Flag buttons accessible
   - [ ] Input field responsive
   - [ ] No horizontal scrolling

---

## Test 14: Edge Cases

1. **Empty message:**
   - [ ] Cannot send empty message
   - [ ] No error, just doesn't send

2. **Very long message:**
   - [ ] Character limit enforced (500 chars)
   - [ ] Input maxlength prevents excess

3. **Special characters:**
   - [ ] Type: `"Hello! @#$%^&*() world"`
   - [ ] Should post if no violations

4. **Mixed language:**
   - [ ] Type: `"Hello שלום stupid"`
   - [ ] Should block (contains "stupid")

5. **Only emoji:**
   - [ ] Type: `"🕊️ 💙 ✨"`
   - [ ] Should post (no violations)

6. **Negative emoji pattern:**
   - [ ] Type: `"😠 😡 You are terrible"`
   - [ ] Should block (negative emoji + text)

---

## Test 15: Performance

1. **Send rapid messages:**
   - [ ] Type and send 5 valid messages quickly
   - [ ] All appear in order
   - [ ] No lag or delay
   - [ ] Real-time sync works

2. **Concurrent flagging:**
   - [ ] Two users flag same message simultaneously
   - [ ] Both flags counted
   - [ ] No duplicate entries
   - [ ] Auto-delete at threshold

---

## Test 16: Cleanup & Recovery

1. **Refresh page:**
   - [ ] Chat history preserved
   - [ ] Hidden messages stay hidden
   - [ ] Deleted messages stay deleted

2. **Log out and log in:**
   - [ ] Previous flags maintained
   - [ ] Cannot re-flag same message

3. **Network interruption:**
   - [ ] Messages queue when offline
   - [ ] Post when back online
   - [ ] No data loss

---

## Bug Reporting Template

If you find issues, report with:

```
**Test Number:** [e.g., Test 6.2]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Browser:** [Chrome/Safari/Firefox]
**Device:** [Desktop/Mobile]
**Screenshots:** [If applicable]
**Console Errors:** [Check browser console]
```

---

## Post-Testing Checklist

After all tests pass:

- [ ] Document any false positives
- [ ] Update keyword list if needed
- [ ] Verify Firebase rules are set
- [ ] Test with real users in staging
- [ ] Monitor first 24 hours in production
- [ ] Gather user feedback
- [ ] Adjust sensitivity as needed

---

## Success Criteria

✅ System successfully blocks lashon hara  
✅ Warning modal educates users  
✅ Flagging system removes harmful content  
✅ Moderation logs track violations  
✅ UI is smooth and professional  
✅ Mobile experience is good  
✅ No false positives on normal conversation  
✅ Hebrew detection works  

---

**Testing Complete!** 🎉

If all tests pass, the lashon hara screening system is ready for deployment.
