

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  KeyboardAvoidingView, 
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Import components
import ChatHeader from '../components/chat-header';
import ChatRoom from '../components/chat-room';
import MessageInput from '../components/message-input';
// import UserDetailModal from '../../features/chat/user-details'; 
import UserDetailModal from '../../connections/user-details'; 


// Import hooks
import { useMessages } from '../hooks/useMessages';
import { useWebSocket } from '../hooks/useWebSocket';

const { width, height } = Dimensions.get('window');

const ChatScreen = () => {
  // Get params from expo-router
  const params = useLocalSearchParams();
  const roomId = params.roomId;
  const otherUser = params.otherUser ? JSON.parse(params.otherUser) : null;

  console.log('ChatScreen - Raw params:', params);
  console.log('ChatScreen - Parsed otherUser:', otherUser);
  console.log('ChatScreen - Room ID:', roomId);
  
  
  
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [messageCount, setMessageCount] = useState(0); 
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  
  // Hooks
  const {
    messages,
    loading,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    hasMoreMessages,
    error: messagesError
  } = useMessages(roomId);
  
  const { 
    isConnected, 
    sendWebSocketMessage, 
    connectionState,
    error: wsError 
  } = useWebSocket(roomId);

  // Handle connection status
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else if (wsError) {
      setConnectionStatus('error');
    } else {
      setConnectionStatus('connecting');
    }
  }, [isConnected, wsError]);

  // Mark messages as read when screen loads
  useEffect(() => {
    if (roomId) {
      markAsRead();
    }
  }, [roomId, markAsRead]);

  // Update message count
  useEffect(() => {
    setMessageCount(messages.length);
  }, [messages]);

  // Handle back navigation
  const handleGoBack = useCallback(() => {
    router.back('features/chat/chat-feature-screen');
  }, []);



  
  // const handleUserPress = useCallback((user) => {
  //   console.log('handleUserPress called with user:', user);
  //   console.log('handleUserPress - otherUser available:', otherUser);



    
  //   // Try to get user ID from multiple possible sources
  //   let userId = null;
    
  //   if (user?.id) {
  //     userId = user.id;
  //     console.log('Using user.id:', userId);
  //   } else if (user?.user_id) {
  //     userId = user.user_id;
  //     console.log('Using user.user_id:', userId);
  //   } else if (user?.pk) {
  //     userId = user.pk;
  //     console.log('Using user.pk:', userId);
  //   } else if (otherUser?.id) {
  //     userId = otherUser.id;
  //     console.log('Using otherUser.id:', userId);
  //   } else if (otherUser?.user_id) {
  //     userId = otherUser.user_id;
  //     console.log('Using otherUser.user_id:', userId);
  //   } else if (otherUser?.pk) {
  //     userId = otherUser.pk;
  //     console.log('Using otherUser.pk:', userId);
  //   }
    
  //   if (userId) {
  //     console.log('Final selectedUserId:', userId);
  //     setSelectedUserId(userId);
  //     setShowUserProfile(true);
  //   } else {
  //     console.log('No valid user ID found');
  //     console.log('Available user keys:', user ? Object.keys(user) : 'no user');
  //     console.log('Available otherUser keys:', otherUser ? Object.keys(otherUser) : 'no otherUser');
      
  //     Alert.alert(
  //       'Error', 
  //       'Unable to load user profile. User ID not found.',
  //       [{ text: 'OK' }]
  //     );
  //   }
  // }, [otherUser]);




  const handleUserPress = useCallback((user) => {
    console.log('handleUserPress called with user:', user);
    console.log('handleUserPress - otherUser available:', otherUser);

    // First, try to get user ID from the passed user parameter
    let userId = null;
    let userToShow = user;

    // If user parameter has an ID, use it
    if (user?.id) {
      userId = user.id;
      console.log('Using user.id:', userId);
    } else if (user?.user_id) {
      userId = user.user_id;
      console.log('Using user.user_id:', userId);
    } else if (user?.pk) {
      userId = user.pk;
      console.log('Using user.pk:', userId);
    } 
    // If no user passed or no ID found, fall back to otherUser
    else if (otherUser?.id) {
      userId = otherUser.id;
      userToShow = otherUser;
      console.log('Fallback to otherUser.id:', userId);
    } else if (otherUser?.user_id) {
      userId = otherUser.user_id;
      userToShow = otherUser;
      console.log('Fallback to otherUser.user_id:', userId);
    } else if (otherUser?.pk) {
      userId = otherUser.pk;
      userToShow = otherUser;
      console.log('Fallback to otherUser.pk:', userId);
    }
    
    console.log('Final selectedUserId:', userId);
    console.log('User object being used:', userToShow);
    
    if (userId) {
      setSelectedUserId(userId);
      setShowUserProfile(true);
    } else {
      console.log('No valid user ID found');
      console.log('Available user keys:', user ? Object.keys(user) : 'no user');
      console.log('Available otherUser keys:', otherUser ? Object.keys(otherUser) : 'no otherUser');
      
      Alert.alert(
        'Error', 
        'Unable to load user profile. User information is not available.',
        [{ text: 'OK' }]
      );
    }
  }, [otherUser]);

  // Also add this debugging useEffect to see what otherUser looks like:
  useEffect(() => {
    console.log('ChatScreen - otherUser updated:', otherUser);
    if (otherUser) {
      console.log('otherUser keys:', Object.keys(otherUser));
      console.log('otherUser.id:', otherUser.id);
      console.log('otherUser.user_id:', otherUser.user_id);
      console.log('otherUser.pk:', otherUser.pk);
    }
  }, [otherUser]);



  // Handle closing user profile modal
  const handleCloseUserProfile = useCallback(() => {
    console.log('Closing user profile modal');
    setShowUserProfile(false);
    setSelectedUserId(null);
  }, []);

  // Handle sending messages
  const handleSendMessage = async (content, type = 'text', file = null, replyTo = null) => {
    if (!content?.trim() && !file) return;

    try {
      setIsTyping(false);
      
      // Send via API
      const message = await sendMessage(content, type, file, replyTo);
      
      // Send via WebSocket for real-time delivery
      if (isConnected && message) {
        sendWebSocketMessage({
          type: 'new_message',
          message: message,
          roomId: roomId
        });
      }

      // Scroll to bottom after sending
      setShowScrollToBottom(false);

    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert(
        'Message Failed', 
        'Unable to send message. Please check your connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => handleSendMessage(content, type, file, replyTo) }
        ]
      );
    }
  };

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    setIsTyping(true);
    if (isConnected) {
      sendWebSocketMessage({
        type: 'typing_start',
        roomId: roomId
      });
    }
  }, [isConnected, roomId, sendWebSocketMessage]);

  const handleTypingStop = useCallback(() => {
    setIsTyping(false);
    if (isConnected) {
      sendWebSocketMessage({
        type: 'typing_stop',
        roomId: roomId
      });
    }
  }, [isConnected, roomId, sendWebSocketMessage]);

  // Handle scroll to bottom
  const handleScrollToBottom = useCallback(() => {
    setShowScrollToBottom(false);
    // This would trigger scroll to bottom in ChatRoom component
  }, []);

  // Handle load more messages
  const handleLoadMore = useCallback(async () => {
    if (hasMoreMessages && !loading) {
      await loadMoreMessages();
    }
  }, [hasMoreMessages, loading, loadMoreMessages]);

  // Show loading screen if no roomId
  if (!roomId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Invalid Chat</Text>
          <Text style={styles.errorText}>
            Unable to load chat room. Please try again.
          </Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={handleGoBack}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Connection status indicator
  const renderConnectionStatus = () => {
    const getStatusConfig = () => {
      switch (connectionStatus) {
        case 'connected':
          return { color: '#34C759', text: 'Connected', icon: 'checkmark-circle' };
        case 'error':
          return { color: '#FF3B30', text: 'Connection Error', icon: 'alert-circle' };
        default:
          return { color: '#FF9500', text: 'Connecting...', icon: 'time' };
      }
    };

    const { color, text, icon } = getStatusConfig();

    return (
      <View style={[styles.connectionStatus, { backgroundColor: color }]}>
        <Ionicons name={icon} size={12} color="#fff" />
        <Text style={styles.connectionText}>{text}</Text>
      </View>
    );
  };

  // Render scroll to bottom button
  const renderScrollToBottom = () => {
    if (!showScrollToBottom) return null;

    return (
      <TouchableOpacity 
        style={styles.scrollToBottomButton}
        onPress={handleScrollToBottom}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#007AFF', '#5856D6']}
          style={styles.scrollToBottomGradient}
        >
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Enhanced Chat Header */}
        <LinearGradient
          colors={['#007AFF', '#5856D6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContainer}>
            <ChatHeader 
              user={otherUser}
              isOnline={isConnected}
              onBackPress={handleGoBack}
              onUserPress={handleUserPress}  
              messageCount={messageCount}
              style={styles.customHeader}
            />
            {renderConnectionStatus()}
          </View>
        </LinearGradient>

        {/* Chat Messages Area */}
        <View style={styles.chatContainer}>
          {messagesError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="wifi-off" size={48} color="#8E8E93" />
              <Text style={styles.errorTitle}>Connection Issue</Text>
              <Text style={styles.errorText}>
                Unable to load messages. Please check your internet connection.
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => window.location.reload()}
              >
                <Ionicons name="refresh" size={20} color="#007AFF" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ChatRoom 
                messages={messages}
                loading={loading}
                onLoadMore={handleLoadMore}
                hasMoreMessages={hasMoreMessages}
                onScrollToBottomVisible={setShowScrollToBottom}
                isTyping={isTyping}
                otherUser={otherUser}
                style={styles.chatRoom}
              />
              {renderScrollToBottom()}
            </>
          )}
        </View>

        {/* Message Input Area */}
        <View style={styles.inputContainer}>
          <BlurView intensity={10} style={styles.inputBlur}>
            <MessageInput 
              onSend={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              disabled={!isConnected}
              placeholder={
                isConnected 
                  ? "Type a message..." 
                  : "Connecting..."
              }
              style={styles.messageInput}
            />
          </BlurView>
        </View>
      </KeyboardAvoidingView>

      {/* <UserDetailModal
        visible={showUserProfile}
        userId={selectedUserId}
        onClose={handleCloseUserProfile}
      /> */}

      {/* {showUserProfile && 
        selectedUserId && 
        (typeof selectedUserId === 'number' || 
          (typeof selectedUserId === 'string' && selectedUserId.trim().length > 0)) && (
          <UserDetailModal
            visible={showUserProfile}
            userId={selectedUserId}
            onClose={handleCloseUserProfile}
          />
      )} */}

      {/* Debug info - remove this after testing */}
      {/* {showUserProfile && !selectedUserId && (
        console.log('Modal not showing - no selectedUserId:', selectedUserId)
      )} */}



    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // Header Styles
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    position: 'relative',
  },
  customHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  connectionStatus: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 60 : 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  connectionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Chat Container
  chatContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  chatRoom: {
    flex: 1,
  },

  // Input Container
  inputContainer: {
    backgroundColor: 'transparent',
  },
  inputBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  messageInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Scroll to Bottom Button
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 25,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollToBottomGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F2F2F7',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  retryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
});

