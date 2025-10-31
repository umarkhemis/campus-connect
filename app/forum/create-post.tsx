
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import {
  Ionicons,
  MaterialIcons,
  Feather,
} from '@expo/vector-icons';
import ConnectionAPI from '../api/connectionService'

const { width, height } = Dimensions.get('window');

// Constants for better maintainability
const CONSTANTS = {
  MAX_TITLE_LENGTH: 200,
  MAX_CONTENT_LENGTH: 5000,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  IMAGE_QUALITY: 0.8,
  CATEGORIES: [
    { label: 'Select Category', value: '' },
    { label: 'Academics', value: 'Academics' },
    { label: 'General', value: 'General' },
  ],
};

const CreatePost = ({ navigation, onPostCreated }) => {
  // State management
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    image: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const router = useRouter();

  // Validation functions
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > CONSTANTS.MAX_TITLE_LENGTH) {
      newErrors.title = `Title must be less than ${CONSTANTS.MAX_TITLE_LENGTH} characters`;
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length > CONSTANTS.MAX_CONTENT_LENGTH) {
      newErrors.content = `Content must be less than ${CONSTANTS.MAX_CONTENT_LENGTH} characters`;
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Image handling functions
  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Please grant camera roll permissions to upload images',
        });
        return false;
      }
      return true;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Permission Error',
        text2: 'Failed to request permissions',
      });
      return false;
    }
  }, []);

    //   const convertToBase64 = useCallback(async (uri) => {
    //     try {
    //       const base64 = await FileSystem.readAsStringAsync(uri, {
    //         encoding: FileSystem.EncodingType.Base64,
    //       });
    //       return `data:image/jpeg;base64,${base64}`;
    //     } catch (error) {
    //       throw new Error('Failed to convert image to base64');
    //     }
    //   }, []);





    const convertToBase64 = useCallback(async (uri) => {
        try {
            if (Platform.OS === 'web') {
            // Handle web-specific base64 conversion
            const response = await fetch(uri);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            } else {
            // Expo/React Native specific
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            return `data:image/jpeg;base64,${base64}`;
            }
        } catch (error) {
            throw new Error('Failed to convert image to base64');
        }
    }, []);







  const validateImageSize = useCallback(async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.size > CONSTANTS.MAX_IMAGE_SIZE) {
        throw new Error('Image size must be less than 5MB');
      }
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const pickImage = useCallback(async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      setImageLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: CONSTANTS.IMAGE_QUALITY,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        await validateImageSize(imageUri);
        const base64Image = await convertToBase64(imageUri);
        
        setFormData(prev => ({ ...prev, image: base64Image }));
        
        Toast.show({
          type: 'success',
          text1: 'Image Selected',
          text2: 'Image uploaded successfully',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Image Upload Failed',
        text2: error.message || 'Failed to upload image',
      });
    } finally {
      setImageLoading(false);
    }
  }, [requestPermissions, validateImageSize, convertToBase64]);

  const removeImage = useCallback(() => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFormData(prev => ({ ...prev, image: null }));
            Toast.show({
              type: 'info',
              text1: 'Image Removed',
              text2: 'Image has been removed from the post',
            });
          },
        },
      ]
    );
  }, []);

  // Form handlers
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const handleCancel = useCallback(() => {
    if (formData.title || formData.content || formData.image) {
      Alert.alert(
        'Discard Post',
        'Are you sure you want to discard this post? All changes will be lost.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
    //   navigation.goBack();
        router.push('/auth/forum')
    }
  }, [formData, navigation]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors before submitting',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Prepare form data for API
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        image: formData.image,
      };

      const response = await ConnectionAPI.createPost(postData);     
        // Simulate API call
        //   await new Promise(resolve => setTimeout(resolve, 2000));
      Toast.show({
        type: 'success',
        text1: 'Post Created',
        text2: 'Your post has been published successfully',
      });

      // Reset form
      setFormData({ title: '', content: '', category: '', image: null });
      setErrors({});
      
      // Callback for parent component
      onPostCreated?.();
      
      // Navigate back
      router.push('/auth/forum');
    //   navigation.goBack();
      
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Create Post',
        text2: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, onPostCreated, navigation]);

  // Memoized computed values
  const isFormValid = useMemo(() => {
    return formData.title.trim() && 
           formData.content.trim() && 
           formData.category &&
           Object.keys(errors).length === 0;
  }, [formData, errors]);

  const titleCharCount = useMemo(() => formData.title.length, [formData.title]);
  const contentCharCount = useMemo(() => formData.content.length, [formData.content]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create Post</Text>
        
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid || loading) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Title *</Text>
            <Text style={[
              styles.charCount,
              titleCharCount > CONSTANTS.MAX_TITLE_LENGTH && styles.charCountError
            ]}>
              {titleCharCount}/{CONSTANTS.MAX_TITLE_LENGTH}
            </Text>
          </View>
          <TextInput
            style={[styles.titleInput, errors.title && styles.inputError]}
            placeholder="What's on your mind?"
            placeholderTextColor="#999"
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            maxLength={CONSTANTS.MAX_TITLE_LENGTH}
            multiline={false}
          />
          {errors.title && (
            <Text style={styles.errorText}>{errors.title}</Text>
          )}
        </View>

        {/* Category Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Category *</Text>
          <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
            <MaterialIcons name="category" size={20} color="#666" style={styles.pickerIcon} />
            <Picker
              selectedValue={formData.category}
              style={styles.picker}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              {CONSTANTS.CATEGORIES.map((category) => (
                <Picker.Item
                  key={category.value}
                  label={category.label}
                  value={category.value}
                  color={category.value === '' ? '#999' : '#333'}
                />
              ))}
            </Picker>
          </View>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>

        {/* Content Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Content *</Text>
            <Text style={[
              styles.charCount,
              contentCharCount > CONSTANTS.MAX_CONTENT_LENGTH && styles.charCountError
            ]}>
              {contentCharCount}/{CONSTANTS.MAX_CONTENT_LENGTH}
            </Text>
          </View>
          <TextInput
            style={[styles.contentInput, errors.content && styles.inputError]}
            placeholder="Share your thoughts..."
            placeholderTextColor="#999"
            value={formData.content}
            onChangeText={(value) => handleInputChange('content', value)}
            maxLength={CONSTANTS.MAX_CONTENT_LENGTH}
            multiline={true}
            textAlignVertical="top"
          />
          {errors.content && (
            <Text style={styles.errorText}>{errors.content}</Text>
          )}
        </View>

        {/* Image Section */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Image (Optional)</Text>
          
          {formData.image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: formData.image }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
              disabled={imageLoading}
              activeOpacity={0.7}
            >
              {imageLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <>
                  <Feather name="image" size={24} color="#007AFF" />
                  <Text style={styles.imagePickerText}>Add Image</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        paddingTop: 50,
      },
      android: {
        paddingTop: 16,
      },
    }),
  },
  cancelButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginTop: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
  },
  charCountError: {
    color: '#ff4444',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    minHeight: 50,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    minHeight: 120,
    maxHeight: 200,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    paddingLeft: 12,
  },
  pickerIcon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  imageContainer: {
    position: 'relative',
    marginTop: 8,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    backgroundColor: '#f8f9ff',
    marginTop: 8,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default CreatePost;