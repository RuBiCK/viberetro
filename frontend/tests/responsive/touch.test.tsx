/**
 * Tests for touch interactions on mobile devices
 * Tests: drag and drop, gestures, swipe, pinch-to-zoom
 */

import React from 'react';
import { render, screen, fireEvent } from '../helpers/render';
import { Card } from '@/components/Board/Card';
import { Cluster } from '@/components/Board/Cluster';
import { createMockCard, createMockUser } from '../setup';

describe('Touch Interactions', () => {
  const mockCard = createMockCard();
  const mockUser = createMockUser();

  const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
    return new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: touches.map(({ clientX, clientY }) => ({
        clientX,
        clientY,
        identifier: 0,
        target: document.body,
      } as Touch)),
      targetTouches: [],
      changedTouches: [],
    });
  };

  describe('Card Touch Interactions', () => {
    it('should handle touch start on card', () => {
      const onTouchStart = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onTouchStart={onTouchStart} />);

      const card = screen.getByTestId('card');
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);

      fireEvent(card, touchEvent);

      expect(onTouchStart).toHaveBeenCalled();
    });

    it('should handle touch move for dragging card', () => {
      const onDragMove = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onDragMove={onDragMove} />);

      const card = screen.getByTestId('card');

      // Start touch
      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      // Move touch
      const moveEvent = createTouchEvent('touchmove', [{ clientX: 150, clientY: 150 }]);
      fireEvent(card, moveEvent);

      expect(onDragMove).toHaveBeenCalledWith(expect.objectContaining({
        deltaX: 50,
        deltaY: 50,
      }));
    });

    it('should handle touch end to complete drag', () => {
      const onDragEnd = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onDragEnd={onDragEnd} />);

      const card = screen.getByTestId('card');

      // Start and end touch
      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      const endEvent = createTouchEvent('touchend', []);
      fireEvent(card, endEvent);

      expect(onDragEnd).toHaveBeenCalled();
    });

    it('should cancel drag on touch cancel', () => {
      const onDragCancel = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onDragCancel={onDragCancel} />);

      const card = screen.getByTestId('card');

      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      const cancelEvent = createTouchEvent('touchcancel', []);
      fireEvent(card, cancelEvent);

      expect(onDragCancel).toHaveBeenCalled();
    });

    it('should provide visual feedback during touch', () => {
      render(<Card card={mockCard} currentUser={mockUser} />);

      const card = screen.getByTestId('card');

      const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, touchEvent);

      expect(card).toHaveClass('touching');
    });

    it('should handle long press on card', () => {
      jest.useFakeTimers();
      const onLongPress = jest.fn();

      render(<Card card={mockCard} currentUser={mockUser} onLongPress={onLongPress} />);

      const card = screen.getByTestId('card');

      const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, touchEvent);

      jest.advanceTimersByTime(500);

      expect(onLongPress).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should not trigger long press if touch moves', () => {
      jest.useFakeTimers();
      const onLongPress = jest.fn();

      render(<Card card={mockCard} currentUser={mockUser} onLongPress={onLongPress} />);

      const card = screen.getByTestId('card');

      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      jest.advanceTimersByTime(200);

      const moveEvent = createTouchEvent('touchmove', [{ clientX: 150, clientY: 100 }]);
      fireEvent(card, moveEvent);

      jest.advanceTimersByTime(300);

      expect(onLongPress).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Swipe Gestures', () => {
    it('should detect swipe right', () => {
      const onSwipeRight = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onSwipeRight={onSwipeRight} />);

      const card = screen.getByTestId('card');

      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      const moveEvent = createTouchEvent('touchmove', [{ clientX: 250, clientY: 100 }]);
      fireEvent(card, moveEvent);

      const endEvent = createTouchEvent('touchend', []);
      fireEvent(card, endEvent);

      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('should detect swipe left', () => {
      const onSwipeLeft = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onSwipeLeft={onSwipeLeft} />);

      const card = screen.getByTestId('card');

      const startEvent = createTouchEvent('touchstart', [{ clientX: 250, clientY: 100 }]);
      fireEvent(card, startEvent);

      const moveEvent = createTouchEvent('touchmove', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, moveEvent);

      const endEvent = createTouchEvent('touchend', []);
      fireEvent(card, endEvent);

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should not trigger swipe on vertical movement', () => {
      const onSwipe = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onSwipe={onSwipe} />);

      const card = screen.getByTestId('card');

      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      const moveEvent = createTouchEvent('touchmove', [{ clientX: 100, clientY: 250 }]);
      fireEvent(card, moveEvent);

      const endEvent = createTouchEvent('touchend', []);
      fireEvent(card, endEvent);

      expect(onSwipe).not.toHaveBeenCalled();
    });

    it('should require minimum swipe distance', () => {
      const onSwipeRight = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onSwipeRight={onSwipeRight} />);

      const card = screen.getByTestId('card');

      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      // Small movement
      const moveEvent = createTouchEvent('touchmove', [{ clientX: 120, clientY: 100 }]);
      fireEvent(card, moveEvent);

      const endEvent = createTouchEvent('touchend', []);
      fireEvent(card, endEvent);

      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('should detect swipe velocity', () => {
      const onSwipe = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onSwipe={onSwipe} />);

      const card = screen.getByTestId('card');

      const startTime = Date.now();
      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      // Quick swipe
      const moveEvent = createTouchEvent('touchmove', [{ clientX: 250, clientY: 100 }]);
      fireEvent(card, moveEvent);

      const endEvent = createTouchEvent('touchend', []);
      fireEvent(card, endEvent);

      expect(onSwipe).toHaveBeenCalledWith(expect.objectContaining({
        velocity: expect.any(Number),
      }));
    });
  });

  describe('Multi-touch Gestures', () => {
    it('should handle pinch to zoom', () => {
      const onPinch = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onPinch={onPinch} />);

      const card = screen.getByTestId('card');

      // Two finger touch
      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);
      fireEvent(card, startEvent);

      // Pinch in
      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 125, clientY: 100 },
        { clientX: 175, clientY: 100 },
      ]);
      fireEvent(card, moveEvent);

      expect(onPinch).toHaveBeenCalledWith(expect.objectContaining({
        scale: expect.any(Number),
      }));
    });

    it('should handle two-finger rotation', () => {
      const onRotate = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onRotate={onRotate} />);

      const card = screen.getByTestId('card');

      const startEvent = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]);
      fireEvent(card, startEvent);

      // Rotate
      const moveEvent = createTouchEvent('touchmove', [
        { clientX: 100, clientY: 150 },
        { clientX: 200, clientY: 50 },
      ]);
      fireEvent(card, moveEvent);

      expect(onRotate).toHaveBeenCalledWith(expect.objectContaining({
        rotation: expect.any(Number),
      }));
    });

    it('should distinguish between pinch and drag', () => {
      const onPinch = jest.fn();
      const onDrag = jest.fn();

      render(
        <Card
          card={mockCard}
          currentUser={mockUser}
          onPinch={onPinch}
          onDragMove={onDrag}
        />
      );

      const card = screen.getByTestId('card');

      // Single finger drag
      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      const moveEvent = createTouchEvent('touchmove', [{ clientX: 150, clientY: 150 }]);
      fireEvent(card, moveEvent);

      expect(onDrag).toHaveBeenCalled();
      expect(onPinch).not.toHaveBeenCalled();
    });
  });

  describe('Touch Target Size', () => {
    it('should have minimum 44px touch target', () => {
      render(<Card card={mockCard} currentUser={mockUser} />);

      const card = screen.getByTestId('card');
      const styles = window.getComputedStyle(card);

      const minHeight = parseInt(styles.minHeight);
      const minWidth = parseInt(styles.minWidth);

      expect(minHeight).toBeGreaterThanOrEqual(44);
      expect(minWidth).toBeGreaterThanOrEqual(44);
    });

    it('should have adequate spacing between touch targets', () => {
      render(
        <div>
          <Card card={mockCard} currentUser={mockUser} />
          <Card card={{ ...mockCard, id: 'card-2' }} currentUser={mockUser} />
        </div>
      );

      const cards = screen.getAllByTestId('card');
      const firstCard = cards[0];
      const secondCard = cards[1];

      const firstRect = firstCard.getBoundingClientRect();
      const secondRect = secondCard.getBoundingClientRect();

      const spacing = secondRect.top - firstRect.bottom;
      expect(spacing).toBeGreaterThanOrEqual(8); // Minimum 8px spacing
    });
  });

  describe('Touch Feedback', () => {
    it('should show active state on touch', () => {
      render(<Card card={mockCard} currentUser={mockUser} />);

      const card = screen.getByTestId('card');

      const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, touchEvent);

      expect(card).toHaveClass('active');
    });

    it('should remove active state on touch end', () => {
      render(<Card card={mockCard} currentUser={mockUser} />);

      const card = screen.getByTestId('card');

      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      const endEvent = createTouchEvent('touchend', []);
      fireEvent(card, endEvent);

      expect(card).not.toHaveClass('active');
    });

    it('should provide haptic feedback on long press', () => {
      const vibrateSpy = jest.spyOn(navigator, 'vibrate').mockImplementation(() => true);

      jest.useFakeTimers();

      render(<Card card={mockCard} currentUser={mockUser} />);

      const card = screen.getByTestId('card');

      const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, touchEvent);

      jest.advanceTimersByTime(500);

      expect(vibrateSpy).toHaveBeenCalledWith(50);

      vibrateSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('Scroll Behavior', () => {
    it('should prevent scroll during drag', () => {
      render(<Card card={mockCard} currentUser={mockUser} />);

      const card = screen.getByTestId('card');

      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      const moveEvent = createTouchEvent('touchmove', [{ clientX: 150, clientY: 150 }]);
      const preventDefaultSpy = jest.spyOn(moveEvent, 'preventDefault');

      fireEvent(card, moveEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should allow vertical scroll when not dragging horizontally', () => {
      render(<Card card={mockCard} currentUser={mockUser} />);

      const card = screen.getByTestId('card');

      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      const moveEvent = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
      const preventDefaultSpy = jest.spyOn(moveEvent, 'preventDefault');

      fireEvent(card, moveEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Touch Performance', () => {
    it('should use passive event listeners where appropriate', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      render(<Card card={mockCard} currentUser={mockUser} />);

      const passiveCalls = addEventListenerSpy.mock.calls.filter(
        call => call[2] && typeof call[2] === 'object' && call[2].passive === true
      );

      expect(passiveCalls.length).toBeGreaterThan(0);

      addEventListenerSpy.mockRestore();
    });

    it('should throttle touch move events', () => {
      const onMove = jest.fn();
      render(<Card card={mockCard} currentUser={mockUser} onDragMove={onMove} />);

      const card = screen.getByTestId('card');

      const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, startEvent);

      // Rapid touch move events
      for (let i = 0; i < 10; i++) {
        const moveEvent = createTouchEvent('touchmove', [{ clientX: 100 + i, clientY: 100 }]);
        fireEvent(card, moveEvent);
      }

      // Should throttle and not call 10 times
      expect(onMove.mock.calls.length).toBeLessThan(10);
    });
  });

  describe('Accessibility with Touch', () => {
    it('should support keyboard focus after touch', () => {
      render(<Card card={mockCard} currentUser={mockUser} />);

      const card = screen.getByTestId('card');

      const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, touchEvent);

      card.focus();

      expect(card).toHaveFocus();
    });

    it('should announce touch actions to screen readers', () => {
      render(<Card card={mockCard} currentUser={mockUser} />);

      const card = screen.getByTestId('card');

      const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      fireEvent(card, touchEvent);

      const liveRegion = screen.getByRole('status', { hidden: true });
      expect(liveRegion).toHaveTextContent(/dragging/i);
    });
  });
});