export default ChatScreen;


















































// import React, { useState, useEffect, useCallback } from 'react';
// import { 
//   View, 
//   KeyboardAvoidingView, 
//   Platform,
//   StyleSheet,
//   SafeAreaView,
//   StatusBar,
//   Alert,
//   ActivityIndicator,
//   Text,
//   TouchableOpacity,
//   Dimensions,
// } from 'react-native';
// import { useLocalSearchParams, router } from 'expo-router';
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';

// // Import components
// import ChatHeader from '../components/chat-header';
// import ChatRoom from '../components/chat-room';
// import MessageInput from '../components/message-input';

// // Import hooks
// import { useMessages } from '../hooks/useMessages';
// import { useWebSocket } from '../hooks/useWebSocket';
// import UserDetailModal from '@/app/connections/user-details';

// const { width, height } = Dimensions.get('window');

// const ChatScreen = () => {
//   // Get params from expo-router
//   const params = useLocalSearchParams();
//   const roomId = params.roomId;
//   const otherUser = params.otherUser ? JSON.parse(params.otherUser) : null;
  
//   // Local state
//   const [isTyping, setIsTyping] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState('connecting');
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false);
//   const [messageCount, setMessageCount] = useState(0);
//   const [showUserProfile, setShowUserProfile] = useState(false);
//   const [selectedUserId, setSelectedUserId] = useState(null);

