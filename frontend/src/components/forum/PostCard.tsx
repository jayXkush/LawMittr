import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, ThumbsUp, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FORUM_CATEGORY_LABELS, type ForumPost } from '@/types/forum';

interface PostCardProps {
  post: ForumPost;
  index?: number;
  compact?: boolean;
}

function authorLabel(post: ForumPost): string {
  if (post.isAnonymous && !post.isOwner) return 'Anonymous';
  if (post.author?.name) return post.author.name;
  return 'Community member';
}

export function PostCard({ post, index = 0, compact = false }: PostCardProps) {
  const excerpt =
    post.content.length > (compact ? 120 : 200)
      ? `${post.content.slice(0, compact ? 120 : 200)}…`
      : post.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link to={`/forum/post/${post.id}`}>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <CardTitle className={compact ? 'text-base' : 'text-lg'}>{post.title}</CardTitle>
              <Badge variant="outline" className="shrink-0">
                {FORUM_CATEGORY_LABELS[post.category]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
              <User className="h-3.5 w-3.5" />
              <span>{authorLabel(post)}</span>
              <span>·</span>
              <time dateTime={post.createdAt}>
                {new Date(post.createdAt).toLocaleDateString()}
              </time>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-muted-foreground)]">{excerpt}</p>
            {post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {post.upvotesCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {post.commentsCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
