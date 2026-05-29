import { cn } from '@/lib/utils';
import {
  FORUM_CATEGORIES,
  FORUM_CATEGORY_LABELS,
  type ForumCategory,
} from '@/types/forum';

interface CategoryFilterProps {
  value: ForumCategory | '';
  onChange: (category: ForumCategory | '') => void;
  categories?: ForumCategory[];
}

export function CategoryFilter({
  value,
  onChange,
  categories = [...FORUM_CATEGORIES],
}: CategoryFilterProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--color-primary)]">Category</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange('')}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            value === ''
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'border-[var(--color-border)] bg-white hover:bg-[var(--color-muted)]'
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              value === cat
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'border-[var(--color-border)] bg-white hover:bg-[var(--color-muted)]'
            )}
          >
            {FORUM_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
    </div>
  );
}
