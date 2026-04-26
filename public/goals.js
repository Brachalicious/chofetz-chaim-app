// Shmiras HaLashon Goals module
// Handles preset + custom goals with per-goal daily streaks.
// Saves to Firestore for signed-in users, localStorage for guests.

import { currentLanguage } from './translations.js?v=20260426c';
import { auth, db, doc, getDoc, updateDoc, setDoc } from './firebase-config.js?v=20260426c';

// Preset common goals — bilingual labels + emoji
export const PRESET_GOALS = [
    { id: 'preset_noLoshonHora_hour', emoji: '⏳', en: 'Keep one hour a day completely free of loshon hora (Hour of Caring).', he: 'שמרו שעה אחת ביום נקייה לחלוטין מלשון הרע (שעה של אכפתיות).' },
    { id: 'preset_dailyTefillah', emoji: '🙏', en: 'Say the Shmiras HaLashon Tefillah (Tefilah al HaDibur) once a day.', he: 'אמרו מדי יום את תפילת שמירת הלשון (תפילה על הדיבור).' },
    { id: 'preset_lessonADay', emoji: '📖', en: 'Learn one "Lesson A Day" from the Chofetz Chaim before bed.', he: 'למדו מדי יום שיעור אחד ("שיעור ליום") של החפץ חיים לפני השינה.' },
    { id: 'preset_danLekaf', emoji: '⚖️', en: 'Judge one person favorably (dan l\u2019kaf zechus) each day.', he: 'דונו אדם אחד לכף זכות בכל יום.' },
    { id: 'preset_oneGoodWord', emoji: '💛', en: 'Say something positive about another person each day.', he: 'אמרו דבר חיובי על אדם אחר בכל יום.' },
    { id: 'preset_pauseBeforeSpeak', emoji: '🤫', en: 'Pause and breathe before speaking when I feel upset.', he: 'עצרו ונשמו לפני שאתם מדברים כשאתם כועסים.' },
    { id: 'preset_noRechilus', emoji: '🚫', en: 'Refrain from rechilus (repeating what others said) for one full day.', he: 'הימנעו מרכילות (חזרה על דברי אחרים) במשך יום שלם.' },
    { id: 'preset_shabbosTable', emoji: '🕯️', en: 'Keep the Shabbos table conversation free of loshon hora.', he: 'שמרו על שיחת שולחן השבת נקייה מלשון הרע.' },
    { id: 'preset_chizukMessage', emoji: '📱', en: 'Send one message or call of chizuk to someone each day.', he: 'שלחו הודעה או התקשרו לחיזוק לאדם אחד בכל יום.' },
    { id: 'preset_changeSubject', emoji: '🔄', en: 'When loshon hora comes up, change the subject instead of joining.', he: 'כשעולה שיחת לשון הרע — הסיטו את הנושא במקום להצטרף.' }
];

const LOCAL_STORAGE_KEY = 'mm33_shmirasGoals';

// In-memory cache
let goalsState = []; // [{id, text, source:'preset'|'custom', createdAt, streak, longestStreak, lastCompleted, history:[dateISO...]}]

function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayIso() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function labelForPreset(preset) {
    const lang = currentLanguage || 'en';
    return `${preset.emoji} ${preset[lang] || preset.en}`;
}

function getPresetById(presetId) {
    return PRESET_GOALS.find(p => p.id === presetId);
}

async function loadGoals() {
    const user = auth?.currentUser;
    if (user) {
        try {
            const userRef = doc(db, 'users', user.uid);
            const snap = await getDoc(userRef);
            const data = snap.exists() ? snap.data() : {};
            goalsState = Array.isArray(data.shmirasGoals) ? data.shmirasGoals : [];
        } catch (err) {
            console.warn('Failed to load goals from Firestore, falling back to local:', err);
            goalsState = readLocal();
        }
    } else {
        goalsState = readLocal();
    }
    return goalsState;
}

function readLocal() {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeLocal() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(goalsState));
    } catch (err) {
        console.warn('Failed to save goals locally:', err);
    }
}

