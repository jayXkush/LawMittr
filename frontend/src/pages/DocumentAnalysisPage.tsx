import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  ClipboardList,
  MessageCircle,
  BookOpen,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { AnalysisSummary } from '@/components/documents/AnalysisSummary';
import { RiskyClauseCard } from '@/components/documents/RiskyClauseCard';
import { ObligationList } from '@/components/documents/ObligationList';
import { DocumentChatPanel } from '@/components/documents/DocumentChatPanel';
import { documentsApi } from '@/api/documents.api';
import type { LegalDocument } from '@/types/document';

type TabKey = 'summary' | 'risks' | 'obligations' | 'simple' | 'chat';

export function DocumentAnalysisPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const res = await documentsApi.getById(documentId!);
      return res.data.data.document as LegalDocument;
    },
    enabled: !!documentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <LoadingState message="Loading document analysis..." />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <EmptyState title="Document not found" />
      </div>
    );
  }

  if (doc.status === 'processing') {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <LoadingState message="Analysis in progress... This may take a minute." />
        </div>
      </div>
    );
  }

  if (doc.status === 'failed') {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <EmptyState
            title="Analysis failed"
            description="Something went wrong while analyzing this document. Please try uploading again."
          />
        </div>
      </div>
    );
  }

  const analysis = doc.fullAnalysis;
  const riskyCount = analysis?.risky_clauses?.length ?? 0;
  const obligationCount = analysis?.obligations?.length ?? 0;

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { key: 'summary', label: 'Summary', icon: FileText },
    { key: 'risks', label: 'Risky Clauses', icon: AlertTriangle, badge: riskyCount },
    { key: 'obligations', label: 'Obligations', icon: ClipboardList, badge: obligationCount },
    { key: 'simple', label: 'Simple Explanation', icon: BookOpen },
    { key: 'chat', label: 'Ask Questions', icon: MessageCircle },
  ];

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/documents"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to documents
        </Link>

        {/* Document header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-primary)]/10 p-2.5">
                <FileText className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--color-foreground)]">
                  {doc.originalName}
                </h1>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                  <span>{doc.pageCount} pages</span>
                  <span>·</span>
                  <span>{formatSize(doc.fileSize)}</span>
                  <span>·</span>
                  <span>Analyzed {formatDate(doc.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700">✓ Analyzed</Badge>
              {riskyCount > 0 && (
                <Badge className="bg-amber-100 text-amber-700">
                  {riskyCount} risk{riskyCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'summary' && analysis?.summary && (
            <AnalysisSummary summary={analysis.summary} />
          )}

          {activeTab === 'risks' && (
            <div className="space-y-3">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Risky Clauses</h2>
                <Badge className="bg-amber-100 text-amber-700">{riskyCount} found</Badge>
              </div>
              {analysis?.risky_clauses && analysis.risky_clauses.length > 0 ? (
                analysis.risky_clauses.map((clause, i) => (
                  <RiskyClauseCard key={i} clause={clause} index={i} />
                ))
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <p className="text-sm text-emerald-700">
                    No risky clauses were identified in this document.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'obligations' && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[var(--color-primary)]" />
                <h2 className="text-lg font-semibold">Obligations</h2>
                <Badge variant="outline">{obligationCount} found</Badge>
              </div>
              <ObligationList obligations={analysis?.obligations ?? []} />
            </div>
          )}

          {activeTab === 'simple' && analysis?.simple_explanation && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6"
            >
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-lg font-semibold">Simple Language Explanation</h3>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-[var(--color-foreground)]/80">
                {analysis.simple_explanation.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && doc.id && (
            <DocumentChatPanel documentId={doc.id} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
