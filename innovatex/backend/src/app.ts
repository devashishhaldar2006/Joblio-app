import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import cron from 'node-cron';

import authRoutes from './routes/auth.js';
import githubRoutes from './routes/github.js';
import opensourceRoutes from './routes/opensource.js';
import contestRoutes from './routes/contests.js';
import jobRoutes from './routes/jobs.js';
import marketRoutes from './routes/market.js';
import reportRoutes from './routes/reports.js';
import legalRoutes from './routes/legal.js';

import { updateContestCache } from './utils/contestFetcher.js';

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/opensource', opensourceRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/legal', legalRoutes);
app.use('/', legalRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Joblio Express TypeScript Backend' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/joblio';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('[Database] Connected to MongoDB.');

    // Initial contest fetch on startup
    try {
      await updateContestCache();
    } catch (err: any) {
      console.warn('[Startup] Contest cache initial load warning:', err.message);
    }

    // Schedule contest cache refresh every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('[Cron] Running scheduled 6-hour contest cache update...');
      try {
        await updateContestCache();
      } catch (err: any) {
        console.error('[Cron] Contest cache refresh error:', err.message);
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Joblio Express TypeScript backend running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('[Database] MongoDB connection error:', err);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Joblio Express TypeScript backend running without Mongo on http://0.0.0.0:${PORT}`);
    });
  });

export default app;
