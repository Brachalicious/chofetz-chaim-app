import type { Handler } from '@netlify/functions';
import { generateChofetzChaimResponse } from '../../src/services/chofetzChaimBot.js';

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let body: { message?: unknown; language?: unknown } = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const { message, language } = body;

  if (!message || typeof message !== 'string') {
    return json(400, { error: 'Message is required and must be a string' });
  }

  const userLanguage = typeof language === 'string' ? language : 'en';

  try {
    const response = await generateChofetzChaimResponse(message.trim(), userLanguage);
    return json(200, {
      response,
      timestamp: new Date().toISOString(),
      type: 'chofetz-chaim-guidance'
    });
  } catch (error) {
    console.error('Error in Chofetz Chaim chat:', error);
    const fallback = userLanguage === 'he'
      ? 'ידידי היקר, יש לי קושי להגיב כרגע, אבל זכור - כל מילה ששומרים יקרה. יהי רצון שדיבורך היום יהיה מקור ברכה, לכבוד אחי יוסף ישראל מאיר, שמגלם את תורת החפץ חיים.'
      : "My dear friend, I'm having difficulty responding right now, but remember - every word we guard is precious. Let your speech today be a source of blessing, in honor of my brother Yosef Yisroel Meyer, who embodies the teachings of the Chofetz Chaim.";
    return json(500, { error: 'Failed to generate response', fallback });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    body: JSON.stringify(body)
  };
}

export { handler };
