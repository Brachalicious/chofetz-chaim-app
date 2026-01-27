import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, limit } from './firebase-config.js';
import { initDailyLessons } from './daily-lessons.js';
import { switchLanguage, updateUILanguage, currentLanguage } from './translations.js';
import { initVideoStreaming } from './video-streaming.js';
import { initChizukVideos } from './chizuk-videos.js';

// State management
let currentUser = null;
let conversations = [];
let currentConversation = [];

// DOM Elements
const authModal = document.getElementById('authModal');
const appContainer = document.getElementById('appContainer');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authError = document.getElementById('authError');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const voiceRecordingPanel = document.getElementById('voiceRecordingPanel');
const transcriptionText = document.getElementById('transcriptionText');
const stopRecordingBtn = document.getElementById('stopRecording');
const sendTranscriptionBtn = document.getElementById('sendTranscription');
const cancelRecordingBtn = document.getElementById('cancelRecording');
const dailyMessage = document.getElementById('dailyMessage');
const userName = document.getElementById('userName');
const userDropdown = document.getElementById('userDropdown');
const chatView = document.getElementById('chatView');
const dashboardView = document.getElementById('dashboardView');

// Voice recognition
let recognition = null;
let isRecording = false;
let currentTranscript = '';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initializing...');
    console.log('✅ Auth:', auth);
    console.log('✅ DB:', db);
    console.log('✅ Login form element:', loginForm);
    console.log('✅ Signup form element:', signupForm);
    console.log('✅ Voice button element:', voiceBtn);
    
    // Initialize language
    updateUILanguage();
    updateLanguageButtons();
    
    setupEventListeners();
    loadDailyEncouragement();
    initDailyLessons();
    initVoiceRecognition();
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        console.log('🔐 Auth state changed:', user ? user.email : 'No user');
        if (user) {
            currentUser = {
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email
            };
            showApp();
        } else {
            currentUser = null;
            showAuth();
        }
    });
});

// Check if user is logged in
function checkAuth() {
    // Auth is now handled by onAuthStateChanged listener
    return;
}

function showAuth() {
    authModal.classList.remove('hidden');
    appContainer.classList.add('hidden');
}

function showApp() {
    authModal.classList.add('hidden');
    appContainer.classList.remove('hidden');
    userName.textContent = currentUser.name;
    loadUserData();
}

// Event Listeners
function setupEventListeners() {
    // Auth tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchAuthTab(tab);
        });
    });

    // Login form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Login form submitted');
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        console.log('Email:', email);
        console.log('Password length:', password.length);
        await login(email, password);
    });

    // Signup form
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Signup form submitted');
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Password length:', password.length);
        await signup(name, email, password);
    });

    // Chat form
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
            await sendMessage(message);
            messageInput.value = '';
        }
    });

    // Voice recording button
    voiceBtn.addEventListener('click', toggleVoiceRecording);
    
    // Voice recording controls
    stopRecordingBtn.addEventListener('click', stopRecording);
    sendTranscriptionBtn.addEventListener('click', sendTranscription);
    cancelRecordingBtn.addEventListener('click', cancelRecording);

    // Quick questions
    document.querySelectorAll('.quick-q').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Use the actual button text (which gets translated) instead of data-q
            const question = e.target.textContent.trim();
            messageInput.value = question;
            sendMessage(question);
        });
    });

    // User menu
    document.getElementById('userMenuBtn').addEventListener('click', () => {
        userDropdown.classList.toggle('hidden');
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('dashboardBtn').addEventListener('click', showDashboard);

    // Dashboard tabs
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchDashboardTab(tabName);
        });
    });

    // Dashboard bot image click
    const dashboardBotImage = document.getElementById('dashboardBotImage');
    if (dashboardBotImage) {
        dashboardBotImage.addEventListener('click', () => {
            showChat();
            messageInput.focus();
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            userDropdown.classList.add('hidden');
        }
    });

    // Password toggle functionality
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.target;
            const passwordInput = document.getElementById(targetId);
            const icon = e.currentTarget.querySelector('.show-icon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                icon.textContent = '👁️';
            }
        });
    });

    // Learning log button
    const addLogBtn = document.getElementById('addLogBtn');
    if (addLogBtn) {
        addLogBtn.addEventListener('click', addLearningLog);
    }

    // Tefilah buttons
    const copyTefilahBtn = document.getElementById('copyTefilahBtn');
    if (copyTefilahBtn) {
        copyTefilahBtn.addEventListener('click', copyTefilah);
    }

    const printTefilahBtn = document.getElementById('printTefilahBtn');
    if (printTefilahBtn) {
        printTefilahBtn.addEventListener('click', printTefilah);
    }

    // Community feed buttons
    const postShareBtn = document.getElementById('postShareBtn');
    if (postShareBtn) {
        postShareBtn.addEventListener('click', postToCommunity);
    }

    const shareInput = document.getElementById('shareInput');
    if (shareInput) {
        shareInput.addEventListener('input', (e) => {
            document.getElementById('charCount').textContent = e.target.value.length;
        });
    }

    // Feed filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const filter = e.target.dataset.filter;
            loadCommunityFeed(filter);
        });
    });

    // Learning Together mode toggle (Community Feed vs Live Chat)
    document.querySelectorAll('.learning-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.learning-mode-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const mode = e.target.dataset.mode;
            const feedSection = document.getElementById('communityFeedSection');
            const chatSection = document.getElementById('liveChatSection');
            
            if (mode === 'feed') {
                feedSection.classList.add('active');
                chatSection.classList.remove('active');
                loadCommunityFeed();
            } else if (mode === 'chat') {
                feedSection.classList.remove('active');
                chatSection.classList.add('active');
                loadCommunityChat();
            }
        });
    });

    // Language toggle buttons
    const languageToggle = document.getElementById('languageToggle');
    const languageToggleApp = document.getElementById('languageToggleApp');
    
    if (languageToggle) {
        languageToggle.addEventListener('click', () => {
            const newLang = currentLanguage === 'en' ? 'he' : 'en';
            switchLanguage(newLang);
            updateLanguageButtons();
        });
    }
    
    if (languageToggleApp) {
        languageToggleApp.addEventListener('click', () => {
            const newLang = currentLanguage === 'en' ? 'he' : 'en';
            switchLanguage(newLang);
            updateLanguageButtons();
        });
    }

    // Live Chat event listeners
    setupLiveChatListeners();
}

