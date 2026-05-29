import { useCallback, useState } from 'react';
import type { ChatMessage } from '@/types/meeting';

interface UseMeetingChatReturn {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  setHistory: (msgs: ChatMessage[]) => void;
  unreadCount: number;
  resetUnread: () => void;
}

export function useMeetingChat(): UseMeetingChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  const setHistory = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
  }, []);

  const resetUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { messages, addMessage, setHistory, unreadCount, resetUnread };
}
