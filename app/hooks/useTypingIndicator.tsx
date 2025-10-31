
import { useState, useCallback, useRef } from 'react';

export const useTypingIndicator = (sendTypingCallback) => {
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingCallback?.(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingCallback?.(false);
    }, 2000);
  }, [isTyping, sendTypingCallback]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTyping) {
      setIsTyping(false);
      sendTypingCallback?.(false);
    }
  }, [isTyping, sendTypingCallback]);

  const setOtherUserTypingState = useCallback((typing) => {
    setOtherUserTyping(typing);
    
    // Auto-clear typing indicator after 3 seconds
    if (typing) {
      setTimeout(() => setOtherUserTyping(false), 3000);
    }
  }, []);

  return {
    isTyping,
    otherUserTyping,
    handleTypingStart,
    handleTypingStop,
    setOtherUserTypingState
  };
};