async function persistGoals() {
    writeLocal();
    const user = auth?.currentUser;
    if (!user) return;
    try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            await updateDoc(userRef, { shmirasGoals: goalsState });
        } else {
            await setDoc(userRef, { shmirasGoals: goalsState }, { merge: true });
        }
    } catch (err) {
        console.warn('Failed to save goals to Firestore:', err);
    }
}

function addPresetGoal(presetId) {
    const preset = getPresetById(presetId);
    if (!preset) return;
    if (goalsState.some(g => g.source === 'preset' && g.presetId === presetId)) return;
    goalsState.push({
        id: `${presetId}_${Date.now()}`,
        source: 'preset',
        presetId,
        text: preset.en,
        textHe: preset.he,
        emoji: preset.emoji,
        createdAt: new Date().toISOString(),
        streak: 0,
        longestStreak: 0,
        lastCompleted: null,
        history: []
    });
    persistGoals();
    renderGoals();
}

function addCustomGoal(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    goalsState.push({
        id: `custom_${Date.now()}`,
        source: 'custom',
        text: trimmed,
        emoji: '🎯',
        createdAt: new Date().toISOString(),
        streak: 0,
        longestStreak: 0,
        lastCompleted: null,
        history: []
    });
    persistGoals();
    renderGoals();
}

function removeGoal(goalId) {
    const idx = goalsState.findIndex(g => g.id === goalId);
    if (idx === -1) return;
    const confirmMsg = currentLanguage === 'he' ? 'להסיר את היעד הזה?' : 'Remove this goal?';
    if (!confirm(confirmMsg)) return;
    goalsState.splice(idx, 1);
    persistGoals();
    renderGoals();
}

function toggleTodayComplete(goalId) {
    const goal = goalsState.find(g => g.id === goalId);
    if (!goal) return;
    const today = todayIso();
    goal.history = Array.isArray(goal.history) ? goal.history : [];

    if (goal.history.includes(today)) {
        goal.history = goal.history.filter(d => d !== today);
        recomputeStreak(goal);
    } else {
        goal.history.push(today);
        if (goal.lastCompleted === yesterdayIso()) {
            goal.streak = (goal.streak || 0) + 1;
        } else {
            goal.streak = 1;
        }
        goal.lastCompleted = today;
        goal.longestStreak = Math.max(goal.longestStreak || 0, goal.streak);
    }
    persistGoals();
    renderGoals();
}

