import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, limit } from './firebase-config.js?v=20260426c';
import { initDailyLessons } from './daily-lessons.js?v=20260426c';
import { initGoals } from './goals.js?v=20260426c';
import { t, switchLanguage, updateUILanguage, currentLanguage } from './translations.js?v=20260426c';
import { initVideoStreaming } from './video-streaming.js?v=20260426c';
import { initChizukVideos } from './chizuk-videos.js?v=20260426c';

// State management
let currentUser = null;

/** Local-only profile when not signed in (missions, timer, weekly goal, guest logs) */
const GUEST_STORAGE_ID = 'guest';

function getStorageUserId() {
    return currentUser ? currentUser.id : GUEST_STORAGE_ID;
}
let conversations = [];
let currentConversation = [];
let focusTimerInterval = null;
const weeklyGoalTarget = 500;
const dailyMissions = [
    {
        title: { en: 'Pause before your first hard response today.', he: 'עצרו לפני התגובה הקשה הראשונה שלכם היום.' },
        description: { en: 'When tension rises, take one deep breath and answer with calm words.', he: 'כשעולה מתח, קחו נשימה עמוקה וענו במילים רגועות.' }
    },
    {
        title: { en: 'Practice dan l\'kaf zechut one time.', he: 'תרגלו דין לכף זכות פעם אחת היום.' },
        description: { en: 'Reframe one frustrating moment by judging the other person favorably.', he: 'קחו רגע מתסכל אחד ונסו לראות את הצד הטוב של האחר.' }
    },
    {
        title: { en: 'Replace one complaint with gratitude.', he: 'החליפו תלונה אחת בהכרת הטוב.' },
        description: { en: 'Turn one negative sentence into a sentence of thanks.', he: 'הפכו משפט שלילי אחד למשפט של הודיה.' }
    },
    {
        title: { en: 'Guard a private detail someone shared with you.', he: 'שמרו סוד אישי שמישהו שיתף אתכם.' },
        description: { en: 'Choose trust over sharing, even if the story feels interesting.', he: 'בחרו באמון במקום שיתוף, גם אם הסיפור מעניין.' }
    },
    {
        title: { en: 'Speak encouragement to one person today.', he: 'אמרו מילות חיזוק לאדם אחד היום.' },
        description: { en: 'Offer sincere positive words that strengthen someone else.', he: 'תנו מילים כנות וחיוביות שמחזקות אדם אחר.' }
    }
];

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
    initLogoAssistant();
    initGoals();
    
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
            showGuestApp();
        }
    });

    document.getElementById('openSignInBtn').addEventListener('click', () => openAuthModal('login'));
    document.getElementById('openSignUpBtn').addEventListener('click', () => openAuthModal('signup'));
    document.getElementById('closeAuthModal').addEventListener('click', () => closeAuthModal());
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
    });
});

// Check if user is logged in
function checkAuth() {
    // Auth is now handled by onAuthStateChanged listener
    return;
}

function openAuthModal(tab = 'login') {
    authModal.classList.remove('hidden');
    switchAuthTab(tab);
}

function closeAuthModal() {
    authModal.classList.add('hidden');
    hideError();
}

function setHeaderAuthMode(loggedIn) {
    const guestBar = document.getElementById('guestAuthBar');
    const userWrap = document.getElementById('userMenuWrapper');
    if (guestBar) guestBar.classList.toggle('hidden', loggedIn);
    if (userWrap) userWrap.classList.toggle('hidden', !loggedIn);
}

function showGuestApp() {
    stopFocusTimer();
    closeAuthModal();
    appContainer.classList.remove('hidden');
    setHeaderAuthMode(false);
    loadGuestLocalData();
    initEpicExperience();
}

function showApp() {
    closeAuthModal();
    appContainer.classList.remove('hidden');
    setHeaderAuthMode(true);
    userName.textContent = currentUser.name;
    initEpicExperience();
    loadUserData();
}

