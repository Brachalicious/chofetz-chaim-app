import type { Handler } from '@netlify/functions';
import { analyzeSpeechScenario } from '../../src/services/chofetzChaimBot.js';

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let body: { statement?: unknown; context?: unknown; language?: unknown } = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const { statement, context, language } = body;

  if (!statement || typeof statement !== 'string') {
    return json(400, { error: 'Statement is required and must be a string' });
  }

  try {
    const result = await analyzeSpeechScenario(
      statement.trim(),
      typeof context === 'string' ? context : '',
      typeof language === 'string' ? language : 'en'
    );
    return json(200, {
      ...result,
      timestamp: new Date().toISOString(),
      type: 'speech-lab-analysis'
    });
  } catch (error) {
    console.error('Error in Speech Lab analysis:', error);
    return json(500, {
      error: 'Failed to analyze speech scenario',
      fallback: {
        riskLevel: 'caution',
        reason: 'Unable to evaluate this right now. Please proceed carefully.',
        saferRewrite: 'Let me share this in a way that protects dignity and avoids harm.',
        actionStep: 'Pause and consult a qualified rabbi if this is halachically sensitive.'
      }
    });
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
