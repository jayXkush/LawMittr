import type { Lawyer } from './lawyer';
import type { Appointment } from './appointment';
import type { UserRole } from './auth';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AdminLawyer extends Lawyer {
  isActive: boolean;
  barCouncilNumber: string | null;
  yearsOfPractice: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
}

export interface AnalyticsSummary {
  totalUsers: number;
  totalLawyers: number;
  pendingLawyerVerifications: number;
  totalAppointments: number;
  completedAppointments: number;
  totalForumPosts: number;
  totalDocumentsUploaded: number;
  totalDocumentsAnalyzed: number;
  totalAiAnalyzerUsers: number;
}

export interface DocumentAnalytics {
  totalUploadedDocuments: number;
  totalAiAnalyses: number;
  totalActiveAnalyzerUsers: number;
}

export interface AdminListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminLawyerListParams extends AdminListParams {
  verificationStatus?: 'pending' | 'approved' | 'rejected';
}

export interface AdminAppointmentListParams extends AdminListParams {
  status?: string;
  paymentStatus?: string;
}

export type { Appointment };
