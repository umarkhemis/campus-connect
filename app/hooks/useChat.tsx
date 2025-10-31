
import { useWebSocket } from './useWebsocket';
import { useChatMessages } from './useChatMessages';
import { useTypingIndicator } from './useTypingIndicator';
import { useCallback, useEffect } from 'react';

export const useChat = (roomId, otherUser, enabled = true) => {
  const {
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempt,
    sendMessage: wsSendMessage,
    sendTyping: wsSendTyping,
    addEventListener
  } = useWebSocket(roomId, enabled);

  const {
    messages,
    loading: messagesLoading,
    sending,
    error: messagesError,
    hasNextPage,
    loadingMore,
    loadMoreMessages,
    sendMessage: apiSendMessage,
    addMessage,
    updateMessage,
    deleteMessage
  } = useChatMessages(roomId);

  const {
    isTyping,
    otherUserTyping,
    handleTypingStart,
    handleTypingStop,
    setOtherUserTypingState
  } = useTypingIndicator(wsSendTyping);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!enabled) return;

    const unsubscribeMessage = addEventListener('chat_message', (data) => {
      addMessage(data.message);
    });

    const unsubscribeTyping = addEventListener('typing_indicator', (data) => {
      setOtherUserTypingState(data.is_typing);
    });

    const unsubscribeMessageUpdate = addEventListener('message_updated', (data) => {
      updateMessage(data.message_id, data.updates);
    });

    const unsubscribeMessageDelete = addEventListener('message_deleted', (data) => {
      deleteMessage(data.message_id);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeMessageUpdate();
      unsubscribeMessageDelete();
    };
  }, [enabled, addEventListener, addMessage, updateMessage, deleteMessage, setOtherUserTypingState]);

  // Enhanced send message function
  const sendMessage = useCallback(async (content, messageType = 'text', file = null) => {
    if (!content?.trim() && !file) return;

    try {
      // Send via WebSocket for real-time delivery
      const wsSuccess = wsSendMessage(content);
      
      // Also send via API for persistence (fallback)
      if (!wsSuccess) {
        await apiSendMessage(content, messageType, file);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [wsSendMessage, apiSendMessage]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempt,
    
    // Messages state
    messages,
    messagesLoading,
    messagesError,
    hasNextPage,
    loadingMore,
    
    // Actions
    sendMessage,
    loadMoreMessages,
    deleteMessage: deleteMessage,
    
    // Typing indicators
    isTyping,
    otherUserTyping,
    handleTypingStart,
    handleTypingStop,
    
    // Other
    sending,
    otherUser
  };
};




































// import { useState, useEffect, useCallback, useRef } from 'react';
// import { Alert } from 'react-native';
// import ConnectionAPI from '../api/connectionService';
// import { useWebSocket } from './useWebSocket';

// export const useChat = (roomId, otherUser) => {
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);
//   const [otherUserTyping, setOtherUserTyping] = useState(false);
//   const [error, setError] = useState(null);
  
//   const typingTimeoutRef = useRef(null);
//   const flatListRef = useRef(null);
  
//   // WebSocket connection
//   const {
//     isConnected,
//     isConnecting,
//     connectionError,
//     sendMessage: wsSendMessage,
//     sendTyping,
//     addEventListener
//   } = useWebSocket(roomId, !!roomId);

//   // Load initial messages
//   const loadMessages = useCallback(async () => {
//     if (!roomId) return;
    
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await ConnectionAPI.getChatMessages(roomId);
//       setMessages(response.results?.reverse() || []);
      
//       // Mark messages as read
//       await ConnectionAPI.markMessagesRead(roomId);
//     } catch (err) {
//       console.error('Failed to load messages:', err);
//       setError('Failed to load messages');
//     } finally {
//       setLoading(false);
//     }
//   }, [roomId]);

//   // Send message
//   const sendMessage = useCallback(async (content, type = 'text') => {
//     if (!content.trim() || sending || !roomId) return false;
    
//     const messageText = content.trim();
//     setSending(true);
    
//     try {
//       // Try WebSocket first
//       if (isConnected) {
//         const success = wsSendMessage(messageText);
//         if (success) {
//           setSending(false);
//           return true;
//         }
//       }
      
//       // Fallback to HTTP API
//       const response = await ConnectionAPI.sendMessage(roomId, messageText, type);
      
//       // Add message to local state if WebSocket didn't handle it
//       if (!isConnected) {
//         setMessages(prev => [...prev, response]);
//         scrollToBottom();
//       }
      
//       return true;
//     } catch (err) {
//       console.error('Failed to send message:', err);
//       Alert.alert('Error', 'Failed to send message');
//       return false;
//     } finally {
//       setSending(false);
//     }
//   }, [roomId, sending, isConnected, wsSendMessage]);

//   // Handle typing indicator
//   const handleTyping = useCallback((isTyping) => {
//     if (!isConnected) return;
    
//     sendTyping(isTyping);
    
//     if (isTyping) {
//       // Clear existing timeout
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current);
//       }
      
//       // Set timeout to stop typing
//       typingTimeoutRef.current = setTimeout(() => {
//         sendTyping(false);
//       }, 2000);
//     }
//   }, [isConnected, sendTyping]);

//   // Scroll to bottom
//   const scrollToBottom = useCallback((animated = true) => {
//     setTimeout(() => {
//       flatListRef.current?.scrollToEnd({ animated });
//     }, 100);
//   }, []);

//   // Delete message
//   const deleteMessage = useCallback(async (messageId) => {
//     try {
//       await ConnectionAPI.deleteMessage(messageId);
//       setMessages(prev => prev.filter(msg => msg.id !== messageId));
//     } catch (err) {
//       console.error('Failed to delete message:', err);
//       Alert.alert('Error', 'Failed to delete message');
//     }
//   }, []);

//   // Set up WebSocket event listeners
//   useEffect(() => {
//     if (!roomId) return;

//     const unsubscribeMessage = addEventListener('chat_message', (data) => {
//       setMessages(prev => [...prev, data.message]);
//       scrollToBottom();
//     });

//     const unsubscribeTyping = addEventListener('typing_indicator', (data) => {
//       setOtherUserTyping(data.is_typing);
//       if (data.is_typing) {
//         // Auto-clear typing indicator after 3 seconds
//         setTimeout(() => setOtherUserTyping(false), 3000);
//       }
//     });

//     const unsubscribeMessageDeleted = addEventListener('message_deleted', (data) => {
//       setMessages(prev => prev.filter(msg => msg.id !== data.message_id));
//     });

//     return () => {
//       unsubscribeMessage();
//       unsubscribeTyping();
//       unsubscribeMessageDeleted();
//     };
//   }, [roomId, addEventListener, scrollToBottom]);

//   // Load messages on mount
//   useEffect(() => {
//     if (roomId) {
//       loadMessages();
//     }
//   }, [roomId, loadMessages]);

//   // Cleanup typing timeout
//   useEffect(() => {
//     return () => {
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current);
//       }
//     };
//   }, []);

//   return {
//     messages,
//     loading,
//     sending,
//     error,
//     otherUserTyping,
//     isConnected,
//     isConnecting,
//     connectionError,
//     flatListRef,
//     sendMessage,
//     handleTyping,
//     scrollToBottom,
//     deleteMessage,
//     loadMessages
//   };
// };
