import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chofetzChaimRouter from './routes/chofetzChaim.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', chofetzChaimRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Chofetz Chaim Shmiras HaLashon App',
    dedication: {
      yosefYisroelMeyer: 'In honor of my brother Yosef Yisroel Meyer, who embodies the teachings of the Chofetz Chaim',
      simaShulman: 'In honor of my best friend Sima Shulman for letting me borrow her copy of "A Lesson A Day" which started me on my journey of purifying my own speech and getting closer to G-d through it. May all of their tefilot be answered and may they reap infinite merit upon any and all learning that is done via this app! ❤️'
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Chofetz Chaim Shmiras HaLashon App',
    dedication: 'In honor of my brother Yosef Yisroel Meyer, who embodies the teachings of the Chofetz Chaim',
    endpoints: {
      chat: 'POST /api/chofetz-chaim/chat',
      dailyEncouragement: 'GET /api/chofetz-chaim/daily-encouragement',
      health: 'GET /health'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🕊️  Chofetz Chaim Shmiras HaLashon App');
  console.log('📖 In honor of my brother Yosef Yisroel Meyer');
  console.log('   Named after the Chofetz Chaim');
  console.log('   A pure example of loving kindness and pure speech');
  console.log('');
  console.log('💝 In honor of my best friend Sima Shulman');
  console.log('   For letting me borrow her copy of "A Lesson A Day"');
  console.log('   which started me on my journey of purifying my own');
  console.log('   speech and getting closer to G-d through it.');
  console.log('   May all of their tefilot be answered and may they');
  console.log('   reap infinite merit upon any and all learning');
  console.log('   that is done via this app! ❤️');
  console.log('='.repeat(60));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/chofetz-chaim/chat`);
  console.log(`   GET  http://localhost:${PORT}/api/chofetz-chaim/daily-encouragement`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not set in environment variables');
    console.warn('   Please add your OpenAI API key to .env file');
  }
});

export default app;
