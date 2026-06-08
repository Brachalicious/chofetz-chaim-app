import OpenAI from 'openai';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Initialize OpenAI client lazily to ensure env vars are loaded
let openai: OpenAI;
let lessonCache: LessonRecord[] | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

interface LessonRecord {
  day: number;
  title: string;
  date: string;
  content: string;
  link: string;
}

interface LessonsPayload {
  lessons?: Array<{
    title?: { rendered?: string };
    date?: string;
    content?: { rendered?: string };
    link?: string;
  }>;
}

const CHOFETZ_CHAIM_SYSTEM_PROMPT = `You are a warm, compassionate Torah teacher specializing in the teachings of the Chofetz Chaim on Shmiras HaLashon (guarding one's speech), based on official Chofetz Chaim Heritage Foundation materials and "A Lesson A Day" series.

CORE TEACHING PRINCIPLES:
- Base all guidance on the Chofetz Chaim's sefarim: "Chofetz Chaim" (laws of lashon hara) and "Shmiras HaLashon" (hashkafa/philosophy)
- Follow the structure of "A Lesson A Day: Shmiras HaLashon" published by Chofetz Chaim Heritage Foundation
- Include daily halachos (Jewish law) with practical applications
- Emphasize the segulos (spiritual benefits) of guarding one's speech

KEY TEACHING FROM SHEMIRAT HALASHON, BOOK II, CHAPTER 1:
"If one 'abandons' his mouth, he is likely to lose all of his mitzvoth."

The Chofetz Chaim teaches through the analogy of Mishlei 13:7: Just as in business, one can accumulate great wealth yet find that damages offset all profits leaving nothing—so too in spiritual matters. A person may perform many mitzvoth and good deeds, but if they have the evil trait of speaking lashon hara about others, when they come to the higher world, they will find that all the vines and plants they planted in Gan Eden through their good deeds have been covered with thorns and nettles from their forbidden speech.

From the Holy Zohar (Parshat Pekudei): "Unclean spirits take that unclean word, and when one subsequently utters words of holiness, those unclean spirits come forward and take that unclean speech and defile the holy speech, so that the speaker is not credited with it, and the holy power is weakened, as it were."

King Solomon teaches (Mishlei 13:3): "One who widens his lips—it is 'breaking' for him." The GRA explains: "One who widens his lips in lashon hara, though he has a good soul, and though he has done many mitzvoth and built many 'fences,' his mouth will break everything."

REMEDY & TESHUVAH:
The man of heart who wishes to amend his deeds must first build a fence for his vineyard—put an extra-strong guard upon his mouth and tongue. He must:
1. Uproot the thorns from his vineyard by conciliating those he wronged with his tongue
2. Confess before Hashem for transgressing His will
3. Do teshuvah out of love, which transforms sins into merits

Everyone has a distinct vineyard in Gan Eden (as written: "A man goes to his eternal house"). We must take special care to plant it with pleasing growths and guard it that it not spoil.

THE LAWS YOU TEACH:
1. Lashon Hara - speaking negatively about others (even if true)
2. Rechilus - gossip/tale-bearing that causes discord
3. Motzi Shem Ra - spreading false information
4. Ona'as Devarim - hurtful words
5. The positive commandment to judge favorably (dan l'kaf zechus)

IMPORTANT QUOTE TO SHARE:
"There is no family in the world that has started learning 2 halachos of shmiras halashon a day and has not seen a yeshua" - The Manchester Rosh Yeshiva

Your role is to:
- ALWAYS begin every response with "Shalom Aleichem, dear friend!" to create a warm, personal connection
- Provide gentle, practical guidance on speech ethics based on authentic Torah sources
- Quote specific teachings from Chofetz Chaim's works (cite chapter/section when relevant)
- Help people understand both the letter and spirit of these laws
- Share practical strategies that worked for the Chofetz Chaim himself
- Include the daily lesson format: one halacha + one inspiring thought
- Emphasize how shmiras halashon brings yeshuos (salvations), parnassah (livelihood), and shalom bayis (peace in the home)
- Always respond with warmth, understanding, and respect
- Keep answers accessible while maintaining Torah authenticity

CRITICAL: ALWAYS PROVIDE CLICKABLE SOURCES
For every teaching, law, or quote you mention, provide a clickable Sefaria.org link using this format:
- For Mishlei: [Mishlei 13:7](https://www.sefaria.org/Mishlei.13.7)
- For Shemirat HaLashon: [Shemirat HaLashon, Book II, Chapter 1](https://www.sefaria.org/Shemirat_HaLashon,_Book_II.1)
- For Chofetz Chaim: [Chofetz Chaim, Part 1, Chapter 3](https://www.sefaria.org/Chafetz_Chaim,_Part_One,_The_Prohibition_Against_Lashon_Hara.3)
- For Tanakh: [Devarim 24:9](https://www.sefaria.org/Deuteronomy.24.9)
- For Talmud: [Arachin 15b](https://www.sefaria.org/Arachin.15b)
- For Zohar by parsha (REQUIRED): Sefaria uses an underscore where the title has a comma. NEVER link only to https://www.sefaria.org/Zohar for a passage in a specific parsha—that opens the whole work, not the passage. Always include the parsha in the path, e.g. [Zohar, Pekudei](https://www.sefaria.org/Zohar,_Pekudei), [Zohar, Bereshit](https://www.sefaria.org/Zohar,_Bereshit), [Zohar, Noach](https://www.sefaria.org/Zohar,_Noach). For a numbered section within the parsha, append it: [Zohar, Pekudei 1](https://www.sefaria.org/Zohar,_Pekudei.1)

Always format links as: [Source Name](https://www.sefaria.org/Source_URL)
This allows readers to click and learn directly from the original sefarim.

This service is dedicated:

In honor of my brother Yosef Yisroel Meyer, who was named after the Chofetz Chaim and exemplifies loving kindness, pure speech, and giving others the benefit of the doubt.

In honor of my best friend Sima Shulman for letting me borrow her copy of "A Lesson A Day" which started me on my journey of purifying my own speech and getting closer to G-d through it. May all of their tefilot be answered and may they reap infinite merit upon any and all learning that is done via this app! ❤️

Infuse your responses with the spirit of elevating speech as a way to bring blessing to the world.

When answering:
1. Start with a relevant halacha (law) from the Chofetz Chaim
2. Explain it practically with real-life examples
3. Add an inspiring perspective on the spiritual benefits
4. End with encouragement and actionable steps

When unsure about specific halachic details, err on the side of stringency and encourage consulting with a qualified rabbi.`;

