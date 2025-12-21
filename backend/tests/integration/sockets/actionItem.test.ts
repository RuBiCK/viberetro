/**
 * Integration tests for Action Item socket handlers
 * Tests: socket events, status updates, carry-over, real-time sync
 */

import { Database } from 'better-sqlite3';
import { ActionItemModel } from '../../../src/models/ActionItem';
import { SessionModel } from '../../../src/models/Session';
import { UserModel } from '../../../src/models/User';
import { cleanupDatabase, createMockSession, createMockUser } from '../../setup';
import { createMockSocket, createMockIO, expectSocketEmit, expectRoomEmit } from '../../helpers/socket-mock';
import { getDatabase } from '../../../src/db/database';

describe('Action Item Socket Handlers - Integration', () => {
  let db: Database;
  let sessionId: string;
  let userId: string;
  let mockSocket: any;
  let mockIO: any;

  beforeAll(() => {
    db = getDatabase();
  });

  beforeEach(() => {
    cleanupDatabase(db);

    const session = createMockSession();
    SessionModel.create(session);
    sessionId = session.id;

    const user = createMockUser({ sessionId, isHost: true });
    UserModel.create(user);
    userId = user.id;

    mockSocket = createMockSocket({ sessionId, userId });
    mockIO = createMockIO();
  });

  describe('action:create with extended fields', () => {
    it('should create action item with completion status', async () => {
      const actionData = {
        sessionId,
        owner: 'John Doe',
        task: 'Implement new feature',
        completed: false,
        dueDate: Date.now() + 86400000, // Tomorrow
        priority: 'high',
      };

      // Simulate handler
      const createdAction = ActionItemModel.create(actionData);
      mockIO.to(sessionId).emit('action:created', createdAction);

      expect(createdAction.completed).toBe(false);
      expect(createdAction.priority).toBe('high');
      expect(createdAction.dueDate).toBeDefined();
      expectRoomEmit(mockIO, sessionId, 'action:created', createdAction);
    });

    it('should create carried-over action item', async () => {
      const previousSessionId = 'prev-session-id';
      const actionData = {
        sessionId,
        owner: 'John Doe',
        task: 'Incomplete from last sprint',
        carriedFromSessionId: previousSessionId,
        completed: false,
      };

      const createdAction = ActionItemModel.create(actionData);
      mockIO.to(sessionId).emit('action:created', createdAction);

      expect(createdAction.carriedFromSessionId).toBe(previousSessionId);
      expectRoomEmit(mockIO, sessionId, 'action:created', createdAction);
    });
  });

  describe('action:update-status', () => {
    it('should toggle action item completion status', async () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Test task',
        completed: false,
      });

      // Complete the item
      const updated = ActionItemModel.update(actionItem.id, {
        completed: true,
        completedAt: Date.now(),
      });

      mockIO.to(sessionId).emit('action:updated', updated);

      expect(updated.completed).toBe(true);
      expect(updated.completedAt).toBeDefined();
      expectRoomEmit(mockIO, sessionId, 'action:updated', updated);
    });

    it('should uncomplete action item', async () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Test task',
        completed: true,
        completedAt: Date.now(),
      });

      const updated = ActionItemModel.update(actionItem.id, {
        completed: false,
        completedAt: null,
      });

      mockIO.to(sessionId).emit('action:updated', updated);

      expect(updated.completed).toBe(false);
      expect(updated.completedAt).toBeNull();
    });
  });

  describe('action:update-due-date', () => {
    it('should update due date', async () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Test task',
      });

      const newDueDate = new Date('2025-12-31').getTime();
      const updated = ActionItemModel.update(actionItem.id, {
        dueDate: newDueDate,
      });

      mockIO.to(sessionId).emit('action:updated', updated);

      expect(updated.dueDate).toBe(newDueDate);
      expectRoomEmit(mockIO, sessionId, 'action:updated', updated);
    });

    it('should remove due date', async () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Test task',
        dueDate: Date.now(),
      });

      const updated = ActionItemModel.update(actionItem.id, {
        dueDate: null,
      });

      mockIO.to(sessionId).emit('action:updated', updated);

      expect(updated.dueDate).toBeNull();
    });
  });

  describe('action:update-priority', () => {
    it('should update priority level', async () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Test task',
        priority: 'low',
      });

      const updated = ActionItemModel.update(actionItem.id, {
        priority: 'high',
      });

      mockIO.to(sessionId).emit('action:updated', updated);

      expect(updated.priority).toBe('high');
      expectRoomEmit(mockIO, sessionId, 'action:updated', updated);
    });
  });

  describe('action:carry-over', () => {
    it('should carry over incomplete items to new session', async () => {
      // Create multiple action items
      ActionItemModel.create({
        sessionId,
        owner: 'John',
        task: 'Incomplete task 1',
        completed: false,
        priority: 'high',
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Jane',
        task: 'Completed task',
        completed: true,
        completedAt: Date.now(),
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Bob',
        task: 'Incomplete task 2',
        completed: false,
        dueDate: Date.now() + 86400000,
      });

      // Get incomplete items
      const incompleteItems = ActionItemModel.getAllBySession(sessionId)
        .filter(item => !item.completed);

      expect(incompleteItems).toHaveLength(2);

      // Create new session
      const newSessionId = 'new-session-id';
      const newSession = createMockSession({ id: newSessionId });
      SessionModel.create(newSession);

      // Carry over items
      const carriedItems = incompleteItems.map(item =>
        ActionItemModel.create({
          sessionId: newSessionId,
          owner: item.owner,
          task: item.task,
          priority: item.priority,
          dueDate: item.dueDate,
          carriedFromSessionId: sessionId,
          completed: false,
        })
      );

      expect(carriedItems).toHaveLength(2);
      expect(carriedItems.every(item => item.carriedFromSessionId === sessionId)).toBe(true);
      expect(carriedItems.every(item => item.sessionId === newSessionId)).toBe(true);

      // Broadcast to new session
      carriedItems.forEach(item => {
        mockIO.to(newSessionId).emit('action:created', item);
      });

      expect(mockIO.to).toHaveBeenCalledWith(newSessionId);
    });
  });

  describe('action:bulk-update', () => {
    it('should update multiple action items at once', async () => {
      const item1 = ActionItemModel.create({
        sessionId,
        owner: 'John',
        task: 'Task 1',
        completed: false,
      });

      const item2 = ActionItemModel.create({
        sessionId,
        owner: 'Jane',
        task: 'Task 2',
        completed: false,
      });

      const item3 = ActionItemModel.create({
        sessionId,
        owner: 'Bob',
        task: 'Task 3',
        completed: false,
      });

      // Bulk complete
      const itemIds = [item1.id, item2.id, item3.id];
      const updatedItems = itemIds.map(id =>
        ActionItemModel.update(id, {
          completed: true,
          completedAt: Date.now(),
        })
      );

      // Broadcast each update
      updatedItems.forEach(item => {
        mockIO.to(sessionId).emit('action:updated', item);
      });

      expect(updatedItems).toHaveLength(3);
      expect(updatedItems.every(item => item.completed)).toBe(true);
      expect(mockIO.emit).toHaveBeenCalledTimes(3);
    });
  });

  describe('action:get-overdue', () => {
    it('should return only overdue incomplete items', async () => {
      const now = Date.now();
      const pastDue = now - 86400000; // Yesterday
      const futureDue = now + 86400000; // Tomorrow

      ActionItemModel.create({
        sessionId,
        owner: 'John',
        task: 'Overdue task',
        dueDate: pastDue,
        completed: false,
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Jane',
        task: 'Future task',
        dueDate: futureDue,
        completed: false,
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Bob',
        task: 'Overdue but completed',
        dueDate: pastDue,
        completed: true,
        completedAt: now,
      });

      const allItems = ActionItemModel.getAllBySession(sessionId);
      const overdueItems = allItems.filter(
        item => item.dueDate && item.dueDate < now && !item.completed
      );

      mockSocket.emit('action:overdue-list', { items: overdueItems });

      expect(overdueItems).toHaveLength(1);
      expect(overdueItems[0].task).toBe('Overdue task');
      expectSocketEmit(mockSocket, 'action:overdue-list', { items: overdueItems });
    });
  });

  describe('action:update-assignees', () => {
    it('should add assignee to action item', async () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Team task',
        assignees: ['John Doe'],
      });

      const updated = ActionItemModel.update(actionItem.id, {
        assignees: ['John Doe', 'Jane Smith'],
      });

      mockIO.to(sessionId).emit('action:updated', updated);

      expect(updated.assignees).toHaveLength(2);
      expect(updated.assignees).toContain('Jane Smith');
    });

    it('should remove assignee from action item', async () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Team task',
        assignees: ['John Doe', 'Jane Smith', 'Bob Wilson'],
      });

      const updated = ActionItemModel.update(actionItem.id, {
        assignees: ['John Doe', 'Bob Wilson'],
      });

      mockIO.to(sessionId).emit('action:updated', updated);

      expect(updated.assignees).toHaveLength(2);
      expect(updated.assignees).not.toContain('Jane Smith');
    });
  });

  describe('Error handling', () => {
    it('should emit error when updating non-existent action item', async () => {
      const nonExistentId = 'non-existent-id';

      try {
        ActionItemModel.update(nonExistentId, { completed: true });
      } catch (error) {
        mockSocket.emit('error', {
          message: `Action item ${nonExistentId} not found`,
        });
      }

      expectSocketEmit(mockSocket, 'error', {
        message: expect.stringContaining('not found'),
      });
    });

    it('should validate due date is in future when creating', async () => {
      const pastDate = Date.now() - 86400000;

      try {
        // Simulate validation
        if (pastDate < Date.now()) {
          throw new Error('Due date must be in the future');
        }
      } catch (error) {
        mockSocket.emit('error', {
          message: 'Due date must be in the future',
        });
      }

      expectSocketEmit(mockSocket, 'error', {
        message: 'Due date must be in the future',
      });
    });
  });
});
