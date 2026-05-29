import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileEditor } from '@/components/lawyers/ProfileEditor';
import { VerificationSection } from '@/components/lawyers/VerificationSection';
import { AvailabilityManager } from '@/components/lawyers/AvailabilityManager';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { Pagination } from '@/components/common/Pagination';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { appointmentsApi } from '@/api/appointments.api';
import { forumApi } from '@/api/forum.api';
import { PostCard } from '@/components/forum/PostCard';

type Tab = 'appointments' | 'availability' | 'profile' | 'verification';

export function LawyerDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('appointments');
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'lawyer', page],
    queryFn: async () => {
      const res = await appointmentsApi.getLawyerAppointments({ page, limit: 5 });
      return { appointments: res.data.data.appointments, meta: res.data.meta };
    },
    enabled: tab === 'appointments',
  });

  const { data: unansweredPosts, isLoading: unansweredLoading } = useQuery({
    queryKey: ['forum', 'posts', 'unanswered-dashboard'],
    queryFn: async () => {
      const res = await forumApi.getPosts({
        page: 1,
        limit: 3,
        unanswered: true,
        sortBy: 'newest',
      });
      return res.data.data.posts;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'completed' | 'cancelled' }) =>
      appointmentsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setActionId(null);
    },
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: 'appointments', label: 'Appointments' },
    { id: 'verification', label: 'Verification' },
    { id: 'availability', label: 'Availability' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <DashboardLayout
      title="Lawyer Portal"
      subtitle={`Welcome, ${user?.name ?? 'Counselor'} — manage your practice`}
    >
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-[var(--color-primary)]">Community discussions</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Help clients and peers with legal questions
              </p>
            </div>
            <Link to="/forum">
              <Button>
                <MessageSquare className="h-4 w-4" />
                Participate
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Unanswered discussions</CardTitle>
              <CardDescription>Topics waiting for a response</CardDescription>
            </div>
            <Link to="/forum?unanswered=true">
              <Button variant="outline" size="sm">
                Browse forum
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {unansweredLoading ? (
            <LoadingState message="Loading discussions..." />
          ) : !unansweredPosts?.length ? (
            <EmptyState
              title="All caught up"
              description="No unanswered discussions right now. Check back later."
            />
          ) : (
            <div className="space-y-4">
              {unansweredPosts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === 'profile' && <ProfileEditor />}

      {tab === 'verification' && <VerificationSection />}

      {tab === 'availability' && <AvailabilityManager />}

      {tab === 'appointments' && (
        <Card>
          <CardHeader>
            <CardTitle>Client Appointments</CardTitle>
            <CardDescription>Complete or cancel confirmed bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState message="Loading appointments..." />
            ) : !data?.appointments.length ? (
              <EmptyState
                title="No appointments yet"
                description="Add availability slots so clients can book with you."
              />
            ) : (
              <div className="space-y-4">
                {data.appointments.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    viewAs="lawyer"
                    isLoading={statusMutation.isPending && actionId === apt.id}
                    onComplete={(id) => {
                      setActionId(id);
                      statusMutation.mutate({ id, status: 'completed' });
                    }}
                    onCancel={(id) => {
                      setActionId(id);
                      statusMutation.mutate({ id, status: 'cancelled' });
                    }}
                  />
                ))}
                {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
