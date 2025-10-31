
import { Alert } from 'react-native';
import { NOTIFICATION_TYPES, NOTIFICATION_ICONS } from '../notifications/utils/notificationTypes';

export const getNotificationIcon = (type) => {
  return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.DEFAULT;
};

export const handleNotificationAction = (notification, navigation) => {
  switch (notification.notification_type) {
    case NOTIFICATION_TYPES.MARKETPLACE:
      Alert.alert(
        'Marketplace Item',
        `View "${notification.data?.title || 'item'}" for $${notification.data?.price || 'N/A'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View', 
            onPress: () => {
              // Navigate to marketplace item
              if (navigation) {
                navigation.navigate('MarketplaceDetail', { itemId: notification.data?.id });
              }
            }
          }
        ]
      );
      break;
      
    case NOTIFICATION_TYPES.LOST_FOUND:
      Alert.alert(
        'Lost & Found Item',
        `View "${notification.title}" at ${notification.data?.location || 'unknown location'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View', 
            onPress: () => {
              if (navigation) {
                navigation.navigate('LostFoundDetail', { itemId: notification.data?.id });
              }
            }
          }
        ]
      );
      break;
      
    case NOTIFICATION_TYPES.CONNECTION_REQUEST:
      Alert.alert(
        'Connection Request',
        notification.message,
        [
          { text: 'Decline', style: 'destructive' },
          { 
            text: 'Accept', 
            onPress: () => {
              if (navigation) {
                navigation.navigate('Connections', { tab: 'requests' });
              }
            }
          }
        ]
      );
      break;
      
    case NOTIFICATION_TYPES.CONNECTION_ACCEPTED:
      Alert.alert('Connection Accepted', notification.message);
      if (navigation) {
        navigation.navigate('Connections');
      }
      break;
      
    case NOTIFICATION_TYPES.NEW_MESSAGE:
      Alert.alert(
        'New Message',
        'Open chat conversation?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Chat', 
            onPress: () => {
              if (navigation) {
                navigation.navigate('ChatRoom', { roomId: notification.data?.room_id });
              }
            }
          }
        ]
      );
      break;
      
    default:
      console.log('Unknown notification type:', notification.notification_type);
  }
};