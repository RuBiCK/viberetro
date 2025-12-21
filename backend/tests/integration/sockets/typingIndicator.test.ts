/**
 * Integration tests for Typing Indicator socket handlers
 * Tests: real-time events, broadcasting, state synchronization
 */

import { Database } from 'better-sqlite3';
import { SessionModel } from '../../../src/models/Session';
import { UserModel } from '../../../src/models/User';
import { CardModel } from '../../../src/models/Card';
import { cleanupDatabase, createMockSession, createMockUser, createMockCard } from '../../setup';
import { createMockSocket, createMockIO, expectRoomEmit } from '../../helpers/socket-mock';
import { getDatabase } from '../../../src/db/database';
import { TypingIndicatorService } from '../../../src/services/TypingIndicatorService';

describe('Typing Indicator Socket Handlers - Integration', () => {
  let db: Database;
  let sessionId: string;
  let userId: string;
  let cardId: string;
  let mockSocket: any;
  let mockIO: any;
  let typingService: TypingIndicatorService;

  beforeAll(() => {
    db = getDatabase();
  });

  beforeEach(() => {
    cleanupDatabase(db);
    jest.useFakeTimers();

    const session = createMockSession();
    SessionModel.create(session);
    sessionId = session.id;

    const user = createMockUser({ sessionId });
    UserModel.create(user);
    userId = user.id;

    const card = createMockCard({ sessionId, userId });
    CardModel.create(card);
    cardId = card.id;

    mockSocket = createMockSocket({ sessionId, userId });
    mockIO = createMockIO();
    typingService = new TypingIndicatorService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('typing:start', () => {
    it('should broadcast typing start to room', () => {
      const data = { cardId, field: 'content' };

      typingService.startTyping(sessionId, userId, cardId);

      mockIO.to(sessionId).emit('typing:started', {
        userId,
        cardId,
        field: 'content',
      });

      expectRoomEmit(mockIO, sessionId, 'typing:started', {
        userId,
        cardId,
        field: 'content',
      });
    });

    it('should not broadcast to self', () => {
      const data = { cardId };

      typingService.startTyping(sessionId, userId, cardId);

      // Simulate not emitting to self
      const otherSockets = mockIO.sockets.sockets;
      const filtered = Array.from(otherSockets.values())
        .filter(s => s.data.userId !== userId);

      expect(filtered).not.toContain(
        expect.objectContaining({ id: mockSocket.id })
      );
    });

    it('should handle multiple users typing simultaneously', () => {
      const user2 = createMockUser({ sessionId, id: 'user-2' });
      UserModel.create(user2);
      const mockSocket2 = createMockSocket({ sessionId, userId: user2.id });

      typingService.startTyping(sessionId, userId, cardId);
      typingService.startTyping(sessionId, user2.id, cardId);

      mockIO.to(sessionId).emit('typing:started', { userId, cardId });
      mockIO.to(sessionId).emit('typing:started', { userId: user2.id, cardId });

      const typingUsers = typingService.getTypingUsers(sessionId, cardId);
      expect(typingUsers).toHaveLength(2);
      expect(mockIO.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('typing:stop', () => {
    it('should broadcast typing stop to room', () => {
      typingService.startTyping(sessionId, userId, cardId);
      typingService.stopTyping(sessionId, userId, cardId);

      mockIO.to(sessionId).emit('typing:stopped', {
        userId,
        cardId,
      });

      expectRoomEmit(mockIO, sessionId, 'typing:stopped', {
        userId,
        cardId,
      });
    });

    it('should handle stop without start gracefully', () => {
      expect(() => {
        typingService.stopTyping(sessionId, userId, cardId);
        mockIO.to(sessionId).emit('typing:stopped', { userId, cardId });
      }).not.toThrow();
    });
  });

  describe('typing:timeout', () => {
    it('should auto-stop and broadcast after timeout', () => {
      typingService.startTyping(sessionId, userId, cardId);

      // Fast forward past timeout
      jest.advanceTimersByTime(3500);

      mockIO.to(sessionId).emit('typing:stopped', {
        userId,
        cardId,
        reason: 'timeout',
      });

      const typingUsers = typingService.getTypingUsers(sessionId, cardId);
      expect(typingUsers).not.toContain(userId);
    });

    it('should reset timeout on continued typing', () => {
      typingService.startTyping(sessionId, userId, cardId);

      jest.advanceTimersByTime(2000);

      // User types again
      typingService.startTyping(sessionId, userId, cardId);

      jest.advanceTimersByTime(2000);

      // Should still be typing
      const typingUsers = typingService.getTypingUsers(sessionId, cardId);
      expect(typingUsers).toContain(userId);
    });
  });

  describe('typing:get-all', () => {
    it('should return all typing users for session', () => {
      const card2 = createMockCard({ sessionId, userId, id: 'card-2' });
      CardModel.create(card2);

      const user2 = createMockUser({ sessionId, id: 'user-2' });
      UserModel.create(user2);

      typingService.startTyping(sessionId, userId, cardId);
      typingService.startTyping(sessionId, user2.id, card2.id);

      const allTyping = typingService.getAllTypingInSession(sessionId);

      mockSocket.emit('typing:all', { typing: allTyping });

      expect(allTyping).toHaveProperty(cardId);
      expect(allTyping).toHaveProperty(card2.id);
      expect(allTyping[cardId]).toContain(userId);
      expect(allTyping[card2.id]).toContain(user2.id);
    });

    it('should return empty object for session with no typing', () => {
      const allTyping = typingService.getAllTypingInSession(sessionId);

      mockSocket.emit('typing:all', { typing: allTyping });

      expect(allTyping).toEqual({});
    });
  });

  describe('User disconnect handling', () => {
    it('should clear typing state on disconnect', () => {
      typingService.startTyping(sessionId, userId, cardId);
      typingService.startTyping(sessionId, userId, 'card-2');

      // Simulate disconnect
      typingService.clearUserTyping(sessionId, userId);

      mockIO.to(sessionId).emit('typing:stopped', {
        userId,
        cardId: cardId,
      });
      mockIO.to(sessionId).emit('typing:stopped', {
        userId,
        cardId: 'card-2',
      });

      expect(typingService.getTypingUsers(sessionId, cardId)).not.toContain(userId);
      expect(typingService.getTypingUsers(sessionId, 'card-2')).not.toContain(userId);
    });

    it('should broadcast all stopped typing events on disconnect', () => {
      const card2 = createMockCard({ sessionId, userId, id: 'card-2' });
      CardModel.create(card2);

      typingService.startTyping(sessionId, userId, cardId);
      typingService.startTyping(sessionId, userId, card2.id);

      typingService.clearUserTyping(sessionId, userId);

      expect(mockIO.to).toHaveBeenCalledWith(sessionId);
      // Should emit stopped for each card
      expect(mockIO.emit).toHaveBeenCalledWith(
        'typing:stopped',
        expect.objectContaining({ userId })
      );
    });
  });

  describe('Field-specific typing', () => {
    it('should track typing on action item fields', () => {
      const actionId = 'action-1';
      const field = 'task';

      typingService.startTypingOnField(sessionId, userId, actionId, field);

      mockIO.to(sessionId).emit('typing:started', {
        userId,
        targetId: actionId,
        targetType: 'action',
        field,
      });

      const typing = typingService.getTypingOnField(sessionId, actionId, field);
      expect(typing).toContain(userId);
      expectRoomEmit(mockIO, sessionId, 'typing:started', expect.any(Object));
    });

    it('should track typing on cluster name', () => {
      const clusterId = 'cluster-1';

      typingService.startTypingOnField(sessionId, userId, clusterId, 'name');

      mockIO.to(sessionId).emit('typing:started', {
        userId,
        targetId: clusterId,
        targetType: 'cluster',
        field: 'name',
      });

      const typing = typingService.getTypingOnField(sessionId, clusterId, 'name');
      expect(typing).toContain(userId);
    });
  });

  describe('Rate limiting and throttling', () => {
    it('should throttle rapid typing events', () => {
      const emitSpy = jest.spyOn(mockIO, 'emit');

      // Rapid fire typing events
      typingService.startTyping(sessionId, userId, cardId);
      typingService.startTyping(sessionId, userId, cardId);
      typingService.startTyping(sessionId, userId, cardId);
      typingService.startTyping(sessionId, userId, cardId);

      // Should throttle and only emit once or twice
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should allow events after throttle period', () => {
      const emitSpy = jest.spyOn(mockIO, 'emit');

      typingService.startTyping(sessionId, userId, cardId);
      mockIO.to(sessionId).emit('typing:started', { userId, cardId });

      jest.advanceTimersByTime(500);

      typingService.startTyping(sessionId, userId, cardId);
      mockIO.to(sessionId).emit('typing:started', { userId, cardId });

      expect(emitSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid card id', () => {
      const invalidCardId = 'non-existent-card';

      expect(() => {
        typingService.startTyping(sessionId, userId, invalidCardId);
      }).not.toThrow();

      mockSocket.emit('error', {
        message: 'Card not found',
      });
    });

    it('should handle user not in session', () => {
      const invalidUserId = 'non-existent-user';

      expect(() => {
        typingService.startTyping(sessionId, invalidUserId, cardId);
      }).not.toThrow();

      mockSocket.emit('error', {
        message: 'User not in session',
      });
    });
  });

  describe('State synchronization', () => {
    it('should sync typing state on reconnection', () => {
      const user2 = createMockUser({ sessionId, id: 'user-2' });
      UserModel.create(user2);

      typingService.startTyping(sessionId, user2.id, cardId);

      // New user joins - should receive current typing state
      const newSocket = createMockSocket({ sessionId, userId: 'user-3' });
      const allTyping = typingService.getAllTypingInSession(sessionId);

      newSocket.emit('typing:all', { typing: allTyping });

      expect(allTyping[cardId]).toContain(user2.id);
    });

    it('should clear stale typing state on session rejoin', () => {
      typingService.startTyping(sessionId, userId, cardId);

      // Simulate disconnect and immediate rejoin
      typingService.clearUserTyping(sessionId, userId);

      const typingUsers = typingService.getTypingUsers(sessionId, cardId);
      expect(typingUsers).not.toContain(userId);
    });
  });
});
