import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Bot, User, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CitationHighlight } from './CitationHighlight';
import { documentsApi } from '@/api/documents.api';
import type { ChatMessage } from '@/types/document';

interface DocumentChatPanelProps {
  documentId: string;
}

export function DocumentChatPanel({ documentId }: DocumentChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: (question: string) => documentsApi.chat(documentId, question),
    onSuccess: (res) => {
      const response = res.data.data;
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          citations: response.citations,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      },
    ]);
    setInput('');
    chatMutation.mutate(trimmed);
  };

  const toggleCitations = (msgId: string) => {
    setExpandedCitations((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  const suggestedQuestions = [
    'What are the key obligations for each party?',
    'Are there any termination clauses?',
    'What happens if one party breaches the contract?',
    'Summarize the payment terms.',
  ];

  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-3.5">
        <MessageSquare className="h-4 w-4 text-[var(--color-primary)]" />
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
          Chat with Document
        </h3>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" style={{ minHeight: 300, maxHeight: 500 }}>
        {messages.length === 0 && (
          <div className="space-y-3 py-4">
            <div className="text-center">
              <Bot className="mx-auto h-10 w-10 text-[var(--color-primary)]/40" />
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                Ask any question about your document
              </p>
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                  }}
                  className="block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-3 py-2 text-left text-xs text-[var(--color-foreground)]/70 transition-colors hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                msg.role === 'user'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="h-3.5 w-3.5" />
              ) : (
                <Bot className="h-3.5 w-3.5" />
              )}
            </div>

            <div
              className={`max-w-[85%] space-y-2 rounded-xl px-3.5 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-muted)]'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

              {/* Citations toggle */}
              {msg.citations && msg.citations.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleCitations(msg.id)}
                    className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {expandedCitations.has(msg.id) ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''}
                  </button>

                  <AnimatePresence>
                    {expandedCitations.has(msg.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 space-y-2 overflow-hidden"
                      >
                        {msg.citations.map((citation, i) => (
                          <CitationHighlight key={i} citation={citation} index={i} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {chatMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[var(--color-muted)] px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
              <span className="text-sm text-[var(--color-muted-foreground)]">Analyzing...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border)] p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask a question about this document..."
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)]"
            disabled={chatMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
