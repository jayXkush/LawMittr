import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'outline' | 'success' | 'warning';
  className?: string;
}

const variants = {
  default: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  accent: 'bg-[var(--color-accent)]/20 text-[var(--color-accent-foreground)]',
  outline: 'border border-[var(--color-border)] text-[var(--color-muted-foreground)]',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
