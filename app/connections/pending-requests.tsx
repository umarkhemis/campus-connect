

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
  Haptics,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import ConnectionAPI from '../api/connectionService';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Custom Confirmation Modal Component
const ConfirmationModal = ({ visible, onConfirm, onCancel, title, message, confirmText = "Confirm", cancelText = "Cancel" }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modalContent}>
          <View style={modalStyles.iconContainer}>
            <Ionicons name="warning" size={48} color="#f59e0b" />
          </View>
          
          <Text style={modalStyles.title}>{title}</Text>
          <Text style={modalStyles.message}>{message}</Text>
          
          <View style={modalStyles.buttonContainer}>
            <TouchableOpacity 
              style={[modalStyles.button, modalStyles.cancelButton]} 
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[modalStyles.button, modalStyles.confirmButton]} 
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function RequestsScreen() {
  const navigation = useNavigation();
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingRequests, setProcessingRequests] = useState(new Set());
  
  const router = useRouter()
  // Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // 🔧 FIX: Only create animations if not on web
  const fadeAnim = isWeb ? null : new Animated.Value(0);
  const slideAnim = isWeb ? null : new Animated.Value(0);

  useEffect(() => {
    initializeScreen();
  }, []);

  useEffect(() => {
    if (!loading && !isWeb && fadeAnim && slideAnim) {
      // 🔧 FIX: Only run animations on mobile
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const initializeScreen = async () => {
    try {
      setLoading(true);
      setError(null);
      await loadRequests();
    } catch (error) {
      setError('Failed to load connection requests');
      showErrorFeedback('Loading Error', 'Unable to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      setError(null);
      const data = await ConnectionAPI.getMyRequests();
      setSentRequests(data?.sent_requests || []);
      setReceivedRequests(data?.received_requests || []);
      return data;
    } catch (error) {
      console.error('Load requests error:', error);
      setError('Unable to load requests');
      throw error;
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await loadRequests();
      showSuccessFeedback('Requests refreshed successfully');
      
      // Haptic feedback on successful refresh (mobile only)
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      showErrorFeedback('Refresh Failed', 'Unable to refresh requests');
    } finally {
      setRefreshing(false);
    }
  };

  const handleBackPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('connections/connection-screen'); // Navigate back to connection screen
    // navigation.navigate('connection-screen'); // Navigate back to connection screen
  };

  const handleResponse = async (requestId, action, senderName) => {
    if (processingRequests.has(requestId)) return;

    try {
      setProcessingRequests(prev => new Set([...prev, requestId]));
      await ConnectionAPI.respondToRequest(requestId, action);
      
      const actionText = action === 'accept' ? 'accepted' : 'rejected';
      const message = `Connection request from ${senderName} ${actionText}`;
      
      showSuccessFeedback(message);
      await loadRequests();
      
      // Haptic feedback (mobile only)
      if (Platform.OS === 'ios') {
        const feedbackType = action === 'accept' 
          ? Haptics.NotificationFeedbackType.Success 
          : Haptics.NotificationFeedbackType.Warning;
        Haptics.notificationAsync(feedbackType);
      }
    } catch (error) {
      console.error(`${action} request error:`, error);
      showErrorFeedback(
        `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`, 
        `Unable to ${action} the request. Please try again.`
      );
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Updated cancelRequest function to use modal
  const cancelRequest = async (requestId, receiverName) => {
    setSelectedRequest({ id: requestId, name: receiverName });
    setShowCancelModal(true);
  };

  // Handle modal confirmation
  const handleConfirmCancel = async () => {
    if (!selectedRequest || processingRequests.has(selectedRequest.id)) return;

    try {
      setProcessingRequests(prev => new Set([...prev, selectedRequest.id]));
      await ConnectionAPI.cancelRequest(selectedRequest.id);
      showSuccessFeedback(`Request to ${selectedRequest.name} cancelled`);
      await loadRequests();
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      console.error('Cancel request error:', error);
      showErrorFeedback('Cancel Failed', 'Unable to cancel request. Please try again.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedRequest.id);
        return newSet;
      });
      setShowCancelModal(false);
      setSelectedRequest(null);
    }
  };

  // Handle modal cancellation
  const handleCancelModal = () => {
    setShowCancelModal(false);
    setSelectedRequest(null);
  };

  // Platform-aware feedback functions
  const showSuccessFeedback = (message) => {
    if (Platform.OS === 'web') {
      // For web, you could use a toast library or simple alert
      console.log('Success:', message);
      // Optionally show a temporary success message in your UI
    } else {
      Alert.alert('Success', message, [{ text: 'OK', style: 'default' }]);
    }
  };

  const showErrorFeedback = (title, message) => {
    if (Platform.OS === 'web') {
      console.error(`${title}:`, message);
      // Optionally show error in your UI
    } else {
      Alert.alert(title, message, [
        { text: 'OK', style: 'default' },
        { text: 'Retry', onPress: initializeScreen, style: 'cancel' }
      ]);
    }
  };

  const handleRetry = () => {
    initializeScreen();
  };

  const switchTab = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      // Haptic feedback for tab switch (mobile only)
      if (Platform.OS === 'ios') {
        Haptics.selectionAsync();
      }
    }
  };



  
  const renderReceivedRequest = ({ item, index }) => {
    const isProcessing = processingRequests.has(item.id);
    
    // Only use animations on mobile
    const animatedStyle = !isWeb && fadeAnim && slideAnim ? {
      opacity: fadeAnim,
      transform: [{
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, 0],
        }),
      }],
    } : {};

    const CardComponent = isWeb ? View : Animated.View;

    return (
      <CardComponent style={[animatedStyle, { delay: index * 100 }]}>
        <View style={[styles.requestCard, isProcessing && styles.processingCard]}>
          <View style={styles.requestInfo}>
            <View style={styles.avatarContainer}>
              <Image
                
                source={{ uri: ConnectionAPI.getUserProfilePicture(item.sender) }}
                style={styles.avatar}
                defaultSource={{ uri: 'https://ui-avatars.com/api/?name=User&background=ccc&color=fff&size=128' }}
              />
              <View style={styles.newRequestIndicator} />
            </View>
            <View style={styles.requestDetails}>
              <Text style={styles.username} numberOfLines={1}>@{item.sender?.username}</Text>
              <Text style={styles.requestTime}>
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleResponse(item.id, 'accept', item.sender?.username)}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleResponse(item.id, 'reject', item.sender?.username)}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Decline</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CardComponent>
    );
  };



  const renderSentRequest = ({ item, index }) => {
    const isProcessing = processingRequests.has(item.id);
    
    return (
      <View style={[styles.requestCard, isProcessing && styles.processingCard]}>
        <View style={styles.requestInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: ConnectionAPI.getUserProfilePicture(item.receiver) }}
              style={styles.avatar}
              defaultSource={{ uri: 'https://ui-avatars.com/api/?name=User&background=ccc&color=fff&size=128' }}
            />
            <View style={styles.pendingIndicator} />
          </View>
          <View style={styles.requestDetails}>
            <Text style={styles.username} numberOfLines={1}>@{item.receiver?.username}</Text>
            <Text style={styles.requestTime}>
              Sent {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
            <View style={styles.statusContainer}>
              <View style={styles.pendingStatus}>
                <View style={styles.pendingDot} />
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => cancelRequest(item.id, item.receiver?.username)}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="close" size={16} color="white" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };










  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Connection Requests</Text>
            <Text style={styles.headerSubtitle}>
              {receivedRequests.length + sentRequests.length} total requests
            </Text>
          </View>
          
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>{receivedRequests.length}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'received' && styles.activeTab]}
        onPress={() => switchTab('received')}
        activeOpacity={0.8}
      >
        <View style={styles.tabContent}>
          <Ionicons 
            name="mail" 
            size={20} 
            color={activeTab === 'received' ? '#10b981' : '#9ca3af'} 
          />
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Received
          </Text>
          {receivedRequests.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{receivedRequests.length}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
        onPress={() => switchTab('sent')}
        activeOpacity={0.8}
      >
        <View style={styles.tabContent}>
          <Ionicons 
            name="paper-plane" 
            size={20} 
            color={activeTab === 'sent' ? '#10b981' : '#9ca3af'} 
          />
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Sent
          </Text>
          {sentRequests.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{sentRequests.length}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => {
    const EmptyComponent = isWeb ? View : Animated.View;
    const emptyStyle = !isWeb && fadeAnim ? { opacity: fadeAnim } : {};
    
    return (
      <EmptyComponent style={[styles.emptyContainer, emptyStyle]}>
        <View style={styles.emptyIconContainer}>
          <Ionicons 
            name={activeTab === 'received' ? 'mail-open' : 'paper-plane'} 
            size={80} 
            color="#e5e7eb" 
          />
        </View>
        <Text style={styles.emptyText}>
          No {activeTab} requests
        </Text>
        <Text style={styles.emptySubtext}>
          {activeTab === 'received' 
            ? 'New connection requests will appear here'
            : 'Requests you send will be tracked here'
          }
        </Text>
        {activeTab === 'received' && (
          <TouchableOpacity style={styles.discoverButton} activeOpacity={0.8}>
            <Text style={styles.discoverButtonText}>Find People</Text>
          </TouchableOpacity>
        )}
      </EmptyComponent>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  if (error && receivedRequests.length === 0 && sentRequests.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#ef4444" />
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentData = activeTab === 'received' ? receivedRequests : sentRequests;
  const renderFunction = activeTab === 'received' ? renderReceivedRequest : renderSentRequest;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10b981" />
      {renderHeader()}
      {renderTabs()}
      
      <FlatList
        data={currentData}
        renderItem={renderFunction}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#10b981']}
            tintColor="#10b981"
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        visible={showCancelModal}
        title="Cancel Request"
        message={`Are you sure you want to cancel your request to ${selectedRequest?.name}?`}
        confirmText="Cancel Request"
        cancelText="Keep Request"
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelModal}
      />
    </View>
  );
}

// import { StyleSheet, Dimensions, Platform } from 'react-native';

// const { width, height } = Dimensions.get('window');
// const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Light gray background
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    elevation: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header Styles
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 17 : 2,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  notificationBadge: {
    backgroundColor: '#ef4444',
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },

  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#f0fdf4',
    elevation: 2,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#10b981',
  },
  tabBadge: {
    backgroundColor: '#10b981',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },

  // List Styles
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  separator: {
    height: 12,
  },

  // Request Card Styles
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  processingCard: {
    opacity: 0.7,
    backgroundColor: '#f8fafc',
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  newRequestIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
  pendingIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
    borderWidth: 2,
    borderColor: 'white',
  },
  requestDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  requestTime: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 6,
  },
  statusContainer: {
    marginTop: 4,
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    marginRight: 6,
  },
  pendingText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Action Button Styles
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  cancelButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  discoverButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  discoverButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Modal Styles
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  confirmButton: {
    backgroundColor: '#ef4444',
    elevation: 2,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// export { styles, modalStyles };

















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

//   // Header Styles
//   headerContainer: {
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     paddingTop: Platform.OS === 'ios' ? 16 : 12,
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
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
//   },
//   backButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   headerContent: {
//     flex: 1,
//     alignItems: 'center',
//     marginHorizontal: 16,
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#ffffff',
//     textAlign: 'center',
//     textShadowColor: 'rgba(0, 0, 0, 0.3)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: 'rgba(255, 255, 255, 0.85)',
//     marginTop: 4,
//     fontWeight: '500',
//   },
//   notificationBadge: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(239, 68, 68, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#ffffff',
//     elevation: 4,
//     shadowColor: '#ef4444',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.4,
//     shadowRadius: 4,
//   },
//   badgeText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#ffffff',
//   },

//   // Tab Styles
//   tabContainer: {
//     flexDirection: 'row',
//     backgroundColor: '#1e293b',
//     marginHorizontal: 20,
//     marginTop: 16,
//     marginBottom: 8,
//     borderRadius: 16,
//     padding: 4,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//     borderWidth: 1,
//     borderColor: '#334155',
//   },
//   tab: {
//     flex: 1,
//     borderRadius: 12,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//   },
//   activeTab: {
//     backgroundColor: '#0f172a',
//     elevation: 2,
//     shadowColor: '#10b981',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     borderWidth: 1,
//     borderColor: '#10b981',
//   },
//   tabContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//   },
//   tabText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#94a3b8',
//   },
//   activeTabText: {
//     color: '#10b981',
//   },
//   tabBadge: {
//     backgroundColor: '#ef4444',
//     borderRadius: 10,
//     minWidth: 20,
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 6,
//   },
//   tabBadgeText: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: '#ffffff',
//   },

//   // List Container
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 12,
//     paddingBottom: 20,
//     flexGrow: 1,
//   },
//   separator: {
//     height: 12,
//   },

//   // Request Cards
//   requestCard: {
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
//   },
//   processingCard: {
//     opacity: 0.7,
//     backgroundColor: '#1a202c',
//   },
//   requestInfo: {
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
//     borderColor: '#10b981',
//   },
//   newRequestIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: '#ef4444',
//     borderWidth: 3,
//     borderColor: '#1e293b',
//   },
//   pendingIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: '#f59e0b',
//     borderWidth: 3,
//     borderColor: '#1e293b',
//   },
//   requestDetails: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   username: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#f1f5f9',
//     marginBottom: 4,
//   },
//   requestTime: {
//     fontSize: 13,
//     color: '#94a3b8',
//     fontWeight: '500',
//     marginBottom: 6,
//   },
//   statusContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   pendingStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(245, 158, 11, 0.15)',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(245, 158, 11, 0.3)',
//   },
//   pendingDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#f59e0b',
//     marginRight: 6,
//   },
//   pendingText: {
//     fontSize: 11,
//     fontWeight: '600',
//     color: '#f59e0b',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },

//   // Action Buttons
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     gap: 6,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 3,
//   },
//   acceptButton: {
//     backgroundColor: '#10b981',
//     borderWidth: 1,
//     borderColor: '#059669',
//   },
//   rejectButton: {
//     backgroundColor: '#ef4444',
//     borderWidth: 1,
//     borderColor: '#dc2626',
//   },
//   cancelButton: {
//     backgroundColor: '#f59e0b',
//     borderWidth: 1,
//     borderColor: '#d97706',
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//   },
//   actionButtonText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#ffffff',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   cancelButtonText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#ffffff',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
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
//     backgroundColor: '#10b981',
//     paddingHorizontal: 32,
//     paddingVertical: 16,
//     borderRadius: 16,
//     elevation: 4,
//     shadowColor: '#10b981',
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
//     backgroundColor: '#ef4444',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//     elevation: 3,
//     shadowColor: '#ef4444',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   retryButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#ffffff',
//   },

//   // Responsive Design for Small Devices
//   ...(width < 375 ? {
//     requestCard: {
//       padding: 16,
//       flexDirection: 'column',
//       alignItems: 'stretch',
//       gap: 16,
//     },
//     requestInfo: {
//       flex: 1,
//     },
//     actionButtons: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       gap: 8,
//     },
//     actionButton: {
//       flex: 1,
//       paddingVertical: 12,
//     },
//     avatar: {
//       width: 48,
//       height: 48,
//       borderRadius: 24,
//     },
//     username: {
//       fontSize: 16,
//     },
//     headerTitle: {
//       fontSize: 20,
//     },
//   } : {}),

//   // Responsive Design for Large Devices
//   ...(width > 414 ? {
//     requestCard: {
//       padding: 24,
//     },
//     avatar: {
//       width: 64,
//       height: 64,
//       borderRadius: 32,
//     },
//     username: {
//       fontSize: 19,
//     },
//     listContainer: {
//       paddingHorizontal: 24,
//     },
//     tabContainer: {
//       marginHorizontal: 24,
//     },
//   } : {}),
// });

// // Enhanced Modal Styles with Dark Theme
// const modalStyles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContent: {
//     backgroundColor: '#1e293b',
//     borderRadius: 24,
//     padding: 28,
//     width: '100%',
//     maxWidth: 380,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#334155',
//     elevation: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 12 },
//     shadowOpacity: 0.4,
//     shadowRadius: 16,
//   },
//   iconContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: 'rgba(245, 158, 11, 0.15)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     borderWidth: 2,
//     borderColor: 'rgba(245, 158, 11, 0.3)',
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#f1f5f9',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   message: {
//     fontSize: 16,
//     color: '#94a3b8',
//     marginBottom: 28,
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     gap: 12,
//     width: '100%',
//   },
//   button: {
//     flex: 1,
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     borderRadius: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   cancelButton: {
//     backgroundColor: '#374151',
//     borderWidth: 1,
//     borderColor: '#4b5563',
//   },
//   confirmButton: {
//     backgroundColor: '#ef4444',
//     borderWidth: 1,
//     borderColor: '#dc2626',
//   },
//   cancelButtonText: {
//     color: '#d1d5db',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   confirmButtonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });
























// Modal Styles
// const modalStyles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: 20,
//     padding: 24,
//     width: '100%',
//     maxWidth: 400,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 10,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   iconContainer: {
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1f2937',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   message: {
//     fontSize: 16,
//     color: '#6b7280',
//     marginBottom: 24,
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 12,
//     width: '100%',
//   },
//   button: {
//     flex: 1,
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   cancelButton: {
//     backgroundColor: '#f3f4f6',
//     borderWidth: 1,
//     borderColor: '#d1d5db',
//   },
//   confirmButton: {
//     backgroundColor: '#ef4444',
//   },
//   cancelButtonText: {
//     color: '#374151',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   confirmButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// // Updated styles with back button
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
//     alignItems: 'center',
//     paddingHorizontal: 24,
//   },
//   backButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//     backdropFilter: 'blur(10px)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   headerContent: {
//     flex: 1,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontWeight: '500',
//   },
//   notificationBadge: {
//     backgroundColor: '#ef4444',
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     minWidth: 24,
//     alignItems: 'center',
//   },
//   badgeText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     marginHorizontal: 20,
//     marginTop: 20,
//     borderRadius: 16,
//     padding: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   activeTab: {
//     backgroundColor: '#f0fdf4',
//     borderWidth: 1,
//     borderColor: '#bbf7d0',
//   },
//   tabContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     position: 'relative',
//   },
//   tabText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#9ca3af',
//     marginLeft: 8,
//   },
//   activeTabText: {
//     color: '#10b981',
//   },
//   tabBadge: {
//     backgroundColor: '#10b981',
//     borderRadius: 8,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     marginLeft: 6,
//     minWidth: 20,
//     alignItems: 'center',
//   },
//   tabBadgeText: {
//     color: '#fff',
//     fontSize: 11,
//     fontWeight: '600',
//   },
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     paddingBottom: 100,
//   },
//   requestCard: {
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
//   processingCard: {
//     opacity: 0.7,
//   },
//   requestInfo: {
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
//   newRequestIndicator: {
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
//   pendingIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#f59e0b',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   requestDetails: {
//     flex: 1,
//     marginRight: 12,
//   },
//   requestName: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1f2937',
//     marginBottom: 2,
//   },
//   username: {
//     fontSize: 15,
//     color: '#10b981',
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   requestTime: {
//     fontSize: 13,
//     color: '#9ca3af',
//     fontWeight: '400',
//   },
//   statusContainer: {
//     marginTop: 4,
//   },
//   pendingStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   pendingDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#f59e0b',
//     marginRight: 6,
//   },
//   pendingText: {
//     fontSize: 12,
//     color: '#f59e0b',
//     fontWeight: '500',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 12,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     marginLeft: 8,
//     minWidth: 80,
//     justifyContent: 'center',
//   },
//   acceptButton: {
//     backgroundColor: '#10b981',
//   },
//   rejectButton: {
//     backgroundColor: '#ef4444',
//   },
//   cancelButton: {
//     backgroundColor: '#ef4444',
//   },
//   actionButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   cancelButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   separator: {
//     height: 12,
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
//     color: '#6b7280',
//     fontWeight: '500',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   errorText: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1f2937',
//     marginTop: 16,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   errorSubtext: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//     marginBottom: 24,
//     lineHeight: 22,
//   },
//   retryButton: {
//     backgroundColor: '#10b981',
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 12,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     paddingBottom: 80,
//   },
//   emptyIconContainer: {
//     marginBottom: 24,
//   },
//   emptyText: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#1f2937',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 32,
//   },
//   discoverButton: {
//     backgroundColor: '#10b981',
//     paddingVertical: 14,
//     paddingHorizontal: 28,
//     borderRadius: 12,
//   },
//   discoverButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
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
//   Alert,
//   ActivityIndicator,
//   Animated,
//   Platform,
//   StatusBar,
//   Dimensions,
//   Haptics,
//   Modal,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import ConnectionAPI from '../api/connectionService';

// const { width } = Dimensions.get('window');
// const isWeb = Platform.OS === 'web';

// // Custom Confirmation Modal Component
// const ConfirmationModal = ({ visible, onConfirm, onCancel, title, message, confirmText = "Confirm", cancelText = "Cancel" }) => {
//   return (
//     <Modal
//       animationType="fade"
//       transparent={true}
//       visible={visible}
//       onRequestClose={onCancel}
//     >
//       <View style={modalStyles.overlay}>
//         <View style={modalStyles.modalContent}>
//           <View style={modalStyles.iconContainer}>
//             <Ionicons name="warning" size={48} color="#f59e0b" />
//           </View>
          
//           <Text style={modalStyles.title}>{title}</Text>
//           <Text style={modalStyles.message}>{message}</Text>
          
//           <View style={modalStyles.buttonContainer}>
//             <TouchableOpacity 
//               style={[modalStyles.button, modalStyles.cancelButton]} 
//               onPress={onCancel}
//               activeOpacity={0.8}
//             >
//               <Text style={modalStyles.cancelButtonText}>{cancelText}</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={[modalStyles.button, modalStyles.confirmButton]} 
//               onPress={onConfirm}
//               activeOpacity={0.8}
//             >
//               <Text style={modalStyles.confirmButtonText}>{confirmText}</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// export default function RequestsScreen() {
//   const [sentRequests, setSentRequests] = useState([]);
//   const [receivedRequests, setReceivedRequests] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const [activeTab, setActiveTab] = useState('received');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [processingRequests, setProcessingRequests] = useState(new Set());
  
//   // Modal state
//   const [showCancelModal, setShowCancelModal] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState(null);
  
//   // 🔧 FIX: Only create animations if not on web
//   const fadeAnim = isWeb ? null : new Animated.Value(0);
//   const slideAnim = isWeb ? null : new Animated.Value(0);

//   useEffect(() => {
//     initializeScreen();
//   }, []);

//   useEffect(() => {
//     if (!loading && !isWeb && fadeAnim && slideAnim) {
//       // 🔧 FIX: Only run animations on mobile
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

//   const initializeScreen = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       await loadRequests();
//     } catch (error) {
//       setError('Failed to load connection requests');
//       showErrorFeedback('Loading Error', 'Unable to load requests. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadRequests = async () => {
//     try {
//       setError(null);
//       const data = await ConnectionAPI.getMyRequests();
//       setSentRequests(data?.sent_requests || []);
//       setReceivedRequests(data?.received_requests || []);
//       return data;
//     } catch (error) {
//       console.error('Load requests error:', error);
//       setError('Unable to load requests');
//       throw error;
//     }
//   };

//   const onRefresh = async () => {
//     try {
//       setRefreshing(true);
//       setError(null);
//       await loadRequests();
//       showSuccessFeedback('Requests refreshed successfully');
      
//       // Haptic feedback on successful refresh (mobile only)
//       if (Platform.OS === 'ios') {
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (error) {
//       showErrorFeedback('Refresh Failed', 'Unable to refresh requests');
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const handleResponse = async (requestId, action, senderName) => {
//     if (processingRequests.has(requestId)) return;

//     try {
//       setProcessingRequests(prev => new Set([...prev, requestId]));
//       await ConnectionAPI.respondToRequest(requestId, action);
      
//       const actionText = action === 'accept' ? 'accepted' : 'rejected';
//       const message = `Connection request from ${senderName} ${actionText}`;
      
//       showSuccessFeedback(message);
//       await loadRequests();
      
//       // Haptic feedback (mobile only)
//       if (Platform.OS === 'ios') {
//         const feedbackType = action === 'accept' 
//           ? Haptics.NotificationFeedbackType.Success 
//           : Haptics.NotificationFeedbackType.Warning;
//         Haptics.notificationAsync(feedbackType);
//       }
//     } catch (error) {
//       console.error(`${action} request error:`, error);
//       showErrorFeedback(
//         `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`, 
//         `Unable to ${action} the request. Please try again.`
//       );
//     } finally {
//       setProcessingRequests(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(requestId);
//         return newSet;
//       });
//     }
//   };

//   // Updated cancelRequest function to use modal
//   const cancelRequest = async (requestId, receiverName) => {
//     setSelectedRequest({ id: requestId, name: receiverName });
//     setShowCancelModal(true);
//   };

//   // Handle modal confirmation
//   const handleConfirmCancel = async () => {
//     if (!selectedRequest || processingRequests.has(selectedRequest.id)) return;

//     try {
//       setProcessingRequests(prev => new Set([...prev, selectedRequest.id]));
//       await ConnectionAPI.cancelRequest(selectedRequest.id);
//       showSuccessFeedback(`Request to ${selectedRequest.name} cancelled`);
//       await loadRequests();
      
//       if (Platform.OS === 'ios') {
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
//       }
//     } catch (error) {
//       console.error('Cancel request error:', error);
//       showErrorFeedback('Cancel Failed', 'Unable to cancel request. Please try again.');
//     } finally {
//       setProcessingRequests(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(selectedRequest.id);
//         return newSet;
//       });
//       setShowCancelModal(false);
//       setSelectedRequest(null);
//     }
//   };

//   // Handle modal cancellation
//   const handleCancelModal = () => {
//     setShowCancelModal(false);
//     setSelectedRequest(null);
//   };

//   // Platform-aware feedback functions
//   const showSuccessFeedback = (message) => {
//     if (Platform.OS === 'web') {
//       // For web, you could use a toast library or simple alert
//       console.log('Success:', message);
//       // Optionally show a temporary success message in your UI
//     } else {
//       Alert.alert('Success', message, [{ text: 'OK', style: 'default' }]);
//     }
//   };

//   const showErrorFeedback = (title, message) => {
//     if (Platform.OS === 'web') {
//       console.error(`${title}:`, message);
//       // Optionally show error in your UI
//     } else {
//       Alert.alert(title, message, [
//         { text: 'OK', style: 'default' },
//         { text: 'Retry', onPress: initializeScreen, style: 'cancel' }
//       ]);
//     }
//   };

//   const handleRetry = () => {
//     initializeScreen();
//   };

//   const switchTab = (tab) => {
//     if (tab !== activeTab) {
//       setActiveTab(tab);
//       // Haptic feedback for tab switch (mobile only)
//       if (Platform.OS === 'ios') {
//         Haptics.selectionAsync();
//       }
//     }
//   };

//   // 🔧 FIX: Platform-aware render functions
//   const renderReceivedRequest = ({ item, index }) => {
//     const isProcessing = processingRequests.has(item.id);
    
//     // Only use animations on mobile
//     const animatedStyle = !isWeb && fadeAnim && slideAnim ? {
//       opacity: fadeAnim,
//       transform: [{
//         translateX: slideAnim.interpolate({
//           inputRange: [0, 1],
//           outputRange: [-50, 0],
//         }),
//       }],
//     } : {};

//     const CardComponent = isWeb ? View : Animated.View;

//     return (
//       <CardComponent style={[animatedStyle, { delay: index * 100 }]}>
//         <View style={[styles.requestCard, isProcessing && styles.processingCard]}>
//           <View style={styles.requestInfo}>
//             <View style={styles.avatarContainer}>
//               <Image
//                 source={{ 
//                   uri: item.sender?.avatar || `https://ui-avatars.com/api/?name=${item.sender?.username}&background=10b981&color=fff&size=128`
//                 }}
//                 style={styles.avatar}
//                 defaultSource={{ uri: 'https://ui-avatars.com/api/?name=User&background=ccc&color=fff&size=128' }}
//               />
//               <View style={styles.newRequestIndicator} />
//             </View>
//             <View style={styles.requestDetails}>
//               <Text style={styles.username} numberOfLines={1}>@{item.sender?.username}</Text>
//               <Text style={styles.requestTime}>
//                 {new Date(item.created_at).toLocaleDateString('en-US', {
//                   month: 'short',
//                   day: 'numeric',
//                   year: 'numeric',
//                   hour: '2-digit',
//                   minute: '2-digit'
//                 })}
//               </Text>
//             </View>
//           </View>
//           <View style={styles.actionButtons}>
//             <TouchableOpacity
//               style={[styles.actionButton, styles.acceptButton]}
//               onPress={() => handleResponse(item.id, 'accept', item.sender?.username)}
//               disabled={isProcessing}
//               activeOpacity={0.7}
//             >
//               {isProcessing ? (
//                 <ActivityIndicator size="small" color="white" />
//               ) : (
//                 <>
//                   <Ionicons name="checkmark-circle" size={20} color="white" />
//                   <Text style={styles.actionButtonText}>Accept</Text>
//                 </>
//               )}
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.actionButton, styles.rejectButton]}
//               onPress={() => handleResponse(item.id, 'reject', item.sender?.username)}
//               disabled={isProcessing}
//               activeOpacity={0.7}
//             >
//               {isProcessing ? (
//                 <ActivityIndicator size="small" color="white" />
//               ) : (
//                 <>
//                   <Ionicons name="close-circle" size={20} color="white" />
//                   <Text style={styles.actionButtonText}>Decline</Text>
//                 </>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       </CardComponent>
//     );
//   };

//   const renderSentRequest = ({ item, index }) => {
//     const isProcessing = processingRequests.has(item.id);
    
//     // Only use animations on mobile
//     const animatedStyle = !isWeb && fadeAnim && slideAnim ? {
//       opacity: fadeAnim,
//       transform: [{
//         translateX: slideAnim.interpolate({
//           inputRange: [0, 1],
//           outputRange: [50, 0],
//         }),
//       }],
//     } : {};

//     const CardComponent = isWeb ? View : Animated.View;

//     return (
//       <CardComponent style={[animatedStyle, { delay: index * 100 }]}>
//         <View style={[styles.requestCard, isProcessing && styles.processingCard]}>
//           <View style={styles.requestInfo}>
//             <View style={styles.avatarContainer}>
//               <Image
//                 source={{ 
//                   // uri: item.receiver?.avatar || `https://ui-avatars.com/api/?name=${item.receiver?.username}&background=f59e0b&color=fff&size=128`
//                   uri: item.receiver?.profile_picture || `https://ui-avatars.com/api/?name=${item.receiver?.username}&background=f59e0b&color=fff&size=128`
//                 }}
//                 style={styles.avatar}
//                 defaultSource={{ uri: 'https://ui-avatars.com/api/?name=User&background=ccc&color=fff&size=128' }}
//               />
//               <View style={styles.pendingIndicator} />
//             </View>
//             <View style={styles.requestDetails}>
//               <Text style={styles.username} numberOfLines={1}>@{item.receiver?.username}</Text>
//               <Text style={styles.requestTime}>
//                 Sent {new Date(item.created_at).toLocaleDateString('en-US', {
//                   month: 'short',
//                   day: 'numeric',
//                   year: 'numeric'
//                 })}
//               </Text>
//               <View style={styles.statusContainer}>
//                 <View style={styles.pendingStatus}>
//                   <View style={styles.pendingDot} />
//                   <Text style={styles.pendingText}>Pending</Text>
//                 </View>
//               </View>
//             </View>
//           </View>
//           <TouchableOpacity
//             style={[styles.actionButton, styles.cancelButton]}
//             onPress={() => cancelRequest(item.id, item.receiver?.username)}
//             disabled={isProcessing}
//             activeOpacity={0.7}
//           >
//             {isProcessing ? (
//               <ActivityIndicator size="small" color="white" />
//             ) : (
//               <>
//                 <Ionicons name="close" size={16} color="white" />
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>
//       </CardComponent>
//     );
//   };

//   const renderHeader = () => (
//     <View style={styles.headerContainer}>
//       <LinearGradient
//         colors={['#10b981', '#059669']}
//         style={styles.headerGradient}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       >
//         <View style={styles.header}>
//           <View>
//             <Text style={styles.headerTitle}>Connection Requests</Text>
//             <Text style={styles.headerSubtitle}>
//               {receivedRequests.length + sentRequests.length} total requests
//             </Text>
//           </View>
//           <View style={styles.notificationBadge}>
//             <Text style={styles.badgeText}>{receivedRequests.length}</Text>
//           </View>
//         </View>
//       </LinearGradient>
//     </View>
//   );

//   const renderTabs = () => (
//     <View style={styles.tabContainer}>
//       <TouchableOpacity
//         style={[styles.tab, activeTab === 'received' && styles.activeTab]}
//         onPress={() => switchTab('received')}
//         activeOpacity={0.8}
//       >
//         <View style={styles.tabContent}>
//           <Ionicons 
//             name="mail" 
//             size={20} 
//             color={activeTab === 'received' ? '#10b981' : '#9ca3af'} 
//           />
//           <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
//             Received
//           </Text>
//           {receivedRequests.length > 0 && (
//             <View style={styles.tabBadge}>
//               <Text style={styles.tabBadgeText}>{receivedRequests.length}</Text>
//             </View>
//           )}
//         </View>
//       </TouchableOpacity>
//       <TouchableOpacity
//         style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
//         onPress={() => switchTab('sent')}
//         activeOpacity={0.8}
//       >
//         <View style={styles.tabContent}>
//           <Ionicons 
//             name="paper-plane" 
//             size={20} 
//             color={activeTab === 'sent' ? '#10b981' : '#9ca3af'} 
//           />
//           <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
//             Sent
//           </Text>
//           {sentRequests.length > 0 && (
//             <View style={styles.tabBadge}>
//               <Text style={styles.tabBadgeText}>{sentRequests.length}</Text>
//             </View>
//           )}
//         </View>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderEmptyState = () => {
//     const EmptyComponent = isWeb ? View : Animated.View;
//     const emptyStyle = !isWeb && fadeAnim ? { opacity: fadeAnim } : {};
    
//     return (
//       <EmptyComponent style={[styles.emptyContainer, emptyStyle]}>
//         <View style={styles.emptyIconContainer}>
//           <Ionicons 
//             name={activeTab === 'received' ? 'mail-open' : 'paper-plane'} 
//             size={80} 
//             color="#e5e7eb" 
//           />
//         </View>
//         <Text style={styles.emptyText}>
//           No {activeTab} requests
//         </Text>
//         <Text style={styles.emptySubtext}>
//           {activeTab === 'received' 
//             ? 'New connection requests will appear here'
//             : 'Requests you send will be tracked here'
//           }
//         </Text>
//         {activeTab === 'received' && (
//           <TouchableOpacity style={styles.discoverButton} activeOpacity={0.8}>
//             <Text style={styles.discoverButtonText}>Find People</Text>
//           </TouchableOpacity>
//         )}
//       </EmptyComponent>
//     );
//   };
  
//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#10b981" />
//         <Text style={styles.loadingText}>Loading requests...</Text>
//       </View>
//     );
//   }

//   if (error && receivedRequests.length === 0 && sentRequests.length === 0) {
//     return (
//       <View style={styles.container}>
//         {renderHeader()}
//         <View style={styles.errorContainer}>
//           <Ionicons name="alert-circle" size={60} color="#ef4444" />
//           <Text style={styles.errorText}>Something went wrong</Text>
//           <Text style={styles.errorSubtext}>{error}</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
//             <Text style={styles.retryButtonText}>Try Again</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   const currentData = activeTab === 'received' ? receivedRequests : sentRequests;
//   const renderFunction = activeTab === 'received' ? renderReceivedRequest : renderSentRequest;

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#10b981" />
//       {renderHeader()}
//       {renderTabs()}
      
//       <FlatList
//         data={currentData}
//         renderItem={renderFunction}
//         keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.listContainer}
//         refreshControl={
//           <RefreshControl 
//             refreshing={refreshing} 
//             onRefresh={onRefresh}
//             colors={['#10b981']}
//             tintColor="#10b981"
//           />
//         }
//         ListEmptyComponent={renderEmptyState}
//         ItemSeparatorComponent={() => <View style={styles.separator} />}
//       />

//       {/* Custom Confirmation Modal */}
//       <ConfirmationModal
//         visible={showCancelModal}
//         title="Cancel Request"
//         message={`Are you sure you want to cancel your request to ${selectedRequest?.name}?`}
//         confirmText="Cancel Request"
//         cancelText="Keep Request"
//         onConfirm={handleConfirmCancel}
//         onCancel={handleCancelModal}
//       />
//     </View>
//   );
// }

// // Modal Styles
// const modalStyles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: 20,
//     padding: 24,
//     width: '100%',
//     maxWidth: 400,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 10,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   iconContainer: {
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1f2937',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   message: {
//     fontSize: 16,
//     color: '#6b7280',
//     marginBottom: 24,
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 12,
//     width: '100%',
//   },
//   button: {
//     flex: 1,
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   cancelButton: {
//     backgroundColor: '#f3f4f6',
//     borderWidth: 1,
//     borderColor: '#d1d5db',
//   },
//   confirmButton: {
//     backgroundColor: '#ef4444',
//   },
//   cancelButtonText: {
//     color: '#374151',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   confirmButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// // Your existing styles remain the same
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
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontWeight: '500',
//   },
//   notificationBadge: {
//     backgroundColor: '#ef4444',
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     minWidth: 24,
//     alignItems: 'center',
//   },
//   badgeText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     marginHorizontal: 20,
//     marginTop: 20,
//     borderRadius: 16,
//     padding: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   activeTab: {
//     backgroundColor: '#f0fdf4',
//     borderWidth: 1,
//     borderColor: '#bbf7d0',
//   },
//   tabContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     position: 'relative',
//   },
//   tabText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#9ca3af',
//     marginLeft: 8,
//   },
//   activeTabText: {
//     color: '#10b981',
//   },
//   tabBadge: {
//     backgroundColor: '#10b981',
//     borderRadius: 8,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     marginLeft: 6,
//     minWidth: 20,
//     alignItems: 'center',
//   },
//   tabBadgeText: {
//     color: '#fff',
//     fontSize: 11,
//     fontWeight: '600',
//   },
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     paddingBottom: 100,
//   },
//   requestCard: {
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
//   processingCard: {
//     opacity: 0.7,
//   },
//   requestInfo: {
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
//   newRequestIndicator: {
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
//   pendingIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#f59e0b',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   requestDetails: {
//     flex: 1,
//     marginRight: 12,
//   },
//   requestName: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1f2937',
//     marginBottom: 2,
//   },
//   username: {
//     fontSize: 15,
//     color: '#10b981',
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   requestTime: {
//     fontSize: 13,
//     color: '#9ca3af',
//     fontWeight: '400',
//   },
//   statusContainer: {
//     marginTop: 4,
//   },
//   pendingStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   pendingDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#f59e0b',
//     marginRight: 6,
//   },
//   pendingText: {
//     fontSize: 12,
//     color: '#f59e0b',
//     fontWeight: '500',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 12,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     marginLeft: 8,
//     minWidth: 80,
//     justifyContent: 'center',
//   },
//   acceptButton: {
//     backgroundColor: '#10b981',
//   },
//   rejectButton: {
//     backgroundColor: '#ef4444',
//   },
//   cancelButton: {
//     backgroundColor: '#f59e0b',
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   cancelButtonText: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 4,
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
//     backgroundColor: '#10b981',
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
//     color: '#10b981',
//     fontWeight: '500',
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
//     backgroundColor: '#10b981',
//     borderRadius: 12,
//     paddingVertical: 14,
//     paddingHorizontal: 32,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
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
//   Alert,
//   ScrollView,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import ConnectionAPI from '../api/connectionService'; // Adjust the import path as necessary

// export default function RequestsScreen() {
//   const [sentRequests, setSentRequests] = useState([]);
//   const [receivedRequests, setReceivedRequests] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const [activeTab, setActiveTab] = useState('received');

//   useEffect(() => {
//     loadRequests();
//   }, []);

//   const loadRequests = async () => {
//     try {
//       const data = await ConnectionAPI.getMyRequests();
//       setSentRequests(data.sent_requests || []);
//       setReceivedRequests(data.received_requests || []);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to load requests');
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadRequests();
//     setRefreshing(false);
//   };

//   const handleResponse = async (requestId, action) => {
//     try {
//       await ConnectionAPI.respondToRequest(requestId, action);
//       Alert.alert('Success', `Request ${action}ed!`);
//       loadRequests();
//     } catch (error) {
//       Alert.alert('Error', `Failed to ${action} request`);
//     }
//   };

//   const cancelRequest = async (requestId) => {
//     Alert.alert(
//       'Cancel Request',
//       'Are you sure you want to cancel this request?',
//       [
//         { text: 'No', style: 'cancel' },
//         {
//           text: 'Yes',
//           onPress: async () => {
//             try {
//               await ConnectionAPI.cancelRequest(requestId);
//               Alert.alert('Success', 'Request cancelled');
//               loadRequests();
//             } catch (error) {
//               Alert.alert('Error', 'Failed to cancel request');
//             }
//           },
//         },
//       ]
//     );
//   };

//   const renderReceivedRequest = ({ item }) => (
//     <View style={styles.requestCard}>
//       <View style={styles.requestInfo}>
//         <Image
//           source={{ uri: item.sender.avatar || 'https://via.placeholder.com/50' }}
//           style={styles.avatar}
//         />
//         <View style={styles.requestDetails}>
//           <Text style={styles.requestName}>
//             {item.sender.first_name} {item.sender.last_name}
//           </Text>
//           <Text style={styles.username}>@{item.sender.username}</Text>
//           <Text style={styles.requestTime}>
//             {new Date(item.created_at).toLocaleDateString()}
//           </Text>
//         </View>
//       </View>
//       <View style={styles.actionButtons}>
//         <TouchableOpacity
//           style={[styles.actionButton, styles.acceptButton]}
//           onPress={() => handleResponse(item.id, 'accept')}
//         >
//           <Ionicons name="checkmark" size={20} color="white" />
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.actionButton, styles.rejectButton]}
//           onPress={() => handleResponse(item.id, 'reject')}
//         >
//           <Ionicons name="close" size={20} color="white" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   const renderSentRequest = ({ item }) => (
//     <View style={styles.requestCard}>
//       <View style={styles.requestInfo}>
//         <Image
//           source={{ uri: item.receiver.avatar || 'https://via.placeholder.com/50' }}
//           style={styles.avatar}
//         />
//         <View style={styles.requestDetails}>
//           <Text style={styles.requestName}>
//             {item.receiver.first_name} {item.receiver.last_name}
//           </Text>
//           <Text style={styles.username}>@{item.receiver.username}</Text>
//           <Text style={styles.requestTime}>
//             Sent {new Date(item.created_at).toLocaleDateString()}
//           </Text>
//         </View>
//       </View>
//       <TouchableOpacity
//         style={[styles.actionButton, styles.cancelButton]}
//         onPress={() => cancelRequest(item.id)}
//       >
//         <Ionicons name="close" size={16} color="white" />
//         <Text style={styles.cancelButtonText}>Cancel</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Connection Requests</Text>
//       </View>

//       <View style={styles.tabContainer}>
//         <TouchableOpacity
//           style={[styles.tab, activeTab === 'received' && styles.activeTab]}
//           onPress={() => setActiveTab('received')}
//         >
//           <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
//             Received ({receivedRequests.length})
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
//           onPress={() => setActiveTab('sent')}
//         >
//           <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
//             Sent ({sentRequests.length})
//           </Text>
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={activeTab === 'received' ? receivedRequests : sentRequests}
//         renderItem={activeTab === 'received' ? renderReceivedRequest : renderSentRequest}
//         keyExtractor={(item) => item.id.toString()}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons name="mail" size={64} color="#ccc" />
//             <Text style={styles.emptyText}>
//               No {activeTab} requests
//             </Text>
//           </View>
//         }
//       />
//     </View>
//   );
// }















































// // PendingRequestsScreen.js - FIXED VERSION
// import React, { useEffect, useState, useCallback } from 'react';
// import { 
//   View, 
//   FlatList, 
//   ActivityIndicator, 
//   Text, 
//   StyleSheet, 
//   RefreshControl,
//   SafeAreaView,
//   StatusBar,
//   TouchableOpacity,
//   Alert
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import ProfileCard from '../../components/ProfileCard';
// import { useCurrentUser } from '../api/useCurrentUser';

// const PendingRequestsScreen = () => {
//   const { currentUser, userLoading, userError } = useCurrentUser();
  
//   const [incomingRequests, setIncomingRequests] = useState([]);
//   const [outgoingRequests, setOutgoingRequests] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' or 'outgoing'

//   useEffect(() => {
//     if (currentUser && !userLoading) {
//       fetchPendingRequests();
//     }
//   }, [currentUser, userLoading]);

//   const setupAxiosAuth = async () => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (token) {
//         axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error setting up auth:', error);
//       return false;
//     }
//   };

//   const fetchPendingRequests = async () => {
//     if (!currentUser) return;

//     try {
//       setLoading(true);
//       setError(null);

//       const authSetup = await setupAxiosAuth();
//       if (!authSetup) {
//         throw new Error('Authentication not available');
//       }

//       // Fetch all pending connections
//       const res = await axios.get('http://127.0.0.1:8000/api/connections/pending/');
//       console.log('Pending requests response:', res.data);
//       console.log('Current user ID:', currentUser.id);
      
//       // Add detailed logging for debugging
//       res.data.forEach(conn => {
//         console.log(`Connection ${conn.id}: sender=${conn.sender.id}, receiver=${conn.receiver.id}, status=${conn.status}`);
//       });
      
//       // Separate incoming and outgoing requests with additional validation
//       const incoming = res.data.filter(conn => {
//         const isIncoming = conn.receiver.id === currentUser.id && conn.status === 'pending';
//         if (isIncoming) {
//           console.log(`Incoming connection from ${conn.sender.username} (ID: ${conn.sender.id})`);
//         }
//         return isIncoming;
//       });
      
//       const outgoing = res.data.filter(conn => {
//         const isOutgoing = conn.sender.id === currentUser.id && conn.status === 'pending';
//         if (isOutgoing) {
//           console.log(`Outgoing connection to ${conn.receiver.username} (ID: ${conn.receiver.id})`);
//         }
//         return isOutgoing;
//       });
      
//       console.log(`Filtered results: ${incoming.length} incoming, ${outgoing.length} outgoing`);
      
//       setIncomingRequests(incoming);
//       setOutgoingRequests(outgoing);
      
//     } catch (err) {
//       console.error('Error fetching pending requests:', err);
//       console.error('Error response:', err.response?.data);
//       setError('Failed to load pending requests. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const acceptRequest = async (connectionId) => {
//     try {
//       console.log(`Attempting to accept connection ${connectionId}`);
      
//       const authSetup = await setupAxiosAuth();
//       if (!authSetup) {
//         Alert.alert('Error', 'Authentication not available');
//         return;
//       }

//       const response = await axios.post(`http://127.0.0.1:8000/api/connections/accept/${connectionId}/`);
//       console.log('Accept response:', response.data);
      
//       await fetchPendingRequests(); // Refresh the list
//       Alert.alert('Success', 'Connection request accepted!');
//     } catch (error) {
//       console.error('Error accepting request:', error);
//       console.error('Error response:', error.response?.data);
//       Alert.alert('Error', `Failed to accept request: ${error.response?.data?.detail || error.message}`);
//     }
//   };

//   const rejectRequest = async (connectionId) => {
//     try {
//       console.log(`Attempting to reject connection ${connectionId}`);
      
//       const authSetup = await setupAxiosAuth();
//       if (!authSetup) {
//         Alert.alert('Error', 'Authentication not available');
//         return;
//       }

//       const response = await axios.post(`http://127.0.0.1:8000/api/connections/reject/${connectionId}/`);
//       console.log('Reject response:', response.data);
      
//       await fetchPendingRequests(); // Refresh the list
//       Alert.alert('Success', 'Connection request rejected.');
//     } catch (error) {
//       console.error('Error rejecting request:', error);
//       console.error('Error response:', error.response?.data);
//       console.error('Error status:', error.response?.status);
      
//       const errorMessage = error.response?.data?.detail || 
//                           error.response?.data?.message || 
//                           `HTTP ${error.response?.status}: ${error.message}`;
      
//       Alert.alert('Error', `Failed to reject request: ${errorMessage}`);
//     }
//   };

//   const cancelRequest = async (connectionId) => {
//     try {
//       console.log(`Attempting to cancel connection ${connectionId}`);
      
//       const authSetup = await setupAxiosAuth();
//       if (!authSetup) {
//         Alert.alert('Error', 'Authentication not available');
//         return;
//       }

//       const response = await axios.delete(`http://127.0.0.1:8000/api/connections/cancel/${connectionId}/`);
//       console.log('Cancel response:', response.data);
      
//       await fetchPendingRequests(); // Refresh the list
//       Alert.alert('Success', 'Connection request cancelled.');
//     } catch (error) {
//       console.error('Error cancelling request:', error);
//       console.error('Error response:', error.response?.data);
      
//       const errorMessage = error.response?.data?.detail || 
//                           error.response?.data?.message || 
//                           error.message;
      
//       Alert.alert('Error', `Failed to cancel request: ${errorMessage}`);
//     }
//   };

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       await fetchPendingRequests();
//     } catch (err) {
//       console.error('Error during refresh:', err);
//     } finally {
//       setRefreshing(false);
//     }
//   }, []);

//   const renderIncomingRequest = ({ item }) => {
//     console.log('Rendering incoming request:', item);
//     return (
//       <View style={styles.requestItem}>
//         <ProfileCard
//           user={item.sender} // The person who sent the request
//           status="pending_received"
//           onAccept={() => acceptRequest(item.id)}
//           onReject={() => rejectRequest(item.id)}
//           showConnectionDate={true}
//           connectionDate={item.created_at}
//         />
//       </View>
//     );
//   };

//   const renderOutgoingRequest = ({ item }) => {
//     console.log('Rendering outgoing request:', item);
//     return (
//       <View style={styles.requestItem}>
//         <ProfileCard
//           user={item.receiver} // The person you sent the request to
//           status="pending_sent"
//           onCancel={() => cancelRequest(item.id)}
//           showConnectionDate={true}
//           connectionDate={item.created_at}
//         />
//       </View>
//     );
//   };

//   const renderTabBar = () => (
//     <View style={styles.tabBar}>
//       <TouchableOpacity
//         style={[styles.tab, activeTab === 'incoming' && styles.activeTab]}
//         onPress={() => setActiveTab('incoming')}
//       >
//         <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>
//           Received ({incomingRequests.length})
//         </Text>
//       </TouchableOpacity>
//       <TouchableOpacity
//         style={[styles.tab, activeTab === 'outgoing' && styles.activeTab]}
//         onPress={() => setActiveTab('outgoing')}
//       >
//         <Text style={[styles.tabText, activeTab === 'outgoing' && styles.activeTabText]}>
//           Sent ({outgoingRequests.length})
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderEmptyComponent = () => {
//     const isIncoming = activeTab === 'incoming';
//     const requestCount = isIncoming ? incomingRequests.length : outgoingRequests.length;
    
//     return (
//       <View style={styles.emptyContainer}>
//         <Text style={styles.emptyIcon}>
//           {error ? '⚠️' : isIncoming ? '📥' : '📤'}
//         </Text>
//         <Text style={styles.emptyText}>
//           {error 
//             ? 'Error Loading Requests'
//             : isIncoming 
//               ? 'No Incoming Requests' 
//               : 'No Outgoing Requests'
//           }
//         </Text>
//         <Text style={styles.emptySubtext}>
//           {error 
//             ? error
//             : isIncoming 
//               ? 'When someone sends you a connection request, it will appear here.'
//               : 'Connection requests you\'ve sent will appear here until they\'re accepted or rejected.'
//           }
//         </Text>
        
//         {error && (
//           <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
//             <Text style={styles.retryButtonText}>Try Again</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     );
//   };

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <Text style={styles.headerTitle}>Connection Requests</Text>
//       <Text style={styles.headerSubtitle}>
//         Manage your pending connection requests
//       </Text>
//       {renderTabBar()}
//     </View>
//   );

//   if (userLoading || loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading requests...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const currentData = activeTab === 'incoming' ? incomingRequests : outgoingRequests;
//   const renderItem = activeTab === 'incoming' ? renderIncomingRequest : renderOutgoingRequest;

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
//       <FlatList
//         data={currentData}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderItem}
//         ListHeaderComponent={renderHeader}
//         ListEmptyComponent={renderEmptyComponent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         contentContainerStyle={[
//           styles.listContainer,
//           currentData.length === 0 && styles.emptyListContainer
//         ]}
//         showsVerticalScrollIndicator={false}
//       />
//     </SafeAreaView>
//   );

//   // Rest of the styles remain the same...
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#6c757d',
//     textAlign: 'center',
//   },
//   header: {
//     padding: 20,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 5,
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: '#6c757d',
//     marginBottom: 20,
//   },
//   tabBar: {
//     flexDirection: 'row',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 10,
//     padding: 2,
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   activeTab: {
//     backgroundColor: '#007AFF',
//   },
//   tabText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#6c757d',
//   },
//   activeTabText: {
//     color: '#fff',
//   },
//   requestItem: {
//     marginHorizontal: 15,
//     marginVertical: 5,
//   },
//   listContainer: {
//     flexGrow: 1,
//   },
//   emptyListContainer: {
//     flex: 1,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   emptyIcon: {
//     fontSize: 48,
//     marginBottom: 20,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#212529',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 20,
//     marginBottom: 30,
//   },
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 5,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default PendingRequestsScreen;

































































// // PendingRequestsScreen.js - MISSING COMPONENT
// import React, { useEffect, useState, useCallback } from 'react';
// import { 
//   View, 
//   FlatList, 
//   ActivityIndicator, 
//   Text, 
//   StyleSheet, 
//   RefreshControl,
//   SafeAreaView,
//   StatusBar,
//   TouchableOpacity,
//   Alert
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import ProfileCard from '../../components/ProfileCard';
// import { useCurrentUser } from '../api/useCurrentUser';

// const PendingRequestsScreen = () => {
//   const { currentUser, userLoading, userError } = useCurrentUser();
  
//   const [incomingRequests, setIncomingRequests] = useState([]);
//   const [outgoingRequests, setOutgoingRequests] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' or 'outgoing'

//   useEffect(() => {
//     if (currentUser && !userLoading) {
//       fetchPendingRequests();
//     }
//   }, [currentUser, userLoading]);

//   const setupAxiosAuth = async () => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (token) {
//         axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error setting up auth:', error);
//       return false;
//     }
//   };

//   const fetchPendingRequests = async () => {
//     if (!currentUser) return;

//     try {
//       setLoading(true);
//       setError(null);

//       const authSetup = await setupAxiosAuth();
//       if (!authSetup) {
//         throw new Error('Authentication not available');
//       }

//       // Fetch all pending connections
//       const res = await axios.get('http://127.0.0.1:8000/api/connections/pending/');
//       console.log('Pending requests response:', res.data);
      
//       // Separate incoming and outgoing requests
//       const incoming = res.data.filter(conn => 
//         conn.receiver.id === currentUser.id && conn.status === 'pending'
//       );
      
//       const outgoing = res.data.filter(conn => 
//         conn.sender.id === currentUser.id && conn.status === 'pending'
//       );
      
//       setIncomingRequests(incoming);
//       setOutgoingRequests(outgoing);
      
//     } catch (err) {
//       console.error('Error fetching pending requests:', err);
//       setError('Failed to load pending requests. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const acceptRequest = async (connectionId) => {
//     try {
//       const authSetup = await setupAxiosAuth();
//       if (!authSetup) {
//         Alert.alert('Error', 'Authentication not available');
//         return;
//       }

//       await axios.post(`http://127.0.0.1:8000/api/connections/accept/${connectionId}/`);
//       await fetchPendingRequests(); // Refresh the list
//       Alert.alert('Success', 'Connection request accepted!');
//     } catch (error) {
//       console.error('Error accepting request:', error);
//       Alert.alert('Error', 'Failed to accept request. Please try again.');
//     }
//   };

//   const rejectRequest = async (connectionId) => {
//     try {
//       const authSetup = await setupAxiosAuth();
//       if (!authSetup) {
//         Alert.alert('Error', 'Authentication not available');
//         return;
//       }

//       await axios.post(`http://127.0.0.1:8000/api/connections/reject/${connectionId}/`);
//       await fetchPendingRequests(); // Refresh the list
//       Alert.alert('Success', 'Connection request rejected.');
//     } catch (error) {
//       console.error('Error rejecting request:', error);
//       Alert.alert('Error', 'Failed to reject request. Please try again.');
//     }
//   };

//   const cancelRequest = async (connectionId) => {
//     try {
//       const authSetup = await setupAxiosAuth();
//       if (!authSetup) {
//         Alert.alert('Error', 'Authentication not available');
//         return;
//       }

//       await axios.delete(`http://127.0.0.1:8000/api/connections/cancel/${connectionId}/`);
//       await fetchPendingRequests(); // Refresh the list
//       Alert.alert('Success', 'Connection request cancelled.');
//     } catch (error) {
//       console.error('Error cancelling request:', error);
//       Alert.alert('Error', 'Failed to cancel request. Please try again.');
//     }
//   };

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       await fetchPendingRequests();
//     } catch (err) {
//       console.error('Error during refresh:', err);
//     } finally {
//       setRefreshing(false);
//     }
//   }, []);

//   const renderIncomingRequest = ({ item }) => {
//     return (
//       <View style={styles.requestItem}>
//         <ProfileCard
//           user={item.sender} // The person who sent the request
//           status="pending_received"
//           onAccept={() => acceptRequest(item.id)}
//           onReject={() => rejectRequest(item.id)}
//           showConnectionDate={true}
//           connectionDate={item.created_at}
//         />
//       </View>
//     );
//   };

//   const renderOutgoingRequest = ({ item }) => {
//     return (
//       <View style={styles.requestItem}>
//         <ProfileCard
//           user={item.receiver} // The person you sent the request to
//           status="pending_sent"
//           onCancel={() => cancelRequest(item.id)}
//           showConnectionDate={true}
//           connectionDate={item.created_at}
//         />
//       </View>
//     );
//   };

//   const renderTabBar = () => (
//     <View style={styles.tabBar}>
//       <TouchableOpacity
//         style={[styles.tab, activeTab === 'incoming' && styles.activeTab]}
//         onPress={() => setActiveTab('incoming')}
//       >
//         <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>
//           Received ({incomingRequests.length})
//         </Text>
//       </TouchableOpacity>
//       <TouchableOpacity
//         style={[styles.tab, activeTab === 'outgoing' && styles.activeTab]}
//         onPress={() => setActiveTab('outgoing')}
//       >
//         <Text style={[styles.tabText, activeTab === 'outgoing' && styles.activeTabText]}>
//           Sent ({outgoingRequests.length})
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderEmptyComponent = () => {
//     const isIncoming = activeTab === 'incoming';
//     const requestCount = isIncoming ? incomingRequests.length : outgoingRequests.length;
    
//     return (
//       <View style={styles.emptyContainer}>
//         <Text style={styles.emptyIcon}>
//           {error ? '⚠️' : isIncoming ? '📥' : '📤'}
//         </Text>
//         <Text style={styles.emptyText}>
//           {error 
//             ? 'Error Loading Requests'
//             : isIncoming 
//               ? 'No Incoming Requests' 
//               : 'No Outgoing Requests'
//           }
//         </Text>
//         <Text style={styles.emptySubtext}>
//           {error 
//             ? error
//             : isIncoming 
//               ? 'When someone sends you a connection request, it will appear here.'
//               : 'Connection requests you\'ve sent will appear here until they\'re accepted or rejected.'
//           }
//         </Text>
        
//         {error && (
//           <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
//             <Text style={styles.retryButtonText}>Try Again</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     );
//   };

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <Text style={styles.headerTitle}>Connection Requests</Text>
//       <Text style={styles.headerSubtitle}>
//         Manage your pending connection requests
//       </Text>
//       {renderTabBar()}
//     </View>
//   );

//   if (userLoading || loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading requests...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const currentData = activeTab === 'incoming' ? incomingRequests : outgoingRequests;
//   const renderItem = activeTab === 'incoming' ? renderIncomingRequest : renderOutgoingRequest;

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
//       <FlatList
//         data={currentData}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderItem}
//         ListHeaderComponent={renderHeader}
//         ListEmptyComponent={renderEmptyComponent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         contentContainerStyle={[
//           styles.listContainer,
//           currentData.length === 0 && styles.emptyListContainer
//         ]}
//         showsVerticalScrollIndicator={false}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#6c757d',
//     textAlign: 'center',
//   },
//   header: {
//     padding: 20,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 5,
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: '#6c757d',
//     marginBottom: 20,
//   },
//   tabBar: {
//     flexDirection: 'row',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 10,
//     padding: 2,
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   activeTab: {
//     backgroundColor: '#007AFF',
//   },
//   tabText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#6c757d',
//   },
//   activeTabText: {
//     color: '#fff',
//   },
//   requestItem: {
//     marginHorizontal: 15,
//     marginVertical: 5,
//   },
//   listContainer: {
//     flexGrow: 1,
//   },
//   emptyListContainer: {
//     flex: 1,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//   },
//   emptyIcon: {
//     fontSize: 48,
//     marginBottom: 20,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#212529',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 20,
//     marginBottom: 30,
//   },
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 5,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default PendingRequestsScreen;














































// import React, { useEffect, useState, useCallback } from 'react';
// import { 
//   View, 
//   FlatList, 
//   ActivityIndicator, 
//   Text, 
//   StyleSheet, 
//   RefreshControl,
//   Alert,
//   SafeAreaView,
//   StatusBar,
//   TouchableOpacity
// } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import ProfileCard from '../../components/ProfileCard';
// import { useCurrentUser } from '../api/useCurrentUser'; // Import the hook

// const PendingRequestsScreen = () => {
//   // Use the custom hook instead of receiving currentUser as prop
//   const { currentUser, userLoading, userError, refreshUser } = useCurrentUser();
  
//   const [requests, setRequests] = useState([]);
//   const [requestsLoading, setRequestsLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [requestsError, setRequestsError] = useState(null);
//   const [processingRequests, setProcessingRequests] = useState(new Set());

//   // Debug logging
//   useEffect(() => {
//     console.log('PendingRequestsScreen Debug:', {
//       currentUserUsername: currentUser?.username || 'undefined',
//       currentUserObj: currentUser,
//       userLoading,
//       userError,
//       requestsCount: requests.length,
//       requestsLoading,
//       requestsError
//     });
//   }, [currentUser, userLoading, userError, requests, requestsLoading, requestsError]);

//   // Fetch requests when user is loaded
//   useEffect(() => {
//     if (currentUser && !userLoading) {
//       fetchPendingRequests();
//     }
//   }, [currentUser, userLoading]);

//   const setupAxiosAuth = async () => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (token) {
//         axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error setting up auth:', error);
//       return false;
//     }
//   };

//   const fetchPendingRequests = async () => {
//     if (!currentUser) {
//       console.log('No current user available for fetching requests');
//       return;
//     }

//     // Check for username instead of id
//     if (!currentUser.username) {
//       console.error('Current user missing username field:', currentUser);
//       setRequestsError('User data is incomplete. Please refresh or log in again.');
//       return;
//     }

//     try {
//       setRequestsLoading(true);
//       setRequestsError(null);

//       // Ensure auth is set up
//       const authSetup = await setupAxiosAuth();
//       if (!authSetup) {
//         throw new Error('Authentication not available');
//       }

//       console.log('Fetching pending requests for user:', currentUser.username);
      
//       // Add timeout to prevent hanging requests
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

//       const res = await axios.get('http://127.0.0.1:8000/api/connections/', {
//         signal: controller.signal,
//         timeout: 10000
//       });
      
//       clearTimeout(timeoutId);
//       console.log('Raw API Response:', res.data);
      
//       // Filter for pending requests where current user is involved (using username)
//       const pending = res.data.filter((req) => {
//         const isPending = req.status === 'pending';
//         const isUserInvolved = req.sender.username === currentUser.username || 
//                               req.receiver.username === currentUser.username;
        
//         console.log(`Request ${req.id}: status=${req.status}, sender=${req.sender.username}, receiver=${req.receiver.username}, currentUser=${currentUser.username}, isPending=${isPending}, isUserInvolved=${isUserInvolved}`);
        
//         return isPending && isUserInvolved;
//       });
      
//       console.log('Filtered pending requests:', pending);
//       setRequests(pending);
      
//     } catch (error) {
//       console.error('Error fetching pending requests:', error);
//       let errorMessage = 'Failed to load pending requests. Please try again.';
      
//       if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
//         errorMessage = 'Request timed out. Please check your connection.';
//       } else if (error.response?.status === 401) {
//         errorMessage = 'Authentication expired. Please log in again.';
//       } else if (error.response?.status >= 500) {
//         errorMessage = 'Server error. Please try again later.';
//       } else if (!error.response) {
//         errorMessage = 'Network error. Please check your connection.';
//       } else if (error.message === 'Authentication not available') {
//         errorMessage = 'Authentication not available. Please log in again.';
//       }
      
//       setRequestsError(errorMessage);
//     } finally {
//       setRequestsLoading(false);
//     }
//   };

//   const handleRequestAction = async (connId, action, actionName) => {
//     if (processingRequests.has(connId)) return;

//     setProcessingRequests(prev => new Set([...prev, connId]));
    
//     try {
//       // Ensure auth is set up before making requests
//       const authSetup = await setupAxiosAuth();
//       if (!authSetup) {
//         throw new Error('Authentication not available');
//       }

//       if (action === 'cancel') {
//         await axios.delete(`http://127.0.0.1:8000/api/connections/cancel/${connId}/`, {
//           timeout: 10000
//         });
//       } else {
//         await axios.post(`http://127.0.0.1:8000/api/connections/respond/${connId}/`, 
//           { action }, 
//           { timeout: 10000 }
//         );
//       }
      
//       await fetchPendingRequests();
      
//       const messages = {
//         accept: 'Connection request accepted!',
//         reject: 'Connection request rejected.',
//         cancel: 'Connection request cancelled.'
//       };
      
//       Alert.alert('Success', messages[action] || `Request ${actionName} successfully.`);
//     } catch (error) {
//       console.error(`Error ${actionName} request:`, error);
      
//       let errorMessage = `Failed to ${actionName.toLowerCase()} request. Please try again.`;
//       if (error.message.includes('timeout')) {
//         errorMessage = 'Request timed out. Please check your connection and try again.';
//       } else if (error.response?.status === 401) {
//         errorMessage = 'Authentication failed. Please log in again.';
//       } else if (error.message === 'Authentication not available') {
//         errorMessage = 'Authentication not available. Please log in again.';
//       }
      
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setProcessingRequests(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(connId);
//         return newSet;
//       });
//     }
//   };

//   const acceptRequest = (connId) => handleRequestAction(connId, 'accept', 'Accept');
//   const rejectRequest = (connId) => handleRequestAction(connId, 'reject', 'Reject');
//   const cancelRequest = (connId) => handleRequestAction(connId, 'cancel', 'Cancel');

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       // Refresh user data first
//       const user = await refreshUser();
      
//       // Then refresh requests if user is available
//       if (user) {
//         await fetchPendingRequests();
//       }
//     } catch (err) {
//       console.error('Error during refresh:', err);
//       setRequestsError(err.message || 'Failed to refresh requests');
//     } finally {
//       setRefreshing(false);
//     }
//   }, [refreshUser]);

//   const renderItem = ({ item }) => {
//     if (!currentUser) return null;
    
//     // Get the other user using username comparison
//     const user = item.sender.username === currentUser.username ? item.receiver : item.sender;
//     const isSent = item.sender.username === currentUser.username;
//     const isProcessing = processingRequests.has(item.id);

//     return (
//       <View style={styles.requestItem}>
//         <ProfileCard
//           user={user}
//           status={isSent ? 'pending_sent' : 'pending_received'}
//           onCancel={() => cancelRequest(item.id)}
//           onAccept={() => acceptRequest(item.id)}
//           onReject={() => rejectRequest(item.id)}
//           disabled={isProcessing}
//         />
//         {isProcessing && (
//           <View style={styles.processingOverlay}>
//             <ActivityIndicator size="small" color="#007AFF" />
//           </View>
//         )}
//       </View>
//     );
//   };

//   const renderEmptyComponent = () => {
//     const hasError = userError || requestsError;
    
//     return (
//       <View style={styles.emptyContainer}>
//         <Text style={styles.emptyIcon}>
//           {hasError ? '⚠️' : '📝'}
//         </Text>
//         <Text style={styles.emptyText}>
//           {hasError ? 'Error Loading Data' : 'No Pending Requests'}
//         </Text>
//         <Text style={styles.emptySubtext}>
//           {userError 
//             ? `User Error: ${userError}`
//             : requestsError
//               ? `Requests Error: ${requestsError}`
//               : 'You\'re all caught up! New connection requests will appear here.'
//           }
//         </Text>
        
//         {hasError && (
//           <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
//             <Text style={styles.retryButtonText}>Try Again</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     );
//   };

//   const renderHeader = () => {
//     if (!currentUser || !requests.length) return null;
    
//     // Use username comparison for filtering
//     const sentRequests = requests.filter(req => req.sender.username === currentUser.username);
//     const receivedRequests = requests.filter(req => req.receiver.username === currentUser.username);
    
//     return (
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Pending Requests</Text>
//         <View style={styles.statsContainer}>
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>{receivedRequests.length}</Text>
//             <Text style={styles.statLabel}>Received</Text>
//           </View>
//           <View style={styles.statDivider} />
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>{sentRequests.length}</Text>
//             <Text style={styles.statLabel}>Sent</Text>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   // Show loading during initial user load
//   if (userLoading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading user data...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // Show error if user couldn't be loaded
//   if (userError && !currentUser) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.loadingContainer}>
//           <Text style={styles.emptyIcon}>⚠️</Text>
//           <Text style={styles.emptyText}>Cannot Load User</Text>
//           <Text style={styles.emptySubtext}>
//             {userError}. Please try logging in again.
//           </Text>
//           <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // Show loading during requests fetch (after user is loaded)
//   if (requestsLoading && !refreshing) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading pending requests...</Text>
          
//           {/* Add a cancel loading option */}
//           <TouchableOpacity 
//             style={[styles.retryButton, { marginTop: 20 }]} 
//             onPress={() => {
//               setRequestsLoading(false);
//               setRequestsError('Loading cancelled. Please try again.');
//             }}
//           >
//             <Text style={styles.retryButtonText}>Cancel Loading</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
//       {(requestsError || userError) && !refreshing && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>
//             {requestsError || userError}
//           </Text>
//         </View>
//       )}
      
//       <FlatList
//         data={requests}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderItem}
//         ListHeaderComponent={renderHeader}
//         ListEmptyComponent={renderEmptyComponent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         contentContainerStyle={[
//           styles.listContainer,
//           requests.length === 0 && styles.emptyListContainer
//         ]}
//         showsVerticalScrollIndicator={false}
//         initialNumToRender={10}
//         maxToRenderPerBatch={10}
//         windowSize={10}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#6c757d',
//     textAlign: 'center',
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//     marginBottom: 8,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 16,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     paddingVertical: 16,
//   },
//   statItem: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#007AFF',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 14,
//     color: '#6c757d',
//     fontWeight: '500',
//   },
//   statDivider: {
//     width: 1,
//     height: 40,
//     backgroundColor: '#dee2e6',
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
//   emptyListContainer: {
//     flexGrow: 1,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     paddingVertical: 60,
//   },
//   emptyIcon: {
//     fontSize: 48,
//     marginBottom: 16,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#495057',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   requestItem: {
//     position: 'relative',
//   },
//   processingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 12,
//   },
//   errorContainer: {
//     backgroundColor: '#f8d7da',
//     borderColor: '#f5c6cb',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     marginHorizontal: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     color: '#721c24',
//     fontSize: 14,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
// });

// export default PendingRequestsScreen;































































// import React, { useEffect, useState, useCallback } from 'react';
// import { 
//   View, 
//   FlatList, 
//   ActivityIndicator, 
//   Text, 
//   StyleSheet, 
//   RefreshControl,
//   Alert,
//   SafeAreaView,
//   StatusBar,
//   TouchableOpacity
// } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import ProfileCard from '../../components/ProfileCard';

// const PendingRequestsScreen = ({ currentUser }) => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [processingRequests, setProcessingRequests] = useState(new Set());
//   const [token, setToken] = useState(null);

//   // Debug logging
//   useEffect(() => {
//     console.log('PendingRequestsScreen Debug:', {
//       currentUser: currentUser?.id || 'undefined',
//       currentUserObj: currentUser,
//       requestsCount: requests.length,
//       loading,
//       error
//     });
//   }, [currentUser, requests, loading, error]);

//   // Get token from AsyncStorage
//   const getAuthToken = async () => {
//     try {
//       const storedToken = await AsyncStorage.getItem('access_token');
//       console.log('Retrieved token:', storedToken ? 'Token exists' : 'No token found');
//       return storedToken;
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   // Initialize token and data
//   useEffect(() => {
//     const initializeApp = async () => {
//       try {
//         const authToken = await getAuthToken();
        
//         if (!authToken) {
//           setError('No authentication token found. Please log in again.');
//           setLoading(false);
//           return;
//         }

//         setToken(authToken);
//         axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//         await initializeData();
//       } catch (err) {
//         console.error('Error initializing app:', err);
//         setError('Failed to initialize. Please try again.');
//         setLoading(false);
//       }
//     };

//     initializeApp();
//   }, []);

//   const initializeData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       await fetchPendingRequests();
//     } catch (err) {
//       setError('Failed to load pending requests. Please try again.');
//       console.error('Error initializing data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchPendingRequests = async () => {
//     try {
//       console.log('Fetching pending requests for user:', currentUser?.id || 'undefined');
      
//       // Add timeout to prevent hanging requests
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

//       const res = await axios.get('http://127.0.0.1:8000/api/connections/', {
//         signal: controller.signal,
//         timeout: 10000
//       });
      
//       clearTimeout(timeoutId);
//       console.log('API Response:', res.data);
      
//       const pending = res.data.filter((req) => {
//         const isPending = req.status === 'pending';
//         const isUserInvolved = currentUser && (
//           req.sender.id === currentUser.id || req.receiver.id === currentUser.id
//         );
        
//         console.log(`Request ${req.id}: status=${req.status}, sender=${req.sender.id}, receiver=${req.receiver.id}, currentUser=${currentUser?.id}, isPending=${isPending}, isUserInvolved=${isUserInvolved}`);
        
//         return isPending && isUserInvolved;
//       });
      
//       console.log('Filtered pending requests:', pending);
//       setRequests(pending);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching pending requests:', error);
      
//       if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
//         throw new Error('Request timed out. Please check your connection.');
//       } else if (error.response?.status === 401) {
//         throw new Error('Authentication failed. Please log in again.');
//       } else if (error.response?.status >= 500) {
//         throw new Error('Server error. Please try again later.');
//       } else if (!error.response) {
//         throw new Error('Network error. Please check your connection.');
//       }
      
//       throw error;
//     }
//   };

//   const handleRequestAction = async (connId, action, actionName) => {
//     if (processingRequests.has(connId)) return;

//     setProcessingRequests(prev => new Set([...prev, connId]));
    
//     try {
//       if (action === 'cancel') {
//         await axios.delete(`http://127.0.0.1:8000/api/connections/cancel/${connId}/`, {
//           timeout: 10000
//         });
//       } else {
//         await axios.post(`http://127.0.0.1:8000/api/connections/respond/${connId}/`, 
//           { action }, 
//           { timeout: 10000 }
//         );
//       }
      
//       await fetchPendingRequests();
      
//       const messages = {
//         accept: 'Connection request accepted!',
//         reject: 'Connection request rejected.',
//         cancel: 'Connection request cancelled.'
//       };
      
//       Alert.alert('Success', messages[action] || `Request ${actionName} successfully.`);
//     } catch (error) {
//       console.error(`Error ${actionName} request:`, error);
      
//       let errorMessage = `Failed to ${actionName.toLowerCase()} request. Please try again.`;
//       if (error.message.includes('timeout')) {
//         errorMessage = 'Request timed out. Please check your connection and try again.';
//       } else if (error.response?.status === 401) {
//         errorMessage = 'Authentication failed. Please log in again.';
//       }
      
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setProcessingRequests(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(connId);
//         return newSet;
//       });
//     }
//   };

//   const acceptRequest = (connId) => handleRequestAction(connId, 'accept', 'Accept');
//   const rejectRequest = (connId) => handleRequestAction(connId, 'reject', 'Reject');
//   const cancelRequest = (connId) => handleRequestAction(connId, 'cancel', 'Cancel');

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       await fetchPendingRequests();
//       setError(null);
//     } catch (err) {
//       setError(err.message || 'Failed to refresh requests');
//     } finally {
//       setRefreshing(false);
//     }
//   }, [currentUser]);

//   const renderItem = ({ item }) => {
//     if (!currentUser) return null;
    
//     const user = item.sender.id === currentUser.id ? item.receiver : item.sender;
//     const isSent = item.sender.id === currentUser.id;
//     const isProcessing = processingRequests.has(item.id);

//     return (
//       <View style={styles.requestItem}>
//         <ProfileCard
//           user={user}
//           status={isSent ? 'pending_sent' : 'pending_received'}
//           onCancel={() => cancelRequest(item.id)}
//           onAccept={() => acceptRequest(item.id)}
//           onReject={() => rejectRequest(item.id)}
//           disabled={isProcessing}
//         />
//         {isProcessing && (
//           <View style={styles.processingOverlay}>
//             <ActivityIndicator size="small" color="#007AFF" />
//           </View>
//         )}
//       </View>
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyIcon}>📝</Text>
//       <Text style={styles.emptyText}>No Pending Requests</Text>
//       <Text style={styles.emptySubtext}>
//         {error 
//           ? 'Unable to load requests. Pull down to try again.' 
//           : !currentUser
//             ? 'User not loaded. Please try refreshing.'
//           : 'You\'re all caught up! New connection requests will appear here.'
//         }
//       </Text>
//       {error && (
//         <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
//           <Text style={styles.retryButtonText}>Try Again</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   const renderHeader = () => {
//     if (!currentUser) return null;
    
//     const sentRequests = requests.filter(req => req.sender.id === currentUser.id);
//     const receivedRequests = requests.filter(req => req.receiver.id === currentUser.id);
    
//     return (
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Pending Requests</Text>
//         <View style={styles.statsContainer}>
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>{receivedRequests.length}</Text>
//             <Text style={styles.statLabel}>Received</Text>
//           </View>
//           <View style={styles.statDivider} />
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>{sentRequests.length}</Text>
//             <Text style={styles.statLabel}>Sent</Text>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   // Show user not loaded message if currentUser is undefined
//   if (!currentUser && !loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.loadingContainer}>
//           <Text style={styles.emptyIcon}>⚠️</Text>
//           <Text style={styles.emptyText}>User Not Loaded</Text>
//           <Text style={styles.emptySubtext}>
//             Current user information is not available. Please try restarting the app or logging in again.
//           </Text>
//           <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // Show loading only initially, not during refresh
//   if (loading && !refreshing) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading pending requests...</Text>
          
//           {/* Add a timeout message */}
//           <TouchableOpacity 
//             style={[styles.retryButton, { marginTop: 20 }]} 
//             onPress={() => {
//               setLoading(false);
//               setError('Loading timed out. Please try again.');
//             }}
//           >
//             <Text style={styles.retryButtonText}>Cancel Loading</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
//       {error && !refreshing && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//         </View>
//       )}
      
//       <FlatList
//         data={requests}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderItem}
//         ListHeaderComponent={requests.length > 0 ? renderHeader : null}
//         ListEmptyComponent={renderEmptyComponent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         contentContainerStyle={[
//           styles.listContainer,
//           requests.length === 0 && styles.emptyListContainer
//         ]}
//         showsVerticalScrollIndicator={false}
//         initialNumToRender={10}
//         maxToRenderPerBatch={10}
//         windowSize={10}
//       />
//     </SafeAreaView>
//   );
// };

// // Styles remain the same...
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//     fontWeight: '500',
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//     marginBottom: 8,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 16,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     paddingVertical: 16,
//   },
//   statItem: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#007AFF',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 14,
//     color: '#6c757d',
//     fontWeight: '500',
//   },
//   statDivider: {
//     width: 1,
//     height: 40,
//     backgroundColor: '#dee2e6',
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
//   emptyListContainer: {
//     flexGrow: 1,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     paddingVertical: 60,
//   },
//   emptyIcon: {
//     fontSize: 48,
//     marginBottom: 16,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#495057',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   requestItem: {
//     position: 'relative',
//   },
//   processingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 12,
//   },
//   errorContainer: {
//     backgroundColor: '#f8d7da',
//     borderColor: '#f5c6cb',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     marginHorizontal: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     color: '#721c24',
//     fontSize: 14,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
// });

// export default PendingRequestsScreen;


























































// import React, { useEffect, useState, useCallback } from 'react';
// import { 
//   View, 
//   FlatList, 
//   ActivityIndicator, 
//   Text, 
//   StyleSheet, 
//   RefreshControl,
//   Alert,
//   SafeAreaView,
//   StatusBar,
//   TouchableOpacity
// } from 'react-native';
// import axios from 'axios';
// import ProfileCard from '../../components/ProfileCard';

// const PendingRequestsScreen = ({ token, currentUser }) => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [processingRequests, setProcessingRequests] = useState(new Set());

//   useEffect(() => {
//     if (token) {
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//       initializeData();
//     }
//   }, [token]);

//   const initializeData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       await fetchPendingRequests();
//     } catch (err) {
//       setError('Failed to load pending requests. Please try again.');
//       console.error('Error initializing data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchPendingRequests = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/connections/');
//       const pending = res.data.filter((req) => 
//         req.status === 'pending' && currentUser && (
//           req.sender.id === currentUser.id || req.receiver.id === currentUser.id
//         )
//       );
//       setRequests(pending);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching pending requests:', error);
//       throw error;
//     }
//   };

//   const handleRequestAction = async (connId, action, actionName) => {
//     if (processingRequests.has(connId)) return;

//     setProcessingRequests(prev => new Set([...prev, connId]));
    
//     try {
//       if (action === 'cancel') {
//         await axios.delete(`http://127.0.0.1:8000/api/connections/cancel/${connId}/`);
//       } else {
//         await axios.post(`http://127.0.0.1:8000/api/connections/respond/${connId}/`, { action });
//       }
      
//       await fetchPendingRequests();
      
//       const messages = {
//         accept: 'Connection request accepted!',
//         reject: 'Connection request rejected.',
//         cancel: 'Connection request cancelled.'
//       };
      
//       Alert.alert('Success', messages[action] || `Request ${actionName} successfully.`);
//     } catch (error) {
//       console.error(`Error ${actionName} request:`, error);
//       Alert.alert(
//         'Error', 
//         `Failed to ${actionName.toLowerCase()} request. Please try again.`
//       );
//     } finally {
//       setProcessingRequests(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(connId);
//         return newSet;
//       });
//     }
//   };

//   const acceptRequest = (connId) => handleRequestAction(connId, 'accept', 'Accept');
//   const rejectRequest = (connId) => handleRequestAction(connId, 'reject', 'Reject');
//   const cancelRequest = (connId) => handleRequestAction(connId, 'cancel', 'Cancel');

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       await fetchPendingRequests();
//       setError(null);
//     } catch (err) {
//       setError('Failed to refresh requests');
//     } finally {
//       setRefreshing(false);
//     }
//   }, []);

//   const renderItem = ({ item }) => {
//     if (!currentUser) return null;
    
//     const user = item.sender.id === currentUser.id ? item.receiver : item.sender;
//     const isSent = item.sender.id === currentUser.id;
//     const isProcessing = processingRequests.has(item.id);

//     return (
//       <View style={styles.requestItem}>
//         <ProfileCard
//           user={user}
//           status={isSent ? 'pending_sent' : 'pending_received'}
//           onCancel={() => cancelRequest(item.id)}
//           onAccept={() => acceptRequest(item.id)}
//           onReject={() => rejectRequest(item.id)}
//           disabled={isProcessing}
//         />
//         {isProcessing && (
//           <View style={styles.processingOverlay}>
//             <ActivityIndicator size="small" color="#007AFF" />
//           </View>
//         )}
//       </View>
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyIcon}>📝</Text>
//       <Text style={styles.emptyText}>No Pending Requests</Text>
//       <Text style={styles.emptySubtext}>
//         {error 
//           ? 'Unable to load requests. Pull down to try again.' 
//           : 'You\'re all caught up! New connection requests will appear here.'
//         }
//       </Text>
//       {error && (
//         <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
//           <Text style={styles.retryButtonText}>Try Again</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   const renderHeader = () => {
//     const sentRequests = requests.filter(req => req.sender.id === currentUser?.id);
//     const receivedRequests = requests.filter(req => req.receiver.id === currentUser?.id);
    
//     return (
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Pending Requests</Text>
//         <View style={styles.statsContainer}>
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>{receivedRequests.length}</Text>
//             <Text style={styles.statLabel}>Received</Text>
//           </View>
//           <View style={styles.statDivider} />
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>{sentRequests.length}</Text>
//             <Text style={styles.statLabel}>Sent</Text>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   if (loading && !refreshing) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading pending requests...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }
//
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
//       {error && !refreshing && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//         </View>
//       )}
      
//       <FlatList
//         data={requests}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderItem}
//         ListHeaderComponent={requests.length > 0 ? renderHeader : null}
//         ListEmptyComponent={renderEmptyComponent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         contentContainerStyle={[
//           styles.listContainer,
//           requests.length === 0 && styles.emptyListContainer
//         ]}
//         showsVerticalScrollIndicator={false}
//         initialNumToRender={10}
//         maxToRenderPerBatch={10}
//         windowSize={10}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//     fontWeight: '500',
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//     marginBottom: 8,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 16,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     paddingVertical: 16,
//   },
//   statItem: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#007AFF',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 14,
//     color: '#6c757d',
//     fontWeight: '500',
//   },
//   statDivider: {
//     width: 1,
//     height: 40,
//     backgroundColor: '#dee2e6',
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
//   emptyListContainer: {
//     flexGrow: 1,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     paddingVertical: 60,
//   },
//   emptyIcon: {
//     fontSize: 48,
//     marginBottom: 16,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#495057',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   requestItem: {
//     position: 'relative',
//   },
//   processingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 12,
//   },
//   errorContainer: {
//     backgroundColor: '#f8d7da',
//     borderColor: '#f5c6cb',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     marginHorizontal: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     color: '#721c24',
//     fontSize: 14,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
// });

// export default PendingRequestsScreen;




































// import React, { useEffect, useState } from 'react';
// import { View, FlatList, ActivityIndicator, Text } from 'react-native';
// // import api from '../utils/api';
// import ProfileCard from '../../components/ProfileCard';
// import axios from 'axios'

// const PendingRequestsScreen = ({ token, currentUser }) => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     fetchPendingRequests();
//   }, []);

//   const fetchPendingRequests = async () => {
//     try {
//       const res = await axios.get('/connections/');
//       const pending = res.data.filter((req) => req.status === 'pending');
//       setRequests(pending);
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const acceptRequest = async (connId) => {
//     await axios.post(`/connections/respond/${connId}/`, { action: 'accept' });
//     fetchPendingRequests();
//   };

//   const rejectRequest = async (connId) => {
//     await axios.post(`/connections/respond/${connId}/`, { action: 'reject' });
//     fetchPendingRequests();
//   };

//   const cancelRequest = async (connId) => {
//     await axios.delete(`/connections/cancel/${connId}/`);
//     fetchPendingRequests();
//   };

//   const renderItem = ({ item }) => {
//     const user = item.sender.id === currentUser.id ? item.receiver : item.sender;
//     const isSent = item.sender.id === currentUser.id;

//     return (
//       <ProfileCard
//         user={user}
//         status={isSent ? 'pending_sent' : 'pending_received'}
//         onCancel={() => cancelRequest(item.id)}
//         onAccept={() => acceptRequest(item.id)}
//         onReject={() => rejectRequest(item.id)}
//       />
//     );
//   };

//   if (loading) return <ActivityIndicator />;

//   return (
//     <FlatList
//       data={requests}
//       keyExtractor={(item) => item.id.toString()}
//       renderItem={renderItem}
//       ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No pending requests</Text>}
//     />
//   );
// };

// export default PendingRequestsScreen;
