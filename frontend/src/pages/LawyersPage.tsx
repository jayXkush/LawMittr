import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { LawyerCard } from '@/components/lawyers/LawyerCard';
import { LawyerFiltersBar } from '@/components/lawyers/LawyerFilters';
import { Pagination } from '@/components/common/Pagination';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { lawyersApi } from '@/api/lawyers.api';
import type { LawyerFilters } from '@/types/lawyer';

export function LawyersPage() {
  const [filters, setFilters] = useState<LawyerFilters>({ page: 1, limit: 9 });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['lawyers', filters],
    queryFn: async () => {
      const res = await lawyersApi.getAll(filters);
      return { lawyers: res.data.data.lawyers, meta: res.data.meta };
    },
  });

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">Find a Lawyer</h1>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            Browse verified lawyers and book a consultation
          </p>
        </div>

        <LawyerFiltersBar
          filters={filters}
          onChange={setFilters}
          onSearch={() => refetch()}
          isLoading={isFetching}
        />

        <div className="mt-8">
          {isLoading ? (
            <LoadingState message="Finding lawyers..." />
          ) : !data?.lawyers.length ? (
            <EmptyState
              title="No lawyers found"
              description="Try adjusting your filters or check back later."
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.lawyers.map((lawyer, i) => (
                  <LawyerCard key={lawyer.userId} lawyer={lawyer} index={i} />
                ))}
              </div>
              {data.meta && (
                <Pagination
                  meta={data.meta}
                  onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
