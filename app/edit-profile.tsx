

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ConnectionAPI from './api/connectionService'; // Adjust path as needed


const { width } = Dimensions.get('window');

// Modern theme
const theme = {
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  secondary: '#06B6D4',
  accent: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#059669',
  
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
  
  gradientStart: '#4F46E5',
  gradientEnd: '#7C3AED',
};

const EditProfileScreen = () => {
  const [formData, setFormData] = useState({
    email: '',
    course: '',
    year: '',
    profile_picture: null,
  });
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const router = useRouter();

  const startAnimations = () => {
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
    ]).start();
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrors({});

      // Get current user data using ConnectionAPI
      const userData = await ConnectionAPI.getCurrentUser(true); // Force refresh
      
      const profileData = {
        email: userData.email || '',
        course: userData.course || '',
        year: userData.year ? String(userData.year) : '',
        profile_picture: userData.profile_picture || null,
      };

      setFormData(profileData);
      setOriginalData(profileData);
      setHasChanges(false);
      
      startAnimations();
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrors({ general: error.message || 'Failed to load profile data' });
      
      if (error.message.includes('log in')) {
        setTimeout(() => router.push('/login'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    requestPermissions();
  }, []);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, originalData]);

  const requestPermissions = async () => {
    try {
      // Request camera permissions
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus.status !== 'granted' || mediaLibraryStatus.status !== 'granted') {
        console.warn('Camera and media library permissions are required for profile pictures');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Course validation
    if (!formData.course.trim()) {
      newErrors.course = 'Course is required';
    } else if (formData.course.trim().length < 2) {
      newErrors.course = 'Course must be at least 2 characters long';
    }

    // Year validation
    if (!formData.year.trim()) {
      newErrors.year = 'Year is required';
    } else {
      const yearNum = parseInt(formData.year);
      if (isNaN(yearNum) || yearNum < 1 || yearNum > 8) {
        newErrors.year = 'Please enter a valid year (1-8)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Profile Picture',
      'Choose how you want to add your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => handleImagePicker('camera') },
        { text: 'Gallery', onPress: () => handleImagePicker('library') },
      ],
      { cancelable: true }
    );
  };

  const handleImagePicker = async (source) => {
    try {
      setImageLoading(true);
      let result;

      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      };

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        updateFormData('profile_picture', base64Image);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      // Prepare data for API
      const updateData = {
        email: formData.email.trim(),
        course: formData.course.trim(),
        year: parseInt(formData.year),
        profile_picture: formData.profile_picture,
      };

      // Use ConnectionAPI to update profile
      const updatedProfile = await ConnectionAPI.updateProfile(updateData);
      
      // Update local state
      setOriginalData(formData);
      setHasChanges(false);
      
      Alert.alert(
        'Success!',
        'Your profile has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Optionally navigate back or refresh data
              router.back();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error saving profile:', error);
      
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.response?.status === 400) {
        // Handle validation errors from backend
        const backendErrors = error.response.data;
        if (typeof backendErrors === 'object') {
          setErrors(backendErrors);
          errorMessage = 'Please check the form for errors.';
        }
      } else if (error.message.includes('log in')) {
        errorMessage = 'Session expired. Please log in again.';
        setTimeout(() => router.push('/login'), 2000);
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!hasChanges) return;

    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setFormData(originalData);
            setHasChanges(false);
            setErrors({});
          }
        }
      ]
    );
  };

  const getProfileImageSource = () => {
    if (!formData.profile_picture) return null;
    
    const pic = formData.profile_picture.trim();
    
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

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.loadingContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContent}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingTitle}>Loading Profile</Text>
                <Text style={styles.loadingSubtitle}>Please wait while we fetch your data...</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (errors.general) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.errorContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.errorContent}>
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
                <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                <Text style={styles.errorText}>{errors.general}</Text>
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
      <View style={styles.header}>
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.headerGradient}>
          <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => {
                  if (hasChanges) {
                    handleDiscard();
                  } else {
                    router.back();
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color={theme.white} />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>Edit Profile</Text>
              
              {hasChanges && (
                <TouchableOpacity 
                  style={styles.discardButton}
                  onPress={handleDiscard}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={20} color={theme.white} />
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Picture Section */}
        <Animated.View 
          style={[
            styles.avatarSection,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.avatarContainer}>
            {getProfileImageSource() ? (
              <Image 
                source={{ uri: getProfileImageSource() }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={theme.primary} />
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={showImagePickerOptions}
              disabled={imageLoading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[theme.primary, theme.primaryLight]} style={styles.cameraGradient}>
                {imageLoading ? (
                  <ActivityIndicator size={16} color={theme.white} />
                ) : (
                  <Ionicons name="camera" size={16} color={theme.white} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap to change profile picture</Text>
        </Animated.View>

        {/* Form Section */}
        <Animated.View 
          style={[
            styles.formSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Profile Information</Text>
            
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <MaterialIcons name="email" size={20} color={theme.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  placeholderTextColor={theme.gray400}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Course Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Course *</Text>
              <View style={[styles.inputContainer, errors.course && styles.inputError]}>
                <Ionicons name="school" size={20} color={theme.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.course}
                  onChangeText={(text) => updateFormData('course', text)}
                  placeholder="Enter your course"
                  placeholderTextColor={theme.gray400}
                  autoCapitalize="words"
                />
              </View>
              {errors.course && <Text style={styles.errorText}>{errors.course}</Text>}
            </View>

            {/* Year Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Year of Study *</Text>
              <View style={[styles.inputContainer, errors.year && styles.inputError]}>
                <MaterialIcons name="date-range" size={20} color={theme.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.year}
                  onChangeText={(text) => updateFormData('year', text)}
                  placeholder="Enter your year (1-8)"
                  keyboardType="numeric"
                  placeholderTextColor={theme.gray400}
                  maxLength={1}
                />
              </View>
              {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
            </View>

            <Text style={styles.requiredHint}>* Required fields</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                (!hasChanges || saving) && styles.buttonDisabled
              ]} 
              onPress={handleSave}
              disabled={!hasChanges || saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color={theme.white} />
              ) : (
                <Ionicons name="checkmark" size={20} color={theme.white} />
              )}
              <Text style={styles.primaryButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
            
            {hasChanges && (
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={handleDiscard}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color={theme.primary} />
                <Text style={styles.secondaryButtonText}>Discard Changes</Text>
              </TouchableOpacity>
            )}
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
  discardButton: {
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
  
  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: -40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
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
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 14,
    color: theme.gray500,
    fontWeight: '500',
  },
  
  // Form Section
  formSection: {
    paddingHorizontal: 20,
    gap: 24,
  },
  formCard: {
    backgroundColor: theme.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.gray900,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.gray700,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.gray200,
    paddingHorizontal: 16,
    height: 52,
  },
  inputError: {
    borderColor: theme.danger,
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.gray900,
    fontWeight: '400',
  },
  errorText: {
    fontSize: 12,
    color: theme.danger,
    fontWeight: '500',
    marginTop: 4,
  },
  requiredHint: {
    fontSize: 12,
    color: theme.gray400,
    fontStyle: 'italic',
    marginTop: 8,
  },
  
  // Action Buttons
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
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
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.gray900,
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default EditProfileScreen;













































// import React, { useState, useEffect } from 'react';
// import { View, TextInput, Button, Alert, Image, StyleSheet } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';

// const EditProfileScreen = () => {
//   const [email, setEmail] = useState('');
//   const [course, setCourse] = useState('');
//   const [year, setYear] = useState('');
//   const [profilePic, setProfilePic] = useState<string | null>(null);
//   const [error, setError] = useState(null)



//   const getAuthToken = async () => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };



//   const fetchProfile = async () => {
//     // const res = await axios.get('http://127.0.0.1:8000/api/profile/', { withCredentials: true });

//     const token = await getAuthToken();
//       console.log('Token found:', token ? 'Yes' : 'No');
      
//       if (!token) {
//         setError('No authentication token found. Please log in again.');
//         return;
//       }
      
//       const res = await axios.get('http://127.0.0.1:8000/api/profile/', {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });
      

//     const { email, course, year, profile_picture } = res.data;
//     setEmail(email);
//     setCourse(course);
//     setYear(String(year));
//     setProfilePic(profile_picture);
//   };

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const handlePickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
//     if (!result.canceled && result.assets[0].base64) {
//       const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
//       setProfilePic(base64Image);
//     }
//   };

//   const handleSave = async () => {
//     try {
//       await axios.put('http://127.0.0.1:8000/api/profile/', {
//         email,
//         course,
//         year,
//         profile_picture: profilePic,
//       }, { withCredentials: true });

//       Alert.alert('Profile updated!');
//     } catch (err) {
//       console.error(err);
//       Alert.alert('Update failed');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {profilePic && <Image source={{ uri: profilePic }} style={styles.avatar} />}
//       <Button title="Change Picture" onPress={handlePickImage} />
//       <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
//       <TextInput value={course} onChangeText={setCourse} placeholder="Course" />
//       <TextInput value={year} onChangeText={setYear} placeholder="Year" keyboardType="numeric" />
//       <Button title="Save Changes" onPress={handleSave} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { padding: 20 },
//   avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
// });

// export default EditProfileScreen;
