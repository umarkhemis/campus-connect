
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { MessageBubble } from './message-bubble';
import { MessageInput } from './message-input';
import { useChat } from '../hooks/useChat';

const { width, height } = Dimensions.get('window');

export const ChatRoom = ({ roomId, otherUser, currentUserId }) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const flatListRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    messages,
    messagesLoading,
    messagesError,
    hasNextPage,
    loadingMore,
    sendMessage,
    loadMoreMessages,
    deleteMessage,
    isTyping,
    otherUserTyping,
    handleTypingStart,
    handleTypingStop,
    sending,
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempt
  } = useChat(roomId, otherUser, true);

  // Animation effects
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Enhanced error handling with toast
  const showToast = (type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: headerHeight + (Platform.OS === 'ios' ? 0 : StatusBar.currentHeight),
    });
  };

  const handleSendMessage = async (content, messageType = 'text', file = null) => {
    try {
      await sendMessage(content, messageType, file);
      showToast('success', 'Message Sent', 'Your message was delivered successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('error', 'Send Failed', 'Failed to send message. Please try again.');
    }
  };

  const handleDeleteMessage = async (message) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => showToast('info', 'Cancelled', 'Message deletion cancelled')
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(message.id);
              showToast('success', 'Deleted', 'Message deleted successfully');
            } catch (error) {
              showToast('error', 'Delete Failed', 'Failed to delete message. Please try again.');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const handleLoadMore = () => {
    if (hasNextPage && !loadingMore) {
      try {
        loadMoreMessages();
      } catch (error) {
        showToast('error', 'Load Failed', 'Failed to load more messages');
      }
    }
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldShow = offsetY > 200;
    setShowScrollToBottom(shouldShow);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setShowScrollToBottom(false);
  };

  const handleBackPress = () => {
    router.push('/auth/dashboard');
  };

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.sender?.id === currentUserId;
    const previousMessage = messages[index - 1];
    const showAvatar = !isCurrentUser && 
      (!previousMessage || previousMessage.sender?.id !== item.sender?.id);

    return (
      <MessageBubble
        message={item}
        isCurrentUser={isCurrentUser}
        showAvatar={showAvatar}
        onLongPress={isCurrentUser ? () => handleDeleteMessage(item) : undefined}
        onPress={() => {}}
      />
    );
  };

  const renderHeader = () => {
    if (!loadingMore || !hasNextPage) return null;
    
    return (
      <View style={styles.loadingHeader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading more messages...</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!otherUserTyping) return null;
    
    return (
      <Animated.View style={[styles.typingIndicator, { opacity: fadeAnim }]}>
        <View style={styles.typingDots}>
          <View style={[styles.dot, styles.dotAnimation]} />
          <View style={[styles.dot, styles.dotAnimation]} />
          <View style={[styles.dot, styles.dotAnimation]} />
        </View>
        <Text style={styles.typingText}>
          {otherUser?.username || 'User'} is typing...
        </Text>
      </Animated.View>
    );
  };

  const renderConnectionStatus = () => {
    if (connectionError) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={24} color="#FF3B30" />
          <Text style={styles.errorText}>
            Connection lost. Reconnecting... (Attempt {reconnectAttempt})
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => window.location.reload()} // Add proper retry logic
          >
            <Feather name="refresh-cw" size={16} color="#007AFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isConnecting || !isConnected) {
      return (
        <View style={styles.connectionStatus}>
          <ActivityIndicator size="small" color="#FF9500" />
          <Text style={styles.connectionText}>
            {isConnecting ? 'Connecting...' : 'Reconnecting...'}
          </Text>
        </View>
      );
    }

    return null;
  };

  if (messagesLoading && messages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingMainText}>Loading your conversation...</Text>
          <Text style={styles.loadingSubText}>Please wait a moment</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (messagesError && messages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorMainContainer}>
          <MaterialIcons name="chat-bubble-outline" size={64} color="#8E8E93" />
          <Text style={styles.errorMainText}>Unable to load messages</Text>
          <Text style={styles.errorMainSubText}>{messagesError}</Text>
          <TouchableOpacity 
            style={styles.retryMainButton}
            onPress={handleLoadMore}
          >
            <Feather name="refresh-cw" size={18} color="#FFFFFF" />
            <Text style={styles.retryMainText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View 
        style={styles.header}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {(otherUser?.username || 'U').charAt(0).toUpperCase()}
              </Text>
              {isConnected && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName} numberOfLines={1}>
                {otherUser?.username || 'Unknown User'}
              </Text>
              <Text style={styles.userStatus}>
                {isConnected ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
          <Feather name="more-vertical" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      {renderConnectionStatus()}

      {/* Messages List */}
      <Animated.View style={[styles.messagesContainer, { opacity: fadeAnim }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id?.toString()}
          inverted
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleLoadMore}
              tintColor="#007AFF"
              colors={["#007AFF"]}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
        />

        {/* Scroll to Bottom Button */}
        {showScrollToBottom && (
          <Animated.View style={styles.scrollToBottomContainer}>
            <TouchableOpacity
              style={styles.scrollToBottomButton}
              onPress={scrollToBottom}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          sending={sending}
          disabled={!isConnected}
        />
      </View>

      {/* Toast Message Component */}
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 1000,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarText: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 40,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 22,
  },
  userStatus: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  connectionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8D7DA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#721C24',
    fontWeight: '500',
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  retryText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    position: 'relative',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8E8E93',
    marginHorizontal: 2,
  },
  dotAnimation: {
    // Add animation logic here
  },
  typingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  scrollToBottomContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 100,
  },
  scrollToBottomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingMainText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  errorMainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
  },
  errorMainText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 24,
    textAlign: 'center',
  },
  errorMainSubText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 32,
  },
  retryMainText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});










































