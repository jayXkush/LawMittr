import mongoose from 'mongoose';
import { Report, IReport, ReportTargetType } from '../models/Report';
import { ForumPost } from '../models/ForumPost';
import { ForumComment } from '../models/ForumComment';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';

export const formatReport = async (report: IReport) => {
  const reporter = await User.findById(report.reporterId).select('name email role');
  return {
    id: report._id.toString(),
    reporterId: report.reporterId.toString(),
    reporter: reporter
      ? {
          id: reporter._id.toString(),
          name: reporter.name,
          email: reporter.email,
          role: reporter.role,
        }
      : null,
    targetType: report.targetType,
    targetId: report.targetId.toString(),
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
};

export const assertReportTargetExists = async (
  targetType: ReportTargetType,
  targetId: string
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    throw new AppError('Report target not found', 404);
  }

  if (targetType === 'forum_post') {
    const post = await ForumPost.findById(targetId);
    if (!post) throw new AppError('Forum post not found', 404);
    return;
  }

  const comment = await ForumComment.findById(targetId);
  if (!comment) throw new AppError('Forum comment not found', 404);
};

export const getReportsList = async (query: {
  status?: string;
  page: number;
  limit: number;
  skip: number;
}) => {
  const filter: Record<string, unknown> = {};
  if (query.status === 'pending' || query.status === 'resolved') {
    filter.status = query.status;
  }

  const [reports, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(query.skip).limit(query.limit),
    Report.countDocuments(filter),
  ]);

  return { reports, total };
};
