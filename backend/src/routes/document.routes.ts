import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { chatWithDocumentSchema } from '../validators/document.validator';
import {
  upload,
  uploadDocument,
  listDocuments,
  getDocument,
  chatDocument,
  removeDocument,
} from '../controllers/document.controller';

const router = Router();

// All document routes require authentication
router.use(authenticate);

// Upload + analyze a PDF
router.post(
  '/upload',
  authorize('user', 'lawyer'),
  upload.single('file'),
  uploadDocument
);

// List user's documents
router.get('/me', authorize('user', 'lawyer'), listDocuments);

// Get single document with full analysis
router.get('/:id', authorize('user', 'lawyer'), getDocument);

// Chat with a document
router.post(
  '/:id/chat',
  authorize('user', 'lawyer'),
  validate(chatWithDocumentSchema),
  chatDocument
);

// Delete a document
router.delete('/:id', authorize('user', 'lawyer'), removeDocument);

export default router;
