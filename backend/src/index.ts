import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/database';
import { setupSocketHandlers } from './sockets/handlers';
import { SessionService } from './services/SessionService';
import { v4 as uuidv4 } from 'uuid';
import { TemplateType, SessionSettings, TEMPLATES } from '../../shared/types';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration - allow localhost and Docker network IPs
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CORS_ORIGIN
].filter(Boolean) as string[];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Allow localhost, LAN IPs (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
      const isLAN = origin.match(/http:\/\/(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+):\d+/);

      if (isLocalhost || isLAN) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin
    if (!origin) return callback(null, true);

    // Allow localhost, LAN IPs (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isLAN = origin.match(/http:\/\/(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+):\d+/);

    if (isLocalhost || isLAN) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Initialize database
initDatabase();

// Setup socket handlers
setupSocketHandlers(io);

// REST API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Create new session
app.post('/api/sessions', (req, res) => {
  try {
    const { name, template, timerDuration, votesPerUser, iceBreaker } = req.body;

    if (!template || !Object.values(TemplateType).includes(template)) {
      return res.status(400).json({ error: 'Invalid template' });
    }

    const templateConfig = TEMPLATES[template as TemplateType];
    const hostId = uuidv4();

    const settings: SessionSettings = {
      template: template as TemplateType,
      columns: templateConfig.columns,
      timerDuration: timerDuration || 300,
      votesPerUser: votesPerUser || 3,
      allowAnonymous: true,
      iceBreaker: iceBreaker || 'Share something interesting about your week'
    };

    const sessionName = name || 'Sprint Retrospective';
    const session = SessionService.createSession(hostId, sessionName, settings);

    res.json({
      sessionId: session.id,
      hostId: hostId,
      url: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/session/${session.id}`
    });
  } catch (error: any) {
    console.error('❌ Error creating session:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Get session info
app.get('/api/sessions/:id', (req, res) => {
  try {
    const session = SessionService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup old sessions periodically
const cleanupInterval = parseInt(process.env.SESSION_CLEANUP_INTERVAL || '3600000');
setInterval(() => {
  const deleted = SessionService.cleanupOldSessions();
  if (deleted > 0) {
    console.log(`Cleaned up ${deleted} old sessions`);
  }
}, cleanupInterval);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: localhost and LAN networks (10.x.x.x, 172.16-31.x.x, 192.168.x.x)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
