import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReportDialog } from '@/components/forum/ReportDialog';
import type { ForumComment } from '@/types/forum';

interface CommentCardProps {
  comment: ForumComment;
  onUpdate?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  showReport?: boolean;
}

export function CommentCard({
  comment,
  onUpdate,
  onDelete,
  isLoading,
  showReport,
}: CommentCardProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const saveEdit = () => {
    if (!editContent.trim() || !onUpdate) return;
    onUpdate(comment.id, editContent.trim());
    setEditing(false);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-[var(--color-primary)]">
              {comment.author.name}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-1">
          {showReport && !comment.isOwner && !editing && (
            <ReportDialog
              targetType="forum_comment"
              targetId={comment.id}
              label="Report"
            />
          )}
          {comment.isOwner && !editing && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(true)}
                aria-label="Edit comment"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete?.(comment.id)}
                disabled={isLoading}
                aria-label="Delete comment"
              >
                <Trash2 className="h-4 w-4 text-[var(--color-destructive)]" />
              </Button>
            </>
          )}
          </div>
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              rows={3}
              className="flex w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} isLoading={isLoading}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-[var(--color-foreground)]">
            {comment.content}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
