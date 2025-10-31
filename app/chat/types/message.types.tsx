


/**
 * Message Types
 */
export const MessageType = {
  id: 'string',
  chat_room: 'string',
  sender: 'User',
  sender_profile: 'UserProfile',
  message_type: 'MessageTypeEnum',
  content: 'string',
  file: 'string|null',
  status: 'MessageStatusEnum',
  delivered_at: 'string|null',
  read_at: 'string|null',
  is_read: 'boolean',
  created_at: 'string',
  updated_at: 'string',
  reply_to: 'Message|null',
  reactions: 'object',
  thumbnail: 'string|null',
  duration: 'number|null',
  file_size: 'number|null',
};

/**
 * Message Type Enums
 */
export const MessageTypeEnum = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  VOICE: 'voice',
  VIDEO: 'video',
  LOCATION: 'location',
  CONTACT: 'contact',
  STICKER: 'sticker',
  GIF: 'gif',
};

/**
 * Message Status Enums
 */
export const MessageStatusEnum = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  PENDING: 'pending',
};

/**
 * Message Reaction Types
 */
export const MessageReactionType = {
  user_id: 'string|number',
  reaction: 'string', // emoji
  timestamp: 'string',
};

/**
 * File Message Types
 */
export const FileMessageType = {
  id: 'string',
  url: 'string',
  name: 'string',
  size: 'number',
  type: 'string', // mime type
  thumbnail: 'string|null',
  duration: 'number|null', // for audio/video
};

/**
 * Location Message Types
 */
export const LocationMessageType = {
  latitude: 'number',
  longitude: 'number',
  address: 'string',
  name: 'string|null', // place name
};

/**
 * Contact Message Types
 */
export const ContactMessageType = {
  name: 'string',
  phone: 'string',
  email: 'string|null',
  avatar: 'string|null',
};

/**
 * Message Draft Types
 */
export const MessageDraftType = {
  room_id: 'string',
  content: 'string',
  message_type: 'MessageTypeEnum',
  reply_to: 'string|null',
  attachments: 'FileMessageType[]',
  timestamp: 'string',
};

/**
 * Message Search Types
 */
export const MessageSearchType = {
  query: 'string',
  room_id: 'string|null',
  message_type: 'MessageTypeEnum|null',
  date_from: 'string|null',
  date_to: 'string|null',
  sender_id: 'string|null',
};

export const MessageSearchResultType = {
  messages: 'Message[]',
  total_count: 'number',
  has_more: 'boolean',
  next_cursor: 'string|null',
};

/**
 * Message Validation Types
 */
export const MessageValidationType = {
  valid: 'boolean',
  error: 'string|null',
  warnings: 'string[]',
};

/**
 * Message Send Types
 */
export const MessageSendType = {
  content: 'string',
  message_type: 'MessageTypeEnum',
  file: 'File|null',
  reply_to: 'string|null',
  room_id: 'string',
};

/**
 * Message Update Types
 */
export const MessageUpdateType = {
  id: 'string',
  content: 'string|null',
  status: 'MessageStatusEnum|null',
  is_read: 'boolean|null',
  reactions: 'object|null',
};

/**
 * Message Delete Types
 */
export const MessageDeleteType = {
  id: 'string',
  delete_for_everyone: 'boolean',
  reason: 'string|null',
};

/**
 * Message Formatting Types
 */
export const MessageFormattingType = {
  bold: 'boolean',
  italic: 'boolean',
  underline: 'boolean',
  strikethrough: 'boolean',
  monospace: 'boolean',
  mentions: 'string[]', // user IDs
  links: 'string[]',
  hashtags: 'string[]',
};

/**
 * Message Thread Types
 */
export const MessageThreadType = {
  parent_message: 'Message',
  replies: 'Message[]',
  reply_count: 'number',
  last_reply_at: 'string|null',
  participants: 'User[]',
};

/**
 * Bulk Message Operations
 */
export const BulkMessageOperationType = {
  action: 'string', // 'delete', 'mark_read', 'archive'
  message_ids: 'string[]',
  room_id: 'string',
  parameters: 'object',
};

/**
 * Message Export Types
 */
export const MessageExportType = {
  format: 'string', // 'json', 'txt', 'html'
  room_id: 'string',
  date_from: 'string|null',
  date_to: 'string|null',
  include_media: 'boolean',
  include_metadata: 'boolean',
};