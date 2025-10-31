

// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { 
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   StyleSheet, 
//   RefreshControl,
//   Alert,
//   SafeAreaView,
//   StatusBar,
//   TextInput,
//   Image,
//   ActivityIndicator,
//   Dimensions,
//   Platform,
//   Animated,
//   Modal,
// } from 'react-native';
// import { router } from 'expo-router';
// import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';

// // Import components and hooks
// import ConnectionAPI from '../../api/connectionService';
// import { useChat } from '../hooks/useChat';
// import { useMessages } from '../hooks/useMessages';
// import { useWebSocket } from '../hooks/useWebSocket';
// import ChatList from '../components/chat-list';
// import ChatRoom from '../components/chat-room';
// import ChatHeader from '../components/chat-header';
// import MessageInput from '../components/message-input';

// const { width, height } = Dimensions.get('window');

// const ChatListScreen = () => {
//   // Main state management
//   const [currentView, setCurrentView] = useState('list'); // 'list' or 'chat'
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filteredChats, setFilteredChats] = useState([]);
//   const [showSearch, setShowSearch] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState('all'); // all, unread, recent
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [showNewChatModal, setShowNewChatModal] = useState(false);
//   const [connections, setConnections] = useState([]);
//   const [filteredConnections, setFilteredConnections] = useState([]);
  
//   // Animation values
//   const searchAnimation = useState(new Animated.Value(0))[0];
//   const fadeAnim = useState(new Animated.Value(1))[0];

//   // Chat hooks
//   const { chatRooms, loading, refreshChatRooms, error } = useChat();
  
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

//   // Filter options
//   const filterOptions = [
//     { key: 'all', label: 'All', icon: 'chatbubbles' },
//     { key: 'unread', label: 'Unread', icon: 'notifications' },
//     { key: 'recent', label: 'Recent', icon: 'time' },
//   ];

//   // Load user connections for new chat
//   useEffect(() => {
//     loadConnections();
//   }, []);

//   // Filter connections based on search query
//   useEffect(() => {
//     if (searchQuery.trim()) {
//       const filtered = connections.filter(item => {
//         const user = item.connected_user || item.user;
//         const fullName = `${user?.first_name} ${user?.last_name}`.toLowerCase();
//         const username = user?.username?.toLowerCase() || '';
//         return fullName.includes(searchQuery.toLowerCase()) || 
//                username.includes(searchQuery.toLowerCase());
//       });
//       setFilteredConnections(filtered);
//     } else {
//       setFilteredConnections(connections);
//     }
//   }, [searchQuery, connections]);

//   const loadConnections = async () => {
//     try {
//       const connectionsData = await ConnectionAPI.getMyConnections();
//       setConnections(connectionsData);
//       setFilteredConnections(connectionsData);
//     } catch (error) {
//       console.error('Load connections error:', error);
//     }
//   };

//   // Filter and search chats
//   const processedChats = useMemo(() => {
//     let filtered = [...chatRooms];

//     // Apply filter
//     switch (selectedFilter) {
//       case 'unread':
//         filtered = filtered.filter(chat => chat.unread_count > 0);
//         break;
//       case 'recent':
//         filtered = filtered.filter(chat => {
//           const lastMessageTime = new Date(chat.last_message?.created_at);
//           const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//           return lastMessageTime > dayAgo;
//         });
//         break;
//       default:
//         break;
//     }

//     // Apply search (only when not in new chat modal)
//     if (searchQuery.trim() && !showNewChatModal) {
//       filtered = filtered.filter(chat => {
//         const otherUser = chat.other_user;
//         const fullName = `${otherUser?.first_name} ${otherUser?.last_name}`.toLowerCase();
//         const username = otherUser?.username?.toLowerCase() || '';
//         const lastMessage = chat.last_message?.content?.toLowerCase() || '';
        
//         return fullName.includes(searchQuery.toLowerCase()) || 
//                username.includes(searchQuery.toLowerCase()) ||
//                lastMessage.includes(searchQuery.toLowerCase());
//       });
//     }

//     return filtered;
//   }, [chatRooms, selectedFilter, searchQuery, showNewChatModal]);

//   // Calculate unread count
//   useEffect(() => {
//     const count = chatRooms.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
//     setUnreadCount(count);
//   }, [chatRooms]);

//   // Update filtered chats
//   useEffect(() => {
//     setFilteredChats(processedChats);
//   }, [processedChats]);

//   // Handle chat selection from list
//   const handleChatPress = useCallback((chatRoom) => {
//     setSelectedChat(chatRoom);
//     setCurrentView('chat');
//   }, []);

//   // Handle back from individual chat to list
//   const handleBackToList = useCallback(() => {
//     setCurrentView('list');
//     setSelectedChat(null);
//   }, []);

//   // Handle starting new chat
//   const handleNewChat = async (userId) => {
//     try {
//       const chatRoom = await ConnectionAPI.getOrCreateChatRoom(userId);
//       setSelectedChat(chatRoom);
//       setCurrentView('chat');
//       setShowNewChatModal(false);
//       setSearchQuery('');
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

//   // Handle refresh
//   const handleRefresh = useCallback(async () => {
//     setIsRefreshing(true);
//     try {
//       await refreshChatRooms();
//     } catch (error) {
//       Alert.alert('Error', 'Failed to refresh chats');
//     } finally {
//       setIsRefreshing(false);
//     }
//   }, [refreshChatRooms]);

//   // Toggle search
//   const toggleSearch = useCallback(() => {
//     const toValue = showSearch ? 0 : 1;
//     setShowSearch(!showSearch);
    
//     Animated.timing(searchAnimation, {
//       toValue,
//       duration: 300,
//       useNativeDriver: false,
//     }).start();
    
//     if (showSearch) {
//       setSearchQuery('');
//     }
//   }, [showSearch, searchAnimation]);

//   // Handle filter selection
//   const handleFilterSelect = useCallback((filter) => {
//     setSelectedFilter(filter);
    
//     // Haptic feedback simulation
//     if (Platform.OS === 'ios') {
//       // Would use Haptics.impactAsync() in real app
//     }
//   }, []);

