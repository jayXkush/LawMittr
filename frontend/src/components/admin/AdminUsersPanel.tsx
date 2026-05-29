import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { adminApi } from '@/api/admin.api';
import type { AdminUser } from '@/types/admin';

export function AdminUsersPanel() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: async () => {
      const res = await adminApi.getUsers({ page, limit: 10, search: search || undefined });
      return { users: res.data.data.users, meta: res.data.meta };
    },
  });

  const { data: detail } = useQuery({
    queryKey: ['admin', 'users', selectedId],
    queryFn: async () => {
      const res = await adminApi.getUser(selectedId!);
      return res.data.data;
    },
    enabled: !!selectedId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? adminApi.reactivateUser(id) : adminApi.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ['admin', 'users', selectedId] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>User management</CardTitle>
        <form
          className="mt-4 flex gap-2"
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
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState message="Loading users..." />
        ) : !data?.users.length ? (
          <EmptyState title="No users found" description="Try a different search." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Role</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user: AdminUser) => (
                    <tr key={user.id} className="border-b border-[var(--color-border)]">
                      <td className="py-3 pr-4 font-medium">{user.name}</td>
                      <td className="py-3 pr-4">{user.email}</td>
                      <td className="py-3 pr-4 capitalize">{user.role}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={user.isActive ? 'success' : 'outline'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedId(user.id)}>
                            View
                          </Button>
                          {user.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant={user.isActive ? 'destructive' : 'default'}
                              isLoading={toggleMutation.isPending}
                              onClick={() =>
                                toggleMutation.mutate({ id: user.id, active: !user.isActive })
                              }
                            >
                              {user.isActive ? 'Deactivate' : 'Reactivate'}
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

      <Modal open={!!selectedId} onClose={() => setSelectedId(null)} title="User details">
        {detail ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Name</dt>
              <dd className="font-medium">{detail.user.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Email</dt>
              <dd>{detail.user.email}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Role</dt>
              <dd className="capitalize">{detail.user.role}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Joined</dt>
              <dd>{new Date(detail.user.createdAt).toLocaleString()}</dd>
            </div>
            {detail.lawyerProfile && (
              <div className="rounded-lg border border-[var(--color-border)] p-3">
                <p className="font-medium">Lawyer profile</p>
                <p className="mt-1 text-[var(--color-muted-foreground)]">
                  Verification: {detail.lawyerProfile.verificationStatus}
                </p>
                {detail.lawyerProfile.barCouncilNumber && (
                  <p className="text-[var(--color-muted-foreground)]">
                    Bar council: {detail.lawyerProfile.barCouncilNumber}
                  </p>
                )}
              </div>
            )}
          </dl>
        ) : (
          <LoadingState message="Loading..." />
        )}
      </Modal>
    </Card>
  );
}
