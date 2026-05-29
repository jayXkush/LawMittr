import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { adminApi } from '@/api/admin.api';
import type { AdminLawyer } from '@/types/admin';

export function AdminLawyersPanel() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [rejectTarget, setRejectTarget] = useState<AdminLawyer | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'lawyers', page, search, statusFilter],
    queryFn: async () => {
      const res = await adminApi.getLawyers({
        page,
        limit: 10,
        search: search || undefined,
        verificationStatus: statusFilter as 'pending' | 'approved' | 'rejected' | undefined,
      });
      return { lawyers: res.data.data.lawyers, meta: res.data.meta };
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveLawyer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'lawyers'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectLawyer(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'lawyers'] });
      setRejectTarget(null);
      setRejectionReason('');
    },
  });

  const statusBadge = (status: string) => {
    if (status === 'approved') return <Badge variant="success">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="outline">Rejected</Badge>;
    return <Badge variant="warning">Pending</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lawyer management</CardTitle>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <form
              className="flex flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput);
                setPage(1);
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <Input
                  className="pl-9"
                  placeholder="Search lawyers..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
            <select
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState message="Loading lawyers..." />
          ) : !data?.lawyers.length ? (
            <EmptyState title="No lawyers found" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
                      <th className="pb-3 pr-4 font-medium">Name</th>
                      <th className="pb-3 pr-4 font-medium">Bar council</th>
                      <th className="pb-3 pr-4 font-medium">Years</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lawyers.map((lawyer) => (
                      <tr key={lawyer.id} className="border-b border-[var(--color-border)]">
                        <td className="py-3 pr-4">
                          <p className="font-medium">{lawyer.name}</p>
                          <p className="text-xs text-[var(--color-muted-foreground)]">
                            {lawyer.email}
                          </p>
                        </td>
                        <td className="py-3 pr-4">{lawyer.barCouncilNumber ?? '—'}</td>
                        <td className="py-3 pr-4">{lawyer.yearsOfPractice}</td>
                        <td className="py-3 pr-4">{statusBadge(lawyer.verificationStatus)}</td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            {lawyer.verificationStatus !== 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => approveMutation.mutate(lawyer.userId)}
                                isLoading={approveMutation.isPending}
                              >
                                Approve
                              </Button>
                            )}
                            {lawyer.verificationStatus !== 'rejected' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setRejectTarget(lawyer)}
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject verification"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!rejectTarget || rejectionReason.trim().length < 10) return;
            rejectMutation.mutate({ id: rejectTarget.userId, reason: rejectionReason.trim() });
          }}
        >
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Rejecting <strong>{rejectTarget?.name}</strong>. Provide a reason visible to the lawyer.
          </p>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection reason</Label>
            <textarea
              id="rejection-reason"
              rows={4}
              className="flex w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={rejectMutation.isPending}
              disabled={rejectionReason.trim().length < 10}
            >
              Reject
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
