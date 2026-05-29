export interface Lawyer {
  id: string;
  userId: string;
  name: string;
  email: string;
  specialization: string[];
  experience: number;
  city: string;
  languages: string[];
  consultationFee: number;
  rating: number;
  ratingCount: number;
  bio?: string;
  barCouncilNumber?: string | null;
  yearsOfPractice?: number;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
}

export type LawyerVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface LawyerVerification {
  barCouncilNumber: string | null;
  yearsOfPractice: number;
  verificationStatus: LawyerVerificationStatus;
  rejectionReason: string | null;
}

export interface SubmitVerificationPayload {
  barCouncilNumber: string;
  yearsOfPractice: number;
}

export interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked';
}

export interface LawyerFilters {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
  city?: string;
  language?: string;
  minRating?: string;
  maxFee?: string;
  sortBy?: 'rating' | 'fee' | 'experience';
  sortOrder?: 'asc' | 'desc';
}
