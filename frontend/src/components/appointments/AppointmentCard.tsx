import { Link } from 'react-router-dom';
import { Calendar, Clock, CreditCard, User, Video, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Appointment, AppointmentStatus } from '@/types/appointment';
import { cn } from '@/lib/utils';

const statusVariant: Record<AppointmentStatus, 'default' | 'warning' | 'success' | 'outline'> = {
  pending: 'warning',
  confirmed: 'default',
  completed: 'success',
  cancelled: 'outline',
};

interface AppointmentCardProps {
  appointment: Appointment;
  viewAs: 'user' | 'lawyer';
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  isLoading?: boolean;
}

export function AppointmentCard({
  appointment,
  viewAs,
  onComplete,
  onCancel,
  isLoading,
}: AppointmentCardProps) {
  const displayName =
    viewAs === 'user' ? appointment.lawyer?.name : appointment.client?.name;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {displayName ?? 'Unknown'}
          </CardTitle>
          {viewAs === 'user' && appointment.lawyer?.specialization?.[0] && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {appointment.lawyer.specialization[0]}
              {appointment.lawyer.city ? ` · ${appointment.lawyer.city}` : ''}
            </p>
          )}
        </div>
        <Badge variant={statusVariant[appointment.status]} className="capitalize">
          {appointment.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--color-muted-foreground)]">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {appointment.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {appointment.startTime} – {appointment.endTime}
          </span>
        </div>
        {appointment.notes && (
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Note: {appointment.notes}
          </p>
        )}
        {viewAs === 'user' &&
          appointment.status === 'pending' &&
          appointment.paymentStatus === 'pending' && (
            <p className="mt-2 text-sm text-amber-700">Awaiting payment to confirm</p>
          )}
        {viewAs === 'lawyer' &&
          appointment.status === 'pending' &&
          appointment.paymentStatus === 'pending' && (
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              Waiting for client payment
            </p>
          )}
        {appointment.status === 'confirmed' && appointment.meetingId && (
          <div className="mt-3 rounded-lg bg-[var(--color-muted)]/60 px-3 py-2 text-sm">
            <p className="flex items-center gap-1 font-medium text-[var(--color-primary)]">
              <Video className="h-4 w-4" />
              Meeting ID: <code>{appointment.meetingId}</code>
            </p>
            {appointment.meetingPassword && (
              <p className="mt-1 flex items-center gap-1 text-[var(--color-muted-foreground)]">
                <KeyRound className="h-3.5 w-3.5" />
                Password: <code>{appointment.meetingPassword}</code>
              </p>
            )}
            <Link
              to={`/meeting/join?id=${encodeURIComponent(appointment.meetingId)}&pwd=${encodeURIComponent(appointment.meetingPassword || '')}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90"
            >
              <Video className="h-3.5 w-3.5" />
              Join Meeting
            </Link>
            {appointment.paymentMode === 'demo' && (
              <Badge variant="warning" className="mt-2 ml-2">
                Demo payment
              </Badge>
            )}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {viewAs === 'user' &&
            appointment.status === 'pending' &&
            appointment.paymentStatus === 'pending' && (
              <Link to={`/appointments/${appointment.id}/payment`}>
                <Button size="sm">
                  <CreditCard className="h-4 w-4" />
                  Complete Payment
                </Button>
              </Link>
            )}
          {viewAs === 'lawyer' && appointment.status === 'confirmed' && onComplete && (
            <Button size="sm" variant="outline" onClick={() => onComplete(appointment.id)} isLoading={isLoading}>
              Mark Complete
            </Button>
          )}
          {viewAs === 'lawyer' &&
            ['pending', 'confirmed'].includes(appointment.status) &&
            onCancel && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onCancel(appointment.id)}
                isLoading={isLoading}
              >
                Cancel
              </Button>
            )}
          {viewAs === 'user' &&
            ['pending', 'confirmed'].includes(appointment.status) &&
            onCancel && (
              <Button
                size="sm"
                variant="outline"
                className={cn('text-[var(--color-destructive)]')}
                onClick={() => onCancel(appointment.id)}
                isLoading={isLoading}
              >
                Cancel Booking
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
