import { Request, Response } from 'express';
import { User } from '../models/User';
import { LawyerProfile } from '../models/LawyerProfile';
import { Appointment } from '../models/Appointment';
import { ForumPost } from '../models/ForumPost';
import { ForumComment } from '../models/ForumComment';
import { Report } from '../models/Report';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { formatAppointment } from './appointment.controller';
import {
  formatAdminUser,
  formatAdminLawyer,
  getAnalyticsSummary,
  getDocumentAnalytics,
  buildUserListFilter,
  buildLawyerListFilter,
  findLawyerProfilesForAdmin,
  resolvePopulatedLawyerUser,
  buildAppointmentAdminFilter,
} from '../services/admin.service';
import {
  formatForumPost,
  formatForumComment,
  deletePostCascade,
  getPostByIdOrThrow,
} from '../services/forum.service';
import { formatReport } from '../services/report.service';
import { createNotification } from '../services/notification.service';
import { getLawyerUser } from '../services/lawyer.service';

const paramId = (raw: string | string[]): string =>
  typeof raw === 'string' ? raw : raw[0] ?? '';

export const getAnalyticsSummaryHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const summary = await getAnalyticsSummary();
    res.json({ success: true, data: { summary } });
  }
);

export const getDocumentAnalyticsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const analytics = await getDocumentAnalytics();
    res.json({ success: true, data: { analytics } });
  }
);

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search, role } = req.query as { search?: string; role?: string };

  const filter = buildUserListFilter(search);
  if (role === 'user' || role === 'lawyer' || role === 'admin') {
    filter.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { users: users.map(formatAdminUser) },
    meta: paginationMeta(total, page, limit),
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  let lawyerProfile = null;
  if (user.role === 'lawyer') {
    const profile = await LawyerProfile.findOne({ userId: user._id });
    if (profile) {
      lawyerProfile = formatAdminLawyer(profile, user);
    }
  }

  res.json({
    success: true,
    data: {
      user: formatAdminUser(user),
      lawyerProfile,
    },
  });
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (user.role === 'admin') {
    throw new AppError('Cannot deactivate an admin account', 400);
  }
  if (req.user!.id === user._id.toString()) {
    throw new AppError('You cannot deactivate your own account', 400);
  }

  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'User deactivated',
    data: { user: formatAdminUser(user) },
  });
});

export const reactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.isActive = true;
  await user.save();

  res.json({
    success: true,
    message: 'User reactivated',
    data: { user: formatAdminUser(user) },
  });
});

export const listLawyers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search, verificationStatus } = req.query as {
    search?: string;
    verificationStatus?: string;
  };

  const { profileFilter } = buildLawyerListFilter(search, verificationStatus);
  const profiles = await findLawyerProfilesForAdmin(profileFilter, search);
  const total = profiles.length;
  const paginated = profiles.slice(skip, skip + limit);

  const lawyers = paginated.map((p) => {
    const user = resolvePopulatedLawyerUser(p);
    return formatAdminLawyer(
      p as unknown as InstanceType<typeof LawyerProfile>,
      user
    );
  });

  res.json({
    success: true,
    data: { lawyers },
    meta: paginationMeta(total, page, limit),
  });
});

export const getLawyerById = asyncHandler(async (req: Request, res: Response) => {
  const user = await getLawyerUser(paramId(req.params.id));
  if (!user) {
    throw new AppError('Lawyer not found', 404);
  }

  const profile = await LawyerProfile.findOne({ userId: user._id });
  if (!profile) {
    throw new AppError('Lawyer profile not found', 404);
  }

  res.json({
    success: true,
    data: { lawyer: formatAdminLawyer(profile, user) },
  });
});

export const approveLawyerVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await getLawyerUser(paramId(req.params.id));
    if (!user) {
      throw new AppError('Lawyer not found', 404);
    }

    const profile = await LawyerProfile.findOne({ userId: user._id });
    if (!profile) {
      throw new AppError('Lawyer profile not found', 404);
    }

    profile.verificationStatus = 'approved';
    profile.rejectionReason = undefined;
    await profile.save();

    await createNotification(
      user._id,
      'Lawyer verification approved',
      'Your bar council verification has been approved. You are now listed for client bookings.'
    );

    res.json({
      success: true,
      message: 'Lawyer verification approved',
      data: { lawyer: formatAdminLawyer(profile, user) },
    });
  }
);