//   // Hooks
//   const {
//     messages,
//     loading,
//     sendMessage,
//     loadMoreMessages,
//     markAsRead,
//     hasMoreMessages,
//     error: messagesError
//   } = useMessages(roomId);
  
//   const { 
//     isConnected, 
//     sendWebSocketMessage, 
//     connectionState,
//     error: wsError 
//   } = useWebSocket(roomId);

//   // Handle connection status
//   useEffect(() => {
//     if (isConnected) {
//       setConnectionStatus('connected');
//     } else if (wsError) {
//       setConnectionStatus('error');
//     } else {
//       setConnectionStatus('connecting');
//     }
//   }, [isConnected, wsError]);

//   // Mark messages as read when screen loads
//   useEffect(() => {
//     if (roomId) {
//       markAsRead();
//     }
//   }, [roomId, markAsRead]);

//   // Update message count
//   useEffect(() => {
//     setMessageCount(messages.length);
//   }, [messages]);

//   // Handle back navigation
//   const handleGoBack = useCallback(() => {
//     router.back('features/chat/chat-feature-screen');
//   }, []);

//   // Handle user profile navigation
//   // const handleUserPress = useCallback((user) => {
//   //   if (user?.id) {
//   //     // router.push(`auth/profile?userId=${user.id}`);
//   //     router.push(`/connections/user-details`);
//   //   }
//   // }, []);


