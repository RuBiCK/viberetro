# VibeRetro Testing Guide

This document provides comprehensive information about the test suites created for VibeRetro's new features.

## Overview

The test suites cover the following features:
1. **Action Item Tracking** - Completion status, due dates, carry-over functionality
2. **Real-time Typing Indicators** - Socket events, state management, timeout handling
3. **Multi-Session Support** - Session queries, security, history retrieval
4. **Rich Text/Markdown** - Rendering, sanitization, XSS prevention
5. **Mobile Responsive** - Breakpoints, touch interactions, layout adaptations
6. **Cluster Name Generation** - AI integration, fallback handling
7. **Connection Status** - Connection states, reconnection logic, latency tracking

## Test Structure

```
backend/
├── tests/
│   ├── setup.ts                           # Test configuration and helpers
│   ├── helpers/
│   │   └── socket-mock.ts                 # Socket.IO mocking utilities
│   ├── unit/
│   │   ├── models/
│   │   │   └── ActionItem.test.ts         # Action item model tests
│   │   ├── services/
│   │   │   ├── TypingIndicatorService.test.ts
│   │   │   ├── MultiSessionService.test.ts
│   │   │   └── ClusterNameService.test.ts
│   │   └── utils/
│   │       └── markdown.test.ts           # Markdown utilities tests
│   └── integration/
│       └── sockets/
│           ├── actionItem.test.ts         # Action item socket handlers
│           └── typingIndicator.test.ts    # Typing indicator socket handlers

frontend/
├── tests/
│   ├── setup.ts                           # Frontend test configuration
│   ├── helpers/
│   │   └── render.tsx                     # Custom render utilities
│   ├── components/
│   │   ├── MarkdownEditor.test.tsx        # Markdown editor tests
│   │   └── ConnectionStatus.test.tsx      # Connection status component
│   ├── hooks/
│   │   └── useConnection.test.ts          # Connection hook tests
│   └── responsive/
│       ├── breakpoints.test.tsx           # Responsive breakpoint tests
│       └── touch.test.tsx                 # Touch interaction tests

e2e/
├── tests/
│   └── critical-flows.spec.ts             # End-to-end integration tests
├── package.json
└── playwright.config.ts
```

## Installation

### Backend Tests

```bash
cd backend
npm install --save-dev jest ts-jest @types/jest
npm install --save-dev @types/better-sqlite3 @types/express @types/socket.io
```

### Frontend Tests

```bash
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event jest-environment-jsdom
```

### E2E Tests

```bash
cd e2e
npm install
npx playwright install
```

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- ActionItem.test.ts

# Run in watch mode
npm test -- --watch

# Run only unit tests
npm test -- tests/unit

# Run only integration tests
npm test -- tests/integration
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- MarkdownEditor.test.tsx

# Run in watch mode
npm test -- --watch

# Run responsive tests
npm test -- tests/responsive
```

### E2E Tests

```bash
cd e2e

# Run all E2E tests
npm test

# Run in headed mode (see browser)
npm run test:headed

# Run with UI mode (interactive)
npm run test:ui

# Run in debug mode
npm run test:debug

# Run specific browser
npm run test:chrome
npm run test:firefox
npm run test:safari

# Run mobile tests
npm run test:mobile

