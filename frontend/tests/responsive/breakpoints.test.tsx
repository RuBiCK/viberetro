/**
 * Tests for responsive breakpoints and layout adaptations
 * Tests: viewport sizes, layout changes, component visibility
 */

import React from 'react';
import { render, screen } from '../helpers/render';
import { Board } from '@/components/Board/Board';
import { StagePipeline } from '@/components/StagePipeline';
import { createMockSession, createMockUser } from '../setup';

describe('Responsive Breakpoints', () => {
  const setViewport = (width: number, height: number = 800) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });

    window.dispatchEvent(new Event('resize'));
  };

  const mockMatchMedia = (width: number) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes(`max-width: ${width}px`),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  };

  describe('Mobile (< 768px)', () => {
    beforeEach(() => {
      setViewport(375);
      mockMatchMedia(375);
    });

    it('should render mobile layout on small screens', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const board = screen.getByTestId('board');
      expect(board).toHaveClass('mobile-layout');
    });

    it('should stack columns vertically on mobile', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const columns = screen.getAllByTestId('column');
      columns.forEach(column => {
        expect(column).toHaveStyle({ width: '100%' });
      });
    });

    it('should hide stage pipeline details on mobile', () => {
      const session = createMockSession();
      render(<StagePipeline session={session} />);

      expect(screen.queryByText('Stage Details')).not.toBeInTheDocument();
    });

    it('should show hamburger menu on mobile', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    });

    it('should use larger touch targets on mobile', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44); // Apple's recommended minimum
      });
    });

    it('should hide secondary navigation on mobile', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      expect(screen.queryByTestId('secondary-nav')).not.toBeInTheDocument();
    });

    it('should use compact card layout on mobile', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const cards = screen.queryAllByTestId('card');
      cards.forEach(card => {
        expect(card).toHaveClass('compact');
      });
    });
  });

  describe('Tablet (768px - 1024px)', () => {
    beforeEach(() => {
      setViewport(768);
      mockMatchMedia(768);
    });

    it('should render tablet layout', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const board = screen.getByTestId('board');
      expect(board).toHaveClass('tablet-layout');
    });

    it('should display 2 columns side by side on tablet', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const columns = screen.getAllByTestId('column');
      const firstColumn = columns[0];
      expect(firstColumn).toHaveStyle({ width: '50%' });
    });

    it('should show condensed stage pipeline on tablet', () => {
      const session = createMockSession();
      render(<StagePipeline session={session} />);

      expect(screen.getByTestId('stage-pipeline')).toHaveClass('condensed');
    });

    it('should display sidebar as overlay on tablet', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const sidebar = screen.queryByTestId('sidebar');
      if (sidebar) {
        expect(sidebar).toHaveClass('overlay');
      }
    });
  });

  describe('Desktop (> 1024px)', () => {
    beforeEach(() => {
      setViewport(1440);
      mockMatchMedia(1440);
    });

    it('should render desktop layout', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const board = screen.getByTestId('board');
      expect(board).toHaveClass('desktop-layout');
    });

    it('should display all columns side by side on desktop', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const columns = screen.getAllByTestId('column');
      expect(columns).toHaveLength(3);

      const container = columns[0].parentElement;
      expect(container).toHaveStyle({ display: 'flex' });
    });

    it('should show full stage pipeline on desktop', () => {
      const session = createMockSession();
      render(<StagePipeline session={session} />);

      expect(screen.getByText('Stage Details')).toBeInTheDocument();
    });

    it('should display persistent sidebar on desktop', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const sidebar = screen.queryByTestId('sidebar');
      if (sidebar) {
        expect(sidebar).not.toHaveClass('overlay');
      }
    });

    it('should use standard card layout on desktop', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const cards = screen.queryAllByTestId('card');
      cards.forEach(card => {
        expect(card).not.toHaveClass('compact');
      });
    });
  });

  describe('Landscape Orientation', () => {
    it('should adjust layout in landscape mode', () => {
      setViewport(667, 375); // iPhone landscape

      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const board = screen.getByTestId('board');
      expect(board).toHaveClass('landscape');
    });

    it('should use horizontal scrolling in landscape mobile', () => {
      setViewport(667, 375);

      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const board = screen.getByTestId('board');
      expect(board).toHaveStyle({ overflowX: 'auto' });
    });
  });

  describe('Dynamic Resizing', () => {
    it('should update layout when window resizes', () => {
      const { rerender } = render(<Board columns={['Start', 'Stop', 'Continue']} />);

      setViewport(375);
      rerender(<Board columns={['Start', 'Stop', 'Continue']} />);

      const board = screen.getByTestId('board');
      expect(board).toHaveClass('mobile-layout');

      setViewport(1440);
      rerender(<Board columns={['Start', 'Stop', 'Continue']} />);

      expect(board).toHaveClass('desktop-layout');
    });

    it('should debounce resize events', () => {
      jest.useFakeTimers();
      const onResize = jest.fn();

      render(<Board columns={['Start', 'Stop', 'Continue']} onResize={onResize} />);

      setViewport(400);
      setViewport(500);
      setViewport(600);

      jest.advanceTimersByTime(300);

      expect(onResize).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('Font Scaling', () => {
    it('should use larger fonts on mobile', () => {
      setViewport(375);

      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const heading = screen.getByRole('heading');
      const styles = window.getComputedStyle(heading);
      const fontSize = parseInt(styles.fontSize);

      expect(fontSize).toBeGreaterThanOrEqual(18);
    });

    it('should scale fonts proportionally on tablet', () => {
      setViewport(768);

      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const heading = screen.getByRole('heading');
      const styles = window.getComputedStyle(heading);
      const fontSize = parseInt(styles.fontSize);

      expect(fontSize).toBeGreaterThanOrEqual(16);
      expect(fontSize).toBeLessThanOrEqual(20);
    });
  });

  describe('Grid Adaptations', () => {
    it('should use single column grid on mobile', () => {
      setViewport(375);

      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const grid = screen.getByTestId('board');
      expect(grid).toHaveStyle({
        gridTemplateColumns: '1fr',
      });
    });

    it('should use multi-column grid on desktop', () => {
      setViewport(1440);

      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const grid = screen.getByTestId('board');
      expect(grid).toHaveStyle({
        gridTemplateColumns: 'repeat(3, 1fr)',
      });
    });
  });

  describe('Accessibility at Different Sizes', () => {
    it('should maintain focus indicators on mobile', () => {
      setViewport(375);

      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const button = screen.getAllByRole('button')[0];
      button.focus();

      expect(button).toHaveFocus();
      expect(button).toHaveStyle({ outline: expect.any(String) });
    });

    it('should support keyboard navigation on all screen sizes', () => {
      [375, 768, 1440].forEach(width => {
        setViewport(width);

        const { unmount } = render(<Board columns={['Start', 'Stop', 'Continue']} />);

        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);

        buttons[0].focus();
        expect(document.activeElement).toBe(buttons[0]);

        unmount();
      });
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily on resize', () => {
      const renderSpy = jest.fn();

      const TestComponent = () => {
        renderSpy();
        return <Board columns={['Start', 'Stop', 'Continue']} />;
      };

      render(<TestComponent />);

      const initialRenderCount = renderSpy.mock.calls.length;

      // Multiple rapid resizes
      setViewport(400);
      setViewport(410);
      setViewport(420);

      // Should not trigger immediate re-renders
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });
  });

  describe('Print Layout', () => {
    it('should use print-friendly layout', () => {
      render(<Board columns={['Start', 'Stop', 'Continue']} />);

      const board = screen.getByTestId('board');

      // Simulate print media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('print'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      expect(board).toHaveClass('print-layout');
    });
  });
});