function setupLiveChatListeners() {
    // Chat mode switcher
    document.querySelectorAll('.chat-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chat-mode-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            document.querySelectorAll('.chat-room').forEach(room => room.classList.remove('active'));
            
            const mode = e.target.dataset.mode;
            if (mode === 'community') {
                document.getElementById('communityChatRoom').classList.add('active');
                loadCommunityChat();
            } else if (mode === 'partners') {
                document.getElementById('studyPartnersRoom').classList.add('active');
                loadStudyPartners();
                // Initialize video streaming when study partners section is opened
                if (typeof initVideoStreaming === 'function') {
                    initVideoStreaming(currentUser);
                }
            }
        });
    });

    // Study mode toggle (Profile vs Chat vs Video)
    document.querySelectorAll('.study-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.study-mode-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            document.querySelectorAll('.study-mode-section').forEach(section => section.classList.remove('active'));
            
            const studyMode = e.target.dataset.studyMode;
            if (studyMode === 'profile') {
                document.getElementById('profileMatchingSection').classList.add('active');
            } else if (studyMode === 'chat') {
                document.getElementById('privateChatSection').classList.add('active');
                loadPrivateMessages();
            } else if (studyMode === 'video') {
                document.getElementById('videoSessionsSection').classList.add('active');
                // Initialize video streaming when video tab is selected
                if (typeof initVideoStreaming === 'function') {
                    initVideoStreaming(currentUser);
                }
            }
        });
    });
    
    // Community chat send button
    const sendCommunityBtn = document.getElementById('sendCommunityMessageBtn');
    const communityInput = document.getElementById('communityMessageInput');
    
    if (sendCommunityBtn && communityInput) {
        sendCommunityBtn.addEventListener('click', sendCommunityMessage);
        communityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendCommunityMessage();
        });
    }
    
    // Private message send button
    const sendPrivateBtn = document.getElementById('sendPrivateMessageBtn');
    const privateInput = document.getElementById('privateMessageTextInput');
    
    if (sendPrivateBtn && privateInput) {
        sendPrivateBtn.addEventListener('click', sendPrivateMessage);
        privateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendPrivateMessage();
        });
    }
    
    // Study profile save button
    const saveProfileBtn = document.getElementById('saveStudyProfileBtn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveStudyProfile);
    }
    
    // User search
    const searchInput = document.getElementById('searchUsersInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterUsers(e.target.value);
        });
    }
}

function updateLanguageButtons() {
    const languageToggle = document.getElementById('languageToggle');
    const languageToggleApp = document.getElementById('languageToggleApp');
    
    const buttonText = currentLanguage === 'en' ? 'עברית' : 'English';
    
    if (languageToggle) languageToggle.textContent = buttonText;
    if (languageToggleApp) languageToggleApp.textContent = buttonText;
}

// Tefilah Functions
function copyTefilah() {
    const hebrewText = `תְּפִלָּה עַל הַדִּבּוּר

רִבּוֹנוֹ שֶׁל עוֹלָם, יְהִי רָצוֹן מִלְּפָנֶיךָ, ה' אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי, שֶׁתִּשְׁמְרֵנִי הַיּוֹם וּבְכָל יוֹם מֵעַזֵּי פָנִים וּמֵעַזּוּת פָּנִים.

וְתַצִּילֵנִי מִלָּשׁוֹן הָרָע וּמִבַּעַל לָשׁוֹן הָרָע, וְתִשְׁמְרֵנִי מִדִּבּוּר לָשׁוֹן הָרָע, מִלְּשָׁמְעוֹ וּמִלְּקַבְּלוֹ, אֶת יִשְׂרָאֵל אַחַי, מִכָּל סִבָּה וְעִלָּה.

וְלֹא יֵעָלֶה עַל לְבָבִי שׂנְאַת שׁוּם אָדָם מִיִּשְׂרָאֵל. וְתַצִּילֵנִי לְעוֹלָם מִנִּגּוּעַ צָרַעַת, וְכָל שֶׁכֵּן מִנִּגְעֵי מְצוֹרָע שֶׁל לָשׁוֹן הָרָע.

וּתְקַדֵּשׁ פִּי לְשֵׁם קָדְשֶׁךָ, וּתְטַהֵר לִבִּי לַעֲבוֹדָתֶךָ בֶּאֱמֶת. וְתִזְכְּרֵנִי לְשׁוֹן טוֹבָה לְשַׁבֵּחַ לְהַלֵּל וּלְפָאֵר אֶת שִׁמְךָ הַקָּדוֹשׁ תָּמִיד.`;

    const englishText = `Prayer for Guarding One's Speech

Master of the Universe, may it be Your will, Hashem my God and God of my fathers, that You protect me today and every day from arrogant people and from arrogance.

Save me from lashon hara (evil speech) and from those who speak lashon hara. Guard me from speaking, hearing, or accepting lashon hara about my fellow Jews, for any reason or cause.

May hatred of no person enter my heart. Protect me forever from the affliction of tzara'as (spiritual leprosy), especially from the affliction caused by lashon hara.

Sanctify my mouth for Your holy Name, and purify my heart to serve You in truth. Grant me a good tongue to praise, laud, and glorify Your holy Name always.`;

    const fullText = hebrewText + '\n\n' + englishText;

    navigator.clipboard.writeText(fullText).then(() => {
        alert('✅ Tefilah copied to clipboard!');
    }).catch(() => {
        alert('❌ Failed to copy. Please try again.');
    });
}

function printTefilah() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Tefilah Al HaDibur - Prayer for Speech</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                h1 {
                    text-align: center;
                    color: #2c5aa0;
                    margin-bottom: 30px;
                }
                .hebrew {
                    font-family: 'Times New Roman', serif;
                    font-size: 1.3em;
                    line-height: 2;
                    text-align: right;
                    direction: rtl;
                    margin-bottom: 40px;
                    padding: 20px;
                    border: 2px solid #2c5aa0;
                    border-radius: 8px;
                }
                .english {
                    font-size: 1.1em;
                    line-height: 1.8;
                    padding: 20px;
                    border: 2px solid #4a90e2;
                    border-radius: 8px;
                }
                p {
                    margin: 15px 0;
                }
                .title {
                    font-weight: bold;
                    font-size: 1.2em;
                    text-align: center;
                    margin-bottom: 20px;
                }
                @media print {
                    body { padding: 20px; }
                }
            </style>
        </head>
        <body>
            <h1>🙏 Tefilah Al HaDibur - Prayer for Speech</h1>
            <div class="hebrew">
                <p class="title">תְּפִלָּה עַל הַדִּבּוּר</p>
                <p>רִבּוֹנוֹ שֶׁל עוֹלָם, יְהִי רָצוֹן מִלְּפָנֶיךָ, ה' אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי, שֶׁתִּשְׁמְרֵנִי הַיּוֹם וּבְכָל יוֹם מֵעַזֵּי פָנִים וּמֵעַזּוּת פָּנִים.</p>
                <p>וְתַצִּילֵנִי מִלָּשׁוֹן הָרָע וּמִבַּעַל לָשׁוֹן הָרָע, וְתִשְׁמְרֵנִי מִדִּבּוּר לָשׁוֹן הָרָע, מִלְּשָׁמְעוֹ וּמִלְּקַבְּלוֹ, אֶת יִשְׂרָאֵל אַחַי, מִכָּל סִבָּה וְעִלָּה.</p>
                <p>וְלֹא יֵעָלֶה עַל לְבָבִי שׂנְאַת שׁוּם אָדָם מִיִּשְׂרָאֵל. וְתַצִּילֵנִי לְעוֹלָם מִנִּגּוּעַ צָרַעַת, וְכָל שֶׁכֵּן מִנִּגְעֵי מְצוֹרָע שֶׁל לָשׁוֹן הָרָע.</p>
                <p>וּתְקַדֵּשׁ פִּי לְשֵׁם קָדְשֶׁךָ, וּתְטַהֵר לִבִּי לַעֲבוֹדָתֶךָ בֶּאֱמֶת. וְתִזְכְּרֵנִי לְשׁוֹן טוֹבָה לְשַׁבֵּחַ לְהַלֵּל וּלְפָאֵר אֶת שִׁמְךָ הַקָּדוֹשׁ תָּמִיד.</p>
            </div>
            <div class="english">
                <p class="title">Prayer for Guarding One's Speech</p>
                <p><em>Master of the Universe, may it be Your will, Hashem my God and God of my fathers, that You protect me today and every day from arrogant people and from arrogance.</em></p>
                <p><em>Save me from lashon hara (evil speech) and from those who speak lashon hara. Guard me from speaking, hearing, or accepting lashon hara about my fellow Jews, for any reason or cause.</em></p>
                <p><em>May hatred of no person enter my heart. Protect me forever from the affliction of tzara'as (spiritual leprosy), especially from the affliction caused by lashon hara.</em></p>
                <p><em>Sanctify my mouth for Your holy Name, and purify my heart to serve You in truth. Grant me a good tongue to praise, laud, and glorify Your holy Name always.</em></p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Learning Log Functions
