import { db, collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, increment } from './firebase-config.js?v=20260426c';

// Progress tracking functions
export class ProgressTracker {
    constructor(userId) {
        this.userId = userId;
        this.progressRef = doc(db, 'userProgress', userId);
    }
    
    // Initialize user progress
    async initializeProgress() {
        try {
            const progressDoc = await getDoc(this.progressRef);
            
            if (!progressDoc.exists()) {
                await setDoc(this.progressRef, {
                    userId: this.userId,
                    createdAt: serverTimestamp(),
                    currentStreak: 0,
                    longestStreak: 0,
                    totalDays: 0,
                    totalConversations: 0,
                    totalMessages: 0,
                    lastActiveDate: new Date().toDateString(),
                    topicsDiscussed: [],
                    milestones: [],
                    weeklyGoals: {
                        target: 7,
                        current: 0
                    },
                    monthlyStats: {}
                });
            }
            
            return await this.getProgress();
        } catch (error) {
            console.error('Error initializing progress:', error);
            return null;
        }
    }
    
    // Get current progress
    async getProgress() {
        try {
            const progressDoc = await getDoc(this.progressRef);
            return progressDoc.exists() ? progressDoc.data() : null;
        } catch (error) {
            console.error('Error getting progress:', error);
            return null;
        }
    }
    
    // Update daily activity
    async updateDailyActivity() {
        try {
            const progress = await this.getProgress();
            if (!progress) {
                await this.initializeProgress();
                return;
            }
            
            const today = new Date().toDateString();
            const lastActive = progress.lastActiveDate;
            
            // Check if it's a new day
            if (lastActive !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toDateString();
                
                // Update streak
                let newStreak = progress.currentStreak || 0;
                if (lastActive === yesterdayStr) {
                    newStreak += 1;
                } else {
                    newStreak = 1;
                }
                
                const longestStreak = Math.max(newStreak, progress.longestStreak || 0);
                
                await updateDoc(this.progressRef, {
                    currentStreak: newStreak,
                    longestStreak: longestStreak,
                    totalDays: increment(1),
                    lastActiveDate: today,
                    lastUpdated: serverTimestamp()
                });
                
                // Check for milestones
                await this.checkMilestones(newStreak);
            }
        } catch (error) {
            console.error('Error updating daily activity:', error);
        }
    }
    
    // Log a conversation
    async logConversation(topics = []) {
        try {
            await updateDoc(this.progressRef, {
                totalConversations: increment(1),
                lastUpdated: serverTimestamp()
            });
            
            // Update topics discussed
            if (topics.length > 0) {
                await this.updateTopics(topics);
            }
        } catch (error) {
            console.error('Error logging conversation:', error);
        }
    }
    
    // Log a message
    async logMessage() {
        try {
            await updateDoc(this.progressRef, {
                totalMessages: increment(1)
            });
        } catch (error) {
            console.error('Error logging message:', error);
        }
    }
    
    // Update topics discussed
    async updateTopics(newTopics) {
        try {
            const progress = await this.getProgress();
            const existingTopics = progress.topicsDiscussed || [];
            
            // Add new topics without duplicates
            const allTopics = [...new Set([...existingTopics, ...newTopics])];
            
            await updateDoc(this.progressRef, {
                topicsDiscussed: allTopics.slice(0, 50) // Keep max 50 topics
            });
        } catch (error) {
            console.error('Error updating topics:', error);
        }
    }
    
