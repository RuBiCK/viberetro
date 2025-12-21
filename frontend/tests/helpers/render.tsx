/**
 * Custom render utilities for testing React components with providers
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from '@/context/SessionContext';

interface WrapperProps {
  children: React.ReactNode;
}

// Mock session provider wrapper
export const MockSessionProvider: React.FC<WrapperProps> = ({ children }) => {
  return <>{children}</>;
};

const AllTheProviders: React.FC<WrapperProps> = ({ children }) => {
  return <MockSessionProvider>{children}</MockSessionProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

/**
 * Helper to create a mock session context value
 */
export const createMockSessionContext = (overrides = {}) => ({
  session: null,
  users: [],
  cards: [],
  clusters: [],
  votes: [],
  actionItems: [],
  iceBreakers: [],
  currentUser: null,
  isHost: false,
  connected: true,
  createCard: jest.fn(),
  updateCard: jest.fn(),
  deleteCard: jest.fn(),
  createCluster: jest.fn(),
  ungroupCluster: jest.fn(),
  castVote: jest.fn(),
  removeVote: jest.fn(),
  createActionItem: jest.fn(),
  updateActionItem: jest.fn(),
  deleteActionItem: jest.fn(),
  createIceBreaker: jest.fn(),
  revealIceBreakers: jest.fn(),
  revealVotes: jest.fn(),
  advanceStage: jest.fn(),
  startTimer: jest.fn(),
  moveCursor: jest.fn(),
  exportSession: jest.fn(),
  updateShortcutConfig: jest.fn(),
  createShortcutStories: jest.fn(),
  ...overrides,
});
