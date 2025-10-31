

import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  RefreshControl,
  Platform,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import ConnectionAPI from '../api/connectionService';

const { width, height } = Dimensions.get('window');

// Modern theme with professional color palette
const theme = {
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  secondary: '#06B6D4',
  accent: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#059669',
  
  // Neutral colors
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  white: '#FFFFFF',
  black: '#000000',
  
  // Card colors
  cardBg: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.05)',
  
  // Gradient colors
  gradientStart: '#4F46E5',
  gradientEnd: '#7C3AED',
};

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  
  const router = useRouter();

  const startAnimations = () => {
    Animated.stagger(150, [
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ]).start();
  };

  const getProfileImageSource = (profilePicture) => {
    if (!profilePicture) return null;
    
    const pic = profilePicture.trim();
    
    if (pic.startsWith('data:image')) {
      return pic;
    }
    
    if (pic.startsWith('http')) {
      return pic;
    }
    
    if (pic.includes('/media/')) {
      return `${ConnectionAPI.getBaseUrl()}${pic.startsWith('/') ? pic : `/${pic}`}`;
    }
    
    if (typeof pic === 'string' && 
        pic.match(/^[A-Za-z0-9+/]+=*$/) && 
        pic.length > 50) {
      return `data:image/jpeg;base64,${pic}`;
    }
    
    return null;
  };

  const fetchProfile = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Use ConnectionAPI instead of direct axios calls
      const userData = await ConnectionAPI.getCurrentUser(true); // Force refresh
      setProfile(userData);
      
      startAnimations();
    } catch (err) {
      console.error('Profile fetch error:', err);
      
      if (err.message.includes('log in')) {
        setError('Authentication expired. Please log in again.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else if (err.message.includes('timeout')) {
        setError('Request timeout. Please check your connection.');
      } else if (err.message.includes('Network')) {
        setError('Network error. Cannot reach server.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditProfile = () => {
    // Navigate to the EditProfileScreen
    router.push('/edit-profile');
  };

  const onRefresh = () => {
    fetchProfile(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.loadingContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContent}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingTitle}>Loading Profile</Text>
                <Text style={styles.loadingSubtitle}>Please wait a moment...</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.errorContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.errorContent}>
              <View style={styles.errorCard}>
                <View style={styles.errorIcon}>
                  <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
                </View>
                <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                <Text style={styles.errorText}>{error}</Text>
                <View style={styles.errorActions}>
                  <TouchableOpacity 
                    style={styles.primaryButton} 
                    onPress={fetchProfile}
                    activeOpacity={0.8}
                  >
                    <Feather name="refresh-cw" size={20} color={theme.white} />
                    <Text style={styles.primaryButtonText}>Retry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.secondaryButton} 
                    onPress={() => router.push('/login')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="log-in-outline" size={20} color={theme.primary} />
                    <Text style={styles.secondaryButtonText}>Go to Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.errorContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.errorContent}>
              <View style={styles.errorCard}>
                <View style={styles.errorIcon}>
                  <Ionicons name="person-outline" size={64} color={theme.gray400} />
                </View>
                <Text style={styles.errorTitle}>No Profile Found</Text>
                <Text style={styles.errorText}>We couldn't load your profile data</Text>
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={fetchProfile}
                  activeOpacity={0.8}
                >
                  <Feather name="refresh-cw" size={20} color={theme.white} />
                  <Text style={styles.primaryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.headerGradient}>
          <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.backButton}
                // onPress={() => router.back()}
                onPress={() => router.replace('/auth/dashboard')}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color={theme.white} />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>My Profile</Text>
              
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditProfile}
                activeOpacity={0.7}
              >
                <Feather name="edit-3" size={20} color={theme.white} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
            progressViewOffset={100}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Section */}
        <Animated.View 
          style={[
            styles.profileSection,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {getProfileImageSource(profile.profile_picture) ? (
                <Image 
                  source={{ uri: getProfileImageSource(profile.profile_picture) }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color={theme.primary} />
                </View>
              )}
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.username}>{profile.username || 'User'}</Text>
              <Text style={styles.userRole}>Student</Text>
            </View>
          </View>
        </Animated.View>

        {/* Content Section */}
        <Animated.View 
          style={[
            styles.contentSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.profileDetails}>
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Profile Details</Text>
              
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="email" size={20} color={theme.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{profile.email || 'Not provided'}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="school" size={20} color={theme.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Course</Text>
                  <Text style={styles.detailValue}>{profile.course || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="date-range" size={20} color={theme.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Year of Study</Text>
                  <Text style={styles.detailValue}>{profile.year || 'Not specified'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={handleEditProfile}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Feather name="edit-3" size={24} color={theme.primary} />
                </View>
                <Text style={styles.actionTitle}>Edit Profile</Text>
                <Text style={styles.actionSubtitle}>Update your profile information</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.gray400} style={styles.actionChevron} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => router.push('/change-password')}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="key-outline" size={24} color={theme.primary} />
                </View>
                <Text style={styles.actionTitle}>Change Password</Text>
                <Text style={styles.actionSubtitle}>Update your account security</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.gray400} style={styles.actionChevron} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => {/* Add settings navigation */}}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="settings-outline" size={24} color={theme.primary} />
                </View>
                <Text style={styles.actionTitle}>Account Settings</Text>
                <Text style={styles.actionSubtitle}>Privacy and preferences</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.gray400} style={styles.actionChevron} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.gray50,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  headerSafeArea: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.white,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
    paddingBottom: 40,
  },
  
  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: -40,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.gray200,
    borderWidth: 4,
    borderColor: theme.white,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.white,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  userInfo: {
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.gray900,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.gray500,
  },
  
  // Content Section
  contentSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  profileDetails: {
    gap: 24,
  },
  
  // Details Card
  detailsCard: {
    backgroundColor: theme.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.gray900,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.gray500,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.gray900,
  },
  detailDivider: {
    height: 1,
    backgroundColor: theme.gray100,
    marginVertical: 8,
  },
  
  // Quick Actions
  quickActions: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.gray900,
    flex: 1,
  },
  actionSubtitle: {
    fontSize: 14,
    color: theme.gray500,
    flex: 1,
    marginTop: 2,
  },
  actionChevron: {
    marginLeft: 8,
  },
  
  // Button Styles
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 16,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.gray200,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: theme.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.gray900,
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: theme.gray500,
    textAlign: 'center',
  },
  
  // Error States
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: theme.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.gray900,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: theme.gray600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  errorActions: {
    gap: 8,
    width: '100%',
  },
});

export default ProfileScreen;



























































// import React, { useEffect, useState, useRef } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   StyleSheet, 
//   ActivityIndicator, 
//   TextInput, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity,
//   Animated,
//   Dimensions,
//   StatusBar,
//   RefreshControl,
//   Platform,
//   SafeAreaView
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

// const { width, height } = Dimensions.get('window');

// // Modern theme with professional color palette
// const theme = {
//   primary: '#4F46E5',
//   primaryLight: '#6366F1',
//   secondary: '#06B6D4',
//   accent: '#10B981',
//   danger: '#EF4444',
//   warning: '#F59E0B',
//   success: '#059669',
  
//   // Neutral colors
//   gray50: '#F9FAFB',
//   gray100: '#F3F4F6',
//   gray200: '#E5E7EB',
//   gray300: '#D1D5DB',
//   gray400: '#9CA3AF',
//   gray500: '#6B7280',
//   gray600: '#4B5563',
//   gray700: '#374151',
//   gray800: '#1F2937',
//   gray900: '#111827',
  
//   white: '#FFFFFF',
//   black: '#000000',
  
//   // Card colors
//   cardBg: '#FFFFFF',
//   cardShadow: 'rgba(0, 0, 0, 0.05)',
  
//   // Gradient colors
//   gradientStart: '#4F46E5',
//   gradientEnd: '#7C3AED',
// };

// const ProfileScreen = () => {
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [editForm, setEditForm] = useState({
//     email: '',
//     course: '',
//     year: '',
//     profile_picture: null
//   });
  
//   // Animation values
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(30)).current;
//   const scaleAnim = useRef(new Animated.Value(0.95)).current;
//   const headerOpacity = useRef(new Animated.Value(0)).current;
  
//   const router = useRouter();

//   const getAuthToken = async () => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   const getBaseUrl = () => {
//     const Platform = require('react-native').Platform;
//     if (Platform.OS === 'web') {
//       return 'http://localhost:8000';
//     } else if (Platform.OS === 'android') {
//       return 'http://10.22.3.34:8000';
//     } else {
//       return 'http://127.0.0.1:8000';
//     }
//   };

//   const startAnimations = () => {
//     Animated.stagger(150, [
//       Animated.timing(headerOpacity, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.parallel([
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         }),
//         Animated.spring(scaleAnim, {
//           toValue: 1,
//           tension: 50,
//           friction: 8,
//           useNativeDriver: true,
//         }),
//         Animated.timing(slideAnim, {
//           toValue: 0,
//           duration: 600,
//           useNativeDriver: true,
//         }),
//       ])
//     ]).start();
//   };

//   const getProfileImageSource = (profilePicture) => {
//     if (!profilePicture) return null;
    
//     const pic = profilePicture.trim();
    
//     if (pic.startsWith('data:image')) {
//       return pic;
//     }
    
//     if (pic.startsWith('http')) {
//       return pic;
//     }
    
//     if (pic.includes('/media/')) {
//       const baseUrl = getBaseUrl();
//       const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
//       return fullUrl;
//     }
    
//     if (typeof pic === 'string' && 
//         pic.match(/^[A-Za-z0-9+/]+=*$/) && 
//         pic.length > 50) {
//       return `data:image/jpeg;base64,${pic}`;
//     }
    
//     return null;
//   };

//   const fetchProfile = async (showRefresh = false) => {
//     try {
//       if (showRefresh) {
//         setRefreshing(true);
//       } else {
//         setLoading(true);
//       }
//       setError(null);
      
//       const token = await getAuthToken();
//       if (!token) {
//         setError('No authentication token found. Please log in again.');
//         return;
//       }
      
//       const res = await axios.get(`${getBaseUrl()}/api/profile/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });
      
//       setProfile(res.data);
//       setEditForm({
//         email: res.data.email || '',
//         course: res.data.course || '',
//         year: String(res.data.year || ''),
//         profile_picture: res.data.profile_picture || null
//       });
      
//       startAnimations();
//     } catch (err) {
//       console.error('Profile fetch error:', err);
      
