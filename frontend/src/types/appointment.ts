export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMode = 'real' | 'demo';

export interface Appointment {
  id: string;
  clientId: string;
  lawyerId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  meetingId: string | null;
  meetingPassword: string | null;
  createdAt: string;
  client: { id: string; name: string; email: string } | null;
  lawyer: {
    id: string;
    name: string;
    email: string;
    specialization: string[];
    city: string;
    consultationFee?: number;
  } | null;
}
