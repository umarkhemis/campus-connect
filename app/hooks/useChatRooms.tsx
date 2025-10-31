

import { useState, useEffect, useCallback } from 'react';
import ConnectionAPI from '../api/connectionService';

export const useChatRooms = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadChatRooms = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const rooms = await ConnectionAPI.getChatRooms();
      setChatRooms(rooms);
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
      setError(err.message || 'Failed to load chat rooms');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshChatRooms = useCallback(async () => {
    setRefreshing(true);
    await loadChatRooms(false);
  }, [loadChatRooms]);

  const createOrGetChatRoom = useCallback(async (userId) => {
    try {
      const room = await ConnectionAPI.getOrCreateChatRoom(userId);
      
      // Update local state if room is new
      setChatRooms(prevRooms => {
        const existingRoom = prevRooms.find(r => r.id === room.id);
        if (existingRoom) {
          return prevRooms;
        }
        return [room, ...prevRooms];
      });
      
      return room;
    } catch (err) {
      console.error('Failed to create/get chat room:', err);
      throw err;
    }
  }, []);

  const updateRoomLastMessage = useCallback((roomId, message) => {
    setChatRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === roomId
          ? { 
              ...room, 
              last_message: message,
              unread_count: room.unread_count + 1
            }
          : room
      )
    );
  }, []);

  const markRoomAsRead = useCallback((roomId) => {
    setChatRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === roomId
          ? { ...room, unread_count: 0 }
          : room
      )
    );
  }, []);

  useEffect(() => {
    loadChatRooms();
  }, [loadChatRooms]);

  return {
    chatRooms,
    loading,
    refreshing,
    error,
    loadChatRooms,
    refreshChatRooms,
    createOrGetChatRoom,
    updateRoomLastMessage,
    markRoomAsRead
  };
};











































// import { useState, useEffect, useCallback } from 'react';
// import ConnectionAPI from '../api/connectionService';

// export const useChatRooms = () => {
//   const [chatRooms, setChatRooms] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);

//   const loadChatRooms = useCallback(async (showRefreshing = false) => {
//     try {
//       if (showRefreshing) setRefreshing(true);
//       else setLoading(true);
      
//       setError(null);
//       const rooms = await ConnectionAPI.getChatRooms();
//       setChatRooms(rooms);
//     } catch (err) {
//       console.error('Failed to load chat rooms:', err);
//       setError('Failed to load chat rooms');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   const refreshChatRooms = useCallback(() => {
//     loadChatRooms(true);
//   }, [loadChatRooms]);

//   const getOrCreateChatRoom = useCallback(async (userId) => {
//     try {
//       const room = await ConnectionAPI.getOrCreateChatRoom(userId);
//       return room;
//     } catch (err) {
//       console.error('Failed to get or create chat room:', err);
//       throw err;
//     }
//   }, []);

//   useEffect(() => {
//     loadChatRooms();
//   }, [loadChatRooms]);

//   return {
//     chatRooms,
//     loading,
//     refreshing,
//     error,
//     loadChatRooms,
//     refreshChatRooms,
//     getOrCreateChatRoom
//   };
// };
