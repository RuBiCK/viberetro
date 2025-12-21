/**
 * End-to-End tests for critical user flows
 * Tests integration of all features: action items, typing indicators,
 * markdown, connection status, etc.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Critical User Flows', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('/');
  });

  test.describe('Action Item Lifecycle', () => {
    test('should create, complete, and carry over action items', async () => {
      // Create session
      await page.click('text=Create Session');
      await page.fill('[name="sessionName"]', 'Sprint 42 Retro');
      await page.click('text=Start Session');

      // Advance to ACT stage
      await page.click('text=Advance Stage');
      await page.click('text=Advance Stage');
      await page.click('text=Advance Stage');
      await page.click('text=Advance Stage');

      // Create action item
      await page.click('text=Add Action Item');
      await page.fill('[name="task"]', 'Fix login bug');
      await page.fill('[name="owner"]', 'John Doe');
      await page.click('[name="priority"]');
      await page.click('text=High');
      await page.fill('[name="dueDate"]', '2025-12-31');
      await page.click('text=Create');

      // Verify action item appears
      await expect(page.locator('text=Fix login bug')).toBeVisible();
      await expect(page.locator('text=John Doe')).toBeVisible();
      await expect(page.locator('[data-priority="high"]')).toBeVisible();

      // Mark as complete
      await page.click('[data-action-id] [aria-label="Complete"]');

      await expect(page.locator('[data-action-id][data-completed="true"]')).toBeVisible();

      // Create new session
      await page.click('text=New Session');
      await page.fill('[name="sessionName"]', 'Sprint 43 Retro');
      await page.click('text=Start Session');

      // Check carry-over option
      await page.click('text=Carry over incomplete items');

      // Verify no carried items (since the one was completed)
      await expect(page.locator('text=Fix login bug')).not.toBeVisible();
    });

    test('should track action items with due dates', async () => {
      // Setup and navigate to ACT stage
      await setupSession(page);
      await advanceToActStage(page);

      // Create action item with due date
      await page.click('text=Add Action Item');
      await page.fill('[name="task"]', 'Update documentation');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill('[name="dueDate"]', tomorrow.toISOString().split('T')[0]);
      await page.click('text=Create');

      // Verify due date is shown
      const dueDate = page.locator('[data-due-date]');
      await expect(dueDate).toBeVisible();

      // Create overdue item (past date)
      await page.click('text=Add Action Item');
      await page.fill('[name="task"]', 'Overdue task');
      await page.fill('[name="dueDate"]', '2024-01-01');
      await page.click('text=Create');

      // Check overdue indicator
      await expect(page.locator('[data-overdue="true"]')).toBeVisible();
    });
  });

  test.describe('Real-time Typing Indicators', () => {
    test('should show typing indicators for multiple users', async ({ browser }) => {
      // Create session as host
      const hostContext = await browser.newContext();
      const hostPage = await hostContext.newPage();
      await hostPage.goto('/');

      const sessionId = await createSession(hostPage);

      // Join as second user
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();
      await userPage.goto(`/session/${sessionId}`);
      await userPage.fill('[name="displayName"]', 'User 2');
      await userPage.click('text=Join');

      // Advance to REFLECT stage
      await hostPage.click('text=Advance Stage');
      await hostPage.click('text=Advance Stage');

      // User 2 starts typing on a card
      await userPage.click('text=Add Card');
      await userPage.fill('[data-card-input]', 'T');

      // Host should see typing indicator
      await expect(hostPage.locator('text=User 2 is typing...')).toBeVisible({
        timeout: 2000,
      });

      // User 2 stops typing
      await userPage.fill('[data-card-input]', '');

      // Typing indicator should disappear
      await expect(hostPage.locator('text=User 2 is typing...')).not.toBeVisible({
        timeout: 4000,
      });

      await hostContext.close();
      await userContext.close();
    });

    test('should timeout typing indicator after inactivity', async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      const sessionId = await createSession(page1);
      await page2.goto(`/session/${sessionId}`);
      await page2.fill('[name="displayName"]', 'User 2');
      await page2.click('text=Join');

      await advanceToReflectStage(page1);

      // Start typing
      await page2.click('text=Add Card');
      await page2.fill('[data-card-input]', 'Test');

      // Verify indicator appears
      await expect(page1.locator('text=User 2 is typing...')).toBeVisible();

      // Wait for timeout (3 seconds)
      await page1.waitForTimeout(3500);

      // Indicator should disappear
      await expect(page1.locator('text=User 2 is typing...')).not.toBeVisible();

      await context.close();
    });
  });

  test.describe('Markdown Rendering', () => {
    test('should render markdown in cards', async () => {
      await setupSession(page);
      await advanceToReflectStage(page);

      // Create card with markdown
      await page.click('text=Add Card');
      await page.fill('[data-card-input]', '**Bold** and *italic* text');
      await page.click('text=Save');

      // Toggle preview
      await page.click('[aria-label="Preview markdown"]');

      // Verify rendered markdown
      await expect(page.locator('strong:has-text("Bold")')).toBeVisible();
      await expect(page.locator('em:has-text("italic")')).toBeVisible();
    });

    test('should sanitize malicious content', async () => {
      await setupSession(page);
      await advanceToReflectStage(page);

      // Attempt to inject script
      await page.click('text=Add Card');
      await page.fill(
        '[data-card-input]',
        '<script>alert("XSS")</script>Safe content'
      );
      await page.click('text=Save');

      // Verify script is not rendered
      const scriptElements = await page.locator('script').count();
      expect(scriptElements).toBe(0);

      // Verify safe content is visible
      await expect(page.locator('text=Safe content')).toBeVisible();
    });

    test('should render links with proper attributes', async () => {
      await setupSession(page);
      await advanceToReflectStage(page);

      await page.click('text=Add Card');
      await page.fill('[data-card-input]', '[Example](https://example.com)');
      await page.click('text=Save');

      await page.click('[aria-label="Preview markdown"]');

      const link = page.locator('a[href="https://example.com"]');
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test.describe('Connection Status', () => {
    test('should show connection status indicator', async () => {
      await page.goto('/session/test-session');

      // Connection indicator should be visible
      await expect(page.locator('[data-connection-status]')).toBeVisible();
      await expect(page.locator('text=Connected')).toBeVisible();
    });

    test('should handle reconnection on disconnect', async () => {
      const sessionId = await createSession(page);

      // Simulate network disconnect
      await page.evaluate(() => {
        window.dispatchEvent(new Event('offline'));
      });

      // Should show disconnected state
      await expect(page.locator('text=Disconnected')).toBeVisible({
        timeout: 2000,
      });

      // Simulate network reconnect
      await page.evaluate(() => {
        window.dispatchEvent(new Event('online'));
      });

      // Should attempt reconnection
      await expect(page.locator('text=Reconnecting')).toBeVisible({
        timeout: 2000,
      });

      await expect(page.locator('text=Connected')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should show latency indicator', async () => {
      await createSession(page);

      const latency = page.locator('[data-latency]');
      await expect(latency).toBeVisible();

      // Latency should be a number
      const latencyText = await latency.textContent();
      expect(latencyText).toMatch(/\d+ms/);
    });
  });

  test.describe('Mobile Responsive', () => {
    test('should adapt layout for mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 });

      await setupSession(page);

      // Check mobile layout
      const board = page.locator('[data-board]');
      await expect(board).toHaveClass(/mobile-layout/);

      // Check hamburger menu
      await expect(page.locator('[aria-label="Open menu"]')).toBeVisible();

      // Columns should stack vertically
      const columns = page.locator('[data-column]');
      const firstColumn = columns.first();
      const box = await firstColumn.boundingBox();

      expect(box?.width).toBeGreaterThan(300); // Should be full width
    });

    test('should support touch interactions', async () => {
      await page.setViewportSize({ width: 375, height: 667 });

      await setupSession(page);
      await advanceToReflectStage(page);

      // Create a card
      await page.click('text=Add Card');
      await page.fill('[data-card-input]', 'Test card');
      await page.click('text=Save');

      const card = page.locator('[data-card]').first();

      // Simulate long press
      await card.dispatchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      await page.waitForTimeout(600);

      // Should show context menu
      await expect(page.locator('[data-context-menu]')).toBeVisible();
    });
  });

  test.describe('Cluster Name Generation', () => {
    test('should generate cluster name when grouping cards', async () => {
      await setupSession(page);
      await advanceToGroupStage(page);

      // Create multiple cards with similar themes
      await createCard(page, 'Tests are slow');
      await createCard(page, 'Test suite timeout');
      await createCard(page, 'Need faster tests');

      // Drag card onto another to create cluster
      const card1 = page.locator('[data-card]').first();
      const card2 = page.locator('[data-card]').nth(1);

      await card1.dragTo(card2);

      // Wait for cluster name generation
      await expect(page.locator('[data-cluster-name]')).toBeVisible({
        timeout: 5000,
      });

      const clusterName = await page.locator('[data-cluster-name]').textContent();
      expect(clusterName).toMatch(/test|performance|speed/i);
    });

    test('should allow manual editing of cluster name', async () => {
      await setupSession(page);
      await advanceToGroupStage(page);

      await createCard(page, 'Card 1');
      await createCard(page, 'Card 2');

      const card1 = page.locator('[data-card]').first();
      const card2 = page.locator('[data-card]').nth(1);

      await card1.dragTo(card2);

      // Edit cluster name
      await page.click('[data-cluster-name]');
      await page.fill('[data-cluster-name-input]', 'Custom Cluster Name');
      await page.press('[data-cluster-name-input]', 'Enter');

      await expect(page.locator('text=Custom Cluster Name')).toBeVisible();
    });
  });

  test.describe('Multi-Session Support', () => {
    test('should maintain separate state for multiple sessions', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // Create two different sessions
      const session1Id = await createSession(page1, 'Session 1');
      const session2Id = await createSession(page2, 'Session 2');

      expect(session1Id).not.toBe(session2Id);

      // Add different cards to each session
      await advanceToReflectStage(page1);
      await createCard(page1, 'Session 1 Card');

      await advanceToReflectStage(page2);
      await createCard(page2, 'Session 2 Card');

      // Verify isolation
      await expect(page1.locator('text=Session 1 Card')).toBeVisible();
      await expect(page1.locator('text=Session 2 Card')).not.toBeVisible();

      await expect(page2.locator('text=Session 2 Card')).toBeVisible();
      await expect(page2.locator('text=Session 1 Card')).not.toBeVisible();

      await context1.close();
      await context2.close();
    });

    test('should show user session history', async () => {
      // Create multiple sessions
      await createSession(page, 'Session 1');
      await page.goto('/');

      await createSession(page, 'Session 2');
      await page.goto('/');

      // Go to history page
      await page.click('text=My Sessions');

      // Should show both sessions
      await expect(page.locator('text=Session 1')).toBeVisible();
      await expect(page.locator('text=Session 2')).toBeVisible();
    });
  });

  // Helper functions
  async function setupSession(page: Page, name = 'Test Session') {
    await page.click('text=Create Session');
    await page.fill('[name="sessionName"]', name);
    await page.click('text=Start Session');
  }

  async function createSession(page: Page, name = 'Test Session'): Promise<string> {
    await setupSession(page, name);

    const url = page.url();
    const sessionId = url.split('/').pop() || '';
    return sessionId;
  }

  async function advanceToReflectStage(page: Page) {
    await page.click('text=Advance Stage');
    await page.click('text=Advance Stage');
  }

  async function advanceToGroupStage(page: Page) {
    await advanceToReflectStage(page);
    await page.click('text=Advance Stage');
  }

  async function advanceToActStage(page: Page) {
    await advanceToGroupStage(page);
    await page.click('text=Advance Stage');
    await page.click('text=Advance Stage');
  }

  async function createCard(page: Page, content: string) {
    await page.click('text=Add Card');
    await page.fill('[data-card-input]', content);
    await page.click('text=Save');
  }
});
