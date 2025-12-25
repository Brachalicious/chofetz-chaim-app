import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, limit } from './firebase-config.js';
import { initDailyLessons } from './daily-lessons.js';
import { switchLanguage, updateUILanguage, currentLanguage } from './translations.js';

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
const dailyMessage = document.getElementById('dailyMessage');
const userName = document.getElementById('userName');
const userDropdown = document.getElementById('userDropdown');
const chatView = document.getElementById('chatView');
const dashboardView = document.getElementById('dashboardView');

// Voice recognition
let recognition = null;
let isRecording = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize language
    updateUILanguage();
    updateLanguageButtons();
    
    setupEventListeners();
    loadDailyEncouragement();
    initDailyLessons();
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
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
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await login(email, password);
    });

    // Signup form
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
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

    // Quick questions
    document.querySelectorAll('.quick-q').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const question = e.target.dataset.q;
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
            } else if (mode === 'private') {
                document.getElementById('privateMessagesRoom').classList.add('active');
                loadPrivateMessages();
            } else if (mode === 'partners') {
                document.getElementById('studyPartnersRoom').classList.add('active');
                loadStudyPartners();
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
    const logText = logInput.value.trim();
    
    if (!logText) {
        alert('Please enter what you learned');
        return;
    }
    
    if (!currentUser) return;
    
    try {
        const logEntry = {
            userId: currentUser.id,
            content: logText,
            timestamp: serverTimestamp(),
            createdAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, 'learningLogs'), logEntry);
        
        logInput.value = '';
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
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle showing the app
    } catch (error) {
        console.error('Login error:', error);
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
        
        // Add bot response
        addMessage('bot', data.response || data.fallback);
        
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

function addMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (type === 'user') {
        avatar.textContent = '👤';
    } else {
        const img = document.createElement('img');
        img.src = '/chofetz_chaim.svg';
        img.alt = 'Chofetz Chaim';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        avatar.appendChild(img);
    }
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    // Add playback button for bot responses
    if (type === 'bot') {
        const playbackBtn = document.createElement('button');
        playbackBtn.className = 'playback-btn';
        playbackBtn.innerHTML = '🔊 Listen';
        playbackBtn.setAttribute('aria-label', 'Listen to response');
        playbackBtn.onclick = () => playMessage(text, playbackBtn);
        messageDiv.appendChild(playbackBtn);
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
    avatar.className = 'message-avatar';
    const img = document.createElement('img');
    img.src = '/chofetz_chaim.svg';
    img.alt = 'Chofetz Chaim';
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
        voiceBtn.style.display = 'none';
        return;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isRecording = true;
        voiceBtn.classList.add('recording');
        voiceBtn.innerHTML = '<span class="voice-icon recording-pulse">🔴</span>';
        messageInput.placeholder = 'Listening...';
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        messageInput.focus();
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        resetVoiceButton();
        if (event.error === 'no-speech') {
            messageInput.placeholder = 'No speech detected. Try again...';
        } else {
            messageInput.placeholder = 'Error recording. Please try again...';
        }
        setTimeout(() => {
            messageInput.placeholder = 'Ask about Shmiras HaLashon...';
        }, 2000);
    };
    
    recognition.onend = () => {
        resetVoiceButton();
    };
}

function toggleVoiceRecording() {
    if (!recognition) {
        initVoiceRecognition();
    }
    
    if (!recognition) {
        alert('Voice recording is not supported in your browser. Please type your question instead.');
        return;
    }
    
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
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

async function sendCommunityMessage() {
    const input = document.getElementById('communityMessageInput');
    const message = input.value.trim();
    
    if (!message || !currentUser) return;
    
    try {
        await addDoc(collection(db, 'communityChat'), {
            userId: currentUser.id,
            userName: currentUser.name,
            message: message,
            timestamp: serverTimestamp()
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
    
    const isOwnMessage = msg.userId === currentUser.id || msg.senderId === currentUser.id;
    const messageClass = isOwnMessage ? 'own-message' : 'other-message';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${messageClass}`;
    
    const time = msg.timestamp?.toDate ? 
        msg.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
        'Just now';
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${msg.userName || msg.senderName || 'User'}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${escapeHtml(msg.message)}</div>
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