//   // Navigate to new chat modal
//   const handleNewChatModal = useCallback(() => {
//     setShowNewChatModal(true);
//   }, []);

//   // Navigate back to dashboard
//   const handleBackToDashboard = useCallback(() => {
//     router.push('auth/dashboard');
//   }, []);

//   // Navigate to chat settings
//   const handleChatSettings = useCallback(() => {
//     router.push('chat/chat-settings');
//   }, []);

//   // Render search bar
//   const renderSearchBar = () => (
//     <Animated.View style={[
//       styles.searchContainer,
//       {
//         height: searchAnimation.interpolate({
//           inputRange: [0, 1],
//           outputRange: [0, 60],
//         }),
//         opacity: searchAnimation,
//       }
//     ]}>
//       <View style={styles.searchBar}>
//         <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search conversations..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           placeholderTextColor="#8E8E93"
//           autoFocus={showSearch}
//         />
//         {searchQuery ? (
//           <TouchableOpacity onPress={() => setSearchQuery('')}>
//             <Ionicons name="close-circle" size={20} color="#8E8E93" />
//           </TouchableOpacity>
//         ) : null}
//       </View>
//     </Animated.View>
//   );

//   // Render modal search bar
//   const renderModalSearchBar = () => (
//     <View style={styles.searchContainer}>
//       <View style={styles.searchBar}>
//         <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search connections..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           placeholderTextColor="#8E8E93"
//         />
//         {searchQuery ? (
//           <TouchableOpacity onPress={() => setSearchQuery('')}>
//             <Ionicons name="close-circle" size={20} color="#8E8E93" />
//           </TouchableOpacity>
//         ) : null}
//       </View>
//     </View>
//   );

//   // Render connection item with improved design
//   const renderConnectionItem = ({ item }) => {
//     const user = item.connected_user || item.user;
    
//     return (
//       <TouchableOpacity 
//         style={styles.connectionItem}
//         onPress={() => handleNewChat(user?.id)}
//         activeOpacity={0.7}
//       >
//         <View style={styles.connectionLeft}>
//           <View style={styles.avatarContainer}>
//             <Image
//               source={{
//                 uri: user?.profile_picture || 'https://via.placeholder.com/50x50.png'
//               }}
//               style={styles.connectionAvatar}
//             />
//             <View style={[styles.onlineIndicator, { backgroundColor: '#34C759' }]} />
//           </View>
//           <View style={styles.connectionInfo}>
//             <Text style={styles.connectionName}>
//               {user?.first_name} {user?.last_name}
//             </Text>
//             <Text style={styles.connectionUsername}>
//               @{user?.username}
//             </Text>
//           </View>
//         </View>
//         <View style={styles.connectionActions}>
//           <TouchableOpacity
//             style={styles.profileButton}
//             onPress={() => router.push(`auth/profile?userId=${user?.id}`)}
//           >
//             <Ionicons name="person-outline" size={16} color="#007AFF" />
//           </TouchableOpacity>
//           <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   // Render filter tabs
//   const renderFilterTabs = () => (
//     <View style={styles.filterContainer}>
//       {filterOptions.map((option) => {
//         const isSelected = selectedFilter === option.key;
//         const count = option.key === 'unread' ? unreadCount : 
//                      option.key === 'recent' ? processedChats.filter(chat => {
//                        const lastMessageTime = new Date(chat.last_message?.created_at);
//                        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//                        return lastMessageTime > dayAgo;
//                      }).length : chatRooms.length;
        
//         return (
//           <TouchableOpacity
//             key={option.key}
//             style={[
//               styles.filterTab,
//               isSelected && styles.filterTabSelected
//             ]}
//             onPress={() => handleFilterSelect(option.key)}
//             activeOpacity={0.7}
//           >
//             {isSelected ? (
//               <LinearGradient
//                 colors={['#007AFF', '#5856D6']}
//                 style={styles.filterTabGradient}
//               >
//                 <Ionicons name={option.icon} size={16} color="#fff" />
//                 <Text style={styles.filterTabTextSelected}>{option.label}</Text>
//                 {count > 0 && (
//                   <View style={styles.filterTabBadge}>
//                     <Text style={styles.filterTabBadgeText}>{count > 99 ? '99+' : count}</Text>
//                   </View>
//                 )}
//               </LinearGradient>
//             ) : (
//               <>
//                 <Ionicons name={option.icon} size={16} color="#8E8E93" />
//                 <Text style={styles.filterTabText}>{option.label}</Text>
//                 {count > 0 && option.key === 'unread' && (
//                   <View style={styles.filterTabBadgeInactive}>
//                     <Text style={styles.filterTabBadgeTextInactive}>{count > 99 ? '99+' : count}</Text>
//                   </View>
//                 )}
//               </>
//             )}
//           </TouchableOpacity>
//         );
//       })}
//     </View>
//   );

//   // Render header for list view
//   const renderListHeader = () => (
//     <LinearGradient
//       colors={['#007AFF', '#5856D6']}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 0 }}
//       style={styles.headerGradient}
//     >
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <TouchableOpacity 
//             style={styles.backButton}
//             onPress={handleBackToDashboard}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="arrow-back" size={24} color="#fff" />
//           </TouchableOpacity>
//           <View>
//             <Text style={styles.headerTitle}>Messages</Text>
//             <Text style={styles.headerSubtitle}>
//               {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}
//               {unreadCount > 0 && ` • ${unreadCount} unread`}
//             </Text>
//           </View>
//         </View>
//         <View style={styles.headerActions}>
//           <TouchableOpacity 
//             style={styles.headerButton}
//             onPress={handleRefresh}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="refresh" size={22} color="#fff" />
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.headerButton}
//             onPress={toggleSearch}
//             activeOpacity={0.7}
//           >
//             <Ionicons name={showSearch ? "close" : "search"} size={22} color="#fff" />
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.headerButton}
//             onPress={handleNewChatModal}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="add" size={24} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </LinearGradient>
//   );

