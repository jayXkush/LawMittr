import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Scale,
  Calendar,
  MessageSquare,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { adminApi } from '@/api/admin.api';

export function AnalyticsOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const res = await adminApi.getAnalyticsSummary();
      return res.data.data.summary;
    },
  });

  if (isLoading) return <LoadingState message="Loading analytics..." />;
  if (!data) return null;

  const cards = [
    { label: 'Total Users', value: data.totalUsers, icon: Users },
    { label: 'Total Lawyers', value: data.totalLawyers, icon: Scale },
    {
      label: 'Pending Verifications',
      value: data.pendingLawyerVerifications,
      icon: ShieldAlert,
    },
    { label: 'Total Appointments', value: data.totalAppointments, icon: Calendar },
    {
      label: 'Completed Appointments',
      value: data.completedAppointments,
      icon: Calendar,
    },
    { label: 'Forum Posts', value: data.totalForumPosts, icon: MessageSquare },
    {
      label: 'Documents Analyzed',
      value: data.totalDocumentsAnalyzed,
      icon: FileText,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              {card.label}
            </CardTitle>
            <card.icon className="h-5 w-5 text-[var(--color-primary)]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
