export type ReportTargetType = 'forum_post' | 'forum_comment';
export type ReportStatus = 'pending' | 'resolved';

export interface Report {
  id: string;
  reporterId: string;
  reporter: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}
