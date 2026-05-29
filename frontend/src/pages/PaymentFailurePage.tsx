import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function PaymentFailurePage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const location = useLocation();
  const reason =
    (location.state as { reason?: string } | null)?.reason ||
    'Your payment could not be completed.';

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-10 w-10 text-[var(--color-destructive)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Payment Failed</h1>
          <p className="mt-2 text-[var(--color-muted-foreground)]">{reason}</p>
        </motion.div>

        <Card className="mt-8">
          <CardContent className="p-6 text-sm text-[var(--color-muted-foreground)]">
            Your appointment is still reserved but not confirmed until payment succeeds.
            You can retry payment or cancel from your dashboard.
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={`/appointments/${appointmentId}/payment`}>
            <Button className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Try again
            </Button>
          </Link>
          <Link to="/dashboard/user">
            <Button variant="outline" className="w-full sm:w-auto">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
