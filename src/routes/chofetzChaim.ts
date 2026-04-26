import express from 'express';
import { generateChofetzChaimResponse, generateDailyEncouragement, analyzeSpeechScenario } from '../services/chofetzChaimBot.js';

const router = express.Router();

// Route for Chofetz Chaim chatbot
router.post('/chofetz-chaim/chat', async (req: any, res: any) => {
  try {
    console.log('📞 Chofetz Chaim chat request received:', req.body);
    const { message, language } = req.body;
    
    if (!message || typeof message !== 'string') {
      console.log('❌ Invalid message format');
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }

    const userLanguage = language || 'en';
    console.log(`🤖 Calling Chofetz Chaim bot with message in ${userLanguage}:`, message.trim());
    const response = await generateChofetzChaimResponse(message.trim(), userLanguage);
    
    console.log('✅ Chofetz Chaim response generated, length:', response.length);
    res.json({ 
      response,
      timestamp: new Date().toISOString(),
      type: 'chofetz-chaim-guidance'
    });
    
  } catch (error) {
    console.error('❌ Error in Chofetz Chaim chat:', error);
    const fallbackMessage = req.body.language === 'he'
      ? 'ידידי היקר, יש לי קושי להגיב כרגע, אבל זכור - כל מילה ששומרים יקרה. יהי רצון שדיבורך היום יהיה מקור ברכה, לכבוד אחי יוסף ישראל מאיר, שמגלם את תורת החפץ חיים.'
      : `My dear friend, I'm having difficulty responding right now, but remember - every word we guard is precious. Let your speech today be a source of blessing, in honor of my brother Yosef Yisroel Meyer, who embodies the teachings of the Chofetz Chaim.`;
    
    res.status(500).json({ 
      error: 'Failed to generate response',
      fallback: fallbackMessage
    });
  }
});

// Route for daily encouragement
router.get('/chofetz-chaim/daily-encouragement', async (req: any, res: any) => {
  try {
    const encouragement = await generateDailyEncouragement();
    
    res.json({ 
      encouragement,
      timestamp: new Date().toISOString(),
      type: 'daily-shmiras-halashon-encouragement'
    });
    
  } catch (error) {
    console.error('Error generating daily encouragement:', error);
    res.status(500).json({ 
      error: 'Failed to generate encouragement',
      fallback: `Good morning! Today is a beautiful opportunity to practice Shmiras HaLashon. May your words bring only blessing and light to the world, in honor of my brother Yosef Yisroel Meyer, who embodies the teachings of the Chofetz Chaim.`
    });
  }
});

// Route for Speech Lab analysis
router.post('/chofetz-chaim/speech-lab', async (req: any, res: any) => {
  try {
    const { statement, context, language } = req.body;

    if (!statement || typeof statement !== 'string') {
      return res.status(400).json({
        error: 'Statement is required and must be a string'
      });
    }

    const result = await analyzeSpeechScenario(statement.trim(), context || '', language || 'en');

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      type: 'speech-lab-analysis'
    });
  } catch (error) {
    console.error('❌ Error in Speech Lab analysis:', error);
    res.status(500).json({
      error: 'Failed to analyze speech scenario',
      fallback: {
        riskLevel: 'caution',
        reason: 'Unable to evaluate this right now. Please proceed carefully.',
        saferRewrite: 'Let me share this in a way that protects dignity and avoids harm.',
        actionStep: 'Pause and consult a qualified rabbi if this is halachically sensitive.'
      }
    });
  }
});

export default router;
