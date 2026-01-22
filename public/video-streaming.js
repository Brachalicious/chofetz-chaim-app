import { auth, db, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, arrayUnion, arrayRemove } from './firebase-config.js';

// WebRTC Configuration
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

// State management
let localStream = null;
let peerConnections = {};
let currentSessionId = null;
let currentUser = null;
let isHost = false;
let sessionStartTime = null;
let durationInterval = null;

// DOM Elements
let localVideo, remoteVideosContainer, videoGrid;
let startVideoBtn, joinVideoBtn, toggleMicBtn, toggleVideoBtn, shareScreenBtn, leaveCallBtn;
let activeSessionsList, sessionInfoPanel, createSessionModal;
let sessionUnsubscribe = null;

// Initialize video streaming
export function initVideoStreaming(user) {
    currentUser = user;
    
    // Get DOM elements
    localVideo = document.getElementById('localVideo');
    remoteVideosContainer = document.getElementById('remoteVideosContainer');
    videoGrid = document.getElementById('videoGrid');
    
    startVideoBtn = document.getElementById('startVideoBtn');
    joinVideoBtn = document.getElementById('joinVideoBtn');
    toggleMicBtn = document.getElementById('toggleMicBtn');
    toggleVideoBtn = document.getElementById('toggleVideoBtn');
    shareScreenBtn = document.getElementById('shareScreenBtn');
    leaveCallBtn = document.getElementById('leaveCallBtn');
    
    activeSessionsList = document.getElementById('activeSessionsList');
    sessionInfoPanel = document.getElementById('sessionInfoPanel');
    createSessionModal = document.getElementById('createSessionModal');
    
    setupEventListeners();
    loadActiveSessions();
}

function setupEventListeners() {
    // Start video button
    if (startVideoBtn) {
        startVideoBtn.addEventListener('click', showCreateSessionModal);
    }
    
    // Join video button
    if (joinVideoBtn) {
        joinVideoBtn.addEventListener('click', () => {
            // Scroll to active sessions
            document.getElementById('activeSessionsPanel').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Create session form
    const createSessionForm = document.getElementById('createSessionForm');
    if (createSessionForm) {
        createSessionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createSession();
        });
    }
    
    // Cancel session creation
    const cancelSessionBtn = document.getElementById('cancelSessionBtn');
    if (cancelSessionBtn) {
        cancelSessionBtn.addEventListener('click', () => {
            createSessionModal.classList.add('hidden');
        });
    }
    
    // Video controls
    if (toggleMicBtn) {
        toggleMicBtn.addEventListener('click', toggleMicrophone);
    }
    
    if (toggleVideoBtn) {
        toggleVideoBtn.addEventListener('click', toggleVideo);
    }
    
    if (shareScreenBtn) {
        shareScreenBtn.addEventListener('click', shareScreen);
    }
    
    if (leaveCallBtn) {
        leaveCallBtn.addEventListener('click', leaveSession);
    }
    
    // Session chat
    const sendSessionChatBtn = document.getElementById('sendSessionChatBtn');
    const sessionChatInput = document.getElementById('sessionChatInput');
    
    if (sendSessionChatBtn) {
        sendSessionChatBtn.addEventListener('click', sendSessionChat);
    }
    
    if (sessionChatInput) {
        sessionChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendSessionChat();
        });
    }
}

function showCreateSessionModal() {
    createSessionModal.classList.remove('hidden');
}

async function createSession() {
    const topic = document.getElementById('sessionTopicInput').value;
    const maxParticipants = parseInt(document.getElementById('maxParticipants').value);
    const requireApproval = document.getElementById('requireApproval').checked;
    
    try {
        // Create session in Firestore
        const sessionRef = await addDoc(collection(db, 'videoSessions'), {
            hostId: currentUser.id,
            hostName: currentUser.name,
            topic: topic,
            maxParticipants: maxParticipants,
            requireApproval: requireApproval,
            participants: [currentUser.id],
            participantNames: [currentUser.name],
            startedAt: serverTimestamp(),
            active: true,
            chatMessages: []
        });
        
        currentSessionId = sessionRef.id;
        isHost = true;
        
        // Hide modal
        createSessionModal.classList.add('hidden');
        
        // Start local stream
        await startLocalStream();
        
        // Show video grid
        videoGrid.classList.remove('hidden');
        document.getElementById('activeSessionsPanel').classList.add('hidden');
        sessionInfoPanel.classList.remove('hidden');
        
        // Update session info
        updateSessionInfo();
        
        // Listen for new participants
        listenForParticipants();
        
        // Start duration timer
        sessionStartTime = Date.now();
        startDurationTimer();
        
        updateStatus('Hosting Session');
        
    } catch (error) {
        console.error('Error creating session:', error);
        alert('Failed to create session. Please try again.');
    }
}

