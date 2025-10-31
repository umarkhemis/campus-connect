


/**
 * Chat Room Types
 */
export const ChatRoomType = {
  id: 'string',
  user1: 'User',
  user2: 'User',
  user1_profile: 'UserProfile',
  user2_profile: 'UserProfile',
  other_user: 'User',
  other_user_profile: 'UserProfile',
  last_message: 'Message',
  unread_count: 'number',
  created_at: 'string',
  updated_at: 'string',
  is_group: 'boolean',
  group_name: 'string',
  participants: 'User[]',
};

//  export const ChatRoomType = {
//    id: 'string|number',
//    name: 'string',
//    participants: 'array', // Array of user IDs or objects
//    last_message: 'object', // Last message object
//    created_at: 'string',
//    updated_at: 'string',
//  };


export const UserType = {
  id: 'string|number',
  username: 'string',
  email: 'string',
//   first_name: 'string',
//   last_name: 'string',
  is_active: 'boolean',
  date_joined: 'string',
};

export const UserProfileType = {
  id: 'string|number',
  user: 'User',
  profile_picture: 'string',
  bio: 'string',
  phone_number: 'string',
  date_of_birth: 'string',
  location: 'string',
  course: 'string',
  year_of_study: 'number',
  interests: 'string[]',
  created_at: 'string',
  updated_at: 'string',
};

/**
 * Chat Connection States
 */
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

/**
 * Chat Room Status
 */
export const ChatRoomStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  BLOCKED: 'blocked',
  DELETED: 'deleted',
};

/**
 * Typing Indicator Types
 */
export const TypingIndicatorType = {
  user: 'User',
  isTyping: 'boolean',
  timestamp: 'string',
};

/**
 * Chat Event Types for WebSocket
 */
export const ChatEventType = {
  MESSAGE_SENT: 'message_sent',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  MESSAGE_DELETED: 'message_deleted',
  USER_TYPING: 'user_typing',
  USER_STOPPED_TYPING: 'user_stopped_typing',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  ERROR: 'error',
};

/**
 * Pagination Types
 */
export const PaginationType = {
  count: 'number',
  next: 'string|null',
  previous: 'string|null',
  results: 'any[]',
};

/**
 * API Response Types
 */
export const ApiResponseType = {
  success: 'boolean',
  data: 'any',
  error: 'string',
  message: 'string',
};

/**
 * Chat Hook States
 */
export const ChatHookState = {
  chatRooms: 'ChatRoom[]',
  loading: 'boolean',
  error: 'string|null',
  hasMore: 'boolean',
  refreshing: 'boolean',
};

export const MessageHookState = {
  messages: 'Message[]',
  loading: 'boolean',
  error: 'string|null',
  hasMore: 'boolean',
  page: 'number',
  sending: 'boolean',
};

export const WebSocketHookState = {
  isConnected: 'boolean',
  connectionState: 'ConnectionState',
  error: 'string|null',
  reconnectAttempts: 'number',
  lastHeartbeat: 'string|null',
};