export const rejectLawyerVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const { rejectionReason } = req.body;
    const user = await getLawyerUser(paramId(req.params.id));
    if (!user) {
      throw new AppError('Lawyer not found', 404);
    }

    const profile = await LawyerProfile.findOne({ userId: user._id });
    if (!profile) {
      throw new AppError('Lawyer profile not found', 404);
    }

    profile.verificationStatus = 'rejected';
    profile.rejectionReason = rejectionReason;
    await profile.save();

    await createNotification(
      user._id,
      'Lawyer verification rejected',
      `Your verification request was rejected. Reason: ${rejectionReason}`
    );

    res.json({
      success: true,
      message: 'Lawyer verification rejected',
      data: { lawyer: formatAdminLawyer(profile, user) },
    });
  }
);

export const listAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { status, paymentStatus, search } = req.query as {
    status?: string;
    paymentStatus?: string;
    search?: string;
  };

  const filter = buildAppointmentAdminFilter({ status, paymentStatus });

  let appointments = await Appointment.find(filter)
    .sort({ createdAt: -1 })
    .skip(0)
    .limit(500);

  if (search?.trim()) {
    const formatted = await Promise.all(appointments.map(formatAppointment));
    const q = search.trim().toLowerCase();
    const filtered = formatted.filter(
      (a) =>
        a.client?.name.toLowerCase().includes(q) ||
        a.client?.email.toLowerCase().includes(q) ||
        a.lawyer?.name.toLowerCase().includes(q) ||
        a.lawyer?.email.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );
    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);
    res.json({
      success: true,
      data: { appointments: paginated },
      meta: paginationMeta(total, page, limit),
    });
    return;
  }

  const total = await Appointment.countDocuments(filter);
  appointments = await Appointment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const formatted = await Promise.all(appointments.map(formatAppointment));

  res.json({
    success: true,
    data: { appointments: formatted },
    meta: paginationMeta(total, page, limit),
  });
});

export const getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  res.json({
    success: true,
    data: { appointment: await formatAppointment(appointment) },
  });
});

export const listForumPosts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search } = req.query as { search?: string };

  const filter: Record<string, unknown> = {};
  if (search?.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const [posts, total] = await Promise.all([
    ForumPost.find(filter)
      .populate('authorId', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ForumPost.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      posts: posts.map((p) => formatForumPost(p, req.user!.id)),
    },
    meta: paginationMeta(total, page, limit),
  });
});

export const adminDeleteForumPost = asyncHandler(async (req: Request, res: Response) => {
  const postId = paramId(req.params.id);
  await getPostByIdOrThrow(postId);
  await deletePostCascade(postId);

  res.json({
    success: true,
    message: 'Post deleted successfully',
  });
});

export const listForumComments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { postId, search } = req.query as { postId?: string; search?: string };

  const filter: Record<string, unknown> = {};
  if (postId) filter.postId = postId;

  let comments = await ForumComment.find(filter)
    .populate('authorId', 'name role')
    .sort({ createdAt: -1 });

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    comments = comments.filter((c) => c.content.toLowerCase().includes(q));
  }

  const total = comments.length;
  const paginated = comments.slice(skip, skip + limit);

  res.json({
    success: true,
    data: {
      comments: paginated.map((c) => formatForumComment(c, req.user!.id)),
    },
    meta: paginationMeta(total, page, limit),
  });
});

export const adminDeleteForumComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await ForumComment.findById(req.params.id);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  await comment.deleteOne();
  await ForumPost.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });

  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { status } = req.query as { status?: string };

  const filter: Record<string, unknown> = {};
  if (status === 'pending' || status === 'resolved') {
    filter.status = status;
  }

  const [reports, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Report.countDocuments(filter),
  ]);

  const formatted = await Promise.all(reports.map(formatReport));

  res.json({
    success: true,
    data: { reports: formatted },
    meta: paginationMeta(total, page, limit),
  });
});

export const getReportById = asyncHandler(async (req: Request, res: Response) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  res.json({
    success: true,
    data: { report: await formatReport(report) },
  });
});

export const resolveReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }
  if (report.status === 'resolved') {
    throw new AppError('Report is already resolved', 400);
  }

  report.status = 'resolved';
  await report.save();

  await createNotification(
    report.reporterId,
    'Report resolved',
    'Your report has been reviewed and marked as resolved by the admin team.'
  );

  res.json({
    success: true,
    message: 'Report resolved',
    data: { report: await formatReport(report) },
  });
});
