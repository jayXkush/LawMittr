import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lawyersApi } from '@/api/lawyers.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';

const PROFILE_KEY = ['lawyer', 'profile'] as const;

export function ProfileEditor() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    specialization: '',
    experience: '',
    city: '',
    languages: '',
    consultationFee: '',
    bio: '',
  });
  const [message, setMessage] = useState('');

  const { data: lawyer, isLoading } = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const res = await lawyersApi.getMyProfile();
      return res.data.data.lawyer;
    },
  });

  useEffect(() => {
    if (lawyer) {
      setForm({
        specialization: lawyer.specialization.join(', '),
        experience: String(lawyer.experience),
        city: lawyer.city,
        languages: lawyer.languages.join(', '),
        consultationFee: String(lawyer.consultationFee),
        bio: lawyer.bio ?? '',
      });
    }
  }, [lawyer]);

  const updateMutation = useMutation({
    mutationFn: () =>
      lawyersApi.updateMyProfile({
        specialization: form.specialization.split(',').map((s) => s.trim()).filter(Boolean),
        experience: parseInt(form.experience, 10) || 0,
        city: form.city,
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
        consultationFee: parseFloat(form.consultationFee) || 0,
        bio: form.bio,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      queryClient.invalidateQueries({ queryKey: ['lawyers'] });
      setMessage('Profile saved successfully');
      setTimeout(() => setMessage(''), 3000);
    },
  });

  if (isLoading) return <LoadingState message="Loading profile..." />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lawyer Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
        >
          <div className="space-y-2 sm:col-span-2">
            <Label>Specializations (comma-separated)</Label>
            <Input
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              placeholder="Criminal Law, Family Law"
            />
          </div>
          <div className="space-y-2">
            <Label>Experience (years)</Label>
            <Input
              type="number"
              min="0"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Languages (comma-separated)</Label>
            <Input
              value={form.languages}
              onChange={(e) => setForm({ ...form, languages: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Consultation Fee (₹)</Label>
            <Input
              type="number"
              min="0"
              value={form.consultationFee}
              onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Bio</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Brief professional bio..."
            />
          </div>
          {message && (
            <p className="text-sm text-green-700 sm:col-span-2">{message}</p>
          )}
          <Button type="submit" isLoading={updateMutation.isPending} className="sm:col-span-2">
            Save Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
