
export const getChatRoomId = (userId, otherUserId) => {
  return userId < otherUserId ? `${userId}-${otherUserId}` : `${otherUserId}-${userId}`;
};
export const groupMessagesByDate = (messages) => {
  const grouped = {};
  
  messages.forEach(message => {
    const date = new Date(message.created_at).toDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(message);
  });
  
  return grouped;
};

export const getLastMessagePreview = (message) => {
  if (!message) return 'No messages yet';
  
  switch (message.message_type) {
    case 'image':
      return '📷 Photo';
    case 'file':
      return '📎 File';
    case 'voice':
      return '🎤 Voice message';
    default:
      return message.content || '';
  }
};

export const formatChatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};