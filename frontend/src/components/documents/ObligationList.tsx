import { motion } from 'framer-motion';
import { Users, FileText } from 'lucide-react';
import type { Obligation } from '@/types/document';

interface ObligationListProps {
  obligations: Obligation[];
}

export function ObligationList({ obligations }: ObligationListProps) {
  // Group obligations by party
  const grouped = obligations.reduce<Record<string, Obligation[]>>((acc, ob) => {
    const party = ob.party || 'Unknown Party';
    if (!acc[party]) acc[party] = [];
    acc[party].push(ob);
    return acc;
  }, {});

  const parties = Object.keys(grouped);

  if (obligations.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No specific obligations were identified in this document.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      {parties.map((party, partyIdx) => (
        <div
          key={party}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden"
        >
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-muted)]/50 px-5 py-3">
            <Users className="h-4 w-4 text-[var(--color-primary)]" />
            <h4 className="text-sm font-semibold text-[var(--color-foreground)]">{party}</h4>
            <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
              {grouped[party].length} obligation{grouped[party].length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-[var(--color-border)]/50">
            {grouped[party].map((ob, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: partyIdx * 0.1 + i * 0.03 }}
                className="px-5 py-3.5"
              >
                <p className="text-sm text-[var(--color-foreground)]">{ob.obligation}</p>
                {ob.source_text && (
                  <blockquote className="mt-2 rounded-md border-l-2 border-[var(--color-primary)]/30 bg-[var(--color-muted)]/40 px-3 py-2 text-xs italic text-[var(--color-muted-foreground)]">
                    "{ob.source_text}"
                  </blockquote>
                )}
                {ob.page && (
                  <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                    <FileText className="h-3 w-3" />
                    Page {ob.page}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