async function addLearningLog() {
    const logInput = document.getElementById('logInput');
    const sefariaSection = document.getElementById('sefariaSection');
    const logText = logInput.value.trim();
    const selectedSection = sefariaSection ? sefariaSection.value : '';
    
    // Build the log entry text
    let finalLogText = '';
    if (selectedSection) {
        finalLogText = `📚 ${selectedSection}`;
        if (logText) {
            finalLogText += ` - ${logText}`;
        }
    } else {
        finalLogText = logText;
    }
    
    if (!finalLogText) {
        alert('Please select a Sefaria section or enter what you learned');
        return;
    }
    
    if (!currentUser) return;
    
    try {
        const logEntry = {
            userId: currentUser.id,
            content: finalLogText,
            sefariaSection: selectedSection || null,
            timestamp: serverTimestamp(),
            createdAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, 'learningLogs'), logEntry);
        
        logInput.value = '';
        if (sefariaSection) sefariaSection.value = '';
        loadLearningLogs();
        
        // Update lessons learned count
        const lessonsCount = parseInt(document.getElementById('lessonsLearned').textContent) + 1;
        document.getElementById('lessonsLearned').textContent = lessonsCount;
        
    } catch (error) {
        console.error('Error adding learning log:', error);
        alert('Failed to save learning log. Please try again.');
    }
}

async function loadLearningLogs() {
    if (!currentUser) return;
    
    try {
        const logsQuery = query(
            collection(db, 'learningLogs'),
            where('userId', '==', currentUser.id),
            orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(logsQuery);
        const logsList = document.getElementById('learningLogList');
        
        if (querySnapshot.empty) {
            logsList.innerHTML = '<p class="empty-state">Your learning entries will appear here</p>';
            return;
        }
        
        logsList.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const log = docSnap.data();
            const logElement = createLogElement(docSnap.id, log);
            logsList.appendChild(logElement);
        });
        
    } catch (error) {
        console.error('Error loading learning logs:', error);
    }
}

function createLogElement(logId, log) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    
    const date = log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Just now';
    
    div.innerHTML = `
        <div class="log-entry-header">
            <span class="log-entry-date">📅 ${date}</span>
            <button class="log-entry-delete" data-log-id="${logId}">🗑️</button>
        </div>
        <div class="log-entry-content">${log.content}</div>
    `;
    
    // Add delete functionality
    div.querySelector('.log-entry-delete').addEventListener('click', async (e) => {
        if (confirm('Delete this learning log entry?')) {
            try {
                await deleteDoc(doc(db, 'learningLogs', logId));
                loadLearningLogs();
            } catch (error) {
                console.error('Error deleting learning log:', error);
                alert('Failed to delete log entry');
            }
        }
    });
    
    return div;
}

// Load and display completed lessons
async function loadCompletedLessons() {
    if (!currentUser) return;
    
    try {
        const userRef = doc(db, 'users', currentUser.id);
        const userDoc = await getDoc(userRef);
        const completedLessons = userDoc.data()?.completedLessons || [];
        
        // Update lessons learned count
        document.getElementById('lessonsLearned').textContent = completedLessons.length;
        
        // Display completed lessons
        const completedList = document.getElementById('completedLessonsList');
        
        if (completedLessons.length === 0) {
            completedList.innerHTML = '<p class="empty-state">Complete lessons to see them here!</p>';
            return;
        }
        
        // Sort lessons in order
        const sortedLessons = [...completedLessons].sort((a, b) => a - b);
        
        completedList.innerHTML = sortedLessons.map(day => `
            <div class="completed-lesson-badge">
                <div class="day-number">✓</div>
                <div class="day-label">Day ${day}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading completed lessons:', error);
    }
}

// Listen for lesson completion events
window.addEventListener('lessonCompleted', () => {
    loadCompletedLessons();
});

// Community Feed Functions
async function loadCommunityFeed(filter = 'all') {
    if (!currentUser) return;
    
    try {
        const feedList = document.getElementById('communityFeedList');
        feedList.innerHTML = '<div class="loading-spinner">Loading community updates...</div>';
        
        let q;
        if (filter === 'all') {
            q = query(
                collection(db, 'communityPosts'),
                orderBy('timestamp', 'desc')
            );
        } else {
            q = query(
                collection(db, 'communityPosts'),
                where('type', '==', filter),
                orderBy('timestamp', 'desc')
            );
        }
        
        const querySnapshot = await getDocs(q);
        const posts = [];
        
        querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        
        if (posts.length === 0) {
            feedList.innerHTML = '<p class="empty-state">No posts yet. Be the first to share!</p>';
            return;
        }
        
        feedList.innerHTML = posts.map(post => {
            const timeAgo = getTimeAgo(post.timestamp?.toDate());
            const badge = post.type === 'completions' ? 
                `<span class="feed-badge">✓ Completed Day ${post.day}</span>` : 
                post.type === 'milestones' ? 
                `<span class="feed-badge">🏆 ${post.milestone}</span>` : '';
            
            return `
                <div class="feed-item">
                    <div class="feed-item-header">
                        <span class="feed-user-name">${post.userName || 'Anonymous'}</span>
                        <span class="feed-timestamp">${timeAgo}</span>
                    </div>
                    <div class="feed-content">
                        ${post.content}
                    </div>
                    ${badge}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading community feed:', error);
        document.getElementById('communityFeedList').innerHTML = 
            '<p class="empty-state">Error loading feed. Please try again.</p>';
    }
}

async function postToCommunity() {
    if (!currentUser) return;
    
    const shareInput = document.getElementById('shareInput');
    const content = shareInput.value.trim();
    
    if (!content) {
        alert('Please write something to share!');
        return;
    }
    
    try {
        await addDoc(collection(db, 'communityPosts'), {
            userId: currentUser.id,
            userName: currentUser.name,
            content: content,
            type: 'all',
            timestamp: serverTimestamp()
        });
        
        shareInput.value = '';
        document.getElementById('charCount').textContent = '0';
        
        // Reload feed
        loadCommunityFeed();
        
        alert('✓ Shared successfully!');
        
    } catch (error) {
        console.error('Error posting to community:', error);
        alert('Failed to share. Please try again.');
    }
}

async function shareLessonToCommunity(day, title) {
    if (!currentUser) return;
    
    try {
        await addDoc(collection(db, 'communityPosts'), {
            userId: currentUser.id,
            userName: currentUser.name,
            content: `Just completed "${title}"! 📖`,
            type: 'completions',
            day: day,
            timestamp: serverTimestamp()
        });
        
        console.log('Shared to community feed!');
        
    } catch (error) {
        console.error('Error sharing to community:', error);
    }
}

function getTimeAgo(date) {
    if (!date) return 'Just now';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return 'Just now';
}

function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
    hideError();
}

