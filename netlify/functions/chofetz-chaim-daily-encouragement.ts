import type { Handler } from '@netlify/functions';
import { generateDailyEncouragement } from '../../src/services/chofetzChaimBot.js';

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const encouragement = await generateDailyEncouragement();
    return json(200, {
      encouragement,
      timestamp: new Date().toISOString(),
      type: 'daily-shmiras-halashon-encouragement'
    });
  } catch (error) {
    console.error('Error generating daily encouragement:', error);
    return json(500, {
      error: 'Failed to generate encouragement',
      fallback:
        'Good morning! Today is a beautiful opportunity to practice Shmiras HaLashon. May your words bring only blessing and light to the world, in honor of my brother Yosef Yisroel Meyer, who embodies the teachings of the Chofetz Chaim.'
    });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