//   // Render empty state
//   const renderEmptyState = () => {
//     const getEmptyStateConfig = () => {
//       switch (selectedFilter) {
//         case 'unread':
//           return {
//             icon: 'checkmark-done-circle',
//             title: 'All caught up!',
//             subtitle: 'No unread messages',
//             color: '#34C759'
//           };
//         case 'recent':
//           return {
//             icon: 'time',
//             title: 'No recent chats',
//             subtitle: 'No conversations in the last 24 hours',
//             color: '#FF9500'
//           };
//         default:
//           return {
//             icon: 'chatbubbles-outline',
//             title: 'No conversations yet',
//             subtitle: 'Start chatting with your connections',
//             color: '#8E8E93'
//           };
//       }
//     };

//     const { icon, title, subtitle, color } = getEmptyStateConfig();

//     return (
//       <View style={styles.emptyContainer}>
//         <View style={[styles.emptyIconContainer, { backgroundColor: `${color}20` }]}>
//           <Ionicons name={icon} size={64} color={color} />
//         </View>
//         <Text style={styles.emptyTitle}>{title}</Text>
//         <Text style={styles.emptySubtitle}>{subtitle}</Text>
//         {selectedFilter === 'all' && (
//           <TouchableOpacity 
//             style={styles.startChattingButton}
//             onPress={handleNewChatModal}
//             activeOpacity={0.8}
//           >
//             <LinearGradient
//               colors={['#007AFF', '#5856D6']}
//               style={styles.startChattingGradient}
//             >
//               <Ionicons name="add" size={20} color="#fff" />
//               <Text style={styles.startChattingText}>Start Chatting</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         )}
//       </View>
//     );
//   };

//   // Render error state
//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <MaterialIcons name="wifi-off" size={64} color="#FF3B30" />
//       <Text style={styles.errorTitle}>Connection Problem</Text>
//       <Text style={styles.errorSubtitle}>
//         Unable to load your conversations. Check your internet connection and try again.
//       </Text>
//       <TouchableOpacity 
//         style={styles.retryButton}
//         onPress={handleRefresh}
//         activeOpacity={0.8}
//       >
//         <Ionicons name="refresh" size={20} color="#007AFF" />
//         <Text style={styles.retryButtonText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   // Render loading state
//   const renderLoadingState = () => (
//     <View style={styles.loadingContainer}>
//       <ActivityIndicator size="large" color="#007AFF" />
//       <Text style={styles.loadingText}>Loading conversations...</Text>
//     </View>
//   );

//   // Render chat list view
//   const renderChatListView = () => (
//     <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
//       {renderListHeader()}
//       {renderSearchBar()}
//       {renderFilterTabs()}
      
//       <View style={styles.contentContainer}>
//         {error ? renderErrorState() :
//          loading && chatRooms.length === 0 ? renderLoadingState() :
//          filteredChats.length === 0 ? renderEmptyState() : (
//           <ChatList 
//             chatRooms={filteredChats}
//             onChatPress={handleChatPress}
//             onRefresh={handleRefresh}
//             refreshing={isRefreshing}
//             style={styles.chatList}
//             showsVerticalScrollIndicator={false}
//           />
//         )}
//       </View>
      
//       {/* Floating Action Button */}
//       <TouchableOpacity 
//         style={styles.fab}
//         onPress={handleNewChatModal}
//         activeOpacity={0.8}
//       >
//         <LinearGradient
//           colors={['#007AFF', '#5856D6']}
//           style={styles.fabGradient}
//         >
//           <Ionicons name="create" size={24} color="#fff" />
//         </LinearGradient>
//       </TouchableOpacity>
//     </Animated.View>
//   );

//   // Render individual chat view
//   const renderChatView = () => (
//     <View style={styles.container}>
//       <ChatHeader 
//         user={selectedChat?.other_user}
//         isOnline={isConnected}
//         onBackPress={handleBackToList}
//         onUserPress={(user) => {
//           router.push(`auth/profile?userId=${user.id}`);
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
//         {/* Modal Header */}
//         <LinearGradient
//           colors={['#007AFF', '#5856D6']}
//           style={styles.modalHeaderGradient}
//         >
//           <View style={styles.modalHeader}>
//             <View style={styles.modalHeaderLeft}>
//               <TouchableOpacity 
//                 onPress={() => {
//                   setShowNewChatModal(false);
//                   setSearchQuery('');
//                 }}
//                 style={styles.modalCloseButton}
//               >
//                 <Ionicons name="close" size={24} color="#fff" />
//               </TouchableOpacity>
//               <Text style={styles.modalTitle}>New Chat</Text>
//             </View>
//             <TouchableOpacity
//               style={styles.connectionsButton}
//               onPress={() => {
//                 setShowNewChatModal(false);
//                 router.push('connections/connection-screen');
//               }}
//             >
//               <Ionicons name="people" size={20} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </LinearGradient>

//         <View style={styles.modalContent}>
//           {/* Search Bar */}
//           {renderModalSearchBar()}

//           {/* Connections List */}
//           <Text style={styles.sectionTitle}>
//             Your Connections ({filteredConnections.length})
//           </Text>
          
//           {connections.length === 0 ? (
//             <View style={styles.emptyModalContainer}>
//               <View style={styles.emptyIconContainer}>
//                 <MaterialIcons name="people-outline" size={64} color="#C7C7CC" />
//               </View>
//               <Text style={styles.emptyModalTitle}>No connections yet</Text>
//               <Text style={styles.emptyModalText}>
//                 Connect with other students to start chatting
//               </Text>
//               <TouchableOpacity 
//                 style={styles.findConnectionsButton}
//                 onPress={() => {
//                   setShowNewChatModal(false);
//                   router.push('connections/connection-screen');
//                 }}
//               >
//                 <LinearGradient
//                   colors={['#007AFF', '#5856D6']}
//                   style={styles.findConnectionsGradient}
//                 >
//                   <Ionicons name="search" size={20} color="#fff" />
//                   <Text style={styles.findConnectionsText}>Find Connections</Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             </View>
//           ) : filteredConnections.length === 0 ? (
//             <View style={styles.noResultsContainer}>
//               <Ionicons name="search" size={48} color="#C7C7CC" />
//               <Text style={styles.noResultsText}>No results found</Text>
//               <Text style={styles.noResultsSubText}>Try a different search term</Text>
//             </View>
//           ) : (
//             <FlatList
//               data={filteredConnections}
//               keyExtractor={(item) => item.id.toString()}
//               renderItem={renderConnectionItem}
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={styles.connectionsList}
//               ItemSeparatorComponent={() => <View style={styles.separator} />}
//             />
//           )}
//         </View>
//       </SafeAreaView>
//     </Modal>
//   );

