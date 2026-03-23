import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { pool } from './config';
import { connectRedis } from './config/redis';
import { initFirebase } from './config/firebase';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    logger.info('Database connected');

    // Connect Redis
    await connectRedis();

    // Init Firebase (safe — won't throw if not configured)
    initFirebase();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`LocalBridge API running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received — shutting down');
      server.close(() => process.exit(0));
    });

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
