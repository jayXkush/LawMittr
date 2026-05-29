import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { Appointment } from '../models/Appointment';
import { env } from '../config/env';

/**
 * GET /api/meetings/ice-servers
 * Returns ICE server configuration for WebRTC peer connections.
 */
export const getIceServers = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const iceServers: { urls: string | string[]; username?: string; credential?: string }[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    // Add TURN server if configured
    if (env.TURN_URL) {
      iceServers.push({
        urls: env.TURN_URL,
        username: env.TURN_USERNAME || '',
        credential: env.TURN_CREDENTIAL || '',
      });
    }

    res.json({ success: true, data: { iceServers } });
  }
);

/**
 * GET /api/meetings/:meetingId/validate
 * Pre-validates meeting credentials before socket connection.
 * Query: ?password=<meetingPassword>
 */
export const validateMeeting = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { meetingId } = req.params;
    const { password } = req.query;

    if (!password || typeof password !== 'string') {
      throw new AppError('Meeting password is required', 400);
    }

    const appointment = await Appointment.findOne({
      meetingId,
      meetingPassword: password,
      status: 'confirmed',
      paymentStatus: 'paid',
    })
      .populate('clientId', 'name email')
      .populate('lawyerId', 'name email');

    if (!appointment) {
      throw new AppError('Invalid meeting credentials', 404);
    }

    // Only client or lawyer can validate
    const userId = req.user!.id;
    const clientId = appointment.clientId._id
      ? appointment.clientId._id.toString()
      : appointment.clientId.toString();
    const lawyerId = appointment.lawyerId._id
      ? appointment.lawyerId._id.toString()
      : appointment.lawyerId.toString();

    if (userId !== clientId && userId !== lawyerId) {
      throw new AppError('You are not authorized to access this meeting', 403);
    }

    // Resolve names from populated fields
    const clientObj = appointment.clientId as unknown as { name: string; email: string };
    const lawyerObj = appointment.lawyerId as unknown as { name: string; email: string };

    res.json({
      success: true,
      data: {
        meetingId: appointment.meetingId,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        client: { name: clientObj.name, email: clientObj.email },
        lawyer: { name: lawyerObj.name, email: lawyerObj.email },
        userRole: userId === clientId ? 'client' : 'lawyer',
      },
    });
  }
);