//   // Main render
//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
//       {currentView === 'list' ? renderChatListView() : renderChatView()}
//       {renderNewChatModal()}
//     </SafeAreaView>
//   );
// };































import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, } from 'expo-router';
import ConnectionAPI from '../../api/connectionService';
import { useChat } from '../hooks/useChat';
import { useMessages } from '../hooks/useMessages';
import { useWebSocket } from '../hooks/useWebSocket';
import ChatList from '../components/chat-list';
import ChatRoom from '../components/chat-room';
import ChatHeader from '../components/chat-header';
import MessageInput from '../components/message-input';


const { width, height } = Dimensions.get('window');

const ChatListScreen = () => {
  // Main state management
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'chat'
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, unread, recent
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Animation values
  const searchAnimation = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Chat hooks
  const { chatRooms, loading, refreshChatRooms, error } = useChat();
  
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

  // Filter options
  const filterOptions = [
    { key: 'all', label: 'All', icon: 'chatbubbles' },
    { key: 'unread', label: 'Unread', icon: 'notifications' },
    { key: 'recent', label: 'Recent', icon: 'time' },
  ];

  const params = useLocalSearchParams();

  // Check if we should start a chat (from route params)
  // useEffect(() => {
  //   // Listen for route params when returning from connections screen
  //   const checkForNewChat = () => {
  //     const params = router.params;
  //     if (params?.startChatWithUserId) {
  //       handleNewChat(params.startChatWithUserId);
  //       // Clear the param to avoid re-triggering
  //       router.setParams({ startChatWithUserId: null });
  //     }
  //   };

  //   checkForNewChat();
  // }, []);



  useEffect(() => {
    const checkForNewChat = async () => {
      const params = router.params;
      if (params?.startChatWithUserId) {
        try {
          console.log('Starting chat with user ID:', params.startChatWithUserId);
          
          // Get or create chat room
          const chatRoom = await ConnectionAPI.getOrCreateChatRoom(params.startChatWithUserId);
          console.log('Chat room from startChatWithUserId:', chatRoom);
          
          // If chatRoom has other_user data, use it directly
          if (chatRoom.other_user) {
            setSelectedChat(chatRoom);
            setCurrentView('chat');
          } else {
            
            try {
              const userDetails = await ConnectionAPI.getUserById(params.startChatWithUserId);
              const enhancedChatRoom = {
                ...chatRoom,
                other_user: userDetails
              };
              setSelectedChat(enhancedChatRoom);
              setCurrentView('chat');
            } catch (userError) {
              console.error('Error fetching user details:', userError);
              Alert.alert('Error', 'Failed to load user information for chat.');
              return;
            }
          }
          
          // Clear the param to avoid re-triggering
          router.setParams({ startChatWithUserId: null });
          
          // Refresh chat rooms to update the list
          await refreshChatRooms();
          
        } catch (error) {
          console.error('Error starting chat from connection:', error);
          Alert.alert('Error', 'Failed to start chat. Please try again.');
        }
      }
    };

    checkForNewChat();
  }, [router.params]);








  // Filter and search chats
  const processedChats = useMemo(() => {
    let filtered = [...chatRooms];

    // Apply filter
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(chat => chat.unread_count > 0);
        break;
      case 'recent':
        filtered = filtered.filter(chat => {
          const lastMessageTime = new Date(chat.last_message?.created_at);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return lastMessageTime > dayAgo;
        });
        break;
      default:
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(chat => {
        const otherUser = chat.other_user;
        const fullName = `${otherUser?.first_name} ${otherUser?.last_name}`.toLowerCase();
        const username = otherUser?.username?.toLowerCase() || '';
        const lastMessage = chat.last_message?.content?.toLowerCase() || '';
        
        return fullName.includes(searchQuery.toLowerCase()) || 
               username.includes(searchQuery.toLowerCase()) ||
               lastMessage.includes(searchQuery.toLowerCase());
      });
    }

    return filtered;
  }, [chatRooms, selectedFilter, searchQuery]);

  // Calculate unread count
  useEffect(() => {
    const count = chatRooms.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
    setUnreadCount(count);
  }, [chatRooms]);

  // Update filtered chats
  useEffect(() => {
    setFilteredChats(processedChats);
  }, [processedChats]);

  // Handle chat selection from list
  const handleChatPress = useCallback((chatRoom) => {
    setSelectedChat(chatRoom);
    setCurrentView('chat');
  }, []);

  // Handle back from individual chat to list
  const handleBackToList = useCallback(() => {
    setCurrentView('list');
    setSelectedChat(null);
  }, []);

  // Handle starting new chat (this now navigates to connections screen)
  const handleNewChatNavigation = useCallback(() => {
    // Navigate to connections screen for chat selection
    router.push({
      pathname: '/connections/connection-screen',
      params: { selectForChat: 'true' }
    });
  }, []);

  // Handle creating chat room with selected user
  const handleNewChat = async (userId) => {
    try {
      console.log('Creating chat room with user ID:', userId);
      const chatRoom = await ConnectionAPI.getOrCreateChatRoom(userId);
      console.log('Chat room created/found:', chatRoom);
      
      setSelectedChat(chatRoom);
      setCurrentView('chat');
      
      // Refresh chat rooms to update the list
      await refreshChatRooms();
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

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshChatRooms();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh chats');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshChatRooms]);

  // Toggle search
  const toggleSearch = useCallback(() => {
    const toValue = showSearch ? 0 : 1;
    setShowSearch(!showSearch);
    
    Animated.timing(searchAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    if (showSearch) {
      setSearchQuery('');
    }
  }, [showSearch, searchAnimation]);

  // Handle filter selection
  const handleFilterSelect = useCallback((filter) => {
    setSelectedFilter(filter);
    
    // Haptic feedback simulation
    if (Platform.OS === 'ios') {
      // Would use Haptics.impactAsync() in real app
    }
  }, []);

  // Navigate back to dashboard
  const handleBackToDashboard = useCallback(() => {
    router.push('auth/dashboard');
  }, []);

  // Navigate to chat settings
  const handleChatSettings = useCallback(() => {
    router.push('chat/chat-settings');
  }, []);





  // Render search bar
  const renderSearchBar = () => (
    <Animated.View style={[
      styles.searchContainer,
      {
        height: searchAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 60],
        }),
        opacity: searchAnimation,
      }
    ]}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
          autoFocus={showSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );

  // Render filter tabs
  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {filterOptions.map((option) => {
        const isSelected = selectedFilter === option.key;
        const count = option.key === 'unread' ? unreadCount : 
                     option.key === 'recent' ? processedChats.filter(chat => {
                       const lastMessageTime = new Date(chat.last_message?.created_at);
                       const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                       return lastMessageTime > dayAgo;
                     }).length : chatRooms.length;
        
        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterTab,
              isSelected && styles.filterTabSelected
            ]}
            onPress={() => handleFilterSelect(option.key)}
            activeOpacity={0.7}
          >
            {isSelected ? (
              <LinearGradient
                colors={['#007AFF', '#5856D6']}
                style={styles.filterTabGradient}
              >
                <Ionicons name={option.icon} size={16} color="#fff" />
                <Text style={styles.filterTabTextSelected}>{option.label}</Text>
                {count > 0 && (
                  <View style={styles.filterTabBadge}>
                    <Text style={styles.filterTabBadgeText}>{count > 99 ? '99+' : count}</Text>
                  </View>
                )}
              </LinearGradient>
            ) : (
              <>
                <Ionicons name={option.icon} size={16} color="#8E8E93" />
                <Text style={styles.filterTabText}>{option.label}</Text>
                {count > 0 && option.key === 'unread' && (
                  <View style={styles.filterTabBadgeInactive}>
                    <Text style={styles.filterTabBadgeTextInactive}>{count > 99 ? '99+' : count}</Text>
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Render header for list view
  const renderListHeader = () => (
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
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}
              {unreadCount > 0 && ` • ${unreadCount} unread`}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleSearch}
            activeOpacity={0.7}
          >
            <Ionicons name={showSearch ? "close" : "search"} size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleNewChatNavigation}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  // Render empty state
  const renderEmptyState = () => {
    const getEmptyStateConfig = () => {
      switch (selectedFilter) {
        case 'unread':
          return {
            icon: 'checkmark-done-circle',
            title: 'All caught up!',
            subtitle: 'No unread messages',
            color: '#34C759'
          };
        case 'recent':
          return {
            icon: 'time',
            title: 'No recent chats',
            subtitle: 'No conversations in the last 24 hours',
            color: '#FF9500'
          };
        default:
          return {
            icon: 'chatbubbles-outline',
            title: 'No conversations yet',
            subtitle: 'Start chatting with your connections',
            color: '#8E8E93'
          };
      }
    };

    const { icon, title, subtitle, color } = getEmptyStateConfig();

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={64} color={color} />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
        {selectedFilter === 'all' && (
          <TouchableOpacity 
            style={styles.startChattingButton}
            onPress={handleNewChatNavigation}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#007AFF', '#5856D6']}
              style={styles.startChattingGradient}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.startChattingText}>Start Chatting</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="wifi-off" size={64} color="#FF3B30" />
      <Text style={styles.errorTitle}>Connection Problem</Text>
      <Text style={styles.errorSubtitle}>
        Unable to load your conversations. Check your internet connection and try again.
      </Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={handleRefresh}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh" size={20} color="#007AFF" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading conversations...</Text>
    </View>
  );

  // Render chat list view
  const renderChatListView = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderListHeader()}
      {renderSearchBar()}
      {renderFilterTabs()}
      
      <View style={styles.contentContainer}>
        {error ? renderErrorState() :
         loading && chatRooms.length === 0 ? renderLoadingState() :
         filteredChats.length === 0 ? renderEmptyState() : (
          <ChatList 
            chatRooms={filteredChats}
            onChatPress={handleChatPress}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            style={styles.chatList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleNewChatNavigation}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#007AFF', '#5856D6']}
          style={styles.fabGradient}
        >
          <Ionicons name="create" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // Render individual chat view
  // const renderChatView = () => (
  //   <View style={styles.container}>
  //     <ChatHeader 
  //       user={selectedChat?.other_user}
  //       isOnline={isConnected}
  //       onBackPress={handleBackToList}
  //       onUserPress={(user) => {
  //         router.push(`/connections/user-details`);
  //         // router.push(`connections/user-details?userId=${user.id}`);
  //         // router.push(`auth/profile?userId=${user.id}`);
  //       } } onVideoCall={undefined} onVoiceCall={undefined}      />
      
  //     <ChatRoom 
  //       messages={messages}
  //       loading={messagesLoading}
  //       onLoadMore={loadMoreMessages}
  //     />
      
  //     <MessageInput onSend={handleSendMessage} />
  //   </View>
  // );


  //   const renderChatView = () => (
    //   <View style={styles.container}>
    //     <ChatHeader 
    //       user={selectedChat?.other_user}
    //       isOnline={isConnected}
    //       onBackPress={handleBackToList}
    //       onUserPress={(user) => {
    //         console.log('ChatListScreen - User pressed:', user);
    //         console.log('ChatListScreen - User ID:', user?.id);
          
    //         // Check if user has an ID
    //         if (user?.id) {
    //           // Navigate to user details with the user ID
    //           router.push({
    //             pathname: '/connections/user-details',
    //             params: { userId: user.id }
    //           });
    //         } else {
    //           // Try to get ID from selectedChat.other_user
    //           const userId = selectedChat?.other_user?.id;
    //           if (userId) {
    //             router.push({
    //               pathname: '/connections/user-details',
    //               params: { userId: userId }
    //             });
    //           } else {
    //             Alert.alert('Error', 'Unable to load user profile. User ID not found.');
    //             console.log('No user ID found in:', {
    //               user,
    //               selectedChatOtherUser: selectedChat?.other_user
    //             });
    //           }
    //         }
    //       }}
    //       onVideoCall={undefined} 
    //       onVoiceCall={undefined}      
    //     />
      
    //     <ChatRoom 
    //       messages={messages}
    //       loading={messagesLoading}
    //       onLoadMore={loadMoreMessages}
    //     />
      
    //     <MessageInput onSend={handleSendMessage} />
    //   </View>
  // );






  


  const renderChatView = () => {
   
    console.log('Rendering ChatHeader with otherUser:', selectedChat?.other_user);
    console.log('otherUser keys:', selectedChat?.other_user ? Object.keys(selectedChat.other_user) : 'null');
    
    return (
      <View style={styles.container}>
        <ChatHeader 
          user={selectedChat?.other_user}
          isOnline={isConnected}
          onBackPress={handleBackToList}
          onUserPress={(user) => {
            console.log('ChatListScreen - User pressed:', user);
            console.log('ChatListScreen - User ID:', user?.id);
            
            // Check if user has an ID
            if (user?.id) {
              // Navigate to user details with the user ID
              router.push({
                pathname: '/connections/user-details',
                params: { userId: user.id }
              });
            } else {
              // Try to get ID from selectedChat.other_user
              const userId = selectedChat?.other_user?.id;
              if (userId) {
                router.push({
                  pathname: '/connections/user-details',
                  params: { userId: userId }
                });
              } else {
                Alert.alert('Error', 'Unable to load user profile. User ID not found.');
                console.log('No user ID found in:', {
                  user,
                  selectedChatOtherUser: selectedChat?.other_user
                });
              }
            }
          }}
          onVideoCall={undefined} 
          onVoiceCall={undefined}      
        />
        
        <ChatRoom 
          messages={messages}
          loading={messagesLoading}
          onLoadMore={loadMoreMessages}
        />
        
        <MessageInput onSend={handleSendMessage} />
      </View>
    );
  };














  // Main render
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      {currentView === 'list' ? renderChatListView() : renderChatView()}
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
    flex: 1,
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
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
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

  // Filter Styles
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 25,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabSelected: {
    backgroundColor: 'transparent',
  },
  filterTabGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 6,
  },
  filterTabTextSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  filterTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  filterTabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  filterTabBadgeInactive: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  filterTabBadgeTextInactive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // Content Styles
  contentContainer: {
    flex: 1,
  },
  chatList: {
    flex: 1,
  },

  // Empty State Styles
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
 emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  startChattingButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startChattingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  startChattingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },

  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },

  // Loading State Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },

  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    flex: 1,
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
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  // Connection Item Styles
  connectionsList: {
    paddingHorizontal: 20,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    width: 14,
    height: 14,
    borderRadius: 7,
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
    marginBottom: 2,
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
    marginTop: 16,
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
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  findConnectionsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  findConnectionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },

  // No Results Styles
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 4,
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Separator
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 86,
  },
});

