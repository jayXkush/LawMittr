import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Star,
  Briefcase,
  IndianRupee,
  Languages,
  Calendar,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { lawyersApi } from '@/api/lawyers.api';
import { appointmentsApi } from '@/api/appointments.api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

export function LawyerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [bookError, setBookError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['lawyer', id],
    queryFn: async () => {
      const res = await lawyersApi.getById(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  const bookMutation = useMutation({
    mutationFn: () => appointmentsApi.book(selectedSlotId!, notes || undefined),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      const appointmentId = res.data.data.appointment.id;
      navigate(`/appointments/${appointmentId}/payment`);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setBookError(err.response?.data?.message || 'Booking failed');
    },
  });

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'user') {
      setBookError('Only client accounts can book appointments');
      return;
    }
    if (!selectedSlotId) {
      setBookError('Please select a time slot');
      return;
    }
    setBookError('');
    bookMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <LoadingState message="Loading lawyer profile..." />
      </div>
    );
  }

  if (!data?.lawyer) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <EmptyState title="Lawyer not found" />
      </div>
    );
  }

  const { lawyer, availableSlots } = data;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/lawyers"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to lawyers
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{lawyer.name}</CardTitle>
                  {lawyer.city && (
                    <p className="mt-1 flex items-center gap-1 text-[var(--color-muted-foreground)]">
                      <MapPin className="h-4 w-4" />
                      {lawyer.city}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-[var(--color-accent)]/15 px-3 py-1.5 font-semibold">
                  <Star className="h-5 w-5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                  {lawyer.rating.toFixed(1)}
                  <span className="text-sm font-normal text-[var(--color-muted-foreground)]">
                    ({lawyer.ratingCount} reviews)
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {lawyer.specialization.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <p className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[var(--color-primary)]" />
                  {lawyer.experience} years experience
                </p>
                <p className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-[var(--color-primary)]" />
                  ₹{lawyer.consultationFee} per session
                </p>
                <p className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-[var(--color-primary)]" />
                  {lawyer.languages.join(', ')}
                </p>
              </div>
              {lawyer.bio && (
                <p className="text-[var(--color-muted-foreground)]">{lawyer.bio}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Book a Consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!availableSlots.length ? (
                <EmptyState
                  title="No available slots"
                  description="This lawyer has not added availability yet. Check back soon."
                />
              ) : (
                <>
                  <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
                    Select an available time slot:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={cn(
                          'rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                          selectedSlotId === slot.id
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]'
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                        )}
                      >
                        <span className="font-medium">{slot.date}</span>
                        <span className="mx-2 text-[var(--color-muted-foreground)]">·</span>
                        {slot.startTime} – {slot.endTime}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-medium">Notes (optional)</label>
                    <textarea
                      className="mt-1 flex min-h-[60px] w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Brief description of your legal matter..."
                    />
                  </div>
                  {bookError && (
                    <p className="mt-2 text-sm text-[var(--color-destructive)]">{bookError}</p>
                  )}
                  <Button
                    className="mt-4 w-full sm:w-auto"
                    onClick={handleBook}
                    isLoading={bookMutation.isPending}
                  >
                    {isAuthenticated ? 'Book Appointment' : 'Sign in to Book'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
