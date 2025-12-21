import { io, Socket } from 'socket.io-client';

// Get the backend URL from environment variable
function getBackendUrl(): string {
  // Use environment variable or fall back to localhost for development
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = getBackendUrl();
    console.log('🔌 Connecting to backend:', socketUrl);

    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      reconnectionDelay: 1000, // Start with 1 second
      reconnectionDelayMax: 5000, // Max 5 seconds between attempts
      timeout: 20000, // Connection timeout
      transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
    });

    // Add reconnection event handlers for better logging
    socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt #${attempt}...`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
