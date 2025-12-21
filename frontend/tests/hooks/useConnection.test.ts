/**
 * Tests for useConnection hook
 * Tests: connection lifecycle, reconnection logic, latency tracking
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useConnection } from '@/hooks/useConnection';
import { io } from 'socket.io-client';

jest.mock('socket.io-client');

describe('useConnection Hook', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      io: {
        engine: {
          on: jest.fn(),
        },
      },
    };

    (io as jest.MockedFunction<typeof io>).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Initialization', () => {
    it('should initialize with disconnected state', () => {
      const { result } = renderHook(() => useConnection());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });

    it('should register socket event listeners', () => {
      renderHook(() => useConnection());

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('should auto-connect on mount', () => {
      renderHook(() => useConnection({ autoConnect: true }));

      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should not auto-connect when disabled', () => {
      renderHook(() => useConnection({ autoConnect: false }));

      expect(mockSocket.connect).not.toHaveBeenCalled();
    });
  });

  describe('Connection Events', () => {
    it('should update state on connect', () => {
      const { result } = renderHook(() => useConnection());

      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'connect'
        )[1];
        mockSocket.connected = true;
        connectHandler();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toBe('connected');
    });

    it('should update state on disconnect', () => {
      const { result } = renderHook(() => useConnection());

      // First connect
      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'connect'
        )[1];
        mockSocket.connected = true;
        connectHandler();
      });

      // Then disconnect
      act(() => {
        const disconnectHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'disconnect'
        )[1];
        mockSocket.connected = false;
        disconnectHandler();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });

    it('should handle connection errors', () => {
      const { result } = renderHook(() => useConnection());

      act(() => {
        const errorHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'connect_error'
        )[1];
        errorHandler(new Error('Connection failed'));
      });

      expect(result.current.connectionState).toBe('error');
      expect(result.current.error).toBe('Connection failed');
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt reconnection on disconnect', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useConnection({ autoReconnect: true }));

      // Simulate disconnect
      act(() => {
        const disconnectHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'disconnect'
        )[1];
        disconnectHandler();
      });

      expect(result.current.connectionState).toBe('reconnecting');

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(mockSocket.connect).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('should track reconnection attempts', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useConnection({ autoReconnect: true }));

      // Simulate multiple failed reconnections
      for (let i = 0; i < 3; i++) {
        act(() => {
          const disconnectHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'disconnect'
          )[1];
          disconnectHandler();
        });

        jest.advanceTimersByTime(1000);

        act(() => {
          const errorHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'connect_error'
          )[1];
          errorHandler(new Error('Connection failed'));
        });
      }

      expect(result.current.reconnectAttempt).toBe(3);

      jest.useRealTimers();
    });

    it('should use exponential backoff for reconnection', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useConnection({ autoReconnect: true }));

      const delays: number[] = [];

      for (let i = 0; i < 5; i++) {
        act(() => {
          const disconnectHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'disconnect'
          )[1];
          disconnectHandler();
        });

        const startTime = Date.now();
        jest.advanceTimersByTime(10000);
        delays.push(Date.now() - startTime);

        act(() => {
          const errorHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'connect_error'
          )[1];
          errorHandler(new Error('Connection failed'));
        });
      }

      // Verify delays are increasing (exponential backoff)
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[2]).toBeGreaterThan(delays[1]);

      jest.useRealTimers();
    });

    it('should stop reconnecting after max attempts', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() =>
        useConnection({ autoReconnect: true, maxReconnectAttempts: 3 })
      );

      // Attempt reconnection 4 times
      for (let i = 0; i < 4; i++) {
        act(() => {
          const disconnectHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'disconnect'
          )[1];
          disconnectHandler();
        });

        jest.advanceTimersByTime(2000);

        act(() => {
          const errorHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'connect_error'
          )[1];
          errorHandler(new Error('Connection failed'));
        });
      }

      expect(result.current.connectionState).toBe('error');
      expect(result.current.reconnectAttempt).toBe(3);

      jest.useRealTimers();
    });

    it('should reset reconnect attempts on successful connection', () => {
      const { result } = renderHook(() => useConnection());

      // Simulate reconnect attempts
      act(() => {
        const disconnectHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'disconnect'
        )[1];
        disconnectHandler();
      });

      // Successful connection
      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'connect'
        )[1];
        mockSocket.connected = true;
        connectHandler();
      });

      expect(result.current.reconnectAttempt).toBe(0);
    });
  });

  describe('Manual Reconnection', () => {
    it('should allow manual reconnection', () => {
      const { result } = renderHook(() => useConnection());

      act(() => {
        result.current.reconnect();
      });

      expect(mockSocket.connect).toHaveBeenCalled();
      expect(result.current.connectionState).toBe('connecting');
    });

    it('should not reconnect if already connected', () => {
      const { result } = renderHook(() => useConnection());

      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'connect'
        )[1];
        mockSocket.connected = true;
        connectHandler();
      });

      act(() => {
        result.current.reconnect();
      });

      expect(mockSocket.connect).not.toHaveBeenCalled();
    });
  });

  describe('Latency Tracking', () => {
    it('should measure latency with ping/pong', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useConnection({ trackLatency: true }));

      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'connect'
        )[1];
        mockSocket.connected = true;
        connectHandler();
      });

      // Advance timer to trigger ping
      jest.advanceTimersByTime(5000);

      expect(mockSocket.emit).toHaveBeenCalledWith('ping', expect.any(Number));

      // Simulate pong response
      act(() => {
        const pongHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'pong'
        )?.[1];
        if (pongHandler) {
          pongHandler(Date.now() - 50);
        }
      });

      await waitFor(() => {
        expect(result.current.latency).toBeGreaterThan(0);
        expect(result.current.latency).toBeLessThan(100);
      });

      jest.useRealTimers();
    });

    it('should update latency periodically', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useConnection({ trackLatency: true }));

      act(() => {
        const connectHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'connect'
        )[1];
        mockSocket.connected = true;
        connectHandler();
      });

      const latencies: number[] = [];

      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(5000);

        act(() => {
          const pongHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'pong'
          )?.[1];
          if (pongHandler) {
            pongHandler(Date.now() - (30 + i * 10));
          }
        });

        await waitFor(() => {
          if (result.current.latency !== null) {
            latencies.push(result.current.latency);
          }
        });
      }

      expect(latencies.length).toBeGreaterThan(0);

      jest.useRealTimers();
    });

    it('should average latency over multiple samples', async () => {
      const { result } = renderHook(() => useConnection({ trackLatency: true }));

      const samples = [45, 50, 55];

      act(() => {
        samples.forEach(latency => {
          result.current['updateLatency'](latency);
        });
      });

      const average = samples.reduce((a, b) => a + b) / samples.length;
      expect(result.current.latency).toBeCloseTo(average, 0);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useConnection());

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('should disconnect socket on unmount', () => {
      const { unmount } = renderHook(() => useConnection());

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should clear reconnection timers on unmount', () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount } = renderHook(() => useConnection({ autoReconnect: true }));

      act(() => {
        const disconnectHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'disconnect'
        )[1];
        disconnectHandler();
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('Network State Integration', () => {
    it('should detect browser offline state', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const { result } = renderHook(() => useConnection());

      expect(result.current.isOnline).toBe(false);
    });

    it('should listen to online/offline events', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() => useConnection());

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should attempt reconnection when coming back online', () => {
      const { result } = renderHook(() => useConnection({ autoReconnect: true }));

      act(() => {
        const onlineHandler = window.addEventListener.mock.calls.find(
          call => call[0] === 'online'
        )?.[1] as EventListener;

        if (onlineHandler) {
          onlineHandler(new Event('online'));
        }
      });

      expect(mockSocket.connect).toHaveBeenCalled();
    });
  });

  describe('Connection Quality', () => {
    it('should classify connection quality based on latency', () => {
      const { result } = renderHook(() => useConnection());

      act(() => {
        result.current['updateLatency'](30);
      });
      expect(result.current.connectionQuality).toBe('excellent');

      act(() => {
        result.current['updateLatency'](150);
      });
      expect(result.current.connectionQuality).toBe('good');

      act(() => {
        result.current['updateLatency'](350);
      });
      expect(result.current.connectionQuality).toBe('poor');
    });

    it('should detect slow connection', () => {
      const { result } = renderHook(() => useConnection());

      act(() => {
        result.current['updateLatency'](800);
      });

      expect(result.current.isSlowConnection).toBe(true);
    });
  });
});
