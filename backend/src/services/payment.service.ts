import Razorpay from 'razorpay';
import { env } from '../config/env';
import { Appointment, IAppointment, PaymentMode } from '../models/Appointment';
import { LawyerProfile } from '../models/LawyerProfile';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import {
  generateDemoTransactionId,
  generateMeetingId,
  generateMeetingPassword,
} from '../utils/meetingCredentials';
import { verifyPaymentSignature } from '../utils/razorpaySignature';
import { sendAppointmentConfirmationEmails } from './email.service';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export async function getPayableAppointment(
  appointmentId: string,
  clientId: string
): Promise<IAppointment> {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    clientId,
    status: 'pending',
    paymentStatus: 'pending',
  });

  if (!appointment) {
    throw new AppError('Appointment not found or not awaiting payment', 404);
  }

  return appointment;
}

export async function createRazorpayOrder(appointmentId: string, clientId: string) {
  const appointment = await getPayableAppointment(appointmentId, clientId);

  const profile = await LawyerProfile.findOne({ userId: appointment.lawyerId });
  const amount = profile?.consultationFee ?? appointment.amount;
  if (amount <= 0) {
    throw new AppError('Invalid consultation fee for this appointment', 400);
  }

  const amountPaise = Math.round(amount * 100);
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `apt_${appointment._id.toString().slice(-12)}`,
    notes: {
      appointmentId: appointment._id.toString(),
      clientId,
    },
  });

  appointment.amount = amount;
  appointment.razorpayOrderId = order.id;
  await appointment.save();

  return {
    orderId: order.id,
    amount,
    amountPaise,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
    appointmentId: appointment._id.toString(),
  };
}

interface ConfirmPaymentInput {
  appointmentId: string;
  paymentMode: PaymentMode;
  razorpayOrderId?: string;
  razorpayPaymentId: string;
}

export async function confirmAppointmentPayment(input: ConfirmPaymentInput) {
  const query: Record<string, unknown> = {
    _id: input.appointmentId,
    status: 'pending',
    paymentStatus: 'pending',
  };

  if (input.paymentMode === 'real' && input.razorpayOrderId) {
    query.razorpayOrderId = input.razorpayOrderId;
  }

  const appointment = await Appointment.findOne(query);
  if (!appointment) {
    throw new AppError('Appointment not found or already paid', 404);
  }

  appointment.paymentStatus = 'paid';
  appointment.paymentMode = input.paymentMode;
  appointment.razorpayPaymentId = input.razorpayPaymentId;
  if (input.razorpayOrderId) {
    appointment.razorpayOrderId = input.razorpayOrderId;
  }
  appointment.status = 'confirmed';
  appointment.meetingId = generateMeetingId();
  appointment.meetingPassword = generateMeetingPassword();
  await appointment.save();

  const [client, lawyer] = await Promise.all([
    User.findById(appointment.clientId).select('name email'),
    User.findById(appointment.lawyerId).select('name email'),
  ]);

  if (client && lawyer) {
    try {
      await sendAppointmentConfirmationEmails({
        clientName: client.name,
        clientEmail: client.email,
        lawyerName: lawyer.name,
        lawyerEmail: lawyer.email,
        date: appointment.date.toISOString().slice(0, 10),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        amount: appointment.amount,
        paymentMode: input.paymentMode,
        meetingId: appointment.meetingId!,
        meetingPassword: appointment.meetingPassword!,
        notes: appointment.notes,
      });
    } catch (err) {
      console.error('[email] Failed to send confirmation:', err);
    }
  }

  return appointment;
}

export async function verifyAndConfirmRazorpayPayment(
  appointmentId: string,
  clientId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  await getPayableAppointment(appointmentId, clientId);

  const valid = verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    env.RAZORPAY_KEY_SECRET
  );

  if (!valid) {
    throw new AppError('Invalid payment signature', 400);
  }

  return confirmAppointmentPayment({
    appointmentId,
    paymentMode: 'real',
    razorpayOrderId,
    razorpayPaymentId,
  });
}

export async function processDemoPayment(appointmentId: string, clientId: string) {
  if (!env.ENABLE_DEMO_PAYMENTS) {
    throw new AppError('Demo payments are disabled', 403);
  }

  await getPayableAppointment(appointmentId, clientId);

  return confirmAppointmentPayment({
    appointmentId,
    paymentMode: 'demo',
    razorpayPaymentId: generateDemoTransactionId(),
  });
}

export async function confirmFromWebhook(
  razorpayOrderId: string,
  razorpayPaymentId: string
) {
  const appointment = await Appointment.findOne({
    razorpayOrderId,
    status: 'pending',
    paymentStatus: 'pending',
  });

  if (!appointment) {
    return null;
  }

  return confirmAppointmentPayment({
    appointmentId: appointment._id.toString(),
    paymentMode: 'real',
    razorpayOrderId,
    razorpayPaymentId,
  });
}
