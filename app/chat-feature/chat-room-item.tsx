

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { formatChatRoomTime } from '../utils/timeUtils';

const { width } = Dimensions.get('window');

export const ChatRoomItem = ({ item, onPress, onLongPress }) => {
  const [imageError, setImageError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = async () => {
    try {
      setIsPressed(true);
      
      if (!item?.id || !item?.other_user) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Unable to open chat. Missing user information.',
          position: 'top',
        });
        return;
      }

      await onPress(item.id, item.other_user);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open chat. Please try again.',
        position: 'top',
      });
    } finally {
      setTimeout(() => setIsPressed(false), 150);
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(item);
    } else {
      // Default long press actions
      Alert.alert(
        'Chat Options',
        `Options for ${getDisplayName()}`,
        [
          { text: 'Mark as Read', onPress: () => handleMarkAsRead() },
          { text: 'Delete Chat', onPress: () => handleDeleteChat(), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleMarkAsRead = () => {
    Toast.show({
      type: 'success',
      text1: 'Marked as Read',
      text2: 'Chat has been marked as read',
      position: 'bottom',
    });
  };

  const handleDeleteChat = () => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Toast.show({
              type: 'success',
              text1: 'Chat Deleted',
              text2: 'Chat has been removed',
              position: 'bottom',
            });
          },
        },
      ]
    );
  };

  const getDisplayName = () => {
    const firstName = item.other_user?.first_name || '';
    const lastName = item.other_user?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'Unknown User';
  };

  const getInitials = () => {
    const firstName = item.other_user?.first_name || '';
    const lastName = item.other_user?.last_name || '';
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return firstInitial + lastInitial || 'U';
  };

  const getLastMessagePreview = () => {
    if (!item.last_message?.content) return 'No messages yet';
    
    const content = item.last_message.content;
    const maxLength = 35;
    
    if (content.length > maxLength) {
      return content.substring(0, maxLength) + '...';
    }
    
    return content;
  };

  const isOnline = item.other_user?.is_online || false;
  const hasUnreadMessages = item.unread_count > 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isPressed && styles.pressed,
        hasUnreadMessages && styles.unreadContainer
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      {/* Profile Picture Section */}
      <View style={styles.avatarContainer}>
        {item.other_user_profile?.profile_picture && !imageError ? (
          <Image
            source={{ uri: item.other_user_profile.profile_picture }}
            style={styles.avatar}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
        )}
        
        {/* Online Status Indicator */}
        {isOnline && <View style={styles.onlineIndicator} />}
        
        {/* Unread Count Badge */}
        {hasUnreadMessages && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unread_count > 99 ? '99+' : item.unread_count}
            </Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.userName, hasUnreadMessages && styles.unreadUserName]} numberOfLines={1}>
            {getDisplayName()}
          </Text>
          {item.last_message && (
            <Text style={styles.timestamp}>
              {formatChatRoomTime(item.last_message.created_at)}
            </Text>
          )}
        </View>

        <View style={styles.messageRow}>
          <Text
            style={[styles.lastMessage, hasUnreadMessages && styles.unreadMessage]}
            numberOfLines={1}
          >
            {getLastMessagePreview()}
          </Text>
          
          {/* Message Status Icons */}
          <View style={styles.statusContainer}>
            {item.last_message?.is_delivered && (
              <Ionicons
                name="checkmark-done"
                size={14}
                color={item.last_message?.is_read ? '#4CAF50' : '#9E9E9E'}
                style={styles.statusIcon}
              />
            )}
            {hasUnreadMessages && (
              <View style={styles.unreadDot} />
            )}
          </View>
        </View>
      </View>

      {/* Chevron Arrow */}
      <View style={styles.chevronContainer}>
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#C7C7CC"
        />
      </View>
    </TouchableOpacity>
  );
};

