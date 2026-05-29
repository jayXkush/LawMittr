import { Types } from 'mongoose';
import { User } from '../models/User';
import { LawyerProfile } from '../models/LawyerProfile';
import { Appointment } from '../models/Appointment';
import { ForumPost } from '../models/ForumPost';
import { DocumentModel } from '../models/Document';
import { formatLawyerProfile, resolveUserId } from './lawyer.service';

export const formatAdminUser = (user: InstanceType<typeof User>) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive !== false,
  createdAt: user.createdAt,
});

export const formatAdminLawyer = (
  profile: InstanceType<typeof LawyerProfile>,
  user: { _id: Types.ObjectId; name: string; email: string; isActive?: boolean }
) => ({
  ...formatLawyerProfile(profile, user),
  isActive: user.isActive !== false,
  barCouncilNumber: profile.barCouncilNumber ?? null,
  yearsOfPractice: profile.yearsOfPractice,
  verificationStatus: profile.verificationStatus,
  rejectionReason: profile.rejectionReason ?? null,
});

export const getAnalyticsSummary = async () => {
  const [
    totalUsers,
    totalLawyers,
    pendingLawyerVerifications,
    totalAppointments,
    completedAppointments,
    totalForumPosts,
    totalDocumentsAnalyzed,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'lawyer' }),
    LawyerProfile.countDocuments({ verificationStatus: 'pending' }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'completed' }),
    ForumPost.countDocuments(),
    DocumentModel.countDocuments({ status: 'analyzed' }),
  ]);

  const uniqueAnalyzerUsers = await DocumentModel.distinct('userId', {
    status: 'analyzed',
  });

  return {
    totalUsers,
    totalLawyers,
    pendingLawyerVerifications,
    totalAppointments,
    completedAppointments,
    totalForumPosts,
    totalDocumentsUploaded: await DocumentModel.countDocuments(),
    totalDocumentsAnalyzed,
    totalAiAnalyzerUsers: uniqueAnalyzerUsers.length,
  };
};

export const getDocumentAnalytics = async () => {
  const [totalUploaded, totalAnalyzed, uniqueUsers] = await Promise.all([
    DocumentModel.countDocuments(),
    DocumentModel.countDocuments({ status: 'analyzed' }),
    DocumentModel.distinct('userId', { status: 'analyzed' }),
  ]);

  return {
    totalUploadedDocuments: totalUploaded,
    totalAiAnalyses: totalAnalyzed,
    totalActiveAnalyzerUsers: uniqueUsers.length,
  };
};

export const buildUserListFilter = (search?: string) => {
  const filter: Record<string, unknown> = {};
  if (search?.trim()) {
    const q = search.trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }
  return filter;
};

export const buildLawyerListFilter = (search?: string, verificationStatus?: string) => {
  const profileFilter: Record<string, unknown> = {};
  if (verificationStatus === 'pending' || verificationStatus === 'approved' || verificationStatus === 'rejected') {
    profileFilter.verificationStatus = verificationStatus;
  }

  return { profileFilter, search };
};

export const findLawyerProfilesForAdmin = async (
  profileFilter: Record<string, unknown>,
  search?: string
) => {
  let profiles = await LawyerProfile.find(profileFilter)
    .populate('userId', 'name email role isActive')
    .sort({ updatedAt: -1 })
    .lean();

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    profiles = profiles.filter((p) => {
      const user = p.userId as { name?: string; email?: string };
      const barMatch = p.barCouncilNumber?.toLowerCase().includes(q);
      const nameMatch = user?.name?.toLowerCase().includes(q);
      const emailMatch = user?.email?.toLowerCase().includes(q);
      return barMatch || nameMatch || emailMatch;
    });
  }

  return profiles.filter((p) => {
    const user = p.userId as { role?: string };
    return user?.role === 'lawyer';
  });
};

export const resolvePopulatedLawyerUser = (profile: {
  userId: unknown;
}) => {
  const populated = profile.userId as {
    _id: Types.ObjectId;
    name: string;
    email: string;
    isActive?: boolean;
  };
  return {
    _id: populated._id,
    name: populated.name,
    email: populated.email,
    isActive: populated.isActive,
  };
};

export const buildAppointmentAdminFilter = (query: {
  status?: string;
  search?: string;
  paymentStatus?: string;
}) => {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  return filter;
};

/** Used when formatting lawyer for public API — includes verification fields for lawyer's own view */
export const formatLawyerWithVerification = (
  profile: InstanceType<typeof LawyerProfile>,
  user: { _id: Types.ObjectId; name: string; email: string }
) => ({
  ...formatLawyerProfile(profile, user),
  barCouncilNumber: profile.barCouncilNumber ?? null,
  yearsOfPractice: profile.yearsOfPractice,
  verificationStatus: profile.verificationStatus,
  rejectionReason: profile.rejectionReason ?? null,
});

export { resolveUserId };
