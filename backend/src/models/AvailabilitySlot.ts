import mongoose, { Document, Schema, Types } from 'mongoose';

export type SlotStatus = 'available' | 'booked';

export interface IAvailabilitySlot extends Document {
  lawyerId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    lawyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid start time format (HH:mm)'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid end time format (HH:mm)'],
    },
    status: {
      type: String,
      enum: ['available', 'booked'],
      default: 'available',
    },
  },
  { timestamps: true }
);

availabilitySlotSchema.index(
  { lawyerId: 1, date: 1, startTime: 1 },
  { unique: true }
);
availabilitySlotSchema.index({ lawyerId: 1, status: 1, date: 1 });

export const AvailabilitySlot = mongoose.model<IAvailabilitySlot>(
  'AvailabilitySlot',
  availabilitySlotSchema
);
