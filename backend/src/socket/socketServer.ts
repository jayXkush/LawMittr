import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { allowedClientOrigins, env } from '../config/env';
import { socketAuthMiddleware } from './socketAuth';
import { registerRoomHandler } from './roomHandler';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedClientOrigins,
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // JWT authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`Socket connected: ${user?.name} (${user?.id})`);

    registerRoomHandler(io!, socket);

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${user?.name} — ${reason}`);
    });
  });

  console.log('Socket.IO server initialized');
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
}
