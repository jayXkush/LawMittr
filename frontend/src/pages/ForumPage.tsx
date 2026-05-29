import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquarePlus } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/common/Pagination';
import { LoadingState } from '@/components/common/LoadingState';
import { PostCard } from '@/components/forum/PostCard';
import { SearchBar } from '@/components/forum/SearchBar';
import { CategoryFilter } from '@/components/forum/CategoryFilter';
import { EmptyState } from '@/components/forum/EmptyState';
import { forumApi } from '@/api/forum.api';
import { useAuthStore } from '@/store/authStore';
import type { ForumPostFilters } from '@/types/forum';

export function ForumPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [filters, setFilters] = useState<ForumPostFilters>({
    page: 1,
    limit: 10,
    sortBy: 'newest',
    unanswered: searchParams.get('unanswered') === 'true' ? true : undefined,
  });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['forum', 'posts', filters],
    queryFn: async () => {
      const params = { ...filters };
      if (!params.category) delete params.category;
      if (!params.tag) delete params.tag;
      if (!params.search) delete params.search;
      const res = await forumApi.getPosts(params);
      return { posts: res.data.data.posts, meta: res.data.meta };
    },
  });

  const applySearch = () => {
    setFilters((f) => ({ ...f, search: searchInput.trim() || undefined, page: 1 }));
    refetch();
  };

  const handleCreateClick = () => {
    if (isAuthenticated) {
      navigate('/forum/create');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-primary)]">Legal Forum</h1>
            <p className="mt-2 text-[var(--color-muted-foreground)]">
              Ask questions, share experiences, and learn from the community
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <MessageSquarePlus className="h-4 w-4" />
            Start Discussion
          </Button>
        </div>

        <Card className="mb-8">
          <CardContent className="space-y-6 pt-6">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={applySearch}
            />
            <CategoryFilter
              value={filters.category ?? ''}
              onChange={(category) =>
                setFilters((f) => ({
                  ...f,
                  category: category || undefined,
                  page: 1,
                }))
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tag-filter">Filter by tag</Label>
                <input
                  id="tag-filter"
                  className="flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm"
                  placeholder="e.g. tenant-rights"
                  value={filters.tag ?? ''}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      tag: e.target.value.trim() || undefined,
                      page: 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort-by">Sort by</Label>
                <select
                  id="sort-by"
                  className="flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm"
                  value={filters.sortBy ?? 'newest'}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      sortBy: e.target.value as ForumPostFilters['sortBy'],
                      page: 1,
                    }))
                  }
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Most upvoted</option>
                </select>
              </div>
            </div>
            <Button onClick={applySearch} isLoading={isFetching} className="w-full sm:w-auto">
              Apply filters
            </Button>
          </CardContent>
        </Card>

        <div>
          {isLoading ? (
            <LoadingState message="Loading discussions..." />
          ) : !data?.posts.length ? (
            <EmptyState
              title="No discussions found"
              description="Try different filters or start a new topic."
              action={
                <Button onClick={handleCreateClick}>
                  <MessageSquarePlus className="h-4 w-4" />
                  Start Discussion
                </Button>
              }
            />
          ) : (
            <>
              <div className="space-y-4">
                {data.posts.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
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

        {!isAuthenticated && (
          <p className="mt-8 text-center text-sm text-[var(--color-muted-foreground)]">
            Want to post?{' '}
            <Link to="/login" className="font-medium text-[var(--color-primary)] hover:underline">
              Log in
            </Link>{' '}
            or{' '}
            <Link to="/signup" className="font-medium text-[var(--color-primary)] hover:underline">
              sign up
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
