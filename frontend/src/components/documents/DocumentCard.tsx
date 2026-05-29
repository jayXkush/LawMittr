import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LegalDocument } from '@/types/document';

interface DocumentCardProps {
  document: LegalDocument;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function DocumentCard({ document: doc, onDelete, isDeleting }: DocumentCardProps) {
  const statusConfig = {
    processing: {
      icon: Clock,
      label: 'Processing',
      color: 'bg-amber-100 text-amber-700',
      dotColor: 'bg-amber-500',
    },
    analyzed: {
      icon: CheckCircle2,
      label: 'Analyzed',
      color: 'bg-emerald-100 text-emerald-700',
      dotColor: 'bg-emerald-500',
    },
    failed: {
      icon: XCircle,
      label: 'Failed',
      color: 'bg-red-100 text-red-700',
      dotColor: 'bg-red-500',
    },
  };

  const status = statusConfig[doc.status];
  const StatusIcon = status.icon;
  const isClickable = doc.status === 'analyzed';

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-all ${
        isClickable
          ? 'cursor-pointer hover:border-[var(--color-primary)]/30 hover:shadow-md'
          : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-[var(--color-primary)]/10 p-2.5">
          <FileText className="h-5 w-5 text-[var(--color-primary)]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                {doc.originalName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                <span>{formatSize(doc.fileSize)}</span>
                <span>·</span>
                <span>{doc.pageCount} pages</span>
                <span>·</span>
                <span>{formatDate(doc.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={`${status.color} flex items-center gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Analysis summary */}
          {doc.status === 'analyzed' && doc.analysis && (
            <div className="mt-3 flex items-center gap-4 text-xs">
              {doc.analysis.riskyClausesCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  {doc.analysis.riskyClausesCount} risky clause{doc.analysis.riskyClausesCount > 1 ? 's' : ''}
                </span>
              )}
              <span className="text-[var(--color-muted-foreground)]">
                {doc.analysis.obligationsCount} obligation{doc.analysis.obligationsCount !== 1 ? 's' : ''} found
              </span>
            </div>
          )}
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(doc.id);
            }}
            disabled={isDeleting}
            className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] opacity-0 transition-opacity hover:bg-red-50 hover:text-[var(--color-destructive)] group-hover:opacity-100"
            aria-label="Delete document"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );

  if (isClickable) {
    return <Link to={`/documents/${doc.id}`}>{card}</Link>;
  }

  return card;
}
