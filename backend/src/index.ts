import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/database';
import { setupSocketHandlers } from './sockets/handlers';
import { SessionService } from './services/SessionService';
import { ExportService } from './services/ExportService';
import { v4 as uuidv4 } from 'uuid';
import { TemplateType, SessionSettings, TEMPLATES, SessionStatus, SessionSummary } from '../../shared/types';
import { SessionModel } from './models/Session';
import { SessionParticipantModel } from './models/SessionParticipant';
import { CardModel } from './models/Card';
import { ActionItemModel } from './models/ActionItem';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration - allow localhost and Docker network IPs
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CORS_ORIGIN,
  ...(process.env.CORS_ADDITIONAL_ORIGINS || '').split(',').filter(Boolean)
].filter(Boolean) as string[];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow all origins if CORS_ALLOW_ALL is set
      if (process.env.CORS_ALLOW_ALL === 'true') {
        return callback(null, true);
      }

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
    // Allow all origins if CORS_ALLOW_ALL is set
    if (process.env.CORS_ALLOW_ALL === 'true') {
      return callback(null, true);
    }

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

// List user's sessions (requires userId query parameter)
app.get('/api/sessions', (req, res) => {
  try {
    const userId = req.query.userId as string;
    const status = req.query.status as SessionStatus | undefined;
    const search = req.query.search as string | undefined;

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    // Get sessions where user participated
    const sessions = SessionModel.searchSessions(userId, search, status);

    // Build session summaries with counts
    const summaries: SessionSummary[] = sessions.map(session => {
      const participantCount = SessionParticipantModel.getParticipantCount(session.id);
      const cardCount = CardModel.findBySessionId(session.id).length;
      const actionItemCount = ActionItemModel.findBySessionId(session.id).length;

      return {
        id: session.id,
        name: session.name,
        stage: session.stage,
        status: session.status,
        participantCount,
        cardCount,
        actionItemCount,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        completedAt: session.completedAt
      };
    });

    res.json(summaries);
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session history/details (full data including cards, votes, etc.)
app.get('/api/sessions/:id/history', (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    // Security check: verify user participated in this session
    const participated = SessionParticipantModel.exists(sessionId, userId);
    if (!participated) {
      return res.status(403).json({ error: 'Access denied: you did not participate in this session' });
    }

    const sessionState = SessionService.getSessionState(sessionId);
    if (!sessionState) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Remove sensitive data (API tokens) from response
    const sanitizedSession = {
      ...sessionState.session,
      shortcutApiToken: undefined
    };

    res.json({
      ...sessionState,
      session: sanitizedSession
    });
  } catch (error: any) {
    console.error('Error fetching session history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export session to markdown
app.post('/api/sessions/:id/export', (req, res) => {
  try {
    const sessionId = req.params.id;
    const markdown = ExportService.exportToMarkdown(sessionId);

    if (!markdown) {
      return res.status(404).json({ error: 'Session not found or has no content' });
    }

    res.json({ markdown });
  } catch (error: any) {
    console.error('Error exporting session:', error);
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
