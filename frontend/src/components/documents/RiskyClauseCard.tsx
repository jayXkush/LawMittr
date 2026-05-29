import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { RiskyClause } from '@/types/document';

interface RiskyClauseCardProps {
  clause: RiskyClause;
  index: number;
}

export function RiskyClauseCard({ clause, index }: RiskyClauseCardProps) {
  const [expanded, setExpanded] = useState(false);

  const riskConfig = {
    high: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700',
      icon: 'text-red-500',
    },
    medium: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      icon: 'text-amber-500',
    },
    low: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-700',
      icon: 'text-yellow-500',
    },
  };

  const risk = riskConfig[clause.risk_level as keyof typeof riskConfig] || riskConfig.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border ${risk.border} ${risk.bg} overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <AlertTriangle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${risk.icon}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge className={risk.badge}>
              {clause.risk_level.charAt(0).toUpperCase() + clause.risk_level.slice(1)} Risk
            </Badge>
            {clause.page && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                <FileText className="h-3 w-3" />
                Page {clause.page}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
            {clause.explanation}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-[var(--color-muted-foreground)]" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-[var(--color-muted-foreground)]" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-[var(--color-border)]/30 px-4 pb-4 pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Source Text
              </p>
              <blockquote className="mt-2 rounded-lg border-l-3 border-[var(--color-primary)]/40 bg-white/60 px-4 py-3 text-sm italic text-[var(--color-foreground)]/75">
                "{clause.clause}"
              </blockquote>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