function loadGuestLocalData() {
    try {
        conversations = JSON.parse(localStorage.getItem('guestConversations') || '[]');
    } catch (error) {
        conversations = [];
    }
    currentConversation = [];
    loadCompletedLessons();
    loadLearningLogs();
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
    document.getElementById('dedicationBtn').addEventListener('click', () => {
        window.location.href = '/dedication.html';
    });
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
    const completeMissionBtn = document.getElementById('completeMissionBtn');
    if (completeMissionBtn) {
        completeMissionBtn.addEventListener('click', completeDailyMission);
    }
    const refreshMissionBtn = document.getElementById('refreshMissionBtn');
    if (refreshMissionBtn) {
        refreshMissionBtn.addEventListener('click', () => setDailyMission(true));
    }
    const saveReflectionBtn = document.getElementById('saveReflectionBtn');
    if (saveReflectionBtn) {
        saveReflectionBtn.addEventListener('click', saveMissionReflection);
    }
    const shareMissionWhatsAppBtn = document.getElementById('shareMissionWhatsAppBtn');
    if (shareMissionWhatsAppBtn) {
        shareMissionWhatsAppBtn.addEventListener('click', () => shareDailyMission('whatsapp'));
    }
    const shareMissionEmailBtn = document.getElementById('shareMissionEmailBtn');
    if (shareMissionEmailBtn) {
        shareMissionEmailBtn.addEventListener('click', () => shareDailyMission('email'));
    }
    const shareMissionTextBtn = document.getElementById('shareMissionTextBtn');
    if (shareMissionTextBtn) {
        shareMissionTextBtn.addEventListener('click', () => shareDailyMission('text'));
    }
    const analyzeSpeechBtn = document.getElementById('analyzeSpeechBtn');
    if (analyzeSpeechBtn) {
        analyzeSpeechBtn.addEventListener('click', analyzeSpeechLabInput);
    }
    const copyRewriteBtn = document.getElementById('copyRewriteBtn');
    if (copyRewriteBtn) {
        copyRewriteBtn.addEventListener('click', copySpeechRewrite);
    }
    const sendRewriteToCommunityBtn = document.getElementById('sendRewriteToCommunityBtn');
    if (sendRewriteToCommunityBtn) {
        sendRewriteToCommunityBtn.addEventListener('click', sendSpeechRewriteToCommunity);
    }
    const shareRewriteWhatsAppBtn = document.getElementById('shareRewriteWhatsAppBtn');
    if (shareRewriteWhatsAppBtn) {
        shareRewriteWhatsAppBtn.addEventListener('click', () => shareSpeechRewrite('whatsapp'));
    }
    const shareRewriteEmailBtn = document.getElementById('shareRewriteEmailBtn');
    if (shareRewriteEmailBtn) {
        shareRewriteEmailBtn.addEventListener('click', () => shareSpeechRewrite('email'));
    }
    const shareRewriteTextBtn = document.getElementById('shareRewriteTextBtn');
    if (shareRewriteTextBtn) {
        shareRewriteTextBtn.addEventListener('click', () => shareSpeechRewrite('text'));
    }

    const shareInput = document.getElementById('shareInput');
    if (shareInput) {
        shareInput.addEventListener('input', (e) => {
            document.getElementById('charCount').textContent = e.target.value.length;
        });
    }

    document.querySelectorAll('.prompt-chip').forEach((chip) => {
        chip.addEventListener('click', (event) => {
            if (!shareInput) return;
            const prompt = currentLanguage === 'he'
                ? event.currentTarget.dataset.promptHe
                : event.currentTarget.dataset.promptEn;
            if (!prompt) return;
            shareInput.value = prompt;
            document.getElementById('charCount').textContent = prompt.length;
            shareInput.focus();
        });
    });

    const shareTwitterBtn = document.getElementById('shareTwitterBtn');
    if (shareTwitterBtn) shareTwitterBtn.addEventListener('click', () => shareProgress('twitter'));
    const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
    if (shareWhatsAppBtn) shareWhatsAppBtn.addEventListener('click', () => shareProgress('whatsapp'));
    const shareEmailBtn = document.getElementById('shareEmailBtn');
    if (shareEmailBtn) shareEmailBtn.addEventListener('click', () => shareProgress('email'));
    const shareTextBtn = document.getElementById('shareTextBtn');
    if (shareTextBtn) shareTextBtn.addEventListener('click', () => shareProgress('text'));
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) copyLinkBtn.addEventListener('click', copyProgressShareText);
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportUserData);
    const focusStartPauseBtn = document.getElementById('focusStartPauseBtn');
    if (focusStartPauseBtn) focusStartPauseBtn.addEventListener('click', toggleFocusTimer);
    const focusResetBtn = document.getElementById('focusResetBtn');
    if (focusResetBtn) focusResetBtn.addEventListener('click', resetFocusTimerToday);
    const focusExpandBtn = document.getElementById('focusExpandBtn');
    if (focusExpandBtn) focusExpandBtn.addEventListener('click', expandFocusGoal);
    const shareFocusWhatsAppBtn = document.getElementById('shareFocusWhatsAppBtn');
    if (shareFocusWhatsAppBtn) shareFocusWhatsAppBtn.addEventListener('click', () => shareFocusTimer('whatsapp'));
    const shareFocusEmailBtn = document.getElementById('shareFocusEmailBtn');
    if (shareFocusEmailBtn) shareFocusEmailBtn.addEventListener('click', () => shareFocusTimer('email'));
    const shareFocusTextBtn = document.getElementById('shareFocusTextBtn');
    if (shareFocusTextBtn) shareFocusTextBtn.addEventListener('click', () => shareFocusTimer('text'));
    const saveBuddyBtn = document.getElementById('saveBuddyBtn');
    if (saveBuddyBtn) saveBuddyBtn.addEventListener('click', saveBuddyProfile);
    const sendBuddyNudgeBtn = document.getElementById('sendBuddyNudgeBtn');
    if (sendBuddyNudgeBtn) sendBuddyNudgeBtn.addEventListener('click', () => sendBuddyMotivation('whatsapp'));
    const copyBuddyMessageBtn = document.getElementById('copyBuddyMessageBtn');
    if (copyBuddyMessageBtn) copyBuddyMessageBtn.addEventListener('click', copyBuddyMotivationMessage);

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
    document.addEventListener('languageChanged', () => {
        setDailyMission(false);
        updateWeeklyGoalProgress();
        updateMiddosMap();
        renderSpeechLabLastResult();
        renderFocusTimerState();
    });
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
    
    if (!currentUser) {
        try {
            const logs = JSON.parse(localStorage.getItem('guestLearningLogs') || '[]');
            logs.unshift({
                id: 'g_' + Date.now(),
                content: finalLogText,
                sefariaSection: selectedSection || null,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('guestLearningLogs', JSON.stringify(logs));
            logInput.value = '';
            if (sefariaSection) sefariaSection.value = '';
            loadLearningLogs();
            updateMiddosMap();
            alert(t('guestSavedLocally'));
        } catch (error) {
            console.error('Error saving guest learning log:', error);
            alert('Failed to save. Please try again.');
        }
        return;
    }
    
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
    const logsList = document.getElementById('learningLogList');
    if (!logsList) return;

    if (!currentUser) {
        let logs = [];
        try {
            logs = JSON.parse(localStorage.getItem('guestLearningLogs') || '[]');
        } catch (error) {
            logs = [];
        }
        if (logs.length === 0) {
            logsList.innerHTML = `<p class="empty-state">${currentLanguage === 'he' ? 'רשומות הלמידה שלך יופיעו כאן' : 'Your learning entries will appear here'}</p>`;
            return;
        }
        logsList.innerHTML = '';
        logs.forEach((log) => {
            logsList.appendChild(createGuestLogElement(log));
        });
        return;
    }
    
    try {
        const logsQuery = query(
            collection(db, 'learningLogs'),
            where('userId', '==', currentUser.id),
            orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(logsQuery);
        
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

function createGuestLogElement(log) {
    const div = document.createElement('div');
    div.className = 'log-entry';

    const date = log.createdAt
        ? new Date(log.createdAt).toLocaleDateString(currentLanguage === 'he' ? 'he-IL' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Just now';

    div.innerHTML = `
        <div class="log-entry-header">
            <span class="log-entry-date">📅 ${date}</span>
            <button class="log-entry-delete" data-guest-log-id="${log.id}" type="button">🗑️</button>
        </div>
        <div class="log-entry-content">${escapeHtml(log.content || '')}</div>
    `;

    div.querySelector('.log-entry-delete').addEventListener('click', async () => {
        if (!confirm(currentLanguage === 'he' ? 'למחוק רשומה זו?' : 'Delete this learning log entry?')) return;
        let logs = JSON.parse(localStorage.getItem('guestLearningLogs') || '[]');
        logs = logs.filter((l) => l.id !== log.id);
        localStorage.setItem('guestLearningLogs', JSON.stringify(logs));
        loadLearningLogs();
    });

    return div;
}

// Load and display completed lessons
async function loadCompletedLessons() {
    if (!currentUser) {
        let completedLessons = [];
        try {
            completedLessons = JSON.parse(localStorage.getItem('guestCompletedLessons') || '[]');
        } catch (error) {
            completedLessons = [];
        }
        const lessonsEl = document.getElementById('lessonsLearned');
        if (lessonsEl) lessonsEl.textContent = completedLessons.length;
        const completedList = document.getElementById('completedLessonsList');
        if (!completedList) return;
        if (completedLessons.length === 0) {
            completedList.innerHTML = '<p class="empty-state">Complete lessons to see them here!</p>';
            return;
        }
        const sortedLessons = [...completedLessons].sort((a, b) => a - b);
        completedList.innerHTML = sortedLessons.map(day => `
            <div class="completed-lesson-badge">
                <div class="day-number">✓</div>
                <div class="day-label">Day ${day}</div>
            </div>
        `).join('');
        updateMiddosMap();
        return;
    }
    
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
        updateMiddosMap();
        
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
    if (!currentUser) {
        alert(t('signInToPost'));
        return;
    }
    
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
        updateWeeklyGoalProgress(1);
        updateMiddosMap();
        
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

function getMissionStorageKey() {
    return `missionState_${getStorageUserId()}`;
}

function initEpicExperience() {
    setDailyMission(false);
    updateWeeklyGoalProgress();
    updateMiddosMap();
    renderFocusTimerState();
    renderBuddyState();
}

function getFocusTimerKey() {
    return `focusTimer_${getStorageUserId()}`;
}

function getBuddyKey() {
    return `focusBuddy_${getStorageUserId()}`;
}

function getDefaultFocusTimerState() {
    return {
        date: new Date().toDateString(),
        targetMinutes: 60,
        elapsedSeconds: 0,
        completedToday: false,
        completedDays: 0,
        expansions: 0
    };
}

function loadFocusTimerState() {
    const key = getFocusTimerKey();
    if (!key) return getDefaultFocusTimerState();

    let state = null;
    try {
        state = JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {
        state = null;
    }
    if (!state) state = getDefaultFocusTimerState();

    const today = new Date().toDateString();
    if (state.date !== today) {
        state.date = today;
        state.elapsedSeconds = 0;
        state.completedToday = false;
    }
    return state;
}

function saveFocusTimerState(state) {
    const key = getFocusTimerKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(state));
}

function formatDuration(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function getExpandRequirement(expansions) {
    return (expansions + 1) * 3;
}

function renderFocusTimerState() {
    const state = loadFocusTimerState();
    saveFocusTimerState(state);

    const targetEl = document.getElementById('focusTargetText');
    const elapsedEl = document.getElementById('focusElapsedText');
    const completedDaysEl = document.getElementById('focusCompletedDaysText');
    const statusEl = document.getElementById('focusTimerStatus');
    const startPauseBtn = document.getElementById('focusStartPauseBtn');
    const expandBtn = document.getElementById('focusExpandBtn');
    if (!targetEl || !elapsedEl || !completedDaysEl || !statusEl || !startPauseBtn || !expandBtn) return;

    targetEl.textContent = `${state.targetMinutes} ${currentLanguage === 'he' ? 'דקות' : 'min'}`;
    elapsedEl.textContent = formatDuration(state.elapsedSeconds);
    completedDaysEl.textContent = String(state.completedDays);
    startPauseBtn.textContent = focusTimerInterval ? t('focusPauseBtn') : t('focusStartBtn');

    const requirement = getExpandRequirement(state.expansions);
    const canExpand = state.completedDays >= requirement && state.targetMinutes < 180;
    expandBtn.disabled = !canExpand;

    if (state.targetMinutes >= 180) {
        statusEl.textContent = currentLanguage === 'he'
            ? 'הגעת ליעד המקסימלי של 180 דקות ליום. כל הכבוד!'
            : 'You reached the max daily goal of 180 minutes. Incredible consistency!';
    } else if (canExpand) {
        statusEl.textContent = currentLanguage === 'he'
            ? 'פתחת הרחבה! אפשר להגדיל את היעד היומי ב-15 דקות.'
            : 'Expansion unlocked! You can increase the daily goal by 15 minutes.';
    } else {
        const remaining = Math.max(0, requirement - state.completedDays);
        statusEl.textContent = currentLanguage === 'he'
            ? `השלימו עוד ${remaining} ימים כדי לפתוח הרחבה של 15 דקות.`
            : `Complete ${remaining} more days to unlock a +15 minute expansion.`;
    }
}

function stopFocusTimer() {
    if (focusTimerInterval) {
        clearInterval(focusTimerInterval);
        focusTimerInterval = null;
    }
}

function toggleFocusTimer() {
    if (focusTimerInterval) {
        stopFocusTimer();
        renderFocusTimerState();
        return;
    }

    focusTimerInterval = setInterval(() => {
        const state = loadFocusTimerState();
        state.elapsedSeconds += 1;

        if (!state.completedToday && state.elapsedSeconds >= state.targetMinutes * 60) {
            state.completedToday = true;
            state.completedDays += 1;
            updateWeeklyGoalProgress(1);
        }

        saveFocusTimerState(state);
        renderFocusTimerState();
    }, 1000);

    renderFocusTimerState();
}

function resetFocusTimerToday() {
    const state = loadFocusTimerState();
    state.elapsedSeconds = 0;
    state.completedToday = false;
    saveFocusTimerState(state);
    stopFocusTimer();
    renderFocusTimerState();
}

function expandFocusGoal() {
    const state = loadFocusTimerState();
    const requirement = getExpandRequirement(state.expansions);
    if (state.completedDays < requirement || state.targetMinutes >= 180) {
        return;
    }
    state.targetMinutes = Math.min(180, state.targetMinutes + 15);
    state.expansions += 1;
    saveFocusTimerState(state);
    renderFocusTimerState();
}

function loadBuddyState() {
    try {
        return JSON.parse(localStorage.getItem(getBuddyKey()) || 'null') || { name: '', contact: '' };
    } catch (error) {
        return { name: '', contact: '' };
    }
}

function renderBuddyState() {
    const buddy = loadBuddyState();
    const nameInput = document.getElementById('buddyNameInput');
    const contactInput = document.getElementById('buddyContactInput');
    if (nameInput) nameInput.value = buddy.name || '';
    if (contactInput) contactInput.value = buddy.contact || '';
}

function saveBuddyProfile() {
    const nameInput = document.getElementById('buddyNameInput');
    const contactInput = document.getElementById('buddyContactInput');
    const statusEl = document.getElementById('buddyStatus');
    if (!nameInput || !contactInput) return;

    const buddy = {
        name: nameInput.value.trim(),
        contact: contactInput.value.trim()
    };

    localStorage.setItem(getBuddyKey(), JSON.stringify(buddy));
    if (statusEl) statusEl.textContent = t('buddySaved');
}

function getFocusShareMessage() {
    const state = loadFocusTimerState();
    const completion = state.completedToday
        ? (currentLanguage === 'he' ? '✅ היעד היומי הושלם' : '✅ Daily goal completed')
        : (currentLanguage === 'he' ? '🕊️ עדיין בתהליך' : '🕊️ Still in progress');

    return currentLanguage === 'he'
        ? `טיימר שמירת הלשון שלי:\nיעד יומי: ${state.targetMinutes} דקות\nזמן היום: ${formatDuration(state.elapsedSeconds)}\nימים שהושלמו: ${state.completedDays}\n${completion}`
        : `My Shmiras HaLashon focus timer:\nDaily goal: ${state.targetMinutes} minutes\nToday's time: ${formatDuration(state.elapsedSeconds)}\nCompleted days: ${state.completedDays}\n${completion}`;
}

function shareFocusTimer(channel) {
    const message = getFocusShareMessage();
    const encoded = encodeURIComponent(message);
    if (channel === 'whatsapp') window.open(`https://wa.me/?text=${encoded}`, '_blank');
    if (channel === 'email') window.location.href = `mailto:?subject=${encodeURIComponent(currentLanguage === 'he' ? 'טיימר שמירת הלשון שלי' : 'My Shmiras HaLashon Focus Timer')}&body=${encoded}`;
    if (channel === 'text') window.location.href = `sms:?&body=${encoded}`;
}

function getBuddyMotivationMessage() {
    const buddy = loadBuddyState();
    const state = loadFocusTimerState();
    const buddyName = buddy.name || (currentLanguage === 'he' ? 'חבר יקר' : 'my friend');
    return currentLanguage === 'he'
        ? `${buddyName}, בוא/י נתחזק יחד בשמירת הלשון היום! אני כרגע על ${formatDuration(state.elapsedSeconds)} מתוך יעד יומי של ${state.targetMinutes} דקות.`
        : `${buddyName}, let's keep each other strong in Shmiras HaLashon today! I am currently at ${formatDuration(state.elapsedSeconds)} toward a ${state.targetMinutes}-minute daily goal.`;
}

function sendBuddyMotivation(channel = 'whatsapp') {
    const buddy = loadBuddyState();
    const statusEl = document.getElementById('buddyStatus');
    if (!buddy.name) {
        if (statusEl) statusEl.textContent = t('buddyNeedName');
        return;
    }
    const message = getBuddyMotivationMessage();
    const encoded = encodeURIComponent(message);
    if (channel === 'whatsapp') window.open(`https://wa.me/?text=${encoded}`, '_blank');
    if (channel === 'email') window.location.href = `mailto:?subject=${encodeURIComponent(currentLanguage === 'he' ? 'עידוד לשמירת הלשון' : 'Shmiras HaLashon motivation')}&body=${encoded}`;
    if (channel === 'text') window.location.href = `sms:?&body=${encoded}`;
}

async function copyBuddyMotivationMessage() {
    const statusEl = document.getElementById('buddyStatus');
    const buddy = loadBuddyState();
    if (!buddy.name) {
        if (statusEl) statusEl.textContent = t('buddyNeedName');
        return;
    }
    try {
        await navigator.clipboard.writeText(getBuddyMotivationMessage());
        if (statusEl) statusEl.textContent = t('buddyMessageCopied');
    } catch (error) {
        if (statusEl) statusEl.textContent = currentLanguage === 'he' ? 'שגיאה בהעתקה.' : 'Copy failed.';
    }
}

function setDailyMission(forceNew = false) {
    const key = getMissionStorageKey();

    const today = new Date().toDateString();
    let missionState = null;

    try {
        missionState = JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {
        missionState = null;
    }

    if (!missionState || missionState.date !== today || forceNew) {
        const mission = dailyMissions[Math.floor(Math.random() * dailyMissions.length)];
        missionState = {
            date: today,
            title: mission.title,
            description: mission.description,
            completed: false,
            reflection: ''
        };
        localStorage.setItem(key, JSON.stringify(missionState));
    }

    renderMissionState(missionState);
}

function renderMissionState(missionState) {
    const titleEl = document.getElementById('dailyMissionTitle');
    const descEl = document.getElementById('dailyMissionDescription');
    const statusEl = document.getElementById('missionStatus');
    const reflectionEl = document.getElementById('missionReflectionInput');
    const completeBtn = document.getElementById('completeMissionBtn');

    if (!titleEl || !descEl || !statusEl || !reflectionEl || !completeBtn) return;

    titleEl.textContent = typeof missionState.title === 'string'
        ? missionState.title
        : missionState.title[currentLanguage] || missionState.title.en;
    descEl.textContent = typeof missionState.description === 'string'
        ? missionState.description
        : missionState.description[currentLanguage] || missionState.description.en;
    reflectionEl.value = missionState.reflection || '';
    statusEl.textContent = missionState.completed
        ? (currentLanguage === 'he' ? 'עבודה מדהימה - המשימה הושלמה להיום!' : 'Amazing work - mission complete for today!')
        : '';
    completeBtn.textContent = missionState.completed
        ? (currentLanguage === 'he' ? '✅ הושלם להיום' : '✅ Completed Today')
        : t('missionCompleteBtn');
}

function completeDailyMission() {
    const key = getMissionStorageKey();

    const missionState = JSON.parse(localStorage.getItem(key) || 'null');
    if (!missionState) return;

    missionState.completed = true;
    localStorage.setItem(key, JSON.stringify(missionState));
    renderMissionState(missionState);

    const streakEl = document.getElementById('streakDays');
    if (streakEl) {
        streakEl.textContent = String(Math.max(parseInt(streakEl.textContent || '0', 10), calculateStreak()) + 1);
    }

    updateWeeklyGoalProgress(1);
    updateMiddosMap();
}

function saveMissionReflection() {
    const key = getMissionStorageKey();
    const reflectionEl = document.getElementById('missionReflectionInput');
    const statusEl = document.getElementById('missionStatus');
    if (!key || !reflectionEl || !statusEl) return;

    const missionState = JSON.parse(localStorage.getItem(key) || 'null');
    if (!missionState) return;

    missionState.reflection = reflectionEl.value.trim();
    localStorage.setItem(key, JSON.stringify(missionState));
    statusEl.textContent = missionState.reflection
        ? (currentLanguage === 'he' ? 'המחשבה נשמרה. המשיכו לצמוח.' : 'Reflection saved. Keep growing.')
        : '';
}

function shareDailyMission(channel) {
    const key = getMissionStorageKey();

    const missionState = JSON.parse(localStorage.getItem(key) || 'null');
    if (!missionState) return;

    const title = typeof missionState.title === 'string'
        ? missionState.title
        : missionState.title[currentLanguage] || missionState.title.en;
    const description = typeof missionState.description === 'string'
        ? missionState.description
        : missionState.description[currentLanguage] || missionState.description.en;
    const reflection = missionState.reflection ? `\n${currentLanguage === 'he' ? 'מחשבה:' : 'Reflection:'} ${missionState.reflection}` : '';
    const completionText = missionState.completed
        ? (currentLanguage === 'he' ? '✅ הושלם להיום' : '✅ Completed today')
        : (currentLanguage === 'he' ? '🕊️ עדיין בתהליך' : '🕊️ In progress');

    const message = currentLanguage === 'he'
        ? `המשימה היומית שלי בשמירת הלשון:\n${title}\n${description}\n${completionText}${reflection}`
        : `My daily Shmiras HaLashon mission:\n${title}\n${description}\n${completionText}${reflection}`;

    const encoded = encodeURIComponent(message);
    if (channel === 'whatsapp') window.open(`https://wa.me/?text=${encoded}`, '_blank');
    if (channel === 'email') window.location.href = `mailto:?subject=${encodeURIComponent(currentLanguage === 'he' ? 'המשימה היומית שלי' : 'My Daily Mission')}&body=${encoded}`;
    if (channel === 'text') window.location.href = `sms:?&body=${encoded}`;
}

function updateWeeklyGoalProgress(increment = 0) {
    const bar = document.getElementById('weeklyGoalProgressBar');
    const text = document.getElementById('weeklyGoalProgressText');
    if (!bar || !text) return;

    const key = `weeklyGoal_${getStorageUserId()}`;
    const weekStart = getWeekStartDateString();
    let state = null;
    try {
        state = JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {
        state = null;
    }

    if (!state || state.weekStart !== weekStart) {
        state = { weekStart, progress: 0 };
    }

    state.progress = Math.min(weeklyGoalTarget, Math.max(0, state.progress + increment));
    localStorage.setItem(key, JSON.stringify(state));

    const pct = Math.round((state.progress / weeklyGoalTarget) * 100);
    bar.style.width = `${pct}%`;
    text.textContent = currentLanguage === 'he'
        ? `${state.progress} / ${weeklyGoalTarget} הושלמו`
        : `${state.progress} / ${weeklyGoalTarget} complete`;

    const goalText = document.getElementById('weeklyGoalText');
    if (goalText) {
        goalText.textContent = currentLanguage === 'he'
            ? 'ביחד נשלים 500 רגעים של דיבור מודע השבוע.'
            : "Together, let's complete 500 mindful speech moments this week.";
    }
}

function getWeekStartDateString() {
    const today = new Date();
    const dayIndex = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayIndex);
    return start.toDateString();
}

function updateMiddosMap() {
    const lessons = parseInt(document.getElementById('lessonsLearned')?.textContent || '0', 10);
    const chats = parseInt(document.getElementById('totalChats')?.textContent || '0', 10);
    const streak = parseInt(document.getElementById('streakDays')?.textContent || '0', 10);
    const score = lessons + chats + (streak * 2);

    let unlockedStages = 1;
    let summary = currentLanguage === 'he'
        ? 'התחילו בהשלמת משימה היום כדי לפתוח את השלב הראשון.'
        : 'Start by completing a mission today to unlock your first stage.';

    if (score >= 10) {
        unlockedStages = 2;
        summary = currentLanguage === 'he'
            ? 'אתם בשלב המשמעת - העקביות כבר נבנית.'
            : 'You are in Discipline mode - consistency is forming.';
    }
    if (score >= 25) {
        unlockedStages = 3;
        summary = currentLanguage === 'he'
            ? 'אתם מזככים את דפוסי הדיבור שלכם בחיים האמיתיים.'
            : 'You are refining your speech patterns in real life.';
    }
    if (score >= 45) {
        unlockedStages = 4;
        summary = currentLanguage === 'he'
            ? 'הצמיחה שלכם כבר משפיעה לטובה על הסביבה שלכם.'
            : 'Your growth now positively influences the people around you.';
    }

    document.querySelectorAll('.middos-stage').forEach((stage, index) => {
        stage.classList.toggle('active', index < unlockedStages);
    });

    const summaryEl = document.getElementById('middosStageSummary');
    if (summaryEl) {
        summaryEl.textContent = summary;
    }
}

let lastSpeechLabResult = null;

async function analyzeSpeechLabInput() {
    const speechInput = document.getElementById('speechLabInput');
    const contextInput = document.getElementById('speechLabContext');
    const analyzeBtn = document.getElementById('analyzeSpeechBtn');
    const resultPanel = document.getElementById('speechLabResult');
    const riskEl = document.getElementById('speechLabRisk');
    const reasonEl = document.getElementById('speechLabReason');
    const rewriteEl = document.getElementById('speechLabRewrite');
    const actionEl = document.getElementById('speechLabAction');

    if (!speechInput || !analyzeBtn || !resultPanel || !riskEl || !reasonEl || !rewriteEl || !actionEl) {
        return;
    }

    const statement = speechInput.value.trim();
    const context = contextInput ? contextInput.value.trim() : '';

    if (!statement) {
        alert(currentLanguage === 'he' ? 'אנא כתבו קודם מה אתם מתכננים לומר.' : 'Please type what you plan to say first.');
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = currentLanguage === 'he' ? 'מנתח...' : 'Analyzing...';

    try {
        const response = await fetch('/api/chofetz-chaim/speech-lab', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                statement,
                context,
                language: currentLanguage
            })
        });

        const data = await response.json();
        const result = response.ok ? data : data.fallback;

        if (!result) {
            throw new Error('No analysis result available');
        }
        lastSpeechLabResult = result;

        const riskClass = result.riskLevel || 'caution';
        riskEl.className = `speech-lab-risk-badge ${riskClass}`;
        riskEl.textContent = formatRiskLabel(riskClass);

        reasonEl.textContent = result.reason || 'Please use caution.';
        rewriteEl.textContent = result.saferRewrite || 'Let me say this in a gentler way.';
        actionEl.textContent = result.actionStep || 'Pause and speak with care.';

        resultPanel.classList.remove('hidden');
    } catch (error) {
        console.error('Speech Lab analysis failed:', error);
        alert(currentLanguage === 'he' ? 'לא ניתן לנתח כרגע. נסו שוב בעוד רגע.' : 'Could not analyze right now. Please try again in a moment.');
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = t('speechLabAnalyzeBtn');
    }
}

function formatRiskLabel(riskLevel) {
    if (riskLevel === 'safe') return currentLanguage === 'he' ? 'בטוח' : 'Safe';
    if (riskLevel === 'likely-lashon-hara') return currentLanguage === 'he' ? 'סביר לשון הרע' : 'Likely Lashon Hara';
    return currentLanguage === 'he' ? 'זהירות' : 'Caution';
}

function renderSpeechLabLastResult() {
    if (!lastSpeechLabResult) return;
    const riskEl = document.getElementById('speechLabRisk');
    if (riskEl) {
        riskEl.textContent = formatRiskLabel(lastSpeechLabResult.riskLevel || 'caution');
    }
}

async function copySpeechRewrite() {
    if (!lastSpeechLabResult?.saferRewrite) return;
    try {
        await navigator.clipboard.writeText(lastSpeechLabResult.saferRewrite);
        alert(currentLanguage === 'he' ? 'הניסוח הועתק.' : 'Rewrite copied.');
    } catch (error) {
        alert(currentLanguage === 'he' ? 'ההעתקה נכשלה.' : 'Copy failed.');
    }
}

function sendSpeechRewriteToCommunity() {
    if (!lastSpeechLabResult?.saferRewrite) return;
    const shareInput = document.getElementById('shareInput');
    const charCount = document.getElementById('charCount');
    if (shareInput) {
        shareInput.value = lastSpeechLabResult.saferRewrite;
        if (charCount) charCount.textContent = String(lastSpeechLabResult.saferRewrite.length);
        switchDashboardTab('community');
        const feedBtn = document.querySelector('.learning-mode-btn[data-mode="feed"]');
        if (feedBtn) feedBtn.click();
        shareInput.focus();
    }
}

function shareSpeechRewrite(channel) {
    if (!lastSpeechLabResult?.saferRewrite) return;
    const text = lastSpeechLabResult.saferRewrite;
    const encoded = encodeURIComponent(text);

    if (channel === 'whatsapp') window.open(`https://wa.me/?text=${encoded}`, '_blank');
    if (channel === 'email') window.location.href = `mailto:?subject=${encodeURIComponent('Safer Speech Rewrite')}&body=${encoded}`;
    if (channel === 'text') window.location.href = `sms:?&body=${encoded}`;
}

function getProgressShareMessage() {
    const streak = document.getElementById('streakDays')?.textContent || '0';
    const lessons = document.getElementById('lessonsLearned')?.textContent || '0';
    const chats = document.getElementById('totalChats')?.textContent || '0';
    return currentLanguage === 'he'
        ? `אני במסע שלי בשמירת הלשון 🕊️\nרצף: ${streak} ימים\nשיעורים: ${lessons}\nשיחות: ${chats}\n${window.location.origin}`
        : `I'm on my Shmiras HaLashon journey 🕊️\nStreak: ${streak} days\nLessons: ${lessons}\nConversations: ${chats}\n${window.location.origin}`;
}

function shareProgress(channel) {
    const message = getProgressShareMessage();
    const encoded = encodeURIComponent(message);
    if (channel === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
    if (channel === 'whatsapp') window.open(`https://wa.me/?text=${encoded}`, '_blank');
    if (channel === 'email') window.location.href = `mailto:?subject=${encodeURIComponent(currentLanguage === 'he' ? 'התקדמות בשמירת הלשון' : 'Shmiras HaLashon Progress')}&body=${encoded}`;
    if (channel === 'text') window.location.href = `sms:?&body=${encoded}`;
}

async function copyProgressShareText() {
    try {
        await navigator.clipboard.writeText(getProgressShareMessage());
        alert(t('progressCopied'));
    } catch (error) {
        alert(currentLanguage === 'he' ? 'ההעתקה נכשלה.' : 'Copy failed.');
    }
}

function exportUserData() {
    const focusTimer = loadFocusTimerState();
    const payload = {
        exportedAt: new Date().toISOString(),
        user: currentUser?.name || '',
        streakDays: document.getElementById('streakDays')?.textContent || '0',
        lessonsLearned: document.getElementById('lessonsLearned')?.textContent || '0',
        totalChats: document.getElementById('totalChats')?.textContent || '0',
        conversations,
        focusTimer
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shmiras-halashon-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
        window.location.reload();
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
    const { t, currentLanguage } = await import('./translations.js?v=20260426c');
    
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

function saveGuestConversationLocal() {
    const today = new Date().toDateString();
    let list = [];
    try {
        list = JSON.parse(localStorage.getItem('guestConversations') || '[]');
    } catch (error) {
        list = [];
    }
    const idx = list.findIndex((c) => c.date === today);
    const entry = {
        id: idx >= 0 ? list[idx].id : `guest_${Date.now()}`,
        date: today,
        messages: [...currentConversation]
    };
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    localStorage.setItem('guestConversations', JSON.stringify(list));
    conversations = list;
}

async function saveConversation() {
    if (!currentUser) {
        saveGuestConversationLocal();
        return;
    }
    
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
    
    loadCompletedLessons();
    updateWeeklyGoalProgress();
    updateMiddosMap();
    renderFocusTimerState();
    
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
    
    if (currentUser) {
        updateOnlineCount();
    } else {
        const onlineEl = document.getElementById('onlineUsersCount');
        if (onlineEl) onlineEl.textContent = '–';
    }
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
    
    if (!message) return;
    if (!currentUser) {
        alert(t('signInToChat'));
        return;
    }
    
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
    if (!currentUser) return;
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
    if (!currentUser) {
        alert(t('signInForPartners'));
        return;
    }
    
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
    if (!currentUser) {
        alert(t('signInForPartners'));
        return;
    }
    
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

// =============================
// Logo Assistant (click the header logo for help + navigation)
// =============================
const LOGO_ASSISTANT_TABS = {
    bot: {
        keywords: ['bot', 'chofetz', 'chat', 'ask', 'question', 'talk', 'conversation'],
        label: '🕊️ Chofetz Chaim Bot',
        description: "Ask questions about Shmiras HaLashon and get guidance from the Chofetz Chaim bot."
    },
    lesson: {
        keywords: ['lesson', 'daily', 'day', 'learn', 'learning', 'sh yomi', 'yomi', 'lesson a day'],
        label: '📖 A Lesson A Day',
        description: 'Study one short Chofetz Chaim lesson a day, with a short "in a nutshell" summary.'
    },
    sefer: {
        keywords: ['sefer', 'book', 'shmiras halashon', 'text', 'source', 'reading'],
        label: '📚 Sefer Shmiras Halashon',
        description: 'Read the Sefer Shmiras HaLashon directly in Hebrew or English.'
    },
    chizuk: {
        keywords: ['chizuk', 'encourage', 'encouragement', 'inspiration', 'motivation', 'video'],
        label: '💪 Chizuk',
        description: 'Short chizuk videos and inspiration to strengthen your commitment.'
    },
    tools: {
        keywords: ['tool', 'tools', 'timer', 'focus', 'hour of caring', 'machsom', 'speech lab', 'mission', 'reflection', 'buddy'],
        label: '🧰 Shmiras HaLashon Tools',
        description: 'Daily missions, Speech Lab, the No‑Lashon‑Hara Focus Timer, and Hour of Caring / Machsom L\'fi.'
    },
    prayer: {
        keywords: ['prayer', 'tefilah', 'tefillah', 'pray', 'daven', 'dibur'],
        label: '🙏 Shmiras HaLashon Prayer',
        description: 'The Tefilah al HaDibur prayer in Hebrew and English.'
    },
    community: {
        keywords: ['community', 'together', 'friends', 'buddy', 'partner', 'post', 'share', 'group', 'chat room', 'live chat', 'learning together'],
        label: '👥 Learning Together',
        description: 'Connect with others, share encouragement, and learn together.'
    },
    tracker: {
        keywords: ['progress', 'tracker', 'streak', 'stats', 'completed', 'milestone', 'middos'],
        label: '📊 Progress Tracker',
        description: 'See your streaks, completed lessons, and Middos Growth Map.'
    }
};

function initLogoAssistant() {
    const trigger = document.getElementById('logoAssistantTrigger');
    const modal = document.getElementById('logoAssistantModal');
    const closeBtn = document.getElementById('closeLogoAssistant');
    const form = document.getElementById('logoAssistantForm');
    const input = document.getElementById('logoAssistantInput');
    const supportHint = document.querySelector('.logo-support-hint');

    if (!trigger || !modal || !form || !input) return;

    trigger.addEventListener('click', openLogoAssistant);
    if (supportHint) supportHint.addEventListener('click', openLogoAssistant);
    if (closeBtn) closeBtn.addEventListener('click', closeLogoAssistant);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLogoAssistant();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeLogoAssistant();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        await handleLogoAssistantQuery(text);
    });
}

function openLogoAssistant() {
    const modal = document.getElementById('logoAssistantModal');
    const input = document.getElementById('logoAssistantInput');
    const messages = document.getElementById('logoAssistantMessages');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    if (messages && !messages.dataset.greeted) {
        addLogoAssistantMessage('assistant', getLogoAssistantGreeting());
        messages.dataset.greeted = '1';
    }
    setTimeout(() => input?.focus(), 50);
}

function closeLogoAssistant() {
    const modal = document.getElementById('logoAssistantModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

function getLogoAssistantGreeting() {
    try {
        return (typeof t === 'function' && t('logoAssistantGreeting'))
            || 'Welcome to the MysticMinded\u00B3\u00B3 Shmiras Halashon App! How can I help you today? I can take you to any section or answer basic questions about the app.';
    } catch (_) {
        return 'Welcome to the MysticMinded\u00B3\u00B3 Shmiras Halashon App! How can I help you today?';
    }
}

function addLogoAssistantMessage(type, text, suggestedTabs = []) {
    const container = document.getElementById('logoAssistantMessages');
    if (!container) return;
    const msg = document.createElement('div');
    msg.className = `logo-assistant-message logo-assistant-message-${type}`;
    msg.innerHTML = makeLinksClickable(escapeLogoAssistantHtml(text));

    if (type === 'assistant' && suggestedTabs && suggestedTabs.length) {
        const actions = document.createElement('div');
        actions.className = 'logo-assistant-actions';
        suggestedTabs.forEach(tab => {
            const cfg = LOGO_ASSISTANT_TABS[tab];
            if (!cfg) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'logo-assistant-take-me';
            btn.textContent = `Take me to ${cfg.label} →`;
            btn.addEventListener('click', () => navigateToDashboardTab(tab, false));
            actions.appendChild(btn);
        });
        if (actions.childNodes.length) msg.appendChild(actions);
    }

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

function detectSuggestedTabs(text) {
    if (!text) return [];
    const lower = text.toLowerCase();
    const found = new Set();
    for (const [tab, cfg] of Object.entries(LOGO_ASSISTANT_TABS)) {
        const label = cfg.label.replace(/^[^A-Za-z]+/, '').toLowerCase();
        if (label && lower.includes(label)) {
            found.add(tab);
            continue;
        }
        for (const kw of cfg.keywords) {
            if (kw.length >= 5 && lower.includes(kw)) {
                found.add(tab);
                break;
            }
        }
    }
    return Array.from(found).slice(0, 3);
}

function escapeLogoAssistantHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function matchLogoAssistantIntent(text) {
    const lower = text.toLowerCase();
    const navIndicators = ['take me', 'go to', 'show me', 'open', 'bring me', 'navigate', 'where is', 'where do i', 'tab', 'section', 'page'];
    const hasNavIntent = navIndicators.some(k => lower.includes(k));
    let best = null;
    let bestScore = 0;
    for (const [tab, config] of Object.entries(LOGO_ASSISTANT_TABS)) {
        for (const kw of config.keywords) {
            if (lower.includes(kw)) {
                const score = kw.length + (hasNavIntent ? 5 : 0);
                if (score > bestScore) {
                    bestScore = score;
                    best = { tab, config };
                }
            }
        }
    }
    if (!best) return null;
    if (!hasNavIntent && bestScore < 6) return null;
    return best;
}

function navigateToDashboardTab(tab, announce = false, delay = 1800) {
    if (!LOGO_ASSISTANT_TABS[tab]) return;
    if (announce) {
        addLogoAssistantMessage('assistant', `Opening ${LOGO_ASSISTANT_TABS[tab].label} — ${LOGO_ASSISTANT_TABS[tab].description}`);
    }
    setTimeout(() => {
        try {
            if (typeof showDashboard === 'function') showDashboard();
        } catch (_) {}
        try {
            if (typeof switchDashboardTab === 'function') switchDashboardTab(tab);
        } catch (_) {}
        closeLogoAssistant();
        const el = document.getElementById(`${tab}Tab`);
        if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, delay);
}

async function handleLogoAssistantQuery(text) {
    addLogoAssistantMessage('user', text);

    const intent = matchLogoAssistantIntent(text);
    if (intent) {
        const routingPreamble = (typeof t === 'function' && t('logoAssistantRouting'))
            || 'OK, let me get you to the correct place to help with that.';
        const takingYouToTpl = (typeof t === 'function' && t('logoAssistantTakingYouTo'))
            || 'Taking you to {label} now…';
        const takingYouTo = takingYouToTpl.replace('{label}', intent.config.label);

        addLogoAssistantMessage('assistant', routingPreamble);
        addLogoAssistantMessage(
            'assistant',
            `${takingYouTo} ${intent.config.description}`,
            [intent.tab]
        );
        navigateToDashboardTab(intent.tab, false, 1800);
        return;
    }

    const thinkingId = 'logo-assistant-thinking';
    const container = document.getElementById('logoAssistantMessages');
    const thinking = document.createElement('div');
    thinking.id = thinkingId;
    thinking.className = 'logo-assistant-message logo-assistant-message-assistant logo-assistant-thinking';
    thinking.textContent = '…';
    container?.appendChild(thinking);
    container && (container.scrollTop = container.scrollHeight);

    try {
        const guidance = 'You are a helpful guide inside the MysticMinded\u00B3\u00B3 Shmiras Halashon App. ' +
            'The app has these tabs: Chofetz Chaim Bot, A Lesson A Day, Sefer Shmiras Halashon, Chizuk, ' +
            'Shmiras HaLashon Tools (Daily Mission, Speech Lab, No-Lashon-Hara Focus Timer, Hour of Caring / Machsom L\'fi), ' +
            'Shmiras HaLashon Prayer (Tefilah al HaDibur), Learning Together (community), and Progress Tracker. ' +
            'Answer the user briefly and, when relevant, mention the exact tab name so it is easy to navigate. ' +
            'User message: ' + text;
        const response = await fetch('/api/chofetz-chaim/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: guidance, language: currentLanguage })
        });
        const data = await response.json();
        document.getElementById(thinkingId)?.remove();
        const reply = data.response || data.fallback || "I'm not sure — try rephrasing your question.";
        const suggested = detectSuggestedTabs(reply);
        addLogoAssistantMessage('assistant', reply, suggested);
    } catch (error) {
        document.getElementById(thinkingId)?.remove();
        addLogoAssistantMessage('assistant', "I'm having trouble connecting. Please try again shortly.");
    }
}
