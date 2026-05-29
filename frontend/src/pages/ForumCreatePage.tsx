import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { PostEditor } from '@/components/forum/PostEditor';
import { forumApi } from '@/api/forum.api';
import type { CreateForumPostPayload } from '@/types/forum';

export function ForumCreatePage() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (data: CreateForumPostPayload) => forumApi.createPost(data),
    onSuccess: (res) => {
      const post = res.data.data.post;
      navigate(`/forum/post/${post.id}`);
    },
  });

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/forum"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to forum
        </Link>

        <PostEditor
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />

        {createMutation.isError && (
          <p className="mt-4 text-sm text-[var(--color-destructive)]">
            {(createMutation.error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || 'Failed to create discussion. Please try again.'}
          </p>
        )}
      </div>
    </div>
  );
}
