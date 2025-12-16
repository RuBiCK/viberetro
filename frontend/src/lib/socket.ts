import { io, Socket } from 'socket.io-client';

// Dynamically determine the backend URL based on the current hostname
function getBackendUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use localhost
    return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  }

  // Client-side: use the same host as the frontend
  const hostname = window.location.hostname;
  const protocol = window.location.protocol; // http: or https:

  // Always use port 3001 for the backend
  return `${protocol}//${hostname}:3001`;
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = getBackendUrl();
    console.log('🔌 Connecting to backend:', socketUrl);

    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
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
