import type { Handler } from '@netlify/functions';
import { synthesizeHumanSpeech } from '../../src/services/chofetzChaimBot.js';

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let body: { text?: unknown; language?: unknown } = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const { text, language } = body;

  if (!text || typeof text !== 'string') {
    return json(400, { error: 'Text is required and must be a string' });
  }

  try {
    const audio = await synthesizeHumanSpeech(
      text,
      typeof language === 'string' ? language : 'en'
    );

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store'
      },
      body: audio.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error generating speech audio:', error);
    return json(500, { error: 'Failed to generate speech audio' });
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
