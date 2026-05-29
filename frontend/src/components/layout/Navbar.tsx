import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardPath } from '@/store/authStore';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Find Lawyers', href: '/lawyers', isRoute: true },
    { label: 'Forum', href: '/forum', isRoute: true },
    ...(isAuthenticated && user?.role !== 'admin'
      ? [{ label: 'AI Analyzer', href: '/documents', isRoute: true }]
      : []),
    { label: 'Features', href: '/#features', isRoute: false },
    { label: 'How it Works', href: '/#how-it-works', isRoute: false },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold text-[var(--color-primary)]">
          <Scale className="h-7 w-7 text-[var(--color-accent)]" />
          <span className="text-lg">LawMittr</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-primary)]"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-primary)]"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && user ? (
            <>
              {user.role !== 'admin' && <NotificationBell />}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(getDashboardPath(user.role))}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate('/signup')}>
                Get Started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--color-border)] bg-white md:hidden"
          >
            <div className="flex flex-col gap-2 px-4 py-4">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--color-muted)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                )
              )}
              <div className="mt-2 flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
                {isAuthenticated && user ? (
                  <>
                    {user.role !== 'admin' && (
                      <div className="flex justify-center py-2">
                        <NotificationBell />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate(getDashboardPath(user.role));
                        setMobileOpen(false);
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button variant="ghost" onClick={() => { logout(); setMobileOpen(false); }}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                      Log in
                    </Button>
                    <Button onClick={() => { navigate('/signup'); setMobileOpen(false); }}>
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
