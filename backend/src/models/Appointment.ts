import mongoose, { Document, Schema, Types } from 'mongoose';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMode = 'real' | 'demo';

export interface IAppointment extends Document {
  clientId: Types.ObjectId;
  lawyerId: Types.ObjectId;
  slotId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentMode?: PaymentMode;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  meetingId?: string;
  meetingPassword?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lawyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    slotId: {
      type: Schema.Types.ObjectId,
      ref: 'AvailabilitySlot',
      required: true,
      unique: true,
    },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentMode: {
      type: String,
      enum: ['real', 'demo'],
    },
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    meetingId: {
      type: String,
      trim: true,
    },
    meetingPassword: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ clientId: 1, date: -1 });
appointmentSchema.index({ lawyerId: 1, date: -1 });
appointmentSchema.index({ razorpayOrderId: 1 }, { sparse: true });

export const Appointment = mongoose.model<IAppointment>(
  'Appointment',
  appointmentSchema
);
