import type { Server, Socket } from 'socket.io';
import { Appointment } from '../models/Appointment';
import type { SocketUser } from './socketAuth';

interface RoomParticipant {
  socketId: string;
  user: SocketUser;
  joinedAt: Date;
}

interface RoomState {
  meetingId: string;
  participants: Map<string, RoomParticipant>; // keyed by user id
  chatMessages: ChatMessage[];
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

// In-memory room store
const rooms = new Map<string, RoomState>();

// Disconnected users — grace period for reconnection
const disconnectedUsers = new Map<
  string,
  { meetingId: string; userId: string; timer: NodeJS.Timeout }
>();

const RECONNECT_GRACE_MS = 30_000; // 30 seconds
const MAX_PARTICIPANTS = 2;

function getRoom(meetingId: string): RoomState {
  let room = rooms.get(meetingId);
  if (!room) {
    room = {
      meetingId,
      participants: new Map(),
      chatMessages: [],
      createdAt: new Date(),
    };
    rooms.set(meetingId, room);
  }
  return room;
}

function cleanupRoom(meetingId: string): void {
  const room = rooms.get(meetingId);
  if (room && room.participants.size === 0) {
    rooms.delete(meetingId);
  }
}

export function registerRoomHandler(io: Server, socket: Socket): void {
  const user = socket.data.user as SocketUser;

  // ─── Join Room ─────────────────────────────────────────────
  socket.on(
    'join-room',
    async (
      data: { meetingId: string; meetingPassword: string },
      callback?: (res: { success: boolean; error?: string; participants?: string[] }) => void
    ) => {
      try {
        const { meetingId, meetingPassword } = data;

        // Validate appointment exists and credentials match
        const appointment = await Appointment.findOne({
          meetingId,
          meetingPassword,
          status: 'confirmed',
          paymentStatus: 'paid',
        });

        if (!appointment) {
          callback?.({ success: false, error: 'Invalid meeting credentials' });
          return;
        }

        // Only client or lawyer can join
        const clientId = appointment.clientId.toString();
        const lawyerId = appointment.lawyerId.toString();

        if (user.id !== clientId && user.id !== lawyerId) {
          callback?.({
            success: false,
            error: 'You are not authorized to join this meeting',
          });
          return;
        }

        const room = getRoom(meetingId);

        // Check if user is reconnecting
        const disconnectKey = `${meetingId}:${user.id}`;
        const disconnectEntry = disconnectedUsers.get(disconnectKey);
        if (disconnectEntry) {
          clearTimeout(disconnectEntry.timer);
          disconnectedUsers.delete(disconnectKey);
        }

        // Check room capacity (excluding self — user may be re-joining)
        const existingParticipants = Array.from(room.participants.values()).filter(
          (p) => p.user.id !== user.id
        );
        if (existingParticipants.length >= MAX_PARTICIPANTS) {
          callback?.({ success: false, error: 'Meeting room is full' });
          return;
        }

        // Join Socket.IO room
        socket.join(meetingId);

        // Add participant
        room.participants.set(user.id, {
          socketId: socket.id,
          user,
          joinedAt: new Date(),
        });

        // Notify existing participants
        socket.to(meetingId).emit('user-joined', {
          userId: user.id,
          name: user.name,
          role: user.role,
          isReconnect: !!disconnectEntry,
        });

        // Send existing chat history to the joining user
        if (room.chatMessages.length > 0) {
          socket.emit('chat-history', room.chatMessages);
        }

        // Build participant list (other users)
        const participantNames = existingParticipants.map((p) => p.user.name);

        // If there are 2 participants now, signal peer-ready to both
        if (room.participants.size === 2) {
          const participants = Array.from(room.participants.values());
          for (const p of participants) {
            const otherUser = participants.find((x) => x.user.id !== p.user.id);
            io.to(p.socketId).emit('peer-ready', {
              peerId: otherUser!.user.id,
              peerName: otherUser!.user.name,
              peerRole: otherUser!.user.role,
            });
          }
        }

        callback?.({ success: true, participants: participantNames });
      } catch (error) {
        console.error('join-room error:', error);
        callback?.({ success: false, error: 'Failed to join room' });
      }
    }
  );

  // ─── WebRTC Signaling ──────────────────────────────────────
  socket.on('offer', (data: { meetingId: string; offer: any }) => {
    socket.to(data.meetingId).emit('offer', {
      offer: data.offer,
      fromUserId: user.id,
      fromName: user.name,
    });
  });

  socket.on('answer', (data: { meetingId: string; answer: any }) => {
    socket.to(data.meetingId).emit('answer', {
      answer: data.answer,
      fromUserId: user.id,
    });
  });

  socket.on(
    'ice-candidate',
    (data: { meetingId: string; candidate: any }) => {
      socket.to(data.meetingId).emit('ice-candidate', {
        candidate: data.candidate,
        fromUserId: user.id,
      });
    }
  );

  // ─── Chat ──────────────────────────────────────────────────
  socket.on(
    'chat-message',
    (data: { meetingId: string; text: string }) => {
      const room = rooms.get(data.meetingId);
      if (!room || !room.participants.has(user.id)) return;

      const message: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        senderId: user.id,
        senderName: user.name,
        text: data.text.slice(0, 1000), // limit message length
        timestamp: new Date().toISOString(),
      };

      room.chatMessages.push(message);

      // Keep last 200 messages
      if (room.chatMessages.length > 200) {
        room.chatMessages = room.chatMessages.slice(-200);
      }

      io.to(data.meetingId).emit('chat-message', message);
    }
  );

  // ─── Leave Room ────────────────────────────────────────────
  socket.on('leave-room', (data: { meetingId: string }) => {
    handleLeave(io, socket, data.meetingId, false);
  });

  // ─── Disconnect ────────────────────────────────────────────
  socket.on('disconnect', () => {
    // Find which rooms this socket was in
    for (const [meetingId, room] of rooms.entries()) {
      if (room.participants.has(user.id)) {
        const participant = room.participants.get(user.id);
        if (participant?.socketId === socket.id) {
          handleLeave(io, socket, meetingId, true);
        }
      }
    }
  });
}

function handleLeave(
  io: Server,
  socket: Socket,
  meetingId: string,
  isDisconnect: boolean
): void {
  const user = socket.data.user as SocketUser;
  const room = rooms.get(meetingId);
  if (!room) return;

  if (isDisconnect) {
    // Grace period — allow reconnection
    const disconnectKey = `${meetingId}:${user.id}`;
    const timer = setTimeout(() => {
      // Grace period expired — remove from room permanently
      disconnectedUsers.delete(disconnectKey);
      room.participants.delete(user.id);

      io.to(meetingId).emit('user-left', {
        userId: user.id,
        name: user.name,
        permanent: true,
      });

      cleanupRoom(meetingId);
    }, RECONNECT_GRACE_MS);

    disconnectedUsers.set(disconnectKey, {
      meetingId,
      userId: user.id,
      timer,
    });

    // Notify peer about temporary disconnection
    socket.to(meetingId).emit('user-disconnected', {
      userId: user.id,
      name: user.name,
      gracePeriodMs: RECONNECT_GRACE_MS,
    });
  } else {
    // Intentional leave — remove immediately
    room.participants.delete(user.id);
    socket.leave(meetingId);

    socket.to(meetingId).emit('user-left', {
      userId: user.id,
      name: user.name,
      permanent: true,
    });

    cleanupRoom(meetingId);
  }
}
