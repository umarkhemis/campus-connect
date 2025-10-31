
import { useState, useEffect, useCallback, useRef } from 'react';
import WebSocketService from '../api/WebSocketService';
import ConnectionAPI from '../api/connectionService'

export const useWebSocket = (roomId, enabled = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  const listenersRef = useRef({});

  const connect = useCallback(async () => {
    if (!roomId || !enabled) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      await WebSocketService.connect(roomId);
    } catch (error) {
      setConnectionError(error.message);
      console.error('WebSocket connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [roomId, enabled]);

  const disconnect = useCallback(() => {
    WebSocketService.disconnect();
  }, []);

  const send = useCallback((data) => {
    return WebSocketService.send(data);
  }, []);

  const sendMessage = useCallback((content) => {
    return WebSocketService.sendChatMessage(content);
  }, []);

  const sendTyping = useCallback((isTyping) => {
    return WebSocketService.sendTypingIndicator(isTyping);
  }, []);

  // Event listener management
  const addEventListener = useCallback((event, callback) => {
    const unsubscribe = WebSocketService.on(event, callback);
    
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event].push(unsubscribe);
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Set up connection status listeners
    const unsubscribeConnected = WebSocketService.on('connected', () => {
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempt(0);
    });

    const unsubscribeDisconnected = WebSocketService.on('disconnected', () => {
      setIsConnected(false);
    });

    const unsubscribeError = WebSocketService.on('error', (error) => {
      setConnectionError(error.message || 'Connection error');
      setIsConnected(false);
    });

    const unsubscribeReconnecting = WebSocketService.on('reconnecting', (data) => {
      setReconnectAttempt(data.attempt);
      setIsConnecting(true);
    });

    // Auto-connect if enabled
    if (enabled && roomId) {
      connect();
    }

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
      unsubscribeReconnecting();
      
      // Clean up all event listeners
      Object.values(listenersRef.current).flat().forEach(unsub => unsub());
      
      disconnect();
    };
  }, [roomId, enabled, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempt,
    connect,
    disconnect,
    send,
    sendMessage,
    sendTyping,
    addEventListener
  };
};





