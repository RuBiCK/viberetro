/**
 * Unit tests for ActionItem model
 * Tests: completion status, due dates, carry-over functionality
 */

import { Database } from 'better-sqlite3';
import { ActionItemModel } from '../../../src/models/ActionItem';
import { SessionModel } from '../../../src/models/Session';
import { cleanupDatabase, createMockSession } from '../../setup';
import { getDatabase } from '../../../src/db/database';

describe('ActionItem Model - Extended Features', () => {
  let db: Database;
  let sessionId: string;

  beforeAll(() => {
    db = getDatabase();
  });

  beforeEach(() => {
    cleanupDatabase(db);
    const session = createMockSession();
    SessionModel.create(session);
    sessionId = session.id;
  });

  describe('Completion Status', () => {
    it('should create action item with default incomplete status', () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Implement new feature',
        completed: false,
      });

      expect(actionItem.completed).toBe(false);
      expect(actionItem.completedAt).toBeNull();
    });

    it('should update action item to completed with timestamp', () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Implement new feature',
        completed: false,
      });

      const beforeComplete = Date.now();
      const updated = ActionItemModel.update(actionItem.id, {
        completed: true,
        completedAt: Date.now(),
      });
      const afterComplete = Date.now();

      expect(updated.completed).toBe(true);
      expect(updated.completedAt).toBeGreaterThanOrEqual(beforeComplete);
      expect(updated.completedAt).toBeLessThanOrEqual(afterComplete);
    });

    it('should toggle completion status', () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Implement new feature',
        completed: false,
      });

      // Complete
      let updated = ActionItemModel.update(actionItem.id, {
        completed: true,
        completedAt: Date.now(),
      });
      expect(updated.completed).toBe(true);

      // Uncomplete
      updated = ActionItemModel.update(actionItem.id, {
        completed: false,
        completedAt: null,
      });
      expect(updated.completed).toBe(false);
      expect(updated.completedAt).toBeNull();
    });

    it('should get all completed action items for a session', () => {
      ActionItemModel.create({
        sessionId,
        owner: 'John',
        task: 'Task 1',
        completed: true,
        completedAt: Date.now(),
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Jane',
        task: 'Task 2',
        completed: false,
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Bob',
        task: 'Task 3',
        completed: true,
        completedAt: Date.now(),
      });

      const allItems = ActionItemModel.getAllBySession(sessionId);
      const completedItems = allItems.filter(item => item.completed);

      expect(completedItems).toHaveLength(2);
      expect(completedItems.every(item => item.completed)).toBe(true);
    });
  });

  describe('Due Dates', () => {
    it('should create action item with due date', () => {
      const dueDate = new Date('2025-12-31').getTime();
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Implement feature by end of year',
        dueDate,
      });

      expect(actionItem.dueDate).toBe(dueDate);
    });

    it('should update due date', () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Implement feature',
        dueDate: new Date('2025-12-31').getTime(),
      });

      const newDueDate = new Date('2026-01-15').getTime();
      const updated = ActionItemModel.update(actionItem.id, {
        dueDate: newDueDate,
      });

      expect(updated.dueDate).toBe(newDueDate);
    });

    it('should remove due date', () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Implement feature',
        dueDate: new Date('2025-12-31').getTime(),
      });

      const updated = ActionItemModel.update(actionItem.id, {
        dueDate: null,
      });

      expect(updated.dueDate).toBeNull();
    });

    it('should identify overdue action items', () => {
      const pastDue = new Date('2024-01-01').getTime();
      const futureDue = new Date('2026-12-31').getTime();
      const now = Date.now();

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
        task: 'No due date',
        completed: false,
      });

      const allItems = ActionItemModel.getAllBySession(sessionId);
      const overdueItems = allItems.filter(
        item => item.dueDate && item.dueDate < now && !item.completed
      );

      expect(overdueItems).toHaveLength(1);
      expect(overdueItems[0].task).toBe('Overdue task');
    });
  });

  describe('Carry-over Functionality', () => {
    it('should mark action item as carried over from previous session', () => {
      const previousSessionId = 'prev-session-id';
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Incomplete task from last retro',
        carriedFromSessionId: previousSessionId,
      });

      expect(actionItem.carriedFromSessionId).toBe(previousSessionId);
    });

    it('should get all carried-over items for a session', () => {
      const prevSessionId = 'prev-session-id';

      ActionItemModel.create({
        sessionId,
        owner: 'John',
        task: 'Carried over task 1',
        carriedFromSessionId: prevSessionId,
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Jane',
        task: 'New task',
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Bob',
        task: 'Carried over task 2',
        carriedFromSessionId: prevSessionId,
      });

      const allItems = ActionItemModel.getAllBySession(sessionId);
      const carriedItems = allItems.filter(item => item.carriedFromSessionId);

      expect(carriedItems).toHaveLength(2);
      expect(carriedItems.every(item => item.carriedFromSessionId === prevSessionId)).toBe(true);
    });

    it('should copy incomplete action items to new session', () => {
      // Create items in current session
      const item1 = ActionItemModel.create({
        sessionId,
        owner: 'John',
        task: 'Incomplete task',
        completed: false,
        dueDate: Date.now() + 86400000, // Tomorrow
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Jane',
        task: 'Completed task',
        completed: true,
        completedAt: Date.now(),
      });

      // Get incomplete items
      const incompleteItems = ActionItemModel.getAllBySession(sessionId)
        .filter(item => !item.completed);

      expect(incompleteItems).toHaveLength(1);
      expect(incompleteItems[0].task).toBe('Incomplete task');

      // Simulate carrying over to new session
      const newSessionId = 'new-session-id';
      const newSession = createMockSession({ id: newSessionId });
      SessionModel.create(newSession);

      const carriedItem = ActionItemModel.create({
        sessionId: newSessionId,
        owner: incompleteItems[0].owner,
        task: incompleteItems[0].task,
        dueDate: incompleteItems[0].dueDate,
        carriedFromSessionId: sessionId,
      });

      expect(carriedItem.sessionId).toBe(newSessionId);
      expect(carriedItem.carriedFromSessionId).toBe(sessionId);
      expect(carriedItem.task).toBe(item1.task);
    });

    it('should track carry-over history chain', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      const session3 = 'session-3';

      // Create sessions
      [session1, session2, session3].forEach(id => {
        SessionModel.create(createMockSession({ id }));
      });

      // Original item in session 1
      const original = ActionItemModel.create({
        sessionId: session1,
        owner: 'John',
        task: 'Long-running task',
      });

      // Carry to session 2
      const carryTo2 = ActionItemModel.create({
        sessionId: session2,
        owner: original.owner,
        task: original.task,
        carriedFromSessionId: session1,
      });

      // Carry to session 3
      const carryTo3 = ActionItemModel.create({
        sessionId: session3,
        owner: carryTo2.owner,
        task: carryTo2.task,
        carriedFromSessionId: session2,
      });

      expect(carryTo3.carriedFromSessionId).toBe(session2);

      // Trace back through history
      const session2Items = ActionItemModel.getAllBySession(session2);
      const parentItem = session2Items.find(item => item.task === carryTo3.task);
      expect(parentItem?.carriedFromSessionId).toBe(session1);
    });
  });

  describe('Priority Levels', () => {
    it('should create action item with priority', () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Critical bug fix',
        priority: 'high',
      });

      expect(actionItem.priority).toBe('high');
    });

    it('should default to medium priority if not specified', () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Regular task',
      });

      expect(actionItem.priority).toBe('medium');
    });

    it('should update priority', () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Task',
        priority: 'low',
      });

      const updated = ActionItemModel.update(actionItem.id, {
        priority: 'high',
      });

      expect(updated.priority).toBe('high');
    });

    it('should filter items by priority', () => {
      ActionItemModel.create({
        sessionId,
        owner: 'John',
        task: 'High priority',
        priority: 'high',
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Jane',
        task: 'Medium priority',
        priority: 'medium',
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Bob',
        task: 'Low priority',
        priority: 'low',
      });

      const allItems = ActionItemModel.getAllBySession(sessionId);
      const highPriorityItems = allItems.filter(item => item.priority === 'high');

      expect(highPriorityItems).toHaveLength(1);
      expect(highPriorityItems[0].task).toBe('High priority');
    });
  });

  describe('Assignee Management', () => {
    it('should support multiple assignees', () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Team task',
        assignees: ['John Doe', 'Jane Smith', 'Bob Wilson'],
      });

      expect(actionItem.assignees).toHaveLength(3);
      expect(actionItem.assignees).toContain('Jane Smith');
    });

    it('should update assignees list', () => {
      const actionItem = ActionItemModel.create({
        sessionId,
        owner: 'John Doe',
        task: 'Team task',
        assignees: ['John Doe'],
      });

      const updated = ActionItemModel.update(actionItem.id, {
        assignees: ['John Doe', 'Jane Smith'],
      });

      expect(updated.assignees).toHaveLength(2);
    });

    it('should get action items by assignee', () => {
      ActionItemModel.create({
        sessionId,
        owner: 'Task Owner',
        task: 'Task 1',
        assignees: ['John Doe', 'Jane Smith'],
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Task Owner',
        task: 'Task 2',
        assignees: ['Bob Wilson'],
      });

      ActionItemModel.create({
        sessionId,
        owner: 'Task Owner',
        task: 'Task 3',
        assignees: ['John Doe'],
      });

      const allItems = ActionItemModel.getAllBySession(sessionId);
      const johnsItems = allItems.filter(
        item => item.assignees && item.assignees.includes('John Doe')
      );

      expect(johnsItems).toHaveLength(2);
    });
  });
});