export default ChatListScreen;





























































// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { 
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   StyleSheet, 
//   RefreshControl,
//   Alert,
//   SafeAreaView,
//   StatusBar,
//   TextInput,
//   Image,
//   ActivityIndicator,
//   Dimensions,
//   Platform,
//   Animated,
// } from 'react-native';
// import { router } from 'expo-router';
// import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';

// // Import components and hooks
// import ConnectionAPI from '../../api/connectionService';
// import { useChat } from '../hooks/useChat';
// import ChatList from '../components/chat-list';

// const { width, height } = Dimensions.get('window');

// const ChatListScreen = () => {
//   // State management
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filteredChats, setFilteredChats] = useState([]);
//   const [showSearch, setShowSearch] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState('all'); // all, unread, recent
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);
  
//   // Animation values
//   const searchAnimation = useState(new Animated.Value(0))[0];
//   const fadeAnim = useState(new Animated.Value(1))[0];

//   // Chat hook
//   const { chatRooms, loading, refreshChatRooms, error } = useChat();

//   // Filter options
//   const filterOptions = [
//     { key: 'all', label: 'All', icon: 'chatbubbles' },
//     { key: 'unread', label: 'Unread', icon: 'notifications' },
//     { key: 'recent', label: 'Recent', icon: 'time' },
//   ];

