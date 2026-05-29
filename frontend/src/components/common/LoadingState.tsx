import { Spinner } from '@/components/ui/spinner';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">{message}</p>
    </div>
  );
}
