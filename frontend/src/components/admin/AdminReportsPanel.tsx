import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { adminApi } from '@/api/admin.api';

export function AdminReportsPanel() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', page, statusFilter],
    queryFn: async () => {
      const res = await adminApi.getReports({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      return { reports: res.data.data.reports, meta: res.data.meta };
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => adminApi.resolveReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Content reports</CardTitle>
          <select
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="">All</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState message="Loading reports..." />
        ) : !data?.reports.length ? (
          <EmptyState title="No reports" description="No reports in this queue." />
        ) : (
          <>
            <div className="space-y-4">
              {data.reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-lg border border-[var(--color-border)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Badge variant={report.status === 'pending' ? 'warning' : 'success'}>
                      {report.status}
                    </Badge>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">
                    <span className="font-medium">{report.reporter?.name}</span> reported a{' '}
                    {report.targetType === 'forum_post' ? 'post' : 'comment'}
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-foreground)]">{report.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.targetType === 'forum_post' ? (
                      <Link to={`/forum/post/${report.targetId}`}>
                        <Button size="sm" variant="outline">
                          View post
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        Comment ID: {report.targetId}
                      </span>
                    )}
                    {report.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => resolveMutation.mutate(report.id)}
                        isLoading={resolveMutation.isPending}
                      >
                        Mark resolved
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}