//   // Filter and search chats
//   const processedChats = useMemo(() => {
//     let filtered = [...chatRooms];

//     // Apply filter
//     switch (selectedFilter) {
//       case 'unread':
//         filtered = filtered.filter(chat => chat.unread_count > 0);
//         break;
//       case 'recent':
//         filtered = filtered.filter(chat => {
//           const lastMessageTime = new Date(chat.last_message?.created_at);
//           const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//           return lastMessageTime > dayAgo;
//         });
//         break;
//       default:
//         break;
//     }

//     // Apply search
//     if (searchQuery.trim()) {
//       filtered = filtered.filter(chat => {
//         const otherUser = chat.other_user;
//         const fullName = `${otherUser?.first_name} ${otherUser?.last_name}`.toLowerCase();
//         const username = otherUser?.username?.toLowerCase() || '';
//         const lastMessage = chat.last_message?.content?.toLowerCase() || '';
        
//         return fullName.includes(searchQuery.toLowerCase()) || 
//                username.includes(searchQuery.toLowerCase()) ||
//                lastMessage.includes(searchQuery.toLowerCase());
//       });
//     }

//     return filtered;
//   }, [chatRooms, selectedFilter, searchQuery]);

//   // Calculate unread count
//   useEffect(() => {
//     const count = chatRooms.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
//     setUnreadCount(count);
//   }, [chatRooms]);

//   // Update filtered chats
//   useEffect(() => {
//     setFilteredChats(processedChats);
//   }, [processedChats]);

//   // Handle chat selection
//   const handleChatPress = useCallback((chatRoom) => {
//     // Fade out animation
//     Animated.timing(fadeAnim, {
//       toValue: 0.7,
//       duration: 150,
//       useNativeDriver: true,
//     }).start(() => {
//       router.push({
//         pathname: 'chat/chat-screen',
//         params: { 
//           roomId: chatRoom.id,
//           otherUser: JSON.stringify(chatRoom.other_user)
//         }
//       });
      
//       // Fade back in
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 150,
//         useNativeDriver: true,
//       }).start();
//     });
//   }, [fadeAnim]);