// Header Component for Chat List Screen
export const ChatListHeader = ({ title = "Messages", unreadCount = 0 }) => {
  const navigateBack = () => {
    try {
      router.push('/auth/dashboard');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Navigation Error',
        text2: 'Unable to navigate back to dashboard',
        position: 'top',
      });
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={navigateBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>
      
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>{title}</Text>
        {unreadCount > 0 && (
          <View style={styles.headerUnreadBadge}>
            <Text style={styles.headerUnreadText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity style={styles.headerAction}>
        <Ionicons name="create-outline" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Chat Room Item Styles
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
    minHeight: 70,
  },
  pressed: {
    backgroundColor: '#F2F2F7',
  },
  unreadContainer: {
    backgroundColor: '#F8F9FF',
  },
  
  // Avatar Styles
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E5EA',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Content Styles
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  unreadUserName: {
    fontWeight: '600',
    color: '#000000',
  },
  timestamp: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 15,
    color: '#8E8E93',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: '#000000',
    fontWeight: '500',
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  
  // Chevron Styles
  chevronContainer: {
    marginLeft: 8,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    ...Platform.select({
      ios: {
        paddingTop: 44 + 12, // Account for status bar
      },
      android: {
        paddingTop: 12,
        elevation: 4,
      },
    }),
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  headerUnreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUnreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerAction: {
    padding: 8,
    marginRight: -8,
  },
});












































// import React from 'react';
// import { View, Text, TouchableOpacity, Image } from 'react-native';
// import { formatChatRoomTime } from '../utils/timeUtils';

// export const ChatRoomItem = ({ item, onPress }) => {
//   const handlePress = () => {
//     onPress(item.id, item.other_user);
//   };

//   return (
//     <TouchableOpacity onPress={handlePress}>
//       <View>
//         {item.other_user_profile?.profile_picture ? (
//           <Image
//             source={{ uri: item.other_user_profile.profile_picture }}
//           />
//         ) : (
//           <View>
//             <Text>
//               {item.other_user?.first_name?.[0]?.toUpperCase() || 'U'}
//             </Text>
//           </View>
//         )}
//         {item.unread_count > 0 && (
//           <View>
//             <Text>
//               {item.unread_count > 99 ? '99+' : item.unread_count}
//             </Text>
//           </View>
//         )}
//       </View>
      
//       <View>
//         <View>
//           <Text>
//             {`${item.other_user?.first_name || ''} ${item.other_user?.last_name || ''}`.trim()}
//           </Text>
//           {item.last_message && (
//             <Text>
//               {formatTime(item.last_message.created_at)}
//             </Text>
//           )}
//         </View>
        
//         <View>
//           <Text 
//             numberOfLines={1}
//           >
//             {item.last_message?.content || 'No messages yet'}
//           </Text>
//           {item.unread_count > 0 && <View />}
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };































// import React from 'react';
// import { View, Text, TouchableOpacity, Image } from 'react-native';
// // import { chatStyles } from '../../styles/chatStyles';
// import { formatTime } from '../utils/dateUtils';

// export const ChatRoomItem = ({ item, onPress }) => {
//   const handlePress = () => {
//     onPress(item.id, item.other_user);
//   };

//   return (
//     <TouchableOpacity style={chatStyles.chatRoomItem} onPress={handlePress}>
//       <View style={chatStyles.avatarContainer}>
//         {item.other_user_profile?.profile_picture ? (
//           <Image
//             source={{ uri: item.other_user_profile.profile_picture }}
//             style={chatStyles.avatar}
//           />
//         ) : (
//           <View style={[chatStyles.avatar, chatStyles.defaultAvatar]}>
//             <Text style={chatStyles.avatarText}>
//               {item.other_user?.first_name?.[0]?.toUpperCase() || 'U'}
//             </Text>
//           </View>
//         )}
//         {item.unread_count > 0 && (
//           <View style={chatStyles.unreadBadge}>
//             <Text style={chatStyles.unreadCount}>
//               {item.unread_count > 99 ? '99+' : item.unread_count}
//             </Text>
//           </View>
//         )}
//       </View>
      
//       <View style={chatStyles.chatInfo}>
//         <View style={chatStyles.chatHeader}>
//           <Text style={chatStyles.userName}>
//             {`${item.other_user?.first_name || ''} ${item.other_user?.last_name || ''}`.trim()}
//           </Text>
//           {item.last_message && (
//             <Text style={chatStyles.timestamp}>
//               {formatTime(item.last_message.created_at)}
//             </Text>
//           )}
//         </View>
        
//         <View style={chatStyles.lastMessageContainer}>
//           <Text 
//             style={[
//               chatStyles.lastMessage,
//               item.unread_count > 0 && chatStyles.unreadMessage
//             ]}
//             numberOfLines={1}
//           >
//             {item.last_message?.content || 'No messages yet'}
//           </Text>
//           {item.unread_count > 0 && <View style={chatStyles.unreadIndicator} />}
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };





























// // components/chat/ChatRoomsList.js
// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   FlatList,
//   Alert,
//   ActivityIndicator,
//   RefreshControl,
//   StatusBar,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import ConnectionAPI from '../api/connectionService';
// import ChatRoomItem from './ChatRoomItem';
// // import styles from '../../styles/ChatStyles';

// const ChatRoomsList = ({ navigation }) => {
//   const [chatRooms, setChatRooms] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   const loadChatRooms = async () => {
//     try {
//       const rooms = await ConnectionAPI.getChatRooms();
//       setChatRooms(rooms);
//     } catch (error) {
//       console.error('Failed to load chat rooms:', error);
//       Alert.alert('Error', 'Failed to load chat rooms. Please try again.');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     loadChatRooms();
//   }, []);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     loadChatRooms();
//   }, []);

//   const handleChatRoomPress = (item) => {
//     navigation.navigate('ChatMessages', { 
//       roomId: item.id,
//       otherUser: item.other_user 
//     });
//   };

//   const renderChatRoom = ({ item }) => (
//     <ChatRoomItem
//       item={item}
//       onPress={() => handleChatRoomPress(item)}
//     />
//   );

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading chats...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Messages</Text>
//         <TouchableOpacity style={styles.headerButton}>
//           <Icon name="search" size={24} color="#007AFF" />
//         </TouchableOpacity>
//       </View>
      
//       <FlatList
//         data={chatRooms}
//         renderItem={renderChatRoom}
//         keyExtractor={(item) => item.id.toString()}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Icon name="chat-bubble-outline" size={64} color="#C7C7CC" />
//             <Text style={styles.emptyText}>No conversations yet</Text>
//             <Text style={styles.emptySubtext}>
//               Start chatting with your connections
//             </Text>
//           </View>
//         }
//       />
//     </View>
//   );
// };

// export default ChatRoomsList;