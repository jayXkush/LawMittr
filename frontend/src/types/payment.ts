export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  keyId: string;
  appointmentId: string;
}

export interface VerifyPaymentPayload {
  appointmentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