# View test report
npm run report
```

## Test Coverage

### Action Item Tracking Tests

**Unit Tests** (`backend/tests/unit/models/ActionItem.test.ts`)
- Completion status tracking with timestamps
- Due date management and overdue detection
- Carry-over functionality between sessions
- Priority levels (high, medium, low)
- Multiple assignees support
- Edge cases and validation

**Integration Tests** (`backend/tests/integration/sockets/actionItem.test.ts`)
- Socket event handling for status updates
- Real-time synchronization across clients
- Bulk operations (complete multiple items)
- Carry-over to new sessions
- Overdue item retrieval
- Error handling for invalid operations

### Real-time Typing Indicators Tests

**Unit Tests** (`backend/tests/unit/services/TypingIndicatorService.test.ts`)
- User typing state management
- Automatic timeout after inactivity (3 seconds)
- Multi-user tracking on same card
- Session isolation
- Field-specific typing (action items, cluster names)
- Throttling rapid events

**Integration Tests** (`backend/tests/integration/sockets/typingIndicator.test.ts`)
- Real-time broadcasting to room members
- Exclusion of self from broadcasts
- Disconnect handling and cleanup
- State synchronization on reconnection
- Rate limiting to prevent spam
- Performance optimization

### Multi-Session Support Tests

**Unit Tests** (`backend/tests/unit/services/MultiSessionService.test.ts`)
- User session history retrieval
- Active session queries
- Sessions by host, date range, template
- Session statistics and analytics
- Security: user access verification
- Host privilege verification
- Data isolation between sessions
- Search and filtering
- Session archiving
- Pagination

### Rich Text/Markdown Tests

**Unit Tests** (`backend/tests/unit/utils/markdown.test.ts`)
- XSS prevention and sanitization
- HTML script tag removal
- JavaScript protocol blocking
- Safe HTML tags (bold, italic, code)
- Markdown rendering (headers, lists, links, images)
- Code block syntax highlighting
- Link safety (target="_blank", rel="noopener")
- Auto-linking URLs and emails
- Table and task list support
- Unicode and special character handling
- Performance with large documents
- Caching rendered output

**Frontend Tests** (`frontend/tests/components/MarkdownEditor.test.tsx`)
- Text input and editing
- Toolbar actions (bold, italic, link, code)
- Preview mode toggle
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K)
- Character counter and max length
- Auto-save functionality
- Accessibility (ARIA labels, keyboard navigation)
- Error handling and validation
- Disabled state behavior

### Mobile Responsive Tests

**Breakpoint Tests** (`frontend/tests/responsive/breakpoints.test.tsx`)
- Mobile layout (< 768px): vertical stacking
- Tablet layout (768px - 1024px): 2-column grid
- Desktop layout (> 1024px): full columns
- Landscape orientation handling
- Dynamic resizing with debouncing
- Font scaling by viewport
- Grid adaptations
- Touch target sizes (minimum 44px)
- Print-friendly layout

**Touch Tests** (`frontend/tests/responsive/touch.test.tsx`)
- Touch start, move, end, cancel events
- Drag and drop with touch
- Long press detection (500ms)
- Swipe gestures (left, right)
- Minimum swipe distance and velocity
- Multi-touch: pinch to zoom, rotation
- Visual feedback on touch
- Haptic feedback (vibration)
- Scroll prevention during drag
- Touch target spacing
- Performance: passive listeners, throttling

### Cluster Name Generation Tests

**Unit Tests** (`backend/tests/unit/services/ClusterNameService.test.ts`)
- Theme extraction from card content
- AI-powered name generation
- Fallback algorithm using keyword extraction
- Common word filtering (stop words)
- Handling similar/different content
- Timeout and error handling for AI service
- Output sanitization
- Length validation and truncation
- Caching generated names
- Multi-language support
- Performance with large clusters
- Edge cases (empty, null, special characters)

### Connection Status Tests

**Component Tests** (`frontend/tests/components/ConnectionStatus.test.tsx`)
- Connection states: connected, connecting, disconnected, reconnecting, error
- Latency display with quality indicators (good, moderate, poor)
- Reconnect button and functionality
- Auto-hide behavior when connected
- Offline detection (navigator.onLine)
- Toast notifications for state changes
- Accessibility: ARIA labels, announcements
- Visual indicators and animations
- Compact mode with tooltips

**Hook Tests** (`frontend/tests/hooks/useConnection.test.ts`)
- Socket connection lifecycle
- Event listener registration
- Automatic reconnection with exponential backoff
- Manual reconnection
- Latency tracking with ping/pong
- Connection quality classification
- Network state integration (online/offline events)
- Cleanup on unmount
- Slow connection detection

### End-to-End Tests

**Critical Flows** (`e2e/tests/critical-flows.spec.ts`)
- Complete action item lifecycle across sessions
- Real-time typing indicators with multiple users
- Markdown rendering and XSS prevention
- Connection status display and reconnection
- Mobile responsive layout and touch
- Cluster name generation on grouping
- Multi-session data isolation

## Writing New Tests

### Backend Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { MyService } from '../../../src/services/MyService';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('should do something', () => {
    const result = service.doSomething();
    expect(result).toBe(expectedValue);
  });
});
```

### Frontend Component Test Example

```typescript
import { render, screen } from '../helpers/render';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user flow description', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Button');
  await expect(page.locator('text=Result')).toBeVisible();
});
```

## Test Utilities and Helpers

### Backend Helpers

**`tests/setup.ts`**
- `cleanupDatabase()` - Clear all tables
- `createMockSession()` - Create test session
- `createMockUser()` - Create test user
- `createMockCard()` - Create test card
- `createMockActionItem()` - Create test action item

**`tests/helpers/socket-mock.ts`**
- `createMockSocket()` - Mock Socket.IO socket
- `createMockIO()` - Mock Socket.IO server
- `expectSocketEmit()` - Assert socket emission
- `expectRoomEmit()` - Assert room broadcast

### Frontend Helpers

**`tests/setup.ts`**
- Mock Next.js router
- Mock Socket.IO client
- Mock window.matchMedia for responsive tests
- Mock localStorage
- Mock IntersectionObserver and ResizeObserver

**`tests/helpers/render.tsx`**
- `render()` - Custom render with providers
- `createMockSessionContext()` - Mock session context

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Example GitHub Actions workflow:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd backend && npm ci
      - run: cd backend && npm test -- --coverage

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm test -- --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd e2e && npm ci
      - run: cd e2e && npx playwright install --with-deps
      - run: docker-compose up -d
      - run: cd e2e && npm test
```

## Coverage Goals

- **Unit Tests**: Aim for 80%+ code coverage
- **Integration Tests**: Cover all socket events and service interactions
- **E2E Tests**: Cover critical user journeys and feature integration

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One Assertion per Test**: Keep tests focused
3. **Descriptive Names**: Use clear, descriptive test names
4. **Mock External Dependencies**: Don't test third-party code
5. **Clean Up**: Always clean up database and state between tests
6. **Avoid Hardcoded Timeouts**: Use waitFor instead
7. **Test User Behavior**: Test what users do, not implementation details

## Troubleshooting

### Tests Failing Locally

1. Ensure database is clean: `rm backend/data/test.db`
2. Check port conflicts: Ports 3001, 3002 must be available
3. Update dependencies: `npm install`

### E2E Tests Not Running

1. Install browsers: `cd e2e && npx playwright install`
2. Start services: `docker-compose up -d`
3. Check services are running: `docker-compose ps`

### Flaky Tests

1. Add proper wait conditions: Use `waitFor()` instead of timeouts
2. Check race conditions: Ensure proper async handling
3. Isolate tests: Make sure tests don't depend on each other

## Future Test Coverage

When implementing the features, consider adding tests for:
- Websocket reconnection edge cases
- Performance under load (stress testing)
- Accessibility with screen readers
- Browser compatibility (different versions)
- Network condition simulation (slow 3G, offline)

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

## Notes

⚠️ **Important**: These tests are ready to run but will fail until the features are implemented. The test files serve as:
1. **Specification**: Define expected behavior
2. **Documentation**: Explain how features should work
3. **Development Guide**: TDD approach for implementation

Once you implement each feature, run the corresponding tests to verify correctness.