async function joinSession(sessionId, sessionData) {
    try {
        currentSessionId = sessionId;
        isHost = false;
        
        // Check if session is full
        if (sessionData.participants.length >= sessionData.maxParticipants) {
            alert('This session is full. Please try another one.');
            return;
        }
        
        // Check if approval required
        if (sessionData.requireApproval) {
            const confirmed = confirm(`Request to join "${sessionData.topic}"?\n\nHost: ${sessionData.hostName}\nParticipants: ${sessionData.participants.length}/${sessionData.maxParticipants}`);
            if (!confirmed) return;
            
            // Send join request
            await addDoc(collection(db, 'videoSessions', sessionId, 'joinRequests'), {
                userId: currentUser.id,
                userName: currentUser.name,
                requestedAt: serverTimestamp()
            });
            
            alert('Join request sent! Waiting for host approval...');
            // TODO: Listen for approval
            return;
        }
        
        // Add user to participants
        await updateDoc(doc(db, 'videoSessions', sessionId), {
            participants: arrayUnion(currentUser.id),
            participantNames: arrayUnion(currentUser.name)
        });
        
        // Start local stream
        await startLocalStream();
        
        // Show video grid
        videoGrid.classList.remove('hidden');
        document.getElementById('activeSessionsPanel').classList.add('hidden');
        sessionInfoPanel.classList.remove('hidden');
        
        // Update session info
        updateSessionInfo();
        
        // Listen for participants
        listenForParticipants();
        
        // Start duration timer
        sessionStartTime = Date.now();
        startDurationTimer();
        
        updateStatus('In Session');
        
    } catch (error) {
        console.error('Error joining session:', error);
        alert('Failed to join session. Please try again.');
    }
}

async function startLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        
    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Could not access camera/microphone. Please check permissions.');
        throw error;
    }
}

function toggleMicrophone() {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const span = toggleMicBtn.querySelector('span');
        if (audioTrack.enabled) {
            toggleMicBtn.innerHTML = '🎤 <span>Mute</span>';
        } else {
            toggleMicBtn.innerHTML = '🔇 <span>Unmute</span>';
        }
    }
}

function toggleVideo() {
    if (!localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const span = toggleVideoBtn.querySelector('span');
        if (videoTrack.enabled) {
            toggleVideoBtn.innerHTML = '📹 <span>Stop Video</span>';
        } else {
            toggleVideoBtn.innerHTML = '📹 <span>Start Video</span>';
        }
    }
}

async function shareScreen() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        const videoTrack = localStream.getVideoTracks()[0];
        
        // Replace video track with screen track in peer connections
        Object.values(peerConnections).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
                sender.replaceTrack(screenTrack);
            }
        });
        
        // Replace local video
        localVideo.srcObject = screenStream;
        
        shareScreenBtn.innerHTML = '🖥️ <span>Sharing...</span>';
        shareScreenBtn.disabled = true;
        
        // When screen sharing stops, revert to camera
        screenTrack.onended = () => {
            Object.values(peerConnections).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });
            localVideo.srcObject = localStream;
            shareScreenBtn.innerHTML = '🖥️ <span>Share Screen</span>';
            shareScreenBtn.disabled = false;
        };
        
    } catch (error) {
        console.error('Error sharing screen:', error);
    }
}

