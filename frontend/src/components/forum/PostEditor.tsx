import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TagSelector } from '@/components/forum/TagSelector';
import {
  FORUM_CATEGORIES,
  FORUM_CATEGORY_LABELS,
  type ForumCategory,
  type CreateForumPostPayload,
} from '@/types/forum';

interface PostEditorProps {
  initial?: Partial<CreateForumPostPayload>;
  submitLabel?: string;
  title?: string;
  onSubmit: (data: CreateForumPostPayload) => void;
  isLoading?: boolean;
}

export function PostEditor({
  initial,
  submitLabel = 'Publish discussion',
  title = 'Create discussion',
  onSubmit,
  isLoading,
}: PostEditorProps) {
  const [formTitle, setFormTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [category, setCategory] = useState<ForumCategory>(initial?.category ?? 'general');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [isAnonymous, setIsAnonymous] = useState(initial?.isAnonymous ?? false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formTitle.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (content.trim().length < 10) {
      setError('Content must be at least 10 characters.');
      return;
    }
    setError('');
    onSubmit({
      title: formTitle.trim(),
      content: content.trim(),
      category,
      tags,
      isAnonymous,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              placeholder="What would you like to discuss?"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-category">Category</Label>
            <select
              id="post-category"
              className="flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as ForumCategory)}
            >
              {FORUM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {FORUM_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-content">Details</Label>
            <textarea
              id="post-content"
              rows={8}
              className="flex w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              placeholder="Describe your legal question or topic..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={10000}
            />
          </div>

          <TagSelector tags={tags} onChange={setTags} />

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)]"
            />
            Post anonymously (your identity is hidden from others)
          </label>

          {error && (
            <p className="text-sm text-[var(--color-destructive)]">{error}</p>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
