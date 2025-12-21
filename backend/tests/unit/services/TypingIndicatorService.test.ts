/**
 * Unit tests for Typing Indicator Service
 * Tests: state management, timeout handling, multi-user tracking
 */

import { TypingIndicatorService } from '../../../src/services/TypingIndicatorService';

describe('TypingIndicatorService', () => {
  let service: TypingIndicatorService;

  beforeEach(() => {
    service = new TypingIndicatorService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('User Typing State', () => {
    it('should track when user starts typing', () => {
      const sessionId = 'session-1';
      const userId = 'user-1';
      const cardId = 'card-1';

      service.startTyping(sessionId, userId, cardId);

      const typingUsers = service.getTypingUsers(sessionId, cardId);
      expect(typingUsers).toContain(userId);
    });

    it('should stop tracking when user stops typing', () => {
      const sessionId = 'session-1';
      const userId = 'user-1';
      const cardId = 'card-1';

      service.startTyping(sessionId, userId, cardId);
      service.stopTyping(sessionId, userId, cardId);

      const typingUsers = service.getTypingUsers(sessionId, cardId);
      expect(typingUsers).not.toContain(userId);
    });

    it('should track multiple users typing on same card', () => {
      const sessionId = 'session-1';
      const cardId = 'card-1';

      service.startTyping(sessionId, 'user-1', cardId);
      service.startTyping(sessionId, 'user-2', cardId);
      service.startTyping(sessionId, 'user-3', cardId);

      const typingUsers = service.getTypingUsers(sessionId, cardId);
      expect(typingUsers).toHaveLength(3);
      expect(typingUsers).toContain('user-1');
      expect(typingUsers).toContain('user-2');
      expect(typingUsers).toContain('user-3');
    });

    it('should track users typing on different cards', () => {
      const sessionId = 'session-1';

      service.startTyping(sessionId, 'user-1', 'card-1');
      service.startTyping(sessionId, 'user-2', 'card-2');

      const card1Typing = service.getTypingUsers(sessionId, 'card-1');
      const card2Typing = service.getTypingUsers(sessionId, 'card-2');

      expect(card1Typing).toContain('user-1');
      expect(card1Typing).not.toContain('user-2');
      expect(card2Typing).toContain('user-2');
      expect(card2Typing).not.toContain('user-1');
    });
  });

  describe('Timeout Handling', () => {
    it('should auto-stop typing after timeout period', () => {
      const sessionId = 'session-1';
      const userId = 'user-1';
      const cardId = 'card-1';

      service.startTyping(sessionId, userId, cardId);

      expect(service.getTypingUsers(sessionId, cardId)).toContain(userId);

      // Fast forward past typing timeout (3 seconds)
      jest.advanceTimersByTime(3500);

      expect(service.getTypingUsers(sessionId, cardId)).not.toContain(userId);
    });

    it('should reset timeout when user continues typing', () => {
      const sessionId = 'session-1';
      const userId = 'user-1';
      const cardId = 'card-1';

      service.startTyping(sessionId, userId, cardId);

      // Advance 2 seconds
      jest.advanceTimersByTime(2000);

      // User types again (resets timeout)
      service.startTyping(sessionId, userId, cardId);

      // Advance another 2 seconds (total 4, but timeout was reset)
      jest.advanceTimersByTime(2000);

      // Should still be typing
      expect(service.getTypingUsers(sessionId, cardId)).toContain(userId);

      // Advance past new timeout
      jest.advanceTimersByTime(2000);

      expect(service.getTypingUsers(sessionId, cardId)).not.toContain(userId);
    });

    it('should handle multiple timeouts independently', () => {
      const sessionId = 'session-1';
      const cardId = 'card-1';

      service.startTyping(sessionId, 'user-1', cardId);

      jest.advanceTimersByTime(1000);

      service.startTyping(sessionId, 'user-2', cardId);

      // Advance past user-1 timeout but not user-2
      jest.advanceTimersByTime(2500);

      const typingUsers = service.getTypingUsers(sessionId, cardId);
      expect(typingUsers).not.toContain('user-1');
      expect(typingUsers).toContain('user-2');

      // Advance past user-2 timeout
      jest.advanceTimersByTime(1000);

      expect(service.getTypingUsers(sessionId, cardId)).toHaveLength(0);
    });
  });

  describe('Session Management', () => {
    it('should isolate typing state between sessions', () => {
      service.startTyping('session-1', 'user-1', 'card-1');
      service.startTyping('session-2', 'user-2', 'card-1');

      const session1Typing = service.getTypingUsers('session-1', 'card-1');
      const session2Typing = service.getTypingUsers('session-2', 'card-1');

      expect(session1Typing).toContain('user-1');
      expect(session1Typing).not.toContain('user-2');
      expect(session2Typing).toContain('user-2');
      expect(session2Typing).not.toContain('user-1');
    });

    it('should clear all typing state for a session', () => {
      const sessionId = 'session-1';

      service.startTyping(sessionId, 'user-1', 'card-1');
      service.startTyping(sessionId, 'user-2', 'card-2');
      service.startTyping(sessionId, 'user-3', 'card-3');

      service.clearSession(sessionId);

      expect(service.getTypingUsers(sessionId, 'card-1')).toHaveLength(0);
      expect(service.getTypingUsers(sessionId, 'card-2')).toHaveLength(0);
      expect(service.getTypingUsers(sessionId, 'card-3')).toHaveLength(0);
    });

    it('should get all typing indicators for a session', () => {
      const sessionId = 'session-1';

      service.startTyping(sessionId, 'user-1', 'card-1');
      service.startTyping(sessionId, 'user-2', 'card-2');
      service.startTyping(sessionId, 'user-3', 'card-1');

      const allTyping = service.getAllTypingInSession(sessionId);

      expect(allTyping).toHaveProperty('card-1');
      expect(allTyping).toHaveProperty('card-2');
      expect(allTyping['card-1']).toHaveLength(2);
      expect(allTyping['card-2']).toHaveLength(1);
    });
  });

  describe('User Disconnect Handling', () => {
    it('should clear typing state when user disconnects', () => {
      const sessionId = 'session-1';
      const userId = 'user-1';

      service.startTyping(sessionId, userId, 'card-1');
      service.startTyping(sessionId, userId, 'card-2');

      service.clearUserTyping(sessionId, userId);

      expect(service.getTypingUsers(sessionId, 'card-1')).not.toContain(userId);
      expect(service.getTypingUsers(sessionId, 'card-2')).not.toContain(userId);
    });

    it('should not affect other users when one disconnects', () => {
      const sessionId = 'session-1';
      const cardId = 'card-1';

      service.startTyping(sessionId, 'user-1', cardId);
      service.startTyping(sessionId, 'user-2', cardId);
      service.startTyping(sessionId, 'user-3', cardId);

      service.clearUserTyping(sessionId, 'user-2');

      const typingUsers = service.getTypingUsers(sessionId, cardId);
      expect(typingUsers).toContain('user-1');
      expect(typingUsers).not.toContain('user-2');
      expect(typingUsers).toContain('user-3');
    });
  });

  describe('Field-Specific Typing (Action Items, Cluster Names)', () => {
    it('should track typing on action item fields', () => {
      const sessionId = 'session-1';
      const userId = 'user-1';
      const actionId = 'action-1';
      const field = 'task';

      service.startTypingOnField(sessionId, userId, actionId, field);

      const typing = service.getTypingOnField(sessionId, actionId, field);
      expect(typing).toContain(userId);
    });

    it('should track typing on cluster name field', () => {
      const sessionId = 'session-1';
      const userId = 'user-1';
      const clusterId = 'cluster-1';

      service.startTypingOnField(sessionId, userId, clusterId, 'name');

      const typing = service.getTypingOnField(sessionId, clusterId, 'name');
      expect(typing).toContain(userId);
    });

    it('should differentiate between different fields', () => {
      const sessionId = 'session-1';
      const actionId = 'action-1';

      service.startTypingOnField(sessionId, 'user-1', actionId, 'task');
      service.startTypingOnField(sessionId, 'user-2', actionId, 'owner');

      const taskTyping = service.getTypingOnField(sessionId, actionId, 'task');
      const ownerTyping = service.getTypingOnField(sessionId, actionId, 'owner');

      expect(taskTyping).toContain('user-1');
      expect(taskTyping).not.toContain('user-2');
      expect(ownerTyping).toContain('user-2');
      expect(ownerTyping).not.toContain('user-1');
    });
  });

  describe('Throttling', () => {
    it('should not emit duplicate events within throttle period', () => {
      const sessionId = 'session-1';
      const userId = 'user-1';
      const cardId = 'card-1';

      const callback = jest.fn();
      service.onTypingChange(callback);

      service.startTyping(sessionId, userId, cardId);
      service.startTyping(sessionId, userId, cardId);
      service.startTyping(sessionId, userId, cardId);

      // Should only emit once
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should emit after throttle period expires', () => {
      const sessionId = 'session-1';
      const userId = 'user-1';
      const cardId = 'card-1';

      const callback = jest.fn();
      service.onTypingChange(callback);

      service.startTyping(sessionId, userId, cardId);

      jest.advanceTimersByTime(500); // Past throttle period

      service.startTyping(sessionId, userId, cardId);

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty session id', () => {
      expect(() => {
        service.startTyping('', 'user-1', 'card-1');
      }).not.toThrow();

      const typing = service.getTypingUsers('', 'card-1');
      expect(typing).toHaveLength(0);
    });

    it('should handle same user typing on same card multiple times', () => {
      const sessionId = 'session-1';
      const userId = 'user-1';
      const cardId = 'card-1';

      service.startTyping(sessionId, userId, cardId);
      service.startTyping(sessionId, userId, cardId);
      service.startTyping(sessionId, userId, cardId);

      const typingUsers = service.getTypingUsers(sessionId, cardId);
      expect(typingUsers).toHaveLength(1);
      expect(typingUsers).toContain(userId);
    });

    it('should return empty array for non-existent card', () => {
      const typing = service.getTypingUsers('session-1', 'non-existent-card');
      expect(typing).toHaveLength(0);
      expect(typing).toEqual([]);
    });
  });
});