async function leaveSession() {
    const confirmed = confirm('Leave this study session?');
    if (!confirmed) return;
    
    try {
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        
        // Close all peer connections
        Object.values(peerConnections).forEach(pc => pc.close());
        peerConnections = {};
        
        // Remove from participants
        if (currentSessionId) {
            await updateDoc(doc(db, 'videoSessions', currentSessionId), {
                participants: arrayRemove(currentUser.id),
                participantNames: arrayRemove(currentUser.name)
            });
            
            // If host is leaving, end session
            if (isHost) {
                await updateDoc(doc(db, 'videoSessions', currentSessionId), {
                    active: false,
                    endedAt: serverTimestamp()
                });
            }
        }
        
        // Unsubscribe from listeners
        if (sessionUnsubscribe) {
            sessionUnsubscribe();
            sessionUnsubscribe = null;
        }
        
        // Stop duration timer
        if (durationInterval) {
            clearInterval(durationInterval);
            durationInterval = null;
        }
        
        // Reset UI
        videoGrid.classList.add('hidden');
        sessionInfoPanel.classList.add('hidden');
        document.getElementById('activeSessionsPanel').classList.remove('hidden');
        remoteVideosContainer.innerHTML = '';
        
        currentSessionId = null;
        isHost = false;
        sessionStartTime = null;
        
        updateStatus('Not Connected');
        
        // Reload active sessions
        loadActiveSessions();
        
    } catch (error) {
        console.error('Error leaving session:', error);
    }
}

function listenForParticipants() {
    if (!currentSessionId) return;
    
    const sessionRef = doc(db, 'videoSessions', currentSessionId);
    sessionUnsubscribe = onSnapshot(sessionRef, (snapshot) => {
        const data = snapshot.data();
        if (data) {
            // Update participant count
            document.getElementById('participantCount').textContent = data.participants.length;
            
            // Update session info
            document.getElementById('sessionHost').textContent = data.hostName;
            document.getElementById('sessionTopic').textContent = data.topic;
            
            // Handle new participants (would need WebRTC signaling)
            // This is simplified - real implementation needs signaling server
        }
    });
}

function updateSessionInfo() {
    if (!currentSessionId) return;
    
    getDoc(doc(db, 'videoSessions', currentSessionId)).then((snapshot) => {
        const data = snapshot.data();
        if (data) {
            document.getElementById('sessionHost').textContent = data.hostName;
            document.getElementById('sessionTopic').textContent = data.topic;
            document.getElementById('participantCount').textContent = data.participants.length;
        }
    });
}

function startDurationTimer() {
    durationInterval = setInterval(() => {
        if (!sessionStartTime) return;
        
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        document.getElementById('sessionDuration').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

async function sendSessionChat() {
    const input = document.getElementById('sessionChatInput');
    const message = input.value.trim();
    
    if (!message || !currentSessionId) return;
    
    try {
        const sessionRef = doc(db, 'videoSessions', currentSessionId);
        await updateDoc(sessionRef, {
            chatMessages: arrayUnion({
                userId: currentUser.id,
                userName: currentUser.name,
                message: message,
                timestamp: new Date().toISOString()
            })
        });
        
        input.value = '';
        
    } catch (error) {
        console.error('Error sending session chat:', error);
    }
}

async function loadActiveSessions() {
    if (!activeSessionsList) return;
    
    try {
        const q = query(
            collection(db, 'videoSessions'),
            where('active', '==', true),
            orderBy('startedAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            activeSessionsList.innerHTML = '<div class="empty-state">No active sessions. Be the first to start one!</div>';
            return;
        }
        
        activeSessionsList.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const sessionCard = createSessionCard(doc.id, data);
            activeSessionsList.appendChild(sessionCard);
        });
        
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

function createSessionCard(sessionId, data) {
    const card = document.createElement('div');
    card.className = 'session-card';
    
    const isFull = data.participants.length >= data.maxParticipants;
    const statusBadge = isFull ? '<span class="badge full">Full</span>' : '<span class="badge available">Available</span>';
    
    card.innerHTML = `
        <div class="session-card-header">
            <h6>📚 ${escapeHtml(data.topic)}</h6>
            ${statusBadge}
        </div>
        <div class="session-card-body">
            <p><strong>Host:</strong> ${escapeHtml(data.hostName)}</p>
            <p><strong>Participants:</strong> ${data.participants.length}/${data.maxParticipants}</p>
            <button class="join-session-btn ${isFull ? 'disabled' : ''}" ${isFull ? 'disabled' : ''}>
                🚪 Join Session
            </button>
        </div>
    `;
    
    const joinBtn = card.querySelector('.join-session-btn');
    if (!isFull) {
        joinBtn.addEventListener('click', () => joinSession(sessionId, data));
    }
    
    return card;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateStatus(status) {
    const statusElement = document.getElementById('sessionStatus');
    if (statusElement) {
        statusElement.textContent = status;
    }
}
