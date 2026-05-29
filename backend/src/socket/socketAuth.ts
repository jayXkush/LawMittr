import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface SocketUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

/**
 * Socket.IO middleware — verifies JWT from handshake auth.
 * Sets socket.data.user on success.
 */
export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.id).select('name email role');

    if (!user) {
      return next(new Error('User no longer exists'));
    }

    socket.data.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    } as SocketUser;

    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
};
