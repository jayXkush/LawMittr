import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, ClipboardPaste, Scale } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/validators/auth.validator';

const DEMO_ADMIN_EMAIL = 'adminlawmittr@gmail.com';
const DEMO_ADMIN_PASSWORD = 'Admin@1651211';

export function LoginPage() {
  const { loginMutation, getErrorMessage } = useAuth();
  const [form, setForm] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [copied, setCopied] = useState<'email' | 'password' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
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

  const apiError =
    loginMutation.isError ? getErrorMessage(loginMutation.error) : undefined;

  const fillDemoAdmin = () => {
    setForm({ email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD });
    setErrors({});
  };

  const copyToClipboard = async (text: string, field: 'email' | 'password') => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  };

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
                <Scale className="h-6 w-6 text-[var(--color-primary)]" />
              </div>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Sign in to your LawMittr account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-3 rounded-lg border border-dashed border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-3 text-sm">
                <p className="font-medium text-[var(--color-primary)]">
                  Demo Admin Credentials
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs">{DEMO_ADMIN_EMAIL}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(DEMO_ADMIN_EMAIL, 'email')}
                  >
                    <Copy className="h-3 w-3" />
                    {copied === 'email' ? 'Copied' : 'Copy Email'}
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs">{DEMO_ADMIN_PASSWORD}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(DEMO_ADMIN_PASSWORD, 'password')}
                  >
                    <Copy className="h-3 w-3" />
                    {copied === 'password' ? 'Copied' : 'Copy Password'}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={fillDemoAdmin}
                >
                  <ClipboardPaste className="h-4 w-4" />
                  Fill Demo Credentials
                </Button>
              </div>
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
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={loginMutation.isPending}
                >
                  Sign In
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-[var(--color-muted-foreground)]">
                Don&apos;t have an account?{' '}
                <Link to="/signup/role" className="font-medium text-[var(--color-primary)] hover:underline">
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
