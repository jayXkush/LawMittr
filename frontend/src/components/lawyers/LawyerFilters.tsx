import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { LawyerFilters as Filters } from '@/types/lawyer';

interface LawyerFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export function LawyerFiltersBar({
  filters,
  onChange,
  onSearch,
  isLoading,
}: LawyerFiltersProps) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <Input
                id="search"
                placeholder="Name or specialization..."
                className="pl-9"
                value={filters.search ?? ''}
                onChange={(e) => update('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g. Mumbai"
              value={filters.city ?? ''}
              onChange={(e) => update('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              placeholder="e.g. Criminal"
              value={filters.specialization ?? ''}
              onChange={(e) => update('specialization', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Input
              id="language"
              placeholder="e.g. Hindi"
              value={filters.language ?? ''}
              onChange={(e) => update('language', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minRating">Min Rating</Label>
            <Input
              id="minRating"
              type="number"
              min="0"
              max="5"
              step="0.5"
              placeholder="4"
              value={filters.minRating ?? ''}
              onChange={(e) => update('minRating', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortBy">Sort by</Label>
            <select
              id="sortBy"
              className="flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm"
              value={filters.sortBy ?? 'rating'}
              onChange={(e) =>
                onChange({
                  ...filters,
                  sortBy: e.target.value as Filters['sortBy'],
                  page: 1,
                })
              }
            >
              <option value="rating">Rating</option>
              <option value="fee">Fee</option>
              <option value="experience">Experience</option>
            </select>
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button className="w-full" onClick={onSearch} isLoading={isLoading}>
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
