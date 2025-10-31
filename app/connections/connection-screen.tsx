

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import ConnectionAPI from '../api/connectionService';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Custom Confirmation Modal Component
const ConfirmationModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false 
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalMessage}>{message}</Text>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modalButton, 
                isDestructive ? styles.destructiveButton : styles.confirmButton
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.confirmButtonText,
                isDestructive && styles.destructiveButtonText
              ]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Success/Error Toast Component
const Toast = ({ visible, message, type = 'success', onHide }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <View style={[
      styles.toast,
      type === 'error' ? styles.errorToast : styles.successToast
    ]}>
      <Ionicons 
        name={type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
        size={20} 
        color="#fff" 
        style={styles.toastIcon}
      />
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
};

export default function ConnectionsScreen() {
  const [connections, setConnections] = useState([]);
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [chatLoading, setChatLoading] = useState({});
  

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [connectionToRemove, setConnectionToRemove] = useState(null);
  
  // Toast states
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Check if this screen is opened for chat selection
  const [isSelectForChat, setIsSelectForChat] = useState(false);

  const fadeAnim = isWeb ? null : new Animated.Value(0);

  useEffect(() => {
    // Check if we're in chat selection mode
    const params = router.params;
    if (params?.selectForChat === 'true') {
      setIsSelectForChat(true);
    }
    
    initializeScreen();
  }, []);

  useEffect(() => {
    filterConnections();
  }, [searchQuery, connections]);

  useEffect(() => {
    if (!loading && !isWeb && fadeAnim) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  // Navigation handlers using Expo Router
  const navigateToStudents = () => {
    router.push('/connections/students');
  };

  const navigateToPendingRequests = () => {
    router.push('/connections/pending-requests');
  };

  const navigateToDashboard = () => {
    router.push('/auth/dashboard');
  };

  // Navigate back to chat screen
  const navigateBackToChat = () => {
    router.back();
  };

  const initializeScreen = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await getCurrentUser(true);
      await loadConnections(user);
      
    } catch (error) {
      console.error('Initialize screen error:', error);
      setError('Failed to initialize screen. Please try again.');
      showToast('Initialization Error: Failed to load screen data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        await AsyncStorage.removeItem('currentUser');
        console.log('Cleared cached user data for fresh login');
      }

      if (!forceRefresh) {
        const cachedUser = await AsyncStorage.getItem('currentUser');
        if (cachedUser) {
          const user = JSON.parse(cachedUser);
          setCurrentUser(user);
          console.log('Using cached user:', user);
          return user;
        }
      }

      console.log('Fetching user from API...');
      const userData = await ConnectionAPI.getCurrentUser();
      
      await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
      setCurrentUser(userData);
      console.log('Fetched and cached fresh user from API:', userData);
      return userData;

    } catch (error) {
      console.error('Error getting current user:', error);
      
      if (!forceRefresh) {
        try {
          const cachedUser = await AsyncStorage.getItem('currentUser');
          if (cachedUser) {
            const user = JSON.parse(cachedUser);
            setCurrentUser(user);
            console.log('Using cached user as fallback:', user);
            return user;
          }
        } catch (cacheError) {
          console.error('Cache fallback failed:', cacheError);
        }
      }
      
      throw error;
    }
  };

  const loadConnections = async (user = null) => {
    try {
      setError(null);
      const data = await ConnectionAPI.getMyConnections();
      
      const currentUserData = user || currentUser;
      
      if (!currentUserData) {
        console.error('No current user data available for filtering connections');
        setConnections([]);
        return [];
      }
      
      const validConnections = (data || []).filter(connection => {
        if (!connection.user1 || !connection.user2) {
          console.log('Missing user1 or user2 in connection:', connection);
          return false;
        }

        const isCurrentUserInConnection = 
          connection.user1.id === currentUserData.id || 
          connection.user2.id === currentUserData.id;

        if (!isCurrentUserInConnection) {
          console.log('Current user not found in connection:', {
            connectionId: connection.id,
            currentUserId: currentUserData.id,
            user1Id: connection.user1.id,
            user2Id: connection.user2.id
          });
          return false;
        }

        if (connection.user1.id === connection.user2.id) {
          console.log('Filtering out self-connection:', connection);
          return false;
        }

        const otherUser = getOtherUserWithData(connection, currentUserData);
        const isValid = otherUser && otherUser.id && otherUser.username && otherUser.id !== currentUserData.id;
        
        if (!isValid) {
          console.log('Invalid other user or self-connection detected:', {
            otherUser,
            currentUserId: currentUserData.id
          });
        }

        return isValid;
      });

      console.log('Total connections from API:', data?.length || 0);
      console.log('Valid connections after filtering:', validConnections.length);
      console.log('Current user for filtering:', currentUserData);
      
      setConnections(validConnections);
      return validConnections;
    } catch (error) {
      console.error('Load connections error:', error);
      setError('Unable to load connections');
      throw error;
    }
  };

  const getOtherUserWithData = (connection, userData) => {
    if (!userData || !connection) {
      console.log('Missing userData or connection:', { userData, connection });
      return {};
    }

    console.log('Current user ID:', userData.id);
    console.log('Connection user1 ID:', connection.user1?.id);
    console.log('Connection user2 ID:', connection.user2?.id);

    if (!connection.user1 || !connection.user2) {
      console.log('Missing user1 or user2 in connection:', connection);
      return {};
    }

    if (connection.user1.id === userData.id && connection.user2.id !== userData.id) {
      console.log('Returning user2:', connection.user2);
      return connection.user2;
    } else if (connection.user2.id === userData.id && connection.user1.id !== userData.id) {
      console.log('Returning user1:', connection.user1);
      return connection.user1;
    } else {
      console.warn('Invalid connection - either both users are the same or current user not found:', {
        currentUserId: userData.id,
        user1Id: connection.user1?.id,
        user2Id: connection.user2?.id
      });
      return {};
    }
  };

  // Profile picture function from commented code
  // const getUserProfilePicture = (user) => {
  //   if (user?.profile_picture) {
  //     // Check if it's already a full URL
  //     if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
  //       return user.profile_picture;
  //     }
      
  //     // Use your API base URL from config or environment
  //     // const API_BASE_URL = 'http://192.168.130.16:8000'; 
  //     const API_BASE_URL = 'http://127.0.0.1:8000';
      
  //     // Clean up the path
  //     const cleanPath = user.profile_picture.startsWith('/') 
  //       ? user.profile_picture 
  //       : `/${user.profile_picture}`;
      
  //     return `${API_BASE_URL}${cleanPath}`;
  //   }
    
  //   // Fallback to username-based avatar
  //   return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=10b981&color=fff&size=128`;
  // };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const user = await getCurrentUser(true);
      await loadConnections(user);
      showToast('Connections refreshed successfully');
    } catch (error) {
      showToast('Unable to refresh connections', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const filterConnections = () => {
    if (!searchQuery.trim()) {
      setFilteredConnections(connections);
      return;
    }

    const filtered = connections.filter(connection => {
      const otherUser = getOtherUserWithData(connection, currentUser);
      if (!otherUser || !otherUser.first_name) return false;
      
      const fullName = `${otherUser.first_name} ${otherUser.last_name}`.toLowerCase();
      const username = otherUser.username?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return fullName.includes(query) || username.includes(query);
    });
    
    setFilteredConnections(filtered);
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '', type: 'success' });
  };

  // Handle message button click
  // const handleMessagePress = (connection) => {
  //   const otherUser = getOtherUserWithData(connection, currentUser);
  //   if (isSelectForChat) {
  //     // Navigate back to chat with selected user
  //     router.push({
  //       pathname: '/chat/screens/chat-list-screen',
  //       params: { startChatWithUserId: otherUser.id }
  //     });
  //   } else {
  //     // Navigate to chat with this user
  //     router.push('/chat/screens/chat-list-screen');
      
  //   }
  // };




  const handleMessagePress = async (connection) => {
    try {
      const otherUser = getOtherUserWithData(connection, currentUser);
      
      if (!otherUser || !otherUser.id) {
        showToast('Unable to start chat. User information not found.', 'error');
        return;
      }

      // Show loading state for this specific connection
      setChatLoading(prev => ({ ...prev, [connection.id]: true }));
      showToast('Opening chat...', 'success');

      if (isSelectForChat) {
        // If we're in selection mode, navigate back to chat with selected user
        router.push({
          pathname: '/chat/screens/chat-list-screen',
          params: { startChatWithUserId: otherUser.id }
        });
      } else {
        try {
          // Create or get chat room
          const chatRoom = await ConnectionAPI.getOrCreateChatRoom(otherUser.id);
          
          console.log('Chat room created/found:', chatRoom);
          console.log('Other user data being passed:', otherUser);
          
          // Ensure we have all necessary user data with consistent field names
          const userDataToPass = {
            id: otherUser.id,                                    // Primary ID
            user_id: otherUser.id,                              // Alternative ID field
            pk: otherUser.id,                                   // Another alternative
            username: otherUser.username || 'Unknown',
            first_name: otherUser.first_name || '',
            last_name: otherUser.last_name || '',
            profile_picture: otherUser.profile_picture || null,
            bio: otherUser.bio || null,
            email: otherUser.email || null,
            // Add any other fields your UserDetailModal might need
            full_name: `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim() || otherUser.username
          };
          
          console.log('Cleaned user data to pass:', userDataToPass);
          
          // Navigate directly to the chat screen with proper user data
          router.push({
            pathname: '/chat/screens/chat-screen',
            params: {
              roomId: chatRoom.id,
              otherUser: JSON.stringify(userDataToPass)
            }
          });

        } catch (error) {
          console.error('Error creating/getting chat room:', error);
          showToast('Failed to create chat room. Please try again.', 'error');
        }
      }
    } catch (error) {
      console.error('Handle message press error:', error);
      showToast('Failed to open chat. Please try again.', 'error');
    } finally {
      // Clear loading state
      setChatLoading(prev => ({ ...prev, [connection.id]: false }));
    }
  };









  // const handleMessagePress = async (connection) => {
  //   try {
  //     const otherUser = getOtherUserWithData(connection, currentUser);
      
  //     if (!otherUser || !otherUser.id) {
  //       showToast('Unable to start chat. User information not found.', 'error');
  //       return;
  //     }

  //     // Show loading state
  //     showToast('Opening chat...', 'success');

  //     if (isSelectForChat) {
  //       // If we're in selection mode, navigate back to chat with selected user
  //       router.push({
  //         pathname: '/chat/screens/chat-list-screen',
  //         params: { startChatWithUserId: otherUser.id }
  //       });
  //     } else {
  //       // Direct chat functionality
  //       try {
  //         // Create or get chat room
  //         const chatRoom = await ConnectionAPI.getOrCreateChatRoom(otherUser.id);
          
  //         console.log('Chat room created/found:', chatRoom);
  //         console.log('Other user data being passed:', otherUser);
          
  //         // Ensure we have all necessary user data
  //         const userDataToPass = {
  //           id: otherUser.id,
  //           username: otherUser.username || 'Unknown',
  //           first_name: otherUser.first_name || '',
  //           last_name: otherUser.last_name || '',
  //           profile_picture: otherUser.profile_picture || null,
  //           bio: otherUser.bio || null,
  //           email: otherUser.email || null
  //         };
          
  //         console.log('Cleaned user data to pass:', userDataToPass);
          
  //         // Navigate directly to the chat screen with proper user data
  //         router.push({
  //           pathname: '/chat/screens/chat-screen',
  //           params: {
  //             roomId: chatRoom.id,
  //             otherUser: JSON.stringify(userDataToPass)
  //           }
  //         });

  //       } catch (error) {
  //         console.error('Error creating/getting chat room:', error);
          
  //         // Fallback: navigate to chat list screen with user ID
  //         router.push({
  //           pathname: '/chat/screens/chat-list-screen',
  //           params: { startChatWithUserId: otherUser.id }
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Handle message press error:', error);
  //     showToast('Failed to open chat. Please try again.', 'error');
  //   }
  // };


  // const handleMessagePressWithLoading = async (connection) => {
  //   try {
  //     const otherUser = getOtherUserWithData(connection, currentUser);
      
  //     if (!otherUser || !otherUser.id) {
  //       showToast('Unable to start chat. User information not found.', 'error');
  //       return;
  //     }

  //     // Set loading state for this specific connection
  //     setChatLoading(prev => ({ ...prev, [connection.id]: true }));

  //     if (isSelectForChat) {
  //       router.push({
  //         pathname: '/chat/screens/chat-list-screen',
  //         params: { startChatWithUserId: otherUser.id }
  //       });
  //     } else {
  //       try {
  //         // Create or get existing chat room
  //         const chatRoom = await ConnectionAPI.getOrCreateChatRoom(otherUser.id);
          
  //         // Navigate directly to chat screen
  //         router.push({
  //           pathname: '/chat/screens/chat-screen',
  //           params: {
  //             roomId: chatRoom.id,
  //             otherUser: JSON.stringify({
  //               id: otherUser.id,
  //               username: otherUser.username,
  //               first_name: otherUser.first_name,
  //               last_name: otherUser.last_name,
  //               profile_picture: otherUser.profile_picture,
  //               bio: otherUser.bio
  //             })
  //           }
  //         });

  //       } catch (error) {
  //         console.error('Error with direct chat:', error);
          
  //         // Fallback to chat list
  //         router.push({
  //           pathname: '/chat/screens/chat-list-screen',
  //           params: { startChatWithUserId: otherUser.id }
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Message press error:', error);
  //     showToast('Failed to open chat. Please try again.', 'error');
  //   } finally {
  //     // Clear loading state
  //     setChatLoading(prev => ({ ...prev, [connection.id]: false }));
  //   }
  // };








  // Handle remove connection with confirmation
  const handleRemovePress = (connection) => {
    setConnectionToRemove(connection);
    setShowConfirmModal(true);
  };

  const confirmRemoveConnection = async () => {
    try {
      if (connectionToRemove) {
        await ConnectionAPI.removeConnection(connectionToRemove.id);
        setConnections(connections.filter(conn => conn.id !== connectionToRemove.id));
        showToast('Connection removed successfully');
      }
    } catch (error) {
      showToast('Failed to remove connection', 'error');
    } finally {
      setShowConfirmModal(false);
      setConnectionToRemove(null);
    }
  };

  const renderConnectionItem = ({ item: connection }) => {
    const otherUser = getOtherUserWithData(connection, currentUser);
    
    if (!otherUser || !otherUser.id) {
      return null;
    }

    const fullName = ConnectionAPI.getFullName(otherUser);
    const displayName = fullName || otherUser.username || 'Unknown User';
    const isLoading = chatLoading[connection.id];

    return (
      <View style={styles.connectionCard}>
        {/* User info area */}
        <View style={styles.connectionInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: ConnectionAPI.getUserProfilePicture(otherUser) }}
              style={styles.avatar}
              defaultSource={{ 
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.username || 'User')}&background=ccc&color=fff&size=128&rounded=true` 
              }}
              resizeMode="cover"
            />
            <View style={styles.onlineIndicator} />
          </View>
          
          <View style={styles.connectionDetails}>
            <Text style={styles.connectionName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.username} numberOfLines={1}>@{otherUser.username}</Text>
            <Text style={styles.connectionTime}>
              Connected {new Date(connection.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
            {otherUser.bio && (
              <Text style={styles.userBio} numberOfLines={1}>{otherUser.bio}</Text>
            )}
          </View>
        </View>

        {/* Action buttons with loading states */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[
              styles.messageButton,
              isLoading && styles.messageButtonLoading
            ]}
            onPress={() => handleMessagePress(connection)}
            // onPress={() => handleMessagePressWithLoading(connection)}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#667eea" />
            ) : (
              <Ionicons name="chatbubble-ellipses" size={20} color="#667eea" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemovePress(connection)}
            activeOpacity={0.7}
          >
            <Ionicons name="person-remove" size={20} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };




  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#8E8E93" />
      <Text style={styles.emptyTitle}>
        {isSelectForChat ? 'No connections for chat' : 'No connections yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isSelectForChat 
          ? 'Connect with people to start chatting'
          : 'Connect with students and mentors to expand your network'
        }
      </Text>
      {!isSelectForChat && (
        <TouchableOpacity 
          style={styles.findConnectionsButton}
          onPress={navigateToStudents}
          activeOpacity={0.8}
        >
          <Text style={styles.findConnectionsText}>Find Connections</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
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
            onPress={isSelectForChat ? navigateBackToChat : navigateToDashboard}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>
              {isSelectForChat ? 'Select Contact' : 'My Connections'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {filteredConnections.length} connection{filteredConnections.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        {!isSelectForChat && (
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={navigateToPendingRequests}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading connections...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      {renderHeader()}
      
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

      {filteredConnections.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredConnections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConnectionItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
              colors={['#007AFF']}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Quick Actions */}
      {!isSelectForChat && (
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={navigateToStudents}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#007AFF', '#5856D6']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="people" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Find People</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={navigateToPendingRequests}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF9500', '#FF6B6B']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="notifications" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Requests</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmRemoveConnection}
        title="Remove Connection"
        message="Are you sure you want to remove this connection? This action cannot be undone."
        confirmText="Remove"
        isDestructive={true}
      />

      {/* Toast */}
      <Toast 
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

// Updated styles to match the commented code structure
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8E8E93',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  connectionCard: {
    backgroundColor: '#fff',
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  connectionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    backgroundColor: '#34C759',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  connectionDetails: {
    flex: 1,
  },
  connectionName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  connectionTime: {
    fontSize: 13,
    color: '#8E8E93',
  },
  userBio: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButtonLoading: {
    opacity: 0.6,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  findConnectionsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 24,
  },
  findConnectionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  destructiveButtonText: {
    color: '#fff',
  },
  // Toast styles
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  successToast: {
    backgroundColor: '#34C759',
  },
  errorToast: {
    backgroundColor: '#FF3B30',
  },
  toastIcon: {
    marginRight: 8,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});
























































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   RefreshControl,
//   TextInput,
//   ActivityIndicator,
//   Animated,
//   Platform,
//   StatusBar,
//   Dimensions,
//   Modal,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { router } from 'expo-router';
// import ConnectionAPI from '../api/connectionService';

// const { width } = Dimensions.get('window');
// const isWeb = Platform.OS === 'web';

// // Custom Confirmation Modal Component
// const ConfirmationModal = ({ 
//   visible, 
//   onClose, 
//   onConfirm, 
//   title, 
//   message, 
//   confirmText = 'Confirm',
//   cancelText = 'Cancel',
//   isDestructive = false 
// }) => {
//   return (
//     <Modal
//       visible={visible}
//   """_summary_
//   """      transparent={true}
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>{title}</Text>
//           </View>
          
//           <View style={styles.modalBody}>
//             <Text style={styles.modalMessage}>{message}</Text>
//           </View>
          
//           <View style={styles.modalFooter}>
//             <TouchableOpacity
//               style={[styles.modalButton, styles.cancelButton]}
//               onPress={onClose}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.cancelButtonText}>{cancelText}</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.modalButton, 
//                 isDestructive ? styles.destructiveButton : styles.confirmButton
//               ]}
//               onPress={onConfirm}
//               activeOpacity={0.8}
//             >
//               <Text style={[
//                 styles.confirmButtonText,
//                 isDestructive && styles.destructiveButtonText
//               ]}>
//                 {confirmText}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// // Success/Error Toast Component
// const Toast = ({ visible, message, type = 'success', onHide }) => {
//   useEffect(() => {
//     if (visible) {
//       const timer = setTimeout(() => {
//         onHide();
//       }, 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [visible, onHide]);

//   if (!visible) return null;

//   return (
//     <View style={[
//       styles.toast,
//       type === 'error' ? styles.errorToast : styles.successToast
//     ]}>
//       <Ionicons 
//         name={type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
//         size={20} 
//         color="#fff" 
//         style={styles.toastIcon}
//       />
//       <Text style={styles.toastText}>{message}</Text>
//     </View>
//   );
// };

// export default function ConnectionsScreen() {
//   const [connections, setConnections] = useState([]);
//   const [filteredConnections, setFilteredConnections] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [refreshing, setRefreshing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [error, setError] = useState(null);
  
//   // Modal states
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [connectionToRemove, setConnectionToRemove] = useState(null);
  
//   // Toast states
//   const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

//   // Check if this screen is opened for chat selection
//   const [isSelectForChat, setIsSelectForChat] = useState(false);

//   const fadeAnim = isWeb ? null : new Animated.Value(0);

//   useEffect(() => {
//     // Check if we're in chat selection mode
//     const params = router.params;
//     if (params?.selectForChat === 'true') {
//       setIsSelectForChat(true);
//     }
    
//     initializeScreen();
//   }, []);

//   useEffect(() => {
//     filterConnections();
//   }, [searchQuery, connections]);

//   useEffect(() => {
//     if (!loading && !isWeb && fadeAnim) {
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [loading]);

//   // Navigation handlers using Expo Router
//   const navigateToStudents = () => {
//     router.push('/connections/students');
//   };

//   const navigateToPendingRequests = () => {
//     router.push('/connections/pending-requests');
//   };

//   const navigateToDashboard = () => {
//     router.push('/auth/dashboard');
//   };

//   // Navigate back to chat screen
//   const navigateBackToChat = () => {
//     router.back();
//   };

//   const initializeScreen = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const user = await getCurrentUser(true);
//       await loadConnections(user);
      
//     } catch (error) {
//       console.error('Initialize screen error:', error);
//       setError('Failed to initialize screen. Please try again.');
//       showToast('Initialization Error: Failed to load screen data', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getCurrentUser = async (forceRefresh = false) => {
//     try {
//       if (forceRefresh) {
//         await AsyncStorage.removeItem('currentUser');
//         console.log('Cleared cached user data for fresh login');
//       }

//       if (!forceRefresh) {
//         const cachedUser = await AsyncStorage.getItem('currentUser');
//         if (cachedUser) {
//           const user = JSON.parse(cachedUser);
//           setCurrentUser(user);
//           console.log('Using cached user:', user);
//           return user;
//         }
//       }

//       console.log('Fetching user from API...');
//       const userData = await ConnectionAPI.getCurrentUser();
      
//       await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
//       setCurrentUser(userData);
//       console.log('Fetched and cached fresh user from API:', userData);
//       return userData;

//     } catch (error) {
//       console.error('Error getting current user:', error);
      
//       if (!forceRefresh) {
//         try {
//           const cachedUser = await AsyncStorage.getItem('currentUser');
//           if (cachedUser) {
//             const user = JSON.parse(cachedUser);
//             setCurrentUser(user);
//             console.log('Using cached user as fallback:', user);
//             return user;
//           }
//         } catch (cacheError) {
//           console.error('Cache fallback failed:', cacheError);
//         }
//       }
      
//       throw error;
//     }
//   };

//   const loadConnections = async (user = null) => {
//     try {
//       setError(null);
//       const data = await ConnectionAPI.getMyConnections();
      
//       const currentUserData = user || currentUser;
      
//       if (!currentUserData) {
//         console.error('No current user data available for filtering connections');
//         setConnections([]);
//         return [];
//       }
      
//       const validConnections = (data || []).filter(connection => {
//         if (!connection.user1 || !connection.user2) {
//           console.log('Missing user1 or user2 in connection:', connection);
//           return false;
//         }

//         const isCurrentUserInConnection = 
//           connection.user1.id === currentUserData.id || 
//           connection.user2.id === currentUserData.id;

//         if (!isCurrentUserInConnection) {
//           console.log('Current user not found in connection:', {
//             connectionId: connection.id,
//             currentUserId: currentUserData.id,
//             user1Id: connection.user1.id,
//             user2Id: connection.user2.id
//           });
//           return false;
//         }

//         if (connection.user1.id === connection.user2.id) {
//           console.log('Filtering out self-connection:', connection);
//           return false;
//         }

//         const otherUser = getOtherUserWithData(connection, currentUserData);
//         const isValid = otherUser && otherUser.id && otherUser.username && otherUser.id !== currentUserData.id;
        
//         if (!isValid) {
//           console.log('Invalid other user or self-connection detected:', {
//             otherUser,
//             currentUserId: currentUserData.id
//           });
//         }

//         return isValid;
//       });

//       console.log('Total connections from API:', data?.length || 0);
//       console.log('Valid connections after filtering:', validConnections.length);
//       console.log('Current user for filtering:', currentUserData);
      
//       setConnections(validConnections);
//       return validConnections;
//     } catch (error) {
//       console.error('Load connections error:', error);
//       setError('Unable to load connections');
//       throw error;
//     }
//   };

//   const getOtherUserWithData = (connection, userData) => {
//     if (!userData || !connection) {
//       console.log('Missing userData or connection:', { userData, connection });
//       return {};
//     }

//     console.log('Current user ID:', userData.id);
//     console.log('Connection user1 ID:', connection.user1?.id);
//     console.log('Connection user2 ID:', connection.user2?.id);

//     if (!connection.user1 || !connection.user2) {
//       console.log('Missing user1 or user2 in connection:', connection);
//       return {};
//     }

//     if (connection.user1.id === userData.id && connection.user2.id !== userData.id) {
//       console.log('Returning user2:', connection.user2);
//       return connection.user2;
//     } else if (connection.user2.id === userData.id && connection.user1.id !== userData.id) {
//       console.log('Returning user1:', connection.user1);
//       return connection.user1;
//     } else {
//       console.warn('Invalid connection - either both users are the same or current user not found:', {
//         currentUserId: userData.id,
//         user1Id: connection.user1?.id,
//         user2Id: connection.user2?.id
//       });
//       return {};
//     }
//   };

//   const onRefresh = async () => {
//     try {
//       setRefreshing(true);
//       setError(null);
      
//       const user = await getCurrentUser(true);
//       await loadConnections(user);
//       showToast('Connections refreshed successfully');
//     } catch (error) {
//       showToast('Unable to refresh connections', 'error');
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const filterConnections = () => {
//     if (!searchQuery.trim()) {
//       setFilteredConnections(connections);
//       return;
//     }

//     const filtered = connections.filter(connection => {
//       const otherUser = getOtherUserWithData(connection, currentUser);
//       if (!otherUser || !otherUser.first_name) return false;
      
//       const fullName = `${otherUser.first_name} ${otherUser.last_name}`.toLowerCase();
//       const username = otherUser.username?.toLowerCase() || '';
//       const query = searchQuery.toLowerCase();
      
//       return fullName.includes(query) || username.includes(query);
//     });
    
//     setFilteredConnections(filtered);
//   };

//   const showToast = (message, type = 'success') => {
//     setToast({ visible: true, message, type });
//   };

//   const hideToast = () => {
//     setToast({ visible: false, message: '', type: 'success' });
//   };

//   // Handle connection selection for chat
//   const handleConnectionPress = (connection) => {
//     if (isSelectForChat) {
//       // Navigate back to chat with selected user
//       const otherUser = getOtherUserWithData(connection, currentUser);
//       router.push({
//         // pathname: '/chat/chat-list',
//         pathname: '/chat/screens/chat-list-screen',
//         params: { startChatWithUserId: otherUser.id }
//       });

//       // return otherUser
//     // }
//     } else {
//       // Navigate to user profile
//       const otherUser = getOtherUserWithData(connection, currentUser);
//       // router.push(`/connections/user-details`);
//       router.push('/chat/components/chat-list');
//       // router.push(`/auth/profile?userId=${otherUser.id}`);
//     }
//   };

//   // Handle remove connection
//   const handleRemoveConnection = (connection) => {
//     setConnectionToRemove(connection);
//     setShowConfirmModal(true);
//   };

//   const confirmRemoveConnection = async () => {
//     try {
//       if (connectionToRemove) {
//         await ConnectionAPI.removeConnection(connectionToRemove.id);
//         setConnections(connections.filter(conn => conn.id !== connectionToRemove.id));
//         showToast('Connection removed successfully');
//       }
//     } catch (error) {
//       showToast('Failed to remove connection', 'error');
//     } finally {
//       setShowConfirmModal(false);
//       setConnectionToRemove(null);
//     }
//   };

//   const renderConnectionItem = ({ item: connection }) => {
//     const otherUser = getOtherUserWithData(connection, currentUser);
    
//     if (!otherUser || !otherUser.id) {
//       return null;
//     }

//     const fullName = `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim();
//     const displayName = fullName || otherUser.username || 'Unknown User';

//     return (
//       <TouchableOpacity 
//         style={styles.connectionItem}
//         onPress={() => handleConnectionPress(connection)}
//         activeOpacity={0.7}
//       >
//         <View style={styles.connectionInfo}>
//           <View style={styles.avatarContainer}>
//             {otherUser.profile_picture ? (
//               <Image 
//                 source={{ uri: otherUser.profile_picture }} 
//                 style={styles.avatar}
//               />
//             ) : (
//               <View style={styles.avatarPlaceholder}>
//                 <Text style={styles.avatarText}>
//                   {(otherUser.first_name?.[0] || otherUser.username?.[0] || '?').toUpperCase()}
//                 </Text>
//               </View>
//             )}
//           </View>
          
//           <View style={styles.userDetails}>
//             <Text style={styles.userName}>{displayName}</Text>
//             <Text style={styles.userUsername}>@{otherUser.username}</Text>
//             {otherUser.bio && (
//               <Text style={styles.userBio} numberOfLines={1}>{otherUser.bio}</Text>
//             )}
//           </View>
//         </View>

//         <View style={styles.connectionActions}>
//           {isSelectForChat ? (
//             <Ionicons name="chatbubble" size={20} color="#007AFF" />
//           ) : (
//             <TouchableOpacity 
//               style={styles.removeButton}
//               onPress={() => handleRemoveConnection(connection)}
//               activeOpacity={0.7}
//             >
//               <Ionicons name="close-circle" size={20} color="#FF3B30" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Ionicons name="people-outline" size={64} color="#8E8E93" />
//       <Text style={styles.emptyTitle}>
//         {isSelectForChat ? 'No connections for chat' : 'No connections yet'}
//       </Text>
//       <Text style={styles.emptySubtitle}>
//         {isSelectForChat 
//           ? 'Connect with people to start chatting'
//           : 'Connect with students and mentors to expand your network'
//         }
//       </Text>
//       {!isSelectForChat && (
//         <TouchableOpacity 
//           style={styles.findConnectionsButton}
//           onPress={navigateToStudents}
//           activeOpacity={0.8}
//         >
//           <Text style={styles.findConnectionsText}>Find Connections</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );

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
//             onPress={isSelectForChat ? navigateBackToChat : navigateToDashboard}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="arrow-back" size={24} color="#fff" />
//           </TouchableOpacity>
//           <View>
//             <Text style={styles.headerTitle}>
//               {isSelectForChat ? 'Select Contact' : 'My Connections'}
//             </Text>
//             <Text style={styles.headerSubtitle}>
//               {filteredConnections.length} connection{filteredConnections.length !== 1 ? 's' : ''}
//             </Text>
//           </View>
//         </View>
//         {!isSelectForChat && (
//           <TouchableOpacity 
//             style={styles.headerButton}
//             onPress={navigateToPendingRequests}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="person-add" size={22} color="#fff" />
//           </TouchableOpacity>
//         )}
//       </View>
//     </LinearGradient>
//   );

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading connections...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
//       {renderHeader()}
      
//       <View style={styles.searchContainer}>
//         <View style={styles.searchBar}>
//           <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search connections..."
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             placeholderTextColor="#8E8E93"
//           />
//           {searchQuery ? (
//             <TouchableOpacity onPress={() => setSearchQuery('')}>
//               <Ionicons name="close-circle" size={20} color="#8E8E93" />
//             </TouchableOpacity>
//           ) : null}
//         </View>
//       </View>

//       {filteredConnections.length === 0 ? (
//         renderEmptyState()
//       ) : (
//         <FlatList
//           data={filteredConnections}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={renderConnectionItem}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               tintColor="#007AFF"
//               colors={['#007AFF']}
//             />
//           }
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.listContainer}
//         />
//       )}

//       {/* Quick Actions */}
//       {!isSelectForChat && (
//         <View style={styles.quickActions}>
//           <TouchableOpacity 
//             style={styles.quickActionButton}
//             onPress={navigateToStudents}
//             activeOpacity={0.8}
//           >
//             <LinearGradient
//               colors={['#007AFF', '#5856D6']}
//               style={styles.quickActionGradient}
//             >
//               <Ionicons name="people" size={20} color="#fff" />
//               <Text style={styles.quickActionText}>Find People</Text>
//             </LinearGradient>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={styles.quickActionButton}
//             onPress={navigateToPendingRequests}
//             activeOpacity={0.8}
//           >
//             <LinearGradient
//               colors={['#FF9500', '#FF6B6B']}
//               style={styles.quickActionGradient}
//             >
//               <Ionicons name="notifications" size={20} color="#fff" />
//               <Text style={styles.quickActionText}>Requests</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Confirmation Modal */}
//       <ConfirmationModal
//         visible={showConfirmModal}
//         onClose={() => setShowConfirmModal(false)}
//         onConfirm={confirmRemoveConnection}
//         title="Remove Connection"
//         message="Are you sure you want to remove this connection? This action cannot be undone."
//         confirmText="Remove"
//         isDestructive={true}
//       />

//       {/* Toast */}
//       <Toast 
//         visible={toast.visible}
//         message={toast.message}
//         type={toast.type}
//         onHide={hideToast}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F2F2F7',
//   },
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
//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
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
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: '#fff',
//     opacity: 0.8,
//   },
//   headerButton: {
//     padding: 8,
//   },
//   searchContainer: {
//     backgroundColor: '#fff',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E5EA',
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F2F2F7',
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     height: 40,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#000',
//   },
//   listContainer: {
//     paddingVertical: 8,
//   },
//   connectionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#fff',
//     marginHorizontal: 16,
//     marginVertical: 4,
//     padding: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   connectionInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   avatarContainer: {
//     marginRight: 12,
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//   },
//   avatarPlaceholder: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   avatarText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   userDetails: {
//     flex: 1,
//   },
//   userName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#000',
//     marginBottom: 2,
//   },
//   userUsername: {
//     fontSize: 14,
//     color: '#8E8E93',
//     marginBottom: 2,
//   },
//   userBio: {
//     fontSize: 12,
//     color: '#8E8E93',
//   },
//   connectionActions: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   removeButton: {
//     padding: 8,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#000',
//     textAlign: 'center',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptySubtitle: {
//     fontSize: 16,
//     color: '#8E8E93',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   findConnectionsButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginTop: 24,
//   },
//   findConnectionsText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   quickActions: {
//     flexDirection: 'row',
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     gap: 12,
//   },
//   quickActionButton: {
//     flex: 1,
//   },
//   quickActionGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   quickActionText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     marginHorizontal: 20,
//     overflow: 'hidden',
//     minWidth: 300,
//   },
//   modalHeader: {
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E5EA',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#000',
//     textAlign: 'center',
//   },
//   modalBody: {
//     padding: 20,
//   },
//   modalMessage: {
//     fontSize: 16,
//     color: '#8E8E93',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     borderTopWidth: 1,
//     borderTopColor: '#E5E5EA',
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   cancelButton: {
//     borderRightWidth: 1,
//     borderRightColor: '#E5E5EA',
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     color: '#8E8E93',
//   },
//   confirmButton: {
//     backgroundColor: '#007AFF',
//   },
//   confirmButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   destructiveButton: {
//     backgroundColor: '#FF3B30',
//   },
//   destructiveButtonText: {
//     color: '#fff',
//   },
//   toast: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 100 : 80,
//     left: 20,
//     right: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 8,
//     zIndex: 1000,
//   },
//   successToast: {
//     backgroundColor: '#34C759',
//   },
//   errorToast: {
//     backgroundColor: '#FF3B30',
//   },
//   toastIcon: {
//     marginRight: 8,
//   },
//   toastText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#fff',
//     fontWeight: '500',
//   },
// });





































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   RefreshControl,
//   TextInput,
//   ActivityIndicator,
//   Animated,
//   Platform,
//   StatusBar,
//   Dimensions,
//   Modal,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { router } from 'expo-router';
// import ConnectionAPI from '../api/connectionService';
// // import useCurrentUser from '../api/useCurrentUser'

// const { width } = Dimensions.get('window');
// const isWeb = Platform.OS === 'web';

// // Custom Confirmation Modal Component
// const ConfirmationModal = ({ 
//   visible, 
//   onClose, 
//   onConfirm, 
//   title, 
//   message, 
//   confirmText = 'Confirm',
//   cancelText = 'Cancel',
//   isDestructive = false 
// }) => {
//   return (
//     <Modal
//       visible={visible}
//       transparent={true}
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>{title}</Text>
//           </View>
          
//           <View style={styles.modalBody}>
//             <Text style={styles.modalMessage}>{message}</Text>
//           </View>
          
//           <View style={styles.modalFooter}>
//             <TouchableOpacity
//               style={[styles.modalButton, styles.cancelButton]}
//               onPress={onClose}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.cancelButtonText}>{cancelText}</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.modalButton, 
//                 isDestructive ? styles.destructiveButton : styles.confirmButton
//               ]}
//               onPress={onConfirm}
//               activeOpacity={0.8}
//             >
//               <Text style={[
//                 styles.confirmButtonText,
//                 isDestructive && styles.destructiveButtonText
//               ]}>
//                 {confirmText}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// // Success/Error Toast Component
// const Toast = ({ visible, message, type = 'success', onHide }) => {
//   useEffect(() => {
//     if (visible) {
//       const timer = setTimeout(() => {
//         onHide();
//       }, 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [visible, onHide]);

//   if (!visible) return null;

//   return (
//     <View style={[
//       styles.toast,
//       type === 'error' ? styles.errorToast : styles.successToast
//     ]}>
//       <Ionicons 
//         name={type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
//         size={20} 
//         color="#fff" 
//         style={styles.toastIcon}
//       />
//       <Text style={styles.toastText}>{message}</Text>
//     </View>
//   );
// };

// export default function ConnectionsScreen() {
//   const [connections, setConnections] = useState([]);
//   const [filteredConnections, setFilteredConnections] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [refreshing, setRefreshing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [error, setError] = useState(null);
  
//   // Modal states
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [connectionToRemove, setConnectionToRemove] = useState(null);
  
//   // Toast states
//   const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

//   // Simplified animation - removed useNativeDriver to fix display issues
//   const fadeAnim = isWeb ? null : new Animated.Value(0);

//   useEffect(() => {
//     initializeScreen();
//   }, []);

//   useEffect(() => {
//     filterConnections();
//   }, [searchQuery, connections]);

//   useEffect(() => {
//     if (!loading && !isWeb && fadeAnim) {
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true, // Changed to false to fix display issues
//         // useNativeDriver: false, // Changed to false to fix display issues
//       }).start();
//     }
//   }, [loading]);

//   // Navigation handlers using Expo Router
//   const navigateToStudents = () => {
//     router.push('/connections/students');
//   };

//   const navigateToPendingRequests = () => {
//     router.push('/connections/pending-requests');
//   };

//   const navigateToDashboard = () => {
//     router.push('/auth/dashboard');
//   };

//   const initializeScreen = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       // Force refresh user data from API (don't use cache on initial load)
//       const user = await getCurrentUser(true); // Pass true to force refresh
      
//       // Now load connections with the fresh user data
//       await loadConnections(user);
      
//     } catch (error) {
//       console.error('Initialize screen error:', error);
//       setError('Failed to initialize screen. Please try again.');
//       showToast('Initialization Error: Failed to load screen data', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getCurrentUser = async (forceRefresh = false) => {
//     try {
//       // If force refresh is requested, clear cache first
//       if (forceRefresh) {
//         await AsyncStorage.removeItem('currentUser');
//         console.log('Cleared cached user data for fresh login');
//       }

//       // Try to get from AsyncStorage first (cached user data)
//       if (!forceRefresh) {
//         const cachedUser = await AsyncStorage.getItem('currentUser');
//         if (cachedUser) {
//           const user = JSON.parse(cachedUser);
//           setCurrentUser(user);
//           console.log('Using cached user:', user);
//           return user;
//         }
//       }

//       // Fetch fresh data from API
//       console.log('Fetching user from API...');
//       const userData = await ConnectionAPI.getCurrentUser();
      
//       // Cache the fresh user data
//       await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
//       setCurrentUser(userData);
//       console.log('Fetched and cached fresh user from API:', userData);
//       return userData;

//     } catch (error) {
//       console.error('Error getting current user:', error);
      
//       // If API fails and we're not forcing refresh, try to use cached data as fallback
//       if (!forceRefresh) {
//         try {
//           const cachedUser = await AsyncStorage.getItem('currentUser');
//           if (cachedUser) {
//             const user = JSON.parse(cachedUser);
//             setCurrentUser(user);
//             console.log('Using cached user as fallback:', user);
//             return user;
//           }
//         } catch (cacheError) {
//           console.error('Cache fallback failed:', cacheError);
//         }
//       }
      
//       throw error;
//     }
//   };

//   const loadConnections = async (user = null) => {
//     try {
//       setError(null);
//       const data = await ConnectionAPI.getMyConnections();
      
//       // Use the passed user or fallback to state
//       const currentUserData = user || currentUser;
      
//       if (!currentUserData) {
//         console.error('No current user data available for filtering connections');
//         setConnections([]);
//         return [];
//       }
      
//       // Filter out invalid connections and self-connections
//       const validConnections = (data || []).filter(connection => {
//         // Check if connection has both users
//         if (!connection.user1 || !connection.user2) {
//           console.log('Missing user1 or user2 in connection:', connection);
//           return false;
//         }

//         // Check if current user is one of the users in the connection
//         const isCurrentUserInConnection = 
//           connection.user1.id === currentUserData.id || 
//           connection.user2.id === currentUserData.id;

//         if (!isCurrentUserInConnection) {
//           console.log('Current user not found in connection:', {
//             connectionId: connection.id,
//             currentUserId: currentUserData.id,
//             user1Id: connection.user1.id,
//             user2Id: connection.user2.id
//           });
//           return false;
//         }

//         // Prevent self-connections (user connected to themselves)
//         if (connection.user1.id === connection.user2.id) {
//           console.log('Filtering out self-connection:', connection);
//           return false;
//         }

//         // Get the other user and validate
//         const otherUser = getOtherUserWithData(connection, currentUserData);
//         const isValid = otherUser && otherUser.id && otherUser.username && otherUser.id !== currentUserData.id;
        
//         if (!isValid) {
//           console.log('Invalid other user or self-connection detected:', {
//             otherUser,
//             currentUserId: currentUserData.id
//           });
//         }

//         return isValid;
//       });

//       console.log('Total connections from API:', data?.length || 0);
//       console.log('Valid connections after filtering:', validConnections.length);
//       console.log('Current user for filtering:', currentUserData);
      
//       setConnections(validConnections);
//       return validConnections;
//     } catch (error) {
//       console.error('Load connections error:', error);
//       setError('Unable to load connections');
//       throw error;
//     }
//   };

//   const getOtherUserWithData = (connection, userData) => {
//     if (!userData || !connection) {
//       console.log('Missing userData or connection:', { userData, connection });
//       return {};
//     }

//     console.log('Current user ID:', userData.id);
//     console.log('Connection user1 ID:', connection.user1?.id);
//     console.log('Connection user2 ID:', connection.user2?.id);

//     // Ensure we have both users in the connection
//     if (!connection.user1 || !connection.user2) {
//       console.log('Missing user1 or user2 in connection:', connection);
//       return {};
//     }

//     // Return the user that is NOT the current user
//     if (connection.user1.id === userData.id && connection.user2.id !== userData.id) {
//       console.log('Returning user2:', connection.user2);
//       return connection.user2;
//     } else if (connection.user2.id === userData.id && connection.user1.id !== userData.id) {
//       console.log('Returning user1:', connection.user1);
//       return connection.user1;
//     } else {
//       console.warn('Invalid connection - either both users are the same or current user not found:', {
//         currentUserId: userData.id,
//         user1Id: connection.user1?.id,
//         user2Id: connection.user2?.id
//       });
//       return {};
//     }
//   };

//   const onRefresh = async () => {
//     try {
//       setRefreshing(true);
//       setError(null);
      
//       // Force refresh user data on manual refresh
//       const user = await getCurrentUser(true);
//       await loadConnections(user);
//       showToast('Connections refreshed successfully');
//     } catch (error) {
//       showToast('Unable to refresh connections', 'error');
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const filterConnections = () => {
//     if (!searchQuery.trim()) {
//       setFilteredConnections(connections);
//       return;
//     }

//     const filtered = connections.filter(connection => {
//       try {
//         const otherUser = getOtherUser(connection);
//         const fullName = `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.toLowerCase();
//         const username = otherUser.username?.toLowerCase() || '';
//         const query = searchQuery.toLowerCase();
        
//         return fullName.includes(query) || username.includes(query);
//       } catch (error) {
//         console.error('Filter error:', error);
//         return false;
//       }
//     });
//     setFilteredConnections(filtered);
//   };

//   // Show confirmation modal for removing connection
//   const showRemoveConfirmation = (connection) => {
//     const otherUser = getOtherUser(connection);
//     setConnectionToRemove({
//       id: connection.id,
//       username: otherUser.username,
//       displayName: otherUser.first_name && otherUser.last_name 
//         ? `${otherUser.first_name} ${otherUser.last_name}` 
//         : otherUser.username
//     });
//     setShowConfirmModal(true);
//   };

//   // Handle connection removal
//   const handleRemoveConnection = async () => {
//     if (!connectionToRemove) return;

//     try {
//       setLoading(true);
//       setShowConfirmModal(false);
      
//       await ConnectionAPI.removeConnection(connectionToRemove.id);
//       await loadConnections(currentUser);
      
//       showToast(`Connection with ${connectionToRemove.displayName} removed`);
//     } catch (error) {
//       console.error('Remove connection error:', error);
//       showToast('Unable to remove connection. Please try again.', 'error');
//     } finally {
//       setLoading(false);
//       setConnectionToRemove(null);
//     }
//   };

//   // Cancel connection removal
//   const handleCancelRemove = () => {
//     setShowConfirmModal(false);
//     setConnectionToRemove(null);
//   };

//   const getOtherUser = (connection) => {
//     return getOtherUserWithData(connection, currentUser);
//   };

//   const getUserProfilePicture = (user) => {
//     if (user?.profile_picture) {
//       // Check if it's already a full URL
//       if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
//         return user.profile_picture;
//       }
      
//       // Use your API base URL from config or environment
//       // const API_BASE_URL = 'http://127.0.0.1:8000'; // Replace with your actual server URL
//       // const API_BASE_URL = 'http://192.168.220.16:8000'; // Replace with your actual server URL
//       const API_BASE_URL = 'http://192.168.130.16:8000'; // Replace with your actual server URL
      
//       // Clean up the path
//       const cleanPath = user.profile_picture.startsWith('/') 
//         ? user.profile_picture 
//         : `/${user.profile_picture}`;
      
//       return `${API_BASE_URL}${cleanPath}`;
//     }
    
//     // Fallback to username-based avatar
//     return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=10b981&color=fff&size=128`;
//   };

//   // Show toast notification
//   const showToast = (message, type = 'success') => {
//     setToast({ visible: true, message, type });
//   };

//   // Hide toast notification
//   const hideToast = () => {
//     setToast({ visible: false, message: '', type: 'success' });
//   };

//   const handleRetry = () => {
//     initializeScreen();
//   };

//   // const renderConnection = ({ item, index }) => {
//   //   const otherUser = getOtherUser(item);
    
//   //   // Simplified animation style without useNativeDriver
//   //   const animatedStyle = isWeb || !fadeAnim
//   //     ? {} 
//   //     : {
//   //         opacity: fadeAnim,
//   //       };

//   //   const ComponentWrapper = isWeb ? View : Animated.View;

//   //   return (
//   //     <ComponentWrapper style={animatedStyle}>
//   //       <View style={styles.connectionCard}>
//   //         <TouchableOpacity style={styles.connectionInfo} activeOpacity={0.7}>
//   //           <View style={styles.avatarContainer}>
//   //             <Image
//   //               source={{ uri: getUserProfilePicture(otherUser) }}
//   //               style={styles.avatar}
//   //               defaultSource={{ 
//   //                 uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.username || 'User')}&background=ccc&color=fff&size=128&rounded=true` 
//   //               }}
//   //               onError={(error) => {
//   //                 console.log('Image load error for user:', otherUser.username, error);
//   //               }}
//   //             />
//   //             <View style={styles.onlineIndicator} />
//   //           </View>
//   //           <View style={styles.connectionDetails}>
//   //             {otherUser.first_name && otherUser.last_name && (
//   //               <Text style={styles.connectionName} numberOfLines={1}>
//   //                 {otherUser.first_name} {otherUser.last_name}
//   //               </Text>
//   //             )}
//   //             <Text style={styles.username} numberOfLines={1}>@{otherUser.username}</Text>
//   //             <Text style={styles.connectionTime}>
//   //               Connected {new Date(item.created_at).toLocaleDateString('en-US', {
//   //                 month: 'short',
//   //                 day: 'numeric',
//   //                 year: 'numeric'
//   //               })}
//   //             </Text>
//   //           </View>
//   //         </TouchableOpacity>
//   //         <View style={styles.actionButtons}>
//   //           <TouchableOpacity style={styles.messageButton} activeOpacity={0.7}>
//   //             <Ionicons name="chatbubble-ellipses" size={20} color="#667eea" />
//   //           </TouchableOpacity>
//   //           <TouchableOpacity
//   //             style={styles.removeButton}
//   //             activeOpacity={0.7}
//   //             onPress={() => showRemoveConfirmation(item)}
//   //           >
//   //             <Ionicons name="person-remove" size={20} color="#ff6b6b" />
//   //           </TouchableOpacity>
//   //         </View>
//   //       </View>
//   //     </ComponentWrapper>
//   //   );
//   // };


//   const renderConnection = ({ item, index }) => {
//     const otherUser = getOtherUser(item);
    
//     // CHANGED: Simplified animation - no conditional wrapper
//     return (
//       <View style={styles.connectionCard}>
//         <TouchableOpacity style={styles.connectionInfo} activeOpacity={0.7}>
//           <View style={styles.avatarContainer}>
//             <Image
//               source={{ uri: getUserProfilePicture(otherUser) }}
//               style={styles.avatar}
//               defaultSource={{ 
//                 uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.username || 'User')}&background=ccc&color=fff&size=128&rounded=true` 
//               }}
//               onError={(error) => {
//                 console.log('Image load error for user:', otherUser.username, error);
//               }}
//               // ADDED: Ensure images load properly
//               resizeMode="cover"
//             />
//             <View style={styles.onlineIndicator} />
//           </View>
//           <View style={styles.connectionDetails}>
//             {otherUser.first_name && otherUser.last_name && (
//               <Text style={styles.connectionName} numberOfLines={1}>
//                 {otherUser.first_name} {otherUser.last_name}
//               </Text>
//             )}
//             <Text style={styles.username} numberOfLines={1}>@{otherUser.username}</Text>
//             <Text style={styles.connectionTime}>
//               Connected {new Date(item.created_at).toLocaleDateString('en-US', {
//                 month: 'short',
//                 day: 'numeric',
//                 year: 'numeric'
//               })}
//             </Text>
//           </View>
//         </TouchableOpacity>
//         <View style={styles.actionButtons}>
//           <TouchableOpacity style={styles.messageButton} activeOpacity={0.7}>
//             <Ionicons name="chatbubble-ellipses" size={20} color="#667eea" />
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.removeButton}
//             activeOpacity={0.7}
//             onPress={() => showRemoveConfirmation(item)}
//           >
//             <Ionicons name="person-remove" size={20} color="#ff6b6b" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };



//   const renderHeader = () => (
//     <View style={styles.headerContainer}>
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.headerGradient}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       >
//         <View style={styles.header}>
//           {/* Enhanced Back Button */}
//           <TouchableOpacity 
//             style={styles.backButton} 
//             onPress={navigateToDashboard}
//             activeOpacity={0.8}
//           >
//             <LinearGradient
//               colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
//               style={styles.backButtonGradient}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </LinearGradient>
//           </TouchableOpacity>

//           <View style={styles.headerCenter}>
//             <Text style={styles.headerTitle}>My Connections</Text>
//             <Text style={styles.connectionCount}>
//               {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
//             </Text>
//           </View>

//           {/* Placeholder for symmetry */}
//           <View style={styles.headerPlaceholder} />
//         </View>

//         {/* Enhanced Quick Action Buttons - Now in Header */}
//         <View style={styles.quickActionsContainer}>
//           <TouchableOpacity 
//             style={styles.quickActionButton}
//             onPress={navigateToStudents}
//             activeOpacity={0.8}
//           >
//             <LinearGradient
//               colors={['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.95)']}
//               style={styles.quickActionGradient}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//             >
//               <View style={styles.quickActionIconContainer}>
//                 <Ionicons name="people" size={18} color="#667eea" />
//               </View>
//               <Text style={styles.quickActionText}>Discover</Text>
//             </LinearGradient>
//           </TouchableOpacity>

//           <TouchableOpacity 
//             style={styles.quickActionButton}
//             onPress={navigateToPendingRequests}
//             activeOpacity={0.8}
//           >
//             <LinearGradient
//               colors={['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.95)']}
//               style={styles.quickActionGradient}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//             >
//               <View style={styles.quickActionIconContainer}>
//                 <Ionicons name="time" size={18} color="#f59e0b" />
//               </View>
//               <Text style={styles.quickActionText}>Pending</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>
//     </View>
//   );

//   const renderSearchBar = () => (
//     <View style={styles.searchContainer}>
//       <View style={styles.searchInputContainer}>
//         <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search connections..."
//           placeholderTextColor="#9ca3af"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           returnKeyType="search"
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity
//             onPress={() => setSearchQuery('')}
//             style={styles.clearButton}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="close-circle" size={20} color="#9ca3af" />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );

//   const renderEmptyState = () => {
//     const EmptyStateWrapper = isWeb ? View : Animated.View;
//     const emptyAnimatedStyle = isWeb || !fadeAnim ? {} : { opacity: fadeAnim };

//     return (
//       <EmptyStateWrapper style={[styles.emptyContainer, emptyAnimatedStyle]}>
//         <View style={styles.emptyIconContainer}>
//           <Ionicons name="people-circle" size={80} color="#e5e7eb" />
//         </View>
//         <Text style={styles.emptyText}>
//           {searchQuery ? 'No matching connections' : 'No connections yet'}
//         </Text>
//         <Text style={styles.emptySubtext}>
//           {searchQuery 
//             ? 'Try adjusting your search terms'
//             : 'Start by discovering and connecting with other students'
//           }
//         </Text>
//         {!searchQuery && (
//           <TouchableOpacity 
//             style={styles.discoverButton} 
//             onPress={navigateToStudents}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.discoverButtonText}>Discover People</Text>
//           </TouchableOpacity>
//         )}
//       </EmptyStateWrapper>
//     );
//   };

//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <Ionicons name="alert-circle" size={60} color="#ff6b6b" />
//       <Text style={styles.errorText}>Something went wrong</Text>
//       <Text style={styles.errorSubtext}>{error}</Text>
//       <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
//         <Text style={styles.retryButtonText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading && connections.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading connections...</Text>
//       </View>
//     );
//   }

//   if (error && connections.length === 0) {
//     return (
//       <View style={styles.container}>
//         {renderHeader()}
//         {renderErrorState()}
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#667eea" />
//       {renderHeader()}
//       {renderSearchBar()}
      
//       <FlatList
//         data={filteredConnections}
//         renderItem={renderConnection}
//         keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.listContainer}
//         refreshControl={
//           <RefreshControl 
//             refreshing={refreshing} 
//             onRefresh={onRefresh}
//             colors={['#667eea']}
//             tintColor="#667eea"
//           />
//         }
//         ListEmptyComponent={renderEmptyState}
//         ItemSeparatorComponent={() => <View style={styles.separator} />}
//       />
      
//       {loading && connections.length > 0 && (
//         <View style={styles.loadingOverlay}>
//           <ActivityIndicator size="small" color="#667eea" />
//         </View>
//       )}

//       {/* Custom Confirmation Modal */}
//       <ConfirmationModal
//         visible={showConfirmModal}
//         onClose={handleCancelRemove}
//         onConfirm={handleRemoveConnection}
//         title="Remove Connection"
//         message={connectionToRemove ? 
//           `Are you sure you want to remove your connection with ${connectionToRemove.displayName}?` : 
//           'Are you sure you want to remove this connection?'
//         }
//         confirmText="Remove"
//         cancelText="Cancel"
//         isDestructive={true}
//       />

//       {/* Toast Notification */}
//       <Toast
//         visible={toast.visible}
//         message={toast.message}
//         type={toast.type}
//         onHide={hideToast}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   // Main Container
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },

//   // Header Styles
//   headerContainer: {
//     zIndex: 10,
//     elevation: 8,
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//   },

//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
//     paddingBottom: 20,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     marginBottom: 16,
//   },

//   backButton: {
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     overflow: 'hidden',
//   },

//   backButtonGradient: {
//     width: '100%',
//     height: '100%',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 21,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },

//   headerCenter: {
//     flex: 1,
//     alignItems: 'center',
//     marginHorizontal: 16,
//   },

//   headerTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#ffffff',
//     letterSpacing: 0.5,
//     textAlign: 'center',
//   },

//   connectionCount: {
//     fontSize: 13,
//     color: 'rgba(255, 255, 255, 0.85)',
//     marginTop: 2,
//     fontWeight: '500',
//   },

//   headerPlaceholder: {
//     width: 42,
//     height: 42,
//   },

//   // Quick Actions in Header
//   quickActionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 16,
//     paddingHorizontal: 20,
//   },

//   quickActionButton: {
//     flex: 1,
//     maxWidth: 140,
//     height: 48,
//     borderRadius: 16,
//     overflow: 'hidden',
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },

//   quickActionGradient: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 12,
//     gap: 8,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },

//   quickActionIconContainer: {
//     width: 28,
//     height: 28,
//     backgroundColor: 'rgba(102, 126, 234, 0.1)',
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   quickActionText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#1e293b',
//     letterSpacing: 0.3,
//   },

//   // Search Bar Styles
//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#f8fafc',
//   },

//   searchInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },

//   searchIcon: {
//     marginRight: 12,
//     opacity: 0.7,
//   },

//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#1e293b',
//     fontWeight: '400',
//     letterSpacing: 0.2,
//   },

//   clearButton: {
//     marginLeft: 8,
//     padding: 4,
//   },

//   // List Container
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//     flexGrow: 1,
//   },

//   // Connection Card Styles
//   connectionCard: {
//     backgroundColor: '#ffffff',
//     borderRadius: 20,
//     marginVertical: 6,
//     paddingVertical: 18,
//     paddingHorizontal: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 4,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },

//   connectionInfo: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },

//   // Avatar Styles
//   avatarContainer: {
//     position: 'relative',
//     marginRight: 16,
//   },

//   avatar: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     borderWidth: 3,
//     borderColor: '#e2e8f0',
//     backgroundColor: '#f1f5f9',
//   },

//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     backgroundColor: '#10b981',
//     borderRadius: 8,
//     borderWidth: 3,
//     borderColor: '#ffffff',
//   },

//   // Connection Details
//   connectionDetails: {
//     flex: 1,
//     justifyContent: 'center',
//   },

//   connectionName: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: '#1e293b',
//     marginBottom: 2,
//     letterSpacing: 0.2,
//   },

//   username: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#667eea',
//     marginBottom: 4,
//     letterSpacing: 0.3,
//   },

//   connectionTime: {
//     fontSize: 12,
//     color: '#64748b',
//     fontWeight: '400',
//     opacity: 0.8,
//   },

//   // Action Buttons
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },

//   messageButton: {
//     width: 40,
//     height: 40,
//     backgroundColor: 'rgba(102, 126, 234, 0.1)',
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(102, 126, 234, 0.2)',
//   },

//   removeButton: {
//     width: 40,
//     height: 40,
//     backgroundColor: 'rgba(239, 68, 68, 0.1)',
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(239, 68, 68, 0.2)',
//   },

//   // Separator
//   separator: {
//     height: 1,
//     backgroundColor: 'transparent',
//   },

//   // Loading States
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8fafc',
//     paddingHorizontal: 20,
//   },

//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#64748b',
//     fontWeight: '500',
//     textAlign: 'center',
//   },

//   loadingOverlay: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: [{ translateX: -12 }, { translateY: -12 }],
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 12,
//     padding: 12,
//     elevation: 4,
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//   },

//   // Empty State Styles
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//     paddingVertical: 40,
//   },

//   emptyIconContainer: {
//     marginBottom: 24,
//     opacity: 0.6,
//   },

//   emptyText: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1e293b',
//     textAlign: 'center',
//     marginBottom: 8,
//     letterSpacing: 0.3,
//   },

//   emptySubtext: {
//     fontSize: 15,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 32,
//     opacity: 0.8,
//   },

//   discoverButton: {
//     backgroundColor: '#667eea',
//     paddingHorizontal: 28,
//     paddingVertical: 14,
//     borderRadius: 16,
//     shadowColor: '#667eea',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     elevation: 6,
//   },

//   discoverButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#ffffff',
//     letterSpacing: 0.5,
//   },

//   // Error State Styles
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },

//   errorText: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#ef4444',
//     textAlign: 'center',
//     marginTop: 16,
//     marginBottom: 8,
//   },

//   errorSubtext: {
//     fontSize: 15,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },

//   retryButton: {
//     backgroundColor: '#ef4444',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },

//   retryButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#ffffff',
//   },

//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },

//   modalContainer: {
//     backgroundColor: '#ffffff',
//     borderRadius: 24,
//     width: '100%',
//     maxWidth: 380,
//     overflow: 'hidden',
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.2,
//     shadowRadius: 20,
//     elevation: 10,
//   },

//   modalHeader: {
//     paddingHorizontal: 24,
//     paddingTop: 24,
//     paddingBottom: 8,
//   },

//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1e293b',
//     textAlign: 'center',
//     letterSpacing: 0.3,
//   },

//   modalBody: {
//     paddingHorizontal: 24,
//     paddingBottom: 24,
//   },

//   modalMessage: {
//     fontSize: 16,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 24,
//   },

//   modalFooter: {
//     flexDirection: 'row',
//     borderTopWidth: 1,
//     borderTopColor: '#f1f5f9',
//   },

//   modalButton: {
//     flex: 1,
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   cancelButton: {
//     borderRightWidth: 1,
//     borderRightColor: '#f1f5f9',
//   },

//   confirmButton: {
//     backgroundColor: 'rgba(102, 126, 234, 0.05)',
//   },

//   destructiveButton: {
//     backgroundColor: 'rgba(239, 68, 68, 0.05)',
//   },

//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#64748b',
//   },

//   confirmButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#667eea',
//   },

//   destructiveButtonText: {
//     color: '#ef4444',
//   },

//   // Toast Styles
//   toast: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
//     left: 20,
//     right: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     borderRadius: 16,
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//     elevation: 8,
//     zIndex: 1000,
//   },

//   successToast: {
//     backgroundColor: '#10b981',
//   },

//   errorToast: {
//     backgroundColor: '#ef4444',
//   },

//   toastIcon: {
//     marginRight: 12,
//   },

//   toastText: {
//     flex: 1,
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#ffffff',
//     letterSpacing: 0.2,
//   },
// });






// const styles = StyleSheet.create({
//   // Main Container
//   container: {
//     flex: 1,
//     backgroundColor: '#0f172a', // Dark slate background
//   },

//   // Loading States
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#0f172a',
//     paddingHorizontal: 20,
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#64748b',
//     fontWeight: '500',
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(15, 23, 42, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 1000,
//   },

//   // Header Styles
//   headerContainer: {
//     paddingBottom: 0,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
//     paddingBottom: 24,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     marginBottom: 20,
//   },
//   backButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     overflow: 'hidden',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   backButtonGradient: {
//     width: '100%',
//     height: '100%',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 22,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   headerCenter: {
//     flex: 1,
//     alignItems: 'center',
//     marginHorizontal: 16,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#ffffff',
//     textAlign: 'center',
//     textShadowColor: 'rgba(0, 0, 0, 0.3)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
//   connectionCount: {
//     fontSize: 14,
//     color: 'rgba(255, 255, 255, 0.85)',
//     marginTop: 4,
//     fontWeight: '500',
//   },
//   headerPlaceholder: {
//     width: 44,
//     height: 44,
//   },

//   // Quick Actions
//   quickActionsContainer: {
//     flexDirection: 'row',
//     paddingHorizontal: 20,
//     gap: 12,
//   },
//   quickActionButton: {
//     flex: 1,
//     borderRadius: 16,
//     overflow: 'hidden',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   quickActionGradient: {
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(102, 126, 234, 0.2)',
//   },
//   quickActionIconContainer: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: 'rgba(102, 126, 234, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 10,
//   },
//   quickActionText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#1e293b',
//   },

//   // Search Bar
//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#0f172a',
//   },
//   searchInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#1e293b',
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: '#334155',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.15,
//     shadowRadius: 3,
//   },
//   searchIcon: {
//     marginRight: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#e2e8f0',
//     fontWeight: '400',
//   },
//   clearButton: {
//     padding: 4,
//     marginLeft: 8,
//   },

//   // List Container
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//     flexGrow: 1,
//   },
//   separator: {
//     height: 12,
//   },

//   // Connection Cards
//   connectionCard: {
//     backgroundColor: '#1e293b',
//     borderRadius: 20,
//     padding: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     borderWidth: 1,
//     borderColor: '#334155',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     marginVertical: 0,
//   },
//   connectionInfo: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginRight: 16,
//   },
//   avatar: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     borderWidth: 3,
//     borderColor: '#667eea',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#10b981',
//     borderWidth: 2,
//     borderColor: '#1e293b',
//   },
//   connectionDetails: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   connectionName: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#f1f5f9',
//     marginBottom: 2,
//   },
//   username: {
//     fontSize: 14,
//     color: '#94a3b8',
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   connectionTime: {
//     fontSize: 12,
//     color: '#64748b',
//     fontWeight: '400',
//   },

//   // Action Buttons
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   messageButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(102, 126, 234, 0.15)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(102, 126, 234, 0.3)',
//   },
//   removeButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(239, 68, 68, 0.15)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(239, 68, 68, 0.3)',
//   },

//   // Empty State
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     paddingVertical: 60,
//   },
//   emptyIconContainer: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: '#1e293b',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 24,
//     borderWidth: 2,
//     borderColor: '#334155',
//   },
//   emptyText: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#f1f5f9',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#94a3b8',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 32,
//   },
//   discoverButton: {
//     backgroundColor: '#667eea',
//     paddingHorizontal: 32,
//     paddingVertical: 16,
//     borderRadius: 16,
//     elevation: 4,
//     shadowColor: '#667eea',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   discoverButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#ffffff',
//     textAlign: 'center',
//   },

//   // Error State
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   errorText: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#f1f5f9',
//     textAlign: 'center',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorSubtext: {
//     fontSize: 16,
//     color: '#94a3b8',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 32,
//   },
//   retryButton: {
//     backgroundColor: '#667eea',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//     elevation: 3,
//     shadowColor: '#667eea',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   retryButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#ffffff',
//   },

//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#1e293b',
//     borderRadius: 24,
//     width: '100%',
//     maxWidth: 340,
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.4,
//     shadowRadius: 16,
//     borderWidth: 1,
//     borderColor: '#334155',
//   },
//   modalHeader: {
//     padding: 24,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#334155',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#f1f5f9',
//     textAlign: 'center',
//   },
//   modalBody: {
//     padding: 24,
//     paddingVertical: 20,
//   },
//   modalMessage: {
//     fontSize: 16,
//     color: '#94a3b8',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     padding: 20,
//     paddingTop: 16,
//     gap: 12,
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//   },
//   cancelButton: {
//     backgroundColor: '#374151',
//     borderWidth: 1,
//     borderColor: '#4b5563',
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#d1d5db',
//   },
//   confirmButton: {
//     backgroundColor: '#667eea',
//   },
//   confirmButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#ffffff',
//   },
//   destructiveButton: {
//     backgroundColor: '#ef4444',
//   },
//   destructiveButtonText: {
//     color: '#ffffff',
//   },

//   // Toast Styles
//   toast: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
//     left: 20,
//     right: 20,
//     borderRadius: 16,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     zIndex: 2000,
//   },
//   successToast: {
//     backgroundColor: '#059669',
//     borderLeftWidth: 4,
//     borderLeftColor: '#10b981',
//   },
//   errorToast: {
//     backgroundColor: '#dc2626',
//     borderLeftWidth: 4,
//     borderLeftColor: '#ef4444',
//   },
//   toastIcon: {
//     marginRight: 12,
//   },
//   toastText: {
//     flex: 1,
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#ffffff',
//     lineHeight: 20,
//   },

//   // Responsive Design
//   ...(width < 375 ? {
//     // Small phone adjustments
//     connectionCard: {
//       padding: 16,
//     },
//     avatar: {
//       width: 48,
//       height: 48,
//       borderRadius: 24,
//     },
//     connectionName: {
//       fontSize: 16,
//     },
//     headerTitle: {
//       fontSize: 20,
//     },
//     quickActionGradient: {
//       paddingVertical: 12,
//       paddingHorizontal: 16,
//     },
//   } : {}),

//   ...(width > 414 ? {
//     // Large phone adjustments
//     connectionCard: {
//       padding: 24,
//     },
//     avatar: {
//       width: 64,
//       height: 64,
//       borderRadius: 32,
//     },
//     connectionName: {
//       fontSize: 19,
//     },
//     listContainer: {
//       paddingHorizontal: 24,
//     },
//     searchContainer: {
//       paddingHorizontal: 24,
//     },
//   } : {}),
// });



















// Add the styles object at the end of the file
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8fafc',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#64748b',
//     fontWeight: '500',
//   },
//   headerContainer: {
//     paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
//   },
//   headerGradient: {
//     paddingBottom: 24,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingTop: 16,
//     paddingBottom: 8,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     overflow: 'hidden',
//   },
//   backButtonGradient: {
//     width: '100%',
//     height: '100%',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   headerCenter: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 2,
//   },
//   connectionCount: {
//     fontSize: 14,
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontWeight: '500',
//   },
//   headerPlaceholder: {
//     width: 40,
//   },
//   quickActionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 8,
//     gap: 12,
//   },
//   quickActionButton: {
//     flex: 1,
//     maxWidth: 140,
//     height: 50,
//     borderRadius: 16,
//     overflow: 'hidden',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   quickActionGradient: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 12,
//     gap: 8,
//   },
//   quickActionIconContainer: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     backgroundColor: 'rgba(102, 126, 234, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   quickActionText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#374151',
//   },
//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#f8fafc',
//   },
//   searchInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//   },
//   searchIcon: {
//     marginRight: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#374151',
//     fontWeight: '500',
//   },
//   clearButton: {
//     padding: 4,
//   },
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//     flexGrow: 1,
//   },
//   connectionCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 3,
//   },
//   connectionInfo: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginRight: 16,
//   },
//   avatar: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#e5e7eb',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#10b981',
//     borderWidth: 2,
//     borderColor: '#fff',
//     },
//   connectionDetails: {
//     flex: 1,
//   },
//   connectionName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1f2937',
//     marginBottom: 2,
//   },
//   username: {
//     fontSize: 14,
//     color: '#6b7280',
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   connectionTime: {
//     fontSize: 12,
//     color: '#9ca3af',
//     fontWeight: '400',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   messageButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(102, 126, 234, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   removeButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255, 107, 107, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   separator: {
//     height: 1,
//     backgroundColor: '#f3f4f6',
//     marginHorizontal: 16,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     paddingTop: 60,
//   },
//   emptyIconContainer: {
//     marginBottom: 24,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#374151',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 32,
//   },
//   discoverButton: {
//     backgroundColor: '#667eea',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 25,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   discoverButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   errorText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#374151',
//     textAlign: 'center',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorSubtext: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: '#667eea',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 25,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     width: '100%',
//     maxWidth: 400,
//     overflow: 'hidden',
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   modalHeader: {
//     padding: 20,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f3f4f6',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1f2937',
//     textAlign: 'center',
//   },
//   modalBody: {
//     padding: 20,
//     paddingTop: 16,
//     paddingBottom: 24,
//   },
//   modalMessage: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     borderTopWidth: 1,
//     borderTopColor: '#f3f4f6',
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   cancelButton: {
//     borderRightWidth: 1,
//     borderRightColor: '#f3f4f6',
//   },
//   confirmButton: {
//     backgroundColor: '#667eea',
//   },
//   destructiveButton: {
//     backgroundColor: '#ff6b6b',
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#6b7280',
//   },
//   confirmButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   destructiveButtonText: {
//     color: '#fff',
//   },
//   // Toast Styles
//   toast: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 60 : 40,
//     left: 20,
//     right: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     borderRadius: 12,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     zIndex: 1000,
//   },
//   successToast: {
//     backgroundColor: '#10b981',
//   },
//   errorToast: {
//     backgroundColor: '#ff6b6b',
//   },
//   toastIcon: {
//     marginRight: 12,
//   },
//   toastText: {
//     flex: 1,
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#fff',
//   },
// });
















































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   RefreshControl,
//   TextInput,
//   ActivityIndicator,
//   Animated,
//   Platform,
//   StatusBar,
//   Dimensions,
//   Modal,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import ConnectionAPI from '../api/connectionService';
// import useCurrentUser from '../api/useCurrentUser'

// const { width } = Dimensions.get('window');
// const isWeb = Platform.OS === 'web';

// // Custom Confirmation Modal Component
// const ConfirmationModal = ({ 
//   visible, 
//   onClose, 
//   onConfirm, 
//   title, 
//   message, 
//   confirmText = 'Confirm',
//   cancelText = 'Cancel',
//   isDestructive = false 
// }) => {
//   return (
//     <Modal
//       visible={visible}
//       transparent={true}
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>{title}</Text>
//           </View>
          
//           <View style={styles.modalBody}>
//             <Text style={styles.modalMessage}>{message}</Text>
//           </View>
          
//           <View style={styles.modalFooter}>
//             <TouchableOpacity
//               style={[styles.modalButton, styles.cancelButton]}
//               onPress={onClose}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.cancelButtonText}>{cancelText}</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.modalButton, 
//                 isDestructive ? styles.destructiveButton : styles.confirmButton
//               ]}
//               onPress={onConfirm}
//               activeOpacity={0.8}
//             >
//               <Text style={[
//                 styles.confirmButtonText,
//                 isDestructive && styles.destructiveButtonText
//               ]}>
//                 {confirmText}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// // Success/Error Toast Component
// const Toast = ({ visible, message, type = 'success', onHide }) => {
//   useEffect(() => {
//     if (visible) {
//       const timer = setTimeout(() => {
//         onHide();
//       }, 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [visible, onHide]);

//   if (!visible) return null;

//   return (
//     <View style={[
//       styles.toast,
//       type === 'error' ? styles.errorToast : styles.successToast
//     ]}>
//       <Ionicons 
//         name={type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
//         size={20} 
//         color="#fff" 
//         style={styles.toastIcon}
//       />
//       <Text style={styles.toastText}>{message}</Text>
//     </View>
//   );
// };

// export default function ConnectionsScreen({ navigation }) {
//   const [connections, setConnections] = useState([]);
//   const [filteredConnections, setFilteredConnections] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [refreshing, setRefreshing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [error, setError] = useState(null);
  
//   // Modal states
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [connectionToRemove, setConnectionToRemove] = useState(null);
  
//   // Toast states
//   const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

//   const fadeAnim = isWeb ? null : new Animated.Value(0);
//   const slideAnim = isWeb ? null : new Animated.Value(0);

//   useEffect(() => {
//     initializeScreen();
//   }, []);

//   useEffect(() => {
//     filterConnections();
//   }, [searchQuery, connections]);

//   useEffect(() => {
//     if (!loading && !isWeb && fadeAnim && slideAnim) {
//       Animated.parallel([
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 600,
//           useNativeDriver: true,
//         }),
//         Animated.timing(slideAnim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     }
//   }, [loading]);

//   // Navigation handlers
//   const navigateToStudents = () => {
//     if (navigation) {
//       navigation.navigate('connections/students');
//     } else {
//       // For web or other platforms without navigation prop
//       window.location.href = '/connections/students';
//     }
//   };

//   const navigateToPendingRequests = () => {
//     if (navigation) {
//       navigation.navigate('connections/pending-requests');
//     } else {
//       // For web or other platforms without navigation prop
//       window.location.href = '/connections/pending-requests';
//     }
//   };

//   // Updated navigation handler for connection screen
//   // const navigateToConnectionScreen = () => {
//   //   if (navigation) {
//   //     navigation.navigate('connections/connection-screen');
//   //   } else {
//   //     // For web or other platforms without navigation prop
//   //     window.location.href = '/connections/connection-screen';
//   //   }
//   // };

//   const navigateToDashboard = () => {
//     if (navigation) {
//       navigation.navigate('auth/dashboard');
//     } else {
//       // For web or other platforms without navigation prop
//       window.location.href = '/auth/dashboard';
//     }
//   };

//   const initializeScreen = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       // Force refresh user data from API (don't use cache on initial load)
//       const user = await getCurrentUser(true); // Pass true to force refresh
      
//       // Now load connections with the fresh user data
//       await loadConnections(user);
      
//     } catch (error) {
//       console.error('Initialize screen error:', error);
//       setError('Failed to initialize screen. Please try again.');
//       showToast('Initialization Error: Failed to load screen data', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getCurrentUser = async (forceRefresh = false) => {
//     try {
//       // If force refresh is requested, clear cache first
//       if (forceRefresh) {
//         await AsyncStorage.removeItem('currentUser');
//         console.log('Cleared cached user data for fresh login');
//       }

//       // Try to get from AsyncStorage first (cached user data)
//       if (!forceRefresh) {
//         const cachedUser = await AsyncStorage.getItem('currentUser');
//         if (cachedUser) {
//           const user = JSON.parse(cachedUser);
//           setCurrentUser(user);
//           console.log('Using cached user:', user);
//           return user;
//         }
//       }

//       // Fetch fresh data from API
//       console.log('Fetching user from API...');
//       const userData = await ConnectionAPI.getCurrentUser();
      
//       // Cache the fresh user data
//       await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
//       setCurrentUser(userData);
//       console.log('Fetched and cached fresh user from API:', userData);
//       return userData;

//     } catch (error) {
//       console.error('Error getting current user:', error);
      
//       // If API fails and we're not forcing refresh, try to use cached data as fallback
//       if (!forceRefresh) {
//         try {
//           const cachedUser = await AsyncStorage.getItem('currentUser');
//           if (cachedUser) {
//             const user = JSON.parse(cachedUser);
//             setCurrentUser(user);
//             console.log('Using cached user as fallback:', user);
//             return user;
//           }
//         } catch (cacheError) {
//           console.error('Cache fallback failed:', cacheError);
//         }
//       }
      
//       throw error;
//     }
//   };

//   const loadConnections = async (user = null) => {
//     try {
//       setError(null);
//       const data = await ConnectionAPI.getMyConnections();
      
//       // Use the passed user or fallback to state
//       const currentUserData = user || currentUser;
      
//       if (!currentUserData) {
//         console.error('No current user data available for filtering connections');
//         setConnections([]);
//         return [];
//       }
      
//       // Filter out invalid connections and self-connections
//       const validConnections = (data || []).filter(connection => {
//         // Check if connection has both users
//         if (!connection.user1 || !connection.user2) {
//           console.log('Missing user1 or user2 in connection:', connection);
//           return false;
//         }

//         // Check if current user is one of the users in the connection
//         const isCurrentUserInConnection = 
//           connection.user1.id === currentUserData.id || 
//           connection.user2.id === currentUserData.id;

//         if (!isCurrentUserInConnection) {
//           console.log('Current user not found in connection:', {
//             connectionId: connection.id,
//             currentUserId: currentUserData.id,
//             user1Id: connection.user1.id,
//             user2Id: connection.user2.id
//           });
//           return false;
//         }

//         // Prevent self-connections (user connected to themselves)
//         if (connection.user1.id === connection.user2.id) {
//           console.log('Filtering out self-connection:', connection);
//           return false;
//         }

//         // Get the other user and validate
//         const otherUser = getOtherUserWithData(connection, currentUserData);
//         const isValid = otherUser && otherUser.id && otherUser.username && otherUser.id !== currentUserData.id;
        
//         if (!isValid) {
//           console.log('Invalid other user or self-connection detected:', {
//             otherUser,
//             currentUserId: currentUserData.id
//           });
//         }

//         return isValid;
//       });

//       console.log('Total connections from API:', data?.length || 0);
//       console.log('Valid connections after filtering:', validConnections.length);
//       console.log('Current user for filtering:', currentUserData);
      
//       setConnections(validConnections);
//       return validConnections;
//     } catch (error) {
//       console.error('Load connections error:', error);
//       setError('Unable to load connections');
//       throw error;
//     }
//   };

//   const getOtherUserWithData = (connection, userData) => {
//     if (!userData || !connection) {
//       console.log('Missing userData or connection:', { userData, connection });
//       return {};
//     }

//     console.log('Current user ID:', userData.id);
//     console.log('Connection user1 ID:', connection.user1?.id);
//     console.log('Connection user2 ID:', connection.user2?.id);

//     // Ensure we have both users in the connection
//     if (!connection.user1 || !connection.user2) {
//       console.log('Missing user1 or user2 in connection:', connection);
//       return {};
//     }

//     // Return the user that is NOT the current user
//     if (connection.user1.id === userData.id && connection.user2.id !== userData.id) {
//       console.log('Returning user2:', connection.user2);
//       return connection.user2;
//     } else if (connection.user2.id === userData.id && connection.user1.id !== userData.id) {
//       console.log('Returning user1:', connection.user1);
//       return connection.user1;
//     } else {
//       console.warn('Invalid connection - either both users are the same or current user not found:', {
//         currentUserId: userData.id,
//         user1Id: connection.user1?.id,
//         user2Id: connection.user2?.id
//       });
//       return {};
//     }
//   };

//   const onRefresh = async () => {
//     try {
//       setRefreshing(true);
//       setError(null);
      
//       // Force refresh user data on manual refresh
//       const user = await getCurrentUser(true);
//       await loadConnections(user);
//       showToast('Connections refreshed successfully');
//     } catch (error) {
//       showToast('Unable to refresh connections', 'error');
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const filterConnections = () => {
//     if (!searchQuery.trim()) {
//       setFilteredConnections(connections);
//       return;
//     }

//     const filtered = connections.filter(connection => {
//       try {
//         const otherUser = getOtherUser(connection);
//         const fullName = `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.toLowerCase();
//         const username = otherUser.username?.toLowerCase() || '';
//         const query = searchQuery.toLowerCase();
        
//         return fullName.includes(query) || username.includes(query);
//       } catch (error) {
//         console.error('Filter error:', error);
//         return false;
//       }
//     });
//     setFilteredConnections(filtered);
//   };

//   // Show confirmation modal for removing connection
//   const showRemoveConfirmation = (connection) => {
//     const otherUser = getOtherUser(connection);
//     setConnectionToRemove({
//       id: connection.id,
//       username: otherUser.username,
//       displayName: otherUser.first_name && otherUser.last_name 
//         ? `${otherUser.first_name} ${otherUser.last_name}` 
//         : otherUser.username
//     });
//     setShowConfirmModal(true);
//   };

//   // Handle connection removal
//   const handleRemoveConnection = async () => {
//     if (!connectionToRemove) return;

//     try {
//       setLoading(true);
//       setShowConfirmModal(false);
      
//       await ConnectionAPI.removeConnection(connectionToRemove.id);
//       await loadConnections(currentUser);
      
//       showToast(`Connection with ${connectionToRemove.displayName} removed`);
//     } catch (error) {
//       console.error('Remove connection error:', error);
//       showToast('Unable to remove connection. Please try again.', 'error');
//     } finally {
//       setLoading(false);
//       setConnectionToRemove(null);
//     }
//   };

//   // Cancel connection removal
//   const handleCancelRemove = () => {
//     setShowConfirmModal(false);
//     setConnectionToRemove(null);
//   };

//   const getOtherUser = (connection) => {
//     return getOtherUserWithData(connection, currentUser);
//   };

//   // Enhanced function to get user profile picture
//   // const getUserProfilePicture = (user) => {
//   //   // Check if user has profile_picture field from Django AbstractUser
//   //   if (user?.profile_picture) {
//   //     // Handle both full URLs and relative paths
//   //     if (user.profile_picture.startsWith('http')) {
//   //       return user.profile_picture;
//   //     } else {
//   //       // Assuming your Django media files are served from /media/
//   //       return `${ConnectionAPI.baseURL || ''}/media/${user.profile_picture}`;
//   //     }
//   //   }
    
//   //   // Fallback to generated avatar using username
//   //   const username = user?.username || 'User';
//   //   return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=667eea&color=fff&size=128&rounded=true`;
//   // };


//   const getUserProfilePicture = (user) => {
//     if (user?.profile_picture) {
//       // Check if it's already a full URL
//       if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
//         return user.profile_picture;
//       }
      
//       // Use your API base URL from config or environment
//       // const API_BASE_URL = process.env.REACT_NATIVE_API_URL || 'http://localhost:8000';
//       const API_BASE_URL = 'http://127.0.0.1:8000'; // Replace with your actual server URL
      
//       // Clean up the path
//       const cleanPath = user.profile_picture.startsWith('/') 
//         ? user.profile_picture 
//         : `/${user.profile_picture}`;
      
//       return `${API_BASE_URL}${cleanPath}`;
//     }
    
//     // Fallback to username-based avatar
//     return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=10b981&color=fff&size=128`;
//   };







//   // Show toast notification
//   const showToast = (message, type = 'success') => {
//     setToast({ visible: true, message, type });
//   };

//   // Hide toast notification
//   const hideToast = () => {
//     setToast({ visible: false, message: '', type: 'success' });
//   };

//   const handleRetry = () => {
//     initializeScreen();
//   };

//   const renderConnection = ({ item, index }) => {
//     const otherUser = getOtherUser(item);
    
//     // Platform-specific animation handling
//     const animatedStyle = isWeb 
//       ? {} 
//       : {
//           opacity: fadeAnim,
//           transform: [{
//             translateY: fadeAnim.interpolate({
//               inputRange: [0, 1],
//               outputRange: [20, 0],
//             }),
//           }],
//         };

//     const ComponentWrapper = isWeb ? View : Animated.View;

//     return (
//       <ComponentWrapper style={animatedStyle}>
//         <View style={styles.connectionCard}>
//           <TouchableOpacity style={styles.connectionInfo} activeOpacity={0.7}>
//             <View style={styles.avatarContainer}>
//               <Image
//                 source={{ uri: getUserProfilePicture(otherUser) }}
//                 style={styles.avatar}
//                 defaultSource={{ 
//                   uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.username || 'User')}&background=ccc&color=fff&size=128&rounded=true` 
//                 }}
//                 onError={(error) => {
//                   console.log('Image load error for user:', otherUser.username, error);
//                 }}
//               />
//               <View style={styles.onlineIndicator} />
//             </View>
//             <View style={styles.connectionDetails}>
//               {otherUser.first_name && otherUser.last_name && (
//                 <Text style={styles.connectionName} numberOfLines={1}>
//                   {otherUser.first_name} {otherUser.last_name}
//                 </Text>
//               )}
//               <Text style={styles.username} numberOfLines={1}>@{otherUser.username}</Text>
//               <Text style={styles.connectionTime}>
//                 Connected {new Date(item.created_at).toLocaleDateString('en-US', {
//                   month: 'short',
//                   day: 'numeric',
//                   year: 'numeric'
//                 })}
//               </Text>
//             </View>
//           </TouchableOpacity>
//           <View style={styles.actionButtons}>
//             <TouchableOpacity style={styles.messageButton} activeOpacity={0.7}>
//               <Ionicons name="chatbubble-ellipses" size={20} color="#667eea" />
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.removeButton}
//               activeOpacity={0.7}
//               onPress={() => showRemoveConfirmation(item)}
//             >
//               <Ionicons name="person-remove" size={20} color="#ff6b6b" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </ComponentWrapper>
//     );
//   };

//   const renderHeader = () => (
//     <View style={styles.headerContainer}>
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.headerGradient}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       >
//         <View style={styles.header}>
//           {/* Enhanced Back Button */}
//           <TouchableOpacity 
//             style={styles.backButton} 
//             onPress={navigateToDashboard}
//             // onPress={navigateToConnectionScreen}
//             activeOpacity={0.8}
//           >
//             <LinearGradient
//               colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
//               style={styles.backButtonGradient}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </LinearGradient>
//           </TouchableOpacity>

//           <View style={styles.headerCenter}>
//             <Text style={styles.headerTitle}>My Connections</Text>
//             <Text style={styles.connectionCount}>
//               {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
//             </Text>
//           </View>

//           {/* Placeholder for symmetry */}
//           <View style={styles.headerPlaceholder} />
//         </View>

//         {/* Enhanced Quick Action Buttons - Now in Header */}
//         <View style={styles.quickActionsContainer}>
//           <TouchableOpacity 
//             style={styles.quickActionButton}
//             onPress={navigateToStudents}
//             activeOpacity={0.8}
//           >
//             <LinearGradient
//               colors={['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.95)']}
//               style={styles.quickActionGradient}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//             >
//               <View style={styles.quickActionIconContainer}>
//                 <Ionicons name="people" size={18} color="#667eea" />
//               </View>
//               <Text style={styles.quickActionText}>Discover</Text>
//             </LinearGradient>
//           </TouchableOpacity>

//           <TouchableOpacity 
//             style={styles.quickActionButton}
//             onPress={navigateToPendingRequests}
//             activeOpacity={0.8}
//           >
//             <LinearGradient
//               colors={['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.95)']}
//               style={styles.quickActionGradient}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//             >
//               <View style={styles.quickActionIconContainer}>
//                 <Ionicons name="time" size={18} color="#f59e0b" />
//               </View>
//               <Text style={styles.quickActionText}>Pending</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>
//     </View>
//   );

//   const renderSearchBar = () => (
//     <View style={styles.searchContainer}>
//       <View style={styles.searchInputContainer}>
//         <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search connections..."
//           placeholderTextColor="#9ca3af"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           returnKeyType="search"
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity
//             onPress={() => setSearchQuery('')}
//             style={styles.clearButton}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="close-circle" size={20} color="#9ca3af" />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );

//   const renderEmptyState = () => {
//     const EmptyStateWrapper = isWeb ? View : Animated.View;
//     const emptyAnimatedStyle = isWeb ? {} : { opacity: fadeAnim };

//     return (
//       <EmptyStateWrapper style={[styles.emptyContainer, emptyAnimatedStyle]}>
//         <View style={styles.emptyIconContainer}>
//           <Ionicons name="people-circle" size={80} color="#e5e7eb" />
//         </View>
//         <Text style={styles.emptyText}>
//           {searchQuery ? 'No matching connections' : 'No connections yet'}
//         </Text>
//         <Text style={styles.emptySubtext}>
//           {searchQuery 
//             ? 'Try adjusting your search terms'
//             : 'Start by discovering and connecting with other students'
//           }
//         </Text>
//         {!searchQuery && (
//           <TouchableOpacity 
//             style={styles.discoverButton} 
//             onPress={navigateToStudents}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.discoverButtonText}>Discover People</Text>
//           </TouchableOpacity>
//         )}
//       </EmptyStateWrapper>
//     );
//   };

//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <Ionicons name="alert-circle" size={60} color="#ff6b6b" />
//       <Text style={styles.errorText}>Something went wrong</Text>
//       <Text style={styles.errorSubtext}>{error}</Text>
//       <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
//         <Text style={styles.retryButtonText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading && connections.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading connections...</Text>
//       </View>
//     );
//   }

//   if (error && connections.length === 0) {
//     return (
//       <View style={styles.container}>
//         {renderHeader()}
//         {renderErrorState()}
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#667eea" />
//       {renderHeader()}
//       {renderSearchBar()}
      
//       <FlatList
//         data={filteredConnections}
//         renderItem={renderConnection}
//         keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.listContainer}
//         refreshControl={
//           <RefreshControl 
//             refreshing={refreshing} 
//             onRefresh={onRefresh}
//             colors={['#667eea']}
//             tintColor="#667eea"
//           />
//         }
//         ListEmptyComponent={renderEmptyState}
//         ItemSeparatorComponent={() => <View style={styles.separator} />}
//       />
      
//       {loading && connections.length > 0 && (
//         <View style={styles.loadingOverlay}>
//           <ActivityIndicator size="small" color="#667eea" />
//         </View>
//       )}

//       {/* Custom Confirmation Modal */}
//       <ConfirmationModal
//         visible={showConfirmModal}
//         onClose={handleCancelRemove}
//         onConfirm={handleRemoveConnection}
//         title="Remove Connection"
//         message={connectionToRemove ? 
//           `Are you sure you want to remove your connection with ${connectionToRemove.displayName}?` : 
//           'Are you sure you want to remove this connection?'
//         }
//         confirmText="Remove"
//         cancelText="Cancel"
//         isDestructive={true}
//       />

//       {/* Toast Notification */}
//       <Toast
//         visible={toast.visible}
//         message={toast.message}
//         type={toast.type}
//         onHide={hideToast}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   headerContainer: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 50 : 20,
//     paddingBottom: 20,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     marginBottom: 16,
//   },
//   backButton: {
//     borderRadius: 14,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   backButtonGradient: {
//     borderRadius: 14,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.4)',
//   },
//   headerCenter: {
//     flex: 1,
//     alignItems: 'center',
//     marginHorizontal: 16,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   connectionCount: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontWeight: '500',
//   },
//   headerPlaceholder: {
//     width: 52, // Same width as back button for symmetry
//   },
  
//   // Enhanced Quick Actions in Header
//   quickActionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     paddingHorizontal: 24,
//     gap: 16,
//   },
//   quickActionButton: {
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   quickActionGradient: {
//     borderRadius: 16,
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//     minWidth: 110,
//     justifyContent: 'center',
//   },
//   quickActionIconContainer: {
//     backgroundColor: '#f8fafc',
//     borderRadius: 8,
//     padding: 6,
//     marginRight: 8,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   quickActionText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#374151',
//   },

//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#f8fafc',
//   },
//   searchInputContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//   },
//   searchIcon: {
//     marginRight: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#374151',
//     fontWeight: '500',
//   },
//   clearButton: {
//     padding: 4,
//   },
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },
//   connectionCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//     marginVertical: 6,
//   },
//   connectionInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginRight: 16,
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#e5e7eb',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 14,
//     height: 14,
//     borderRadius: 7,
//     backgroundColor: '#10b981',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   connectionDetails: {
//     flex: 1,
//   },
//   connectionName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1f2937',
//     marginBottom: 2,
//   },
//   username: {
//     fontSize: 14,
//     color: '#6b7280',
//     fontWeight: '500',
//     marginBottom: 2,
//   },
//   connectionTime: {
//     fontSize: 12,
//     color: '#9ca3af',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   messageButton: {
//     backgroundColor: '#f0f4ff',
//     borderRadius: 10,
//     padding: 10,
//     borderWidth: 1,
//     borderColor: '#e0e7ff',
//   },
//   removeButton: {
//     backgroundColor: '#fef2f2',
//     borderRadius: 10,
//     padding: 10,
//     borderWidth: 1,
//     borderColor: '#fecaca',
//   },
//   separator: {
//     height: 8,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8fafc',
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#6b7280',
//     fontWeight: '500',
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//     paddingHorizontal: 32,
//   },
//   emptyIconContainer: {
//     marginBottom: 24,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#374151',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 32,
//   },
//   discoverButton: {
//     backgroundColor: '#667eea',
//     borderRadius: 12,
//     paddingVertical: 14,
//     paddingHorizontal: 28,
//     shadowColor: '#667eea',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   discoverButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   errorText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#374151',
//     textAlign: 'center',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorSubtext: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 32,
//   },
//   retryButton: {
//     backgroundColor: '#667eea',
//     borderRadius: 12,
//     paddingVertical: 14,
//     paddingHorizontal: 28,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // Modal styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     width: '100%',
//     maxWidth: 400,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.25,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   modalHeader: {
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f1f5f9',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1f2937',
//     textAlign: 'center',
//   },
//   modalBody: {
//     padding: 20,
//   },
//   modalMessage: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     borderTopWidth: 1,
//     borderTopColor: '#f1f5f9',
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cancelButton: {
//     borderRightWidth: 1,
//     borderRightColor: '#f1f5f9',
//   },
//   confirmButton: {
//     backgroundColor: '#667eea',
//   },
//   destructiveButton: {
//     backgroundColor: '#ff6b6b',
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#6b7280',
//   },
//   confirmButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   destructiveButtonText: {
//     color: '#fff',
//   },
//   // Toast styles
//   toast: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 60 : 40,
//     left: 20,
//     right: 20,
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 6,
//     zIndex: 1000,
//   },
//   successToast: {
//     backgroundColor: '#10b981',
//   },
//   errorToast: {
//     backgroundColor: '#ff6b6b',
//   },
//   toastIcon: {
//     marginRight: 12,
//   },
//   toastText: {
//     flex: 1,
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#fff',
//   },
// });































































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   RefreshControl,
//   TextInput,
//   ActivityIndicator,
//   Animated,
//   Platform,
//   StatusBar,
//   Dimensions,
//   Modal,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import ConnectionAPI from '../api/connectionService';
// import useCurrentUser from '../api/useCurrentUser'

// const { width } = Dimensions.get('window');
// const isWeb = Platform.OS === 'web';

// // Custom Confirmation Modal Component
// const ConfirmationModal = ({ 
//   visible, 
//   onClose, 
//   onConfirm, 
//   title, 
//   message, 
//   confirmText = 'Confirm',
//   cancelText = 'Cancel',
//   isDestructive = false 
// }) => {
//   return (
//     <Modal
//       visible={visible}
//       transparent={true}
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>{title}</Text>
//           </View>
          
//           <View style={styles.modalBody}>
//             <Text style={styles.modalMessage}>{message}</Text>
//           </View>
          
//           <View style={styles.modalFooter}>
//             <TouchableOpacity
//               style={[styles.modalButton, styles.cancelButton]}
//               onPress={onClose}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.cancelButtonText}>{cancelText}</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.modalButton, 
//                 isDestructive ? styles.destructiveButton : styles.confirmButton
//               ]}
//               onPress={onConfirm}
//               activeOpacity={0.8}
//             >
//               <Text style={[
//                 styles.confirmButtonText,
//                 isDestructive && styles.destructiveButtonText
//               ]}>
//                 {confirmText}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// // Success/Error Toast Component
// const Toast = ({ visible, message, type = 'success', onHide }) => {
//   useEffect(() => {
//     if (visible) {
//       const timer = setTimeout(() => {
//         onHide();
//       }, 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [visible, onHide]);

//   if (!visible) return null;

//   return (
//     <View style={[
//       styles.toast,
//       type === 'error' ? styles.errorToast : styles.successToast
//     ]}>
//       <Ionicons 
//         name={type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
//         size={20} 
//         color="#fff" 
//         style={styles.toastIcon}
//       />
//       <Text style={styles.toastText}>{message}</Text>
//     </View>
//   );
// };

// export default function ConnectionsScreen({ navigation }) {
//   const [connections, setConnections] = useState([]);
//   const [filteredConnections, setFilteredConnections] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [refreshing, setRefreshing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [error, setError] = useState(null);
  
//   // Modal states
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [connectionToRemove, setConnectionToRemove] = useState(null);
  
//   // Toast states
//   const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

//   const fadeAnim = isWeb ? null : new Animated.Value(0);
//   const slideAnim = isWeb ? null : new Animated.Value(0);

//   useEffect(() => {
//     initializeScreen();
//   }, []);

//   useEffect(() => {
//     filterConnections();
//   }, [searchQuery, connections]);

//   useEffect(() => {
//     if (!loading && !isWeb && fadeAnim && slideAnim) {
//       Animated.parallel([
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 600,
//           useNativeDriver: true,
//         }),
//         Animated.timing(slideAnim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     }
//   }, [loading]);

//   // Navigation handlers
//   const navigateToStudents = () => {
//     if (navigation) {
//       navigation.navigate('connections/students');
//     } else {
//       // For web or other platforms without navigation prop
//       window.location.href = '/connections/students';
//     }
//   };

//   const navigateToPendingRequests = () => {
//     if (navigation) {
//       navigation.navigate('connections/pending-requests');
//     } else {
//       // For web or other platforms without navigation prop
//       window.location.href = '/connections/pending-requests';
//     }
//   };

//   const navigateToDashboard = () => {
//     if (navigation) {
//       navigation.navigate('auth/dashboard');
//     } else {
//       // For web or other platforms without navigation prop
//       window.location.href = '/auth/dashboard';
//     }
//   };

//   const initializeScreen = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       // Force refresh user data from API (don't use cache on initial load)
//       const user = await getCurrentUser(true); // Pass true to force refresh
      
//       // Now load connections with the fresh user data
//       await loadConnections(user);
      
//     } catch (error) {
//       console.error('Initialize screen error:', error);
//       setError('Failed to initialize screen. Please try again.');
//       showToast('Initialization Error: Failed to load screen data', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getCurrentUser = async (forceRefresh = false) => {
//     try {
//       // If force refresh is requested, clear cache first
//       if (forceRefresh) {
//         await AsyncStorage.removeItem('currentUser');
//         console.log('Cleared cached user data for fresh login');
//       }

//       // Try to get from AsyncStorage first (cached user data)
//       if (!forceRefresh) {
//         const cachedUser = await AsyncStorage.getItem('currentUser');
//         if (cachedUser) {
//           const user = JSON.parse(cachedUser);
//           setCurrentUser(user);
//           console.log('Using cached user:', user);
//           return user;
//         }
//       }

//       // Fetch fresh data from API
//       console.log('Fetching user from API...');
//       const userData = await ConnectionAPI.getCurrentUser();
      
//       // Cache the fresh user data
//       await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
//       setCurrentUser(userData);
//       console.log('Fetched and cached fresh user from API:', userData);
//       return userData;

//     } catch (error) {
//       console.error('Error getting current user:', error);
      
//       // If API fails and we're not forcing refresh, try to use cached data as fallback
//       if (!forceRefresh) {
//         try {
//           const cachedUser = await AsyncStorage.getItem('currentUser');
//           if (cachedUser) {
//             const user = JSON.parse(cachedUser);
//             setCurrentUser(user);
//             console.log('Using cached user as fallback:', user);
//             return user;
//           }
//         } catch (cacheError) {
//           console.error('Cache fallback failed:', cacheError);
//         }
//       }
      
//       throw error;
//     }
//   };

//   const loadConnections = async (user = null) => {
//     try {
//       setError(null);
//       const data = await ConnectionAPI.getMyConnections();
      
//       // Use the passed user or fallback to state
//       const currentUserData = user || currentUser;
      
//       if (!currentUserData) {
//         console.error('No current user data available for filtering connections');
//         setConnections([]);
//         return [];
//       }
      
//       // Filter out invalid connections and self-connections
//       const validConnections = (data || []).filter(connection => {
//         // Check if connection has both users
//         if (!connection.user1 || !connection.user2) {
//           console.log('Missing user1 or user2 in connection:', connection);
//           return false;
//         }

//         // Check if current user is one of the users in the connection
//         const isCurrentUserInConnection = 
//           connection.user1.id === currentUserData.id || 
//           connection.user2.id === currentUserData.id;

//         if (!isCurrentUserInConnection) {
//           console.log('Current user not found in connection:', {
//             connectionId: connection.id,
//             currentUserId: currentUserData.id,
//             user1Id: connection.user1.id,
//             user2Id: connection.user2.id
//           });
//           return false;
//         }

//         // Prevent self-connections (user connected to themselves)
//         if (connection.user1.id === connection.user2.id) {
//           console.log('Filtering out self-connection:', connection);
//           return false;
//         }

//         // Get the other user and validate
//         const otherUser = getOtherUserWithData(connection, currentUserData);
//         const isValid = otherUser && otherUser.id && otherUser.username && otherUser.id !== currentUserData.id;
        
//         if (!isValid) {
//           console.log('Invalid other user or self-connection detected:', {
//             otherUser,
//             currentUserId: currentUserData.id
//           });
//         }

//         return isValid;
//       });

//       console.log('Total connections from API:', data?.length || 0);
//       console.log('Valid connections after filtering:', validConnections.length);
//       console.log('Current user for filtering:', currentUserData);
      
//       setConnections(validConnections);
//       return validConnections;
//     } catch (error) {
//       console.error('Load connections error:', error);
//       setError('Unable to load connections');
//       throw error;
//     }
//   };

//   const getOtherUserWithData = (connection, userData) => {
//     if (!userData || !connection) {
//       console.log('Missing userData or connection:', { userData, connection });
//       return {};
//     }

//     console.log('Current user ID:', userData.id);
//     console.log('Connection user1 ID:', connection.user1?.id);
//     console.log('Connection user2 ID:', connection.user2?.id);

//     // Ensure we have both users in the connection
//     if (!connection.user1 || !connection.user2) {
//       console.log('Missing user1 or user2 in connection:', connection);
//       return {};
//     }

//     // Return the user that is NOT the current user
//     if (connection.user1.id === userData.id && connection.user2.id !== userData.id) {
//       console.log('Returning user2:', connection.user2);
//       return connection.user2;
//     } else if (connection.user2.id === userData.id && connection.user1.id !== userData.id) {
//       console.log('Returning user1:', connection.user1);
//       return connection.user1;
//     } else {
//       console.warn('Invalid connection - either both users are the same or current user not found:', {
//         currentUserId: userData.id,
//         user1Id: connection.user1?.id,
//         user2Id: connection.user2?.id
//       });
//       return {};
//     }
//   };

//   const onRefresh = async () => {
//     try {
//       setRefreshing(true);
//       setError(null);
      
//       // Force refresh user data on manual refresh
//       const user = await getCurrentUser(true);
//       await loadConnections(user);
//       showToast('Connections refreshed successfully');
//     } catch (error) {
//       showToast('Unable to refresh connections', 'error');
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const filterConnections = () => {
//     if (!searchQuery.trim()) {
//       setFilteredConnections(connections);
//       return;
//     }

//     const filtered = connections.filter(connection => {
//       try {
//         const otherUser = getOtherUser(connection);
//         const fullName = `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.toLowerCase();
//         const username = otherUser.username?.toLowerCase() || '';
//         const query = searchQuery.toLowerCase();
        
//         return fullName.includes(query) || username.includes(query);
//       } catch (error) {
//         console.error('Filter error:', error);
//         return false;
//       }
//     });
//     setFilteredConnections(filtered);
//   };

//   // Show confirmation modal for removing connection
//   const showRemoveConfirmation = (connection) => {
//     const otherUser = getOtherUser(connection);
//     setConnectionToRemove({
//       id: connection.id,
//       username: otherUser.username,
//       displayName: otherUser.first_name && otherUser.last_name 
//         ? `${otherUser.first_name} ${otherUser.last_name}` 
//         : otherUser.username
//     });
//     setShowConfirmModal(true);
//   };

//   // Handle connection removal
//   const handleRemoveConnection = async () => {
//     if (!connectionToRemove) return;

//     try {
//       setLoading(true);
//       setShowConfirmModal(false);
      
//       await ConnectionAPI.removeConnection(connectionToRemove.id);
//       await loadConnections(currentUser);
      
//       showToast(`Connection with ${connectionToRemove.displayName} removed`);
//     } catch (error) {
//       console.error('Remove connection error:', error);
//       showToast('Unable to remove connection. Please try again.', 'error');
//     } finally {
//       setLoading(false);
//       setConnectionToRemove(null);
//     }
//   };

//   // Cancel connection removal
//   const handleCancelRemove = () => {
//     setShowConfirmModal(false);
//     setConnectionToRemove(null);
//   };

//   const getOtherUser = (connection) => {
//     return getOtherUserWithData(connection, currentUser);
//   };

//   // Show toast notification
//   const showToast = (message, type = 'success') => {
//     setToast({ visible: true, message, type });
//   };

//   // Hide toast notification
//   const hideToast = () => {
//     setToast({ visible: false, message: '', type: 'success' });
//   };

//   const handleRetry = () => {
//     initializeScreen();
//   };

//   const renderConnection = ({ item, index }) => {
//     const otherUser = getOtherUser(item);
    
//     // Platform-specific animation handling
//     const animatedStyle = isWeb 
//       ? {} 
//       : {
//           opacity: fadeAnim,
//           transform: [{
//             translateY: fadeAnim.interpolate({
//               inputRange: [0, 1],
//               outputRange: [20, 0],
//             }),
//           }],
//         };

//     const ComponentWrapper = isWeb ? View : Animated.View;

//     return (
//       <ComponentWrapper style={animatedStyle}>
//         <View style={styles.connectionCard}>
//           <TouchableOpacity style={styles.connectionInfo} activeOpacity={0.7}>
//             <View style={styles.avatarContainer}>
//               <Image
//                 source={{ 
//                   uri: otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.username}&background=667eea&color=fff&size=128`
//                 }}
//                 style={styles.avatar}
//                 defaultSource={{ uri: 'https://ui-avatars.com/api/?name=User&background=ccc&color=fff&size=128' }}
//               />
//               <View style={styles.onlineIndicator} />
//             </View>
//             <View style={styles.connectionDetails}>
//               {otherUser.first_name && otherUser.last_name && (
//                 <Text style={styles.connectionName} numberOfLines={1}>
//                   {otherUser.first_name} {otherUser.last_name}
//                 </Text>
//               )}
//               <Text style={styles.username} numberOfLines={1}>@{otherUser.username}</Text>
//               <Text style={styles.connectionTime}>
//                 Connected {new Date(item.created_at).toLocaleDateString('en-US', {
//                   month: 'short',
//                   day: 'numeric',
//                   year: 'numeric'
//                 })}
//               </Text>
//             </View>
//           </TouchableOpacity>
//           <View style={styles.actionButtons}>
//             <TouchableOpacity style={styles.messageButton} activeOpacity={0.7}>
//               <Ionicons name="chatbubble-ellipses" size={20} color="#667eea" />
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.removeButton}
//               activeOpacity={0.7}
//               onPress={() => showRemoveConfirmation(item)}
//             >
//               <Ionicons name="person-remove" size={20} color="#ff6b6b" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </ComponentWrapper>
//     );
//   };

//   const renderHeader = () => (
//     <View style={styles.headerContainer}>
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.headerGradient}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       >
//         <View style={styles.header}>
//           {/* Back Button */}
//           <TouchableOpacity 
//             style={styles.backButton} 
//             onPress={navigateToDashboard}
//             activeOpacity={0.8}
//           >
//             <Ionicons name="arrow-back" size={24} color="#fff" />
//           </TouchableOpacity>

//           <View style={styles.headerCenter}>
//             <Text style={styles.headerTitle}>My Connections</Text>
//             <Text style={styles.connectionCount}>
//               {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
//             </Text>
//           </View>

//           {/* Placeholder for symmetry */}
//           <View style={styles.headerPlaceholder} />
//         </View>
//       </LinearGradient>
//     </View>
//   );

//   const renderNavigationButtons = () => (
//     <View style={styles.navigationContainer}>
//       <TouchableOpacity 
//         style={styles.navigationButton}
//         onPress={navigateToStudents}
//         activeOpacity={0.8}
//       >
//         <View style={styles.navButtonContent}>
//           <View style={styles.navIconContainer}>
//             <Ionicons name="people" size={24} color="#667eea" />
//           </View>
//           <View style={styles.navTextContainer}>
//             <Text style={styles.navButtonTitle}>Discover Students</Text>
//             <Text style={styles.navButtonSubtitle}>Find and connect with peers</Text>
//           </View>
//           <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
//         </View>
//       </TouchableOpacity>

//       <TouchableOpacity 
//         style={styles.navigationButton}
//         onPress={navigateToPendingRequests}
//         activeOpacity={0.8}
//       >
//         <View style={styles.navButtonContent}>
//           <View style={styles.navIconContainer}>
//             <Ionicons name="time" size={24} color="#f59e0b" />
//           </View>
//           <View style={styles.navTextContainer}>
//             <Text style={styles.navButtonTitle}>Pending Requests</Text>
//             <Text style={styles.navButtonSubtitle}>Manage connection requests</Text>
//           </View>
//           <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
//         </View>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderSearchBar = () => (
//     <View style={styles.searchContainer}>
//       <View style={styles.searchInputContainer}>
//         <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search connections..."
//           placeholderTextColor="#9ca3af"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           returnKeyType="search"
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity
//             onPress={() => setSearchQuery('')}
//             style={styles.clearButton}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="close-circle" size={20} color="#9ca3af" />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );

//   const renderEmptyState = () => {
//     const EmptyStateWrapper = isWeb ? View : Animated.View;
//     const emptyAnimatedStyle = isWeb ? {} : { opacity: fadeAnim };

//     return (
//       <EmptyStateWrapper style={[styles.emptyContainer, emptyAnimatedStyle]}>
//         <View style={styles.emptyIconContainer}>
//           <Ionicons name="people-circle" size={80} color="#e5e7eb" />
//         </View>
//         <Text style={styles.emptyText}>
//           {searchQuery ? 'No matching connections' : 'No connections yet'}
//         </Text>
//         <Text style={styles.emptySubtext}>
//           {searchQuery 
//             ? 'Try adjusting your search terms'
//             : 'Start by discovering and connecting with other students'
//           }
//         </Text>
//         {!searchQuery && (
//           <TouchableOpacity 
//             style={styles.discoverButton} 
//             onPress={navigateToStudents}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.discoverButtonText}>Discover People</Text>
//           </TouchableOpacity>
//         )}
//       </EmptyStateWrapper>
//     );
//   };

//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <Ionicons name="alert-circle" size={60} color="#ff6b6b" />
//       <Text style={styles.errorText}>Something went wrong</Text>
//       <Text style={styles.errorSubtext}>{error}</Text>
//       <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
//         <Text style={styles.retryButtonText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading && connections.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading connections...</Text>
//       </View>
//     );
//   }

//   if (error && connections.length === 0) {
//     return (
//       <View style={styles.container}>
//         {renderHeader()}
//         {renderErrorState()}
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#667eea" />
//       {renderHeader()}
//       {renderNavigationButtons()}
//       {renderSearchBar()}
      
//       <FlatList
//         data={filteredConnections}
//         renderItem={renderConnection}
//         keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.listContainer}
//         refreshControl={
//           <RefreshControl 
//             refreshing={refreshing} 
//             onRefresh={onRefresh}
//             colors={['#667eea']}
//             tintColor="#667eea"
//           />
//         }
//         ListEmptyComponent={renderEmptyState}
//         ItemSeparatorComponent={() => <View style={styles.separator} />}
//       />
      
//       {loading && connections.length > 0 && (
//         <View style={styles.loadingOverlay}>
//           <ActivityIndicator size="small" color="#667eea" />
//         </View>
//       )}

//       {/* Custom Confirmation Modal */}
//       <ConfirmationModal
//         visible={showConfirmModal}
//         onClose={handleCancelRemove}
//         onConfirm={handleRemoveConnection}
//         title="Remove Connection"
//         message={connectionToRemove ? 
//           `Are you sure you want to remove your connection with ${connectionToRemove.displayName}?` : 
//           'Are you sure you want to remove this connection?'
//         }
//         confirmText="Remove"
//         cancelText="Cancel"
//         isDestructive={true}
//       />

//       {/* Toast Notification */}
//       <Toast
//         visible={toast.visible}
//         message={toast.message}
//         type={toast.type}
//         onHide={hideToast}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   headerContainer: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 50 : 20,
//     paddingBottom: 20,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//   },
//   backButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     borderRadius: 12,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   headerCenter: {
//     flex: 1,
//     alignItems: 'center',
//     marginHorizontal: 16,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   connectionCount: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontWeight: '500',
//   },
//   headerPlaceholder: {
//     width: 48, // Same width as back button for symmetry
//   },
//   navigationContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     gap: 12,
//   },
//   navigationButton: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 12,
//     elevation: 4,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },
//   navButtonContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//   },
//   navIconContainer: {
//     backgroundColor: '#f8fafc',
//     borderRadius: 12,
//     padding: 12,
//     marginRight: 16,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   navTextContainer: {
//     flex: 1,
//   },
//   navButtonTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1f2937',
//     marginBottom: 4,
//   },
//   navButtonSubtitle: {
//     fontSize: 14,
//     color: '#6b7280',
//     fontWeight: '400',
//   },
//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#f8fafc',
//   },
//   searchInputContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//   },
//   searchIcon: {
//     marginRight: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#374151',
//     fontWeight: '500',
//   },
//   clearButton: {
//     padding: 4,
//   },
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },
//   connectionCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 12,
//     elevation: 4,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },
//   connectionInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginRight: 16,
//   },
//   avatar: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#e5e7eb',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#10b981',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   connectionDetails: {
//     flex: 1,
//     marginRight: 12,
//   },
//   connectionName: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1f2937',
//     marginBottom: 2,
//   },
//   username: {
//     fontSize: 15,
//     color: '#667eea',
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   connectionTime: {
//     fontSize: 13,
//     color: '#9ca3af',
//     fontWeight: '400',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },

//   messageButton: {
//     backgroundColor: '#f0f4ff',
//     borderRadius: 10,
//     padding: 10,
//     marginRight: 8,
//     borderWidth: 1,
//     borderColor: '#e0e7ff',
//   },
//   removeButton: {
//     backgroundColor: '#fef2f2',
//     borderRadius: 10,
//     padding: 10,
//     borderWidth: 1,
//     borderColor: '#fecaca',
//   },
//   separator: {
//     height: 12,
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 60,
//     paddingHorizontal: 40,
//   },

























// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   RefreshControl,
//   TextInput,
//   ActivityIndicator,
//   Animated,
//   Platform,
//   StatusBar,
//   Dimensions,
//   Modal,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import ConnectionAPI from '../api/connectionService';
// import useCurrentUser from '../api/useCurrentUser'

// const { width } = Dimensions.get('window');
// const isWeb = Platform.OS === 'web';

// // Custom Confirmation Modal Component
// const ConfirmationModal = ({ 
//   visible, 
//   onClose, 
//   onConfirm, 
//   title, 
//   message, 
//   confirmText = 'Confirm',
//   cancelText = 'Cancel',
//   isDestructive = false 
// }) => {
//   return (
//     <Modal
//       visible={visible}
//       transparent={true}
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>{title}</Text>
//           </View>
          
//           <View style={styles.modalBody}>
//             <Text style={styles.modalMessage}>{message}</Text>
//           </View>
          
//           <View style={styles.modalFooter}>
//             <TouchableOpacity
//               style={[styles.modalButton, styles.cancelButton]}
//               onPress={onClose}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.cancelButtonText}>{cancelText}</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.modalButton, 
//                 isDestructive ? styles.destructiveButton : styles.confirmButton
//               ]}
//               onPress={onConfirm}
//               activeOpacity={0.8}
//             >
//               <Text style={[
//                 styles.confirmButtonText,
//                 isDestructive && styles.destructiveButtonText
//               ]}>
//                 {confirmText}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// // Success/Error Toast Component
// const Toast = ({ visible, message, type = 'success', onHide }) => {
//   useEffect(() => {
//     if (visible) {
//       const timer = setTimeout(() => {
//         onHide();
//       }, 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [visible, onHide]);

//   if (!visible) return null;

//   return (
//     <View style={[
//       styles.toast,
//       type === 'error' ? styles.errorToast : styles.successToast
//     ]}>
//       <Ionicons 
//         name={type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
//         size={20} 
//         color="#fff" 
//         style={styles.toastIcon}
//       />
//       <Text style={styles.toastText}>{message}</Text>
//     </View>
//   );
// };

// export default function ConnectionsScreen({ navigation }) {
//   const [connections, setConnections] = useState([]);
//   const [filteredConnections, setFilteredConnections] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [refreshing, setRefreshing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [error, setError] = useState(null);
  
//   // Modal states
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [connectionToRemove, setConnectionToRemove] = useState(null);
  
//   // Toast states
//   const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

//   const fadeAnim = isWeb ? null : new Animated.Value(0);
//   const slideAnim = isWeb ? null : new Animated.Value(0);

//   useEffect(() => {
//     initializeScreen();
//   }, []);

//   useEffect(() => {
//     filterConnections();
//   }, [searchQuery, connections]);

//   useEffect(() => {
//     if (!loading && !isWeb && fadeAnim && slideAnim) {
//       Animated.parallel([
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 600,
//           useNativeDriver: true,
//         }),
//         Animated.timing(slideAnim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     }
//   }, [loading]);

//   // Navigation handlers
//   const navigateToStudents = () => {
//     if (navigation) {
//       navigation.navigate('connections/students');
//     } else {
//       // For web or other platforms without navigation prop
//       window.location.href = '/connections/students';
//     }
//   };

//   const navigateToPendingRequests = () => {
//     if (navigation) {
//       navigation.navigate('connections/pending-requests');
//     } else {
//       // For web or other platforms without navigation prop
//       window.location.href = '/connections/pending-requests';
//     }
//   };

//   const navigateToDashboard = () => {
//     if (navigation) {
//       navigation.navigate('auth/dashboard');
//     } else {
//       // For web or other platforms without navigation prop
//       window.location.href = '/auth/dashboard';
//     }
//   };

//   const initializeScreen = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       // Force refresh user data from API (don't use cache on initial load)
//       const user = await getCurrentUser(true); // Pass true to force refresh
      
//       // Now load connections with the fresh user data
//       await loadConnections(user);
      
//     } catch (error) {
//       console.error('Initialize screen error:', error);
//       setError('Failed to initialize screen. Please try again.');
//       showToast('Initialization Error: Failed to load screen data', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getCurrentUser = async (forceRefresh = false) => {
//     try {
//       // If force refresh is requested, clear cache first
//       if (forceRefresh) {
//         await AsyncStorage.removeItem('currentUser');
//         console.log('Cleared cached user data for fresh login');
//       }

//       // Try to get from AsyncStorage first (cached user data)
//       if (!forceRefresh) {
//         const cachedUser = await AsyncStorage.getItem('currentUser');
//         if (cachedUser) {
//           const user = JSON.parse(cachedUser);
//           setCurrentUser(user);
//           console.log('Using cached user:', user);
//           return user;
//         }
//       }

//       // Fetch fresh data from API
//       console.log('Fetching user from API...');
//       const userData = await ConnectionAPI.getCurrentUser();
      
//       // Cache the fresh user data
//       await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
//       setCurrentUser(userData);
//       console.log('Fetched and cached fresh user from API:', userData);
//       return userData;

//     } catch (error) {
//       console.error('Error getting current user:', error);
      
//       // If API fails and we're not forcing refresh, try to use cached data as fallback
//       if (!forceRefresh) {
//         try {
//           const cachedUser = await AsyncStorage.getItem('currentUser');
//           if (cachedUser) {
//             const user = JSON.parse(cachedUser);
//             setCurrentUser(user);
//             console.log('Using cached user as fallback:', user);
//             return user;
//           }
//         } catch (cacheError) {
//           console.error('Cache fallback failed:', cacheError);
//         }
//       }
      
//       throw error;
//     }
//   };

//   const loadConnections = async (user = null) => {
//     try {
//       setError(null);
//       const data = await ConnectionAPI.getMyConnections();
      
//       // Use the passed user or fallback to state
//       const currentUserData = user || currentUser;
      
//       if (!currentUserData) {
//         console.error('No current user data available for filtering connections');
//         setConnections([]);
//         return [];
//       }
      
//       // Filter out invalid connections and self-connections
//       const validConnections = (data || []).filter(connection => {
//         // Check if connection has both users
//         if (!connection.user1 || !connection.user2) {
//           console.log('Missing user1 or user2 in connection:', connection);
//           return false;
//         }

//         // Check if current user is one of the users in the connection
//         const isCurrentUserInConnection = 
//           connection.user1.id === currentUserData.id || 
//           connection.user2.id === currentUserData.id;

//         if (!isCurrentUserInConnection) {
//           console.log('Current user not found in connection:', {
//             connectionId: connection.id,
//             currentUserId: currentUserData.id,
//             user1Id: connection.user1.id,
//             user2Id: connection.user2.id
//           });
//           return false;
//         }

//         // Prevent self-connections (user connected to themselves)
//         if (connection.user1.id === connection.user2.id) {
//           console.log('Filtering out self-connection:', connection);
//           return false;
//         }

//         // Get the other user and validate
//         const otherUser = getOtherUserWithData(connection, currentUserData);
//         const isValid = otherUser && otherUser.id && otherUser.username && otherUser.id !== currentUserData.id;
        
//         if (!isValid) {
//           console.log('Invalid other user or self-connection detected:', {
//             otherUser,
//             currentUserId: currentUserData.id
//           });
//         }

//         return isValid;
//       });

//       console.log('Total connections from API:', data?.length || 0);
//       console.log('Valid connections after filtering:', validConnections.length);
//       console.log('Current user for filtering:', currentUserData);
      
//       setConnections(validConnections);
//       return validConnections;
//     } catch (error) {
//       console.error('Load connections error:', error);
//       setError('Unable to load connections');
//       throw error;
//     }
//   };

//   const getOtherUserWithData = (connection, userData) => {
//     if (!userData || !connection) {
//       console.log('Missing userData or connection:', { userData, connection });
//       return {};
//     }

//     console.log('Current user ID:', userData.id);
//     console.log('Connection user1 ID:', connection.user1?.id);
//     console.log('Connection user2 ID:', connection.user2?.id);

//     // Ensure we have both users in the connection
//     if (!connection.user1 || !connection.user2) {
//       console.log('Missing user1 or user2 in connection:', connection);
//       return {};
//     }

//     // Return the user that is NOT the current user
//     if (connection.user1.id === userData.id && connection.user2.id !== userData.id) {
//       console.log('Returning user2:', connection.user2);
//       return connection.user2;
//     } else if (connection.user2.id === userData.id && connection.user1.id !== userData.id) {
//       console.log('Returning user1:', connection.user1);
//       return connection.user1;
//     } else {
//       console.warn('Invalid connection - either both users are the same or current user not found:', {
//         currentUserId: userData.id,
//         user1Id: connection.user1?.id,
//         user2Id: connection.user2?.id
//       });
//       return {};
//     }
//   };

//   const onRefresh = async () => {
//     try {
//       setRefreshing(true);
//       setError(null);
      
//       // Force refresh user data on manual refresh
//       const user = await getCurrentUser(true);
//       await loadConnections(user);
//       showToast('Connections refreshed successfully');
//     } catch (error) {
//       showToast('Unable to refresh connections', 'error');
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const filterConnections = () => {
//     if (!searchQuery.trim()) {
//       setFilteredConnections(connections);
//       return;
//     }

//     const filtered = connections.filter(connection => {
//       try {
//         const otherUser = getOtherUser(connection);
//         const fullName = `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.toLowerCase();
//         const username = otherUser.username?.toLowerCase() || '';
//         const query = searchQuery.toLowerCase();
        
//         return fullName.includes(query) || username.includes(query);
//       } catch (error) {
//         console.error('Filter error:', error);
//         return false;
//       }
//     });
//     setFilteredConnections(filtered);
//   };

//   // Show confirmation modal for removing connection
//   const showRemoveConfirmation = (connection) => {
//     const otherUser = getOtherUser(connection);
//     setConnectionToRemove({
//       id: connection.id,
//       username: otherUser.username,
//       displayName: otherUser.first_name && otherUser.last_name 
//         ? `${otherUser.first_name} ${otherUser.last_name}` 
//         : otherUser.username
//     });
//     setShowConfirmModal(true);
//   };

//   // Handle connection removal
//   const handleRemoveConnection = async () => {
//     if (!connectionToRemove) return;

//     try {
//       setLoading(true);
//       setShowConfirmModal(false);
      
//       await ConnectionAPI.removeConnection(connectionToRemove.id);
//       await loadConnections(currentUser);
      
//       showToast(`Connection with ${connectionToRemove.displayName} removed`);
//     } catch (error) {
//       console.error('Remove connection error:', error);
//       showToast('Unable to remove connection. Please try again.', 'error');
//     } finally {
//       setLoading(false);
//       setConnectionToRemove(null);
//     }
//   };

//   // Cancel connection removal
//   const handleCancelRemove = () => {
//     setShowConfirmModal(false);
//     setConnectionToRemove(null);
//   };

//   const getOtherUser = (connection) => {
//     return getOtherUserWithData(connection, currentUser);
//   };

//   // Show toast notification
//   const showToast = (message, type = 'success') => {
//     setToast({ visible: true, message, type });
//   };

//   // Hide toast notification
//   const hideToast = () => {
//     setToast({ visible: false, message: '', type: 'success' });
//   };

//   const handleRetry = () => {
//     initializeScreen();
//   };

//   const renderConnection = ({ item, index }) => {
//     const otherUser = getOtherUser(item);
    
//     // Platform-specific animation handling
//     const animatedStyle = isWeb 
//       ? {} 
//       : {
//           opacity: fadeAnim,
//           transform: [{
//             translateY: fadeAnim.interpolate({
//               inputRange: [0, 1],
//               outputRange: [20, 0],
//             }),
//           }],
//         };

//     const ComponentWrapper = isWeb ? View : Animated.View;

//     return (
//       <ComponentWrapper style={animatedStyle}>
//         <View style={styles.connectionCard}>
//           <TouchableOpacity style={styles.connectionInfo} activeOpacity={0.7}>
//             <View style={styles.avatarContainer}>
//               <Image
//                 source={{ 
//                   // uri: otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.username}&background=667eea&color=fff&size=128`
//                   uri: otherUser.profile_picture || `https://ui-avatars.com/api/?name=${otherUser.username}&background=667eea&color=fff&size=128`
//                 }}
//                 style={styles.avatar}
//                 defaultSource={{ uri: 'https://ui-avatars.com/api/?name=User&background=ccc&color=fff&size=128' }}
//               />
//               <View style={styles.onlineIndicator} />
//             </View>
//             <View style={styles.connectionDetails}>
//               {otherUser.first_name && otherUser.last_name && (
//                 <Text style={styles.connectionName} numberOfLines={1}>
//                   {otherUser.first_name} {otherUser.last_name}
//                 </Text>
//               )}
//               <Text style={styles.username} numberOfLines={1}>@{otherUser.username}</Text>
//               <Text style={styles.connectionTime}>
//                 Connected {new Date(item.created_at).toLocaleDateString('en-US', {
//                   month: 'short',
//                   day: 'numeric',
//                   year: 'numeric'
//                 })}
//               </Text>
//             </View>
//           </TouchableOpacity>
//           <View style={styles.actionButtons}>
//             <TouchableOpacity style={styles.messageButton} activeOpacity={0.7}>
//               <Ionicons name="chatbubble-ellipses" size={20} color="#667eea" />
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.removeButton}
//               activeOpacity={0.7}
//               onPress={() => showRemoveConfirmation(item)}
//             >
//               <Ionicons name="person-remove" size={20} color="#ff6b6b" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </ComponentWrapper>
//     );
//   };

//   const renderHeader = () => (
//     <View style={styles.headerContainer}>
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.headerGradient}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       >
//         <View style={styles.header}>
//           {/* Back Button */}
//           <TouchableOpacity 
//             style={styles.backButton} 
//             onPress={navigateToDashboard}
//             activeOpacity={0.8}
//           >
//             <Ionicons name="arrow-back" size={24} color="#fff" />
//           </TouchableOpacity>

//           <View style={styles.headerCenter}>
//             <Text style={styles.headerTitle}>My Connections</Text>
//             <Text style={styles.connectionCount}>
//               {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
//             </Text>
//           </View>

//           {/* Placeholder for symmetry */}
//           <View style={styles.headerPlaceholder} />
//         </View>

//         {/* Enhanced Quick Action Buttons - Now in Header */}
//         <View style={styles.quickActionsContainer}>
//           <TouchableOpacity 
//             style={styles.quickActionButton}
//             onPress={navigateToStudents}
//             activeOpacity={0.8}
//           >
//             <View style={styles.quickActionIconContainer}>
//               <Ionicons name="people" size={18} color="#667eea" />
//             </View>
//             <Text style={styles.quickActionText}>Discover</Text>
//           </TouchableOpacity>

//           <TouchableOpacity 
//             style={styles.quickActionButton}
//             onPress={navigateToPendingRequests}
//             activeOpacity={0.8}
//           >
//             <View style={styles.quickActionIconContainer}>
//               <Ionicons name="time" size={18} color="#f59e0b" />
//             </View>
//             <Text style={styles.quickActionText}>Pending</Text>
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>
//     </View>
//   );

//   const renderSearchBar = () => (
//     <View style={styles.searchContainer}>
//       <View style={styles.searchInputContainer}>
//         <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search connections..."
//           placeholderTextColor="#9ca3af"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           returnKeyType="search"
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity
//             onPress={() => setSearchQuery('')}
//             style={styles.clearButton}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="close-circle" size={20} color="#9ca3af" />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );

//   const renderEmptyState = () => {
//     const EmptyStateWrapper = isWeb ? View : Animated.View;
//     const emptyAnimatedStyle = isWeb ? {} : { opacity: fadeAnim };

//     return (
//       <EmptyStateWrapper style={[styles.emptyContainer, emptyAnimatedStyle]}>
//         <View style={styles.emptyIconContainer}>
//           <Ionicons name="people-circle" size={80} color="#e5e7eb" />
//         </View>
//         <Text style={styles.emptyText}>
//           {searchQuery ? 'No matching connections' : 'No connections yet'}
//         </Text>
//         <Text style={styles.emptySubtext}>
//           {searchQuery 
//             ? 'Try adjusting your search terms'
//             : 'Start by discovering and connecting with other students'
//           }
//         </Text>
//         {!searchQuery && (
//           <TouchableOpacity 
//             style={styles.discoverButton} 
//             onPress={navigateToStudents}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.discoverButtonText}>Discover People</Text>
//           </TouchableOpacity>
//         )}
//       </EmptyStateWrapper>
//     );
//   };

//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <Ionicons name="alert-circle" size={60} color="#ff6b6b" />
//       <Text style={styles.errorText}>Something went wrong</Text>
//       <Text style={styles.errorSubtext}>{error}</Text>
//       <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
//         <Text style={styles.retryButtonText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading && connections.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading connections...</Text>
//       </View>
//     );
//   }

//   if (error && connections.length === 0) {
//     return (
//       <View style={styles.container}>
//         {renderHeader()}
//         {renderErrorState()}
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#667eea" />
//       {renderHeader()}
//       {renderSearchBar()}
      
//       <FlatList
//         data={filteredConnections}
//         renderItem={renderConnection}
//         keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.listContainer}
//         refreshControl={
//           <RefreshControl 
//             refreshing={refreshing} 
//             onRefresh={onRefresh}
//             colors={['#667eea']}
//             tintColor="#667eea"
//           />
//         }
//         ListEmptyComponent={renderEmptyState}
//         ItemSeparatorComponent={() => <View style={styles.separator} />}
//       />
      
//       {loading && connections.length > 0 && (
//         <View style={styles.loadingOverlay}>
//           <ActivityIndicator size="small" color="#667eea" />
//         </View>
//       )}

//       {/* Custom Confirmation Modal */}
//       <ConfirmationModal
//         visible={showConfirmModal}
//         onClose={handleCancelRemove}
//         onConfirm={handleRemoveConnection}
//         title="Remove Connection"
//         message={connectionToRemove ? 
//           `Are you sure you want to remove your connection with ${connectionToRemove.displayName}?` : 
//           'Are you sure you want to remove this connection?'
//         }
//         confirmText="Remove"
//         cancelText="Cancel"
//         isDestructive={true}
//       />

//       {/* Toast Notification */}
//       <Toast
//         visible={toast.visible}
//         message={toast.message}
//         type={toast.type}
//         onHide={hideToast}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   headerContainer: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 50 : 20,
//     paddingBottom: 20,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     marginBottom: 16,
//   },
//   backButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     borderRadius: 12,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   headerCenter: {
//     flex: 1,
//     alignItems: 'center',
//     marginHorizontal: 16,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   connectionCount: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontWeight: '500',
//   },
//   headerPlaceholder: {
//     width: 48, // Same width as back button for symmetry
//   },
  
//   // Enhanced Quick Actions in Header
//   quickActionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     paddingHorizontal: 24,
//     gap: 16,
//   },
//   quickActionButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     borderRadius: 16,
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//     minWidth: 110,
//     justifyContent: 'center',
//   },
//   quickActionIconContainer: {
//     backgroundColor: '#f8fafc',
//     borderRadius: 8,
//     padding: 6,
//     marginRight: 8,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   quickActionText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#374151',
//   },

//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#f8fafc',
//   },
//   searchInputContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//   },
//   searchIcon: {
//     marginRight: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#374151',
//     fontWeight: '500',
//   },
//   clearButton: {
//     padding: 4,
//   },
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },
//   connectionCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 12,
//     elevation: 4,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },
//   connectionInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginRight: 16,
//   },
//   avatar: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#e5e7eb',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#10b981',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   connectionDetails: {
//     flex: 1,
//     marginRight: 12,
//   },
//   connectionName: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1f2937',
//     marginBottom: 2,
//   },
//   username: {
//     fontSize: 15,
//     color: '#667eea',
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   connectionTime: {
//     fontSize: 13,
//     color: '#9ca3af',
//     fontWeight: '400',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },

//   messageButton: {
//     backgroundColor: '#f0f4ff',
//     borderRadius: 10,
//     padding: 10,
//     marginRight: 8,
//     borderWidth: 1,
//     borderColor: '#e0e7ff',
//   },
//   removeButton: {
//     backgroundColor: '#fef2f2',
//     borderRadius: 10,
//     padding: 10,
//     borderWidth: 1,
//     borderColor: '#fecaca',
//   },
//   separator: {
//     height: 12,
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 60,
//     paddingHorizontal: 40,
//   },
//   emptyIconContainer: {
//     marginBottom: 24,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#374151',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#9ca3af',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 32,
//   },
//   discoverButton: {
//     backgroundColor: '#667eea',
//     borderRadius: 12,
//     paddingVertical: 14,
//     paddingHorizontal: 32,
//   },
//   discoverButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8fafc',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#667eea',
//     fontWeight: '500',
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     padding: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   errorText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#374151',
//     textAlign: 'center',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorSubtext: {
//     fontSize: 16,
//     color: '#9ca3af',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 32,
//   },
//   retryButton: {
//     backgroundColor: '#667eea',
//     borderRadius: 12,
//     paddingVertical: 14,
//     paddingHorizontal: 32,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     width: '100%',
//     maxWidth: 400,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.25,
//     shadowRadius: 16,
//     elevation: 10,
//   },
//   modalHeader: {
//     paddingHorizontal: 24,
//     paddingTop: 24,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f1f5f9',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#1f2937',
//     textAlign: 'center',
//   },
//   modalBody: {
//     paddingHorizontal: 24,
//     paddingVertical: 20,
//   },
//   modalMessage: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     paddingHorizontal: 24,
//     paddingBottom: 24,
//     paddingTop: 16,
//     gap: 12,
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cancelButton: {
//     backgroundColor: '#f8fafc',
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   confirmButton: {
//     backgroundColor: '#667eea',
//   },
//   destructiveButton: {
//     backgroundColor: '#ef4444',
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#64748b',
//   },
//   confirmButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   destructiveButtonText: {
//     color: '#fff',
//   },
//   // Toast Styles
//   toast: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 60 : 40,
//     left: 20,
//     right: 20,
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//     elevation: 8,
//     zIndex: 1000,
//   },
//   successToast: {
//     backgroundColor: '#10b981',
//   },
//   errorToast: {
//     backgroundColor: '#ef4444',
//   },
//   toastIcon: {
//     marginRight: 12,
//   },
//   toastText: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#fff',
//     flex: 1,
//   },
// });
