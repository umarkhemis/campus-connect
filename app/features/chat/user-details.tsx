




import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 280;
const AVATAR_SIZE = 120;
export const UserDetailModal = ({ visible, userId, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scrollY] = useState(new Animated.Value(0));
  const [headerOpacity] = useState(new Animated.Value(0));

  console.log('UserDetailModal props:', { visible, userId });

  useEffect(() => {
    if (visible && userId) {
      fetchUserDetails();
    }
  }, [visible, userId]);

  const fetchUserDetails = async () => {
    console.log('Fetching details for userId:', userId);
    setLoading(true);
    setError(null);
    
    try {
      const token = await AsyncStorage.getItem('access_token');
      console.log('Token found:', !!token);
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const apiUrl = `http://127.0.0.1:8000/api/users/${userId}/`;
      console.log('Making request to:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('API Response:', response.data);
      setUser(response.data);
      
    } catch (error) {
      console.error('Error fetching user details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 404) {
        setError('User not found');
      } else if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to load user details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never active';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `Active ${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `Active ${Math.floor(diffInMinutes / 60)}h ago`;
    
    return `Active ${date.toLocaleDateString()}`;
  };

  
  const getFullName = (user) => {
    if (!user) return 'Unknown User'; // Handle null/undefined user
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    return fullName || user.username || 'Unknown User';
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const opacity = Math.min(1, offsetY / (HEADER_HEIGHT - 120));
        headerOpacity.setValue(opacity);
      }
    }
  );

  const renderHeader = () => {
    const avatarTranslateY = scrollY.interpolate({
      inputRange: [0, HEADER_HEIGHT - 120],
      outputRange: [0, -50],
      extrapolate: 'clamp',
    });

    const avatarScale = scrollY.interpolate({
      inputRange: [0, HEADER_HEIGHT - 120],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    
    if (!user) return null;

    return (
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        />
        
        {/* Floating Header */}
        <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={styles.blurHeader}>
            <View style={styles.floatingHeaderContent}>
              <Image
                source={{
                  uri: user?.profile_picture_url || user?.profile_picture || 
                       `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&size=40&background=667eea&color=fff`
                }}
                style={styles.floatingAvatar}
              />
              <View style={styles.floatingUserInfo}>
                <Text style={styles.floatingName} numberOfLines={1}>
                  {getFullName(user)}
                </Text>
                <Text style={styles.floatingUsername} numberOfLines={1}>
                  @{user?.username || 'unknown'}
                </Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Main Header Content */}
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <BlurView intensity={20} style={styles.closeButtonBlur}>
              <Ionicons name="close" size={24} color="#fff" />
            </BlurView>
          </TouchableOpacity>

          <Animated.View 
            style={[
              styles.avatarSection,
              {
                transform: [
                  { translateY: avatarTranslateY },
                  { scale: avatarScale }
                ]
              }
            ]}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: user?.profile_picture_url || user?.profile_picture || 
                       `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&size=150&background=667eea&color=fff`
                }}
                style={styles.avatar}
                onError={(error) => console.log('Image load error:', error)}
              />
              {user?.is_online && (
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.displayName}>{getFullName(user)}</Text>
              <Text style={styles.username}>@{user?.username || 'unknown'}</Text>
              
              <View style={styles.statusContainer}>
                {user?.is_online ? (
                  <View style={styles.onlineStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Online</Text>
                  </View>
                ) : (
                  <Text style={styles.lastSeenText}>
                    {formatLastSeen(user?.last_seen)}
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity style={styles.actionButton}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.actionButtonGradient}
        >
          <Ionicons name="chatbubble" size={20} color="#fff" />
        </LinearGradient>
        <Text style={styles.actionLabel}>Message</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <LinearGradient
          colors={['#f093fb', '#f5576c']}
          style={styles.actionButtonGradient}
        >
          <Ionicons name="call" size={20} color="#fff" />
        </LinearGradient>
        <Text style={styles.actionLabel}>Call</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.actionButtonGradient}
        >
          <Ionicons name="videocam" size={20} color="#fff" />
        </LinearGradient>
        <Text style={styles.actionLabel}>Video</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <LinearGradient
          colors={['#a8edea', '#fed6e3']}
          style={styles.actionButtonGradient}
        >
          <Ionicons name="person-add" size={20} color="#fff" />
        </LinearGradient>
        <Text style={styles.actionLabel}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInfoSection = (icon, title, children) => (
    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name={icon} size={20} color="#667eea" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const renderInfoItem = (icon, label, value, color = "#8E8E93") => (
    <View style={styles.infoItem}>
      <View style={[styles.infoIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={styles.centerContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={styles.centerContainer}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
            </View>
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchUserDetails} style={styles.retryButton}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.retryButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  
  if (!user) {
    return (
      <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={styles.centerContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <View style={styles.container}>
        {renderHeader()}
        
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {renderQuickActions()}

            {renderInfoSection("person", "Personal Information", 
              <>
                {renderInfoItem("mail", "Email", user?.email, "#FF6B6B")}
                {renderInfoItem("person-circle", "Full Name", getFullName(user), "#4ECDC4")}
              </>
            )}

            {(user?.course || user?.year) && renderInfoSection("school", "Academic Information",
              <>
                {user?.course && renderInfoItem("book", "Course", user.course, "#45B7D1")}
                {user?.year && renderInfoItem("calendar", "Year", `Year ${user.year}`, "#96CEB4")}
              </>
            )}

            {renderInfoSection("time", "Account Details",
              <>
                {renderInfoItem("person-add", "Member since", 
                  user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown', "#DDA0DD"
                )}
                {renderInfoItem("id-card", "User ID", `#${user?.id}`, "#F4A261")}
              </>
            )}

            <View style={styles.bottomSpacer} />
          </View>
        </Animated.ScrollView>
      </View>
    </Modal>
  );
};

// Main Screen Component
const UserDetailsScreen = () => {
  const params = useLocalSearchParams();
  const userId = params.userId;

  console.log('UserDetailsScreen - Raw params:', params);
  console.log('UserDetailsScreen - Extracted userId:', userId);

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <UserDetailModal
        visible={true}
        userId={userId}
        onClose={handleClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: HEADER_HEIGHT,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 80,
    zIndex: 1000,
  },
  blurHeader: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  floatingHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  floatingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  floatingUserInfo: {
    flex: 1,
  },
  floatingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  floatingUsername: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  headerContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 100,
  },
  closeButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  username: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  lastSeenText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    marginTop: -40,
  },
  scrollContent: {
    paddingTop: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    minHeight: height - HEADER_HEIGHT + 100,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  infoSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  sectionContent: {
    padding: 20,
    paddingTop: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: width - 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    minWidth: 140,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default UserDetailsScreen;




















































// import React, { useState, useEffect } from 'react';
// import {
//   Modal,
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
//   Animated,
//   Dimensions,
//   StatusBar,
//   Platform,
//   Linking,
// } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import { useLocalSearchParams, router } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';
// import ConnectionAPI from '../../api/connectionService';

// // Remove WebRTC imports for now to fix import errors
// // import {
// //   RTCPeerConnection,
// //   RTCSessionDescription,
// //   RTCIceCandidate,
// //   mediaDevices,
// // } from 'react-native-webrtc';

// const { width, height } = Dimensions.get('window');
// const HEADER_HEIGHT = 220; 
// const AVATAR_SIZE = 100; 

// const UserDetailModal = ({ visible, userId, onClose }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [scrollY] = useState(new Animated.Value(0));
//   const [headerOpacity] = useState(new Animated.Value(0));
//   const [isRemoving, setIsRemoving] = useState(false);
//   const [isCallInProgress, setIsCallInProgress] = useState(false);

//   console.log('UserDetailModal props:', { visible, userId });

//   useEffect(() => {
//     if (visible && userId) {
//       fetchUserDetails();
//     }
//   }, [visible, userId]);

//   const fetchUserDetails = async () => {
//     console.log('Fetching details for userId:', userId);
//     setLoading(true);
//     setError(null);
    
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       console.log('Token found:', !!token);
      
//       if (!token) {
//         setError('Authentication required');
//         setLoading(false);
//         return;
//       }

//       // Use your correct API URL
//       const apiUrl = `http://192.168.130.16:8000/api/users/${userId}/`;
//       console.log('Making request to:', apiUrl);
      
//       const response = await axios.get(apiUrl, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         }
//       });
      
//       console.log('API Response:', response.data);
//       setUser(response.data);
      
//     } catch (error) {
//       console.error('Error fetching user details:', error);
//       console.error('Error response:', error.response?.data);
//       console.error('Error status:', error.response?.status);
      
//       if (error.response?.status === 404) {
//         setError('User not found');
//       } else if (error.response?.status === 401) {
//         setError('Authentication failed. Please login again.');
//       } else {
//         setError('Failed to load user details. Please try again.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClose = () => {
//     if (isCallInProgress) {
//       Alert.alert(
//         'Call in Progress',
//         'Are you sure you want to close? This will end the current call.',
//         [
//           { text: 'Cancel', style: 'cancel' },
//           { 
//             text: 'End Call & Close', 
//             style: 'destructive',
//             onPress: () => {
//               endCall();
//               onClose();
//             }
//           }
//         ]
//       );
//     } else {
//       onClose();
//     }
//   };

//   // Simplified Audio Call Implementation
//   const handleAudioCall = async () => {
//     try {
//       setIsCallInProgress(true);
      
//       // Option 1: Direct phone call (if you have phone number)
//       if (user?.phone_number) {
//         const phoneUrl = `tel:${user.phone_number}`;
//         const canOpen = await Linking.canOpenURL(phoneUrl);
        
//         if (canOpen) {
//           await Linking.openURL(phoneUrl);
//         } else {
//           throw new Error('Cannot make phone calls on this device');
//         }
//         setIsCallInProgress(false);
//         return;
//       }

//       // Option 2: Navigate to a call screen or show call interface
//       // For now, we'll just show an alert and navigate to a call screen
//       Alert.alert(
//         'Audio Call',
//         `Starting audio call with ${getFullName(user)}...`,
//         [
//           { 
//             text: 'Cancel', 
//             style: 'cancel',
//             onPress: () => setIsCallInProgress(false)
//           },
//           {
//             text: 'Start Call',
//             onPress: () => {
//               // Navigate to your call screen
//               router.push({
//                 pathname: '/screens/audio-call', // Create this screen
//                 params: {
//                   userId: userId,
//                   userName: getFullName(user),
//                   userAvatar: user?.profile_picture_url,
//                   callType: 'audio'
//                 }
//               });
//               setIsCallInProgress(false);
//               onClose(); // Close the modal
//             }
//           }
//         ]
//       );
      
//     } catch (error) {
//       console.error('Audio call error:', error);
//       Alert.alert(
//         'Call Failed',
//         error.message || 'Unable to start audio call. Please try again.',
//         [{ text: 'OK' }]
//       );
//       setIsCallInProgress(false);
//     }
//   };

//   // Simplified Video Call Implementation
//   const handleVideoCall = async () => {
//     try {
//       setIsCallInProgress(true);
      
//       Alert.alert(
//         'Video Call',
//         `Starting video call with ${getFullName(user)}...`,
//         [
//           { 
//             text: 'Cancel', 
//             style: 'cancel',
//             onPress: () => setIsCallInProgress(false)
//           },
//           {
//             text: 'Start Call',
//             onPress: () => {
//               // Navigate to your video call screen
//               router.push({
//                 pathname: '/screens/video-call', // Create this screen
//                 params: {
//                   userId: userId,
//                   userName: getFullName(user),
//                   userAvatar: user?.profile_picture_url,
//                   callType: 'video'
//                 }
//               });
//               setIsCallInProgress(false);
//               onClose(); // Close the modal
//             }
//           }
//         ]
//       );
      
//     } catch (error) {
//       console.error('Video call error:', error);
//       Alert.alert(
//         'Video Call Failed',
//         error.message || 'Unable to start video call. Please try again.',
//         [{ text: 'OK' }]
//       );
//       setIsCallInProgress(false);
//     }
//   };

//   // End call functionality
//   const endCall = () => {
//     setIsCallInProgress(false);
//     // Add any cleanup logic here
//   };

//   const formatLastSeen = (lastSeen) => {
//     if (!lastSeen) return 'Never active';
    
//     const date = new Date(lastSeen);
//     const now = new Date();
//     const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
//     if (diffInMinutes < 1) return 'Active now';
//     if (diffInMinutes < 60) return `Active ${diffInMinutes}m ago`;
//     if (diffInMinutes < 1440) return `Active ${Math.floor(diffInMinutes / 60)}h ago`;
    
//     return `Active ${date.toLocaleDateString()}`;
//   };

//   const handleRemoveConnection = async () => {
//     Alert.alert(
//       'Remove Connection',
//       `Are you sure you want to remove ${getFullName(user)} from your connections?`,
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Remove',
//           style: 'destructive',
//           onPress: async () => {
//             setIsRemoving(true);
//             try {
//               await ConnectionAPI.removeConnection(userId);
//               Alert.alert('Success', 'Connection removed successfully', [
//                 {
//                   text: 'OK',
//                   onPress: () => onClose()
//                 }
//               ]);
//             } catch (error) {
//               console.error('Error removing connection:', error);
//               Alert.alert('Error', 'Failed to remove connection. Please try again.');
//             } finally {
//               setIsRemoving(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const getFullName = (user) => {
//     if (!user) return 'Unknown User'; 
    
//     const firstName = user.first_name || '';
//     const lastName = user.last_name || '';
//     const fullName = `${firstName} ${lastName}`.trim();
    
//     return fullName || user.username || 'Unknown User';
//   };

//   const handleScroll = Animated.event(
//     [{ nativeEvent: { contentOffset: { y: scrollY } } }],
//     { 
//       useNativeDriver: false,
//       listener: (event) => {
//         const offsetY = event.nativeEvent.contentOffset.y;
//         const opacity = Math.min(1, offsetY / (HEADER_HEIGHT - 120));
//         headerOpacity.setValue(opacity);
//       }
//     }
//   );

//   const renderHeader = () => {
//     const avatarTranslateY = scrollY.interpolate({
//       inputRange: [0, HEADER_HEIGHT - 120],
//       outputRange: [0, -50],
//       extrapolate: 'clamp',
//     });

//     const avatarScale = scrollY.interpolate({
//       inputRange: [0, HEADER_HEIGHT - 120],
//       outputRange: [1, 0.8],
//       extrapolate: 'clamp',
//     });
    
//     if (!user) return null;

//     return (
//       <View style={styles.headerContainer}>
//         <LinearGradient
//           colors={['#667eea', '#764ba2']}
//           style={styles.headerGradient}
//         />
        
//         {/* Floating Header */}
//         <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
//           <BlurView intensity={80} style={styles.blurHeader}>
//             <View style={styles.floatingHeaderContent}>
//               <Image
//                 source={{
//                   uri: user?.profile_picture_url || user?.profile_picture || 
//                        `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&size=40&background=667eea&color=fff`
//                 }}
//                 style={styles.floatingAvatar}
//               />
//               <View style={styles.floatingUserInfo}>
//                 <Text style={styles.floatingName} numberOfLines={1}>
//                   {getFullName(user)}
//                 </Text>
//                 <Text style={styles.floatingUsername} numberOfLines={1}>
//                   @{user?.username || 'unknown'}
//                 </Text>
//               </View>
//             </View>
//           </BlurView>
//         </Animated.View>

//         {/* Main Header Content */}
//         <View style={styles.headerContent}>
//           <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
//             <BlurView intensity={20} style={styles.closeButtonBlur}>
//               <Ionicons name="close" size={24} color="#fff" />
//             </BlurView>
//           </TouchableOpacity>

//           <Animated.View 
//             style={[
//               styles.avatarSection,
//               {
//                 transform: [
//                   { translateY: avatarTranslateY },
//                   { scale: avatarScale }
//                 ]
//               }
//             ]}
//           >
//             <View style={styles.avatarContainer}>
//               <Image
//                 source={{
//                   uri: user?.profile_picture_url || user?.profile_picture || 
//                        `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&size=150&background=667eea&color=fff`
//                 }}
//                 style={styles.avatar}
//                 onError={(error) => console.log('Image load error:', error)}
//               />
//               {user?.is_online && (
//                 <View style={styles.onlineIndicator}>
//                   <View style={styles.onlineDot} />
//                 </View>
//               )}
//               <View style={styles.verifiedBadge}>
//                 <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
//               </View>
//             </View>

//             <View style={styles.userInfo}>
//               <Text style={styles.displayName}>{getFullName(user)}</Text>
//               <Text style={styles.username}>@{user?.username || 'unknown'}</Text>
              
//               <View style={styles.statusContainer}>
//                 {user?.is_online ? (
//                   <View style={styles.onlineStatus}>
//                     <View style={styles.statusDot} />
//                     <Text style={styles.statusText}>Online</Text>
//                   </View>
//                 ) : (
//                   <Text style={styles.lastSeenText}>
//                     {formatLastSeen(user?.last_seen)}
//                   </Text>
//                 )}
//               </View>
//             </View>
//           </Animated.View>
//         </View>
//       </View>
//     );
//   };

//   const renderQuickActions = () => (
//     <View style={styles.quickActions}>
//       <TouchableOpacity 
//         style={[styles.actionButton, isCallInProgress && styles.disabledButton]}
//         onPress={handleAudioCall}
//         disabled={isCallInProgress}
//       >
//         <LinearGradient
//           colors={isCallInProgress ? ['#cccccc', '#999999'] : ['#f093fb', '#f5576c']}
//           style={styles.actionButtonGradient}
//         >
//           {isCallInProgress ? (
//             <ActivityIndicator size="small" color="#fff" />
//           ) : (
//             <Ionicons name="call" size={20} color="#fff" />
//           )}
//         </LinearGradient>
//         <Text style={styles.actionLabel}>Call</Text>
//       </TouchableOpacity>

//       <TouchableOpacity 
//         style={[styles.actionButton, isCallInProgress && styles.disabledButton]}
//         onPress={handleVideoCall}
//         disabled={isCallInProgress}
//       >
//         <LinearGradient
//           colors={isCallInProgress ? ['#cccccc', '#999999'] : ['#4facfe', '#00f2fe']}
//           style={styles.actionButtonGradient}
//         >
//           {isCallInProgress ? (
//             <ActivityIndicator size="small" color="#fff" />
//           ) : (
//             <Ionicons name="videocam" size={20} color="#fff" />
//           )}
//         </LinearGradient>
//         <Text style={styles.actionLabel}>Video</Text>
//       </TouchableOpacity>

//       <TouchableOpacity 
//         style={styles.actionButton}
//         onPress={handleRemoveConnection}
//         disabled={isRemoving}
//       >
//         <LinearGradient
//           colors={isRemoving ? ['#cccccc', '#999999'] : ['#FF6B6B', '#EE5A52']}
//           style={styles.actionButtonGradient}
//         >
//           {isRemoving ? (
//             <ActivityIndicator size="small" color="#fff" />
//           ) : (
//             <Ionicons name="person-remove" size={20} color="#fff" />
//           )}
//         </LinearGradient>
//         <Text style={styles.actionLabel}>
//           {isRemoving ? 'Removing...' : 'Remove'}
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderInfoSection = (icon, title, children) => (
//     <View style={styles.infoSection}>
//       <View style={styles.sectionHeader}>
//         <View style={styles.sectionIconContainer}>
//           <Ionicons name={icon} size={20} color="#667eea" />
//         </View>
//         <Text style={styles.sectionTitle}>{title}</Text>
//       </View>
//       <View style={styles.sectionContent}>
//         {children}
//       </View>
//     </View>
//   );

//   const renderInfoItem = (icon, label, value, color = "#8E8E93") => (
//     <View style={styles.infoItem}>
//       <View style={[styles.infoIcon, { backgroundColor: `${color}15` }]}>
//         <Ionicons name={icon} size={18} color={color} />
//       </View>
//       <View style={styles.infoContent}>
//         <Text style={styles.infoLabel}>{label}</Text>
//         <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
//       </View>
//     </View>
//   );

//   if (loading) {
//     return (
//       <Modal visible={visible} animationType="fade" onRequestClose={handleClose}>
//         <View style={styles.centerContainer}>
//           <View style={styles.loadingCard}>
//             <ActivityIndicator size="large" color="#667eea" />
//             <Text style={styles.loadingText}>Loading profile...</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   if (error) {
//     return (
//       <Modal visible={visible} animationType="fade" onRequestClose={handleClose}>
//         <View style={styles.centerContainer}>
//           <View style={styles.errorCard}>
//             <View style={styles.errorIconContainer}>
//               <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
//             </View>
//             <Text style={styles.errorTitle}>Oops!</Text>
//             <Text style={styles.errorText}>{error}</Text>
//             <TouchableOpacity onPress={fetchUserDetails} style={styles.retryButton}>
//               <LinearGradient
//                 colors={['#667eea', '#764ba2']}
//                 style={styles.retryButtonGradient}
//               >
//                 <Ionicons name="refresh" size={20} color="#fff" />
//                 <Text style={styles.retryButtonText}>Try Again</Text>
//               </LinearGradient>
//             </TouchableOpacity>
//             <TouchableOpacity onPress={handleClose} style={styles.closeErrorButton}>
//               <Text style={styles.closeErrorText}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     );
//   }
 
//   if (!user) {
//     return (
//       <Modal visible={visible} animationType="fade" onRequestClose={handleClose}>
//         <View style={styles.centerContainer}>
//           <View style={styles.loadingCard}>
//             <ActivityIndicator size="large" color="#667eea" />
//             <Text style={styles.loadingText}>Loading profile...</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="fullScreen"
//       onRequestClose={handleClose}
//     >
//       <StatusBar barStyle="light-content" backgroundColor="#667eea" />
//       <View style={styles.container}>
//         {renderHeader()}
        
//         <Animated.ScrollView
//           style={styles.scrollView}
//           contentContainerStyle={styles.scrollContent}
//           onScroll={handleScroll}
//           scrollEventThrottle={16}
//           showsVerticalScrollIndicator={false}
//         >
//           <View style={styles.content}>
//             {renderQuickActions()}

//             {renderInfoSection("person", "Personal Information", 
//               <>
//                 {renderInfoItem("mail", "Email", user?.email, "#FF6B6B")}
//                 {renderInfoItem("person-circle", "Full Name", getFullName(user), "#4ECDC4")}
//               </>
//             )}

//             {(user?.course || user?.year) && renderInfoSection("school", "Academic Information",
//               <>
//                 {user?.course && renderInfoItem("book", "Course", user.course, "#45B7D1")}
//                 {user?.year && renderInfoItem("calendar", "Year", `Year ${user.year}`, "#96CEB4")}
//               </>
//             )}

//             {renderInfoSection("time", "Account Details",
//               <>
//                 {renderInfoItem("person-add", "Member since", 
//                   user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', {
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric'
//                   }) : 'Unknown', "#DDA0DD"
//                 )}
//               </>
//             )}

//             <View style={styles.bottomSpacer} />
//           </View>
//         </Animated.ScrollView>
//       </View>
//     </Modal>
//   );
// };

// const UserDetailsScreen = () => {
//   const params = useLocalSearchParams();
//   const userId = params.userId;

//   console.log('UserDetailsScreen - Raw params:', params);
//   console.log('UserDetailsScreen - Extracted userId:', userId);

//   const handleClose = () => {
//     router.back();
//   };

//   return (
//     <View style={{ flex: 1 }}>
//       <UserDetailModal
//         visible={true}
//         userId={userId}
//         onClose={handleClose}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   headerContainer: {
//     height: HEADER_HEIGHT,
//     position: 'relative',
//   },
//   headerGradient: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     top: 0,
//     height: HEADER_HEIGHT,
//   },
//   floatingHeader: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     height: Platform.OS === 'ios' ? 100 : 80,
//     zIndex: 1000,
//   },
//   blurHeader: {
//     flex: 1,
//     paddingTop: Platform.OS === 'ios' ? 50 : 30,
//   },
//   floatingHeaderContent: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   floatingAvatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     marginRight: 12,
//   },
//   floatingUserInfo: {
//     flex: 1,
//   },
//   floatingName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   floatingUsername: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.8)',
//   },
//   headerContent: {
//     flex: 1,
//     paddingTop: Platform.OS === 'ios' ? 50 : 30,
//   },
//   closeButton: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 50 : 30,
//     right: 20,
//     zIndex: 100,
//   },
//   closeButtonBlur: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   avatarSection: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginBottom: 20,
//   },
//   avatar: {
//     width: AVATAR_SIZE,
//     height: AVATAR_SIZE,
//     borderRadius: AVATAR_SIZE / 2,
//     borderWidth: 4,
//     borderColor: 'rgba(255,255,255,0.3)',
//     backgroundColor: 'rgba(255,255,255,0.1)',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 8,
//     right: 8,
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   onlineDot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#4CAF50',
//   },
//   verifiedBadge: {
//     position: 'absolute',
//     top: -4,
//     right: -4,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   userInfo: {
//     alignItems: 'center',
//   },
//   displayName: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 4,
//     textAlign: 'center',
//     textShadowColor: 'rgba(0,0,0,0.1)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
//   username: {
//     fontSize: 16,
//     color: 'rgba(255,255,255,0.8)',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   statusContainer: {
//     alignItems: 'center',
//   },
//   onlineStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 6,
//     backgroundColor: 'rgba(76, 175, 80, 0.2)',
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: 'rgba(76, 175, 80, 0.3)',
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#4CAF50',
//     marginRight: 8,
//   },
//   statusText: {
//     fontSize: 14,
//     color: '#4CAF50',
//     fontWeight: '600',
//   },
//   lastSeenText: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     textAlign: 'center',
//   },
//   scrollView: {
//     flex: 1,
//     marginTop: -40,
//   },
//   scrollContent: {
//     paddingTop: 40,
//   },
//   content: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     paddingTop: 30,
//     minHeight: height - HEADER_HEIGHT + 100,
//   },
//   quickActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingHorizontal: 40,
//     marginBottom: 30,
//   },
//   actionButton: {
//     alignItems: 'center',
//   },
//   actionButtonGradient: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4.65,
//     elevation: 8,
//   },
//   actionLabel: {
//     fontSize: 12,
//     color: '#666',
//     fontWeight: '500',
//   },
//   infoSection: {
//     marginHorizontal: 20,
//     marginBottom: 24,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   sectionIconContainer: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(102, 126, 234, 0.1)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#2c3e50',
//   },
//   sectionContent: {
//     padding: 20,
//     paddingTop: 16,
//   },
//   infoItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f8f9fa',
//   },
//   infoIcon: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//   },
//   infoContent: {
//     flex: 1,
//   },
//   infoLabel: {
//     fontSize: 12,
//     color: '#8E8E93',
//     fontWeight: '500',
//     marginBottom: 2,
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   infoValue: {
//     fontSize: 16,
//     color: '#2c3e50',
//     fontWeight: '500',
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   loadingCard: {
//     backgroundColor: '#fff',
//     padding: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//     fontWeight: '500',
//   },
//   errorCard: {
//     backgroundColor: '#fff',
//     padding: 30,
//     borderRadius: 20,
//     alignItems: 'center',
//     marginHorizontal: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   errorIconContainer: {
//     marginBottom: 20,
//   },
//   errorTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 24,
//     lineHeight: 22,
//   },
//   retryButton: {
//     marginBottom: 16,
//   },
//   retryButtonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 25,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   closeErrorButton: {
//     paddingVertical: 12,
//   },
//   closeErrorText: {
//     color: '#8E8E93',
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   bottomSpacer: {
//     height: 50,
//   },
// });
