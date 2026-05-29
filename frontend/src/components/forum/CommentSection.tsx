import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/LoadingState';
import { Pagination } from '@/components/common/Pagination';
import { CommentCard } from '@/components/forum/CommentCard';
import { EmptyState } from '@/components/forum/EmptyState';
import { forumApi } from '@/api/forum.api';
import { useAuthStore } from '@/store/authStore';

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['forum', 'comments', postId, page],
    queryFn: async () => {
      const res = await forumApi.getComments(postId, page, 10);
      return { comments: res.data.data.comments, meta: res.data.meta };
    },
  });

  const addMutation = useMutation({
    mutationFn: () => forumApi.addComment(postId, content.trim()),
    onSuccess: () => {
      setContent('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['forum', 'comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'post', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to add comment.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content: text }: { id: string; content: string }) =>
      forumApi.updateComment(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'comments', postId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => forumApi.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'post', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[var(--color-primary)]">
        Comments {data?.meta ? `(${data.meta.total})` : ''}
      </h2>

      {isAuthenticated ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!content.trim()) return;
            addMutation.mutate();
          }}
          className="space-y-3 rounded-xl border border-[var(--color-border)] bg-white p-4"
        >
          <Label htmlFor="comment-content">Add a comment</Label>
          <textarea
            id="comment-content"
            rows={3}
            className="flex w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            placeholder="Share your thoughts or legal insight..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
          <Button type="submit" isLoading={addMutation.isPending}>
            Post comment
          </Button>
        </form>
      ) : (
        <p className="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted-foreground)]">
          <Link to="/login" className="font-medium text-[var(--color-primary)] hover:underline">
            Log in
          </Link>{' '}
          to join the discussion.
        </p>
      )}

      {isLoading ? (
        <LoadingState message="Loading comments..." />
      ) : !data?.comments.length ? (
        <EmptyState
          title="No comments yet"
          description="Be the first to respond to this discussion."
        />
      ) : (
        <div className="space-y-3">
          {data.comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onUpdate={(id, text) => updateMutation.mutate({ id, content: text })}
              onDelete={(id) => deleteMutation.mutate(id)}
              isLoading={updateMutation.isPending || deleteMutation.isPending}
              showReport={isAuthenticated && user?.role !== 'admin'}
            />
          ))}
          {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
        </div>
      )}
    </div>
  );
}
