/**
 * Mock Socket.IO utilities for testing socket handlers
 */

import { Server as SocketIOServer, Socket } from 'socket.io';

export interface MockSocket {
  id: string;
  data: any;
  emit: jest.Mock;
  to: jest.Mock;
  join: jest.Mock;
  leave: jest.Mock;
  disconnect: jest.Mock;
  on: jest.Mock;
}

export interface MockIO {
  to: jest.Mock;
  emit: jest.Mock;
  sockets: {
    sockets: Map<string, MockSocket>;
  };
}

export const createMockSocket = (socketData: any = {}): MockSocket => {
  const mockSocket: MockSocket = {
    id: 'mock-socket-id',
    data: socketData,
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
  };

  return mockSocket;
};

export const createMockIO = (): MockIO => {
  const mockIO: MockIO = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    sockets: {
      sockets: new Map(),
    },
  };

  return mockIO;
};

export const createMockRoom = (sockets: MockSocket[] = []) => {
  const room = {
    emit: jest.fn(),
    sockets: new Map(sockets.map(s => [s.id, s])),
  };

  return room;
};

/**
 * Helper to verify socket event emissions
 */
export const expectSocketEmit = (
  socket: MockSocket,
  event: string,
  data?: any
) => {
  if (data) {
    expect(socket.emit).toHaveBeenCalledWith(event, data);
  } else {
    expect(socket.emit).toHaveBeenCalledWith(expect.stringContaining(event), expect.anything());
  }
};

/**
 * Helper to verify room broadcasts
 */
export const expectRoomEmit = (
  io: MockIO,
  roomId: string,
  event: string,
  data?: any
) => {
  expect(io.to).toHaveBeenCalledWith(roomId);
  if (data) {
    expect(io.emit).toHaveBeenCalledWith(event, data);
  } else {
    expect(io.emit).toHaveBeenCalled();
  }
};
