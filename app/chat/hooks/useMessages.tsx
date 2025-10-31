

import { useState, useEffect } from 'react';
import ConnectionAPI from '../../api/connectionService';

export const useMessages = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMessages = async (pageNum = 1, append = false) => {
    if (loading) return;
    
    try {
      setLoading(true);
      const response = await ConnectionAPI.getChatMessages(roomId, pageNum);
      
      if (append) {
        setMessages(prev => [...prev, ...response.results]);
      } else {
        setMessages(response.results || []);
      }
      
      setHasMore(!!response.next);
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content, type = 'text', file = null) => {
    try {
      const newMessage = await ConnectionAPI.sendMessage(roomId, content, type, file);
      setMessages(prev => [newMessage, ...prev]);
      return newMessage;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  };

  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(nextPage, true);
    }
  };

  const markAsRead = async () => {
    try {
      await ConnectionAPI.markMessagesRead(roomId);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const addNewMessage = (message) => {
    setMessages(prev => [message, ...prev]);
  };

  useEffect(() => {
    if (roomId) {
      loadMessages();
    }
  }, [roomId]);

  return {
    messages,
    loading,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    addNewMessage,
  };
};