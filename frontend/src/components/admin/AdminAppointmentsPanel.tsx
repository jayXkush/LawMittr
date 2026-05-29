import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import type { Appointment } from '@/types/appointment';

export function AdminAppointmentsPanel() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Appointment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'appointments', page, search, statusFilter],
    queryFn: async () => {
      const res = await adminApi.getAppointments({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      return { appointments: res.data.data.appointments, meta: res.data.meta };
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment management</CardTitle>
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
                placeholder="Search client, lawyer, or ID..."
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
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState message="Loading appointments..." />
        ) : !data?.appointments.length ? (
          <EmptyState title="No appointments found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Client</th>
                    <th className="pb-3 pr-4 font-medium">Lawyer</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Payment</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.appointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-[var(--color-border)]">
                      <td className="py-3 pr-4">
                        {apt.date} {apt.startTime}
                      </td>
                      <td className="py-3 pr-4">{apt.client?.name ?? '—'}</td>
                      <td className="py-3 pr-4">{apt.lawyer?.name ?? '—'}</td>
                      <td className="py-3 pr-4">
                        <Badge>{apt.status}</Badge>
                      </td>
                      <td className="py-3 pr-4 capitalize">{apt.paymentStatus}</td>
                      <td className="py-3">
                        <Button size="sm" variant="outline" onClick={() => setSelected(apt)}>
                          Details
                        </Button>
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Appointment details">
        {selected && (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[var(--color-muted-foreground)]">ID</dt>
              <dd className="font-mono text-xs">{selected.id}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Schedule</dt>
              <dd>
                {selected.date} · {selected.startTime}–{selected.endTime}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Client</dt>
              <dd>
                {selected.client?.name} ({selected.client?.email})
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Lawyer</dt>
              <dd>
                {selected.lawyer?.name} ({selected.lawyer?.email})
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Amount</dt>
              <dd>₹{selected.amount}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Status / Payment</dt>
              <dd>
                {selected.status} · {selected.paymentStatus}
                {selected.paymentMode && ` (${selected.paymentMode})`}
              </dd>
            </div>
            {selected.meetingId && (
              <div>
                <dt className="text-[var(--color-muted-foreground)]">Meeting</dt>
                <dd>
                  ID: {selected.meetingId}
                  {selected.meetingPassword && ` · Password: ${selected.meetingPassword}`}
                </dd>
              </div>
            )}
            {selected.notes && (
              <div>
                <dt className="text-[var(--color-muted-foreground)]">Notes</dt>
                <dd>{selected.notes}</dd>
              </div>
            )}
          </dl>
        )}
      </Modal>
    </Card>
  );
}
