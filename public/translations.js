// Language translations
const translations = {
    en: {
        // Auth
        appTitle: "🕊️ Chofetz Chaim",
        dedication: "In honor of my brother Yosef Yisroel Meyer",
        subtitle: "Your guide to Shmiras HaLashon",
        signIn: "Sign In",
        signUp: "Sign Up",
        email: "Email",
        password: "Password",
        fullName: "Full Name",
        createAccount: "Create Account",
        
        // Navigation
        dashboard: "Dashboard",
        myProfile: "My Profile",
        myProgress: "My Progress",
        signOut: "Sign Out",
        backToChat: "Back to Chat",
        
        // Chat
        welcomeTitle: "Shalom! 👋",
        welcomeMessage: "Welcome to your personal Shmiras HaLashon guide. Ask me anything about guarding your speech, avoiding lashon hara, or living the teachings of the Chofetz Chaim.",
        tryAsking: "Try asking:",
        quickQuestion1: "What is lashon hara?",
        quickQuestion2: "How can I avoid gossip at work?",
        quickQuestion3: "What should I do if I hear lashon hara?",
        messagePlaceholder: "Ask about Shmiras HaLashon...",
        
        // Dashboard
        dashboardTitle: "Your Shmiras HaLashon Journey",
        dayStreak: "Day Streak",
        conversations: "Conversations",
        lessonsLearned: "Lessons Learned",
        recentConversations: "Recent Conversations",
        messages: "messages",
        emptyState: "Your conversations will appear here",
        
        // Progress
        progressTitle: "Your Progress",
        totalDays: "Total Days",
        currentStreak: "Current Streak",
        longestStreak: "Longest Streak",
        topicsDiscussed: "Topics Discussed",
        shareProgress: "Share My Progress",
        exportData: "Export Data",
        
        // Sharing
        shareTitle: "Share Your Journey",
        shareMessage: "I'm on a journey to improve my Shmiras HaLashon! Join me in honoring the teachings of the Chofetz Chaim.",
        copyLink: "Copy Link",
        shareTwitter: "Share on Twitter",
        shareWhatsApp: "Share on WhatsApp",
        
        // Errors
        loginFailed: "Login failed. Please check your credentials.",
        signupFailed: "Signup failed. Please try again.",
        connectionError: "Connection error. Please try again.",
        
        // Success
        progressCopied: "Progress link copied to clipboard!",
        dataSaved: "Data saved successfully",
    },
    
    he: {
        // Auth
        appTitle: "🕊️ חפץ חיים",
        dedication: "לכבוד אחי יוסף ישראל מאיר",
        subtitle: "המדריך שלך לשמירת הלשון",
        signIn: "התחברות",
        signUp: "הרשמה",
        email: "אימייל",
        password: "סיסמה",
        fullName: "שם מלא",
        createAccount: "צור חשבון",
        
        // Navigation
        dashboard: "לוח בקרה",
        myProfile: "הפרופיל שלי",
        myProgress: "ההתקדמות שלי",
        signOut: "התנתקות",
        backToChat: "חזרה לצ'אט",
        
        // Chat
        welcomeTitle: "שלום! 👋",
        welcomeMessage: "ברוכים הבאים למדריך האישי שלכם לשמירת הלשון. שאלו אותי כל שאלה על שמירת דיבור, הימנעות מלשון הרע, או חיים לפי תורת החפץ חיים.",
        tryAsking: "נסו לשאול:",
        quickQuestion1: "מהו לשון הרע?",
        quickQuestion2: "איך להימנע מרכילות בעבודה?",
        quickQuestion3: "מה לעשות אם שומעים לשון הרע?",
        messagePlaceholder: "שאלו על שמירת הלשון...",
        
        // Dashboard
        dashboardTitle: "המסע שלך בשמירת הלשון",
        dayStreak: "רצף ימים",
        conversations: "שיחות",
        lessonsLearned: "שיעורים שנלמדו",
        recentConversations: "שיחות אחרונות",
        messages: "הודעות",
        emptyState: "השיחות שלך יופיעו כאן",
        
        // Progress
        progressTitle: "ההתקדמות שלך",
        totalDays: "סך הכל ימים",
        currentStreak: "רצף נוכחי",
        longestStreak: "רצף הכי ארוך",
        topicsDiscussed: "נושאים שנדונו",
        shareProgress: "שתף את ההתקדמות",
        exportData: "ייצא נתונים",
        
        // Sharing
        shareTitle: "שתף את המסע שלך",
        shareMessage: "אני במסע לשפר את שמירת הלשון שלי! הצטרפו אלי בכיבוד תורת החפץ חיים.",
        copyLink: "העתק קישור",
        shareTwitter: "שתף בטוויטר",
        shareWhatsApp: "שתף בוואטסאפ",
        
        // Errors
        loginFailed: "ההתחברות נכשלה. אנא בדוק את הפרטים.",
        signupFailed: "ההרשמה נכשלה. נסה שוב.",
        connectionError: "שגיאת חיבור. נסה שוב.",
        
        // Success
        progressCopied: "קישור ההתקדמות הועתק!",
        dataSaved: "הנתונים נשמרו בהצלחה",
    }
};

// Current language
let currentLanguage = localStorage.getItem('preferredLanguage') || 'en';

// Get translation
function t(key) {
    return translations[currentLanguage][key] || translations.en[key] || key;
}

// Switch language
function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    updateUILanguage();
    
    // Update HTML dir attribute for RTL
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
}

// Update all UI text
function updateUILanguage() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else {
            element.textContent = translation;
        }
    });
    
    // Update language toggle button
    const langToggle = document.getElementById('languageToggle');
    if (langToggle) {
        langToggle.textContent = currentLanguage === 'en' ? 'עברית' : 'English';
    }
}

export { t, switchLanguage, currentLanguage, updateUILanguage };