    // Check and award milestones
    async checkMilestones(currentStreak) {
        const progress = await this.getProgress();
        const milestones = progress.milestones || [];
        
        const milestoneTargets = [
            { days: 1, title: "First Step", description: "Started your journey", icon: "🌱" },
            { days: 3, title: "Commitment", description: "3 days of learning", icon: "🔥" },
            { days: 7, title: "Week Warrior", description: "One full week!", icon: "⭐" },
            { days: 14, title: "Two Weeks Strong", description: "14 days of dedication", icon: "💪" },
            { days: 30, title: "Month Master", description: "30 days milestone!", icon: "🏆" },
            { days: 60, title: "Two Months!", description: "60 days of growth", icon: "🌟" },
            { days: 90, title: "Quarter Year", description: "90 days accomplished", icon: "👑" },
            { days: 180, title: "Half Year Hero", description: "180 days dedication", icon: "🎯" },
            { days: 365, title: "Year Champion", description: "One full year!", icon: "🏅" }
        ];
        
        for (const target of milestoneTargets) {
            const alreadyEarned = milestones.some(m => m.days === target.days);
            
            if (currentStreak >= target.days && !alreadyEarned) {
                milestones.push({
                    ...target,
                    earnedAt: serverTimestamp(),
                    earnedDate: new Date().toISOString()
                });
                
                await updateDoc(this.progressRef, {
                    milestones: milestones
                });
                
                // Show celebration notification
                this.celebrateMilestone(target);
            }
        }
    }
    
    // Celebrate milestone (you can customize this)
    celebrateMilestone(milestone) {
        console.log(`🎉 Milestone achieved: ${milestone.title}`);
        // You can add UI notification here
    }
    
    // Get shareable progress summary
    async getShareableSummary() {
        const progress = await this.getProgress();
        
        return {
            currentStreak: progress.currentStreak || 0,
            longestStreak: progress.longestStreak || 0,
            totalDays: progress.totalDays || 0,
            totalConversations: progress.totalConversations || 0,
            milestones: progress.milestones || [],
            topTopics: (progress.topicsDiscussed || []).slice(0, 5)
        };
    }
    
    // Generate share text
    async generateShareText(language = 'en') {
        const summary = await this.getShareableSummary();
        
        if (language === 'he') {
            return `🕊️ המסע שלי בשמירת הלשון
            
📊 ההתקדמות שלי:
🔥 רצף נוכחי: ${summary.currentStreak} ימים
⭐ הרצף הארוך ביותר: ${summary.longestStreak} ימים
📅 סך הכל ימים: ${summary.totalDays}
💬 שיחות: ${summary.totalConversations}
🏆 אבני דרך: ${summary.milestones.length}

הצטרפו אלי לכבוד תורת החפץ חיים!`;
        }
        
        return `🕊️ My Shmiras HaLashon Journey

📊 My Progress:
🔥 Current Streak: ${summary.currentStreak} days
⭐ Longest Streak: ${summary.longestStreak} days
📅 Total Days: ${summary.totalDays}
💬 Conversations: ${summary.totalConversations}
🏆 Milestones: ${summary.milestones.length}

Join me in honoring the teachings of the Chofetz Chaim!`;
    }
    
    // Export progress data
    async exportData() {
        const progress = await this.getProgress();
        const summary = await this.getShareableSummary();
        
        return {
            exportDate: new Date().toISOString(),
            ...progress,
            summary
        };
    }
}

// Helper function to detect topics from conversation
export function extractTopics(message, response) {
    const topicKeywords = {
        'lashon hara': ['lashon hara', 'evil speech', 'negative talk'],
        'rechilus': ['rechilus', 'gossip', 'talebearing'],
        'ona\'as devarim': ['hurt feelings', 'verbal abuse', 'hurtful words'],
        'workplace': ['work', 'office', 'job', 'colleague', 'boss'],
        'family': ['family', 'spouse', 'children', 'parent', 'sibling'],
        'social media': ['social media', 'internet', 'online', 'facebook', 'twitter'],
        'forgiveness': ['forgive', 'apologize', 'sorry', 'teshuva'],
        'positive speech': ['positive', 'compliment', 'praise', 'encourage']
    };
    
    const detectedTopics = [];
    const combinedText = `${message} ${response}`.toLowerCase();
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => combinedText.includes(keyword.toLowerCase()))) {
            detectedTopics.push(topic);
        }
    }
    
    return detectedTopics;
}
