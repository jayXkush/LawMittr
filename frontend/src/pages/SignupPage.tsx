import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, User, Briefcase } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { signupSchema, type SignupFormData } from '@/validators/auth.validator';

export function SignupPage() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const { registerMutation, getErrorMessage } = useAuth();

  const [form, setForm] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: roleParam === 'lawyer' ? 'lawyer' : 'user',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});

  useEffect(() => {
    if (roleParam === 'lawyer' || roleParam === 'user') {
      setForm((prev) => ({ ...prev, role: roleParam }));
    }
  }, [roleParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignupFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    const { confirmPassword: _, ...payload } = result.data;
    registerMutation.mutate(payload);
  };

  const apiError =
    registerMutation.isError ? getErrorMessage(registerMutation.error) : undefined;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                {form.role === 'lawyer' ? (
                  <Briefcase className="h-6 w-6 text-[var(--color-primary)]" />
                ) : (
                  <User className="h-6 w-6 text-[var(--color-primary)]" />
                )}
              </div>
              <CardTitle>
                Create your {form.role === 'lawyer' ? 'lawyer' : 'client'} account
              </CardTitle>
              <CardDescription>
                <Scale className="mr-1 inline h-4 w-4" />
                LawMittr registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {apiError && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-[var(--color-destructive)]">
                    {apiError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    error={errors.name}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                  />
                </div>
                <input type="hidden" name="role" value={form.role} />
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={registerMutation.isPending}
                >
                  Create Account
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-[var(--color-muted-foreground)]">
                <Link to="/signup/role" className="text-[var(--color-primary)] hover:underline">
                  Change account type
                </Link>
                {' · '}
                <Link to="/login" className="text-[var(--color-primary)] hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
