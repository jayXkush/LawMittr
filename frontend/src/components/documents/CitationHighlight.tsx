import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import type { Citation } from '@/types/document';

interface CitationHighlightProps {
  citation: Citation;
  index: number;
}

export function CitationHighlight({ citation, index }: CitationHighlightProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-muted)]/40 px-3 py-2.5"
    >
      <div className="mb-1.5 flex items-center gap-2">
        {citation.page && (
          <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
            <FileText className="h-3 w-3" />
            Page {citation.page}
          </span>
        )}
        <span className="text-xs text-[var(--color-muted-foreground)]">
          {Math.round(citation.relevance_score * 100)}% match
        </span>
      </div>
      <p className="text-xs leading-relaxed italic text-[var(--color-foreground)]/70">
        "{citation.text}"
      </p>
    </motion.div>
  );
}
