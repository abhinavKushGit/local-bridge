import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { pool } from './config';
import { connectRedis } from './config/redis';
import { initFirebase } from './config/firebase';
import { initSockets } from './sockets';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connected');

    await connectRedis();
    initFirebase();

    const server = http.createServer(app);

    // Wire socket.io to the HTTP server
    const io = new Server(server, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
      transports: ['websocket', 'polling'],
    });

    initSockets(io);

    server.listen(PORT, () => {
      logger.info(`LocalBridge API running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
    });

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
