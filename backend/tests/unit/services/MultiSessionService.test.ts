/**
 * Unit tests for Multi-Session Support Service
 * Tests: session queries, user history, security isolation
 */

import { Database } from 'better-sqlite3';
import { SessionModel } from '../../../src/models/Session';
import { UserModel } from '../../../src/models/User';
import { CardModel } from '../../../src/models/Card';
import { ActionItemModel } from '../../../src/models/ActionItem';
import { MultiSessionService } from '../../../src/services/MultiSessionService';
import { cleanupDatabase, createMockSession, createMockUser, createMockCard } from '../../setup';
import { getDatabase } from '../../../src/db/database';

describe('MultiSessionService', () => {
  let db: Database;
  let service: MultiSessionService;

  beforeAll(() => {
    db = getDatabase();
  });

  beforeEach(() => {
    cleanupDatabase(db);
    service = new MultiSessionService();
  });

  describe('User Session History', () => {
    it('should get all sessions a user has participated in', () => {
      const userId = 'user-1';

      // Create multiple sessions with user
      const session1 = createMockSession({ id: 'session-1' });
      const session2 = createMockSession({ id: 'session-2' });
      const session3 = createMockSession({ id: 'session-3' });

      SessionModel.create(session1);
      SessionModel.create(session2);
      SessionModel.create(session3);

      UserModel.create(createMockUser({ sessionId: session1.id, id: userId }));
      UserModel.create(createMockUser({ sessionId: session2.id, id: userId }));
      // User not in session3

      const userSessions = service.getUserSessionHistory(userId);

      expect(userSessions).toHaveLength(2);
      expect(userSessions.map(s => s.id)).toContain(session1.id);
      expect(userSessions.map(s => s.id)).toContain(session2.id);
      expect(userSessions.map(s => s.id)).not.toContain(session3.id);
    });

    it('should order sessions by most recent first', () => {
      const userId = 'user-1';
      const now = Date.now();

      const session1 = createMockSession({
        id: 'session-1',
        createdAt: now - 3000,
      });
      const session2 = createMockSession({
        id: 'session-2',
        createdAt: now - 1000,
      });
      const session3 = createMockSession({
        id: 'session-3',
        createdAt: now - 2000,
      });

      [session1, session2, session3].forEach(s => SessionModel.create(s));
      [session1, session2, session3].forEach(s =>
        UserModel.create(createMockUser({ sessionId: s.id, id: userId }))
      );

      const userSessions = service.getUserSessionHistory(userId);

      expect(userSessions[0].id).toBe('session-2'); // Most recent
      expect(userSessions[1].id).toBe('session-3');
      expect(userSessions[2].id).toBe('session-1'); // Oldest
    });

    it('should include session metadata in history', () => {
      const userId = 'user-1';
      const session = createMockSession({
        id: 'session-1',
        name: 'Sprint 42 Retro',
        stage: 'complete',
      });

      SessionModel.create(session);
      UserModel.create(createMockUser({ sessionId: session.id, id: userId }));

      const userSessions = service.getUserSessionHistory(userId);

      expect(userSessions[0].name).toBe('Sprint 42 Retro');
      expect(userSessions[0].stage).toBe('complete');
    });

    it('should return empty array for user with no sessions', () => {
      const userSessions = service.getUserSessionHistory('non-existent-user');
      expect(userSessions).toEqual([]);
    });
  });

  describe('Session Queries', () => {
    it('should get all active sessions', () => {
      const activeStages = ['setup', 'reflect', 'group', 'vote', 'act'];
      const sessions = activeStages.map((stage, i) =>
        createMockSession({ id: `session-${i}`, stage })
      );

      const completedSession = createMockSession({
        id: 'completed',
        stage: 'complete',
      });

      [...sessions, completedSession].forEach(s => SessionModel.create(s));

      const activeSessions = service.getActiveSessions();

      expect(activeSessions).toHaveLength(5);
      expect(activeSessions.every(s => s.stage !== 'complete')).toBe(true);
    });

    it('should get sessions by host', () => {
      const hostId = 'host-1';

      const hostedSession1 = createMockSession({
        id: 'session-1',
        hostId,
      });
      const hostedSession2 = createMockSession({
        id: 'session-2',
        hostId,
      });
      const otherSession = createMockSession({
        id: 'session-3',
        hostId: 'other-host',
      });

      [hostedSession1, hostedSession2, otherSession].forEach(s =>
        SessionModel.create(s)
      );

      const hostSessions = service.getSessionsByHost(hostId);

      expect(hostSessions).toHaveLength(2);
      expect(hostSessions.map(s => s.id)).toContain('session-1');
      expect(hostSessions.map(s => s.id)).toContain('session-2');
      expect(hostSessions.map(s => s.id)).not.toContain('session-3');
    });

    it('should get sessions by date range', () => {
      const now = Date.now();
      const dayInMs = 86400000;

      const recentSession = createMockSession({
        id: 'recent',
        createdAt: now - dayInMs,
      });
      const oldSession = createMockSession({
        id: 'old',
        createdAt: now - dayInMs * 10,
      });

      [recentSession, oldSession].forEach(s => SessionModel.create(s));

      const startDate = now - dayInMs * 7;
      const endDate = now;

      const sessionsInRange = service.getSessionsByDateRange(startDate, endDate);

      expect(sessionsInRange).toHaveLength(1);
      expect(sessionsInRange[0].id).toBe('recent');
    });

    it('should get sessions by template type', () => {
      const session1 = createMockSession({
        id: 'session-1',
        settings: {
          template: 'start_stop_continue',
          columns: ['Start', 'Stop', 'Continue'],
          timerDuration: 300,
          votesPerUser: 5,
          allowAnonymous: false,
          iceBreaker: '',
          shortcutEnabled: false,
          shortcutProjectId: '',
        },
      });

      const session2 = createMockSession({
        id: 'session-2',
        settings: {
          template: 'mad_sad_glad',
          columns: ['Mad', 'Sad', 'Glad'],
          timerDuration: 300,
          votesPerUser: 5,
          allowAnonymous: false,
          iceBreaker: '',
          shortcutEnabled: false,
          shortcutProjectId: '',
        },
      });

      [session1, session2].forEach(s => SessionModel.create(s));

      const sscSessions = service.getSessionsByTemplate('start_stop_continue');

      expect(sscSessions).toHaveLength(1);
      expect(sscSessions[0].id).toBe('session-1');
    });
  });

  describe('Session Statistics', () => {
    it('should calculate session participation stats', () => {
      const sessionId = 'session-1';
      const session = createMockSession({ id: sessionId });
      SessionModel.create(session);

      // Create users
      ['user-1', 'user-2', 'user-3'].forEach(id =>
        UserModel.create(createMockUser({ sessionId, id }))
      );

      // Create cards
      CardModel.create(createMockCard({ sessionId, userId: 'user-1' }));
      CardModel.create(createMockCard({ sessionId, userId: 'user-1' }));
      CardModel.create(createMockCard({ sessionId, userId: 'user-2' }));

      const stats = service.getSessionStats(sessionId);

      expect(stats.participantCount).toBe(3);
      expect(stats.cardCount).toBe(3);
      expect(stats.cardsPerUser).toEqual({
        'user-1': 2,
        'user-2': 1,
        'user-3': 0,
      });
    });

    it('should calculate completion rate', () => {
      const sessionId = 'session-1';
      const session = createMockSession({ id: sessionId });
      SessionModel.create(session);

      ActionItemModel.create({
        sessionId,
        owner: 'User 1',
        task: 'Task 1',
        completed: true,
        completedAt: Date.now(),
      });

      ActionItemModel.create({
        sessionId,
        owner: 'User 2',
        task: 'Task 2',
        completed: false,
      });

      ActionItemModel.create({
        sessionId,
        owner: 'User 3',
        task: 'Task 3',
        completed: true,
        completedAt: Date.now(),
      });

      const stats = service.getSessionStats(sessionId);

      expect(stats.actionItemCount).toBe(3);
      expect(stats.completedActionItems).toBe(2);
      expect(stats.completionRate).toBeCloseTo(0.666, 2);
    });

    it('should calculate average session duration', () => {
      const now = Date.now();
      const hourInMs = 3600000;

      const session1 = createMockSession({
        id: 'session-1',
        createdAt: now - hourInMs * 2,
        updatedAt: now - hourInMs,
      });

      const session2 = createMockSession({
        id: 'session-2',
        createdAt: now - hourInMs * 3,
        updatedAt: now - hourInMs * 2,
      });

      [session1, session2].forEach(s => SessionModel.create(s));

      const avgDuration = service.getAverageSessionDuration([
        session1.id,
        session2.id,
      ]);

      expect(avgDuration).toBe(hourInMs);
    });
  });

  describe('Security and Isolation', () => {
    it('should verify user belongs to session', () => {
      const sessionId = 'session-1';
      const userId = 'user-1';

      const session = createMockSession({ id: sessionId });
      SessionModel.create(session);
      UserModel.create(createMockUser({ sessionId, id: userId }));

      const hasAccess = service.verifyUserAccess(sessionId, userId);
      expect(hasAccess).toBe(true);
    });

    it('should deny access to user not in session', () => {
      const sessionId = 'session-1';
      const session = createMockSession({ id: sessionId });
      SessionModel.create(session);

      const hasAccess = service.verifyUserAccess(sessionId, 'unauthorized-user');
      expect(hasAccess).toBe(false);
    });

    it('should verify host privileges', () => {
      const sessionId = 'session-1';
      const hostId = 'host-1';

      const session = createMockSession({ id: sessionId, hostId });
      SessionModel.create(session);
      UserModel.create(createMockUser({ sessionId, id: hostId, isHost: true }));

      const isHost = service.verifyHostAccess(sessionId, hostId);
      expect(isHost).toBe(true);
    });

    it('should deny host privileges to non-host user', () => {
      const sessionId = 'session-1';
      const session = createMockSession({ id: sessionId, hostId: 'host-1' });
      SessionModel.create(session);

      UserModel.create(
        createMockUser({ sessionId, id: 'regular-user', isHost: false })
      );

      const isHost = service.verifyHostAccess(sessionId, 'regular-user');
      expect(isHost).toBe(false);
    });

    it('should isolate session data between sessions', () => {
      const session1 = createMockSession({ id: 'session-1' });
      const session2 = createMockSession({ id: 'session-2' });

      [session1, session2].forEach(s => SessionModel.create(s));

      CardModel.create(createMockCard({ sessionId: session1.id, id: 'card-1' }));
      CardModel.create(createMockCard({ sessionId: session2.id, id: 'card-2' }));

      const session1Cards = CardModel.getAllBySession(session1.id);
      const session2Cards = CardModel.getAllBySession(session2.id);

      expect(session1Cards).toHaveLength(1);
      expect(session2Cards).toHaveLength(1);
      expect(session1Cards[0].id).toBe('card-1');
      expect(session2Cards[0].id).toBe('card-2');
    });
  });

  describe('Session Search', () => {
    it('should search sessions by name', () => {
      const session1 = createMockSession({
        id: 'session-1',
        name: 'Sprint 42 Retrospective',
      });
      const session2 = createMockSession({
        id: 'session-2',
        name: 'Q4 Planning Session',
      });
      const session3 = createMockSession({
        id: 'session-3',
        name: 'Sprint 43 Retrospective',
      });

      [session1, session2, session3].forEach(s => SessionModel.create(s));

      const results = service.searchSessions('Sprint');

      expect(results).toHaveLength(2);
      expect(results.map(s => s.id)).toContain('session-1');
      expect(results.map(s => s.id)).toContain('session-3');
      expect(results.map(s => s.id)).not.toContain('session-2');
    });

    it('should search sessions case-insensitively', () => {
      const session = createMockSession({
        id: 'session-1',
        name: 'Sprint Retrospective',
      });

      SessionModel.create(session);

      const results = service.searchSessions('sprint');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('session-1');
    });
  });

  describe('Session Archiving', () => {
    it('should mark session as archived', () => {
      const sessionId = 'session-1';
      const session = createMockSession({ id: sessionId });
      SessionModel.create(session);

      service.archiveSession(sessionId);

      const archivedSession = SessionModel.getById(sessionId);
      expect(archivedSession.archived).toBe(true);
    });

    it('should exclude archived sessions from active list', () => {
      const session1 = createMockSession({ id: 'session-1' });
      const session2 = createMockSession({ id: 'session-2' });

      [session1, session2].forEach(s => SessionModel.create(s));

      service.archiveSession(session1.id);

      const activeSessions = service.getActiveSessions();

      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].id).toBe('session-2');
    });

    it('should get all archived sessions', () => {
      const session1 = createMockSession({ id: 'session-1' });
      const session2 = createMockSession({ id: 'session-2' });

      [session1, session2].forEach(s => SessionModel.create(s));

      service.archiveSession(session1.id);

      const archivedSessions = service.getArchivedSessions();

      expect(archivedSessions).toHaveLength(1);
      expect(archivedSessions[0].id).toBe('session-1');
    });

    it('should restore archived session', () => {
      const sessionId = 'session-1';
      const session = createMockSession({ id: sessionId });
      SessionModel.create(session);

      service.archiveSession(sessionId);
      service.restoreSession(sessionId);

      const restoredSession = SessionModel.getById(sessionId);
      expect(restoredSession.archived).toBe(false);
    });
  });

  describe('Pagination', () => {
    it('should paginate session list', () => {
      // Create 25 sessions
      for (let i = 0; i < 25; i++) {
        SessionModel.create(
          createMockSession({
            id: `session-${i}`,
            createdAt: Date.now() - i * 1000,
          })
        );
      }

      const page1 = service.getSessionsPaginated(0, 10);
      const page2 = service.getSessionsPaginated(10, 10);
      const page3 = service.getSessionsPaginated(20, 10);

      expect(page1.sessions).toHaveLength(10);
      expect(page2.sessions).toHaveLength(10);
      expect(page3.sessions).toHaveLength(5);
      expect(page1.total).toBe(25);
      expect(page1.hasMore).toBe(true);
      expect(page3.hasMore).toBe(false);
    });
  });
});
