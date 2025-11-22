import dotenv from 'dotenv';
import express from 'express';
import handler from './api/solve-tower.js';

// Load .env.local file
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(express.json());

// Wrap Vercel handler for Express
app.post('/api/solve-tower', async (req, res) => {
  await handler(req as any, res as any);
});

app.listen(PORT, () => {
  console.log(`Dev API server running on http://localhost:${PORT}`);
});
