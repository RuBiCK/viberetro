/**
 * Test setup file for backend tests
 * Runs before all tests to configure the test environment
 */

import { Database } from 'better-sqlite3';
import { SessionStage, SessionStatus, TemplateType } from '../../shared/types';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.PORT = '3001';
process.env.CORS_ORIGIN = 'http://localhost:3002';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

// Database cleanup helper
export const cleanupDatabase = (db: Database) => {
  const tables = [
    'ice_breakers',
    'action_items',
    'votes',
    'clusters',
    'cards',
    'users',
    'sessions',
  ];

  tables.forEach(table => {
    db.prepare(`DELETE FROM ${table}`).run();
  });
};

// Test data factories
export const createMockSession = (overrides = {}) => ({
  id: 'test-session-id',
  hostId: 'test-host-id',
  name: 'Test Session',
  stage: SessionStage.SETUP,
  status: SessionStatus.ACTIVE,
  settings: {
    template: TemplateType.START_STOP_CONTINUE,
    columns: ['Start', 'Stop', 'Continue'],
    timerDuration: 300,
    votesPerUser: 5,
    allowAnonymous: false,
    iceBreaker: 'What went well this sprint?',
    shortcutEnabled: false,
    shortcutProjectId: '',
  },
  timerEndAt: null,
  iceBreakersRevealed: false,
  votesRevealed: false,
  shortcutEnabled: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  sessionId: 'test-session-id',
  displayName: 'Test User',
  isHost: false,
  color: '#3B82F6',
  cursorPosition: null,
  joinedAt: Date.now(),
  ...overrides,
});

export const createMockCard = (overrides = {}) => ({
  id: 'test-card-id',
  sessionId: 'test-session-id',
  userId: 'test-user-id',
  column: 'Start',
  content: 'Test card content',
  position: { x: 100, y: 100 },
  clusterId: null,
  isRevealed: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createMockCluster = (overrides = {}) => ({
  id: 'test-cluster-id',
  sessionId: 'test-session-id',
  name: 'Test Cluster',
  cardIds: ['card-1', 'card-2'],
  column: 'Start',
  position: { x: 200, y: 200 },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createMockVote = (overrides = {}) => ({
  id: 'test-vote-id',
  sessionId: 'test-session-id',
  userId: 'test-user-id',
  targetId: 'test-card-id',
  targetType: 'card' as const,
  createdAt: Date.now(),
  ...overrides,
});

export const createMockActionItem = (overrides = {}) => ({
  id: 'test-action-id',
  sessionId: 'test-session-id',
  owner: 'Test User',
  task: 'Complete this task',
  completed: false,
  createdAt: Date.now(),
  ...overrides,
});