//       if (err.response?.status === 401) {
//         setError('Authentication expired. Please log in again.');
//         await AsyncStorage.removeItem('access_token');
//         setTimeout(() => {
//           router.push('/login');
//         }, 2000);
//       } else if (err.code === 'ECONNABORTED') {
//         setError('Request timeout. Please check your connection.');
//       } else if (err.request) {
//         setError('Network error. Cannot reach server.');
//       } else {
//         setError('An unexpected error occurred.');
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const handlePickImage = async () => {
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({ 
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 0.8,
//         base64: true,
//       });
      
//       if (!result.canceled && result.assets[0].base64) {
//         const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
//         setEditForm(prev => ({ ...prev, profile_picture: base64Image }));
//       }
//     } catch (error) {
//       console.error('Image picker error:', error);
//       Alert.alert('Error', 'Failed to pick image. Please try again.');
//     }
//   };

//   const handleSaveChanges = async () => {
//     try {
//       setSaving(true);
//       const token = await getAuthToken();
//       if (!token) {
//         Alert.alert('Error', 'Authentication token not found. Please log in again.');
//         return;
//       }

//       const res = await axios.put(`${getBaseUrl()}/api/profile/`, {
//         email: editForm.email,
//         course: editForm.course,
//         year: editForm.year,
//         profile_picture: editForm.profile_picture,
//       }, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         }
//       });

//       setProfile(res.data);
//       setIsEditing(false);
      
//       // Show success feedback
//       Alert.alert('Success', 'Profile updated successfully!', [
//         { text: 'OK', style: 'default' }
//       ]);
//     } catch (err) {
//       console.error('Save error:', err);
//       if (err.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//         await AsyncStorage.removeItem('access_token');
//         router.push('/login');
//       } else {
//         Alert.alert('Error', 'Failed to update profile. Please try again.');
//       }
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditForm({
//       email: profile.email || '',
//       course: profile.course || '',
//       year: String(profile.year || ''),
//       profile_picture: profile.profile_picture || null
//     });
//     setIsEditing(false);
//   };

//   const onRefresh = () => {
//     fetchProfile(true);
//   };

//   if (loading && !refreshing) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
//         <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.loadingContainer}>
//           <SafeAreaView style={styles.safeArea}>
//             <View style={styles.loadingContent}>
//               <View style={styles.loadingCard}>
//                 <ActivityIndicator size="large" color={theme.primary} />
//                 <Text style={styles.loadingTitle}>Loading Profile</Text>
//                 <Text style={styles.loadingSubtitle}>Please wait a moment...</Text>
//               </View>
//             </View>
//           </SafeAreaView>
//         </LinearGradient>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
//         <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.errorContainer}>
//           <SafeAreaView style={styles.safeArea}>
//             <View style={styles.errorContent}>
//               <View style={styles.errorCard}>
//                 <View style={styles.errorIcon}>
//                   <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
//                 </View>
//                 <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
//                 <Text style={styles.errorText}>{error}</Text>
//                 <View style={styles.errorActions}>
//                   <TouchableOpacity 
//                     style={styles.primaryButton} 
//                     onPress={fetchProfile}
//                     activeOpacity={0.8}
//                   >
//                     <Feather name="refresh-cw" size={20} color={theme.white} />
//                     <Text style={styles.primaryButtonText}>Retry</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity 
//                     style={styles.secondaryButton} 
//                     onPress={() => router.push('/login')}
//                     activeOpacity={0.8}
//                   >
//                     <Ionicons name="log-in-outline" size={20} color={theme.primary} />
//                     <Text style={styles.secondaryButtonText}>Go to Login</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </View>
//           </SafeAreaView>
//         </LinearGradient>
//       </View>
//     );
//   }

//   if (!profile) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
//         <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.errorContainer}>
//           <SafeAreaView style={styles.safeArea}>
//             <View style={styles.errorContent}>
//               <View style={styles.errorCard}>
//                 <View style={styles.errorIcon}>
//                   <Ionicons name="person-outline" size={64} color={theme.gray400} />
//                 </View>
//                 <Text style={styles.errorTitle}>No Profile Found</Text>
//                 <Text style={styles.errorText}>We couldn't load your profile data</Text>
//                 <TouchableOpacity 
//                   style={styles.primaryButton} 
//                   onPress={fetchProfile}
//                   activeOpacity={0.8}
//                 >
//                   <Feather name="refresh-cw" size={20} color={theme.white} />
//                   <Text style={styles.primaryButtonText}>Retry</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </SafeAreaView>
//         </LinearGradient>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
//       {/* Header */}
//       <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
//         <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.headerGradient}>
//           <SafeAreaView style={styles.headerSafeArea}>
//             <View style={styles.headerContent}>
//               <TouchableOpacity 
//                 style={styles.backButton}
//                 onPress={() => router.back()}
//                 activeOpacity={0.7}
//               >
//                 <Ionicons name="chevron-back" size={24} color={theme.white} />
//               </TouchableOpacity>
              
//               <Text style={styles.headerTitle}>
//                 {isEditing ? 'Edit Profile' : 'My Profile'}
//               </Text>
              
//               {isEditing ? (
//                 <TouchableOpacity 
//                   style={styles.closeButton}
//                   onPress={handleCancelEdit}
//                   activeOpacity={0.7}
//                 >
//                   <Ionicons name="close" size={24} color={theme.white} />
//                 </TouchableOpacity>
//               ) : (
//                 <TouchableOpacity 
//                   style={styles.editButton}
//                   onPress={() => setIsEditing(true)}
//                   activeOpacity={0.7}
//                 >
//                   <Feather name="edit-3" size={20} color={theme.white} />
//                 </TouchableOpacity>
//               )}
//             </View>
//           </SafeAreaView>
//         </LinearGradient>
//       </Animated.View>

//       <ScrollView 
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={[theme.primary]}
//             tintColor={theme.primary}
//             progressViewOffset={100}
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Profile Header Section */}
//         <Animated.View 
//           style={[
//             styles.profileSection,
//             { 
//               opacity: fadeAnim,
//               transform: [{ scale: scaleAnim }]
//             }
//           ]}
//         >
//           <View style={styles.avatarSection}>
//             <View style={styles.avatarContainer}>
//               {getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) ? (
//                 <Image 
//                   source={{ uri: getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) }} 
//                   style={styles.avatar}
//                 />
//               ) : (
//                 <View style={styles.avatarPlaceholder}>
//                   <Ionicons name="person" size={48} color={theme.primary} />
//                 </View>
//               )}
              
//               {isEditing && (
//                 <TouchableOpacity 
//                   style={styles.cameraButton} 
//                   onPress={handlePickImage}
//                   activeOpacity={0.8}
//                 >
//                   <LinearGradient colors={[theme.primary, theme.primaryLight]} style={styles.cameraGradient}>
//                     <Ionicons name="camera" size={16} color={theme.white} />
//                   </LinearGradient>
//                 </TouchableOpacity>
//               )}
//             </View>
            
//             {!isEditing && (
//               <View style={styles.userInfo}>
//                 <Text style={styles.username}>{profile.username}</Text>
//                 <Text style={styles.userRole}>Student</Text>
//               </View>
//             )}
//           </View>
//         </Animated.View>

//         {/* Content Section */}
//         <Animated.View 
//           style={[
//             styles.contentSection,
//             {
//               opacity: fadeAnim,
//               transform: [{ translateY: slideAnim }]
//             }
//           ]}
//         >
//           {isEditing ? (
//             <View style={styles.editForm}>
//               <View style={styles.formCard}>
//                 <Text style={styles.formTitle}>Profile Information</Text>
                
//                 <View style={styles.inputGroup}>
//                   <Text style={styles.inputLabel}>Email Address</Text>
//                   <View style={styles.inputContainer}>
//                     <MaterialIcons name="email" size={20} color={theme.gray400} style={styles.inputIcon} />
//                     <TextInput
//                       style={styles.textInput}
//                       value={editForm.email}
//                       onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
//                       placeholder="Enter your email"
//                       keyboardType="email-address"
//                       placeholderTextColor={theme.gray400}
//                       autoCapitalize="none"
//                       autoCorrect={false}
//                     />
//                   </View>
//                 </View>

//                 <View style={styles.inputGroup}>
//                   <Text style={styles.inputLabel}>Course</Text>
//                   <View style={styles.inputContainer}>
//                     <Ionicons name="school" size={20} color={theme.gray400} style={styles.inputIcon} />
//                     <TextInput
//                       style={styles.textInput}
//                       value={editForm.course}
//                       onChangeText={(text) => setEditForm(prev => ({ ...prev, course: text }))}
//                       placeholder="Enter your course"
//                       placeholderTextColor={theme.gray400}
//                     />
//                   </View>
//                 </View>

//                 <View style={styles.inputGroup}>
//                   <Text style={styles.inputLabel}>Year of Study</Text>
//                   <View style={styles.inputContainer}>
//                     <MaterialIcons name="date-range" size={20} color={theme.gray400} style={styles.inputIcon} />
//                     <TextInput
//                       style={styles.textInput}
//                       value={editForm.year}
//                       onChangeText={(text) => setEditForm(prev => ({ ...prev, year: text }))}
//                       placeholder="Enter your year"
//                       keyboardType="numeric"
//                       placeholderTextColor={theme.gray400}
//                     />
//                   </View>
//                 </View>
//               </View>

//               <View style={styles.actionButtons}>
//                 <TouchableOpacity 
//                   style={[styles.primaryButton, saving && styles.buttonDisabled]} 
//                   onPress={handleSaveChanges}
//                   disabled={saving}
//                   activeOpacity={0.8}
//                 >
//                   {saving ? (
//                     <ActivityIndicator size="small" color={theme.white} />
//                   ) : (
//                     <Ionicons name="checkmark" size={20} color={theme.white} />
//                   )}
//                   <Text style={styles.primaryButtonText}>
//                     {saving ? 'Saving...' : 'Save Changes'}
//                   </Text>
//                 </TouchableOpacity>
                
//                 <TouchableOpacity 
//                   style={styles.secondaryButton} 
//                   onPress={handleCancelEdit}
//                   disabled={saving}
//                   activeOpacity={0.8}
//                 >
//                   <Ionicons name="close" size={20} color={theme.primary} />
//                   <Text style={styles.secondaryButtonText}>Cancel</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           ) : (
//             <View style={styles.profileDetails}>
//               <View style={styles.detailsCard}>
//                 <Text style={styles.detailsTitle}>Profile Details</Text>
                
//                 <View style={styles.detailItem}>
//                   <View style={styles.detailIcon}>
//                     <MaterialIcons name="email" size={20} color={theme.primary} />
//                   </View>
//                   <View style={styles.detailContent}>
//                     <Text style={styles.detailLabel}>Email</Text>
//                     <Text style={styles.detailValue}>{profile.email || 'Not provided'}</Text>
//                   </View>
//                 </View>

//                 <View style={styles.detailDivider} />

//                 <View style={styles.detailItem}>
//                   <View style={styles.detailIcon}>
//                     <Ionicons name="school" size={20} color={theme.primary} />
//                   </View>
//                   <View style={styles.detailContent}>
//                     <Text style={styles.detailLabel}>Course</Text>
//                     <Text style={styles.detailValue}>{profile.course || 'Not specified'}</Text>
//                   </View>
//                 </View>

//                 <View style={styles.detailDivider} />

//                 <View style={styles.detailItem}>
//                   <View style={styles.detailIcon}>
//                     <MaterialIcons name="date-range" size={20} color={theme.primary} />
//                   </View>
//                   <View style={styles.detailContent}>
//                     <Text style={styles.detailLabel}>Year of Study</Text>
//                     <Text style={styles.detailValue}>{profile.year || 'Not specified'}</Text>
//                   </View>
//                 </View>
//               </View>

//               <View style={styles.quickActions}>
//                 <TouchableOpacity 
//                   style={styles.actionCard}
//                   onPress={() => router.push('/change-password')}
//                   activeOpacity={0.7}
//                 >
//                   <View style={styles.actionIconContainer}>
//                     <Ionicons name="key-outline" size={24} color={theme.primary} />
//                   </View>
//                   <Text style={styles.actionTitle}>Change Password</Text>
//                   <Text style={styles.actionSubtitle}>Update your account security</Text>
//                   <Ionicons name="chevron-forward" size={20} color={theme.gray400} style={styles.actionChevron} />
//                 </TouchableOpacity>

//                 <TouchableOpacity 
//                   style={styles.actionCard}
//                   onPress={() => {/* Add settings navigation */}}
//                   activeOpacity={0.7}
//                 >
//                   <View style={styles.actionIconContainer}>
//                     <Ionicons name="settings-outline" size={24} color={theme.primary} />
//                   </View>
//                   <Text style={styles.actionTitle}>Account Settings</Text>
//                   <Text style={styles.actionSubtitle}>Privacy and preferences</Text>
//                   <Ionicons name="chevron-forward" size={20} color={theme.gray400} style={styles.actionChevron} />
//                 </TouchableOpacity>
//               </View>
//             </View>
//           )}
//         </Animated.View>
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.gray50,
//   },
//   safeArea: {
//     flex: 1,
//   },
  
//   // Header Styles
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 1000,
//   },
//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
//   },
//   headerSafeArea: {
//     paddingBottom: 16,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingTop: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: theme.white,
//     flex: 1,
//     textAlign: 'center',
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   editButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   closeButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
  
//   // Scroll View
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingTop: Platform.OS === 'ios' ? 120 : 100,
//     paddingBottom: 40,
//   },
  
//   // Profile Section
//   profileSection: {
//     alignItems: 'center',
//     paddingVertical: 20,
//     marginTop: -40,
//   },
//   avatarSection: {
//     alignItems: 'center',
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginBottom: 16,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: theme.gray200,
//     borderWidth: 4,
//     borderColor: theme.white,
//     shadowColor: theme.black,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   avatarPlaceholder: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: theme.gray100,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 4,
//     borderColor: theme.white,
//     shadowColor: theme.black,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   cameraButton: {
//     position: 'absolute',
//     bottom: 4,
//     right: 4,
//     borderRadius: 18,
//     overflow: 'hidden',
//     shadowColor: theme.black,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   cameraGradient: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   userInfo: {
//     alignItems: 'center',
//   },
//   username: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: theme.gray900,
//     marginBottom: 4,
//   },
//   userRole: {
//     fontSize: 16,
//     color: theme.gray500,
//     fontWeight: '500',
//   },
  
//   // Content Section
//   contentSection: {
//     paddingHorizontal: 20,
//   },
  
//   // Edit Form
//   editForm: {
//     gap: 24,
//   },
//   formCard: {
//     backgroundColor: theme.white,
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: theme.black,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   formTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: theme.gray900,
//     marginBottom: 24,
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   inputLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: theme.gray700,
//     marginBottom: 8,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: theme.gray50,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: theme.gray200,
//     paddingHorizontal: 16,
//     height: 52,
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   textInput: {
//     flex: 1,
//     fontSize: 16,
//     color: theme.gray900,
//     fontWeight: '400',
//   },
  
//   // Profile Details
//   profileDetails: {
//     gap: 24,
//   },
//   detailsCard: {
//     backgroundColor: theme.white,
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: theme.black,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   detailsTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: theme.gray900,
//     marginBottom: 20,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//   },
//   detailIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: theme.gray50,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//   },
//   detailContent: {
//     flex: 1,
//   },
//   detailLabel: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: theme.gray500,
//     marginBottom: 2,
//   },
//   detailValue: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: theme.gray900,
//   },
//   detailDivider: {
//     height: 1,
//     backgroundColor: theme.gray100,
//     marginVertical: 4,
//   },
  
//   // Quick Actions
//   quickActions: {
//     gap: 12,
//   },
//  actionCard: {
//     backgroundColor: theme.white,
//     borderRadius: 16,
//     padding: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: theme.black,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   actionIconContainer: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: theme.gray50,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//   },
//   actionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: theme.gray900,
//     flex: 1,
//   },
//   actionSubtitle: {
//     fontSize: 14,
//     color: theme.gray500,
//     flex: 1,
//     marginTop: 2,
//   },
//   actionChevron: {
//     marginLeft: 8,
//   },
  
//   // Action Buttons
//   actionButtons: {
//     gap: 12,
//   },
//   primaryButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: theme.primary,
//     borderRadius: 12,
//     paddingVertical: 16,
//     paddingHorizontal: 24,
//     gap: 8,
//     shadowColor: theme.primary,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   primaryButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: theme.white,
//   },
//   secondaryButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: theme.white,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: theme.gray200,
//     paddingVertical: 16,
//     paddingHorizontal: 24,
//     gap: 8,
//   },
//   secondaryButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: theme.primary,
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//   },
  
//   // Loading States
//   loadingContainer: {
//     flex: 1,
//   },
//   loadingContent: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   loadingCard: {
//     backgroundColor: theme.white,
//     borderRadius: 20,
//     padding: 32,
//     alignItems: 'center',
//     minWidth: 200,
//     shadowColor: theme.black,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 6,
//   },
//   loadingTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: theme.gray900,
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   loadingSubtitle: {
//     fontSize: 14,
//     color: theme.gray500,
//     textAlign: 'center',
//   },
  
//   // Error States
//   errorContainer: {
//     flex: 1,
//   },
//   errorContent: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   errorCard: {
//     backgroundColor: theme.white,
//     borderRadius: 20,
//     padding: 32,
//     alignItems: 'center',
//     maxWidth: 300,
//     shadowColor: theme.black,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 6,
//   },
//   errorIcon: {
//     marginBottom: 16,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: theme.gray900,
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   errorText: {
//     fontSize: 14,
//     color: theme.gray500,
//     textAlign: 'center',
//     lineHeight: 20,
//     marginBottom: 24,
//   },
//   errorActions: {
//     gap: 12,
//     width: '100%',
//   },
// });

// export default ProfileScreen;






























// import React, { useEffect, useState, useRef } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   StyleSheet, 
//   ActivityIndicator, 
//   TextInput, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity,
//   Animated,
//   Dimensions,
//   StatusBar,
//   RefreshControl
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

// const { width } = Dimensions.get('window');

// // Theme colors for consistency
// const theme = {
//   primary: '#667eea',
//   secondary: '#764ba2',
//   danger: '#e74c3c',
//   success: '#27ae60',
//   light: '#f8f9fa',
//   dark: '#2c3e50',
//   gray: '#6c757d',
//   border: '#e9ecef',
//   white: '#ffffff',
// };

// const ProfileScreen = () => {
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     email: '',
//     course: '',
//     year: '',
//     profile_picture: null
//   });
  
//   // Animation values using useRef for performance
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const scaleAnim = useRef(new Animated.Value(0.9)).current;
//   const slideAnim = useRef(new Animated.Value(50)).current;
  
//   const router = useRouter();

//   const getAuthToken = async () => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   const getBaseUrl = () => {
//     const Platform = require('react-native').Platform;
//     if (Platform.OS === 'web') {
//       return 'http://localhost:8000';
//     } else if (Platform.OS === 'android') {
//       return 'http://10.22.3.34:8000';
//       // return 'http://192.168.220.16:8000';
//       // return 'http://192.168.130.16:8000';
//     } else {
//       return 'http://127.0.0.1:8000';
//     }
//   };

//   const startAnimations = () => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         tension: 50,
//         friction: 7,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const getProfileImageSource = (profilePicture) => {
//     if (!profilePicture) return null;
    
//     const pic = profilePicture.trim();
    
//     // Handle data URLs
//     if (pic.startsWith('data:image')) {
//       return pic;
//     }
    
//     // Handle full HTTP URLs
//     if (pic.startsWith('http')) {
//       return pic;
//     }
    
//     // Handle media URLs - use getBaseUrl() instead of hardcoded URL
//     if (pic.includes('/media/')) {
//       const baseUrl = getBaseUrl();
//       const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
//       return fullUrl;
//     }
    
//     // More reliable base64 detection
//     if (typeof pic === 'string' && 
//         pic.match(/^[A-Za-z0-9+/]+=*$/) && 
//         pic.length > 50) {
//       return `data:image/jpeg;base64,${pic}`;
//     }
    
//     return null;
//   };

//   const fetchProfile = async (showRefresh = false) => {
//     try {
//       if (showRefresh) {
//         setRefreshing(true);
//       } else {
//         setLoading(true);
//       }
//       setError(null);
      
//       console.log('Fetching profile...');
      
//       const token = await getAuthToken();
//       console.log('Token found:', token ? 'Yes' : 'No');
      
//       if (!token) {
//         setError('No authentication token found. Please log in again.');
//         return;
//       }
      
//       const res = await axios.get(`${getBaseUrl()}/api/profile/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });
      
//       console.log('Profile response:', res.data);
      
//       setProfile(res.data);
//       setEditForm({
//         email: res.data.email || '',
//         course: res.data.course || '',
//         year: String(res.data.year || ''),
//         profile_picture: res.data.profile_picture || null
//       });
      
//       // Start animations after successful fetch
//       startAnimations();
//     } catch (err) {
//       console.error('Profile fetch error:', err);
      
//       if (err.response) {
//         console.log('Error status:', err.response.status);
//         console.log('Error data:', err.response.data);
        
//         if (err.response.status === 401) {
//           setError('Authentication expired. Please log in again.');
//           await AsyncStorage.removeItem('access_token');
//           setTimeout(() => {
//             router.push('/login');
//           }, 2000);
//         } else if (err.response.status === 403) {
//           setError('Access forbidden.');
//         } else {
//           setError(`Server error: ${err.response.status}`);
//         }
//       } else if (err.code === 'ECONNABORTED') {
//         setError('Request timeout. Please check your connection.');
//       } else if (err.request) {
//         setError('Network error. Cannot reach server.');
//       } else {
//         setError('An unexpected error occurred.');
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const handlePickImage = async () => {
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({ 
//         base64: true,
//         quality: 0.8,
//         allowsEditing: true,
//         aspect: [1, 1]
//       });
      
//       if (!result.canceled && result.assets[0].base64) {
//         const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
//         setEditForm(prev => ({ ...prev, profile_picture: base64Image }));
//       }
//     } catch (error) {
//       console.error('Image picker error:', error);
//       Alert.alert('Error', 'Failed to pick image. Please try again.');
//     }
//   };

//   const handleSaveChanges = async () => {
//     try {
//       const token = await getAuthToken();
//       if (!token) {
//         Alert.alert('Error', 'Authentication token not found. Please log in again.');
//         return;
//       }

//       const res = await axios.put(`${getBaseUrl()}/api/profile/`, {
//         email: editForm.email,
//         course: editForm.course,
//         year: editForm.year,
//         profile_picture: editForm.profile_picture,
//       }, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         }
//       });

//       setProfile(res.data);
//       setIsEditing(false);
//       Alert.alert('Success', 'Profile updated successfully!', [
//         { text: 'OK', style: 'default' }
//       ]);
//     } catch (err) {
//       console.error('Save error:', err);
//       if (err.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//         await AsyncStorage.removeItem('access_token');
//         router.push('/login');
//       } else {
//         Alert.alert('Error', 'Failed to update profile. Please try again.');
//       }
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditForm({
//       email: profile.email || '',
//       course: profile.course || '',
//       year: String(profile.year || ''),
//       profile_picture: profile.profile_picture || null
//     });
//     setIsEditing(false);
//   };

//   const checkAuthStatus = async () => {
//     try {
//       console.log('Checking auth status...');
//       const token = await getAuthToken();
      
//       if (!token) {
//         Alert.alert('Auth Status', 'No token found');
//         return;
//       }
      
//       const response = await axios.get(`${getBaseUrl()}/api/profile/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         }
//       });
//       console.log('Auth check response:', response.data);
//       Alert.alert('Auth Status', 'You are authenticated ✓');
//     } catch (error) {
//       console.error('Auth check failed:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Auth Status', 'Token expired or invalid ❌');
//         await AsyncStorage.removeItem('access_token');
//       } else {
//         Alert.alert('Auth Status', 'Authentication check failed ❌');
//       }
//     }
//   };

//   const onRefresh = () => {
//     fetchProfile(true);
//   };

//   if (loading && !refreshing) {
//     return (
//       <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.centerContainer}>
//         <StatusBar barStyle="light-content" />
//         <View style={styles.loadingCard}>
//           <ActivityIndicator size="large" color={theme.primary} />
//           <Text style={styles.loadingText}>Loading your profile...</Text>
//         </View>
//       </LinearGradient>
//     );
//   }

//   if (error) {
//     return (
//       <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.centerContainer}>
//         <StatusBar barStyle="light-content" />
//         <View style={styles.errorCard}>
//           <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
//           <Text style={styles.errorText}>{error}</Text>
//           <View style={styles.buttonGroup}>
//             <TouchableOpacity 
//               style={[styles.button, styles.primaryButton]} 
//               onPress={fetchProfile}
//               accessibilityLabel="Retry loading profile"
//               accessibilityRole="button"
//             >
//               <Feather name="refresh-cw" size={20} color={theme.white} />
//               <Text style={styles.buttonText}>Retry</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//               style={[styles.button, styles.secondaryButton]} 
//               onPress={checkAuthStatus}
//               accessibilityLabel="Check authentication status"
//               accessibilityRole="button"
//             >
//               <MaterialIcons name="verified-user" size={20} color={theme.primary} />
//               <Text style={[styles.buttonText, { color: theme.primary }]}>Check Auth</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//               style={[styles.button, styles.dangerButton]} 
//               onPress={() => router.push('/login')}
//               accessibilityLabel="Go to login screen"
//               accessibilityRole="button"
//             >
//               <Ionicons name="log-in-outline" size={20} color={theme.white} />
//               <Text style={styles.buttonText}>Go to Login</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </LinearGradient>
//     );
//   }

//   if (!profile) {
//     return (
//       <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.centerContainer}>
//         <StatusBar barStyle="light-content" />
//         <View style={styles.errorCard}>
//           <Ionicons name="person-outline" size={64} color={theme.gray} />
//           <Text style={styles.errorText}>No profile data found</Text>
//           <TouchableOpacity 
//             style={[styles.button, styles.primaryButton]} 
//             onPress={fetchProfile}
//             accessibilityLabel="Retry loading profile"
//             accessibilityRole="button"
//           >
//             <Feather name="refresh-cw" size={20} color={theme.white} />
//             <Text style={styles.buttonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" />
//       <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.headerGradient} />
      
//       <ScrollView 
//         style={styles.scrollView}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={[theme.primary]}
//             tintColor={theme.primary}
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         <Animated.View 
//           style={[
//             styles.profileHeader, 
//             { 
//               opacity: fadeAnim,
//               transform: [{ scale: scaleAnim }]
//             }
//           ]}
//         >
//           <View style={styles.avatarContainer}>
//             {getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) ? (
//               <Image 
//                 source={{ uri: getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) }} 
//                 style={styles.avatar}
//                 accessibilityLabel="Profile picture"
//               />
//             ) : (
//               <View style={styles.avatarPlaceholder}>
//                 <Ionicons name="person" size={50} color={theme.primary} />
//               </View>
//             )}
//             <View style={styles.avatarBorder} />
//           </View>
          
//           {isEditing && (
//             <TouchableOpacity 
//               style={styles.changePictureBtn} 
//               onPress={handlePickImage}
//               accessibilityLabel="Change profile picture"
//               accessibilityRole="button"
//             >
//               <Ionicons name="camera" size={16} color={theme.white} />
//               <Text style={styles.changePictureBtnText}>Change Picture</Text>
//             </TouchableOpacity>
//           )}

//           {!isEditing && (
//             <Text style={styles.username}>{profile.username}</Text>
//           )}
//         </Animated.View>

//         <Animated.View 
//           style={[
//             styles.profileInfo,
//             {
//               opacity: fadeAnim,
//               transform: [{ translateY: slideAnim }]
//             }
//           ]}
//         >
//           {isEditing ? (
//             <View style={styles.editForm}>
//               <Text style={styles.sectionTitle}>Edit Profile</Text>
              
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <MaterialIcons name="email" size={16} color={theme.primary} /> Email
//                 </Text>
//                 <TextInput
//                   style={styles.input}
//                   value={editForm.email}
//                   onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
//                   placeholder="Enter your email"
//                   keyboardType="email-address"
//                   placeholderTextColor="#aaa"
//                   accessibilityLabel="Email input field"
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="school" size={16} color={theme.primary} /> Course
//                 </Text>
//                 <TextInput
//                   style={styles.input}
//                   value={editForm.course}
//                   onChangeText={(text) => setEditForm(prev => ({ ...prev, course: text }))}
//                   placeholder="Enter your course"
//                   placeholderTextColor="#aaa"
//                   accessibilityLabel="Course input field"
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <MaterialIcons name="date-range" size={16} color={theme.primary} /> Year
//                 </Text>
//                 <TextInput
//                   style={styles.input}
//                   value={editForm.year}
//                   onChangeText={(text) => setEditForm(prev => ({ ...prev, year: text }))}
//                   placeholder="Enter your year"
//                   keyboardType="numeric"
//                   placeholderTextColor="#aaa"
//                   accessibilityLabel="Year input field"
//                 />
//               </View>

//               <View style={styles.editButtonGroup}>
//                 <TouchableOpacity 
//                   style={[styles.button, styles.primaryButton]} 
//                   onPress={handleSaveChanges}
//                   accessibilityLabel="Save profile changes"
//                   accessibilityRole="button"
//                 >
//                   <Ionicons name="checkmark" size={20} color={theme.white} />
//                   <Text style={styles.buttonText}>Save Changes</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity 
//                   style={[styles.button, styles.secondaryButton]} 
//                   onPress={handleCancelEdit}
//                   accessibilityLabel="Cancel editing"
//                   accessibilityRole="button"
//                 >
//                   <Ionicons name="close" size={20} color={theme.primary} />
//                   <Text style={[styles.buttonText, { color: theme.primary }]}>Cancel</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           ) : (
//             <View style={styles.profileDetails}>
//               <Text style={styles.sectionTitle}>Profile Details</Text>
              
//               <View style={styles.detailCard}>
//                 <View style={styles.detailRow}>
//                   <View style={styles.detailIcon}>
//                     <MaterialIcons name="email" size={20} color={theme.primary} />
//                   </View>
//                   <View style={styles.detailContent}>
//                     <Text style={styles.detailLabel}>Email</Text>
//                     <Text style={styles.detailValue}>{profile.email}</Text>
//                   </View>
//                 </View>
//               </View>

//               <View style={styles.detailCard}>
//                 <View style={styles.detailRow}>
//                   <View style={styles.detailIcon}>
//                     <Ionicons name="school" size={20} color={theme.primary} />
//                   </View>
//                   <View style={styles.detailContent}>
//                     <Text style={styles.detailLabel}>Course</Text>
//                     <Text style={styles.detailValue}>{profile.course}</Text>
//                   </View>
//                 </View>
//               </View>

//               <View style={styles.detailCard}>
//                 <View style={styles.detailRow}>
//                   <View style={styles.detailIcon}>
//                     <MaterialIcons name="date-range" size={20} color={theme.primary} />
//                   </View>
//                   <View style={styles.detailContent}>
//                     <Text style={styles.detailLabel}>Year</Text>
//                     <Text style={styles.detailValue}>{profile.year}</Text>
//                   </View>
//                 </View>
//               </View>

//               <View style={styles.actionButtonGroup}>
//                 <TouchableOpacity 
//                   style={[styles.button, styles.primaryButton]} 
//                   onPress={() => setIsEditing(true)}
//                   accessibilityLabel="Edit profile"
//                   accessibilityRole="button"
//                 >
//                   <Feather name="edit" size={20} color={theme.white} />
//                   <Text style={styles.buttonText}>Edit Profile</Text>
//                 </TouchableOpacity>
                
//                 <TouchableOpacity 
//                   style={[styles.button, styles.secondaryButton]} 
//                   onPress={() => router.push('/change-password')}
//                   accessibilityLabel="Change password"
//                   accessibilityRole="button"
//                 >
//                   <Ionicons name="key" size={20} color={theme.primary} />
//                   <Text style={[styles.buttonText, { color: theme.primary }]}>Change Password</Text>
//                 </TouchableOpacity>
                
//                 {/* <TouchableOpacity 
//                   style={[styles.button, styles.outlineButton]} 
//                   onPress={checkAuthStatus}
//                   accessibilityLabel="Check authentication status"
//                   accessibilityRole="button"
//                 >
//                   <MaterialIcons name="verified-user" size={20} color={theme.gray} />
//                   <Text style={[styles.buttonText, { color: theme.gray }]}>Check Auth</Text>
//                 </TouchableOpacity> */}
//               </View>
//             </View>
//           )}
//         </Animated.View>
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.light,
//   },
//   headerGradient: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     height: 200,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingCard: {
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     borderRadius: 20,
//     padding: 30,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.3,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   loadingText: {
//     marginTop: 15,
//     fontSize: 16,
//     color: theme.primary,
//     fontWeight: '600',
//   },
//   errorCard: {
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     borderRadius: 20,
//     padding: 30,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.3,
//     shadowRadius: 20,
//     elevation: 10,
//     maxWidth: width - 40,
//   },
//   errorText: {
//     fontSize: 16,
//     color: theme.danger,
//     textAlign: 'center',
//     marginVertical: 20,
//     fontWeight: '500',
//   },
//   profileHeader: {
//     alignItems: 'center',
//     paddingTop: 80,
//     paddingBottom: 30,
//     paddingHorizontal: 20,
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginBottom: 15,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     borderWidth: 4,
//     borderColor: theme.white,
//   },
//   avatarPlaceholder: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 4,
//     borderColor: theme.white,
//   },
//   avatarBorder: {
//     position: 'absolute',
//     top: -6,
//     left: -6,
//     width: 132,
//     height: 132,
//     borderRadius: 66,
//     borderWidth: 3,
//     borderColor: 'rgba(255, 255, 255, 0.5)',
//   },
//   username: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: theme.white,
//     textAlign: 'center',
//     textShadowColor: 'rgba(0, 0, 0, 0.3)',
//     textShadowOffset: { width: 0, height: 2 },
//     textShadowRadius: 4,
//   },
//   changePictureBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginTop: 10,
//   },
//   changePictureBtnText: {
//     color: theme.white,
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 5,
//   },
//   profileInfo: {
//     flex: 1,
//     backgroundColor: theme.light,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: -20,
//     paddingTop: 30,
//     paddingHorizontal: 20,
//     minHeight: 500,
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: theme.dark,
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   editForm: {
//     flex: 1,
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: theme.dark,
//     marginBottom: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   input: {
//     backgroundColor: theme.white,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: theme.border,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   profileDetails: {
//     flex: 1,
//   },
//   detailCard: {
//     backgroundColor: theme.white,
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   detailIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: `${theme.primary}15`, // 15 is hex for low opacity
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   detailContent: {
//     flex: 1,
//   },
//   detailLabel: {
//     fontSize: 14,
//     color: theme.gray,
//     marginBottom: 4,
//     fontWeight: '500',
//   },
//   detailValue: {
//     fontSize: 16,
//     color: theme.dark,
//     fontWeight: '600',
//   },
//   buttonGroup: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//     marginTop: 20,
//     gap: 10,
//   },
//   editButtonGroup: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 30,
//     gap: 15,
//   },
//   actionButtonGroup: {
//     marginTop: 30,
//     gap: 15,
//   },
//   button: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 12,
//     minWidth: 120,
//   },
//   primaryButton: {
//     backgroundColor: theme.primary,
//     shadowColor: theme.primary,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   secondaryButton: {
//     backgroundColor: theme.white,
//     borderWidth: 2,
//     borderColor: theme.primary,
//   },
//   dangerButton: {
//     backgroundColor: theme.danger,
//     shadowColor: theme.danger,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   outlineButton: {
//     backgroundColor: theme.white,
//     borderWidth: 1,
//     borderColor: '#dee2e6',
//   },
//   buttonText: {
//     color: theme.white,
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
// });

// export default ProfileScreen;








































































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   StyleSheet, 
//   ActivityIndicator, 
//   TextInput, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity,
//   Animated,
//   Dimensions,
//   StatusBar,
//   RefreshControl
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

// const { width } = Dimensions.get('window');

// const ProfileScreen = () => {
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     email: '',
//     course: '',
//     year: '',
//     profile_picture: null
//   });
  
//   // Animation values
//   const fadeAnim = new Animated.Value(0);
//   const scaleAnim = new Animated.Value(0.9);
//   const slideAnim = new Animated.Value(50);
  
//   const router = useRouter();

//   const getAuthToken = async () => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   const getBaseUrl = () => {
//     const Platform = require('react-native').Platform;
//     if (Platform.OS === 'web') {
//       return 'http://localhost:8000';
//     } else if (Platform.OS === 'android') {
//       return 'http://10.0.2.2:8000';
//     } else {
//       return 'http://127.0.0.1:8000';
//     }
//   };

//   const startAnimations = () => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         tension: 50,
//         friction: 7,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const fetchProfile = async (showRefresh = false) => {
//     try {
//       if (showRefresh) {
//         setRefreshing(true);
//       } else {
//         setLoading(true);
//       }
//       setError(null);
      
//       console.log('Fetching profile...');
      
//       const token = await getAuthToken();
//       console.log('Token found:', token ? 'Yes' : 'No');
      
//       if (!token) {
//         setError('No authentication token found. Please log in again.');
//         return;
//       }
      
//       const res = await axios.get(`${getBaseUrl()}/api/profile/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });
      
//       console.log('Profile response:', res.data);
      
//       setProfile(res.data);
//       setEditForm({
//         email: res.data.email || '',
//         course: res.data.course || '',
//         year: String(res.data.year || ''),
//         profile_picture: res.data.profile_picture || null
//       });
      
//       // Start animations after successful fetch
//       startAnimations();
//     } catch (err) {
//       console.error('Profile fetch error:', err);
      
//       if (err.response) {
//         console.log('Error status:', err.response.status);
//         console.log('Error data:', err.response.data);
        
//         if (err.response.status === 401) {
//           setError('Authentication expired. Please log in again.');
//           await AsyncStorage.removeItem('access_token');
//           setTimeout(() => {
//             router.push('/login');
//           }, 2000);
//         } else if (err.response.status === 403) {
//           setError('Access forbidden.');
//         } else {
//           setError(`Server error: ${err.response.status}`);
//         }
//       } else if (err.code === 'ECONNABORTED') {
//         setError('Request timeout. Please check your connection.');
//       } else if (err.request) {
//         setError('Network error. Cannot reach server.');
//       } else {
//         setError('An unexpected error occurred.');
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const getProfileImageSource = (profilePicture) => {
//     if (!profilePicture) return null;
    
//     const pic = profilePicture.trim();
    
//     if (pic.startsWith('data:image')) {
//       return pic;
//     }
    
//     if (pic.startsWith('http')) {
//       return pic;
//     }
    
//     if (pic.includes('/media/')) {
//       const baseUrl = 'http://127.0.0.1:8000';
//       const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
//       return fullUrl;
//     }
    
//     if (typeof pic === 'string' && 
//         !pic.includes('/') && 
//         !pic.includes('.') && 
//         pic.length > 50) {
//       return `data:image/jpeg;base64,${pic}`;
//     }
    
//     return null;
//   };

//   const handlePickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({ 
//       base64: true,
//       quality: 0.8,
//       allowsEditing: true,
//       aspect: [1, 1]
//     });
//     if (!result.canceled && result.assets[0].base64) {
//       const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
//       setEditForm(prev => ({ ...prev, profile_picture: base64Image }));
//     }
//   };

//   const handleSaveChanges = async () => {
//     try {
//       const token = await getAuthToken();
//       if (!token) {
//         Alert.alert('Error', 'Authentication token not found. Please log in again.');
//         return;
//       }

//       const res = await axios.put(`${getBaseUrl()}/api/profile/`, {
//         email: editForm.email,
//         course: editForm.course,
//         year: editForm.year,
//         profile_picture: editForm.profile_picture,
//       }, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         }
//       });

//       setProfile(res.data);
//       setIsEditing(false);
//       Alert.alert('Success', 'Profile updated successfully!', [
//         { text: 'OK', style: 'default' }
//       ]);
//     } catch (err) {
//       console.error('Save error:', err);
//       if (err.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//         await AsyncStorage.removeItem('access_token');
//         router.push('/login');
//       } else {
//         Alert.alert('Error', 'Failed to update profile');
//       }
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditForm({
//       email: profile.email || '',
//       course: profile.course || '',
//       year: String(profile.year || ''),
//       profile_picture: profile.profile_picture || null
//     });
//     setIsEditing(false);
//   };

//   const checkAuthStatus = async () => {
//     try {
//       console.log('Checking auth status...');
//       const token = await getAuthToken();
      
//       if (!token) {
//         Alert.alert('Auth Status', 'No token found');
//         return;
//       }
      
//       const response = await axios.get(`${getBaseUrl()}/api/profile/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         }
//       });
//       console.log('Auth check response:', response.data);
//       Alert.alert('Auth Status', 'You are authenticated ✓');
//     } catch (error) {
//       console.error('Auth check failed:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Auth Status', 'Token expired or invalid ❌');
//         await AsyncStorage.removeItem('access_token');
//       } else {
//         Alert.alert('Auth Status', 'Authentication check failed ❌');
//       }
//     }
//   };

//   const onRefresh = () => {
//     fetchProfile(true);
//   };

//   if (loading && !refreshing) {
//     return (
//       <LinearGradient colors={['#667eea', '#764ba2']} style={styles.centerContainer}>
//         <StatusBar barStyle="light-content" />
//         <View style={styles.loadingCard}>
//           <ActivityIndicator size="large" color="#667eea" />
//           <Text style={styles.loadingText}>Loading your profile...</Text>
//         </View>
//       </LinearGradient>
//     );
//   }

//   if (error) {
//     return (
//       <LinearGradient colors={['#667eea', '#764ba2']} style={styles.centerContainer}>
//         <StatusBar barStyle="light-content" />
//         <View style={styles.errorCard}>
//           <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
//           <Text style={styles.errorText}>{error}</Text>
//           <View style={styles.buttonGroup}>
//             <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={fetchProfile}>
//               <Feather name="refresh-cw" size={20} color="white" />
//               <Text style={styles.buttonText}>Retry</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={checkAuthStatus}>
//               <MaterialIcons name="verified-user" size={20} color="#667eea" />
//               <Text style={[styles.buttonText, { color: '#667eea' }]}>Check Auth</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={() => router.push('/login')}>
//               <Ionicons name="log-in-outline" size={20} color="white" />
//               <Text style={styles.buttonText}>Go to Login</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </LinearGradient>
//     );
//   }

//   if (!profile) {
//     return (
//       <LinearGradient colors={['#667eea', '#764ba2']} style={styles.centerContainer}>
//         <StatusBar barStyle="light-content" />
//         <View style={styles.errorCard}>
//           <Ionicons name="person-outline" size={64} color="#6c757d" />
//           <Text style={styles.errorText}>No profile data found</Text>
//           <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={fetchProfile}>
//             <Feather name="refresh-cw" size={20} color="white" />
//             <Text style={styles.buttonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" />
//       <LinearGradient colors={['#667eea', '#764ba2']} style={styles.headerGradient} />
      
//       <ScrollView 
//         style={styles.scrollView}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#667eea']}
//             tintColor="#667eea"
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         <Animated.View 
//           style={[
//             styles.profileHeader, 
//             { 
//               opacity: fadeAnim,
//               transform: [{ scale: scaleAnim }]
//             }
//           ]}
//         >
//           <View style={styles.avatarContainer}>
//             {getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) ? (
//               <Image 
//                 source={{ uri: getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) }} 
//                 style={styles.avatar} 
//               />
//             ) : (
//               <View style={styles.avatarPlaceholder}>
//                 <Ionicons name="person" size={50} color="#667eea" />
//               </View>
//             )}
//             <View style={styles.avatarBorder} />
//           </View>
          
//           {isEditing && (
//             <TouchableOpacity style={styles.changePictureBtn} onPress={handlePickImage}>
//               <Ionicons name="camera" size={16} color="white" />
//               <Text style={styles.changePictureBtnText}>Change Picture</Text>
//             </TouchableOpacity>
//           )}

//           {!isEditing && (
//             <Text style={styles.username}>{profile.username}</Text>
//           )}
//         </Animated.View>

//         <Animated.View 
//           style={[
//             styles.profileInfo,
//             {
//               opacity: fadeAnim,
//               transform: [{ translateY: slideAnim }]
//             }
//           ]}
//         >
//           {isEditing ? (
//             <View style={styles.editForm}>
//               <Text style={styles.sectionTitle}>Edit Profile</Text>
              
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <MaterialIcons name="email" size={16} color="#667eea" /> Email
//                 </Text>
//                 <TextInput
//                   style={styles.input}
//                   value={editForm.email}
//                   onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
//                   placeholder="Enter your email"
//                   keyboardType="email-address"
//                   placeholderTextColor="#aaa"
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="school" size={16} color="#667eea" /> Course
//                 </Text>
//                 <TextInput
//                   style={styles.input}
//                   value={editForm.course}
//                   onChangeText={(text) => setEditForm(prev => ({ ...prev, course: text }))}
//                   placeholder="Enter your course"
//                   placeholderTextColor="#aaa"
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <MaterialIcons name="date-range" size={16} color="#667eea" /> Year
//                 </Text>
//                 <TextInput
//                   style={styles.input}
//                   value={editForm.year}
//                   onChangeText={(text) => setEditForm(prev => ({ ...prev, year: text }))}
//                   placeholder="Enter your year"
//                   keyboardType="numeric"
//                   placeholderTextColor="#aaa"
//                 />
//               </View>

//               <View style={styles.editButtonGroup}>
//                 <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSaveChanges}>
//                   <Ionicons name="checkmark" size={20} color="white" />
//                   <Text style={styles.buttonText}>Save Changes</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleCancelEdit}>
//                   <Ionicons name="close" size={20} color="#667eea" />
//                   <Text style={[styles.buttonText, { color: '#667eea' }]}>Cancel</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           ) : (
//             <View style={styles.profileDetails}>
//               <Text style={styles.sectionTitle}>Profile Details</Text>
              
//               <View style={styles.detailCard}>
//                 <View style={styles.detailRow}>
//                   <View style={styles.detailIcon}>
//                     <MaterialIcons name="email" size={20} color="#667eea" />
//                   </View>
//                   <View style={styles.detailContent}>
//                     <Text style={styles.detailLabel}>Email</Text>
//                     <Text style={styles.detailValue}>{profile.email}</Text>
//                   </View>
//                 </View>
//               </View>

//               <View style={styles.detailCard}>
//                 <View style={styles.detailRow}>
//                   <View style={styles.detailIcon}>
//                     <Ionicons name="school" size={20} color="#667eea" />
//                   </View>
//                   <View style={styles.detailContent}>
//                     <Text style={styles.detailLabel}>Course</Text>
//                     <Text style={styles.detailValue}>{profile.course}</Text>
//                   </View>
//                 </View>
//               </View>

//               <View style={styles.detailCard}>
//                 <View style={styles.detailRow}>
//                   <View style={styles.detailIcon}>
//                     <MaterialIcons name="date-range" size={20} color="#667eea" />
//                   </View>
//                   <View style={styles.detailContent}>
//                     <Text style={styles.detailLabel}>Year</Text>
//                     <Text style={styles.detailValue}>{profile.year}</Text>
//                   </View>
//                 </View>
//               </View>

//               <View style={styles.actionButtonGroup}>
//                 <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => setIsEditing(true)}>
//                   <Feather name="edit" size={20} color="white" />
//                   <Text style={styles.buttonText}>Edit Profile</Text>
//                 </TouchableOpacity>
                
//                 <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/change-password')}>
//                   <Ionicons name="key" size={20} color="#667eea" />
//                   <Text style={[styles.buttonText, { color: '#667eea' }]}>Change Password</Text>
//                 </TouchableOpacity>
                
//                 <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={checkAuthStatus}>
//                   <MaterialIcons name="verified-user" size={20} color="#6c757d" />
//                   <Text style={[styles.buttonText, { color: '#6c757d' }]}>Check Auth</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           )}
//         </Animated.View>
//       </ScrollView>
//     </View>
//   );
// };

//   const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: '#f8f9fa',
//     },
//     headerGradient: {
//       position: 'absolute',
//       top: 0,
//       left: 0,
//       right: 0,
//       height: 200,
//     },
//     scrollView: {
//       flex: 1,
//     },
//     centerContainer: {
//       flex: 1,
//       justifyContent: 'center',
//       alignItems: 'center',
//       padding: 20,
//     },
//     loadingCard: {
//       backgroundColor: 'rgba(255, 255, 255, 0.95)',
//       borderRadius: 20,
//       padding: 30,
//       alignItems: 'center',
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 10 },
//       shadowOpacity: 0.3,
//       shadowRadius: 20,
//       elevation: 10,
//     },
//     loadingText: {
//       marginTop: 15,
//       fontSize: 16,
//       color: '#667eea',
//       fontWeight: '600',
//     },
//     errorCard: {
//       backgroundColor: 'rgba(255, 255, 255, 0.95)',
//       borderRadius: 20,
//       padding: 30,
//       alignItems: 'center',
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 10 },
//       shadowOpacity: 0.3,
//       shadowRadius: 20,
//       elevation: 10,
//       maxWidth: width - 40,
//     },
//     errorText: {
//       fontSize: 16,
//       color: '#e74c3c',
//       textAlign: 'center',
//       marginVertical: 20,
//       fontWeight: '500',
//     },
//     profileHeader: {
//       alignItems: 'center',
//       paddingTop: 80,
//       paddingBottom: 30,
//       paddingHorizontal: 20,
//     },
//     avatarContainer: {
//       position: 'relative',
//       marginBottom: 15,
//     },
//     avatar: {
//       width: 120,
//       height: 120,
//       borderRadius: 60,
//       borderWidth: 4,
//       borderColor: 'white',
//     },
//     avatarPlaceholder: {
//       width: 120,
//       height: 120,
//       borderRadius: 60,
//       backgroundColor: 'rgba(255, 255, 255, 0.9)',
//       justifyContent: 'center',
//       alignItems: 'center',
//       borderWidth: 4,
//       borderColor: 'white',
//     },
//     avatarBorder: {
//       position: 'absolute',
//       top: -6,
//       left: -6,
//       width: 132,
//       height: 132,
//       borderRadius: 66,
//       borderWidth: 3,
//       borderColor: 'rgba(255, 255, 255, 0.5)',
//     },
//     username: {
//       fontSize: 28,
//       fontWeight: 'bold',
//       color: 'white',
//       textAlign: 'center',
//       textShadowColor: 'rgba(0, 0, 0, 0.3)',
//       textShadowOffset: { width: 0, height: 2 },
//       textShadowRadius: 4,
//     },
//     // changePictureBtn: {
//     //   flexDirection: 'row',
//     //   alignItems: 'center',
//     //   backgroundColor: 'rgba(255
//     // 
    
//     changePictureBtn: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       backgroundColor: 'rgba(255, 255, 255, 0.2)',
//       paddingHorizontal: 15,
//       paddingVertical: 8,
//       borderRadius: 20,
//       marginTop: 10,
//     },
//     changePictureBtnText: {
//       color: 'white',
//       fontSize: 14,
//       fontWeight: '600',
//       marginLeft: 5,
//     },
//     profileInfo: {
//       flex: 1,
//       backgroundColor: '#f8f9fa',
//       borderTopLeftRadius: 30,
//       borderTopRightRadius: 30,
//       marginTop: -20,
//       paddingTop: 30,
//       paddingHorizontal: 20,
//       minHeight: 500,
//     },
//     sectionTitle: {
//       fontSize: 24,
//       fontWeight: 'bold',
//       color: '#2c3e50',
//       marginBottom: 20,
//       textAlign: 'center',
//     },
//     editForm: {
//       flex: 1,
//     },
//     inputGroup: {
//       marginBottom: 20,
//     },
//     label: {
//       fontSize: 16,
//       fontWeight: '600',
//       color: '#2c3e50',
//       marginBottom: 8,
//       flexDirection: 'row',
//       alignItems: 'center',
//     },
//     input: {
//       backgroundColor: 'white',
//       borderRadius: 12,
//       paddingHorizontal: 16,
//       paddingVertical: 14,
//       fontSize: 16,
//       borderWidth: 1,
//       borderColor: '#e9ecef',
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.1,
//       shadowRadius: 4,
//       elevation: 2,
//     },
//     profileDetails: {
//       flex: 1,
//     },
//     detailCard: {
//       backgroundColor: 'white',
//       borderRadius: 16,
//       padding: 20,
//       marginBottom: 15,
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.1,
//       shadowRadius: 8,
//       elevation: 4,
//     },
//     detailRow: {
//       flexDirection: 'row',
//       alignItems: 'center',
//     },
//     detailIcon: {
//       width: 40,
//       height: 40,
//       borderRadius: 20,
//       backgroundColor: 'rgba(102, 126, 234, 0.1)',
//       justifyContent: 'center',
//       alignItems: 'center',
//       marginRight: 15,
//     },
//     detailContent: {
//       flex: 1,
//     },
//     detailLabel: {
//       fontSize: 14,
//       color: '#6c757d',
//       marginBottom: 4,
//       fontWeight: '500',
//     },
//     detailValue: {
//       fontSize: 16,
//       color: '#2c3e50',
//       fontWeight: '600',
//     },
//     buttonGroup: {
//       flexDirection: 'row',
//       flexWrap: 'wrap',
//       justifyContent: 'center',
//       marginTop: 20,
//       gap: 10,
//     },
//     editButtonGroup: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       marginTop: 30,
//       gap: 15,
//     },
//     actionButtonGroup: {
//       marginTop: 30,
//       gap: 15,
//     },
//     button: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       paddingHorizontal: 20,
//       paddingVertical: 12,
//       borderRadius: 12,
//       minWidth: 120,
//     },
//     primaryButton: {
//       backgroundColor: '#667eea',
//       shadowColor: '#667eea',
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.3,
//       shadowRadius: 8,
//       elevation: 6,
//     },
//     secondaryButton: {
//       backgroundColor: 'white',
//       borderWidth: 2,
//       borderColor: '#667eea',
//     },
//     dangerButton: {
//       backgroundColor: '#e74c3c',
//       shadowColor: '#e74c3c',
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.3,
//       shadowRadius: 8,
//       elevation: 6,
//     },
//     outlineButton: {
//       backgroundColor: 'white',
//       borderWidth: 1,
//       borderColor: '#dee2e6',
//     },
//     buttonText: {
//       color: 'white',
//       fontSize: 16,
//       fontWeight: '600',
//       marginLeft: 8,
//     },
//   });

// export default ProfileScreen;

































































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   Button, 
//   StyleSheet, 
//   ActivityIndicator, 
//   TextInput, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity 
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const ProfileScreen = () => {
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     email: '',
//     course: '',
//     year: '',
//     profile_picture: null
//   });
//   const router = useRouter();

//   const getAuthToken = async () => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   const getBaseUrl = () => {
//     const Platform = require('react-native').Platform;
//     if (Platform.OS === 'web') {
//       return 'http://localhost:8000';
//     } else if (Platform.OS === 'android') {
//       return 'http://10.0.2.2:8000';
//     } else {
//       return 'http://127.0.0.1:8000';
//     }
//   };

//   const fetchProfile = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       console.log('Fetching profile...');
      
//       const token = await getAuthToken();
//       console.log('Token found:', token ? 'Yes' : 'No');
      
//       if (!token) {
//         setError('No authentication token found. Please log in again.');
//         return;
//       }
      
//       const res = await axios.get(`${getBaseUrl()}/api/profile/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });
      
//       console.log('Profile response:', res.data);
      
//       setProfile(res.data);
//       setEditForm({
//         email: res.data.email || '',
//         course: res.data.course || '',
//         year: String(res.data.year || ''),
//         profile_picture: res.data.profile_picture || null
//       });
//     } catch (err) {
//       console.error('Profile fetch error:', err);
      
//       if (err.response) {
//         console.log('Error status:', err.response.status);
//         console.log('Error data:', err.response.data);
        
//         if (err.response.status === 401) {
//           setError('Authentication expired. Please log in again.');
//           // Clear the invalid token
//           await AsyncStorage.removeItem('access_token');
//           // Redirect to login
//           setTimeout(() => {
//             router.push('/login');
//           }, 2000);
//         } else if (err.response.status === 403) {
//           setError('Access forbidden.');
//         } else {
//           setError(`Server error: ${err.response.status}`);
//         }
//       } else if (err.code === 'ECONNABORTED') {
//         setError('Request timeout. Please check your connection.');
//       } else if (err.request) {
//         setError('Network error. Cannot reach server.');
//       } else {
//         setError('An unexpected error occurred.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const getProfileImageSource = (profilePicture) => {
//     if (!profilePicture) return null;
    
//     const pic = profilePicture.trim();
    
//     if (pic.startsWith('data:image')) {
//       return pic;
//     }
    
//     if (pic.startsWith('http')) {
//       return pic;
//     }
    
//     if (pic.includes('/media/')) {
//       const baseUrl = 'http://127.0.0.1:8000';
//       const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
//       return fullUrl;
//     }
    
//     if (typeof pic === 'string' && 
//         !pic.includes('/') && 
//         !pic.includes('.') && 
//         pic.length > 50) {
//       return `data:image/jpeg;base64,${pic}`;
//     }
    
//     return null;
//   };

//   const handlePickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
//     if (!result.canceled && result.assets[0].base64) {
//       const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
//       setEditForm(prev => ({ ...prev, profile_picture: base64Image }));
//     }
//   };

//   const handleSaveChanges = async () => {
//     try {
//       const token = await getAuthToken();
//       if (!token) {
//         Alert.alert('Error', 'Authentication token not found. Please log in again.');
//         return;
//       }

//       const res = await axios.put(`${getBaseUrl()}/api/profile/`, {
//         email: editForm.email,
//         course: editForm.course,
//         year: editForm.year,
//         profile_picture: editForm.profile_picture,
//       }, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         }
//       });

//       setProfile(res.data);
//       setIsEditing(false);
//       Alert.alert('Success', 'Profile updated successfully!');
//     } catch (err) {
//       console.error('Save error:', err);
//       if (err.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//         await AsyncStorage.removeItem('access_token');
//         router.push('/login');
//       } else {
//         Alert.alert('Error', 'Failed to update profile');
//       }
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditForm({
//       email: profile.email || '',
//       course: profile.course || '',
//       year: String(profile.year || ''),
//       profile_picture: profile.profile_picture || null
//     });
//     setIsEditing(false);
//   };

//   // Debug function to check authentication status
//   const checkAuthStatus = async () => {
//     try {
//       console.log('Checking auth status...');
//       const token = await getAuthToken();
      
//       if (!token) {
//         Alert.alert('Auth Status', 'No token found');
//         return;
//       }
      
//       const response = await axios.get(`${getBaseUrl()}/api/profile/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         }
//       });
//       console.log('Auth check response:', response.data);
//       Alert.alert('Auth Status', 'You are authenticated');
//     } catch (error) {
//       console.error('Auth check failed:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Auth Status', 'Token expired or invalid');
//         await AsyncStorage.removeItem('access_token');
//       } else {
//         Alert.alert('Auth Status', 'Authentication check failed');
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color="#007bff" />
//         <Text style={styles.loadingText}>Loading profile...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <View style={styles.buttonGroup}>
//           <Button title="Retry" onPress={fetchProfile} />
//           <Button title="Check Auth" onPress={checkAuthStatus} color="#666" />
//           <Button title="Go to Login" onPress={() => router.push('/login')} color="#e74c3c" />
//         </View>
//       </View>
//     );
//   }

//   if (!profile) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>No profile data found</Text>
//         <Button title="Retry" onPress={fetchProfile} />
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.profileHeader}>
//         {getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) && (
//           <Image 
//             source={{ uri: getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) }} 
//             style={styles.avatar} 
//           />
//         )}
        
//         {isEditing && (
//           <TouchableOpacity style={styles.changePictureBtn} onPress={handlePickImage}>
//             <Text style={styles.changePictureBtnText}>Change Picture</Text>
//           </TouchableOpacity>
//         )}

//         {!isEditing && (
//           <Text style={styles.username}>{profile.username}</Text>
//         )}
//       </View>

//       <View style={styles.profileInfo}>
//         {isEditing ? (
//           <View style={styles.editForm}>
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Email:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.email}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
//                 placeholder="Email"
//                 keyboardType="email-address"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Course:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.course}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, course: text }))}
//                 placeholder="Course"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Year:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.year}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, year: text }))}
//                 placeholder="Year"
//                 keyboardType="numeric"
//               />
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Save Changes" onPress={handleSaveChanges} />
//               <Button title="Cancel" onPress={handleCancelEdit} color="#666" />
//             </View>
//           </View>
//         ) : (
//           <View style={styles.profileDetails}>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Email:</Text>
//               <Text style={styles.detailValue}>{profile.email}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Course:</Text>
//               <Text style={styles.detailValue}>{profile.course}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Year:</Text>
//               <Text style={styles.detailValue}>{profile.year}</Text>
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
//               <Button title="Change Password" onPress={() => router.push('/change-password')} />
//               <Button title="Check Auth" onPress={checkAuthStatus} color="#666" />
//             </View>
//           </View>
//         )}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#e74c3c',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   profileHeader: {
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     marginBottom: 15,
//   },
//   username: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   changePictureBtn: {
//     backgroundColor: '#007bff',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 5,
//     marginBottom: 10,
//   },
//   changePictureBtnText: {
//     color: '#fff',
//     fontWeight: '500',
//   },
//   profileInfo: {
//     backgroundColor: '#fff',
//     margin: 10,
//     borderRadius: 10,
//     padding: 20,
//   },
//   profileDetails: {
//     gap: 15,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   detailLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   detailValue: {
//     fontSize: 16,
//     color: '#333',
//   },
//   editForm: {
//     gap: 15,
//   },
//   inputGroup: {
//     gap: 5,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 5,
//     padding: 12,
//     fontSize: 16,
//     backgroundColor: '#f9f9f9',
//   },
//   buttonGroup: {
//     gap: 10,
//     marginTop: 20,
//   },
// });

// export default ProfileScreen;





















































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   Button, 
//   StyleSheet, 
//   ActivityIndicator, 
//   TextInput, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity 
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import { useRouter } from 'expo-router';

// const ProfileScreen = () => {
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     email: '',
//     course: '',
//     year: '',
//     profile_picture: null
//   });
//   const router = useRouter();

//   const fetchProfile = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       console.log('Fetching profile...');
      
//       // For now, let's try with withCredentials and see what happens
//       const res = await axios.get('http://127.0.0.1:8000/api/profile/', { 
//         withCredentials: true,
//         timeout: 10000
//       });
      
//       console.log('Profile response:', res.data);
      
//       setProfile(res.data);
//       setEditForm({
//         email: res.data.email || '',
//         course: res.data.course || '',
//         year: String(res.data.year || ''),
//         profile_picture: res.data.profile_picture || null
//       });
//     } catch (err) {
//       console.error('Profile fetch error:', err);
      
//       if (err.response) {
//         console.log('Error status:', err.response.status);
//         console.log('Error data:', err.response.data);
        
//         if (err.response.status === 401) {
//           setError('Authentication failed. Please check if you are logged in.');
//           // You might want to redirect to login here
//           // router.push('/login');
//         } else if (err.response.status === 403) {
//           setError('Access forbidden.');
//         } else {
//           setError(`Server error: ${err.response.status}`);
//         }
//       } else if (err.code === 'ECONNABORTED') {
//         setError('Request timeout. Please check your connection.');
//       } else if (err.request) {
//         setError('Network error. Cannot reach server.');
//       } else {
//         setError('An unexpected error occurred.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const getProfileImageSource = (profilePicture) => {
//     if (!profilePicture) return null;
    
//     const pic = profilePicture.trim();
    
//     if (pic.startsWith('data:image')) {
//       return pic;
//     }
    
//     if (pic.startsWith('http')) {
//       return pic;
//     }
    
//     if (pic.includes('/media/')) {
//       const baseUrl = 'http://127.0.0.1:8000';
//       const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
//       return fullUrl;
//     }
    
//     if (typeof pic === 'string' && 
//         !pic.includes('/') && 
//         !pic.includes('.') && 
//         pic.length > 50) {
//       return `data:image/jpeg;base64,${pic}`;
//     }
    
//     return null;
//   };

//   const handlePickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
//     if (!result.canceled && result.assets[0].base64) {
//       const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
//       setEditForm(prev => ({ ...prev, profile_picture: base64Image }));
//     }
//   };

//   const handleSaveChanges = async () => {
//     try {
//       const res = await axios.put('http://127.0.0.1:8000/api/profile/', {
//         email: editForm.email,
//         course: editForm.course,
//         year: editForm.year,
//         profile_picture: editForm.profile_picture,
//       }, { withCredentials: true });

//       setProfile(res.data);
//       setIsEditing(false);
//       Alert.alert('Success', 'Profile updated successfully!');
//     } catch (err) {
//       console.error('Save error:', err);
//       Alert.alert('Error', 'Failed to update profile');
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditForm({
//       email: profile.email || '',
//       course: profile.course || '',
//       year: String(profile.year || ''),
//       profile_picture: profile.profile_picture || null
//     });
//     setIsEditing(false);
//   };

//   // Debug function to check authentication status
//   const checkAuthStatus = async () => {
//     try {
//       console.log('Checking auth status...');
//       const response = await axios.get('http://127.0.0.1:8000/api/user-auth/', { 
//         withCredentials: true 
//       });
//       console.log('Auth check response:', response.data);
//       Alert.alert('Auth Status', 'You are authenticated');
//     } catch (error) {
//       console.error('Auth check failed:', error);
//       Alert.alert('Auth Status', 'Not authenticated');
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color="#007bff" />
//         <Text style={styles.loadingText}>Loading profile...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <View style={styles.buttonGroup}>
//           <Button title="Retry" onPress={fetchProfile} />
//           <Button title="Check Auth" onPress={checkAuthStatus} color="#666" />
//           <Button title="Go to Login" onPress={() => router.push('/login')} color="#e74c3c" />
//         </View>
//       </View>
//     );
//   }

//   if (!profile) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>No profile data found</Text>
//         <Button title="Retry" onPress={fetchProfile} />
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.profileHeader}>
//         {getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) && (
//           <Image 
//             source={{ uri: getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) }} 
//             style={styles.avatar} 
//           />
//         )}
        
//         {isEditing && (
//           <TouchableOpacity style={styles.changePictureBtn} onPress={handlePickImage}>
//             <Text style={styles.changePictureBtnText}>Change Picture</Text>
//           </TouchableOpacity>
//         )}

//         {!isEditing && (
//           <Text style={styles.username}>{profile.username}</Text>
//         )}
//       </View>

//       <View style={styles.profileInfo}>
//         {isEditing ? (
//           <View style={styles.editForm}>
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Email:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.email}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
//                 placeholder="Email"
//                 keyboardType="email-address"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Course:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.course}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, course: text }))}
//                 placeholder="Course"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Year:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.year}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, year: text }))}
//                 placeholder="Year"
//                 keyboardType="numeric"
//               />
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Save Changes" onPress={handleSaveChanges} />
//               <Button title="Cancel" onPress={handleCancelEdit} color="#666" />
//             </View>
//           </View>
//         ) : (
//           <View style={styles.profileDetails}>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Email:</Text>
//               <Text style={styles.detailValue}>{profile.email}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Course:</Text>
//               <Text style={styles.detailValue}>{profile.course}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Year:</Text>
//               <Text style={styles.detailValue}>{profile.year}</Text>
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
//               <Button title="Change Password" onPress={() => router.push('/change-password')} />
//               <Button title="Check Auth" onPress={checkAuthStatus} color="#666" />
//             </View>
//           </View>
//         )}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#e74c3c',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   profileHeader: {
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     marginBottom: 15,
//   },
//   username: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   changePictureBtn: {
//     backgroundColor: '#007bff',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 5,
//     marginBottom: 10,
//   },
//   changePictureBtnText: {
//     color: '#fff',
//     fontWeight: '500',
//   },
//   profileInfo: {
//     backgroundColor: '#fff',
//     margin: 10,
//     borderRadius: 10,
//     padding: 20,
//   },
//   profileDetails: {
//     gap: 15,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   detailLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   detailValue: {
//     fontSize: 16,
//     color: '#333',
//   },
//   editForm: {
//     gap: 15,
//   },
//   inputGroup: {
//     gap: 5,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 5,
//     padding: 12,
//     fontSize: 16,
//     backgroundColor: '#f9f9f9',
//   },
//   buttonGroup: {
//     gap: 10,
//     marginTop: 20,
//   },
// });

// export default ProfileScreen;










































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   Button, 
//   StyleSheet, 
//   ActivityIndicator, 
//   TextInput, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity 
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import { useRouter } from 'expo-router';

// const ProfileScreen = () => {
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     email: '',
//     course: '',
//     year: '',
//     profile_picture: null
//   });
//   const router = useRouter();

//   const fetchProfile = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       console.log('Fetching profile...');
      
//       // Get token from storage (you'll need to implement this based on how you store tokens)
//       const token = await getAuthToken(); // You need to implement this function
      
//       const headers = {};
//       if (token) {
//         headers.Authorization = `Token ${token}`; // or `Bearer ${token}` depending on your setup
//       }
      
//       const res = await axios.get('http://127.0.0.1:8000/api/profile/', { 
//         headers,
//         timeout: 10000 // 10 second timeout
//       });
      
//       console.log('Profile response:', res.data);
      
//       setProfile(res.data);
//       // Set form data for editing
//       setEditForm({
//         email: res.data.email || '',
//         course: res.data.course || '',
//         year: String(res.data.year || ''),
//         profile_picture: res.data.profile_picture || null
//       });
//     } catch (err) {
//       console.error('Profile fetch error:', err);
      
//       // More detailed error handling
//       if (err.response) {
//         // Server responded with error status
//         console.log('Error status:', err.response.status);
//         console.log('Error data:', err.response.data);
        
//         if (err.response.status === 401) {
//           setError('Not authenticated. Please log in again.');
//           // Optionally redirect to login
//           // router.push('/login');
//         } else if (err.response.status === 403) {
//           setError('Access forbidden.');
//         } else {
//           setError(`Server error: ${err.response.status}`);
//         }
//       } else if (err.code === 'ECONNABORTED') {
//         setError('Request timeout. Please check your connection.');
//       } else if (err.request) {
//         // Network error
//         setError('Network error. Please check your connection and server.');
//       } else {
//         setError('An unexpected error occurred.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const getProfileImageSource = (profilePicture) => {
//     if (!profilePicture) return null;
    
//     const pic = profilePicture.trim();
    
//     // If it's already a complete data URI
//     if (pic.startsWith('data:image')) {
//       return pic;
//     }
    
//     // If it's a complete URL (starts with http)
//     if (pic.startsWith('http')) {
//       return pic;
//     }
    
//     // If it contains /media/ path, construct full URL
//     if (pic.includes('/media/')) {
//       const baseUrl = 'http://127.0.0.1:8000';
//       const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
//       return fullUrl;
//     }
    
//     // If it looks like a valid base64 string
//     if (typeof pic === 'string' && 
//         !pic.includes('/') && 
//         !pic.includes('.') && 
//         pic.length > 50) {
//       return `data:image/jpeg;base64,${pic}`;
//     }
    
//     return null;
//   };

//   const handlePickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
//     if (!result.canceled && result.assets[0].base64) {
//       const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
//       setEditForm(prev => ({ ...prev, profile_picture: base64Image }));
//     }
//   };

//   const handleSaveChanges = async () => {
//     try {
//       const res = await axios.put('http://127.0.0.1:8000/api/profile/', {
//         email: editForm.email,
//         course: editForm.course,
//         year: editForm.year,
//         profile_picture: editForm.profile_picture,
//       }, { withCredentials: true });

//       setProfile(res.data);
//       setIsEditing(false);
//       Alert.alert('Success', 'Profile updated successfully!');
//     } catch (err) {
//       console.error('Save error:', err);
//       Alert.alert('Error', 'Failed to update profile');
//     }
//   };

//   const handleCancelEdit = () => {
//     // Reset form to original profile data
//     setEditForm({
//       email: profile.email || '',
//       course: profile.course || '',
//       year: String(profile.year || ''),
//       profile_picture: profile.profile_picture || null
//     });
//     setIsEditing(false);
//   };

//   // Show loading spinner
//   if (loading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color="#007bff" />
//         <Text style={styles.loadingText}>Loading profile...</Text>
//       </View>
//     );
//   }

//   // Show error state
//   if (error) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <Button title="Retry" onPress={fetchProfile} />
//       </View>
//     );
//   }

//   // Show message if no profile data
//   if (!profile) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>No profile data found</Text>
//         <Button title="Retry" onPress={fetchProfile} />
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.profileHeader}>
//         {/* Profile Picture */}
//         {getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) && (
//           <Image 
//             source={{ uri: getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) }} 
//             style={styles.avatar} 
//           />
//         )}
        
//         {isEditing && (
//           <TouchableOpacity style={styles.changePictureBtn} onPress={handlePickImage}>
//             <Text style={styles.changePictureBtnText}>Change Picture</Text>
//           </TouchableOpacity>
//         )}

//         {!isEditing && (
//           <Text style={styles.username}>{profile.username}</Text>
//         )}
//       </View>

//       <View style={styles.profileInfo}>
//         {isEditing ? (
//           // Edit Mode
//           <View style={styles.editForm}>
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Email:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.email}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
//                 placeholder="Email"
//                 keyboardType="email-address"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Course:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.course}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, course: text }))}
//                 placeholder="Course"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Year:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.year}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, year: text }))}
//                 placeholder="Year"
//                 keyboardType="numeric"
//               />
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Save Changes" onPress={handleSaveChanges} />
//               <Button title="Cancel" onPress={handleCancelEdit} color="#666" />
//             </View>
//           </View>
//         ) : (
//           // View Mode
//           <View style={styles.profileDetails}>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Email:</Text>
//               <Text style={styles.detailValue}>{profile.email}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Course:</Text>
//               <Text style={styles.detailValue}>{profile.course}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Year:</Text>
//               <Text style={styles.detailValue}>{profile.year}</Text>
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
//               <Button title="Change Password" onPress={() => router.push('/change-password')} />
//             </View>
//           </View>
//         )}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#e74c3c',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   profileHeader: {
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     marginBottom: 15,
//   },
//   username: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   changePictureBtn: {
//     backgroundColor: '#007bff',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 5,
//     marginBottom: 10,
//   },
//   changePictureBtnText: {
//     color: '#fff',
//     fontWeight: '500',
//   },
//   profileInfo: {
//     backgroundColor: '#fff',
//     margin: 10,
//     borderRadius: 10,
//     padding: 20,
//   },
//   profileDetails: {
//     gap: 15,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   detailLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   detailValue: {
//     fontSize: 16,
//     color: '#333',
//   },
//   editForm: {
//     gap: 15,
//   },
//   inputGroup: {
//     gap: 5,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 5,
//     padding: 12,
//     fontSize: 16,
//     backgroundColor: '#f9f9f9',
//   },
//   buttonGroup: {
//     gap: 10,
//     marginTop: 20,
//   },
// });

// export default ProfileScreen;


































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   Button, 
//   StyleSheet, 
//   ActivityIndicator, 
//   TextInput, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity 
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import { useRouter } from 'expo-router';

// const ProfileScreen = () => {
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     email: '',
//     course: '',
//     year: '',
//     profile_picture: null
//   });
//   const router = useRouter();

//   const fetchProfile = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       console.log('Fetching profile...');
      
//       const res = await axios.get('http://127.0.0.1:8000/api/profile/', { 
//         withCredentials: true,
//         timeout: 10000 // 10 second timeout
//       });
      
//       console.log('Profile response:', res.data);
      
//       setProfile(res.data);
//       // Set form data for editing
//       setEditForm({
//         email: res.data.email || '',
//         course: res.data.course || '',
//         year: String(res.data.year || ''),
//         profile_picture: res.data.profile_picture || null
//       });
//     } catch (err) {
//       console.error('Profile fetch error:', err);
      
//       // More detailed error handling
//       if (err.response) {
//         // Server responded with error status
//         console.log('Error status:', err.response.status);
//         console.log('Error data:', err.response.data);
        
//         if (err.response.status === 401) {
//           setError('Not authenticated. Please log in again.');
//           // Optionally redirect to login
//           // router.push('/login');
//         } else if (err.response.status === 403) {
//           setError('Access forbidden.');
//         } else {
//           setError(`Server error: ${err.response.status}`);
//         }
//       } else if (err.code === 'ECONNABORTED') {
//         setError('Request timeout. Please check your connection.');
//       } else if (err.request) {
//         // Network error
//         setError('Network error. Please check your connection and server.');
//       } else {
//         setError('An unexpected error occurred.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const getProfileImageSource = (profilePicture) => {
//     if (!profilePicture) return null;
    
//     const pic = profilePicture.trim();
    
//     // If it's already a complete data URI
//     if (pic.startsWith('data:image')) {
//       return pic;
//     }
    
//     // If it's a complete URL (starts with http)
//     if (pic.startsWith('http')) {
//       return pic;
//     }
    
//     // If it contains /media/ path, construct full URL
//     if (pic.includes('/media/')) {
//       const baseUrl = 'http://127.0.0.1:8000';
//       const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
//       return fullUrl;
//     }
    
//     // If it looks like a valid base64 string
//     if (typeof pic === 'string' && 
//         !pic.includes('/') && 
//         !pic.includes('.') && 
//         pic.length > 50) {
//       return `data:image/jpeg;base64,${pic}`;
//     }
    
//     return null;
//   };

//   const handlePickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
//     if (!result.canceled && result.assets[0].base64) {
//       const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
//       setEditForm(prev => ({ ...prev, profile_picture: base64Image }));
//     }
//   };

//   const handleSaveChanges = async () => {
//     try {
//       const res = await axios.put('http://127.0.0.1:8000/api/profile/', {
//         email: editForm.email,
//         course: editForm.course,
//         year: editForm.year,
//         profile_picture: editForm.profile_picture,
//       }, { withCredentials: true });

//       setProfile(res.data);
//       setIsEditing(false);
//       Alert.alert('Success', 'Profile updated successfully!');
//     } catch (err) {
//       console.error('Save error:', err);
//       Alert.alert('Error', 'Failed to update profile');
//     }
//   };

//   const handleCancelEdit = () => {
//     // Reset form to original profile data
//     setEditForm({
//       email: profile.email || '',
//       course: profile.course || '',
//       year: String(profile.year || ''),
//       profile_picture: profile.profile_picture || null
//     });
//     setIsEditing(false);
//   };

//   // Show loading spinner
//   if (loading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color="#007bff" />
//         <Text style={styles.loadingText}>Loading profile...</Text>
//       </View>
//     );
//   }

//   // Show error state
//   if (error) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <Button title="Retry" onPress={fetchProfile} />
//       </View>
//     );
//   }

//   // Show message if no profile data
//   if (!profile) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>No profile data found</Text>
//         <Button title="Retry" onPress={fetchProfile} />
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.profileHeader}>
//         {/* Profile Picture */}
//         {getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) && (
//           <Image 
//             source={{ uri: getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) }} 
//             style={styles.avatar} 
//           />
//         )}
        
//         {isEditing && (
//           <TouchableOpacity style={styles.changePictureBtn} onPress={handlePickImage}>
//             <Text style={styles.changePictureBtnText}>Change Picture</Text>
//           </TouchableOpacity>
//         )}

//         {!isEditing && (
//           <Text style={styles.username}>{profile.username}</Text>
//         )}
//       </View>

//       <View style={styles.profileInfo}>
//         {isEditing ? (
//           // Edit Mode
//           <View style={styles.editForm}>
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Email:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.email}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
//                 placeholder="Email"
//                 keyboardType="email-address"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Course:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.course}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, course: text }))}
//                 placeholder="Course"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Year:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.year}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, year: text }))}
//                 placeholder="Year"
//                 keyboardType="numeric"
//               />
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Save Changes" onPress={handleSaveChanges} />
//               <Button title="Cancel" onPress={handleCancelEdit} color="#666" />
//             </View>
//           </View>
//         ) : (
//           // View Mode
//           <View style={styles.profileDetails}>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Email:</Text>
//               <Text style={styles.detailValue}>{profile.email}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Course:</Text>
//               <Text style={styles.detailValue}>{profile.course}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Year:</Text>
//               <Text style={styles.detailValue}>{profile.year}</Text>
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
//               <Button title="Change Password" onPress={() => router.push('/change-password')} />
//             </View>
//           </View>
//         )}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#e74c3c',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   profileHeader: {
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     marginBottom: 15,
//   },
//   username: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   changePictureBtn: {
//     backgroundColor: '#007bff',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 5,
//     marginBottom: 10,
//   },
//   changePictureBtnText: {
//     color: '#fff',
//     fontWeight: '500',
//   },
//   profileInfo: {
//     backgroundColor: '#fff',
//     margin: 10,
//     borderRadius: 10,
//     padding: 20,
//   },
//   profileDetails: {
//     gap: 15,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   detailLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   detailValue: {
//     fontSize: 16,
//     color: '#333',
//   },
//   editForm: {
//     gap: 15,
//   },
//   inputGroup: {
//     gap: 5,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 5,
//     padding: 12,
//     fontSize: 16,
//     backgroundColor: '#f9f9f9',
//   },
//   buttonGroup: {
//     gap: 10,
//     marginTop: 20,
//   },
// });

// export default ProfileScreen;














































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   Button, 
//   StyleSheet, 
//   ActivityIndicator, 
//   TextInput, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity 
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import { useRouter } from 'expo-router';

// const ProfileScreen = () => {
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     username: '',
//     email: '',
//     course: '',
//     year: '',
//     profile_picture: null
//   });
//   const router = useRouter();

//   const fetchProfile = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       console.log('Fetching profile...');
      
//       const res = await axios.get('http://127.0.0.1:8000/api/profile/', { 
//         withCredentials: true,
//         timeout: 10000 // 10 second timeout
//       });
      
//       console.log('Profile response:', res.data);
      
//       setProfile(res.data);
//       // Set form data for editing
//       setEditForm({
//         username: res.data.username || '',
//         email: res.data.email || '',
//         course: res.data.course || '',
//         year: String(res.data.year || ''),
//         profile_picture: res.data.profile_picture || null
//       });
//     } catch (err) {
//       console.error('Profile fetch error:', err);
      
//       // More detailed error handling
//       if (err.response) {
//         // Server responded with error status
//         console.log('Error status:', err.response.status);
//         console.log('Error data:', err.response.data);
        
//         if (err.response.status === 401) {
//           setError('Not authenticated. Please log in again.');
//           // Optionally redirect to login
//           // router.push('/login');
//         } else if (err.response.status === 403) {
//           setError('Access forbidden.');
//         } else {
//           setError(`Server error: ${err.response.status}`);
//         }
//       } else if (err.code === 'ECONNABORTED') {
//         setError('Request timeout. Please check your connection.');
//       } else if (err.request) {
//         // Network error
//         setError('Network error. Please check your connection and server.');
//       } else {
//         setError('An unexpected error occurred.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const getProfileImageSource = (profilePicture) => {
//     if (!profilePicture) return null;
    
//     const pic = profilePicture.trim();
    
//     // If it's already a complete data URI
//     if (pic.startsWith('data:image')) {
//       return pic;
//     }
    
//     // If it's a complete URL (starts with http)
//     if (pic.startsWith('http')) {
//       return pic;
//     }
    
//     // If it contains /media/ path, construct full URL
//     if (pic.includes('/media/')) {
//       const baseUrl = 'http://127.0.0.1:8000';
//       const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
//       return fullUrl;
//     }
    
//     // If it looks like a valid base64 string
//     if (typeof pic === 'string' && 
//         !pic.includes('/') && 
//         !pic.includes('.') && 
//         pic.length > 50) {
//       return `data:image/jpeg;base64,${pic}`;
//     }
    
//     return null;
//   };

//   const handlePickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
//     if (!result.canceled && result.assets[0].base64) {
//       const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
//       setEditForm(prev => ({ ...prev, profile_picture: base64Image }));
//     }
//   };

//   const handleSaveChanges = async () => {
//     try {
//       const res = await axios.put('http://127.0.0.1:8000/api/profile/', {
//         email: editForm.email,
//         course: editForm.course,
//         year: editForm.year,
//         profile_picture: editForm.profile_picture,
//       }, { withCredentials: true });

//       setProfile(res.data);
//       setIsEditing(false);
//       Alert.alert('Success', 'Profile updated successfully!');
//     } catch (err) {
//       console.error('Save error:', err);
//       Alert.alert('Error', 'Failed to update profile');
//     }
//   };

//   const handleCancelEdit = () => {
//     // Reset form to original profile data
//     setEditForm({
//       email: profile.email || '',
//       course: profile.course || '',
//       year: String(profile.year || ''),
//       profile_picture: profile.profile_picture || null
//     });
//     setIsEditing(false);
//   };

//   // Show loading spinner
//   if (loading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color="#007bff" />
//         <Text style={styles.loadingText}>Loading profile...</Text>
//       </View>
//     );
//   }

//   // Show error state
//   if (error) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <Button title="Retry" onPress={fetchProfile} />
//       </View>
//     );
//   }

//   // Show message if no profile data
//   if (!profile) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>No profile data found</Text>
//         <Button title="Retry" onPress={fetchProfile} />
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.profileHeader}>
//         {/* Profile Picture */}
//         {getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) && (
//           <Image 
//             source={{ uri: getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) }} 
//             style={styles.avatar} 
//           />
//         )}
        
//         {isEditing && (
//           <TouchableOpacity style={styles.changePictureBtn} onPress={handlePickImage}>
//             <Text style={styles.changePictureBtnText}>Change Picture</Text>
//           </TouchableOpacity>
//         )}

//         {!isEditing && (
//           <Text style={styles.username}>{profile.username}</Text>
//         )}
//       </View>

//       <View style={styles.profileInfo}>
//         {isEditing ? (
//           // Edit Mode
//           <View style={styles.editForm}>
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Email:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.email}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
//                 placeholder="Email"
//                 keyboardType="email-address"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Course:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.course}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, course: text }))}
//                 placeholder="Course"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Year:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.year}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, year: text }))}
//                 placeholder="Year"
//                 keyboardType="numeric"
//               />
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Save Changes" onPress={handleSaveChanges} />
//               <Button title="Cancel" onPress={handleCancelEdit} color="#666" />
//             </View>
//           </View>
//         ) : (
//           // View Mode
//           <View style={styles.profileDetails}>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Email:</Text>
//               <Text style={styles.detailValue}>{profile.email}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Course:</Text>
//               <Text style={styles.detailValue}>{profile.course}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Year:</Text>
//               <Text style={styles.detailValue}>{profile.year}</Text>
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
//               <Button title="Change Password" onPress={() => router.push('/change-password')} />
//             </View>
//           </View>
//         )}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#e74c3c',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   profileHeader: {
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     marginBottom: 15,
//   },
//   username: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   changePictureBtn: {
//     backgroundColor: '#007bff',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 5,
//     marginBottom: 10,
//   },
//   changePictureBtnText: {
//     color: '#fff',
//     fontWeight: '500',
//   },
//   profileInfo: {
//     backgroundColor: '#fff',
//     margin: 10,
//     borderRadius: 10,
//     padding: 20,
//   },
//   profileDetails: {
//     gap: 15,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   detailLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   detailValue: {
//     fontSize: 16,
//     color: '#333',
//   },
//   editForm: {
//     gap: 15,
//   },
//   inputGroup: {
//     gap: 5,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 5,
//     padding: 12,
//     fontSize: 16,
//     backgroundColor: '#f9f9f9',
//   },
//   buttonGroup: {
//     gap: 10,
//     marginTop: 20,
//   },
// });

// export default ProfileScreen;







































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   Button, 
//   StyleSheet, 
//   ActivityIndicator, 
//   TextInput, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity 
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import { useRouter } from 'expo-router';

// const ProfileScreen = () => {
//   const [profile, setProfile] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     email: '',
//     course: '',
//     year: '',
//     profile_picture: null
//   });
//   const router = useRouter();

//   const fetchProfile = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/profile/', { withCredentials: true });
//       setProfile(res.data);
//       // Set form data for editing
//       setEditForm({
//         email: res.data.email || '',
//         course: res.data.course || '',
//         year: String(res.data.year || ''),
//         profile_picture: res.data.profile_picture || null
//       });
//     } catch (err) {
//       console.error(err);
//     }
//     setLoading(false);
//   };

//   const getProfileImageSource = (profilePicture) => {
//     if (!profilePicture) return null;
    
//     const pic = profilePicture.trim();
    
//     // If it's already a complete data URI
//     if (pic.startsWith('data:image')) {
//       return pic;
//     }
    
//     // If it's a complete URL (starts with http)
//     if (pic.startsWith('http')) {
//       return pic;
//     }
    
//     // If it contains /media/ path, construct full URL
//     if (pic.includes('/media/')) {
//       const baseUrl = 'http://127.0.0.1:8000'; // Your Django backend URL
//       const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
//       return fullUrl;
//     }
    
//     // If it looks like a valid base64 string
//     if (typeof pic === 'string' && 
//         !pic.includes('/') && 
//         !pic.includes('.') && 
//         pic.length > 50) {
//       return `data:image/jpeg;base64,${pic}`;
//     }
    
//     return null;
//   };

//   const handlePickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
//     if (!result.canceled && result.assets[0].base64) {
//       const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
//       setEditForm(prev => ({ ...prev, profile_picture: base64Image }));
//     }
//   };

//   const handleSaveChanges = async () => {
//     try {
//       const res = await axios.put('http://127.0.0.1:8000/api/profile/', {
//         email: editForm.email,
//         course: editForm.course,
//         year: editForm.year,
//         profile_picture: editForm.profile_picture,
//       }, { withCredentials: true });

//       setProfile(res.data);
//       setIsEditing(false);
//       Alert.alert('Success', 'Profile updated successfully!');
//     } catch (err) {
//       console.error(err);
//       Alert.alert('Error', 'Failed to update profile');
//     }
//   };

//   const handleCancelEdit = () => {
//     // Reset form to original profile data
//     setEditForm({
//       email: profile.email || '',
//       course: profile.course || '',
//       year: String(profile.year || ''),
//       profile_picture: profile.profile_picture || null
//     });
//     setIsEditing(false);
//   };

//   if (loading || !profile) return <ActivityIndicator size="large" style={styles.loader} />;

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.profileHeader}>
//         {/* Profile Picture */}
//         {getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) && (
//           <Image 
//             source={{ uri: getProfileImageSource(isEditing ? editForm.profile_picture : profile.profile_picture) }} 
//             style={styles.avatar} 
//           />
//         )}
        
//         {isEditing && (
//           <TouchableOpacity style={styles.changePictureBtn} onPress={handlePickImage}>
//             <Text style={styles.changePictureBtnText}>Change Picture</Text>
//           </TouchableOpacity>
//         )}

//         {!isEditing && (
//           <Text style={styles.username}>{profile.username}</Text>
//         )}
//       </View>

//       <View style={styles.profileInfo}>
//         {isEditing ? (
//           // Edit Mode
//           <View style={styles.editForm}>
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Email:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.email}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
//                 placeholder="Email"
//                 keyboardType="email-address"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Course:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.course}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, course: text }))}
//                 placeholder="Course"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Year:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.year}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, year: text }))}
//                 placeholder="Year"
//                 keyboardType="numeric"
//               />
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Save Changes" onPress={handleSaveChanges} />
//               <Button title="Cancel" onPress={handleCancelEdit} color="#666" />
//             </View>
//           </View>
//         ) : (
//           // View Mode
//           <View style={styles.profileDetails}>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Email:</Text>
//               <Text style={styles.detailValue}>{profile.email}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Course:</Text>
//               <Text style={styles.detailValue}>{profile.course}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Year:</Text>
//               <Text style={styles.detailValue}>{profile.year}</Text>
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
//               <Button title="Change Password" onPress={() => router.push('/change-password')} />
//             </View>
//           </View>
//         )}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   loader: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   profileHeader: {
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     marginBottom: 15,
//   },
//   username: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   changePictureBtn: {
//     backgroundColor: '#007bff',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 5,
//     marginBottom: 10,
//   },
//   changePictureBtnText: {
//     color: '#fff',
//     fontWeight: '500',
//   },
//   profileInfo: {
//     backgroundColor: '#fff',
//     margin: 10,
//     borderRadius: 10,
//     padding: 20,
//   },
//   profileDetails: {
//     gap: 15,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   detailLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   detailValue: {
//     fontSize: 16,
//     color: '#333',
//   },
//   editForm: {
//     gap: 15,
//   },
//   inputGroup: {
//     gap: 5,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 5,
//     padding: 12,
//     fontSize: 16,
//     backgroundColor: '#f9f9f9',
//   },
//   buttonGroup: {
//     gap: 10,
//     marginTop: 20,
//   },
// });

// export default ProfileScreen;















































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   Button, 
//   StyleSheet, 
//   ActivityIndicator, 
//   TextInput, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity 
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import { useRouter } from 'expo-router';

// const ProfileScreen = () => {
//   const [profile, setProfile] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     email: '',
//     course: '',
//     year: '',
//     profile_picture: null
//   });
//   const router = useRouter();

//   const fetchProfile = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/profile/', { withCredentials: true });
//       setProfile(res.data);
//       // Set form data for editing
//       setEditForm({
//         email: res.data.email || '',
//         course: res.data.course || '',
//         year: String(res.data.year || ''),
//         profile_picture: res.data.profile_picture || null
//       });
//     } catch (err) {
//       console.error(err);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const handlePickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
//     if (!result.canceled && result.assets[0].base64) {
//       const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
//       setEditForm(prev => ({ ...prev, profile_picture: base64Image }));
//     }
//   };

//   const handleSaveChanges = async () => {
//     try {
//       const res = await axios.put('http://127.0.0.1:8000/api/profile/', {
//         email: editForm.email,
//         course: editForm.course,
//         year: editForm.year,
//         profile_picture: editForm.profile_picture,
//       }, { withCredentials: true });

//       setProfile(res.data);
//       setIsEditing(false);
//       Alert.alert('Success', 'Profile updated successfully!');
//     } catch (err) {
//       console.error(err);
//       Alert.alert('Error', 'Failed to update profile');
//     }
//   };

//   const handleCancelEdit = () => {
//     // Reset form to original profile data
//     setEditForm({
//       email: profile.email || '',
//       course: profile.course || '',
//       year: String(profile.year || ''),
//       profile_picture: profile.profile_picture || null
//     });
//     setIsEditing(false);
//   };

//   if (loading || !profile) return <ActivityIndicator size="large" style={styles.loader} />;

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.profileHeader}>
//         {/* Profile Picture */}
//         {(isEditing ? editForm.profile_picture : profile.profile_picture) && (
//           <Image 
//             source={{ uri: isEditing ? editForm.profile_picture : profile.profile_picture }} 
//             style={styles.avatar} 
//           />
//         )}
        
//         {isEditing && (
//           <TouchableOpacity style={styles.changePictureBtn} onPress={handlePickImage}>
//             <Text style={styles.changePictureBtnText}>Change Picture</Text>
//           </TouchableOpacity>
//         )}

//         {!isEditing && (
//           <Text style={styles.username}>{profile.username}</Text>
//         )}
//       </View>

//       <View style={styles.profileInfo}>
//         {isEditing ? (
//           // Edit Mode
//           <View style={styles.editForm}>
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Email:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.email}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
//                 placeholder="Email"
//                 keyboardType="email-address"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Course:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.course}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, course: text }))}
//                 placeholder="Course"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Year:</Text>
//               <TextInput
//                 style={styles.input}
//                 value={editForm.year}
//                 onChangeText={(text) => setEditForm(prev => ({ ...prev, year: text }))}
//                 placeholder="Year"
//                 keyboardType="numeric"
//               />
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Save Changes" onPress={handleSaveChanges} />
//               <Button title="Cancel" onPress={handleCancelEdit} color="#666" />
//             </View>
//           </View>
//         ) : (
//           // View Mode
//           <View style={styles.profileDetails}>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Email:</Text>
//               <Text style={styles.detailValue}>{profile.email}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Course:</Text>
//               <Text style={styles.detailValue}>{profile.course}</Text>
//             </View>

//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Year:</Text>
//               <Text style={styles.detailValue}>{profile.year}</Text>
//             </View>

//             <View style={styles.buttonGroup}>
//               <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
//               <Button title="Change Password" onPress={() => router.push('/change-password')} />
//             </View>
//           </View>
//         )}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   loader: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   profileHeader: {
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//     marginBottom: 10,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     marginBottom: 15,
//   },
//   username: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   changePictureBtn: {
//     backgroundColor: '#007bff',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 5,
//     marginBottom: 10,
//   },
//   changePictureBtnText: {
//     color: '#fff',
//     fontWeight: '500',
//   },
//   profileInfo: {
//     backgroundColor: '#fff',
//     margin: 10,
//     borderRadius: 10,
//     padding: 20,
//   },
//   profileDetails: {
//     gap: 15,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   detailLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   detailValue: {
//     fontSize: 16,
//     color: '#333',
//   },
//   editForm: {
//     gap: 15,
//   },
//   inputGroup: {
//     gap: 5,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#555',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 5,
//     padding: 12,
//     fontSize: 16,
//     backgroundColor: '#f9f9f9',
//   },
//   buttonGroup: {
//     gap: 10,
//     marginTop: 20,
//   },
// });

// export default ProfileScreen;






































// import React, { useEffect, useState } from 'react';
// import { View, Text, Image, Button, StyleSheet, ActivityIndicator } from 'react-native';
// import axios from 'axios';
// import { useRouter } from 'expo-router';

// const ProfileScreen = () => {
//   const [profile, setProfile] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   const fetchProfile = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/profile/', { withCredentials: true });
//       setProfile(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

// //   if (loading) return <ActivityIndicator size="large" />;
//   if (loading || !profile) return <ActivityIndicator size="large" />;

//   return (
//     <View style={styles.container}>
//       {/* <Image source={{ uri: profile.profile_picture }} style={styles.avatar} /> */}
//       {profile?.profile_picture && (
//         <Image source={{ uri: profile.profile_picture }} style={styles.avatar} />
//       )}
//       <Text>Username: {profile.username}</Text>
//       <Text>Email: {profile.email}</Text>
//       <Text>Course: {profile.course}</Text>
//       <Text>Year: {profile.year}</Text>
//       <Button title="Edit Profile" onPress={() => router.push('/edit-profile')} />
//       <Button title="Change Password" onPress={() => router.push('/change-password')} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { padding: 20, alignItems: 'center' },
//   avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
// });

// export default ProfileScreen;
