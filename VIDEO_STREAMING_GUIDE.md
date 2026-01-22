# 📺 Live Video Streaming - Face-to-Face Learning

## Overview
The Live Video Streaming feature enables users to learn Shmiras HaLashon together in real-time through video calls, similar to FaceTime/Zoom, creating a virtual Beis Medrash (study hall) experience.

## Features

### 1. 📹 Video Study Sessions
Users can create and join live video sessions for:
- One-on-one chavrusa (study partner) learning
- Small group discussions (2-4 participants)
- Medium group classes (5-8 participants)
- Large community sessions (9-12 participants)

### 2. 🚀 Session Management

#### Creating a Session
- **Start Video Session** button opens creation modal
- Set session topic (e.g., "Daily Lesson Day 15")
- Choose max participants (2, 4, 8, or 12)
- Optional: Require host approval for joiners
- Sessions are instantly live and visible to all users

#### Joining a Session
- View all active sessions in real-time
- See session details: topic, host, participant count
- One-click join for available sessions
- "Full" badge prevents joining overcrowded sessions
- Optional: Send join request if approval required

### 3. 🎥 Video Controls

#### Camera & Audio
- **Mute/Unmute Microphone** - Toggle audio on/off
- **Start/Stop Video** - Toggle camera on/off
- **Share Screen** - Share your screen to show texts/documents
- **Leave Call** - Exit the session gracefully

#### Video Layout
- **Main Video Window** - Large display for primary speaker/sharer
- **Remote Participants Grid** - Sidebar with other participants
- **Responsive Design** - Adapts to screen size and participant count

### 4. 💬 In-Session Chat
- Text chat alongside video
- Send messages to all participants
- Real-time message synchronization
- Preserved in session for late joiners

### 5. 📊 Session Information Panel
- **Host Name** - Who started the session
- **Topic** - What you're learning
- **Participant Count** - Live count of attendees
- **Duration Timer** - Session length (MM:SS)
- **Session Chat** - Integrated text messaging

### 6. 🔴 Active Sessions Dashboard
- Real-time list of all active sessions
- Session cards show:
  - Topic title
  - Host name
  - Current/Max participants
  - Available/Full status badge
- Auto-refreshes as sessions start/end

### 7. 📋 Torah-Guided Guidelines

Built-in reminders for proper conduct:
- ✓ Keep sessions focused on Torah learning
- ✓ Dress modestly (tzniut) as per halacha
- ✓ Maintain appropriate boundaries (separate gender sessions)
- ✓ Be respectful and follow Shmiras HaLashon principles
- ✓ Sessions are private and not recorded

## Technical Implementation

### WebRTC Technology
- **Peer-to-peer video** using WebRTC API
- **STUN servers** for connection establishment (Google STUN servers)
- **Real-time communication** with minimal latency
- **Browser-based** - no downloads required

### Firebase Integration
- **Firestore** stores session metadata
- **Real-time listeners** for session updates
- **Collections**:
  - `videoSessions` - Active session data
  - `joinRequests` - Approval queue (if enabled)

### Media Permissions
Requires user permission for:
- 📹 Camera access (video)
- 🎤 Microphone access (audio)
- 🖥️ Screen sharing (optional)

## User Flow

### Host Flow
1. Click **"📹 Start Video Session"**
2. Fill out session details:
   - Topic
   - Max participants
   - Approval setting
3. Click **"🚀 Start Session"**
4. Grant camera/mic permissions
5. Session goes live
6. Other users can now join
7. Manage controls during session
8. Click **"📞 Leave"** to end

### Participant Flow
1. Click **"💬 Live Chat"** tab
2. Click **"📺 Live Stream"** mode
3. See list of active sessions
4. Click **"🚪 Join Session"** on desired session
5. Grant camera/mic permissions
6. Video connects automatically
7. Interact via video and chat
8. Click **"📞 Leave"** when done

## Session States

### Not Connected
- Initial state
- Can create or join sessions
- Status: "Not Connected" (gray dot)

### Hosting Session
- User created the session
- Can see all participants
- Status: "Hosting Session" (green dot)

### In Session
- User joined an existing session
- Can interact with all participants
- Status: "In Session" (green dot)

## Security & Privacy

### Data Protection
- ✅ Video streams are peer-to-peer (not stored on servers)
- ✅ Sessions are temporary (deleted when ended)
- ✅ No recording capability built-in
- ✅ Participant list is private to session members

### Access Control
- ✅ Must be logged in to use video features
- ✅ Optional host approval for sensitive sessions
- ✅ Hosts can't see video without joining
- ✅ Firebase security rules protect session data

### Modesty Guidelines
- Sessions include halacha reminders
- Encourages separate gender groups
- Promotes Torah-focused discussions
- Tzniut guidelines clearly stated

## Browser Compatibility