//   // Handle refresh
//   const handleRefresh = useCallback(async () => {
//     setIsRefreshing(true);
//     try {
//       await refreshChatRooms();
//     } catch (error) {
//       Alert.alert('Error', 'Failed to refresh chats');
//     } finally {
//       setIsRefreshing(false);
//     }
//   }, [refreshChatRooms]);

//   // Toggle search
//   const toggleSearch = useCallback(() => {
//     const toValue = showSearch ? 0 : 1;
//     setShowSearch(!showSearch);
    
//     Animated.timing(searchAnimation, {
//       toValue,
//       duration: 300,
//       useNativeDriver: false,
//     }).start();
    
//     if (showSearch) {
//       setSearchQuery('');
//     }
//   }, [showSearch, searchAnimation]);

//   // Handle filter selection
//   const handleFilterSelect = useCallback((filter) => {
//     setSelectedFilter(filter);
    
//     // Haptic feedback simulation
//     if (Platform.OS === 'ios') {
//       // Would use Haptics.impactAsync() in real app
//     }
//   }, []);

//   // Navigate to new chat
//   const handleNewChat = useCallback(() => {
//     router.push('chat/new-chat-screen');
//   }, []);

//   // Navigate back to dashboard
//   const handleBackToDashboard = useCallback(() => {
//     router.push('auth/dashboard');
//   }, []);

//   // Navigate to chat settings
//   const handleChatSettings = useCallback(() => {
//     router.push('chat/chat-settings');
//   }, []);

//   // Render search bar
//   const renderSearchBar = () => (
//     <Animated.View style={[
//       styles.searchContainer,
//       {
//         height: searchAnimation.interpolate({
//           inputRange: [0, 1],
//           outputRange: [0, 60],
//         }),
//         opacity: searchAnimation,
//       }
//     ]}>
//       <View style={styles.searchBar}>
//         <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search conversations..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           placeholderTextColor="#8E8E93"
//           autoFocus={showSearch}
//         />
//         {searchQuery ? (
//           <TouchableOpacity onPress={() => setSearchQuery('')}>
//             <Ionicons name="close-circle" size={20} color="#8E8E93" />
//           </TouchableOpacity>
//         ) : null}
//       </View>
//     </Animated.View>
//   );

//   // Render filter tabs
//   const renderFilterTabs = () => (
//     <View style={styles.filterContainer}>
//       {filterOptions.map((option) => {
//         const isSelected = selectedFilter === option.key;
//         const count = option.key === 'unread' ? unreadCount : 
//                      option.key === 'recent' ? processedChats.filter(chat => {
//                        const lastMessageTime = new Date(chat.last_message?.created_at);
//                        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//                        return lastMessageTime > dayAgo;
//                      }).length : chatRooms.length;
        
//         return (
//           <TouchableOpacity
//             key={option.key}
//             style={[
//               styles.filterTab,
//               isSelected && styles.filterTabSelected
//             ]}
//             onPress={() => handleFilterSelect(option.key)}
//             activeOpacity={0.7}
//           >
//             {isSelected ? (
//               <LinearGradient
//                 colors={['#007AFF', '#5856D6']}
//                 style={styles.filterTabGradient}
//               >
//                 <Ionicons name={option.icon} size={16} color="#fff" />
//                 <Text style={styles.filterTabTextSelected}>{option.label}</Text>
//                 {count > 0 && (
//                   <View style={styles.filterTabBadge}>
//                     <Text style={styles.filterTabBadgeText}>{count > 99 ? '99+' : count}</Text>
//                   </View>
//                 )}
//               </LinearGradient>
//             ) : (
//               <>
//                 <Ionicons name={option.icon} size={16} color="#8E8E93" />
//                 <Text style={styles.filterTabText}>{option.label}</Text>
//                 {count > 0 && option.key === 'unread' && (
//                   <View style={styles.filterTabBadgeInactive}>
//                     <Text style={styles.filterTabBadgeTextInactive}>{count > 99 ? '99+' : count}</Text>
//                   </View>
//                 )}
//               </>
//             )}
//           </TouchableOpacity>
//         );
//       })}
//     </View>
//   );

//   // Render header
//   const renderHeader = () => (
//     <LinearGradient
//       colors={['#007AFF', '#5856D6']}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 0 }}
//       style={styles.headerGradient}
//     >
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <TouchableOpacity 
//             style={styles.backButton}
//             onPress={handleBackToDashboard}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="arrow-back" size={24} color="#fff" />
//           </TouchableOpacity>
//           <View>
//             <Text style={styles.headerTitle}>Messages</Text>
//             <Text style={styles.headerSubtitle}>
//               {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}
//               {unreadCount > 0 && ` • ${unreadCount} unread`}
//             </Text>
//           </View>
//         </View>
//         <View style={styles.headerActions}>
//           <TouchableOpacity 
//             style={styles.headerButton}
//             onPress={toggleSearch}
//             activeOpacity={0.7}
//           >
//             <Ionicons name={showSearch ? "close" : "search"} size={22} color="#fff" />
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.headerButton}
//             onPress={handleChatSettings}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="settings" size={22} color="#fff" />
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.headerButton}
//             onPress={handleNewChat}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="add" size={24} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </LinearGradient>
//   );

//   // Render empty state
//   const renderEmptyState = () => {
//     const getEmptyStateConfig = () => {
//       switch (selectedFilter) {
//         case 'unread':
//           return {
//             icon: 'checkmark-done-circle',
//             title: 'All caught up!',
//             subtitle: 'No unread messages',
//             color: '#34C759'
//           };
//         case 'recent':
//           return {
//             icon: 'time',
//             title: 'No recent chats',
//             subtitle: 'No conversations in the last 24 hours',
//             color: '#FF9500'
//           };
//         default:
//           return {
//             icon: 'chatbubbles-outline',
//             title: 'No conversations yet',
//             subtitle: 'Start chatting with your connections',
//             color: '#8E8E93'
//           };
//       }
//     };

//     const { icon, title, subtitle, color } = getEmptyStateConfig();

