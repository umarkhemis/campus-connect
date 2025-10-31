
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

export const formatChatRoomTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short'
    });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

export const isToday = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

export const isYesterday = (timestamp) => {
  const date = new Date(timestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};


// import { launchImagePicker } from 'react-native-image-picker';

export const pickImage = (options = {}) => {
  const defaultOptions = {
    mediaType: 'photo',
    quality: 0.7,
    includeBase64: false,
    maxWidth: 1024,
    maxHeight: 1024,
    ...options
  };
  
  return new Promise((resolve, reject) => {
    launchImagePicker(defaultOptions, (response) => {
      if (response.didCancel) {
        resolve(null);
      } else if (response.errorMessage) {
        reject(new Error(response.errorMessage));
      } else if (response.assets && response.assets[0]) {
        resolve(response.assets[0]);
      } else {
        resolve(null);
      }
    });
  });
};

export const createImageFormData = (asset, fieldName = 'file') => {
  const formData = new FormData();
  formData.append(fieldName, {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || 'image.jpg',
  });
  return formData;
};

export const generateImagePreview = (uri) => {
  return {
    uri,
    style: { width: 200, height: 200, borderRadius: 8 }
  };
};


export const generateInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return 'U';
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const getFullName = (user) => {
  if (!user) return 'Unknown User';
  return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Unknown User';
};

export const shouldShowAvatar = (messages, index, isCurrentUser) => {
  if (isCurrentUser) return false;
  
  // Show avatar if it's the last message or the next message is from a different sender
  return index === messages.length - 1 || 
         messages[index + 1]?.sender?.id !== messages[index]?.sender?.id;
};

export const shouldShowTimestamp = (messages, index) => {
  if (index === 0) return true;
  
  const currentMessage = messages[index];
  const previousMessage = messages[index - 1];
  
  if (!previousMessage) return true;
  
  const currentTime = new Date(currentMessage.created_at);
  const previousTime = new Date(previousMessage.created_at);
  
  // Show timestamp if messages are more than 5 minutes apart
  return (currentTime - previousTime) > 5 * 60 * 1000;
};

export const groupMessagesByDate = (messages) => {
  const groups = {};
  
  messages.forEach(message => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  
  return groups;
};

export const formatUnreadCount = (count) => {
  if (count > 99) return '99+';
  return count.toString();
};