function recomputeStreak(goal) {
    const history = [...(goal.history || [])].sort();
    if (history.length === 0) {
        goal.streak = 0;
        goal.lastCompleted = null;
        return;
    }
    goal.lastCompleted = history[history.length - 1];
    // Walk backwards counting consecutive days ending at lastCompleted
    let streak = 1;
    for (let i = history.length - 2; i >= 0; i--) {
        const prev = new Date(history[i]);
        const next = new Date(history[i + 1]);
        const diffDays = Math.round((next - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }
    // If lastCompleted is not today or yesterday, streak is broken
    const last = goal.lastCompleted;
    if (last !== todayIso() && last !== yesterdayIso()) {
        streak = 0;
    }
    goal.streak = streak;
    goal.longestStreak = Math.max(goal.longestStreak || 0, streak);
}

function escapeHtmlGoals(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

function getGoalLabel(goal) {
    if (goal.source === 'preset') {
        const preset = getPresetById(goal.presetId);
        if (preset) return labelForPreset(preset);
        const lang = currentLanguage || 'en';
        const fallback = lang === 'he' && goal.textHe ? goal.textHe : goal.text;
        return `${goal.emoji || '🎯'} ${fallback}`;
    }
    return `${goal.emoji || '🎯'} ${goal.text}`;
}

function renderPresets() {
    const list = document.getElementById('goalsPresetsList');
    if (!list) return;
    list.innerHTML = '';
    PRESET_GOALS.forEach(preset => {
        const alreadyAdded = goalsState.some(g => g.source === 'preset' && g.presetId === preset.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'goal-preset-btn' + (alreadyAdded ? ' is-added' : '');
        btn.disabled = alreadyAdded;
        btn.innerHTML = `
            <span class="goal-preset-emoji" aria-hidden="true">${preset.emoji}</span>
            <span class="goal-preset-text">${escapeHtmlGoals(preset[currentLanguage] || preset.en)}</span>
            <span class="goal-preset-add">${alreadyAdded
                ? (currentLanguage === 'he' ? '✓ נוסף' : '✓ Added')
                : (currentLanguage === 'he' ? '+ הוסף' : '+ Add')}</span>
        `;
        btn.addEventListener('click', () => addPresetGoal(preset.id));
        list.appendChild(btn);
    });
}

function renderMyGoals() {
    const list = document.getElementById('myGoalsList');
    if (!list) return;
    list.innerHTML = '';
    if (goalsState.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty-state';
        p.setAttribute('data-i18n', 'goalsEmpty');
        p.textContent = currentLanguage === 'he'
            ? 'אין עדיין יעדים. בחרו יעד למעלה או הוסיפו יעד משלכם כדי להתחיל לעקוב.'
            : 'No goals yet. Pick one above or add your own to start tracking.';
        list.appendChild(p);
        return;
    }

    const today = todayIso();
    goalsState.forEach(goal => {
        const doneToday = Array.isArray(goal.history) && goal.history.includes(today);
        const card = document.createElement('div');
        card.className = 'my-goal-card' + (doneToday ? ' done-today' : '');

        const streak = goal.streak || 0;
        const longest = goal.longestStreak || 0;
        const totalDays = (goal.history || []).length;

        card.innerHTML = `
            <div class="my-goal-main">
                <label class="my-goal-check">
                    <input type="checkbox" ${doneToday ? 'checked' : ''} aria-label="Mark today complete">
                    <span class="my-goal-text">${escapeHtmlGoals(getGoalLabel(goal))}</span>
                </label>
                <button type="button" class="my-goal-remove" aria-label="${currentLanguage === 'he' ? 'הסר יעד' : 'Remove goal'}">✕</button>
            </div>
            <div class="my-goal-stats">
                <span class="my-goal-stat" title="${currentLanguage === 'he' ? 'רצף נוכחי' : 'Current streak'}">
                    🔥 <strong>${streak}</strong> <span>${currentLanguage === 'he' ? 'ימים רצופים' : 'day streak'}</span>
                </span>
                <span class="my-goal-stat" title="${currentLanguage === 'he' ? 'הרצף הארוך ביותר' : 'Longest streak'}">
                    🏆 <strong>${longest}</strong> <span>${currentLanguage === 'he' ? 'רצף שיא' : 'best'}</span>
                </span>
                <span class="my-goal-stat" title="${currentLanguage === 'he' ? 'סך הכול ימים' : 'Total days'}">
                    ✅ <strong>${totalDays}</strong> <span>${currentLanguage === 'he' ? 'סה״כ ימים' : 'total days'}</span>
                </span>
            </div>
        `;

        card.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTodayComplete(goal.id));
        card.querySelector('.my-goal-remove').addEventListener('click', () => removeGoal(goal.id));
        list.appendChild(card);
    });
}

function updateGuestNote() {
    const note = document.getElementById('goalsGuestNote');
    if (!note) return;
    const user = auth?.currentUser;
    note.classList.toggle('hidden', !!user);
}

export function renderGoals() {
    renderPresets();
    renderMyGoals();
    updateGuestNote();
}

export async function initGoals() {
    const section = document.getElementById('goalsSection');
    if (!section) return;

    await loadGoals();
    renderGoals();

    const form = document.getElementById('customGoalForm');
    const input = document.getElementById('customGoalInput');
    if (form && input) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addCustomGoal(input.value);
            input.value = '';
        });
    }

    // Re-render when auth state changes (load user data)
    if (auth) {
        let lastUid = auth.currentUser?.uid || null;
        auth.onAuthStateChanged(async (user) => {
            const uid = user?.uid || null;
            if (uid !== lastUid) {
                lastUid = uid;
                await loadGoals();
                renderGoals();
            } else {
                updateGuestNote();
            }
        });
    }

    // Re-render when language changes
    document.addEventListener('languageChanged', () => renderGoals());
}
