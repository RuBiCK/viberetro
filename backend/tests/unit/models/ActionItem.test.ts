/**
 * Unit tests for ActionItem model
 * Tests: basic CRUD operations and completion status
 */

import { Database } from 'better-sqlite3';
import { ActionItemModel } from '../../../src/models/ActionItem';
import { SessionModel } from '../../../src/models/Session';
import { cleanupDatabase, createMockSession } from '../../setup';
import { initDatabase, getDatabase } from '../../../src/db/database';
import { v4 as uuidv4 } from 'uuid';

describe('ActionItem Model', () => {
  let db: Database;
  let sessionId: string;

  beforeAll(() => {
    db = initDatabase();
  });

  beforeEach(() => {
    cleanupDatabase(db);
    const session = createMockSession();
    SessionModel.create(session);
    sessionId = session.id;
  });

  describe('Basic CRUD Operations', () => {
    it('should create action item with required fields', () => {
      const actionItem = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John Doe',
        task: 'Implement new feature',
        completed: false,
        createdAt: Date.now(),
      });

      expect(actionItem.id).toBeDefined();
      expect(actionItem.sessionId).toBe(sessionId);
      expect(actionItem.owner).toBe('John Doe');
      expect(actionItem.task).toBe('Implement new feature');
      expect(actionItem.completed).toBe(false);
      expect(actionItem.createdAt).toBeDefined();
    });

    it('should find action item by id', () => {
      const created = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John Doe',
        task: 'Test task',
        completed: false,
        createdAt: Date.now(),
      });

      const found = ActionItemModel.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.task).toBe('Test task');
    });

    it('should return null when action item not found', () => {
      const found = ActionItemModel.findById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should find all action items by session id', () => {
      ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John',
        task: 'Task 1',
        completed: false,
        createdAt: Date.now(),
      });

      ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'Jane',
        task: 'Task 2',
        completed: false,
        createdAt: Date.now(),
      });

      const items = ActionItemModel.findBySessionId(sessionId);

      expect(items).toHaveLength(2);
      expect(items.map(i => i.task)).toContain('Task 1');
      expect(items.map(i => i.task)).toContain('Task 2');
    });

    it('should support getAllBySession alias method', () => {
      ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John',
        task: 'Task 1',
        completed: false,
        createdAt: Date.now(),
      });

      const items = ActionItemModel.getAllBySession(sessionId);

      expect(items).toHaveLength(1);
      expect(items[0].task).toBe('Task 1');
    });

    it('should update action item and return updated item', () => {
      const created = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John Doe',
        task: 'Original task',
        completed: false,
        createdAt: Date.now(),
      });

      const updated = ActionItemModel.update(created.id, {
        task: 'Updated task',
      });

      expect(updated).toBeDefined();
      expect(updated.task).toBe('Updated task');
      expect(updated.id).toBe(created.id);
    });

    it('should delete action item', () => {
      const created = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John Doe',
        task: 'Task to delete',
        completed: false,
        createdAt: Date.now(),
      });

      ActionItemModel.delete(created.id);

      const found = ActionItemModel.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('Completion Status', () => {
    it('should create action item with incomplete status', () => {
      const actionItem = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John Doe',
        task: 'Implement new feature',
        completed: false,
        createdAt: Date.now(),
      });

      expect(actionItem.completed).toBe(false);
    });

    it('should create action item with completed status', () => {
      const actionItem = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John Doe',
        task: 'Completed task',
        completed: true,
        createdAt: Date.now(),
      });

      expect(actionItem.completed).toBe(true);
    });

    it('should update action item to completed', () => {
      const actionItem = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John Doe',
        task: 'Implement new feature',
        completed: false,
        createdAt: Date.now(),
      });

      const updated = ActionItemModel.update(actionItem.id, {
        completed: true,
      });

      expect(updated.completed).toBe(true);
    });

    it('should toggle completion status', () => {
      const actionItem = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John Doe',
        task: 'Implement new feature',
        completed: false,
        createdAt: Date.now(),
      });

      // Complete
      let updated = ActionItemModel.update(actionItem.id, {
        completed: true,
      });
      expect(updated.completed).toBe(true);

      // Uncomplete
      updated = ActionItemModel.update(actionItem.id, {
        completed: false,
      });
      expect(updated.completed).toBe(false);
    });

    it('should filter completed and incomplete items', () => {
      ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John',
        task: 'Task 1',
        completed: true,
        createdAt: Date.now(),
      });

      ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'Jane',
        task: 'Task 2',
        completed: false,
        createdAt: Date.now(),
      });

      ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'Bob',
        task: 'Task 3',
        completed: true,
        createdAt: Date.now(),
      });

      const allItems = ActionItemModel.getAllBySession(sessionId);
      const completedItems = allItems.filter(item => item.completed);
      const incompleteItems = allItems.filter(item => !item.completed);

      expect(completedItems).toHaveLength(2);
      expect(incompleteItems).toHaveLength(1);
    });
  });

  describe('Update Operations', () => {
    it('should update only owner', () => {
      const created = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John Doe',
        task: 'Test task',
        completed: false,
        createdAt: Date.now(),
      });

      const updated = ActionItemModel.update(created.id, {
        owner: 'Jane Smith',
      });

      expect(updated.owner).toBe('Jane Smith');
      expect(updated.task).toBe('Test task');
    });

    it('should update multiple fields at once', () => {
      const created = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John Doe',
        task: 'Original task',
        completed: false,
        createdAt: Date.now(),
      });

      const updated = ActionItemModel.update(created.id, {
        owner: 'Jane Smith',
        task: 'Updated task',
        completed: true,
      });

      expect(updated.owner).toBe('Jane Smith');
      expect(updated.task).toBe('Updated task');
      expect(updated.completed).toBe(true);
    });

    it('should return unchanged item when no updates provided', () => {
      const created = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John Doe',
        task: 'Test task',
        completed: false,
        createdAt: Date.now(),
      });

      const updated = ActionItemModel.update(created.id, {});

      expect(updated.owner).toBe(created.owner);
      expect(updated.task).toBe(created.task);
      expect(updated.completed).toBe(created.completed);
    });
  });

  describe('Session Association', () => {
    it('should only return action items for specific session', () => {
      // Create another session
      const session2 = createMockSession({ id: 'test-session-2' });
      SessionModel.create(session2);

      ActionItemModel.create({
        id: uuidv4(),
        sessionId: sessionId,
        owner: 'John',
        task: 'Session 1 Task',
        completed: false,
        createdAt: Date.now(),
      });

      ActionItemModel.create({
        id: uuidv4(),
        sessionId: session2.id,
        owner: 'Jane',
        task: 'Session 2 Task',
        completed: false,
        createdAt: Date.now(),
      });

      const session1Items = ActionItemModel.findBySessionId(sessionId);
      const session2Items = ActionItemModel.findBySessionId(session2.id);

      expect(session1Items).toHaveLength(1);
      expect(session2Items).toHaveLength(1);
      expect(session1Items[0].task).toBe('Session 1 Task');
      expect(session2Items[0].task).toBe('Session 2 Task');
    });

    it('should cascade delete action items when session is deleted', () => {
      const item = ActionItemModel.create({
        id: uuidv4(),
        sessionId,
        owner: 'John',
        task: 'Test task',
        completed: false,
        createdAt: Date.now(),
      });

      // Delete session
      SessionModel.delete(sessionId);

      // Action item should be deleted due to CASCADE
      const found = ActionItemModel.findById(item.id);
      expect(found).toBeNull();
    });
  });
});
