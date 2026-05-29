import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Briefcase, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const roles = [
  {
    id: 'user' as const,
    title: 'I need legal help',
    description: 'Find lawyers, book consultations, and get AI-powered document insights.',
    icon: User,
  },
  {
    id: 'lawyer' as const,
    title: 'I am a lawyer',
    description: 'Offer consultations, manage appointments, and grow your practice.',
    icon: Briefcase,
  },
];

export function RoleSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">Join LawMittr</h1>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            Choose how you&apos;d like to use the platform
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          {roles.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <button
                type="button"
                onClick={() => navigate(`/signup?role=${role.id}`)}
                className="w-full text-left"
              >
                <Card className="h-full cursor-pointer transition-all hover:border-[var(--color-primary)] hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                      <role.icon className="h-7 w-7 text-[var(--color-primary)]" />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {role.title}
                      <ArrowRight className="h-5 w-5 text-[var(--color-accent)]" />
                    </CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span
                      className={cn(
                        'inline-block rounded-full px-3 py-1 text-xs font-medium capitalize',
                        role.id === 'lawyer'
                          ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent-foreground)]'
                          : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      )}
                    >
                      {role.id} account
                    </span>
                  </CardContent>
                </Card>
              </button>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
