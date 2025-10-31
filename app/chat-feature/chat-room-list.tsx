

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { ChatRoomItem } from './chat-room-item';
import { useChatRooms } from '../hooks/useChatRooms';

const { width, height } = Dimensions.get('window');

export const ChatRoomList = ({ 
  onChatPress, 
  onSearchPress,
  onNewChatPress,
  searchQuery = '',
  onSearchChange 
}) => {
  const insets = useSafeAreaInsets();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const searchAnimation = new Animated.Value(0);

  const {
    chatRooms,
    loading,
    refreshing,
    error,
    refreshChatRooms,
    retryChatRooms
  } = useChatRooms();

  // Filter chat rooms based on search query
  const filteredChatRooms = useMemo(() => {
    if (!localSearchQuery.trim()) return chatRooms;
    
    return chatRooms.filter(room => {
      const userName = `${room.other_user?.first_name || ''} ${room.other_user?.last_name || ''}`.toLowerCase();
      const lastMessage = room.last_message?.content?.toLowerCase() || '';
      const query = localSearchQuery.toLowerCase();
      
      return userName.includes(query) || lastMessage.includes(query);
    });
  }, [chatRooms, localSearchQuery]);

  // Calculate total unread count
  const totalUnreadCount = useMemo(() => {
    return chatRooms.reduce((total, room) => total + (room.unread_count || 0), 0);
  }, [chatRooms]);

  const toggleSearch = useCallback(() => {
    const toValue = isSearchVisible ? 0 : 1;
    setIsSearchVisible(!isSearchVisible);
    
    Animated.timing(searchAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    if (isSearchVisible) {
      setLocalSearchQuery('');
      onSearchChange?.('');
    }
  }, [isSearchVisible, onSearchChange]);

  const handleSearchChange = useCallback((text) => {
    setLocalSearchQuery(text);
    onSearchChange?.(text);
  }, [onSearchChange]);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshChatRooms();
      Toast.show({
        type: 'success',
        text1: 'Refreshed',
        text2: 'Chat list updated successfully',
        position: 'bottom',
        visibilityTime: 2000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Unable to refresh chat list',
        position: 'bottom',
      });
    }
  }, [refreshChatRooms]);

  const handleRetry = useCallback(async () => {
    try {
      await retryChatRooms();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Retry Failed',
        text2: 'Please check your connection and try again',
        position: 'bottom',
      });
    }
  }, [retryChatRooms]);

  const handleChatPress = useCallback(async (chatId, otherUser) => {
    try {
      await onChatPress(chatId, otherUser);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to open chat. Please try again.',
        position: 'top',
      });
    }
  }, [onChatPress]);

  const handleNewChat = useCallback(() => {
    if (onNewChatPress) {
      onNewChatPress();
    } else {
      Toast.show({
        type: 'info',
        text1: 'Coming Soon',
        text2: 'New chat feature will be available soon',
        position: 'bottom',
      });
    }
  }, [onNewChatPress]);

  const renderChatRoom = useCallback(({ item, index }) => (
    <ChatRoomItem
      item={item}
      onPress={handleChatPress}
      style={[
        index === 0 && styles.firstItem,
        index === filteredChatRooms.length - 1 && styles.lastItem
      ]}
    />
  ), [handleChatPress, filteredChatRooms.length]);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Messages</Text>
          {totalUnreadCount > 0 && (
            <View style={styles.totalUnreadBadge}>
              <Text style={styles.totalUnreadText}>
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleSearch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isSearchVisible ? "close" : "search"} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerButton, styles.newChatButton]}
            onPress={handleNewChat}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Animated Search Bar */}
      <Animated.View style={[
        styles.searchContainer,
        {
          height: searchAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 50],
          }),
          opacity: searchAnimation,
          marginTop: searchAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 12],
          }),
        }
      ]}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor="#8E8E93"
            value={localSearchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {localSearchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearchChange('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );

  const renderEmptyState = () => {
    if (localSearchQuery.trim() && filteredChatRooms.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptySubtitle}>
            Try searching with different keywords
          </Text>
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => handleSearchChange('')}
          >
            <Text style={styles.clearSearchText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
        <Text style={styles.emptyTitle}>No Messages Yet</Text>
        <Text style={styles.emptySubtitle}>
          Start a conversation with someone to see your chats here
        </Text>
        <TouchableOpacity
          style={styles.newChatButtonLarge}
          onPress={handleNewChat}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.newChatButtonText}>Start New Chat</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="cloud-offline-outline" size={64} color="#FF3B30" />
      <Text style={styles.errorTitle}>Connection Error</Text>
      <Text style={styles.errorSubtitle}>
        {error || 'Unable to load your messages. Please check your connection.'}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleRetry}
      >
        <Ionicons name="refresh" size={20} color="#007AFF" />
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading your messages...</Text>
    </View>
  );

  // Main render logic
  if (loading && chatRooms.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderLoadingState()}
      </View>
    );
  }

  if (error && chatRooms.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      {renderHeader()}
      
      {filteredChatRooms.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredChatRooms}
          renderItem={renderChatRoom}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
              title="Pull to refresh"
              titleColor="#8E8E93"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          getItemLayout={(data, index) => ({
            length: 76,
            offset: 76 * index,
            index,
          })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={15}
        />
      )}
      
      {/* Floating Action Button for New Chat */}
      {!isSearchVisible && filteredChatRooms.length > 5 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={handleNewChat}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#F2F2F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000000',
  },
  totalUnreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalUnreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Search Styles
  searchContainer: {
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  
  // List Styles
  listContent: {
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 78, // Align with content after avatar
  },
  firstItem: {
    // Add any special styling for first item
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  newChatButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  clearSearchButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  clearSearchText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  retryText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Loading State Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  
  // Floating Action Button
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});





































// import React from 'react';
// import {
//   View,
//   FlatList,
//   Text,
//   ActivityIndicator,
//   RefreshControl
// } from 'react-native';
// import { ChatRoomItem } from './ChatRoomItem';
// import { useChatRooms } from '../hooks/useChatRooms';

// export const ChatRoomList = ({ onChatPress }) => {
//   const {
//     chatRooms,
//     loading,
//     refreshing,
//     error,
//     refreshChatRooms
//   } = useChatRooms();

//   const renderChatRoom = ({ item }) => (
//     <ChatRoomItem
//       item={item}
//       onPress={onChatPress}
//     />
//   );

//   if (loading && chatRooms.length === 0) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" />
//         <Text>Loading chats...</Text>
//       </View>
//     );
//   }

//   if (error && chatRooms.length === 0) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text>Error loading chats: {error}</Text>
//       </View>
//     );
//   }

//   if (chatRooms.length === 0) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text>No chats yet</Text>
//         <Text style={{ marginTop: 8, color: '#666' }}>
//           Start a conversation with someone!
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       data={chatRooms}
//       renderItem={renderChatRoom}
//       keyExtractor={(item) => item.id?.toString()}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={refreshChatRooms}
//         />
//       }
//       showsVerticalScrollIndicator={false}
//     />
//   );
// };