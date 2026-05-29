import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Shield, Brain } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/common/Pagination';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { DocumentUploadZone } from '@/components/documents/DocumentUploadZone';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { documentsApi } from '@/api/documents.api';

export function DocumentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [uploadError, setUploadError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['documents', 'me', page],
    queryFn: async () => {
      const res = await documentsApi.listMine(page, 10);
      return { documents: res.data.data.documents, meta: res.data.meta };
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsApi.upload(file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadError('');
      const doc = res.data.data.document;
      if (doc?.id) {
        navigate(`/documents/${doc.id}`);
      }
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const features = [
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Get instant legal summaries powered by Gemini AI',
    },
    {
      icon: Shield,
      title: 'Risk Detection',
      description: 'Identify risky clauses and unfavorable terms',
    },
    {
      icon: Sparkles,
      title: 'Plain Language',
      description: 'Complex legalese explained in simple English',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">
                AI Document Analyzer
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload legal documents for instant AI-powered analysis
              </p>
            </div>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {features.map((f, i) => (
            <Card key={i} className="border-primary/10">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-accent/10 p-2">
                  <f.icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Document</CardTitle>
              <CardDescription>
                Upload a PDF to get AI analysis including summary, risk detection, and obligation extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadZone
                onUpload={(file) => {
                  setUploadError('');
                  uploadMutation.mutate(file);
                }}
                isUploading={uploadMutation.isPending}
                error={uploadError}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Document list */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Documents</CardTitle>
              <CardDescription>Previously analyzed legal documents</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingState message="Loading documents..." />
              ) : !data?.documents.length ? (
                <EmptyState
                  title="No documents yet"
                  description="Upload a PDF above to get started with AI-powered legal analysis."
                />
              ) : (
                <div className="space-y-3">
                  {data.documents.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                  {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
