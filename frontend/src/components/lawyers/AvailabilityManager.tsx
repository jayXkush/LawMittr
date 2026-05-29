import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { lawyersApi } from '@/api/lawyers.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';

const SLOTS_KEY = ['lawyer', 'slots'] as const;

export function AvailabilityManager() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: SLOTS_KEY,
    queryFn: async () => {
      const res = await lawyersApi.getMySlots();
      return res.data.data.slots;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => lawyersApi.createSlot({ date, startTime, endTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SLOTS_KEY });
      setError('');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to create slot');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (slotId: string) => lawyersApi.deleteSlot(slotId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SLOTS_KEY }),
  });

  const handleAdd = () => {
    if (!date) {
      setError('Please select a date');
      return;
    }
    createMutation.mutate();
  };

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Availability Slot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="slot-date">Date</Label>
              <Input
                id="slot-date"
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-[var(--color-destructive)]">{error}</p>}
          <Button className="mt-4" onClick={handleAdd} isLoading={createMutation.isPending}>
            <Plus className="h-4 w-4" />
            Add Slot
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState message="Loading slots..." />
          ) : !data?.length ? (
            <EmptyState
              title="No availability slots"
              description="Add slots so clients can book appointments."
            />
          ) : (
            <ul className="space-y-2">
              {data.map((slot) => (
                <li
                  key={slot.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 py-3"
                >
                  <div>
                    <span className="font-medium">{slot.date}</span>
                    <span className="mx-2 text-[var(--color-muted-foreground)]">·</span>
                    <span className="text-sm">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={slot.status === 'booked' ? 'warning' : 'success'}>
                      {slot.status}
                    </Badge>
                    {slot.status === 'available' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(slot.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-[var(--color-destructive)]" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
