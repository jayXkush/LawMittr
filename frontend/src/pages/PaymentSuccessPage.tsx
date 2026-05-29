import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, KeyRound, Video } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { appointmentsApi } from '@/api/appointments.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';

export function PaymentSuccessPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const location = useLocation();
  const isDemo = Boolean((location.state as { demo?: boolean } | null)?.demo);

  const { data: apt, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const res = await appointmentsApi.getById(appointmentId!);
      return res.data.data.appointment;
    },
    enabled: !!appointmentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <LoadingState message="Loading confirmation..." />
      </div>
    );
  }

  const paymentLabel =
    apt?.paymentMode === 'demo' || isDemo
      ? 'Demo payment'
      : 'Paid via Razorpay';

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Payment Successful</h1>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            Your consultation is confirmed. A confirmation email has been sent if email is configured.
          </p>
          <Badge className="mt-3" variant={apt?.paymentMode === 'demo' ? 'warning' : 'success'}>
            {paymentLabel}
          </Badge>
        </motion.div>

        {apt && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Appointment confirmed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                <span className="text-[var(--color-muted-foreground)]">Lawyer: </span>
                <strong>{apt.lawyer?.name}</strong>
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                {apt.date} · {apt.startTime} – {apt.endTime}
              </p>
              {apt.meetingId && (
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 p-4 space-y-2">
                  <p className="flex items-center gap-2 font-medium text-[var(--color-primary)]">
                    <Video className="h-4 w-4" />
                    Meeting credentials
                  </p>
                  <p>
                    <span className="text-[var(--color-muted-foreground)]">Meeting ID: </span>
                    <code className="font-mono font-semibold">{apt.meetingId}</code>
                  </p>
                  <p className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                    <span className="text-[var(--color-muted-foreground)]">Password: </span>
                    <code className="font-mono font-semibold">{apt.meetingPassword}</code>
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Use these credentials to join your video consultation.
                  </p>
                  <Link
                    to={`/meeting/join?id=${encodeURIComponent(apt.meetingId!)}&pwd=${encodeURIComponent(apt.meetingPassword || '')}`}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90"
                  >
                    <Video className="h-4 w-4" />
                    Join Meeting
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/dashboard/user">
            <Button className="w-full sm:w-auto">View my appointments</Button>
          </Link>
          <Link to="/lawyers">
            <Button variant="outline" className="w-full sm:w-auto">
              Browse more lawyers
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
