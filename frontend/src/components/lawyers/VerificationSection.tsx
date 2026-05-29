import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/common/LoadingState';
import { lawyersApi } from '@/api/lawyers.api';
import type { LawyerVerificationStatus } from '@/types/lawyer';

const statusConfig: Record<
  LawyerVerificationStatus,
  { label: string; variant: 'warning' | 'success' | 'outline' }
> = {
  pending: { label: 'Pending review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'outline' },
};

export function VerificationSection() {
  const queryClient = useQueryClient();
  const [barCouncilNumber, setBarCouncilNumber] = useState('');
  const [yearsOfPractice, setYearsOfPractice] = useState('');
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['lawyer', 'verification'],
    queryFn: async () => {
      const res = await lawyersApi.getMyVerification();
      return res.data.data.verification;
    },
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      lawyersApi.submitVerification({
        barCouncilNumber: barCouncilNumber.trim(),
        yearsOfPractice: Number(yearsOfPractice),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lawyer', 'verification'] });
      setFormError('');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setFormError(err.response?.data?.message || 'Submission failed.');
    },
  });

  useEffect(() => {
    if (data) {
      setBarCouncilNumber(data.barCouncilNumber ?? '');
      setYearsOfPractice(data.yearsOfPractice ? String(data.yearsOfPractice) : '');
    }
  }, [data]);

  if (isLoading) {
    return <LoadingState message="Loading verification status..." />;
  }

  if (!data) return null;

  const status = statusConfig[data.verificationStatus];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barCouncilNumber.trim()) {
      setFormError('Bar council number is required.');
      return;
    }
    const years = Number(yearsOfPractice);
    if (Number.isNaN(years) || years < 0) {
      setFormError('Enter valid years of practice.');
      return;
    }
    submitMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
            <CardTitle>Bar Council Verification</CardTitle>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <CardDescription>
          Submit your credentials for admin review. Approved lawyers appear in public search.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.verificationStatus === 'rejected' && data.rejectionReason && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Rejection reason</p>
              <p className="mt-1">{data.rejectionReason}</p>
            </div>
          </div>
        )}

        {data.barCouncilNumber && (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Bar council number</dt>
              <dd className="font-medium">{data.barCouncilNumber}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Years of practice</dt>
              <dd className="font-medium">{data.yearsOfPractice}</dd>
            </div>
          </dl>
        )}

        {data.verificationStatus !== 'approved' && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-[var(--color-border)] pt-6">
            <p className="text-sm font-medium text-[var(--color-primary)]">
              {data.verificationStatus === 'rejected'
                ? 'Resubmit verification'
                : 'Submit verification request'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="barCouncilNumber">Bar council number</Label>
                <Input
                  id="barCouncilNumber"
                  value={barCouncilNumber}
                  onChange={(e) => setBarCouncilNumber(e.target.value)}
                  placeholder="e.g. MAH/1234/2020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOfPractice">Years of practice</Label>
                <Input
                  id="yearsOfPractice"
                  type="number"
                  min={0}
                  max={60}
                  value={yearsOfPractice}
                  onChange={(e) => setYearsOfPractice(e.target.value)}
                />
              </div>
            </div>
            {formError && (
              <p className="text-sm text-[var(--color-destructive)]">{formError}</p>
            )}
            <Button type="submit" isLoading={submitMutation.isPending}>
              Submit for verification
            </Button>
          </form>
        )}

        {data.verificationStatus === 'approved' && (
          <p className="text-sm text-green-700">
            Your profile is verified and visible to clients on the Find Lawyers page.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
