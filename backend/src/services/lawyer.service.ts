import { Types } from 'mongoose';
import { User } from '../models/User';
import { LawyerProfile, ILawyerProfile } from '../models/LawyerProfile';

/** userId may be an ObjectId or a populated User subdocument from .populate() */
export function resolveUserId(
  userId: Types.ObjectId | { _id: Types.ObjectId } | string
): string {
  if (typeof userId === 'string') return userId;
  if (userId instanceof Types.ObjectId) return userId.toString();
  if (userId && typeof userId === 'object' && '_id' in userId) {
    return userId._id.toString();
  }
  return String(userId);
}

export const formatLawyerProfile = (
  profile: ILawyerProfile,
  user: { _id: Types.ObjectId; name: string; email: string },
  options?: { includeVerification?: boolean }
) => ({
  id: profile._id.toString(),
  userId: resolveUserId(profile.userId as Types.ObjectId | { _id: Types.ObjectId }),
  name: user.name,
  email: user.email,
  specialization: profile.specialization,
  experience: profile.experience,
  city: profile.city,
  languages: profile.languages,
  consultationFee: profile.consultationFee,
  rating: profile.rating,
  ratingCount: profile.ratingCount,
  bio: profile.bio,
  ...(options?.includeVerification && {
    barCouncilNumber: profile.barCouncilNumber ?? null,
    yearsOfPractice: profile.yearsOfPractice,
    verificationStatus: profile.verificationStatus,
    rejectionReason: profile.rejectionReason ?? null,
  }),
});

export const createDefaultLawyerProfile = async (userId: Types.ObjectId) => {
  const existing = await LawyerProfile.findOne({ userId });
  if (existing) return existing;

  return LawyerProfile.create({
    userId,
    specialization: ['General Practice'],
    experience: 0,
    city: '',
    languages: ['English'],
    consultationFee: 0,
    rating: 0,
    ratingCount: 0,
  });
};

export const getLawyerUser = async (lawyerId: string) => {
  if (!Types.ObjectId.isValid(lawyerId)) {
    return null;
  }
  const user = await User.findById(lawyerId);
  if (!user || user.role !== 'lawyer') return null;
  return user;
};
