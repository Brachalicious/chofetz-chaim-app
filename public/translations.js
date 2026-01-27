// Language translations
const translations = {
    en: {
        // Auth
        appTitle: "🕊️ Chofetz Chaim Shmiras Halashon App",
        dedication: "In honor of my Brother Yosef Yisroel Meyer named after the Chofetz Chaim for being such a role model on giving the benefit of the doubt and avoiding negative speech or judgement on others as well as my best friend Dr. Sima Bracha Shulman for being the greatest best friend a girl could have and for lending me her Shmiras halashon a lesson a day set with which I started to learn daily lessons and quickly found it so helpful in my daily growth and so life changing! May every lesson learned be in their righteous merit and in their zechus and may all their tefilot be answered amen! ❤️",
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
        chofetzChaimCaption: "The Chofetz Chaim",
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
        
        // Dashboard Tabs
        botTab: "🕊️ Chofetz Chaim Bot",
        botMessage: "Click me to start a conversation about Shmiras HaLashon",
        lessonTab: "📖 A Lesson A Day",
        chizukTab: "💪 Chizuk",
        prayerTab: "🙏 Daily Prayer",
        communityTab: "👥 Learning Together",
        trackerTab: "📊 Progress Tracker",
        
        // A Lesson A Day Section
        lessonTitle: "A Lesson A Day - Shmiras HaLashon",
        lessonIntro: "Learn the daily lessons from \"A Lesson A Day\" by the Chofetz Chaim Heritage Foundation. Each day includes practical halachos and inspiring insights to help you guard your speech.",
        hebrewSourceNote: "📚 For Hebrew source texts, visit Sefaria.org to study the original Sefer Chofetz Chaim and Sefer Shemiras HaLashon in Hebrew.",
        hebrewSourceNoteIntro: "📚 For Hebrew source texts, visit",
        hebrewSourceNoteEnd: "to study the original Sefer Chofetz Chaim and Sefer Shemiras HaLashon in Hebrew.",
        lessonContentNotice: "⚠️ Note: Daily lesson content is currently available in English only. For Hebrew texts, please visit the Sefaria link above.",
        previousBtn: "Previous",
        nextBtn: "Next",
        day: "Day",
        mesorahCredit: "A project of Mesorah Publications - Chofetz Chaim Heritage Foundation",
        iLearnedLesson: "I learned this lesson",
        saveProgress: "Save Progress",
        shareAccomplishment: "Share this accomplishment:",
        whatsappBtn: "WhatsApp",
        textBtn: "Text",
        twitterBtn: "Twitter",
        copyLinkBtn: "Copy Link",
        
        // Chizuk Section
        chizukTitle: "Chizuk - Inspiration & Shiurim 💪",
        chizukSubtitle: "Watch inspiring shiurim on Shmiras HaLashon from great Torah teachers. Share videos that strengthen you!",
        shareShiur: "Share a Shiur 📺",
        videoURL: "YouTube video URL (e.g., https://youtube.com/watch?v=...)",
        videoTitle: "Title (e.g., Rabbi's Name - Topic)",
        videoDescription: "Description (optional) - What's special about this shiur?",
        selectCategory: "Select Category...",
        categoryGeneral: "General Shmiras HaLashon",
        categoryLaws: "Laws & Halachos",
        categoryStories: "Stories & Inspiration",
        categoryMussar: "Mussar & Character Development",
        categoryChofetzChaim: "About the Chofetz Chaim",
        categoryPractical: "Practical Applications",
        addShiur: "Add Shiur",
        filterBy: "Filter by:",
        allCategories: "All Categories",
        categoryLabel: "Category:",
        sortBy: "Sort by:",
        sortByLabel: "Sort by:",
        mostRecent: "Most Recent",
        mostPopular: "Most Popular",
        titleAZ: "Title A-Z",
        newest: "Newest",
        oldest: "Oldest",
        mostViewed: "Most Viewed",
        watch: "Watch",
        deleteVideo: "Delete",
        views: "views",
        uploadedBy: "Uploaded by",
        noShiurim: "No shiurim yet. Be the first to share!",
        addInspiring: "Add inspiring videos about Shmiras HaLashon",
        
        // Learning Together
        learningMode: "Learning Mode:",
        communityRoom: "Community Room",
        studyPartners: "Study Partners",
        studyMode: "Study Mode:",
        findPartners: "Find Partners",
        chatWithPartner: "Chat with Partner",
        videoSessions: "Video Sessions",
        communityFeed: "Community Feed",
        liveChat: "Live Chat",
        communityIntro: "Join others in their journey of Shmiras HaLashon! See what lessons the community is learning and share your own progress.",
        shareAccomplishment: "Share Your Latest Accomplishment",
        shareThoughts: "Share your thoughts about today's lesson or a milestone you achieved...",
        shareWithCommunity: "Share with Community",
        recentUpdates: "Recent Updates from the Community",
        allPosts: "All Posts",
        lessonCompletions: "Lesson Completions",
        milestonesFilter: "Milestones",
        loadingUpdates: "Loading community updates...",
        liveChatIntro: "Connect with fellow learners in real-time! Chat, share insights, and find study partners.",
        communityRoomBtn: "Community Room",
        studyPartnersBtn: "Study Partners",
        communityRoomTitle: "Community Chat Room",
        online: "online",
        chatWelcome: "Welcome! Share insights, ask questions, and learn together. Remember: This is a space for positive, Torah-guided conversation. 🕊️",
        typeMessagePlaceholder: "Type your message... (Be kind, be respectful)",
        send: "Send",
        yourStudyPartners: "Your Study Partners (Chavrusa)",
        partnersDescription: "Find partners, chat with them, and learn together via video!",
        profileTab: "Find Partners",
        chatTab: "Chat with Partner",
        videoTab: "Video Sessions",
        yourStudyProfile: "Your Study Profile",
        studyTimePreference: "Preferred Study Time:",
        selectTime: "Select time...",
        morning: "Morning (6am-12pm)",
        afternoon: "Afternoon (12pm-6pm)",
        evening: "Evening (6pm-12am)",
        flexible: "Flexible",
        studyLevelLabel: "Study Level:",
        selectLevel: "Select level...",
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced",
        languagePreferenceLabel: "Language Preference:",
        english: "English",
        hebrew: "Hebrew",
        both: "Both",
        aboutMe: "About Me (Optional):",
        aboutMePlaceholder: "Tell potential study partners about yourself...",
        saveProfile: "Save Profile",
        availablePartners: "Available Study Partners",
        saveProfilePrompt: "Save your profile to see potential study partners!",
        yourPartners: "Your Partners",
        searchPartners: "Search partners...",
        loadingUsers: "Loading users...",
        selectPartner: "← Select a study partner to start chatting",
        noConversation: "Select a partner to view conversation",
        typeYourMessage: "Type your message...",
        liveVideoLearning: "Live Video Learning",
        videoLearningDescription: "Learn together face-to-face! Join or host a live study session.",
        startVideoSession: "Start Video Session",
        joinExistingSession: "Join Existing Session",
        notConnected: "Not Connected",
        activeStudySessions: "Active Study Sessions",
        noActiveSessions: "No active sessions. Be the first to start one!",
        you: "You",
        mute: "Mute",
        stopVideo: "Stop Video",
        shareScreen: "Share Screen",
        leave: "Leave",
        videoGuidelines: "Video Learning Guidelines",
        guideline1: "✓ Keep video sessions focused on Torah learning",
        guideline2: "✓ Dress modestly (tzniut) as per halacha",
        guideline3: "✓ Maintain appropriate boundaries (men with men, women with women)",
        guideline4: "✓ Be respectful and follow Shmiras HaLashon principles",
        guideline5: "✓ Sessions are private and not recorded",
        topicsWillAppear: "Topics will appear as you chat",
        
        // Sefaria Sections
        sefariaSection: "📚 Studying from Sefaria (Optional):",
        selectSefariaSection: "-- Select a section from Sefer Chofetz Chaim --",
        sefariaIntro: "Introduction",
        sefariaPreface: "Preface",
        sefariaIntroLaws: "Introduction to the Laws of Lashon Hara & Rechilut",
        sefariaOpeningComments: "Opening Comments",
        sefariaNegativeCmd: "Negative Commandments",
        sefariaPositiveCmd: "Positive Commandments",
        sefariaCurses: "Curses",
        sefariaPartOne: "Part One: The Prohibition Against Lashon Hara",
        sefariaPart1Prin1: "Part 1, Principle 1",
        sefariaPart1Prin2: "Part 1, Principle 2",
        sefariaPart1Prin3: "Part 1, Principle 3",
        sefariaPart1Prin4: "Part 1, Principle 4",
        sefariaPart1Prin5: "Part 1, Principle 5",
        sefariaPart1Prin6: "Part 1, Principle 6",
        sefariaPart1Prin7: "Part 1, Principle 7",
        sefariaPart1Prin8: "Part 1, Principle 8",
        sefariaPart1Prin9: "Part 1, Principle 9",
        sefariaPart1Prin10: "Part 1, Principle 10",
        sefariaPartTwo: "Part Two: The Prohibition Against Rechilut",
        sefariaPart2Prin1: "Part 2, Principle 1",
        sefariaPart2Prin2: "Part 2, Principle 2",
        sefariaPart2Prin3: "Part 2, Principle 3",
        sefariaPart2Prin4: "Part 2, Principle 4",
        sefariaPart2Prin5: "Part 2, Principle 5",
        sefariaPart2Prin6: "Part 2, Principle 6",
        sefariaPart2Prin7: "Part 2, Principle 7",
        sefariaPart2Prin8: "Part 2, Principle 8",
        sefariaPart2Prin9: "Part 2, Principle 9",
        sefariaIllustrations: "Illustrations",
        sefariaIllus1: "Illustration 1",
        sefariaIllus2: "Illustration 2",
        sefariaIllus3: "Illustration 3",
        sefariaIllus4: "Illustration 4",
        sefariaIllus5: "Illustration 5",
        sefariaIllus6: "Illustration 6",
        sefariaIllus7: "Illustration 7",
        sefariaIllus8: "Illustration 8",
        sefariaIllus9: "Illustration 9",
        sefariaIllus10: "Illustration 10",
        sefariaIllus11: "Illustration 11",
        manualEntry: "✍️ Or enter manually:",
        
        // Community Chat
        communityChat: "Community Chat",
        sendMessage: "Send Message",
        typeMessage: "Type a message...",
        
        // Video Streaming
        activeVideoSessions: "Active Video Sessions",
        createSession: "Create Video Session",
        joinSession: "Join Session",
        startVideo: "Start Video",
        sessionName: "Session Name",
        sessionTopic: "Session Topic",
        maxParticipants: "Max Participants",
        
        // Prayer
        tefilahAlHadibur: "Tefilah Al HaDibur",
        prayerForSpeech: "Prayer for Speech",
        prayerIntro: "Recite this beautiful prayer daily to help guard your speech and strengthen your commitment to Shmiras HaLashon.",
        prayerTitle: "Prayer for Guarding One's Speech",
        prayerPara1: "Master of the Universe, may it be Your will, Hashem my God and God of my fathers, that You protect me today and every day from arrogant people and from arrogance.",
        prayerPara2: "Save me from lashon hara (evil speech) and from those who speak lashon hara. Guard me from speaking, hearing, or accepting lashon hara about my fellow Jews, for any reason or cause.",
        prayerPara3: "May hatred of no person enter my heart. Protect me forever from the affliction of tzara'as (spiritual leprosy), especially from the affliction caused by lashon hara.",
        prayerPara4: "Sanctify my mouth for Your holy Name, and purify my heart to serve You in truth. Grant me a good tongue to praise, laud, and glorify Your holy Name always.",
        copyPrayer: "Copy Prayer",
        printPrayer: "Print",
        
        // Progress Tracker
        progressTrackerTitle: "Your Shmiras HaLashon Journey",
        stats: "Stats",
        completedLessons: "Completed Lessons",
        milestones: "Milestones",
        learningLog: "Learning Log",
        shareYourJourney: "Share Your Journey",
        completeLessonsPrompt: "Complete lessons to see them here!",
        keepLearningMilestones: "Keep learning to unlock milestones!",
        logPrompt: "What did you learn today about Shmiras HaLashon? (e.g., 'Learned about the importance of judging favorably - Chofetz Chaim Chapter 3')",
        addLogEntry: "📝 Add Log Entry",
        learningEntriesPrompt: "Your learning entries will appear here",
        
        // Disclaimer
        importantNotice: "Important Notice ⚠️",
        notRabbi: "This chatbot is not a rabbi and should not be relied upon for final halachic decisions. If answers are unclear or if you have further questions, please consult a qualified rabbi or call:",
        hotlineTitle: "THE SHMIRAS HALOSHON SHAILA HOTLINE 📞",
        hotlineIntro: "To say or not to say?",
        hotlineDescription: "Whether it is for a shidduch, a job referral, or just among family or friends, the wrong words can do irreparable harm. And sometimes, so can silence. Our Shaila Hotline puts you in contact with expert rabbonim so that before you speak, you can be sure.",
        hotlineHours: "Hours:",
        hotlineTime: "Evenings from 9:00 to 10:30 PM",
        callNow: "CALL: 718-951-3696 📞",
    },
    
    he: {
        // Auth
        appTitle: "🕊️ חפץ חיים - אפליקציית שמירת הלשון",
        dedication: "לכבוד אחי <strong>יוסף ישראל מאיר</strong> הנקרא על שם החפץ חיים על היותו מודל לחיקוי בנתינת יתרון הספק והימנעות מדיבור שלילי או שיפוט של אחרים, וכן לכבוד חברתי הטובה ביותר <strong>ד״ר שמע ברכה שולמן</strong> על היותה החברה הכי טובה שאפשר לבקש ועל שהשאילה לי את הספר שמירת הלשון שיעור ליום, שאיתו התחלתי ללמוד שיעורים יומיים ומצאתי את זה כל כך מועיל לצמיחה שלי וכל כך משנה חיים! יהי רצון שכל שיעור שנלמד יהיה לזכותם ובזכותם ושכל תפילותיהם תענינה אמן! ❤️",
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
        chofetzChaimCaption: "החפץ חיים",
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
        
        // Dashboard Tabs
        botTab: "🕊️ בוט חפץ חיים",
        botMessage: "לחץ עלי כדי להתחיל שיחה על שמירת הלשון",
        lessonTab: "📖 שיעור ליום",
        chizukTab: "💪 חיזוק",
        prayerTab: "🙏 תפילה יומית",
        communityTab: "👥 לומדים ביחד",
        trackerTab: "📊 מעקב התקדמות",
        
        // A Lesson A Day Section
        lessonTitle: "שיעור ליום - שמירת הלשון",
        lessonIntro: "למדו את השיעורים היומיים מ\"שיעור ליום\" מאת קרן מורשת חפץ חיים. כל יום כולל הלכות מעשיות ותובנות מעוררות השראה שיעזרו לכם לשמור על הדיבור שלכם.",
        hebrewSourceNote: "📚 לטקסטים מקוריים בעברית, בקרו ב-Sefaria.org ללמוד את ספר חפץ חיים וספר שמירת הלשון המקוריים בעברית.",
        hebrewSourceNoteIntro: "📚 לטקסטים מקוריים בעברית, בקרו ב",
        hebrewSourceNoteEnd: "ללמוד את ספר חפץ חיים וספר שמירת הלשון המקוריים בעברית.",
        lessonContentNotice: "⚠️ שימו לב: תוכן השיעורים היומיים זמין כרגע באנגלית בלבד. לטקסטים בעברית, אנא בקרו בקישור לספריא למעלה.",
        previousBtn: "קודם",
        nextBtn: "הבא",
        day: "יום",
        mesorahCredit: "פרויקט של מסורה פבליקיישנס - קרן מורשת חפץ חיים",
        iLearnedLesson: "למדתי את השיעור הזה",
        saveProgress: "שמור התקדמות",
        shareAccomplishment: "שתפו את ההישג:",
        whatsappBtn: "וואטסאפ",
        textBtn: "הודעת טקסט",
        twitterBtn: "טוויטר",
        copyLinkBtn: "העתק קישור",
        
        // Chizuk Section
        chizukTitle: "חיזוק - השראה ושיעורים 💪",
        chizukSubtitle: "צפו בשיעורים מעוררי השראה על שמירת הלשון ממורי תורה מעולים. שתפו סרטונים שמחזקים אתכם!",
        shareShiur: "שתפו שיעור 📺",
        videoURL: "כתובת יוטיוב (למשל, https://youtube.com/watch?v=...)",
        videoTitle: "כותרת (למשל, שם הרב - נושא)",
        videoDescription: "תיאור (אופציונלי) - מה מיוחד בשיעור הזה?",
        selectCategory: "בחר קטגוריה...",
        categoryGeneral: "שמירת הלשון כללי",
        categoryLaws: "דינים והלכות",
        categoryStories: "סיפורים והשראה",
        categoryMussar: "מוסר ופיתוח אישיות",
        categoryChofetzChaim: "על החפץ חיים",
        categoryPractical: "יישומים מעשיים",
        addShiur: "הוסף שיעור",
        filterBy: "סנן לפי:",
        allCategories: "כל הקטגוריות",
        categoryLabel: "קטגוריה:",
        sortBy: "מיין לפי:",
        sortByLabel: "מיין לפי:",
        mostRecent: "הכי חדש",
        mostPopular: "הכי פופולרי",
        titleAZ: "כותרת א-ת",
        newest: "הכי חדש",
        oldest: "הכי ישן",
        mostViewed: "הכי נצפה",
        watch: "צפה",
        deleteVideo: "מחק",
        views: "צפיות",
        uploadedBy: "הועלה על ידי",
        noShiurim: "אין שיעורים עדיין. היו הראשונים לשתף!",
        addInspiring: "הוסיפו סרטונים מעוררי השראה על שמירת הלשון",
        newest: "החדשים ביותר",
        oldest: "הישנים ביותר",
        mostViewed: "הנצפים ביותר",
        watch: "צפה",
        deleteVideo: "מחק",
        views: "צפיות",
        uploadedBy: "הועלה על ידי",
        
        // Learning Together
        learningMode: "מצב למידה:",
        communityRoom: "חדר קהילה",
        studyPartners: "שותפי לימוד",
        studyMode: "מצב לימוד:",
        findPartners: "מצא שותפים",
        chatWithPartner: "שוחח עם שותף",
        videoSessions: "מפגשי וידאו",
        communityFeed: "עדכוני קהילה",
        liveChat: "צ'אט חי",
        communityIntro: "הצטרפו לאחרים במסע שלהם בשמירת הלשון! ראו איזה שיעורים הקהילה לומדת ושתפו את ההתקדמות שלכם.",
        shareAccomplishment: "שתפו את ההישג האחרון שלכם",
        shareThoughts: "שתפו את מחשבותיכם על השיעור של היום או אבן דרך שהשגתם...",
        shareWithCommunity: "שתף עם הקהילה",
        recentUpdates: "עדכונים אחרונים מהקהילה",
        allPosts: "כל הפרסומים",
        lessonCompletions: "השלמות שיעורים",
        milestonesFilter: "אבני דרך",
        loadingUpdates: "טוען עדכוני קהילה...",
        liveChatIntro: "התחברו ללומדים אחרים בזמן אמת! שוחחו, שתפו תובנות, ומצאו שותפי לימוד.",
        communityRoomBtn: "חדר קהילה",
        studyPartnersBtn: "שותפי לימוד",
        communityRoomTitle: "חדר צ'אט קהילתי",
        online: "מחוברים",
        chatWelcome: "ברוכים הבאים! שתפו תובנות, שאלו שאלות, ולמדו ביחד. זכרו: זה מרחב לשיחה חיובית ומודרכת תורה. 🕊️",
        typeMessagePlaceholder: "הקלידו את ההודעה שלכם... (היו אדיבים, היו מכבדים)",
        send: "שלח",
        yourStudyPartners: "שותפי הלימוד שלכם (חברותא)",
        partnersDescription: "מצאו שותפים, שוחחו איתם, ולמדו ביחד דרך וידאו!",
        profileTab: "מצא שותפים",
        chatTab: "שוחח עם שותף",
        videoTab: "מפגשי וידאו",
        yourStudyProfile: "פרופיל הלימוד שלך",
        studyTimePreference: "זמן לימוד מועדף:",
        selectTime: "בחר זמן...",
        morning: "בוקר (6:00-12:00)",
        afternoon: "אחר הצהריים (12:00-18:00)",
        evening: "ערב (18:00-24:00)",
        flexible: "גמיש",
        studyLevelLabel: "רמת לימוד:",
        selectLevel: "בחר רמה...",
        beginner: "מתחיל",
        intermediate: "בינוני",
        advanced: "מתקדם",
        languagePreferenceLabel: "העדפת שפה:",
        english: "אנגלית",
        hebrew: "עברית",
        both: "שתיהן",
        aboutMe: "קצת עלי (אופציונלי):",
        aboutMePlaceholder: "ספרו לשותפי לימוד פוטנציאליים על עצמכם...",
        saveProfile: "שמור פרופיל",
        availablePartners: "שותפי לימוד זמינים",
        saveProfilePrompt: "שמרו את הפרופיל שלכם כדי לראות שותפי לימוד פוטנציאליים!",
        yourPartners: "השותפים שלך",
        searchPartners: "חפש שותפים...",
        loadingUsers: "טוען משתמשים...",
        selectPartner: "← בחר שותף לימוד כדי להתחיל צ'אט",
        noConversation: "בחר שותף כדי לראות שיחה",
        typeYourMessage: "הקלד את ההודעה שלך...",
        liveVideoLearning: "למידת וידאו חיה",
        videoLearningDescription: "למדו ביחד פנים אל פנים! הצטרפו או פתחו מפגש לימוד חי.",
        startVideoSession: "התחל מפגש וידאו",
        joinExistingSession: "הצטרף למפגש קיים",
        notConnected: "לא מחובר",
        activeStudySessions: "מפגשי לימוד פעילים",
        noActiveSessions: "אין מפגשים פעילים. היו הראשונים לפתוח!",
        you: "אתה",
        mute: "השתק",
        stopVideo: "עצור וידאו",
        shareScreen: "שתף מסך",
        leave: "עזוב",
        videoGuidelines: "הנחיות למידת וידאו",
        guideline1: "✓ שמרו על מפגשי וידאו ממוקדים בלימוד תורה",
        guideline2: "✓ התלבשו בצניעות לפי ההלכה",
        guideline3: "✓ שמרו על גבולות מתאימים (גברים עם גברים, נשים עם נשים)",
        guideline4: "✓ היו מכבדים ופעלו לפי עקרונות שמירת הלשון",
        guideline5: "✓ המפגשים פרטיים ולא מוקלטים",
        topicsWillAppear: "נושאים יופיעו כשתצ'טו",
        
        // Sefaria Sections
        sefariaSection: "📚 לומד מספריא (אופציונלי):",
        selectSefariaSection: "-- בחר פרק מספר חפץ חיים --",
        sefariaIntro: "הקדמה",
        sefariaPreface: "פתיחה",
        sefariaIntroLaws: "הקדמה לאיסור לשון הרע ורכילות",
        sefariaOpeningComments: "פתח דבר",
        sefariaNegativeCmd: "מצוות לא תעשה",
        sefariaPositiveCmd: "מצוות עשה",
        sefariaCurses: "אזהרות",
        sefariaPartOne: "חלק ראשון: איסור לשון הרע",
        sefariaPart1Prin1: "חלק א׳, כלל א׳",
        sefariaPart1Prin2: "חלק א׳, כלל ב׳",
        sefariaPart1Prin3: "חלק א׳, כלל ג׳",
        sefariaPart1Prin4: "חלק א׳, כלל ד׳",
        sefariaPart1Prin5: "חלק א׳, כלל ה׳",
        sefariaPart1Prin6: "חלק א׳, כלל ו׳",
        sefariaPart1Prin7: "חלק א׳, כלל ז׳",
        sefariaPart1Prin8: "חלק א׳, כלל ח׳",
        sefariaPart1Prin9: "חלק א׳, כלל ט׳",
        sefariaPart1Prin10: "חלק א׳, כלל י׳",
        sefariaPartTwo: "חלק שני: איסור רכילות",
        sefariaPart2Prin1: "חלק ב׳, כלל א׳",
        sefariaPart2Prin2: "חלק ב׳, כלל ב׳",
        sefariaPart2Prin3: "חלק ב׳, כלל ג׳",
        sefariaPart2Prin4: "חלק ב׳, כלל ד׳",
        sefariaPart2Prin5: "חלק ב׳, כלל ה׳",
        sefariaPart2Prin6: "חלק ב׳, כלל ו׳",
        sefariaPart2Prin7: "חלק ב׳, כלל ז׳",
        sefariaPart2Prin8: "חלק ב׳, כלל ח׳",
        sefariaPart2Prin9: "חלק ב׳, כלל ט׳",
        sefariaIllustrations: "דוגמאות",
        sefariaIllus1: "דוגמא א׳",
        sefariaIllus2: "דוגמא ב׳",
        sefariaIllus3: "דוגמא ג׳",
        sefariaIllus4: "דוגמא ד׳",
        sefariaIllus5: "דוגמא ה׳",
        sefariaIllus6: "דוגמא ו׳",
        sefariaIllus7: "דוגמא ז׳",
        sefariaIllus8: "דוגמא ח׳",
        sefariaIllus9: "דוגמא ט׳",
        sefariaIllus10: "דוגמא י׳",
        sefariaIllus11: "דוגמא י״א",
        manualEntry: "✍️ או הזן ידנית:",
        
        // Community Chat
        communityChat: "צ'אט קהילתי",
        sendMessage: "שלח הודעה",
        typeMessage: "הקלד הודעה...",
        
        // Video Streaming
        activeVideoSessions: "מפגשי וידאו פעילים",
        createSession: "צור מפגש וידאו",
        joinSession: "הצטרף למפגש",
        startVideo: "התחל וידאו",
        sessionName: "שם המפגש",
        sessionTopic: "נושא המפגש",
        maxParticipants: "מספר משתתפים מקסימלי",
        
        // Prayer
        tefilahAlHadibur: "תפילה על הדיבור",
        prayerForSpeech: "תפילה על הדיבור",
        prayerIntro: "קראו תפילה יפה זו מדי יום כדי לעזור לשמור על הדיבור שלכם ולחזק את המחויבות שלכם לשמירת הלשון.",
        prayerTitle: "תפילה על שמירת הדיבור",
        prayerPara1: "רבונו של עולם, יהי רצון מלפניך, ה' אלהי ואלהי אבותי, שתשמרני היום ובכל יום מעזי פנים ומעזות פנים.",
        prayerPara2: "ותצילני מלשון הרע ומבעל לשון הרע, ותשמרני מדבור לשון הרע, מלשמעו ומלקבלו, את ישראל אחי, מכל סבה ועלה.",
        prayerPara3: "ולא יעלה על לבבי שנאת שום אדם מישראל. ותצילני לעולם מנגוע צרעת, וכל שכן מנגעי מצורע של לשון הרע.",
        prayerPara4: "ותקדש פי לשם קדשך, ותטהר לבי לעבודתך באמת. ותזכרני לשון טובה לשבח להלל ולפאר את שמך הקדוש תמיד.",
        copyPrayer: "העתק תפילה",
        printPrayer: "הדפס",
        
        // Progress Tracker
        progressTrackerTitle: "המסע שלך בשמירת הלשון",
        stats: "סטטיסטיקות",
        completedLessons: "✅ שיעורים שהושלמו",
        milestones: "🏆 אבני דרך",
        learningLog: "📝 יומן למידה",
        shareYourJourney: "שתף את המסע שלך",
        completeLessonsPrompt: "השלם שיעורים כדי לראות אותם כאן!",
        keepLearningMilestones: "המשך ללמוד כדי לפתוח אבני דרך!",
        logPrompt: "מה למדת היום על שמירת הלשון? (לדוגמה, 'למדתי על חשיבות הדין לכף זכות - חפץ חיים פרק 3')",
        addLogEntry: "📝 הוסף רשומה",
        learningEntriesPrompt: "רשומות הלמידה שלך יופיעו כאן",
        
        // Disclaimer
        importantNotice: "⚠️ הודעה חשובה",
        notRabbi: "צ'אטבוט זה אינו רב ואין להסתמך עליו להכרעות הלכתיות סופיות. אם התשובות אינן ברורות או אם יש לך שאלות נוספות, אנא התייעץ עם רב מוסמך או התקשר:",
        hotlineTitle: "📞 קו השאלות לשמירת הלשון",
        hotlineIntro: "לומר או לא לומר?",
        hotlineDescription: "בין אם מדובר בשידוך, המלצה לעבודה, או סתם בין משפחה או חברים, המילים הלא נכונות עלולות לגרום נזק בלתי הפיך. ולפעמים, גם שתיקה. קו השאלות שלנו מחבר אותך עם רבנים מומחים כך שלפני שאתה מדבר, אתה יכול להיות בטוח.",
        hotlineHours: "שעות פעילות:",
        hotlineTime: "בערב בין 9:00 עד 10:30 בלילה",
        callNow: "📞 התקשר: 718-951-3696",
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
    
    // Show/hide lesson content notice for Hebrew
    const noticeElement = document.getElementById('lessonContentNotice');
    if (noticeElement) {
        noticeElement.style.display = lang === 'he' ? 'block' : 'none';
    }
    
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
            // Check if translation contains HTML tags
            if (key === 'dedication') {
                element.innerHTML = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // Update all elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = t(key);
        element.placeholder = translation;
    });
    
    // Update language toggle buttons
    const langToggle = document.getElementById('languageToggle');
    const langToggleApp = document.getElementById('languageToggleApp');
    const buttonText = currentLanguage === 'en' ? 'עברית' : 'English';
    
    if (langToggle) {
        langToggle.textContent = buttonText;
    }
    if (langToggleApp) {
        langToggleApp.textContent = buttonText;
    }
}

export { t, switchLanguage, currentLanguage, updateUILanguage };