/** Sefaria root /Zohar does not open a parsha; fix [Zohar, Parsha](.../Zohar) → .../Zohar,_Parsha */
function normalizeSefariaZoharLinks(text: string): string {
  if (!text) return text;
  return text.replace(
    /\[Zohar,\s*([A-Za-z]+)\]\(https?:\/\/www\.sefaria\.org\/Zohar\/?\)/gi,
    (_, rawParsha: string) => {
      const parsha = rawParsha.charAt(0).toUpperCase() + rawParsha.slice(1).toLowerCase();
      return `[Zohar, ${parsha}](https://www.sefaria.org/Zohar,_${parsha})`;
    }
  );
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadDailyCompanionLessons(): Promise<LessonRecord[]> {
  if (lessonCache) return lessonCache;

  try {
    const currentFile = fileURLToPath(import.meta.url);
    const lessonsPath = path.resolve(path.dirname(currentFile), '../../public/cchf-lessons.json');
    const raw = await readFile(lessonsPath, 'utf-8');
    const parsed = JSON.parse(raw) as LessonsPayload;
    const lessons = Array.isArray(parsed.lessons) ? parsed.lessons : [];

    lessonCache = lessons
      .map((lesson, idx) => ({
        day: idx + 1,
        title: stripHtml(lesson?.title?.rendered || `Day ${idx + 1}`),
        date: lesson?.date || '',
        content: stripHtml(lesson?.content?.rendered || ''),
        link: lesson?.link || ''
      }))
      .filter((lesson) => lesson.content.length > 0);

    return lessonCache;
  } catch (error) {
    console.warn('Unable to load bundled Daily Companion lessons for grounding:', error);
    lessonCache = [];
    return lessonCache;
  }
}

function getRelevantLessons(lessons: LessonRecord[], userMessage: string, limit: number = 5): LessonRecord[] {
  const normalizedMessage = stripHtml(userMessage).toLowerCase();
  const terms = [...new Set(normalizedMessage.split(/[^a-zA-Zא-ת']+/).filter((t) => t.length >= 3))];

  const scored = lessons.map((lesson) => {
    const haystack = `${lesson.title} ${lesson.content}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) score += 4;
      if (lesson.title.toLowerCase().includes(term)) score += 6;
    }
    // Keep recent lessons slightly preferred in tie-breaks
    score += lesson.day / 1000;
    return { lesson, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored.filter((x) => x.score > 0).slice(0, limit).map((x) => x.lesson);
  if (best.length) return best;

  // If there is no keyword match, provide recent lessons for general grounding.
  return lessons.slice(-limit).reverse();
}

function buildLessonContextBlock(lessons: LessonRecord[]): string {
  return lessons
    .map((lesson) => {
      const excerpt = lesson.content.slice(0, 700);
      return [
        `Day ${lesson.day}: ${lesson.title}`,
        `Date: ${lesson.date || 'Unknown'}`,
        `Source link: ${lesson.link || 'N/A'}`,
        `Excerpt: ${excerpt}`
      ].join('\n');
    })
    .join('\n\n---\n\n');
}

function hasReferencesHeading(text: string): boolean {
  return /\n#{0,3}\s*references\b/i.test(text) || /\n#{0,3}\s*מקורות\b/i.test(text);
}

function buildGuaranteedReferencesBlock(lessons: LessonRecord[], language: string): string {
  const chosen = lessons.slice(0, 3).filter((lesson) => !!lesson.link);
  if (!chosen.length) return '';

  const heading = language === 'he' ? '## מקורות' : '## References';
  const lines = chosen.map((lesson) => {
    const label = language === 'he'
      ? `יום ${lesson.day}: ${lesson.title}`
      : `Day ${lesson.day}: ${lesson.title}`;
    return `- [${label}](${lesson.link})`;
  });

  const halachaNote = language === 'he'
    ? `\n> הערה הלכתית: מענה זה נועד להדרכה לימודית ואינו פסיקה. לשאלת הלכה מעשית יש לפנות לרב מוסמך.`
    : `\n> Halachic note: This guidance is educational and not final psak. For practical rulings, consult a qualified rav.`;

  return `\n\n${heading}\n${lines.join('\n')}${halachaNote}`;
}

function ensureGroundedReferences(
  modelResponse: string,
  lessons: LessonRecord[],
  language: string
): string {
  const trimmed = (modelResponse || '').trim();
  if (!trimmed) return trimmed;

  const guaranteedBlock = buildGuaranteedReferencesBlock(lessons, language);
  if (!guaranteedBlock) return trimmed;

  if (hasReferencesHeading(trimmed)) {
    const hasAnyLessonLink = lessons.some((lesson) => lesson.link && trimmed.includes(lesson.link));
    return hasAnyLessonLink ? trimmed : `${trimmed}${guaranteedBlock}`;
  }

  return `${trimmed}${guaranteedBlock}`;
}

/**
 * Generate a response from the Chofetz Chaim bot
 */
export async function generateChofetzChaimResponse(userMessage: string, language: string = 'en'): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`🤖 Calling OpenAI API for Chofetz Chaim guidance in ${language}...`);
    
    // Add language instruction to the system prompt
    const languageInstruction = language === 'he' 
      ? '\n\nIMPORTANT: The user prefers Hebrew (עברית). Please respond ENTIRELY in Hebrew, including all teachings, explanations, and quotes. Use proper Hebrew grammar and expressions. You may include English transliterations of Hebrew terms in parentheses when helpful.'
      : '\n\nIMPORTANT: The user prefers English. Please respond in English, but include Hebrew terms when appropriate (with transliterations).';
    
    const fullSystemPrompt = CHOFETZ_CHAIM_SYSTEM_PROMPT + languageInstruction;
    
    const lessons = await loadDailyCompanionLessons();
    const relevantLessons = getRelevantLessons(lessons, userMessage, 5);
    const lessonContext = buildLessonContextBlock(relevantLessons);

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${fullSystemPrompt}

ADDITIONAL REQUIREMENTS FOR THIS RESPONSE:
- Ground the answer in the provided Daily Companion excerpts.
- Include 2-4 explicit references under a "References" section.
- At least one reference must be a Daily Companion lesson link from the provided context.
- Do not fabricate sources or links.
- If exact halachic ruling is uncertain, clearly say this is guidance and advise asking a qualified rav for psak.`
        },
        {
          role: "system",
          content: `DAILY COMPANION CONTEXT (from cchf-lessons.json):
${lessonContext || 'No local lesson context available.'}`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content || 
      (language === 'he' 
        ? "אני מתנצל, אבל יש לי בעיה לנסח תשובה. אנא נסח מחדש את שאלתך."
        : "I apologize, but I'm having trouble formulating a response. Please try rephrasing your question.");

    const responseWithGuaranteedReferences = ensureGroundedReferences(response, relevantLessons, language);
    return normalizeSefariaZoharLinks(responseWithGuaranteedReferences);

  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    
    if (error?.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    }
    
    throw new Error(`Failed to generate response: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Generate daily encouragement for Shmiras HaLashon practice
 */
export async function generateDailyEncouragement(): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompts = [
      "Share an inspiring short teaching about the power of positive speech from the Chofetz Chaim's writings.",
      "Provide a brief, practical tip for guarding one's speech today, inspired by the Chofetz Chaim.",
      "Share an uplifting message about how careful speech brings blessing into the world.",
      "Offer a gentle reminder about the importance of Shmiras HaLashon with a practical example.",
      "Share a powerful insight from the Chofetz Chaim about how our words shape our reality."
    ];

    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${CHOFETZ_CHAIM_SYSTEM_PROMPT}\n\nProvide brief, inspiring daily messages (2-4 sentences) that encourage the practice of Shmiras HaLashon. Always end with "In honor of my brother Yosef Yisroel Meyer, who embodies the teachings of the Chofetz Chaim."`
        },
        {
          role: "user",
          content: randomPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 250,
    });

    const encouragement = completion.choices[0]?.message?.content || 
      `Today, let each word you speak be measured and kind. The Chofetz Chaim teaches that guarding our speech is one of the most powerful mitzvos we can perform. In honor of my brother Yosef Yisroel Meyer, who embodies the teachings of the Chofetz Chaim.`;

    return normalizeSefariaZoharLinks(encouragement);

  } catch (error: any) {
    console.error('Error generating daily encouragement:', error);
    throw error;
  }
}

/**
 * Generate human-like speech audio for bot responses.
 */
export async function synthesizeHumanSpeech(text: string, language: string = 'en'): Promise<Buffer> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const cleanedText = text
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/[#*_`~>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);

    if (!cleanedText) {
      throw new Error('No text provided for speech synthesis');
    }

    const speech = await getOpenAIClient().audio.speech.create({
      model: 'tts-1-hd',
      voice: language === 'he' ? 'nova' : 'shimmer',
      input: cleanedText,
      response_format: 'mp3'
    });

    const arrayBuffer = await speech.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    console.error('Error generating speech audio:', error);
    throw new Error(`Failed to generate speech audio: ${error?.message || 'Unknown error'}`);
  }
}

export interface SpeechLabResult {
  riskLevel: 'safe' | 'caution' | 'likely-lashon-hara';
  reason: string;
  saferRewrite: string;
  actionStep: string;
}

/**
 * Analyze planned speech and offer a safer rewrite.
 */
export async function analyzeSpeechScenario(
  statement: string,
  context: string = '',
  language: string = 'en'
): Promise<SpeechLabResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const languageInstruction = language === 'he'
      ? 'Respond in Hebrew with clear and gentle language.'
      : 'Respond in English with clear and gentle language.';

    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a Shmiras HaLashon speech coach grounded in Chofetz Chaim principles.
Return STRICT JSON with keys:
- riskLevel: one of "safe", "caution", "likely-lashon-hara"
- reason: short explanation
- saferRewrite: respectful alternative sentence
- actionStep: one practical next step

Guidelines:
- Do not issue formal psak halacha.
- If uncertain, recommend asking a qualified rabbi.
- Keep tone warm and constructive.
- ${languageInstruction}`
        },
        {
          role: 'user',
          content: `Planned statement: "${statement}"\nContext: "${context || 'No additional context provided.'}"`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error('No response content from model');
    }

    const parsed = JSON.parse(raw) as Partial<SpeechLabResult>;
    const riskLevel = parsed.riskLevel;

    if (riskLevel !== 'safe' && riskLevel !== 'caution' && riskLevel !== 'likely-lashon-hara') {
      throw new Error('Invalid risk level received from model');
    }

    return {
      riskLevel,
      reason: parsed.reason || (language === 'he' ? 'נדרשת זהירות בניסוח.' : 'Use extra care with phrasing.'),
      saferRewrite: parsed.saferRewrite || (language === 'he' ? 'אנסח זאת בעדינות וללא פרטים שליליים.' : 'I will phrase this gently without negative details.'),
      actionStep: parsed.actionStep || (language === 'he' ? 'עצור לנשימה אחת לפני הדיבור.' : 'Pause for one breath before speaking.')
    };
  } catch (error: any) {
    console.error('Error analyzing speech scenario:', error);
    throw new Error(`Failed to analyze speech: ${error?.message || 'Unknown error'}`);
  }
}
