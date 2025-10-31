


import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Import your existing chat components
import ChatList from '../../chat/components/chat-list';
import ChatRoom from '../../chat/components/chat-room';
import ChatHeader from '../../chat/components/chat-header';
import MessageInput from '../../chat/components/message-input';

// Import hooks
import { useChat } from '../../chat/hooks/useChat';
import { useMessages } from '../../chat/hooks/useMessages';
import { useWebSocket } from '../../chat/hooks/useWebSocket';

// Import utilities
import ConnectionAPI from '../../api/connectionService';

const { width, height } = Dimensions.get('window');

const ChatFeatureScreen = () => {
  // Main state management
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'chat'
  const [selectedChat, setSelectedChat] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConnections, setFilteredConnections] = useState([]);

  // Chat list functionality
  const { chatRooms, loading: chatsLoading, refreshChatRooms } = useChat();
  
  // Individual chat functionality (only when a chat is selected)
  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    addNewMessage
  } = useMessages(selectedChat?.id);

  // WebSocket connection (only when in chat view)
  const { isConnected, sendWebSocketMessage } = useWebSocket(selectedChat?.id);

  // Load user connections for new chat
  useEffect(() => {
    loadConnections();
  }, []);

  // Filter connections based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = connections.filter(item => {
        const user = item.connected_user || item.user;
        const fullName = `${user?.first_name} ${user?.last_name}`.toLowerCase();
        const username = user?.username?.toLowerCase() || '';
        return fullName.includes(searchQuery.toLowerCase()) || 
               username.includes(searchQuery.toLowerCase());
      });
      setFilteredConnections(filtered);
    } else {
      setFilteredConnections(connections);
    }
  }, [searchQuery, connections]);

  const loadConnections = async () => {
    try {
      const connectionsData = await ConnectionAPI.getMyConnections();
      setConnections(connectionsData);
      setFilteredConnections(connectionsData);
    } catch (error) {
      console.error('Load connections error:', error);
    }
  };

  // Handle chat selection from list
  const handleChatPress = (chatRoom) => {
    setSelectedChat(chatRoom);
    setCurrentView('chat');
  };

  // Handle back from individual chat to list
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedChat(null);
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    router.push('auth/dashboard');
  };

  // Handle starting new chat
  const handleNewChat = async (userId) => {
    try {
      const chatRoom = await ConnectionAPI.getOrCreateChatRoom(userId);
      setSelectedChat(chatRoom);
      setCurrentView('chat');
      setShowNewChatModal(false);
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create chat room');
      console.error('Create chat room error:', error);
    }
  };

  // Handle sending messages
  const handleSendMessage = async (content, type = 'text', file = null) => {
    try {
      const message = await sendMessage(content, type, file);
      
      // Send via WebSocket for real-time delivery
      if (isConnected) {
        sendWebSocketMessage({
          type: 'new_message',
          message: message
        });
      }

      // Refresh chat list to update last message
      refreshChatRooms();
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Mark messages as read when entering chat
  useEffect(() => {
    if (selectedChat && currentView === 'chat') {
      markAsRead();
    }
  }, [selectedChat, currentView]);

  // Render search bar
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search connections..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  // Render connection item with improved design
  const renderConnectionItem = ({ item }) => {
    const user = item.connected_user || item.user;
    
    return (
      <TouchableOpacity 
        style={styles.connectionItem}
        onPress={() => handleNewChat(user?.id)}
        activeOpacity={0.7}
      >
        <View style={styles.connectionLeft}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: user?.profile_picture || 'https://via.placeholder.com/50x50.png'
              }}
              style={styles.connectionAvatar}
            />
            <View style={[styles.onlineIndicator, { backgroundColor: '#34C759' }]} />
          </View>
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionName}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={styles.connectionUsername}>
              @{user?.username}
            </Text>
          </View>
        </View>
        <View style={styles.connectionActions}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push(`auth/profile?userId=${user?.id}`)}
          >
            <Ionicons name="person-outline" size={16} color="#007AFF" />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </View>
      </TouchableOpacity>
    );
  };

  // Render chat list view
  const renderChatListView = () => (
    <View style={styles.container}>
      {/* Custom Header */}
      <LinearGradient
        colors={['#007AFF', '#5856D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToDashboard}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Messages</Text>
              <Text style={styles.headerSubtitle}>
                {chatRooms.length} conversation{chatRooms.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={refreshChatRooms}
            >
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowNewChatModal(true)}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Chat List */}
      <View style={styles.chatListContainer}>
        {chatsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : chatRooms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubText}>
              Start a conversation with your connections
            </Text>
            <TouchableOpacity 
              style={styles.startChatButton}
              onPress={() => setShowNewChatModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.startChatButtonText}>Start Chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ChatList 
            chatRooms={chatRooms}
            onChatPress={handleChatPress}
            onRefresh={refreshChatRooms}
            refreshing={chatsLoading}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowNewChatModal(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#007AFF', '#5856D6']}
          style={styles.fabGradient}
        >
          <Ionicons name="create" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render individual chat view
  const renderChatView = () => (
    <View style={styles.container}>
      <ChatHeader 
        user={selectedChat?.other_user}
        isOnline={isConnected}
        onBackPress={handleBackToList}
        onUserPress={(user) => {
          router.push(`auth/profile?userId=${user.id}`);
        }}
      />
      
      <ChatRoom 
        messages={messages}
        loading={messagesLoading}
        onLoadMore={loadMoreMessages}
      />
      
      <MessageInput onSend={handleSendMessage} />
    </View>
  );

  // Render new chat modal
  const renderNewChatModal = () => (
    <Modal
      visible={showNewChatModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Header */}
        <LinearGradient
          colors={['#007AFF', '#5856D6']}
          style={styles.modalHeaderGradient}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <TouchableOpacity 
                onPress={() => {
                  setShowNewChatModal(false);
                  setSearchQuery('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Chat</Text>
            </View>
            <TouchableOpacity
              style={styles.connectionsButton}
              onPress={() => {
                setShowNewChatModal(false);
                router.push('connections/connection-screen');
              }}
            >
              <Ionicons name="people" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.modalContent}>
          {/* Search Bar */}
          {renderSearchBar()}

          {/* Connections List */}
          <Text style={styles.sectionTitle}>
            Your Connections ({filteredConnections.length})
          </Text>
          
          {connections.length === 0 ? (
            <View style={styles.emptyModalContainer}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="people-outline" size={64} color="#C7C7CC" />
              </View>
              <Text style={styles.emptyModalTitle}>No connections yet</Text>
              <Text style={styles.emptyModalText}>
                Connect with other students to start chatting
              </Text>
              <TouchableOpacity 
                style={styles.findConnectionsButton}
                onPress={() => {
                  setShowNewChatModal(false);
                  router.push('connections/connection-screen');
                }}
              >
                <LinearGradient
                  colors={['#007AFF', '#5856D6']}
                  style={styles.findConnectionsGradient}
                >
                  <Ionicons name="search" size={20} color="#fff" />
                  <Text style={styles.findConnectionsText}>Find Connections</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : filteredConnections.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={48} color="#C7C7CC" />
              <Text style={styles.noResultsText}>No results found</Text>
              <Text style={styles.noResultsSubText}>Try a different search term</Text>
            </View>
          ) : (
            <FlatList
              data={filteredConnections}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderConnectionItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.connectionsList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      {currentView === 'list' ? renderChatListView() : renderChatView()}
      {renderNewChatModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
  },
  
  // Header Styles
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Chat List Styles
  chatListContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  startChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    borderRadius: 28,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeaderGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCloseButton: {
    marginRight: 16,
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  connectionsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Search Styles
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },

  // Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },

  // Connection Item Styles
  connectionsList: {
    paddingBottom: 20,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  connectionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E5EA',
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
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  connectionUsername: {
    fontSize: 14,
    color: '#8E8E93',
  },
  connectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  separator: {
    height: 12,
  },

  // Empty Modal Styles
  emptyModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyModalText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  findConnectionsButton: {
    borderRadius: 25,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  findConnectionsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  findConnectionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // No Results Styles
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default ChatFeatureScreen;
















































// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity,
//   Modal,
//   Alert,
//   SafeAreaView,
//   StatusBar,
//     FlatList,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// // Import your existing chat components
// import ChatList from '../../chat/components/chat-list';
// import ChatRoom from '../../chat/components/chat-room';
// import ChatHeader from '../../chat/components/chat-header';
// import MessageInput from '../../chat/components/message-input';

// // Import hooks
// import { useChat } from '../../chat/hooks/useChat';
// import { useMessages } from '../../chat/hooks/useMessages';
// import { useWebSocket } from '../../chat/hooks/useWebSocket';

// // Import utilities
// import ConnectionAPI from '../../api/connectionService';

// const ChatFeatureScreen = ({ navigation }) => {
//   // Main state management
//   const [currentView, setCurrentView] = useState('list'); // 'list' or 'chat'
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [showNewChatModal, setShowNewChatModal] = useState(false);
//   const [connections, setConnections] = useState([]);

//   // Chat list functionality
//   const { chatRooms, loading: chatsLoading, refreshChatRooms } = useChat();
  
//   // Individual chat functionality (only when a chat is selected)
//   const {
//     messages,
//     loading: messagesLoading,
//     sendMessage,
//     loadMoreMessages,
//     markAsRead,
//     addNewMessage
//   } = useMessages(selectedChat?.id);

//   // WebSocket connection (only when in chat view)
//   const { isConnected, sendWebSocketMessage } = useWebSocket(selectedChat?.id);

//   // Load user connections for new chat
//   useEffect(() => {
//     loadConnections();
//   }, []);

//   const loadConnections = async () => {
//     try {
//       const connectionsData = await ConnectionAPI.getMyConnections();
//       setConnections(connectionsData);
//     } catch (error) {
//       console.error('Load connections error:', error);
//     }
//   };

//   // Handle chat selection from list
//   const handleChatPress = (chatRoom) => {
//     setSelectedChat(chatRoom);
//     setCurrentView('chat');
//   };

//   // Handle back from individual chat to list
//   const handleBackToList = () => {
//     setCurrentView('list');
//     setSelectedChat(null);
//   };

//   // Handle starting new chat
//   const handleNewChat = async (userId) => {
//     try {
//       const chatRoom = await ConnectionAPI.getOrCreateChatRoom(userId);
//       setSelectedChat(chatRoom);
//       setCurrentView('chat');
//       setShowNewChatModal(false);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to create chat room');
//       console.error('Create chat room error:', error);
//     }
//   };

//   // Handle sending messages
//   const handleSendMessage = async (content, type = 'text', file = null) => {
//     try {
//       const message = await sendMessage(content, type, file);
      
//       // Send via WebSocket for real-time delivery
//       if (isConnected) {
//         sendWebSocketMessage({
//           type: 'new_message',
//           message: message
//         });
//       }

//       // Refresh chat list to update last message
//       refreshChatRooms();
//     } catch (error) {
//       console.error('Send message error:', error);
//       Alert.alert('Error', 'Failed to send message');
//     }
//   };

//   // Mark messages as read when entering chat
//   useEffect(() => {
//     if (selectedChat && currentView === 'chat') {
//       markAsRead();
//     }
//   }, [selectedChat, currentView]);

//   // Render chat list view
//   const renderChatListView = () => (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Messages</Text>
//         <View style={styles.headerActions}>
//           <TouchableOpacity 
//             style={styles.headerButton}
//             onPress={() => setShowNewChatModal(true)}
//           >
//             <Ionicons name="create-outline" size={24} color="#007AFF" />
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.headerButton}
//             onPress={refreshChatRooms}
//           >
//             <Ionicons name="refresh-outline" size={24} color="#007AFF" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ChatList 
//         chatRooms={chatRooms}
//         onChatPress={handleChatPress}
//         onRefresh={refreshChatRooms}
//         refreshing={chatsLoading}
//       />

//       {/* Floating Action Button for new chat */}
//       <TouchableOpacity 
//         style={styles.fab}
//         onPress={() => setShowNewChatModal(true)}
//       >
//         <Ionicons name="chatbubble" size={24} color="#fff" />
//       </TouchableOpacity>
//     </View>
//   );

//   // Render individual chat view
//   const renderChatView = () => (
//     <View style={styles.container}>
//       <ChatHeader 
//         user={selectedChat?.other_user}
//         isOnline={isConnected}
//         onBackPress={handleBackToList}
//         onUserPress={(user) => {
//           // Navigate to user profile or show user details
//           navigation.navigate('UserProfile', { userId: user.id });
//         }}
//       />
      
//       <ChatRoom 
//         messages={messages}
//         loading={messagesLoading}
//         onLoadMore={loadMoreMessages}
//       />
      
//       <MessageInput onSend={handleSendMessage} />
//     </View>
//   );

//   // Render new chat modal
//   const renderNewChatModal = () => (
//     <Modal
//       visible={showNewChatModal}
//       animationType="slide"
//       presentationStyle="pageSheet"
//     >
//       <SafeAreaView style={styles.modalContainer}>
//         <View style={styles.modalHeader}>
//           <Text style={styles.modalTitle}>New Chat</Text>
//           <TouchableOpacity 
//             onPress={() => setShowNewChatModal(false)}
//             style={styles.modalCloseButton}
//           >
//             <Ionicons name="close" size={24} color="#007AFF" />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.modalContent}>
//           <Text style={styles.sectionTitle}>Your Connections</Text>
//           {connections.length === 0 ? (
//             <View style={styles.emptyContainer}>
//               <Text style={styles.emptyText}>No connections yet</Text>
//               <Text style={styles.emptySubText}>
//                 Connect with other students to start chatting
//               </Text>
//               <TouchableOpacity 
//                 style={styles.findConnectionsButton}
//                 onPress={() => {
//                   setShowNewChatModal(false);
//                   navigation.navigate('Connections');
//                 }}
//               >
//                 <Text style={styles.findConnectionsText}>Find Connections</Text>
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <FlatList
//               data={connections}
//               keyExtractor={(item) => item.id.toString()}
//               renderItem={({ item }) => (
//                 <TouchableOpacity 
//                   style={styles.connectionItem}
//                   onPress={() => handleNewChat(item.connected_user?.id || item.user?.id)}
//                 >
//                   <Image
//                     source={{
//                       uri: item.connected_user?.profile_picture || 
//                            item.user?.profile_picture ||
//                            'https://via.placeholder.com/40x40.png'
//                     }}
//                     style={styles.connectionAvatar}
//                   />
//                   <View style={styles.connectionInfo}>
//                     <Text style={styles.connectionName}>
//                       {item.connected_user?.first_name || item.user?.first_name} {' '}
//                       {item.connected_user?.last_name || item.user?.last_name}
//                     </Text>
//                     <Text style={styles.connectionUsername}>
//                       @{item.connected_user?.username || item.user?.username}
//                     </Text>
//                   </View>
//                   <Ionicons name="chevron-forward" size={20} color="#ccc" />
//                 </TouchableOpacity>
//               )}
//               showsVerticalScrollIndicator={false}
//             />
//           )}
//         </View>
//       </SafeAreaView>
//     </Modal>
//   );

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
//       {currentView === 'list' ? renderChatListView() : renderChatView()}
//       {renderNewChatModal()}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#000',
//   },
//   headerActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   headerButton: {
//     padding: 8,
//     marginLeft: 8,
//   },
//   fab: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#000',
//   },
//   modalCloseButton: {
//     padding: 4,
//   },
//   modalContent: {
//     flex: 1,
//     paddingHorizontal: 20,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginTop: 20,
//     marginBottom: 15,
//   },
//   connectionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     marginBottom: 8,
//     elevation: 1,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   connectionAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#f0f0f0',
//   },
//   connectionInfo: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   connectionName: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#000',
//   },
//   connectionUsername: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 2,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#666',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubText: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//     marginBottom: 24,
//     lineHeight: 20,
//   },
//   findConnectionsButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   findConnectionsText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default ChatFeatureScreen;