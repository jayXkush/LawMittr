import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Copy, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/validators/auth.validator';

const DEMO_ADMIN_EMAIL = 'adminlawmittr@gmail.com';
const DEMO_ADMIN_PASSWORD = 'Admin@1651211';

export function AdminLoginPage() {
  const { loginMutation, getErrorMessage } = useAuth();
  const [form, setForm] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [copied, setCopied] = useState<'email' | 'password' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const fillDemo = () => {
    setForm({ email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD });
    setErrors({});
  };

  const copyToClipboard = async (text: string, field: 'email' | 'password') => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    loginMutation.mutate(result.data);
  };

  const apiError = loginMutation.isError ? getErrorMessage(loginMutation.error) : undefined;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-center px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-[var(--color-primary)]">
            <Scale className="h-7 w-7 text-[var(--color-accent)]" />
            <span>LawMittr Admin</span>
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <Card className="border-dashed border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Demo Admin Credentials</CardTitle>
              <CardDescription>For recruiter/demo access only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[var(--color-muted-foreground)]">Email</p>
                  <p className="font-mono font-medium">{DEMO_ADMIN_EMAIL}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(DEMO_ADMIN_EMAIL, 'email')}
                >
                  <Copy className="h-4 w-4" />
                  {copied === 'email' ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[var(--color-muted-foreground)]">Password</p>
                  <p className="font-mono font-medium">{DEMO_ADMIN_PASSWORD}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(DEMO_ADMIN_PASSWORD, 'password')}
                >
                  <Copy className="h-4 w-4" />
                  {copied === 'password' ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Button type="button" variant="accent" className="w-full" onClick={fillDemo}>
                <ClipboardPaste className="h-4 w-4" />
                Fill demo credentials
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Admin sign in</CardTitle>
              <CardDescription>Platform administration access</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {apiError && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-[var(--color-destructive)]">
                    {apiError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
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
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
                  Sign in as admin
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-[var(--color-muted-foreground)]">
                <Link to="/" className="hover:underline">
                  Back to home
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