//   const handleUserPress = useCallback((user) => {
//     console.log('User pressed:', user);
//     if (user?.id) {
//       setSelectedUserId(user.id);
//       setShowUserProfile(true);
//     }
//   }, []);

//   // Handle sending messages
//   const handleSendMessage = async (content, type = 'text', file = null, replyTo = null) => {
//     if (!content?.trim() && !file) return;

//     try {
//       setIsTyping(false);
      
//       // Send via API
//       const message = await sendMessage(content, type, file, replyTo);
      
//       // Send via WebSocket for real-time delivery
//       if (isConnected && message) {
//         sendWebSocketMessage({
//           type: 'new_message',
//           message: message,
//           roomId: roomId
//         });
//       }

//       // Scroll to bottom after sending
//       setShowScrollToBottom(false);

//     } catch (error) {
//       console.error('Send message error:', error);
//       Alert.alert(
//         'Message Failed', 
//         'Unable to send message. Please check your connection and try again.',
//         [
//           { text: 'Cancel', style: 'cancel' },
//           { text: 'Retry', onPress: () => handleSendMessage(content, type, file, replyTo) }
//         ]
//       );
//     }
//   };

//   // Handle typing indicators
//   const handleTypingStart = useCallback(() => {
//     setIsTyping(true);
//     if (isConnected) {
//       sendWebSocketMessage({
//         type: 'typing_start',
//         roomId: roomId
//       });
//     }
//   }, [isConnected, roomId, sendWebSocketMessage]);

//   const handleTypingStop = useCallback(() => {
//     setIsTyping(false);
//     if (isConnected) {
//       sendWebSocketMessage({
//         type: 'typing_stop',
//         roomId: roomId
//       });
//     }
//   }, [isConnected, roomId, sendWebSocketMessage]);

