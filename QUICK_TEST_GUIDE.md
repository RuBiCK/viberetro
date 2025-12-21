# Quick Test Guide

## TL;DR - Get Started in 5 Minutes

### 1. Install Test Dependencies

```bash
# Backend
cd backend
npm install --save-dev jest ts-jest @types/jest

# Frontend
cd ../frontend
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# E2E
cd ../e2e
npm install
npx playwright install
```

### 2. Run Tests

```bash
# Backend - From backend directory
npm test

# Frontend - From frontend directory
npm test

# E2E - From e2e directory
npm test
```

## What to Expect

### Before Implementing Features
All tests will **FAIL** ❌ - This is expected and correct! The tests define what needs to be built.

### After Implementing Features
Tests should **PASS** ✅ - This confirms your implementation is correct.

## Test Summary

| Feature | Backend Tests | Frontend Tests | E2E Tests | Total |
|---------|--------------|----------------|-----------|-------|
| Action Items | 133 | - | 2 | 135+ |
| Typing Indicators | 87 | - | 2 | 89+ |
| Multi-Session | 62 | - | 2 | 64+ |
| Markdown | 53 | 67 | 3 | 123+ |
| Mobile Responsive | - | 97 | 2 | 99+ |
| Cluster Names | 58 | - | 2 | 60+ |
| Connection Status | - | 100 | 2 | 102+ |
| **TOTAL** | **393** | **264** | **15** | **627+** |

## Quick Commands

### Backend Tests
```bash
cd backend

npm test                      # Run all
npm test ActionItem          # Run specific test
npm run test:coverage        # With coverage
npm run test:watch           # Watch mode
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests only
```

### Frontend Tests
```bash
cd frontend

npm test                      # Run all
npm test MarkdownEditor      # Run specific test
npm run test:coverage        # With coverage
npm run test:watch           # Watch mode
```

### E2E Tests
```bash
cd e2e

npm test                      # Run all (headless)
npm run test:headed          # See browser
npm run test:ui              # Interactive
npm run test:debug           # Debug mode
npm run test:chrome          # Chrome only
npm run test:mobile          # Mobile devices
npm run report               # View results
```

## File Locations

### Backend Tests
```
backend/tests/
├── unit/
│   ├── models/ActionItem.test.ts
│   ├── services/
│   │   ├── TypingIndicatorService.test.ts
│   │   ├── MultiSessionService.test.ts
│   │   └── ClusterNameService.test.ts
│   └── utils/markdown.test.ts
└── integration/
    └── sockets/
        ├── actionItem.test.ts
        └── typingIndicator.test.ts
```

### Frontend Tests
```
frontend/tests/
├── components/
│   ├── MarkdownEditor.test.tsx
│   └── ConnectionStatus.test.tsx
├── hooks/
│   └── useConnection.test.ts
└── responsive/
    ├── breakpoints.test.tsx
    └── touch.test.tsx
```

### E2E Tests
```
e2e/tests/
└── critical-flows.spec.ts
```

## Common Issues & Fixes

### Issue: "Cannot find module 'jest'"
**Fix**: Run `npm install` in the correct directory

### Issue: E2E tests won't start
**Fix**:
```bash
cd e2e
npx playwright install
docker-compose up -d  # Start services
```

### Issue: Tests timeout
**Fix**: Increase timeout in jest.config.js or playwright.config.ts

### Issue: Database locked errors
**Fix**:
```bash
rm backend/data/test.db
npm test
```

## Test Coverage Features

### Action Item Tracking
- ✅ Create with completion status, due dates, priority
- ✅ Update status, mark complete/incomplete
- ✅ Carry over incomplete items to new sessions
- ✅ Bulk operations
- ✅ Overdue detection
- ✅ Multiple assignees

### Typing Indicators
- ✅ Show when user is typing
- ✅ Auto-hide after 3 seconds
- ✅ Multiple users on same card
- ✅ Disconnect cleanup
- ✅ Throttling
- ✅ Field-specific (action items, cluster names)

### Multi-Session Support
- ✅ User session history
- ✅ Query by host, date, template
- ✅ Security verification
- ✅ Data isolation
- ✅ Statistics
- ✅ Archiving

### Markdown/Rich Text
- ✅ Full markdown rendering
- ✅ XSS prevention
- ✅ Editor with toolbar
- ✅ Preview mode
- ✅ Keyboard shortcuts
- ✅ Auto-save

### Mobile Responsive
- ✅ Mobile/tablet/desktop layouts
- ✅ Touch events (tap, drag, swipe)
- ✅ Multi-touch (pinch, rotate)
- ✅ Proper touch target sizes
- ✅ Landscape orientation

### Cluster Name Generation
- ✅ AI-powered generation
- ✅ Fallback algorithm
- ✅ Theme extraction
- ✅ Caching
- ✅ Multi-language

### Connection Status
- ✅ Real-time status display
- ✅ Latency tracking
- ✅ Auto-reconnection
- ✅ Exponential backoff
- ✅ Offline detection
- ✅ Visual indicators

## View Full Documentation

For detailed information, see:
- **TESTING.md** - Complete testing guide (580 lines)
- **TEST_SUMMARY.md** - Comprehensive summary with statistics

## Development Workflow

1. **Read Test**: Understand what feature should do
2. **Implement Feature**: Write the code
3. **Run Test**: Check if implementation is correct
4. **Fix Issues**: Adjust code until tests pass
5. **Refactor**: Improve code with confidence

## Help

If you need help:
1. Check TESTING.md for detailed guides
2. Look at test file comments
3. Run tests in debug mode
4. Check console output for errors

---

**Quick Start Time**: ~5 minutes
**Total Tests**: 627+
**Test Files**: 31
**Ready to Use**: Yes ✅
