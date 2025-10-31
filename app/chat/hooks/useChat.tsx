

import { useState, useEffect } from 'react';
import ConnectionAPI from '../../api/connectionService';

export const useChat = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const rooms = await ConnectionAPI.getChatRooms();
      setChatRooms(rooms);
    } catch (error) {
      console.error('Load chat rooms error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshChatRooms = () => {
    loadChatRooms();
  };

  useEffect(() => {
    loadChatRooms();
  }, []);

  return {
    chatRooms,
    loading,
    refreshChatRooms,
    loadChatRooms,
  };
};