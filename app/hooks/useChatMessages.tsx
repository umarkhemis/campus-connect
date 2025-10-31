
import { useState, useEffect, useCallback, useRef } from 'react';
import ConnectionAPI from '../api/connectionService';

export const useChatMessages = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const pageRef = useRef(1);
  const totalPagesRef = useRef(1);

  const loadMessages = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      
      setError(null);
      
      const response = await ConnectionAPI.getChatMessages(roomId, page);
      const newMessages = response.results || [];
      
      if (append) {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
      } else {
        setMessages(newMessages.reverse());
      }
      
      pageRef.current = page;
      totalPagesRef.current = Math.ceil((response.count || 0) / (response.page_size || 20));
      setHasNextPage(page < totalPagesRef.current);
      
      // Mark messages as read
      await ConnectionAPI.markMessagesRead(roomId);
      
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [roomId]);

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasNextPage) return;
    
    const nextPage = pageRef.current + 1;
    await loadMessages(nextPage, true);
  }, [loadMessages, loadingMore, hasNextPage]);

  const sendMessage = useCallback(async (content, messageType = 'text', file = null) => {
    if (!content?.trim() && !file) return;
    
    setSending(true);
    try {
      const message = await ConnectionAPI.sendMessage(roomId, content, messageType, file);
      
      // Add message to local state
      setMessages(prev => [...prev, message]);
      
      return message;
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [roomId]);

  const addMessage = useCallback((message) => {
    setMessages(prev => {
      // Avoid duplicates
      const exists = prev.some(m => m.id === message.id);
      if (exists) return prev;
      
      return [...prev, message];
    });
  }, []);

  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      await ConnectionAPI.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      throw err;
    }
  }, []);

  // Load messages when roomId changes
  useEffect(() => {
    if (roomId) {
      loadMessages(1, false);
    }
  }, [roomId, loadMessages]);

  return {
    messages,
    loading,
    sending,
    error,
    hasNextPage,
    loadingMore,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    addMessage,
    updateMessage,
    deleteMessage
  };
};


