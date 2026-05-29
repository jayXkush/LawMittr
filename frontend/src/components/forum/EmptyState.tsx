import { MessageSquare } from 'lucide-react';
import { EmptyState as BaseEmptyState } from '@/components/common/EmptyState';

interface ForumEmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'No discussions yet',
  description = 'Be the first to start a legal discussion in the community.',
  action,
}: ForumEmptyStateProps) {
  return (
    <div className="flex flex-col items-center">
      <MessageSquare className="mb-4 h-12 w-12 text-[var(--color-muted-foreground)]/40" />
      <BaseEmptyState title={title} description={description} action={action} />
    </div>
  );
}
