import mongoose, { Document, Schema, Types } from 'mongoose';

export type LawyerVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface ILawyerProfile extends Document {
  userId: Types.ObjectId;
  specialization: string[];
  experience: number;
  city: string;
  languages: string[];
  consultationFee: number;
  rating: number;
  ratingCount: number;
  bio?: string;
  barCouncilNumber?: string;
  yearsOfPractice: number;
  verificationStatus: LawyerVerificationStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const lawyerProfileSchema = new Schema<ILawyerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: [String],
      default: [],
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    languages: {
      type: [String],
      default: ['English'],
    },
    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bio: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    barCouncilNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    yearsOfPractice: {
      type: Number,
      default: 0,
      min: 0,
      max: 60,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
      trim: true,
    },
  },
  { timestamps: true }
);

lawyerProfileSchema.index({ city: 1 });
lawyerProfileSchema.index({ specialization: 1 });
lawyerProfileSchema.index({ rating: -1 });
lawyerProfileSchema.index({ verificationStatus: 1 });

export const LawyerProfile = mongoose.model<ILawyerProfile>(
  'LawyerProfile',
  lawyerProfileSchema
);
