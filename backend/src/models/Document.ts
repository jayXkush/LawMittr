import mongoose, { Document, Schema, Types } from 'mongoose';

export type DocumentStatus = 'processing' | 'analyzed' | 'failed';

export interface IDocumentAnalysis {
  summary: string;
  riskyClausesCount: number;
  obligationsCount: number;
}

export interface IDocument extends Document {
  userId: Types.ObjectId;
  filename: string;
  originalName: string;
  fileSize: number;
  pageCount: number;
  aiDocumentId: string;
  status: DocumentStatus;
  analysis?: IDocumentAnalysis;
  fullAnalysis?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    aiDocumentId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['processing', 'analyzed', 'failed'],
      default: 'processing',
    },
    analysis: {
      summary: { type: String },
      riskyClausesCount: { type: Number, default: 0 },
      obligationsCount: { type: Number, default: 0 },
    },
    fullAnalysis: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ aiDocumentId: 1 }, { sparse: true });

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);
