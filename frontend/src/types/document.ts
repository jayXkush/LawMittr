// ── Analysis types ───────────────────────────────────────────────

export interface RiskyClause {
  clause: string;
  risk_level: 'high' | 'medium' | 'low';
  explanation: string;
  page?: number;
  source_chunk_ids?: string[];
}

export interface Obligation {
  party: string;
  obligation: string;
  source_text: string;
  page?: number;
}

export interface DocumentAnalysis {
  summary: string;
  risky_clauses: RiskyClause[];
  obligations: Obligation[];
  simple_explanation: string;
}

export interface DocumentAnalysisMeta {
  summary: string;
  riskyClausesCount: number;
  obligationsCount: number;
}

// ── Document model ───────────────────────────────────────────────

export type DocumentStatus = 'processing' | 'analyzed' | 'failed';

export interface LegalDocument {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileSize: number;
  pageCount: number;
  aiDocumentId: string;
  status: DocumentStatus;
  analysis?: DocumentAnalysisMeta;
  fullAnalysis?: DocumentAnalysis;
  createdAt: string;
  updatedAt: string;
}

// ── Chat types ───────────────────────────────────────────────────

export interface Citation {
  text: string;
  page?: number;
  chunk_id: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}
