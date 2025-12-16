import { Socket } from 'socket.io';

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  // Add authentication logic here if needed in the future
  // For now, we allow all connections (zero-config philosophy)
  next();
}

export function validateSessionMiddleware(socket: Socket, next: (err?: Error) => void) {
  // Add session validation logic here if needed
  next();
}
