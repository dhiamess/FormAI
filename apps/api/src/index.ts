import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import formsRoutes from './routes/forms.routes';
import submissionsRoutes from './routes/submissions.routes';
import usersRoutes from './routes/users.routes';
import groupsRoutes from './routes/groups.routes';
import connectionsRoutes from './routes/connections.routes';

const app = express();
const httpServer = createServer(app);

// Socket.io
const io = new SocketServer(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/forms', submissionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/connections', connectionsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'FormAI API is running' });
});

// Error handler
app.use(errorHandler);

// Socket.io events
io.on('connection', (socket) => {
  logger.debug('Client connected', { socketId: socket.id });

  socket.on('join-form', (formId: string) => {
    socket.join(`form-${formId}`);
  });

  socket.on('disconnect', () => {
    logger.debug('Client disconnected', { socketId: socket.id });
  });
});

// Export io for use in other modules
export { io };

// Start server
async function start() {
  await connectDatabase();

  httpServer.listen(env.PORT, () => {
    logger.info(`FormAI API running on port ${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });
}

start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