//   // Handle scroll to bottom
//   const handleScrollToBottom = useCallback(() => {
//     setShowScrollToBottom(false);
//     // This would trigger scroll to bottom in ChatRoom component
//   }, []);

//   // Handle load more messages
//   const handleLoadMore = useCallback(async () => {
//     if (hasMoreMessages && !loading) {
//       await loadMoreMessages();
//     }
//   }, [hasMoreMessages, loading, loadMoreMessages]);

//   // Show loading screen if no roomId
//   if (!roomId) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.errorContainer}>
//           <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
//           <Text style={styles.errorTitle}>Invalid Chat</Text>
//           <Text style={styles.errorText}>
//             Unable to load chat room. Please try again.
//           </Text>
//           <TouchableOpacity 
//             style={styles.errorButton}
//             onPress={handleGoBack}
//           >
//             <Text style={styles.errorButtonText}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // Connection status indicator
//   const renderConnectionStatus = () => {
//     const getStatusConfig = () => {
//       switch (connectionStatus) {
//         case 'connected':
//           return { color: '#34C759', text: 'Connected', icon: 'checkmark-circle' };
//         case 'error':
//           return { color: '#FF3B30', text: 'Connection Error', icon: 'alert-circle' };
//         default:
//           return { color: '#FF9500', text: 'Connecting...', icon: 'time' };
//       }
//     };

//     const { color, text, icon } = getStatusConfig();

//     return (
//       <View style={[styles.connectionStatus, { backgroundColor: color }]}>
//         <Ionicons name={icon} size={12} color="#fff" />
//         <Text style={styles.connectionText}>{text}</Text>
//       </View>
//     );
//   };

//   // Render scroll to bottom button
//   const renderScrollToBottom = () => {
//     if (!showScrollToBottom) return null;

//     return (
//       <TouchableOpacity 
//         style={styles.scrollToBottomButton}
//         onPress={handleScrollToBottom}
//         activeOpacity={0.8}
//       >
//         <LinearGradient
//           colors={['#007AFF', '#5856D6']}
//           style={styles.scrollToBottomGradient}
//         >
//           <Ionicons name="chevron-down" size={20} color="#fff" />
//         </LinearGradient>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
//       <KeyboardAvoidingView 
//         style={styles.container}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
//       >
//         {/* Enhanced Chat Header */}
//         <LinearGradient
//           colors={['#007AFF', '#5856D6']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 0 }}
//           style={styles.headerGradient}
//         >
//           <View style={styles.headerContainer}>
//             <ChatHeader 
//               user={otherUser}
//               isOnline={isConnected}
//               onBackPress={handleGoBack}
//               onUserPress={handleUserPress}
//               messageCount={messageCount}
//               style={styles.customHeader}
//             />
//             {renderConnectionStatus()}
//           </View>
//         </LinearGradient>

//         {/* Chat Messages Area */}
//         <View style={styles.chatContainer}>
//           {messagesError ? (
//             <View style={styles.errorContainer}>
//               <MaterialIcons name="wifi-off" size={48} color="#8E8E93" />
//               <Text style={styles.errorTitle}>Connection Issue</Text>
//               <Text style={styles.errorText}>
//                 Unable to load messages. Please check your internet connection.
//               </Text>
//               <TouchableOpacity 
//                 style={styles.retryButton}
//                 onPress={() => window.location.reload()}
//               >
//                 <Ionicons name="refresh" size={20} color="#007AFF" />
//                 <Text style={styles.retryButtonText}>Retry</Text>
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <>
//               <ChatRoom 
//                 messages={messages}
//                 loading={loading}
//                 onLoadMore={handleLoadMore}
//                 hasMoreMessages={hasMoreMessages}
//                 onScrollToBottomVisible={setShowScrollToBottom}
//                 isTyping={isTyping}
//                 otherUser={otherUser}
//                 style={styles.chatRoom}
//               />
//               {renderScrollToBottom()}
//             </>
//           )}
//         </View>

