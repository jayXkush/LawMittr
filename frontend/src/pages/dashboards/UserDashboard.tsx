import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Search, FileText, MessageSquarePlus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { Pagination } from '@/components/common/Pagination';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { appointmentsApi } from '@/api/appointments.api';
import { forumApi } from '@/api/forum.api';
import { PostCard } from '@/components/forum/PostCard';

export function UserDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'me', tab, page],
    queryFn: async () => {
      const res = await appointmentsApi.getMine({
        filter: tab,
        page,
        limit: 5,
      });
      return { appointments: res.data.data.appointments, meta: res.data.meta };
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const { data: forumData, isLoading: forumLoading } = useQuery({
    queryKey: ['forum', 'posts', 'dashboard-recent'],
    queryFn: async () => {
      const res = await forumApi.getPosts({ page: 1, limit: 3, sortBy: 'newest' });
      return res.data.data.posts;
    },
  });

  const upcomingCount =
    tab === 'upcoming' ? data?.meta?.total ?? 0 : undefined;

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name?.split(' ')[0] ?? 'there'}`}
      subtitle="Manage your legal consultations"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Card className="flex-1 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-[var(--color-primary)]">Need legal advice?</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Browse lawyers and book a consultation
              </p>
            </div>
            <Link to="/lawyers">
              <Button>
                <Search className="h-4 w-4" />
                Find Lawyers
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex-1 border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-[var(--color-accent)]">AI Document Analyzer</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Upload legal docs for instant AI analysis
              </p>
            </div>
            <Link to="/documents">
              <Button variant="outline" className="border-[var(--color-accent)]/40 hover:bg-[var(--color-accent)]/10">
                <FileText className="h-4 w-4" />
                Analyze
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex-1 border-[var(--color-primary)]/10 bg-[var(--color-muted)]/30">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-[var(--color-primary)]">Community Forum</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Join legal discussions or ask the community
              </p>
            </div>
            <Link to="/forum/create">
              <Button variant="outline">
                <MessageSquarePlus className="h-4 w-4" />
                New post
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-8 w-8 text-[var(--color-primary)]" />
            <div>
              <p className="text-2xl font-bold">{upcomingCount ?? '—'}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Upcoming</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent forum discussions</CardTitle>
              <CardDescription>Latest topics from the legal community</CardDescription>
            </div>
            <Link to="/forum">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {forumLoading ? (
            <LoadingState message="Loading discussions..." />
          ) : !forumData?.length ? (
            <EmptyState
              title="No discussions yet"
              description="Start a conversation in the community forum."
              action={
                <Link to="/forum/create">
                  <Button>
                    <MessageSquarePlus className="h-4 w-4" />
                    Create discussion
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {forumData.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>My Appointments</CardTitle>
              <CardDescription>Upcoming and past consultations</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={tab === 'upcoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setTab('upcoming'); setPage(1); }}
              >
                Upcoming
              </Button>
              <Button
                variant={tab === 'history' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setTab('history'); setPage(1); }}
              >
                History
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState message="Loading appointments..." />
          ) : !data?.appointments.length ? (
            <EmptyState
              title={tab === 'upcoming' ? 'No upcoming appointments' : 'No appointment history'}
              description={
                tab === 'upcoming'
                  ? 'Book a lawyer to schedule your first consultation.'
                  : 'Completed and cancelled appointments appear here.'
              }
              action={
                tab === 'upcoming' ? (
                  <Link to="/lawyers">
                    <Button>Browse Lawyers</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {data.appointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  viewAs="user"
                  onCancel={(id) => cancelMutation.mutate(id)}
                  isLoading={cancelMutation.isPending}
                />
              ))}
              {data.meta && (
                <Pagination meta={data.meta} onPageChange={setPage} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
