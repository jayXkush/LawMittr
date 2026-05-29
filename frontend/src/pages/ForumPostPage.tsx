import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ThumbsUp, Pencil, Trash2, User } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { CommentSection } from '@/components/forum/CommentSection';
import { PostEditor } from '@/components/forum/PostEditor';
import { forumApi } from '@/api/forum.api';
import { ReportDialog } from '@/components/forum/ReportDialog';
import { useAuthStore } from '@/store/authStore';
import { FORUM_CATEGORY_LABELS } from '@/types/forum';

export function ForumPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [editing, setEditing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['forum', 'post', id],
    queryFn: async () => {
      const res = await forumApi.getPost(id!);
      return res.data.data.post;
    },
    enabled: !!id,
  });

  const voteMutation = useMutation({
    mutationFn: () =>
      data?.hasVoted ? forumApi.removeVote(id!) : forumApi.upvotePost(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'post', id] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof forumApi.updatePost>[1]) =>
      forumApi.updatePost(id!, payload),
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['forum', 'post', id] });
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => forumApi.deletePost(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      navigate('/forum');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-12">
          <LoadingState message="Loading discussion..." />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <p className="text-[var(--color-muted-foreground)]">Discussion not found.</p>
          <Link to="/forum" className="mt-4 inline-block">
            <Button variant="outline">Back to forum</Button>
          </Link>
        </div>
      </div>
    );
  }

  const authorName =
    data.isAnonymous && !data.isOwner
      ? 'Anonymous'
      : data.author?.name ?? 'Community member';

  const handleVote = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    voteMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/forum"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to forum
        </Link>

        {editing ? (
          <PostEditor
            title="Edit discussion"
            submitLabel="Save changes"
            initial={{
              title: data.title,
              content: data.content,
              category: data.category,
              tags: data.tags,
              isAnonymous: data.isAnonymous,
            }}
            onSubmit={(payload) => updateMutation.mutate(payload)}
            isLoading={updateMutation.isPending}
          />
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle className="text-2xl">{data.title}</CardTitle>
                <Badge>{FORUM_CATEGORY_LABELS[data.category]}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                <User className="h-4 w-4" />
                <span>{authorName}</span>
                {data.isAnonymous && data.isOwner && (
                  <Badge className="text-xs">Posted anonymously</Badge>
                )}
                <span>·</span>
                <time dateTime={data.createdAt}>
                  {new Date(data.createdAt).toLocaleString()}
                </time>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="whitespace-pre-wrap text-[var(--color-foreground)]">{data.content}</p>

              {data.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag) => (
                    <Badge key={tag}>#{tag}</Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-4">
                <Button
                  variant={data.hasVoted ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleVote}
                  isLoading={voteMutation.isPending}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {data.hasVoted ? 'Upvoted' : 'Upvote'} ({data.upvotesCount})
                </Button>

                {isAuthenticated && !data.isOwner && (
                  <ReportDialog targetType="forum_post" targetId={data.id} />
                )}

                {data.isOwner && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Delete this discussion permanently?')) {
                          deleteMutation.mutate();
                        }
                      }}
                      isLoading={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!editing && <CommentSection postId={data.id} />}
      </div>
    </div>
  );
}
