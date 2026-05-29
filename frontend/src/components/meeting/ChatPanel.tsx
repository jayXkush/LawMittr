import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import type { ChatMessage } from '@/types/meeting';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string) => void;
  onClose: () => void;
}

export function ChatPanel({ messages, currentUserId, onSend, onClose }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div
      className="flex h-full w-80 flex-col border-l border-white/10 bg-[#16162a]/95 backdrop-blur-xl"
      id="chat-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">In-call Chat</h3>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          id="btn-close-chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-white/40 py-8">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => {
          const isSelf = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
            >
              {!isSelf && (
                <span className="mb-0.5 text-xs font-medium text-indigo-400">
                  {msg.senderName}
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  isSelf
                    ? 'rounded-br-md bg-[#6366f1] text-white'
                    : 'rounded-bl-md bg-white/10 text-white'
                }`}
              >
                {msg.text}
              </div>
              <span className="mt-0.5 text-[10px] text-white/30">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-white/10 px-3 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors focus:bg-white/15 focus:ring-1 focus:ring-indigo-500/50"
          maxLength={1000}
          id="chat-input"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6366f1] text-white transition-all hover:bg-[#5558e6] disabled:opacity-40 disabled:hover:bg-[#6366f1]"
          id="btn-send-chat"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
