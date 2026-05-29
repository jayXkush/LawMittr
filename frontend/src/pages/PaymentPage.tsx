import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  IndianRupee,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { appointmentsApi } from '@/api/appointments.api';
import { paymentsApi } from '@/api/payments.api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

export function PaymentPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [error, setError] = useState('');

  const { data: appointmentData, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const res = await appointmentsApi.getById(appointmentId!);
      return res.data.data.appointment;
    },
    enabled: !!appointmentId,
  });

  const { data: demoEnabled } = useQuery({
    queryKey: ['payments', 'demo-enabled'],
    queryFn: async () => {
      const res = await paymentsApi.isDemoEnabled();
      return res.data.data.enabled;
    },
  });

  const demoMutation = useMutation({
    mutationFn: () => paymentsApi.demoPay(appointmentId!),
    onSuccess: () => {
      navigate(`/appointments/${appointmentId}/payment/success`, {
        state: { demo: true },
      });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Demo payment failed');
    },
  });

  const razorpayMutation = useMutation({
    mutationFn: async () => {
      await loadRazorpayScript();
      const orderRes = await paymentsApi.createOrder(appointmentId!);
      const { order } = orderRes.data.data;

      return new Promise<void>((resolve, reject) => {
        if (!window.Razorpay) {
          reject(new Error('Razorpay is not available'));
          return;
        }

        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amountPaise,
          currency: order.currency,
          name: 'LawMittr',
          description: 'Legal consultation booking',
          order_id: order.orderId,
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: { color: '#1e3a5f' },
          handler: async (response) => {
            try {
              await paymentsApi.verify({
                appointmentId: appointmentId!,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
        });

        rzp.on('payment.failed', () => {
          reject(new Error('Payment failed'));
        });
        rzp.open();
      });
    },
    onSuccess: () => {
      navigate(`/appointments/${appointmentId}/payment/success`);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      const msg = err.response?.data?.message || err.message || 'Payment failed';
      if (msg === 'Payment cancelled') {
        navigate(`/appointments/${appointmentId}/payment/failure`, {
          state: { reason: 'Payment was cancelled' },
        });
      } else {
        navigate(`/appointments/${appointmentId}/payment/failure`, {
          state: { reason: msg },
        });
      }
    },
  });

  useEffect(() => {
    if (appointmentData?.paymentStatus === 'paid' || appointmentData?.status === 'confirmed') {
      navigate(`/appointments/${appointmentId}/payment/success`, { replace: true });
    }
  }, [appointmentData, appointmentId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <LoadingState message="Loading payment details..." />
      </div>
    );
  }

  if (!appointmentData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <EmptyState title="Appointment not found" />
      </div>
    );
  }

  const apt = appointmentData;
  const isPayable = apt.status === 'pending' && apt.paymentStatus === 'pending';

  if (!isPayable) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-[var(--color-muted-foreground)]">
            This appointment is not awaiting payment.
          </p>
          <Link to="/dashboard/user" className="mt-4 inline-block">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/dashboard/user"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[var(--color-primary)]">Complete Payment</h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Secure your consultation slot with payment
            </p>
          </div>

          <Card className="mb-6 border-[var(--color-primary)]/15">
            <CardHeader>
              <CardTitle className="text-lg">Appointment Summary</CardTitle>
              <CardDescription>Review before paying</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="font-medium">{apt.lawyer?.name}</span>
                {apt.lawyer?.specialization?.[0] && (
                  <Badge variant="outline">{apt.lawyer.specialization[0]}</Badge>
                )}
              </p>
              <p className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
                <Calendar className="h-4 w-4" />
                {apt.date}
              </p>
              <p className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
                <Clock className="h-4 w-4" />
                {apt.startTime} – {apt.endTime}
              </p>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-[var(--color-muted)] px-4 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <IndianRupee className="h-5 w-5 text-[var(--color-primary)]" />
                  Consultation fee
                </span>
                <span className="text-xl font-bold text-[var(--color-primary)]">
                  ₹{apt.amount}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-[var(--color-primary)]" />
                Choose payment method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-destructive)]">
                  {error}
                </p>
              )}

              <Button
                className="h-12 w-full text-base"
                onClick={() => {
                  setError('');
                  razorpayMutation.mutate();
                }}
                isLoading={razorpayMutation.isPending}
              >
                <CreditCard className="h-5 w-5" />
                Pay with Razorpay
              </Button>
              <p className="text-center text-xs text-[var(--color-muted-foreground)]">
                Secured by Razorpay · UPI, cards, netbanking
              </p>

              {demoEnabled && (
                <>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--color-border)]" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[var(--color-card)] px-2 text-[var(--color-muted-foreground)]">
                        or for demo
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="h-12 w-full border-[var(--color-accent)]/40 text-base hover:bg-[var(--color-accent)]/10"
                    onClick={() => {
                      setError('');
                      demoMutation.mutate();
                    }}
                    isLoading={demoMutation.isPending}
                  >
                    <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
                    Continue with Demo Payment
                  </Button>
                  <p className="text-center text-xs text-[var(--color-muted-foreground)]">
                    No charge · Backend-validated demo flow for presentations
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
