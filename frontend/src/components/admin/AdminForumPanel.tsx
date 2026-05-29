import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { adminApi } from '@/api/admin.api';

type ForumTab = 'posts' | 'comments';

export function AdminForumPanel() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ForumTab>('posts');
  const [page, setPage] = useState(1);

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['admin', 'forum', 'posts', page],
    queryFn: async () => {
      const res = await adminApi.getForumPosts({ page, limit: 10 });
      return { posts: res.data.data.posts, meta: res.data.meta };
    },
    enabled: tab === 'posts',
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['admin', 'forum', 'comments', page],
    queryFn: async () => {
      const res = await adminApi.getForumComments({ page, limit: 10 });
      return { comments: res.data.data.comments, meta: res.data.meta };
    },
    enabled: tab === 'comments',
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteForumPost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'forum'] }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteForumComment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'forum'] }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Forum moderation</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={tab === 'posts' ? 'default' : 'outline'}
              onClick={() => {
                setTab('posts');
                setPage(1);
              }}
            >
              Posts
            </Button>
            <Button
              size="sm"
              variant={tab === 'comments' ? 'default' : 'outline'}
              onClick={() => {
                setTab('comments');
                setPage(1);
              }}
            >
              Comments
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'posts' && (
          <>
            {postsLoading ? (
              <LoadingState message="Loading posts..." />
            ) : !postsData?.posts.length ? (
              <EmptyState title="No posts" />
            ) : (
              <>
                <div className="space-y-3">
                  {postsData.posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <Link
                          to={`/forum/post/${post.id}`}
                          className="font-medium text-[var(--color-primary)] hover:underline"
                        >
                          {post.title}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted-foreground)]">
                          {post.content}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                          {post.author?.name ?? 'Anonymous'} · {post.upvotesCount} upvotes ·{' '}
                          {post.commentsCount} comments
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm('Delete this post and all comments?')) {
                            deletePostMutation.mutate(post.id);
                          }
                        }}
                        isLoading={deletePostMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
                {postsData.meta && (
                  <Pagination meta={postsData.meta} onPageChange={setPage} />
                )}
              </>
            )}
          </>
        )}

        {tab === 'comments' && (
          <>
            {commentsLoading ? (
              <LoadingState message="Loading comments..." />
            ) : !commentsData?.comments.length ? (
              <EmptyState title="No comments" />
            ) : (
              <>
                <div className="space-y-3">
                  {commentsData.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <p className="text-sm">{comment.content}</p>
                        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                          {comment.author.name} ·{' '}
                          <Link
                            to={`/forum/post/${comment.postId}`}
                            className="text-[var(--color-primary)] hover:underline"
                          >
                            View post
                          </Link>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm('Delete this comment?')) {
                            deleteCommentMutation.mutate(comment.id);
                          }
                        }}
                        isLoading={deleteCommentMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
                {commentsData.meta && (
                  <Pagination meta={commentsData.meta} onPageChange={setPage} />
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
