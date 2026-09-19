require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');
const researchRoutes = require('./routes/research');
const opensourceRoutes = require('./routes/opensource');
const contestRoutes = require('./routes/contests');
const jobRoutes = require('./routes/jobs');
const marketRoutes = require('./routes/market');

const { updateContestCache } = require('./utils/contestFetcher');

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/opensource', opensourceRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/market', marketRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'InnovateX Express Backend' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/innovatex';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('[Database] Connected to MongoDB.');

    // Initial contest fetch on startup
    try {
      await updateContestCache();
    } catch (err) {
      console.warn('[Startup] Contest cache initial load warning:', err.message);
    }

    // Schedule contest cache refresh every 6 hours: at minute 0 past every 6th hour
    cron.schedule('0 */6 * * *', async () => {
      console.log('[Cron] Running scheduled 6-hour contest cache update...');
      try {
        await updateContestCache();
      } catch (err) {
        console.error('[Cron] Contest cache refresh error:', err.message);
      }
    });

    app.listen(PORT, () => {
      console.log(`[Server] InnovateX Express backend running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('[Database] MongoDB connection error:', err);
    // Still start server to allow testing other components if mongo is initially offline
    app.listen(PORT, () => {
      console.log(`[Server] InnovateX Express backend running without Mongo on http://localhost:${PORT}`);
    });
  });
