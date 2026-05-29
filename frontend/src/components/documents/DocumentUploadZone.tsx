import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentUploadZoneProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  error?: string;
}

export function DocumentUploadZone({ onUpload, isUploading, error }: DocumentUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState('');

  const validateFile = (file: File): boolean => {
    setValidationError('');
    if (file.type !== 'application/pdf') {
      setValidationError('Only PDF files are accepted');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setValidationError('File size must be under 10 MB');
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
    // Reset input so re-selecting the same file works
    e.target.value = '';
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setValidationError('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <motion.div
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragOver
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-muted)]/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('pdf-upload-input')?.click()}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        <input
          id="pdf-upload-input"
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-[var(--color-primary)]/10 p-4">
            <Upload className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="text-base font-medium text-[var(--color-foreground)]">
              {isDragOver ? 'Drop your PDF here' : 'Drag & drop your legal document'}
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              or click to browse · PDF only · Max 10 MB
            </p>
          </div>
        </div>
      </motion.div>

      {/* Validation error */}
      {(validationError || error) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-[var(--color-destructive)]"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {validationError || error}
        </motion.div>
      )}

      {/* Selected file preview */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[var(--color-primary)]/10 p-2">
              <FileText className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {formatSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              isLoading={isUploading}
              disabled={isUploading}
            >
              {isUploading ? 'Analyzing...' : 'Analyze Document'}
            </Button>
            {!isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
            <motion.div
              className="h-full rounded-full bg-[var(--color-primary)]"
              initial={{ width: '0%' }}
              animate={{ width: '85%' }}
              transition={{ duration: 8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-center text-xs text-[var(--color-muted-foreground)]">
            Extracting text, generating embeddings, and running AI analysis...
          </p>
        </motion.div>
      )}
    </div>
  );
}
