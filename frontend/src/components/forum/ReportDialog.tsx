import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { reportsApi } from '@/api/reports.api';
import type { ReportTargetType } from '@/types/report';

interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  label?: string;
}

export function ReportDialog({
  targetType,
  targetId,
  label = 'Report',
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      reportsApi.create({
        targetType,
        targetId,
        reason: reason.trim(),
      }),
    onSuccess: () => {
      setSuccess(true);
      setReason('');
      setError('');
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to submit report.');
    },
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Flag className="h-4 w-4" />
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Report content">
        {success ? (
          <p className="text-sm text-green-700">
            Thank you. Your report has been submitted for review.
          </p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim().length < 10) {
                setError('Please provide at least 10 characters.');
                return;
              }
              mutation.mutate();
            }}
          >
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Tell us why this content should be reviewed. Reports are reviewed by our admin team.
            </p>
            <div className="space-y-2">
              <Label htmlFor="report-reason">Reason</Label>
              <textarea
                id="report-reason"
                rows={4}
                className="flex w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                placeholder="Describe the issue..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
              />
            </div>
            {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={mutation.isPending}>
                Submit report
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
