/**
 * Tests for Connection Status component and logic
 * Tests: connection states, reconnection, offline handling
 */

import React from 'react';
import { render, screen, waitFor } from '../helpers/render';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useConnection } from '@/hooks/useConnection';

jest.mock('@/hooks/useConnection');

describe('ConnectionStatus Component', () => {
  const mockUseConnection = useConnection as jest.MockedFunction<typeof useConnection>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection States', () => {
    it('should show connected state', () => {
      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 50,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      expect(screen.getByText(/connected/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Connection status')).toHaveClass('connected');
    });

    it('should show connecting state', () => {
      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'connecting',
        latency: null,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      expect(screen.getByText(/connecting/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Connection status')).toHaveClass('connecting');
    });

    it('should show disconnected state', () => {
      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        latency: null,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Connection status')).toHaveClass('disconnected');
    });

    it('should show reconnecting state with attempt count', () => {
      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'reconnecting',
        latency: null,
        reconnectAttempt: 3,
      });

      render(<ConnectionStatus />);

      expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
      expect(screen.getByText(/attempt 3/i)).toBeInTheDocument();
    });

    it('should show error state', () => {
      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'error',
        latency: null,
        reconnectAttempt: 0,
        error: 'Connection failed',
      });

      render(<ConnectionStatus />);

      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
    });
  });

  describe('Latency Display', () => {
    it('should show latency when connected', () => {
      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 45,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      expect(screen.getByText(/45ms/i)).toBeInTheDocument();
    });

    it('should show good latency indicator', () => {
      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 30,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      const indicator = screen.getByTestId('latency-indicator');
      expect(indicator).toHaveClass('good');
    });

    it('should show moderate latency indicator', () => {
      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 150,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      const indicator = screen.getByTestId('latency-indicator');
      expect(indicator).toHaveClass('moderate');
    });

    it('should show poor latency indicator', () => {
      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 500,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      const indicator = screen.getByTestId('latency-indicator');
      expect(indicator).toHaveClass('poor');
    });

    it('should not show latency when disconnected', () => {
      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        latency: null,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      expect(screen.queryByText(/ms/i)).not.toBeInTheDocument();
    });
  });

  describe('Reconnection UI', () => {
    it('should show reconnect button when disconnected', () => {
      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        latency: null,
        reconnectAttempt: 0,
        reconnect: jest.fn(),
      });

      render(<ConnectionStatus />);

      expect(screen.getByRole('button', { name: /reconnect/i })).toBeInTheDocument();
    });

    it('should call reconnect function when button clicked', async () => {
      const reconnect = jest.fn();

      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        latency: null,
        reconnectAttempt: 0,
        reconnect,
      });

      render(<ConnectionStatus />);

      const button = screen.getByRole('button', { name: /reconnect/i });
      button.click();

      expect(reconnect).toHaveBeenCalled();
    });

    it('should disable reconnect button while reconnecting', () => {
      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'reconnecting',
        latency: null,
        reconnectAttempt: 1,
        reconnect: jest.fn(),
      });

      render(<ConnectionStatus />);

      const button = screen.getByRole('button', { name: /reconnect/i });
      expect(button).toBeDisabled();
    });

    it('should show progress indicator during reconnection', () => {
      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'reconnecting',
        latency: null,
        reconnectAttempt: 2,
      });

      render(<ConnectionStatus />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Auto-hide Behavior', () => {
    it('should auto-hide when connected after delay', async () => {
      jest.useFakeTimers();

      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 50,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus autoHide />);

      expect(screen.getByLabelText('Connection status')).toBeVisible();

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByLabelText('Connection status')).toHaveClass('hidden');
      });

      jest.useRealTimers();
    });

    it('should not auto-hide when disconnected', async () => {
      jest.useFakeTimers();

      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        latency: null,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus autoHide />);

      jest.advanceTimersByTime(5000);

      expect(screen.getByLabelText('Connection status')).toBeVisible();

      jest.useRealTimers();
    });

    it('should show again when connection changes', () => {
      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 50,
        reconnectAttempt: 0,
      });

      const { rerender } = render(<ConnectionStatus autoHide />);

      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        latency: null,
        reconnectAttempt: 0,
      });

      rerender(<ConnectionStatus autoHide />);

      expect(screen.getByLabelText('Connection status')).toBeVisible();
      expect(screen.getByLabelText('Connection status')).not.toHaveClass('hidden');
    });
  });

  describe('Offline Detection', () => {
    it('should detect browser offline state', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        latency: null,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    it('should show online when browser comes back online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 50,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
    });

    it('should listen to online/offline events', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      render(<ConnectionStatus />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });
  });

  describe('Toast Notifications', () => {
    it('should show toast when connection lost', () => {
      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 50,
        reconnectAttempt: 0,
      });

      const { rerender } = render(<ConnectionStatus showToast />);

      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        latency: null,
        reconnectAttempt: 0,
      });

      rerender(<ConnectionStatus showToast />);

      expect(screen.getByRole('alert')).toHaveTextContent(/connection lost/i);
    });

    it('should show toast when connection restored', () => {
      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        latency: null,
        reconnectAttempt: 0,
      });

      const { rerender } = render(<ConnectionStatus showToast />);

      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 50,
        reconnectAttempt: 0,
      });

      rerender(<ConnectionStatus showToast />);

      expect(screen.getByRole('alert')).toHaveTextContent(/connected/i);
    });

    it('should auto-dismiss success toasts', async () => {
      jest.useFakeTimers();

      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 50,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus showToast />);

      const toast = screen.getByRole('alert');
      expect(toast).toBeVisible();

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(toast).not.toBeVisible();
      });

      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 50,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      expect(screen.getByLabelText('Connection status')).toBeInTheDocument();
    });

    it('should announce state changes to screen readers', () => {
      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 50,
        reconnectAttempt: 0,
      });

      const { rerender } = render(<ConnectionStatus />);

      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        latency: null,
        reconnectAttempt: 0,
      });

      rerender(<ConnectionStatus />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/disconnected/i);
    });

    it('should have focusable reconnect button', () => {
      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'disconnected',
        latency: null,
        reconnectAttempt: 0,
        reconnect: jest.fn(),
      });

      render(<ConnectionStatus />);

      const button = screen.getByRole('button', { name: /reconnect/i });
      button.focus();

      expect(button).toHaveFocus();
    });
  });

  describe('Visual Indicators', () => {
    it('should show pulse animation when connecting', () => {
      mockUseConnection.mockReturnValue({
        isConnected: false,
        connectionState: 'connecting',
        latency: null,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus />);

      const indicator = screen.getByTestId('connection-indicator');
      expect(indicator).toHaveClass('pulse');
    });

    it('should show different colors for different states', () => {
      const states = [
        { connectionState: 'connected', expectedClass: 'green' },
        { connectionState: 'connecting', expectedClass: 'yellow' },
        { connectionState: 'disconnected', expectedClass: 'red' },
      ];

      states.forEach(({ connectionState, expectedClass }) => {
        mockUseConnection.mockReturnValue({
          isConnected: connectionState === 'connected',
          connectionState: connectionState as any,
          latency: null,
          reconnectAttempt: 0,
        });

        const { unmount } = render(<ConnectionStatus />);

        const indicator = screen.getByTestId('connection-indicator');
        expect(indicator).toHaveClass(expectedClass);

        unmount();
      });
    });
  });

  describe('Compact Mode', () => {
    it('should render compact version', () => {
      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 50,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus compact />);

      expect(screen.getByLabelText('Connection status')).toHaveClass('compact');
      expect(screen.queryByText(/connected/i)).not.toBeInTheDocument();
    });

    it('should show tooltip in compact mode', async () => {
      mockUseConnection.mockReturnValue({
        isConnected: true,
        connectionState: 'connected',
        latency: 50,
        reconnectAttempt: 0,
      });

      render(<ConnectionStatus compact />);

      const indicator = screen.getByTestId('connection-indicator');

      fireEvent.mouseEnter(indicator);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent(/connected/i);
      });
    });
  });
});
