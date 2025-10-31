

// src/chat/utils/messageUtils.js - Enhanced version
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MessageTypeEnum, MessageStatusEnum } from '../types/message.types';

let currentUserId = null;

// Cache current user ID for performance
export const getCurrentUserId = async () => {
  if (currentUserId) return currentUserId;
  
  try {
    const currentUser = await AsyncStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      currentUserId = user.id;
      return currentUserId;
    }
    return null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

export const isCurrentUser = async (senderId) => {
  const userId = await getCurrentUserId();
  return userId === senderId;
};

export const validateMessage = (content, type, file = null) => {
  const validation = {
    valid: true,
    error: null,
    warnings: []
  };

  switch (type) {
    case MessageTypeEnum.TEXT:
      if (!content || content.trim().length === 0) {
        validation.valid = false;
        validation.error = 'Message cannot be empty';
      } else if (content.length > 1000) {
        validation.valid = false;
        validation.error = 'Message too long (max 1000 characters)';
      }
      break;

    case MessageTypeEnum.IMAGE:
    case MessageTypeEnum.FILE:
    case MessageTypeEnum.VOICE:
    case MessageTypeEnum.VIDEO:
      if (!file) {
        validation.valid = false;
        validation.error = `File is required for ${type} messages`;
      }
      break;

    default:
      validation.warnings.push(`Unknown message type: ${type}`);
  }

  return validation;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  return imageExtensions.includes(getFileExtension(filename));
};

export const isVideoFile = (filename) => {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
  return videoExtensions.includes(getFileExtension(filename));
};

export const isAudioFile = (filename) => {
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'];
  return audioExtensions.includes(getFileExtension(filename));
};

export const getMessageStatusIcon = (status, isRead) => {
  if (isRead) return '✓✓'; // Double check for read
  
  switch (status) {
    case MessageStatusEnum.SENT:
      return '✓';
    case MessageStatusEnum.DELIVERED:
      return '✓✓';
    case MessageStatusEnum.READ:
      return '✓✓';
    case MessageStatusEnum.FAILED:
      return '❌';
    case MessageStatusEnum.PENDING:
      return '⏳';
    default:
      return '';
  }
};

export const shouldGroupMessages = (currentMsg, previousMsg) => {
  if (!previousMsg) return false;
  
  const timeDiff = new Date(currentMsg.created_at) - new Date(previousMsg.created_at);
  const fiveMinutes = 5 * 60 * 1000;
  
  return (
    currentMsg.sender.id === previousMsg.sender.id &&
    timeDiff < fiveMinutes
  );
};

export const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};

export const extractLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

export const formatMessageForDisplay = (message) => {
  switch (message.message_type) {
    case MessageTypeEnum.IMAGE:
      return '📷 Photo';
    case MessageTypeEnum.FILE:
      return `📎 ${message.file?.split('/').pop() || 'File'}`;
    case MessageTypeEnum.VOICE:
      return '🎤 Voice message';
    case MessageTypeEnum.VIDEO:
      return '🎥 Video';
    case MessageTypeEnum.LOCATION:
      return '📍 Location';
    case MessageTypeEnum.CONTACT:
      return '👤 Contact';
    default:
      return message.content || '';
  }
};































// import AsyncStorage from '@react-native-async-storage/async-storage';

// export const isCurrentUser = async (senderId) => {
//   try {
//     const currentUser = await AsyncStorage.getItem('currentUser');
//     if (currentUser) {
//       const user = JSON.parse(currentUser);
//       return user.id === senderId;
//     }
//     return false;
//   } catch (error) {
//     console.error('Error checking current user:', error);
//     return false;
//   }
// };

// export const validateMessage = (content, type) => {
//   if (type === 'text' && (!content || content.trim().length === 0)) {
//     return { valid: false, error: 'Message cannot be empty' };
//   }
  
//   if (content && content.length > 1000) {
//     return { valid: false, error: 'Message too long' };
//   }
  
//   return { valid: true };
// };

// export const formatFileSize = (bytes) => {
//   if (bytes === 0) return '0 Bytes';
//   const k = 1024;
//   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// };