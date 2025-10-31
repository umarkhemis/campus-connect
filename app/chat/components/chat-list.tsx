

import React from 'react';
import { 
  FlatList, 
  TouchableOpacity, 
  View, 
  Text, 
  Image,
  StyleSheet,
  RefreshControl 
} from 'react-native';
import { formatChatTime, getLastMessagePreview } from '../utils/chatUtils';
import ConnectionAPI from '../../api/connectionService'; // Adjust the import path as needed






const ChatList = ({ chatRooms, onChatPress, onRefresh, refreshing }) => {
  const renderChatItem = ({ item }) => {
    const otherUser = item.other_user;
    const otherUserProfile = item.other_user_profile;
    const lastMessage = item.last_message;
    const unreadCount = item.unread_count;


    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => onChatPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              // uri: otherUserProfile?.profile_picture || 
              // uri: profilePicture || 
              uri: ConnectionAPI.getUserProfilePicture(otherUser) ||
                   'https://via.placeholder.com/50x50.png?text=' + 
                   (otherUser?.username?.[0] || 'U')
            }}
            style={styles.avatar}
          />
          {/* Online indicator - you can implement this based on your needs */}
          <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50' }]} />
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherUser?.username} 
              {/* {otherUser?.first_name} {otherUser?.last_name} */}
            </Text>
            <Text style={styles.timestamp}>
              {lastMessage ? formatChatTime(lastMessage.created_at) : ''}
            </Text>
          </View>

          <View style={styles.chatPreview}>
            <Text 
              style={[
                styles.lastMessage,
                unreadCount > 0 && styles.unreadMessage
              ]} 
              numberOfLines={1}
            >
              {getLastMessagePreview(lastMessage)}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No conversations yet</Text>
      <Text style={styles.emptySubText}>
        Start chatting with your connections!
      </Text>
    </View>
  );

  return (
    <FlatList
      data={chatRooms}
      renderItem={renderChatItem}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={EmptyComponent}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '500',
    color: '#000',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F2F2F7',
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
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  // chatHeader: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   marginBottom: 2,
  // },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  chatTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  chatUsername: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  // lastMessage: {
  //   fontSize: 15,
  //   color: '#666',
  // },
});

export default ChatList;