//     return (
//       <View style={styles.emptyContainer}>
//         <View style={[styles.emptyIconContainer, { backgroundColor: `${color}20` }]}>
//           <Ionicons name={icon} size={64} color={color} />
//         </View>
//         <Text style={styles.emptyTitle}>{title}</Text>
//         <Text style={styles.emptySubtitle}>{subtitle}</Text>
//         {selectedFilter === 'all' && (
//           <TouchableOpacity 
//             style={styles.startChattingButton}
//             onPress={handleNewChat}
//             activeOpacity={0.8}
//           >
//             <LinearGradient
//               colors={['#007AFF', '#5856D6']}
//               style={styles.startChattingGradient}
//             >
//               <Ionicons name="add" size={20} color="#fff" />
//               <Text style={styles.startChattingText}>Start Chatting</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         )}
//       </View>
//     );
//   };

//   // Render error state
//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <MaterialIcons name="wifi-off" size={64} color="#FF3B30" />
//       <Text style={styles.errorTitle}>Connection Problem</Text>
//       <Text style={styles.errorSubtitle}>
//         Unable to load your conversations. Check your internet connection and try again.
//       </Text>
//       <TouchableOpacity 
//         style={styles.retryButton}
//         onPress={handleRefresh}
//         activeOpacity={0.8}
//       >
//         <Ionicons name="refresh" size={20} color="#007AFF" />
//         <Text style={styles.retryButtonText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   // Render loading state
//   const renderLoadingState = () => (
//     <View style={styles.loadingContainer}>
//       <ActivityIndicator size="large" color="#007AFF" />
//       <Text style={styles.loadingText}>Loading conversations...</Text>
//     </View>
//   );

//   // Main render
//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
//       <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
//         {renderHeader()}
//         {renderSearchBar()}
//         {renderFilterTabs()}
        
//         <View style={styles.contentContainer}>
//           {error ? renderErrorState() :
//            loading && chatRooms.length === 0 ? renderLoadingState() :
//            filteredChats.length === 0 ? renderEmptyState() : (
//             <ChatList 
//               chatRooms={filteredChats}
//               onChatPress={handleChatPress}
//               onRefresh={handleRefresh}
//               refreshing={isRefreshing}
//               style={styles.chatList}
//               showsVerticalScrollIndicator={false}
//             />
//           )}
//         </View>
//       </Animated.View>
      
//       {/* Floating Action Button */}
//       <TouchableOpacity 
//         style={styles.fab}
//         onPress={handleNewChat}
//         activeOpacity={0.8}
//       >
//         <LinearGradient
//           colors={['#007AFF', '#5856D6']}
//           style={styles.fabGradient}
//         >
//           <Ionicons name="create" size={24} color="#fff" />
//         </LinearGradient>
//       </TouchableOpacity>
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
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   backButton: {
//     marginRight: 16,
//     padding: 4,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginTop: 2,
//   },
//   headerActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   headerButton: {
//     marginLeft: 12,
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//   },

//   // Search Styles
//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 16,
//     backgroundColor: '#F2F2F7',
//     overflow: 'hidden',
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   searchIcon: {
//     marginRight: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#1C1C1E',
//   },

//   // Filter Styles
//   filterContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: 20,
//     paddingBottom: 16,
//     backgroundColor: '#F2F2F7',
//   },
//   filterTab: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     marginHorizontal: 4,
//     borderRadius: 25,
//     backgroundColor: '#fff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   filterTabSelected: {
//     backgroundColor: 'transparent',
//   },
//   filterTabGradient: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 25,
//   },
//   filterTabText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#8E8E93',
//     marginLeft: 6,
//   },
//   filterTabTextSelected: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#fff',
//     marginLeft: 6,
//   },
//   filterTabBadge: {
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     borderRadius: 10,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     marginLeft: 8,
//     minWidth: 20,
//     alignItems: 'center',
//   },
//   filterTabBadgeText: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: '#fff',
//   },
//   filterTabBadgeInactive: {
//     backgroundColor: '#FF3B30',
//     borderRadius: 10,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     marginLeft: 8,
//     minWidth: 20,
//     alignItems: 'center',
//   },
//   filterTabBadgeTextInactive: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: '#fff',
//   },

//   // Content Styles
//   contentContainer: {
//     flex: 1,
//   },
//   chatList: {
//     flex: 1,
//   },

//   // Empty State Styles
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   emptyIconContainer: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   emptyTitle: {
//     fontSize: 22,
//     fontWeight: '600',
//     color: '#1C1C1E',
//     marginBottom: 8,
//   },
//   emptySubtitle: {
//     fontSize: 16,
//     color: '#8E8E93',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 32,
//   },
//   startChattingButton: {
//     borderRadius: 25,
//     shadowColor: '#007AFF',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   startChattingGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 25,
//   },
//   startChattingText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },

//   // Error State Styles
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#1C1C1E',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorSubtitle: {
//     fontSize: 16,
//     color: '#8E8E93',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 32,
//   },
//   retryButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F2F2F7',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 25,
//     borderWidth: 1,
//     borderColor: '#007AFF',
//   },
//   retryButtonText: {
//     color: '#007AFF',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },

//   // Loading State Styles
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#8E8E93',
//   },

//   // FAB Styles
//   fab: {
//     position: 'absolute',
//     bottom: 30,
//     right: 30,
//     borderRadius: 28,
//     shadowColor: '#007AFF',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     elevation: 12,
//   },
//   fabGradient: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default ChatListScreen;



































// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   StyleSheet, 
//   RefreshControl,
//   Alert 
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import ConnectionAPI from '../../api/connectionService';
// import { useChat } from '../hooks/useChat';
// import ChatList from '../components/chat-list';


// const ChatListScreen = () => {
//   const navigation = useNavigation();
//   const { chatRooms, loading, refreshChatRooms } = useChat();
  
//   const handleChatPress = (chatRoom) => {
//     navigation.navigate('Chat', { 
//       roomId: chatRoom.id,
//       otherUser: chatRoom.other_user 
//     });
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Messages</Text>
//       <ChatList 
//         chatRooms={chatRooms}
//         onChatPress={handleChatPress}
//         onRefresh={refreshChatRooms}
//         refreshing={loading}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
// });

// export default ChatListScreen;