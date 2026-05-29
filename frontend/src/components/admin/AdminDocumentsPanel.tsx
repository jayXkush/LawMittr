import { useQuery } from '@tanstack/react-query';
import { FileText, Users, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { adminApi } from '@/api/admin.api';

export function AdminDocumentsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'documents', 'analytics'],
    queryFn: async () => {
      const res = await adminApi.getDocumentAnalytics();
      return res.data.data.analytics;
    },
  });

  if (isLoading) return <LoadingState message="Loading document analytics..." />;
  if (!data) return null;

  const cards = [
    {
      label: 'Total uploaded documents',
      value: data.totalUploadedDocuments,
      icon: Upload,
    },
    { label: 'Total AI analyses', value: data.totalAiAnalyses, icon: FileText },
    {
      label: 'Active AI analyzer users',
      value: data.totalActiveAnalyzerUsers,
      icon: Users,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document analytics</CardTitle>
        <CardDescription>
          Read-only stats from the AI document analyzer. Analysis functionality is unchanged.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-[var(--color-border)] p-4"
            >
              <card.icon className="mb-2 h-5 w-5 text-[var(--color-primary)]" />
              <p className="text-sm text-[var(--color-muted-foreground)]">{card.label}</p>
              <p className="mt-1 text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
