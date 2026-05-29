import { Link, useNavigate } from 'react-router-dom';
import { Scale, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold text-[var(--color-primary)]">
            <Scale className="h-6 w-6 text-[var(--color-accent)]" />
            LawMittr
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {user && user.role !== 'admin' && <NotificationBell />}
            <span className="hidden text-sm text-[var(--color-muted-foreground)] sm:inline">
              {user?.name} · <span className="capitalize">{user?.role}</span>
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-primary)] sm:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-[var(--color-muted-foreground)]">{subtitle}</p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
