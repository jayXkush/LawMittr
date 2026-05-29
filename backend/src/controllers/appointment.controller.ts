import { Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { User } from '../models/User';
import { LawyerProfile } from '../models/LawyerProfile';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { createNotification } from '../services/notification.service';

const notifyAppointmentParties = async (
  appointment: InstanceType<typeof Appointment>,
  title: string,
  message: string
) => {
  await Promise.all([
    createNotification(appointment.clientId, title, message),
    createNotification(appointment.lawyerId, title, message),
  ]);
};
export const formatAppointment = async (appointment: InstanceType<typeof Appointment>) => {
  const [client, lawyer, profile] = await Promise.all([
    User.findById(appointment.clientId).select('name email'),
    User.findById(appointment.lawyerId).select('name email'),
    LawyerProfile.findOne({ userId: appointment.lawyerId }),
  ]);

  return {
    id: appointment._id.toString(),
    clientId: appointment.clientId.toString(),
    lawyerId: appointment.lawyerId.toString(),
    slotId: appointment.slotId.toString(),
    date: appointment.date.toISOString().slice(0, 10),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    notes: appointment.notes,
    amount: appointment.amount,
    paymentStatus: appointment.paymentStatus,
    paymentMode: appointment.paymentMode ?? null,
    razorpayOrderId: appointment.razorpayOrderId ?? null,
    razorpayPaymentId: appointment.razorpayPaymentId ?? null,
    meetingId: appointment.status === 'confirmed' ? (appointment.meetingId ?? null) : null,
    meetingPassword:
      appointment.status === 'confirmed' ? (appointment.meetingPassword ?? null) : null,
    createdAt: appointment.createdAt,
    client: client ? { id: client._id.toString(), name: client.name, email: client.email } : null,
    lawyer: lawyer
      ? {
          id: lawyer._id.toString(),
          name: lawyer.name,
          email: lawyer.email,
          specialization: profile?.specialization ?? [],
          city: profile?.city ?? '',
          consultationFee: profile?.consultationFee ?? 0,
        }
      : null,
  };
};

export const bookAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { slotId, notes } = req.body;
  const clientId = req.user!.id;

  const slot = await AvailabilitySlot.findOneAndUpdate(
    { _id: slotId, status: 'available' },
    { status: 'booked' },
    { new: true }
  );

  if (!slot) {
    throw new AppError('Slot is not available or does not exist', 409);
  }

  const profile = await LawyerProfile.findOne({ userId: slot.lawyerId });
  const amount = profile?.consultationFee ?? 0;
  if (amount <= 0) {
    await AvailabilitySlot.findByIdAndUpdate(slot._id, { status: 'available' });
    throw new AppError('Lawyer consultation fee is not configured', 400);
  }

  try {
    const appointment = await Appointment.create({
      clientId,
      lawyerId: slot.lawyerId,
      slotId: slot._id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'pending',
      notes,
      amount,
      paymentStatus: 'pending',
    });

    const formatted = await formatAppointment(appointment);

    await createNotification(
      slot.lawyerId,
      'New appointment request',
      `A client booked a consultation on ${formatted.date} at ${formatted.startTime}.`
    );

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment: formatted },
    });
  } catch (error) {
    await AvailabilitySlot.findByIdAndUpdate(slot._id, { status: 'available' });
    if ((error as { code?: number }).code === 11000) {
      throw new AppError('This slot has already been booked', 409);
    }
    throw error;
  }
});

export const getMyAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    clientId: req.user!.id,
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  const formatted = await formatAppointment(appointment);

  res.json({
    success: true,
    data: { appointment: formatted },
  });
});

export const getMyAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { filter: filterType } = req.query as { filter?: 'upcoming' | 'history' };

  const query: Record<string, unknown> = { clientId: req.user!.id };
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (filterType === 'upcoming') {
    query.date = { $gte: today };
    query.status = { $in: ['pending', 'confirmed'] };
  } else if (filterType === 'history') {
    query.$or = [
      { date: { $lt: today } },
      { status: { $in: ['completed', 'cancelled'] } },
    ];
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(query).sort({ date: -1, startTime: -1 }).skip(skip).limit(limit),
    Appointment.countDocuments(query),
  ]);

  const formatted = await Promise.all(appointments.map(formatAppointment));

  res.json({
    success: true,
    data: { appointments: formatted },
    meta: paginationMeta(total, page, limit),
  });
});

export const getLawyerAppointments = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query);
    const { status } = req.query as { status?: string };

    const query: Record<string, unknown> = { lawyerId: req.user!.id };
    if (status) query.status = status;

    const [appointments, total] = await Promise.all([
      Appointment.find(query).sort({ date: 1, startTime: 1 }).skip(skip).limit(limit),
      Appointment.countDocuments(query),
    ]);

    const formatted = await Promise.all(appointments.map(formatAppointment));

    res.json({
      success: true,
      data: { appointments: formatted },
      meta: paginationMeta(total, page, limit),
    });
  }
);

export const updateAppointmentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      lawyerId: req.user!.id,
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (status === 'confirmed') {
      throw new AppError(
        'Appointments are confirmed automatically after client payment',
        400
      );
    }

    if (status === 'completed' && appointment.status !== 'confirmed') {
      throw new AppError('Only confirmed appointments can be marked complete', 400);
    }

    appointment.status = status;
    await appointment.save();

    if (status === 'cancelled') {
      await AvailabilitySlot.findByIdAndUpdate(appointment.slotId, {
        status: 'available',
      });
    }

    const formatted = await formatAppointment(appointment);

    const statusLabel = status === 'completed' ? 'completed' : 'cancelled';
    await notifyAppointmentParties(
      appointment,
      'Appointment status updated',
      `Your appointment on ${formatted.date} has been marked as ${statusLabel} by the lawyer.`
    );

    res.json({
      success: true,
      message: 'Appointment status updated',
      data: { appointment: formatted },
    });
  }
);

export const cancelMyAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    clientId: req.user!.id,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (!appointment) {
    throw new AppError('Appointment not found or cannot be cancelled', 404);
  }

  appointment.status = 'cancelled';
  await appointment.save();
  await AvailabilitySlot.findByIdAndUpdate(appointment.slotId, { status: 'available' });

  const formatted = await formatAppointment(appointment);

  await notifyAppointmentParties(
    appointment,
    'Appointment cancelled',
    `The appointment on ${formatted.date} at ${formatted.startTime} was cancelled by the client.`
  );

  res.json({
    success: true,
    message: 'Appointment cancelled',
    data: { appointment: formatted },
  });
});
