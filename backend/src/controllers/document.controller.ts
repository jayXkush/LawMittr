import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  analyzeDocument,
  chatWithDocument,
  checkAIServiceHealth,
  createDocumentRecord,
  updateDocumentWithAnalysis,
  markDocumentFailed,
  getUserDocuments,
  getDocumentById,
  deleteDocument,
} from '../services/document.service';

// ── Multer config ────────────────────────────────────────────────

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF files are accepted', 400) as unknown as Error);
    }
  },
});

// ── Controllers ──────────────────────────────────────────────────

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  // Check AI service availability
  const aiHealthy = await checkAIServiceHealth();
  if (!aiHealthy) {
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    throw new AppError('AI analysis service is temporarily unavailable. Please try again later.', 503);
  }

  // Create document record in MongoDB
  const doc = await createDocumentRecord(
    req.user!.id,
    req.file.originalname,
    req.file.filename,
    req.file.size
  );

  try {
    // Send to AI service for analysis
    const aiResult = await analyzeDocument(req.file.path, req.file.originalname);

    // Update document with analysis results
    const updated = await updateDocumentWithAnalysis(String(doc._id), aiResult);

    res.status(201).json({
      success: true,
      message: 'Document analyzed successfully',
      data: { document: updated },
    });
  } catch (err) {
    // Mark as failed but keep the record
    await markDocumentFailed(String(doc._id));

    const message =
      err instanceof Error ? err.message : 'Document analysis failed';
    throw new AppError(`Analysis failed: ${message}`, 500);
  } finally {
    // Clean up uploaded file from Express server
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch {
      // Non-critical cleanup failure
    }
  }
});

export const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  const result = await getUserDocuments(req.user!.id, req.query as Record<string, string>);

  res.json({
    success: true,
    data: { documents: result.documents },
    meta: result.meta,
  });
});

export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await getDocumentById(req.params.id as string, req.user!.id);

  res.json({
    success: true,
    data: { document },
  });
});

export const chatDocument = asyncHandler(async (req: Request, res: Response) => {
  const { question } = req.body;

  // Verify document exists and belongs to user
  const document = await getDocumentById(req.params.id as string, req.user!.id);

  if (document.status !== 'analyzed') {
    throw new AppError('Document has not been analyzed yet', 400);
  }

  if (!document.aiDocumentId) {
    throw new AppError('Document analysis data is missing', 400);
  }

  const result = await chatWithDocument(document.aiDocumentId as string, question);

  res.json({
    success: true,
    data: result,
  });
});

export const removeDocument = asyncHandler(async (req: Request, res: Response) => {
  await deleteDocument(req.params.id as string, req.user!.id);

  res.json({
    success: true,
    message: 'Document deleted successfully',
  });
});
