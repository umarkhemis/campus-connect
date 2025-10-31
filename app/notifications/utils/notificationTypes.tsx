
export const NOTIFICATION_TYPES = {
  MARKETPLACE: 'marketplace',
  LOST_FOUND: 'lost_found',
  CONNECTION_REQUEST: 'connection_request',
  CONNECTION_ACCEPTED: 'connection_accepted',
  NEW_MESSAGE: 'new_message',
};

export const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.MARKETPLACE]: { name: 'storefront-outline', color: '#10b981' },
  [NOTIFICATION_TYPES.LOST_FOUND]: { name: 'search-outline', color: '#f59e0b' },
  [NOTIFICATION_TYPES.CONNECTION_REQUEST]: { name: 'people-outline', color: '#3b82f6' },
  [NOTIFICATION_TYPES.CONNECTION_ACCEPTED]: { name: 'people-outline', color: '#3b82f6' },
  [NOTIFICATION_TYPES.NEW_MESSAGE]: { name: 'chatbubble-outline', color: '#8b5cf6' },
  DEFAULT: { name: 'notifications-outline', color: '#6b7280' },
};