// import React from 'react';
// import {
//   View,
//   FlatList,
//   Text,
//   ActivityIndicator,
//   RefreshControl,
//   Alert
// } from 'react-native';
// import { MessageBubble } from './MessageBubble';
// import { MessageInput } from './MessageInput';
// import { useChat } from '../hooks/useChat';

// export const ChatRoom = ({ roomId, otherUser, currentUserId }) => {
//   const {
//     messages,
//     messagesLoading,
//     messagesError,
//     hasNextPage,
//     loadingMore,
//     sendMessage,
//     loadMoreMessages,
//     deleteMessage,
//     isTyping,
//     otherUserTyping,
//     handleTypingStart,
//     handleTypingStop,
//     sending,
//     isConnected,
//     isConnecting,
//     connectionError,
//     reconnectAttempt
//   } = useChat(roomId, otherUser, true);

//   const handleSendMessage = async (content, messageType = 'text', file = null) => {
//     try {
//       await sendMessage(content, messageType, file);
//     } catch (error) {
//       console.error('Error sending message:', error);
//     }
//   };

//   const handleDeleteMessage = async (message) => {
//     Alert.alert(
//       'Delete Message',
//       'Are you sure you want to delete this message?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Delete', 
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await deleteMessage(message.id);
//             } catch (error) {
//               Alert.alert('Error', 'Failed to delete message');
//             }
//           }
//         }
//       ]
//     );
//   };

//   const handleLoadMore = () => {
//     if (hasNextPage && !loadingMore) {
//       loadMoreMessages();
//     }
//   };

//   const renderMessage = ({ item, index }) => {
//     const isCurrentUser = item.sender?.id === currentUserId;
//     const previousMessage = messages[index - 1];
//     const showAvatar = !isCurrentUser && 
//       (!previousMessage || previousMessage.sender?.id !== item.sender?.id);

//     return (
//       <MessageBubble
//         message={item}
//         isCurrentUser={isCurrentUser}
//         showAvatar={showAvatar}
//         onLongPress={isCurrentUser ? handleDeleteMessage : undefined}
//         onPress={() => {}}
//       />
//     );
//   };

//   const renderHeader = () => {
//     if (!loadingMore || !hasNextPage) return null;
    
//     return (
//       <View style={{ padding: 16, alignItems: 'center' }}>
//         <ActivityIndicator size="small" />
//       </View>
//     );
//   };

//   const renderFooter = () => {
//     if (!otherUserTyping) return null;
    
//     return (
//       <View style={{ padding: 8 }}>
//         <Text style={{ fontStyle: 'italic', color: '#666' }}>
//           {otherUser?.username || 'User'} is typing...
//         </Text>
//       </View>
//     );
//   };

//   if (messagesLoading && messages.length === 0) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" />
//         <Text>Loading messages...</Text>
//       </View>
//     );
//   }

//   if (messagesError && messages.length === 0) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text>Error loading messages: {messagesError}</Text>
//       </View>
//     );
//   }

//   if (connectionError) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text>Connection error. Attempting to reconnect... ({reconnectAttempt})</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       {/* Connection Status */}
//       {(isConnecting || !isConnected) && (
//         <View style={{ padding: 8, backgroundColor: '#f0f0f0', alignItems: 'center' }}>
//           <Text style={{ fontSize: 12, color: '#666' }}>
//             {isConnecting ? 'Connecting...' : 'Offline'}
//           </Text>
//         </View>
//       )}

//       {/* Messages List */}
//       <FlatList
//         data={messages}
//         renderItem={renderMessage}
//         keyExtractor={(item) => item.id?.toString()}
//         inverted
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.1}
//         ListHeaderComponent={renderHeader}
//         ListFooterComponent={renderFooter}
//         refreshControl={
//           <RefreshControl
//             refreshing={false}
//             onRefresh={handleLoadMore}
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       />

//       {/* Message Input */}
//       <MessageInput
//         onSendMessage={handleSendMessage}
//         onTypingStart={handleTypingStart}
//         onTypingStop={handleTypingStop}
//         sending={sending}
//         disabled={!isConnected}
//       />
//     </View>
//   );
// };