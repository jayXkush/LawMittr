import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { env } from '../config/env';
import { DocumentModel, IDocument } from '../models/Document';
import { AppError } from '../utils/AppError';
import { parsePagination, paginationMeta } from '../utils/pagination';

const aiClient = axios.create({
  baseURL: env.AI_SERVICE_URL,
  timeout: 120_000, // 2 min — analysis can be slow
});

// ── AI Service Calls ─────────────────────────────────────────────

interface AIAnalyzeResult {
  document_id: string;
  filename: string;
  page_count: number;
  text_length: number;
  analysis: {
    summary: string;
    risky_clauses: Array<{
      clause: string;
      risk_level: string;
      explanation: string;
      page?: number;
      source_chunk_ids?: string[];
    }>;
    obligations: Array<{
      party: string;
      obligation: string;
      source_text: string;
      page?: number;
    }>;
    simple_explanation: string;
  };
}

interface AIChatResult {
  answer: string;
  citations: Array<{
    text: string;
    page?: number;
    chunk_id: string;
    relevance_score: number;
  }>;
}

export async function analyzeDocument(filePath: string, filename: string): Promise<AIAnalyzeResult> {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), {
    filename,
    contentType: 'application/pdf',
  });

  const response = await aiClient.post<AIAnalyzeResult>('/analyze', form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return response.data;
}

export async function chatWithDocument(documentId: string, question: string): Promise<AIChatResult> {
  const response = await aiClient.post<AIChatResult>('/chat', {
    document_id: documentId,
    question,
  });

  return response.data;
}

export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const res = await aiClient.get('/health', { timeout: 5000 });
    return res.data?.status === 'ok';
  } catch {
    return false;
  }
}

// ── Document CRUD ────────────────────────────────────────────────

export async function createDocumentRecord(
  userId: string,
  originalName: string,
  filename: string,
  fileSize: number
): Promise<IDocument> {
  return DocumentModel.create({
    userId,
    originalName,
    filename,
    fileSize,
    status: 'processing',
  });
}

export async function updateDocumentWithAnalysis(
  docId: string,
  aiResult: AIAnalyzeResult
): Promise<IDocument | null> {
  return DocumentModel.findByIdAndUpdate(
    docId,
    {
      status: 'analyzed',
      aiDocumentId: aiResult.document_id,
      pageCount: aiResult.page_count,
      analysis: {
        summary: aiResult.analysis.summary,
        riskyClausesCount: aiResult.analysis.risky_clauses.length,
        obligationsCount: aiResult.analysis.obligations.length,
      },
      fullAnalysis: aiResult.analysis,
    },
    { new: true }
  );
}

export async function markDocumentFailed(docId: string): Promise<void> {
  await DocumentModel.findByIdAndUpdate(docId, { status: 'failed' });
}

export async function getUserDocuments(
  userId: string,
  query: { page?: string; limit?: string }
) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { userId };

  const [documents, total] = await Promise.all([
    DocumentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DocumentModel.countDocuments(filter),
  ]);

  return {
    documents: documents.map(formatDocument),
    meta: paginationMeta(total, page, limit),
  };
}

export async function getDocumentById(docId: string, userId: string) {
  const doc = await DocumentModel.findOne({ _id: docId, userId }).lean();
  if (!doc) throw new AppError('Document not found', 404);
  return formatDocument(doc);
}

export async function deleteDocument(docId: string, userId: string): Promise<void> {
  const doc = await DocumentModel.findOne({ _id: docId, userId });
  if (!doc) throw new AppError('Document not found', 404);

  // Try to clean up AI service data (best effort)
  if (doc.aiDocumentId) {
    try {
      await aiClient.delete(`/documents/${doc.aiDocumentId}`);
    } catch {
      // AI service cleanup failure is non-critical
    }
  }

  await DocumentModel.findByIdAndDelete(docId);
}

// ── Helpers ──────────────────────────────────────────────────────

function formatDocument(doc: Record<string, unknown>) {
  const d = doc as Record<string, unknown> & { _id: { toString(): string } };
  return {
    id: d._id.toString(),
    userId: String(d.userId),
    filename: d.filename,
    originalName: d.originalName,
    fileSize: d.fileSize,
    pageCount: d.pageCount,
    aiDocumentId: d.aiDocumentId,
    status: d.status,
    analysis: d.analysis,
    fullAnalysis: d.fullAnalysis,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}