### Supported Browsers
✅ Chrome/Chromium (recommended)
✅ Firefox
✅ Safari (iOS 11+, macOS)
✅ Edge (Chromium-based)

### Not Supported
❌ Internet Explorer
❌ Old browser versions without WebRTC

## Troubleshooting

### "Cannot Access Camera/Microphone"
**Solution**: 
1. Check browser permissions
2. Ensure no other app is using camera
3. Try reloading page and granting permission

### "Failed to Join Session"
**Solution**:
1. Check internet connection
2. Verify session is still active
3. Try creating your own session instead

### "Video Not Showing"
**Solution**:
1. Check if camera is enabled (not accidentally muted)
2. Try toggling video off then on
3. Leave and rejoin the session

### "Can't Hear Other Participants"
**Solution**:
1. Check your computer/device volume
2. Ensure they haven't muted their mic
3. Check browser audio permissions

## Firebase Setup

### Required Collections

```javascript
// videoSessions collection
{
  hostId: "user-id",
  hostName: "Username",
  topic: "Daily Lesson Day 15",
  maxParticipants: 4,
  requireApproval: false,
  participants: ["user-id-1", "user-id-2"],
  participantNames: ["User 1", "User 2"],
  startedAt: timestamp,
  active: true,
  chatMessages: [
    {
      userId: "user-id",
      userName: "Username",
      message: "Hello!",
      timestamp: "ISO-string"
    }
  ]
}
```

### Security Rules

```javascript
match /videoSessions/{sessionId} {
  // Anyone can read active sessions
  allow read: if request.auth != null && resource.data.active == true;
  
  // Only hosts can create
  allow create: if request.auth != null && 
                   request.auth.uid == request.resource.data.hostId;
  
  // Participants can update (join/leave)
  allow update: if request.auth != null && (
    request.auth.uid == resource.data.hostId ||
    request.auth.uid in resource.data.participants
  );
  
  // Only hosts can delete
  allow delete: if request.auth != null && 
                   request.auth.uid == resource.data.hostId;
}
```

## Future Enhancements

### Planned Features
1. **Recording** - Optional session recording for later review
2. **Breakout Rooms** - Split into smaller study groups
3. **Virtual Backgrounds** - Maintain privacy/modesty
4. **Scheduled Sessions** - Plan learning times in advance
5. **Whiteboard** - Draw and annotate together
6. **Text Highlighting** - Share and markup passages
7. **Auto-Captions** - Accessibility for hearing impaired
8. **Language Translation** - Real-time Hebrew ↔ English
9. **Mobile App** - Native iOS/Android experience
10. **Session Recording Analytics** - Track learning time

### Advanced Ideas
- **AI-Powered Moderation** - Auto-detect inappropriate content
- **Automatic Transcripts** - Written record of discussions
- **Study Partner Matching** - AI suggests compatible partners
- **Daily Reminder Notifications** - "Your chavrusa is waiting!"
- **Integration with Lesson Plans** - Jump to specific day's lesson
- **Virtual Beis Medrash** - Persistent study hall environment

## Best Practices

### For Hosts
1. Choose clear, specific topics
2. Start on time if scheduling
3. Set appropriate participant limits
4. Moderate discussions gently
5. End sessions when topic is complete

### For Participants
1. Test camera/mic before joining
2. Dress appropriately (tzniut)
3. Find quiet location
4. Stay engaged and participate
5. Thank the host before leaving

### For Everyone
1. Follow Shmiras HaLashon principles
2. No lashon hara in video or chat
3. Judge favorably (dan l'kaf zechut)
4. Be patient with tech issues
5. Focus on learning, not socializing

## Bandwidth Requirements

### Minimum
- **Download**: 1 Mbps
- **Upload**: 1 Mbps
- **Video Quality**: 360p

### Recommended
- **Download**: 3+ Mbps
- **Upload**: 3+ Mbps
- **Video Quality**: 720p HD

### Optimal
- **Download**: 5+ Mbps
- **Upload**: 5+ Mbps
- **Video Quality**: 1080p Full HD

## Cost Considerations

### Free Tier (Current Implementation)
- Uses Google STUN servers (free)
- Peer-to-peer connections (no bandwidth costs)
- Firebase free tier (generous limits)
- **Limitation**: Works best for small groups (2-4)

### Scaling Up
For larger groups (8-12 participants):
- May need TURN servers ($)
- Consider media server (Jitsi, mediasoup)
- Estimated cost: $50-200/month

## Support

### Getting Help
1. Check browser console for errors
2. Review this documentation
3. Test with a friend in private session
4. Contact development team if issues persist

### Reporting Issues
Please include:
- Browser name and version
- Operating system
- Number of participants
- Error messages (if any)
- Steps to reproduce

---

**May this feature bring Torah learners together across the world to study the precious teachings of the Chofetz Chaim! 🕊️📺**

*"והתורה אומרת: ימצא חבר - Find yourself a study partner" - Pirkei Avot*