//         {/* Message Input Area */}
//         <View style={styles.inputContainer}>
//           <BlurView intensity={10} style={styles.inputBlur}>
//             <MessageInput 
//               onSend={handleSendMessage}
//               onTypingStart={handleTypingStart}
//               onTypingStop={handleTypingStop}
//               disabled={!isConnected}
//               placeholder={
//                 isConnected 
//                   ? "Type a message..." 
//                   : "Connecting..."
//               }
//               style={styles.messageInput}
//             />
//           </BlurView>
//         </View>
//       </KeyboardAvoidingView>

//       <UserDetailModal
//         visible={showUserProfile}
//         userId={selectedUserId}
//         onClose={() => {
//           setShowUserProfile(false);
//           setSelectedUserId(null);
//         }}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#007AFF',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#F2F2F7',
//   },

//   // Header Styles
//   headerGradient: {
//     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
//   },
//   headerContainer: {
//     position: 'relative',
//   },
//   customHeader: {
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//   },
//   connectionStatus: {
//     position: 'absolute',
//     top: Platform.OS === 'android' ? StatusBar.currentHeight + 60 : 60,
//     right: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   connectionText: {
//     color: '#fff',
//     fontSize: 11,
//     fontWeight: '600',
//     marginLeft: 4,
//   },

//   // Chat Container
//   chatContainer: {
//     flex: 1,
//     backgroundColor: '#F2F2F7',
//   },
//   chatRoom: {
//     flex: 1,
//   },

//   // Input Container
//   inputContainer: {
//     backgroundColor: 'transparent',
//   },
//   inputBlur: {
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(0, 0, 0, 0.1)',
//   },
//   messageInput: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },

//   // Scroll to Bottom Button
//   scrollToBottomButton: {
//     position: 'absolute',
//     bottom: 100,
//     right: 20,
//     borderRadius: 25,
//     shadowColor: '#007AFF',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   scrollToBottomGradient: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   // Error States
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     backgroundColor: '#F2F2F7',
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#1C1C1E',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#8E8E93',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },
//   errorButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 25,
//     shadowColor: '#007AFF',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   errorButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   retryButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F2F2F7',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#007AFF',
//   },
//   retryButtonText: {
//     color: '#007AFF',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },

//   // Loading States
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F2F2F7',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#8E8E93',
//   },
// });

// export default ChatScreen;

















































// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   KeyboardAvoidingView, 
//   Platform,
//   StyleSheet 
// } from 'react-native';
// import { useRoute } from '@react-navigation/native';
// import ChatHeader from '../components/chat-header';
// import ChatRoom from '../components/chat-room';
// import MessageInput from '../components/message-input';
// import { useMessages } from '../hooks/useMessages';
// import { useWebSocket } from '../hooks/useWebSocket';

// const ChatScreen = () => {
//   const route = useRoute();
//   const { roomId, otherUser } = route.params;
  
//   const {
//     messages,
//     loading,
//     sendMessage,
//     loadMoreMessages,
//     markAsRead
//   } = useMessages(roomId);
  
//   const { isConnected, sendWebSocketMessage } = useWebSocket(roomId);

//   useEffect(() => {
//     markAsRead();
//   }, []);

//   const handleSendMessage = async (content, type = 'text', file = null) => {
//     try {
//       // Send via API
//       const message = await sendMessage(content, type, file);
      
//       // Send via WebSocket for real-time delivery
//       if (isConnected) {
//         sendWebSocketMessage({
//           type: 'new_message',
//           message: message
//         });
//       }
//     } catch (error) {
//       console.error('Send message error:', error);
//       Alert.alert('Error', 'Failed to send message');
//     }
//   };

//   return (
//     <KeyboardAvoidingView 
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <ChatHeader user={otherUser} isOnline={isConnected} />
//       <ChatRoom 
//         messages={messages}
//         loading={loading}
//         onLoadMore={loadMoreMessages}
//       />
//       <MessageInput onSend={handleSendMessage} />
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
// });

// export default ChatScreen;