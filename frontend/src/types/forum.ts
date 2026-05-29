export const FORUM_CATEGORIES = [
  'general',
  'family-law',
  'criminal-law',
  'property-law',
  'corporate-law',
  'labor-law',
  'consumer-rights',
  'constitutional-law',
  'other',
] as const;

export type ForumCategory = (typeof FORUM_CATEGORIES)[number];

export const FORUM_CATEGORY_LABELS: Record<ForumCategory, string> = {
  general: 'General',
  'family-law': 'Family Law',
  'criminal-law': 'Criminal Law',
  'property-law': 'Property Law',
  'corporate-law': 'Corporate Law',
  'labor-law': 'Labor Law',
  'consumer-rights': 'Consumer Rights',
  'constitutional-law': 'Constitutional Law',
  other: 'Other',
};

export interface ForumAuthor {
  id: string;
  name: string;
  role: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string | null;
  author: ForumAuthor | null;
  isAnonymous: boolean;
  category: ForumCategory;
  tags: string[];
  upvotesCount: number;
  commentsCount: number;
  hasVoted?: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  author: ForumAuthor;
  content: string;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPostFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: ForumCategory | '';
  tag?: string;
  unanswered?: boolean;
  sortBy?: 'newest' | 'popular';
}

export interface CreateForumPostPayload {
  title: string;
  content: string;
  isAnonymous?: boolean;
  category?: ForumCategory;
  tags?: string[];
}

export interface UpdateForumPostPayload {
  title?: string;
  content?: string;
  isAnonymous?: boolean;
  category?: ForumCategory;
  tags?: string[];
}