// Auth functions (Firebase)
async function login(email, password) {
    console.log('Login attempt:', email);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful');
        // onAuthStateChanged will handle showing the app
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        showError(error.message || 'Login failed. Please check your credentials.');
    }
}

async function signup(name, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile with name
        await updateProfile(userCredential.user, {
            displayName: name
        });
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: name,
            email: email,
            createdAt: serverTimestamp(),
            streakCount: 0,
            totalConversations: 0,
            completedLessons: []
        });
        
        // onAuthStateChanged will handle showing the app
    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message || 'Signup failed. Please try again.');
    }
}

function logout() {
    signOut(auth).then(() => {
        conversations = [];
        currentConversation = [];
        chatMessages.innerHTML = '';
        // onAuthStateChanged will handle showing auth modal
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

function showError(message) {
    authError.textContent = message;
    authError.classList.add('show');
    setTimeout(() => hideError(), 5000);
}

function hideError() {
    authError.classList.remove('show');
}

// Chat functions
async function sendMessage(message) {
    // Add user message to chat
    addMessage('user', message);
    
    // Show typing indicator
    showTypingIndicator();
    
    // Disable input
    sendBtn.disabled = true;
    messageInput.disabled = true;
    
    try {
        const response = await fetch('/api/chofetz-chaim/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message,
                language: currentLanguage 
            })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add bot response with the original question
        addMessage('bot', data.response || data.fallback, message);
        
        // Save to conversation
        currentConversation.push({
            user: message,
            bot: data.response || data.fallback,
            timestamp: new Date().toISOString()
        });
        
        await saveConversation();
        
    } catch (error) {
        removeTypingIndicator();
        addMessage('bot', 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.');
    } finally {
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }
}

// Function to convert URLs and markdown links to clickable HTML
function makeLinksClickable(text) {
    // First, handle markdown-style links [text](url)
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #2c5aa0; text-decoration: underline;">$1</a>');
    
    // Then handle plain URLs that aren't already in anchor tags
    text = text.replace(/(?<!href="|">)(https?:\/\/[^\s<]+)(?![^<]*<\/a>)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #2c5aa0; text-decoration: underline;">$1</a>');
    
    // Convert line breaks to <br> tags
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

function addMessage(type, text, userQuestion = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (type === 'user') {
        avatar.textContent = '👤';
    } else {
        // Make bot avatar larger and interactive
        avatar.classList.add('bot-avatar-large');
        const img = document.createElement('img');
        img.src = '/chofetz_chaim.svg';
        img.alt = 'Chofetz Chaim';
        img.className = 'bot-avatar-img';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        avatar.appendChild(img);
    }
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // For bot messages, convert links to clickable HTML
    if (type === 'bot') {
        content.innerHTML = makeLinksClickable(text);
    } else {
        content.textContent = text;
    }
    
    // Detect Hebrew text and apply RTL styling
    const hebrewPattern = /[\u0590-\u05FF]/;
    if (hebrewPattern.test(text)) {
        content.style.direction = 'rtl';
        content.style.textAlign = 'right';
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    // Add action buttons container for bot responses
    if (type === 'bot') {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        actionsDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 8px; margin-left: 100px; flex-wrap: wrap;';
        
        // Listen button
        const playbackBtn = document.createElement('button');
        playbackBtn.className = 'playback-btn';
        playbackBtn.innerHTML = '🔊 Listen';
        playbackBtn.setAttribute('aria-label', 'Listen to response');
        playbackBtn.onclick = () => playMessage(text, playbackBtn);
        actionsDiv.appendChild(playbackBtn);
        
        // Share button
        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-message-btn';
        shareBtn.innerHTML = '📤 Share';
        shareBtn.setAttribute('aria-label', 'Share this response');
        shareBtn.onclick = () => shareMessageContent(text, userQuestion);
        actionsDiv.appendChild(shareBtn);
        
        messageDiv.appendChild(actionsDiv);
    }
    
    // Remove welcome message if exists
    const welcome = chatMessages.querySelector('.welcome-message');
    if (welcome) {
        welcome.remove();
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function playMessage(text, button) {
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        button.innerHTML = '🔊 Listen';
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Update button during speech
    button.innerHTML = '⏸️ Stop';
    
    utterance.onend = () => {
        button.innerHTML = '🔊 Listen';
    };
    
    utterance.onerror = () => {
        button.innerHTML = '🔊 Listen';
        console.error('Speech synthesis error');
    };
    
    window.speechSynthesis.speak(utterance);
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message bot typing';
    indicator.id = 'typingIndicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar bot-avatar-large';
    const img = document.createElement('img');
    img.src = '/chofetz_chaim.svg';
    img.alt = 'Chofetz Chaim';
    img.className = 'bot-avatar-img';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    avatar.appendChild(img);
    
    const content = document.createElement('div');
    content.className = 'message-content typing-indicator';
    content.innerHTML = '<span></span><span></span><span></span>';
    
    indicator.appendChild(avatar);
    indicator.appendChild(content);
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Share message content without requiring account
async function shareMessageContent(messageText, userQuestion = null) {
    // Import translations
    const { t, currentLanguage } = await import('./translations.js');
    
    // Build the complete share content
    const disclaimer = `Important Notice ⚠️

This chatbot is not a rabbi and should not be relied upon for final halachic decisions. If answers are unclear or if you have further questions, please consult a qualified rabbi or call:

THE SHMIRAS HALOSHON SHAILA HOTLINE 📞

Whether it is for a shidduch, a job referral, or just among family or friends, the wrong words can do irreparable harm. And sometimes, so can silence. Our Shaila Hotline puts you in contact with expert rabbonim so that before you speak, you can be sure.

Hours: Evenings from 9:00 to 10:30 PM

CALL: 718-951-3696 📞`;
    
    let fullShareContent = '';
    
    if (userQuestion) {
        fullShareContent = `Question: ${userQuestion}\n\nAnswer from Chofetz Chaim:\n${messageText}\n\n---\n\n${disclaimer}\n\n🕊️ Chofetz Chaim App`;
    } else {
        fullShareContent = `Insight from Chofetz Chaim on Shmiras HaLashon:\n\n${messageText}\n\n---\n\n${disclaimer}\n\n🕊️ Chofetz Chaim App`;
    }
    
    // Create share modal
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    `;
    
    const shareTitle = currentLanguage === 'he' ? 'שתף תשובה זו' : 'Share This Response';
    const shareSubtitle = currentLanguage === 'he' ? 
        'בחר איך תרצה לשתף את התשובה מחפץ חיים' : 
        'Choose how you want to share this response from Chofetz Chaim';
    
    // Build preview HTML
    let previewHTML = '';
    if (userQuestion) {
        previewHTML = `
            <div style="margin-bottom: 10px;">
                <strong style="color: #2c5aa0;">Question:</strong>
                <p style="margin: 5px 0; font-size: 0.9em; color: #333;">${userQuestion}</p>
            </div>
            <div style="margin-bottom: 10px;">
                <strong style="color: #667eea;">Answer:</strong>
                <p style="margin: 5px 0; font-size: 0.9em; color: #333;">${messageText}</p>
            </div>
        `;
    } else {
        previewHTML = `<p style="margin: 0; font-size: 0.9em;">${messageText}</p>`;
    }
    
    modalContent.innerHTML = `
        <h3 style="margin-top: 0; color: #2c5aa0; ${currentLanguage === 'he' ? 'direction: rtl; text-align: right;' : ''}">${shareTitle}</h3>
        <p style="color: #666; margin-bottom: 20px; ${currentLanguage === 'he' ? 'direction: rtl; text-align: right;' : ''}">${shareSubtitle}</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
            ${previewHTML}
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #ddd; font-size: 0.85em; color: #666;">
                <strong>⚠️ Important Notice</strong>
                <p style="margin: 5px 0;">This chatbot is not a rabbi. For halachic questions, consult a qualified rabbi or call:</p>
                <p style="margin: 5px 0; color: #2c5aa0; font-weight: 600;">📞 THE SHMIRAS HALOSHON SHAILA HOTLINE<br>718-951-3696</p>
                <p style="margin: 5px 0; font-size: 0.9em;">Hours: Evenings 9:00-10:30 PM</p>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            <button id="shareWhatsApp" style="padding: 12px; border: none; border-radius: 8px; background: #25D366; color: white; cursor: pointer; font-size: 14px; font-weight: 600;">
                💬 WhatsApp
            </button>
            <button id="shareTwitter" style="padding: 12px; border: none; border-radius: 8px; background: #1DA1F2; color: white; cursor: pointer; font-size: 14px; font-weight: 600;">
                🐦 Twitter
            </button>
            <button id="shareSMS" style="padding: 12px; border: none; border-radius: 8px; background: #34B7F1; color: white; cursor: pointer; font-size: 14px; font-weight: 600;">
                📱 ${currentLanguage === 'he' ? 'הודעת טקסט' : 'Text'}
            </button>
            <button id="shareCopy" style="padding: 12px; border: none; border-radius: 8px; background: #6c757d; color: white; cursor: pointer; font-size: 14px; font-weight: 600;">
                📋 ${currentLanguage === 'he' ? 'העתק' : 'Copy'}
            </button>
        </div>
        
        <button id="closeShareModal" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; background: white; color: #666; cursor: pointer; font-size: 14px; font-weight: 600;">
            ${currentLanguage === 'he' ? 'סגור' : 'Close'}
        </button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('shareWhatsApp').onclick = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(fullShareContent)}`;
        window.open(url, '_blank');
        modal.remove();
    };
    
    document.getElementById('shareTwitter').onclick = () => {
        // Twitter has character limits, so share a shorter version
        const twitterText = userQuestion ? 
            `Q: ${userQuestion}\n\nA: ${messageText}\n\n📞 For halachic questions: 718-951-3696\n🕊️ Chofetz Chaim App` :
            `${messageText}\n\n📞 Shmiras Haloshon Hotline: 718-951-3696\n🕊️ Chofetz Chaim App`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
        window.open(url, '_blank');
        modal.remove();
    };
    
    document.getElementById('shareSMS').onclick = () => {
        const url = `sms:?&body=${encodeURIComponent(fullShareContent)}`;
        window.location.href = url;
        modal.remove();
    };
    
    document.getElementById('shareCopy').onclick = async () => {
        try {
            await navigator.clipboard.writeText(fullShareContent);
            const copyBtn = document.getElementById('shareCopy');
            copyBtn.innerHTML = currentLanguage === 'he' ? '✓ הועתק!' : '✓ Copied!';
            copyBtn.style.background = '#28a745';
            setTimeout(() => modal.remove(), 1500);
        } catch (err) {
            alert(currentLanguage === 'he' ? 'שגיאה בהעתקה' : 'Failed to copy');
        }
    };
    
    document.getElementById('closeShareModal').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// Daily encouragement
async function loadDailyEncouragement() {
    try {
        const response = await fetch('/api/chofetz-chaim/daily-encouragement');
        const data = await response.json();
        dailyMessage.textContent = data.encouragement;
    } catch (error) {
        dailyMessage.textContent = 'May your words today bring blessing to the world! 🕊️';
    }
}

// Dashboard functions
function showDashboard() {
    chatView.classList.remove('active');
    dashboardView.classList.add('active');
    loadDashboardData();
}

function showChat() {
    dashboardView.classList.remove('active');
    chatView.classList.add('active');
}

function switchDashboardTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.dashboard-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load completed lessons when tracker tab is opened
    if (tabName === 'tracker') {
        loadCompletedLessons();
    }
    
    // Load community feed when community tab is opened
    if (tabName === 'community') {
        loadCommunityFeed();
        // Set default view to Community Feed
        const feedSection = document.getElementById('communityFeedSection');
        const chatSection = document.getElementById('liveChatSection');
        if (feedSection && chatSection) {
            feedSection.classList.add('active');
            chatSection.classList.remove('active');
        }
    }
    
    // Initialize Chizuk videos when tab is opened
    if (tabName === 'chizuk') {
        initChizukVideos(currentUser);
    }
}

function loadUserData() {
    // Load user conversations from Firestore
    loadConversationsFromFirestore();
    // Load completed lessons
    loadCompletedLessons();
}

async function loadConversationsFromFirestore() {
    if (!currentUser) return;
    
    try {
        const q = query(
            collection(db, 'conversations'),
            where('userId', '==', currentUser.id),
            orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        conversations = [];
        
        querySnapshot.forEach((doc) => {
            conversations.push({
                id: doc.id,
                ...doc.data()
            });
        });
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

async function saveConversation() {
    if (!currentUser) return;
    
    try {
        const today = new Date().toDateString();
        
        // Save conversation to Firestore
        await addDoc(collection(db, 'conversations'), {
            userId: currentUser.id,
            date: today,
            messages: currentConversation,
            createdAt: serverTimestamp()
        });
        
        // Update user stats
        const userRef = doc(db, 'users', currentUser.id);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            await updateDoc(userRef, {
                totalConversations: (userData.totalConversations || 0) + 1,
                lastActive: serverTimestamp()
            });
        }
        
        await loadConversationsFromFirestore();
    } catch (error) {
        console.error('Error saving conversation:', error);
    }
}

function loadDashboardData() {
    // Calculate streak
    const streak = calculateStreak();
    document.getElementById('streakDays').textContent = streak;
    
    // Total chats
    const totalChats = conversations.reduce((sum, conv) => {
        return sum + (conv.messages ? conv.messages.length : 0);
    }, 0);
    document.getElementById('totalChats').textContent = totalChats;
    
    // Lessons learned (mock)
    document.getElementById('lessonsLearned').textContent = conversations.length;
    
    // Load learning logs
    loadLearningLogs();
    
    // Recent conversations
    const conversationsList = document.getElementById('conversationsList');
    if (conversations.length === 0) {
        conversationsList.innerHTML = '<p class="empty-state">Your conversations will appear here</p>';
    } else {
        conversationsList.innerHTML = conversations
            .slice(-5)
            .reverse()
            .map(conv => `
                <div class="conversation-item">
                    <strong>${conv.date}</strong><br>
                    ${conv.messages ? conv.messages.length : 0} messages
                </div>
            `).join('');
    }
}

function calculateStreak() {
    if (conversations.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = checkDate.toDateString();
        
        const hasConversation = conversations.some(c => c.date === dateString);
        
        if (hasConversation) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }
    
    return streak;
}

// Voice Recording Functions
function initVoiceRecognition() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser');
        voiceBtn.title = 'Voice recording not supported in this browser. Please use Chrome, Safari, or Edge.';
        voiceBtn.style.opacity = '0.5';
        voiceBtn.style.cursor = 'not-allowed';
        voiceBtn.onclick = () => {
            alert('Voice recording is not supported in Firefox. Please use Chrome, Safari, or Edge for voice input.');
        };
        return;
    }
    
    // Show the button since speech recognition is supported
    voiceBtn.style.display = 'inline-flex';
    voiceBtn.style.opacity = '1';
    
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentLanguage === 'he' ? 'he-IL' : 'en-US';
    
    recognition.onstart = () => {
        isRecording = true;
        currentTranscript = '';
        voiceRecordingPanel.style.display = 'block';
        transcriptionText.textContent = 'Speak now...';
        sendTranscriptionBtn.disabled = true;
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        currentTranscript = (finalTranscript + interimTranscript).trim();
        
        if (currentTranscript) {
            transcriptionText.textContent = currentTranscript;
            sendTranscriptionBtn.disabled = false;
        } else {
            transcriptionText.textContent = 'Speak now...';
            sendTranscriptionBtn.disabled = true;
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            transcriptionText.textContent = 'No speech detected. Try speaking again...';
        } else if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access in your browser settings.');
            cancelRecording();
        } else {
            transcriptionText.textContent = 'Error: ' + event.error + '. Please try again...';
        }
    };
    
    recognition.onend = () => {
        if (isRecording) {
            // If still in recording mode, restart
            try {
                recognition.start();
            } catch (e) {
                console.log('Recognition restart prevented:', e);
            }
        }
    };
}

function toggleVoiceRecording() {
    if (!recognition) {
        initVoiceRecognition();
    }
    
    if (!recognition) {
        return;
    }
    
    if (isRecording) {
        stopRecording();
    } else {
        try {
            recognition.start();
        } catch (e) {
            console.error('Failed to start recognition:', e);
            alert('Could not start voice recording. Please try again.');
        }
    }
}

function stopRecording() {
    if (recognition && isRecording) {
        isRecording = false;
        recognition.stop();
    }
}

function sendTranscription() {
    if (currentTranscript) {
        messageInput.value = currentTranscript;
        cancelRecording();
        // Trigger form submission
        chatForm.dispatchEvent(new Event('submit'));
    }
}

function cancelRecording() {
    stopRecording();
    voiceRecordingPanel.style.display = 'none';
    currentTranscript = '';
    transcriptionText.textContent = 'Speak now...';
    sendTranscriptionBtn.disabled = true;
}

function resetVoiceButton() {
    isRecording = false;
    voiceBtn.classList.remove('recording');
    voiceBtn.innerHTML = '<span class="voice-icon">🎤</span>';
    messageInput.placeholder = 'Ask about Shmiras HaLashon...';
}

// Live Chat Functions
let currentChatUser = null;
let communityUnsubscribe = null;
let privateUnsubscribe = null;

// Community Chat
function loadCommunityChat() {
    if (!currentUser) return;
    
    const messagesContainer = document.getElementById('communityMessages');
    
    // Unsubscribe from previous listener
    if (communityUnsubscribe) {
        communityUnsubscribe();
    }
    
    // Real-time listener for community messages
    const q = query(
        collection(db, 'communityChat'),
        orderBy('timestamp', 'desc'),
        limit(50)
    );
    
    communityUnsubscribe = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        // Reverse to show oldest first
        messages.reverse();
        
        // Keep welcome message and add new messages
        const welcomeMsg = messagesContainer.querySelector('.chat-welcome');
        messagesContainer.innerHTML = '';
        if (welcomeMsg) {
            messagesContainer.appendChild(welcomeMsg);
        }
        
        messages.forEach(msg => {
            addMessageToChat(msg, 'community');
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
    
    // Update online count
    updateOnlineCount();
}

// Enhanced Lashon Hara screening function
function screenForLashonHara(message) {
    const lashonHaraKeywords = [
        // Negative speech patterns - English
        'hate', 'stupid', 'idiot', 'dumb', 'loser', 'ugly', 'worthless', 'useless',
        'pathetic', 'disgusting', 'terrible person', 'horrible person', 'awful person', 
        'nasty', 'gross', 'fake', 'liar', 'evil', 'wicked', 'bad person',
        
        // Gossip indicators
        'did you hear', 'i heard that', 'rumor', 'apparently', 'they say',
        'someone told me', 'word on the street', 'between you and me',
        'don\'t tell anyone', 'keep this secret', 'guess what i heard',
        
        // Judgmental language
        'always fails', 'never succeeds', 'so bad at', 'worst', 'failure',
        'can\'t do anything', 'terrible at', 'incompetent', 'hopeless',
        
        // Insults
        'moron', 'fool', 'jerk', 'creep', 'scum', 'trash', 'garbage',
        'waste of', 'pathetic excuse', 'embarrassment', 'shame',
        
        // Mockery and belittling
        'what a joke', 'ridiculous', 'laughable', 'embarrassing',
        'makes fun of', 'mocking', 'laughing at',
        
        // Profanity placeholders
        'damn', 'hell', 'crap', 'suck', 'sucks',
        
        // Hebrew negative terms (common lashon hara words)
        'שונא', 'טיפש', 'מטומטם', 'גרוע', 'נורא', 'גרוע ביותר',
        'לא טוב', 'רע', 'רשע', 'שקרן', 'מזויף'
    ];
    
    const suspiciousPatterns = [
        // Patterns that often indicate gossip or negative speech
        /\b(he|she|they)\s+(is|are)\s+(so|such)\s+\w+/i,  // "she is so..."
        /\bcan't believe\s+(he|she|they)/i,  // "can't believe he..."
        /\bdid\s+you\s+(see|hear)\s+about/i,  // "did you hear about..."
        /\bi\s+hate\s+(him|her|them)/i,  // "I hate him/her/them"
        /\bwhat\s+a\s+(loser|idiot|fool)/i,  // "what a loser"
    ];
    
    const messageLower = message.toLowerCase();
    const messageNormalized = message.trim();
    
    // Check for keywords
    for (const keyword of lashonHaraKeywords) {
        if (messageLower.includes(keyword.toLowerCase())) {
            return {
                isProblematic: true,
                reason: 'negative_speech',
                keyword: keyword
            };
        }
    }
    
    // Check for suspicious patterns
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(message)) {
            return {
                isProblematic: true,
                reason: 'gossip_pattern',
                pattern: pattern.source
            };
        }
    }
    
    // Check for excessive caps (shouting/aggression)
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.6 && message.length > 10) {
        return {
            isProblematic: true,
            reason: 'aggressive_tone'
        };
    }
    
    // Check for multiple exclamation/question marks (aggressive tone)
    if (message.match(/[!?]{3,}/)) {
        return {
            isProblematic: true,
            reason: 'aggressive_punctuation'
        };
    }
    
    // Check for excessive negative emoji
    const negativeEmoji = ['😠', '😡', '🤬', '😤', '💢', '👎', '🖕'];
    const emojiCount = negativeEmoji.filter(emoji => message.includes(emoji)).length;
    if (emojiCount >= 2) {
        return {
            isProblematic: true,
            reason: 'negative_emoji'
        };
    }
    
    return { isProblematic: false };
}

// Show lashon hara warning modal
function showLashonHaraWarning() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('lashonHaraWarningModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'lashonHaraWarningModal';
        modal.className = 'lashon-hara-modal';
        modal.innerHTML = `
            <div class="lashon-hara-modal-content">
                <div class="lashon-hara-icon">🕊️⚠️</div>
                <h3>Lashon Hara Detected</h3>
                <p><strong>Please respect the laws of Lashon Hara in this chat!</strong></p>
                <div class="lashon-hara-reminder">
                    <p>This is a sacred space dedicated to positive speech and Torah learning.</p>
                    <p><em>"The tongue has the power of life and death" - Mishlei 18:21</em></p>
                    <ul>
                        <li>✓ Speak kindly about others</li>
                        <li>✓ Judge favorably (Dan L'Kaf Zechut)</li>
                        <li>✓ Share Torah insights and encouragement</li>
                        <li>✗ Avoid gossip, negativity, and criticism</li>
                    </ul>
                </div>
                <button id="lashonHaraOkBtn" class="lashon-hara-ok-btn">I Understand</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listener
        document.getElementById('lashonHaraOkBtn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    modal.style.display = 'flex';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        modal.style.display = 'none';
    }, 10000);
}

async function sendCommunityMessage() {
    const input = document.getElementById('communityMessageInput');
    const message = input.value.trim();
    
    if (!message || !currentUser) return;
    
    // Screen for lashon hara
    const screening = screenForLashonHara(message);
    if (screening.isProblematic) {
        // Show enhanced warning modal
        showLashonHaraWarning();
        
        // Log the attempt for review
        try {
            await addDoc(collection(db, 'moderationLog'), {
                userId: currentUser.id,
                userName: currentUser.name,
                message: message,
                reason: screening.reason,
                keyword: screening.keyword || null,
                timestamp: serverTimestamp(),
                action: 'blocked'
            });
        } catch (error) {
            console.error('Error logging blocked message:', error);
        }
        
        // Clear input
        input.value = '';
        return;
    }
    
    try {
        await addDoc(collection(db, 'communityChat'), {
            userId: currentUser.id,
            userName: currentUser.name,
            message: message,
            timestamp: serverTimestamp(),
            flagged: false,
            flagCount: 0
        });
        
        input.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
    }
}

async function updateOnlineCount() {
    try {
        // Update user's last seen
        await updateDoc(doc(db, 'users', currentUser.id), {
            lastSeen: serverTimestamp(),
            online: true
        });
        
        // Count online users (active in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const q = query(
            collection(db, 'users'),
            where('online', '==', true)
        );
        
        const snapshot = await getDocs(q);
        document.getElementById('onlineUsersCount').textContent = snapshot.size;
    } catch (error) {
        console.error('Error updating online count:', error);
    }
}

// Flag message function - Enhanced with review queue
async function flagMessage(messageId) {
    if (!currentUser) return;
    
    const confirmFlag = confirm('🚩 Flag this message?\n\nMessages flagged will be:\n• Immediately hidden from view\n• Sent to moderators for review\n• Deleted if confirmed inappropriate\n\nContinue?');
    if (!confirmFlag) return;
    
    try {
        const messageRef = doc(db, 'communityChat', messageId);
        const messageDoc = await getDoc(messageRef);
        
        if (!messageDoc.exists()) {
            alert('Message not found.');
            return;
        }
        
        const currentData = messageDoc.data();
        
        // Check if user already flagged this message
        const flaggedBy = currentData.flaggedBy || [];
        if (flaggedBy.includes(currentUser.id)) {
            alert('You have already flagged this message.');
            return;
        }
        
        const newFlagCount = (currentData.flagCount || 0) + 1;
        
        // Auto-delete if 2 or more flags (lowered threshold for quick action)
        if (newFlagCount >= 2) {
            // Move to review queue before deletion
            await addDoc(collection(db, 'flaggedMessages'), {
                originalId: messageId,
                userId: currentData.userId,
                userName: currentData.userName,
                message: currentData.message,
                timestamp: currentData.timestamp,
                flagCount: newFlagCount,
                flaggedBy: [...flaggedBy, currentUser.id],
                deletedAt: serverTimestamp(),
                status: 'auto-deleted',
                reviewed: false
            });
            
            // Delete the message
            await deleteDoc(messageRef);
            
            alert('⚠️ Message removed!\n\nThis message has been:\n✓ Automatically deleted due to multiple flags\n✓ Sent to moderators for review\n✓ May be restored if deemed appropriate');
        } else {
            // Update flag count and hide message
            await updateDoc(messageRef, {
                flagged: true,
                flagCount: newFlagCount,
                flaggedBy: [...flaggedBy, currentUser.id],
                hidden: true,
                flaggedAt: serverTimestamp()
            });
            
            // Add to moderation queue for review
            await addDoc(collection(db, 'moderationQueue'), {
                messageId: messageId,
                userId: currentData.userId,
                userName: currentData.userName,
                message: currentData.message,
                timestamp: currentData.timestamp,
                flagCount: newFlagCount,
                flaggedBy: [...flaggedBy, currentUser.id],
                status: 'pending_review',
                createdAt: serverTimestamp()
            });
            
            alert(`✓ Message flagged and hidden!\n\nFlag count: ${newFlagCount}/2\nThe message has been hidden from view and sent for moderator review.`);
        }
    } catch (error) {
        console.error('Error flagging message:', error);
        alert('Failed to flag message. Please try again.');
    }
}

// Make flagMessage global so it can be called from onclick
window.flagMessage = flagMessage;


// Private Messages
let allUsers = [];

async function loadPrivateMessages() {
    if (!currentUser) return;
    
    try {
        // Load all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        allUsers = [];
        usersSnapshot.forEach((doc) => {
            const userData = { id: doc.id, ...doc.data() };
            if (userData.id !== currentUser.id) {
                allUsers.push(userData);
            }
        });
        
        displayUsersList(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsersList(users) {
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="empty-state">No users found</div>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="user-item" data-user-id="${user.id}" onclick="selectUser('${user.id}', '${user.name || user.email}')">
            <div class="user-avatar">${(user.name || user.email)[0].toUpperCase()}</div>
            <div class="user-info">
                <div class="user-name">${user.name || user.email}</div>
                <div class="user-status">${user.online ? '🟢 Online' : 'Offline'}</div>
            </div>
        </div>
    `).join('');
}

window.selectUser = async function(userId, userName) {
    currentChatUser = { id: userId, name: userName };
    
    // Update UI
    document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-user-id="${userId}"]`)?.classList.add('active');
    
    document.getElementById('privateChatHeader').innerHTML = `
        <div class="user-name">💬 Chat with ${userName}</div>
    `;
    document.getElementById('privateMessageInput').style.display = 'flex';
    
    // Load conversation
    loadPrivateConversation(userId);
};

function loadPrivateConversation(otherUserId) {
    const messagesContainer = document.getElementById('privateMessages');
    
    // Unsubscribe from previous listener
    if (privateUnsubscribe) {
        privateUnsubscribe();
    }
    
    // Create conversation ID (sorted user IDs to ensure consistency)
    const conversationId = [currentUser.id, otherUserId].sort().join('_');
    
    // Real-time listener
    const q = query(
        collection(db, 'privateMessages', conversationId, 'messages'),
        orderBy('timestamp', 'asc')
    );
    
    privateUnsubscribe = onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = '';
        
        if (snapshot.empty) {
            messagesContainer.innerHTML = '<div class="empty-state">No messages yet. Start the conversation!</div>';
            return;
        }
        
        snapshot.forEach((doc) => {
            const msg = { id: doc.id, ...doc.data() };
            addMessageToChat(msg, 'private');
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

async function sendPrivateMessage() {
    const input = document.getElementById('privateMessageTextInput');
    const message = input.value.trim();
    
    if (!message || !currentUser || !currentChatUser) return;
    
    try {
        const conversationId = [currentUser.id, currentChatUser.id].sort().join('_');
        
        await addDoc(collection(db, 'privateMessages', conversationId, 'messages'), {
            senderId: currentUser.id,
            senderName: currentUser.name,
            receiverId: currentChatUser.id,
            message: message,
            timestamp: serverTimestamp()
        });
        
        input.value = '';
    } catch (error) {
        console.error('Error sending private message:', error);
        alert('Failed to send message');
    }
}

function filterUsers(searchTerm) {
    const filtered = allUsers.filter(user => 
        (user.name || user.email).toLowerCase().includes(searchTerm.toLowerCase())
    );
    displayUsersList(filtered);
}

function addMessageToChat(msg, type) {
    const container = type === 'community' ? 
        document.getElementById('communityMessages') : 
        document.getElementById('privateMessages');
    
    // Don't display hidden/flagged messages to regular users
    if (msg.hidden && msg.userId !== currentUser.id) {
        return;
    }
    
    const isOwnMessage = msg.userId === currentUser.id || msg.senderId === currentUser.id;
    const messageClass = isOwnMessage ? 'own-message' : 'other-message';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${messageClass}`;
    messageDiv.dataset.messageId = msg.id;
    
    const time = msg.timestamp?.toDate ? 
        msg.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
        'Just now';
    
    // Check if message is flagged
    const flaggedClass = msg.flagged ? ' flagged-message' : '';
    const flagCountText = msg.flagCount > 0 ? ` <span class="flag-count" title="This message has been flagged">🚩${msg.flagCount}</span>` : '';
    
    // Add flag button for community messages (only for other people's messages)
    const flagButton = type === 'community' && !isOwnMessage ? 
        `<button class="flag-btn" onclick="flagMessage('${msg.id}')" title="Flag inappropriate content">🚩 Report</button>` : '';
    
    // Show hidden notice if it's the user's own flagged message
    const hiddenNotice = msg.hidden && isOwnMessage ? 
        `<div class="message-hidden-notice">⚠️ This message is under review</div>` : '';
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${msg.userName || msg.senderName || 'User'}</span>
            <span class="message-time">${time}${flagCountText}</span>
            ${flagButton}
        </div>
        <div class="message-text${flaggedClass}">${escapeHtml(msg.message)}</div>
        ${hiddenNotice}
    `;
    
    container.appendChild(messageDiv);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Study Partners
async function loadStudyPartners() {
    if (!currentUser) return;
    
    try {
        // Load user's profile
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        const userData = userDoc.data();
        
        if (userData?.studyProfile) {
            document.getElementById('studyTimePreference').value = userData.studyProfile.time || '';
            document.getElementById('studyLevel').value = userData.studyProfile.level || '';
            document.getElementById('languagePreference').value = userData.studyProfile.language || 'english';
            document.getElementById('studyBio').value = userData.studyProfile.bio || '';
        }
        
        // Load available partners
        loadAvailablePartners();
    } catch (error) {
        console.error('Error loading study partners:', error);
    }
}

async function saveStudyProfile() {
    if (!currentUser) return;
    
    const profile = {
        time: document.getElementById('studyTimePreference').value,
        level: document.getElementById('studyLevel').value,
        language: document.getElementById('languagePreference').value,
        bio: document.getElementById('studyBio').value,
        active: true,
        lastUpdated: new Date().toISOString()
    };
    
    if (!profile.time || !profile.level) {
        alert('Please select your study time and level');
        return;
    }
    
    try {
        await updateDoc(doc(db, 'users', currentUser.id), {
            studyProfile: profile
        });
        
        alert('✓ Profile saved! You can now see potential study partners.');
        loadAvailablePartners();
    } catch (error) {
        console.error('Error saving study profile:', error);
        alert('Failed to save profile');
    }
}

async function loadAvailablePartners() {
    try {
        const q = query(
            collection(db, 'users'),
            where('studyProfile.active', '==', true)
        );
        
        const snapshot = await getDocs(q);
        const partners = [];
        
        snapshot.forEach((doc) => {
            const partner = { id: doc.id, ...doc.data() };
            if (partner.id !== currentUser.id && partner.studyProfile) {
                partners.push(partner);
            }
        });
        
        displayPartners(partners);
    } catch (error) {
        console.error('Error loading partners:', error);
        document.getElementById('partnersList').innerHTML = 
            '<div class="empty-state">Error loading partners</div>';
    }
}

function displayPartners(partners) {
    const partnersList = document.getElementById('partnersList');
    
    if (partners.length === 0) {
        partnersList.innerHTML = '<div class="empty-state">No study partners available yet. Check back soon!</div>';
        return;
    }
    
    partnersList.innerHTML = partners.map(partner => {
        const profile = partner.studyProfile;
        const timeEmoji = profile.time === 'morning' ? '🌅' : profile.time === 'afternoon' ? '☀️' : profile.time === 'evening' ? '🌙' : '🕐';
        
        return `
            <div class="partner-card">
                <div class="partner-card-header">
                    <div class="user-avatar">${(partner.name || partner.email)[0].toUpperCase()}</div>
                    <div class="partner-name">${partner.name || partner.email}</div>
                </div>
                <div class="partner-details">
                    <div class="partner-detail">
                        ${timeEmoji} ${profile.time.charAt(0).toUpperCase() + profile.time.slice(1)}
                    </div>
                    <div class="partner-detail">
                        📚 ${profile.level.charAt(0).toUpperCase() + profile.level.slice(1)}
                    </div>
                    <div class="partner-detail">
                        🌐 ${profile.language.charAt(0).toUpperCase() + profile.language.slice(1)}
                    </div>
                </div>
                ${profile.bio ? `<div class="partner-bio">"${profile.bio}"</div>` : ''}
                <button class="connect-partner-btn" onclick="connectWithPartner('${partner.id}', '${partner.name || partner.email}')">
                    🤝 Connect
                </button>
            </div>
        `;
    }).join('');
}

window.connectWithPartner = function(partnerId, partnerName) {
    // Switch to private messages and open chat with this partner
    document.querySelector('[data-mode="private"]').click();
    setTimeout(() => {
        window.selectUser(partnerId, partnerName);
    }, 100);
};
