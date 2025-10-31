

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Linking,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import ConnectionAPI from '../api/connectionService'; // Update this import path

const { width } = Dimensions.get('window');

export default function CreateMarketplaceItemScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Others');
  const [condition, setCondition] = useState('Used');
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePickerLoading, setImagePickerLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Category and Condition options
  const categoryOptions = ['Books', 'Electronics', 'Clothing', 'Others'];
  const conditionOptions = ['New', 'Used'];

  React.useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'Title is required';
        } else if (value.trim().length < 3) {
          newErrors.title = 'Title must be at least 3 characters';
        } else if (value.trim().length > 100) {
          newErrors.title = 'Title must be less than 100 characters';
        } else {
          delete newErrors.title;
        }
        break;
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.trim().length < 10) {
          newErrors.description = 'Description must be at least 10 characters';
        } else {
          delete newErrors.description;
        }
        break;
      case 'price':
        if (!value.trim()) {
          newErrors.price = 'Price is required';
        } else if (isNaN(Number(value))) {
          newErrors.price = 'Price must be a valid number';
        } else if (Number(value) <= 0) {
          newErrors.price = 'Price must be greater than 0';
        } else if (Number(value) > 99999999.99) {
          newErrors.price = 'Price is too large';
        } else {
          delete newErrors.price;
        }
        break;
      case 'category':
        if (!categoryOptions.includes(value)) {
          newErrors.category = 'Please select a valid category';
        } else {
          delete newErrors.category;
        }
        break;
      case 'condition':
        if (!conditionOptions.includes(value)) {
          newErrors.condition = 'Please select a valid condition';
        } else {
          delete newErrors.condition;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const pickImage = async () => {
    try {
      setImagePickerLoading(true);
      
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to upload images.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setImageBase64(result.assets[0].base64);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setImagePickerLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setImagePickerLoading(true);
      
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant permission to access your camera to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setImageBase64(result.assets[0].base64);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setImagePickerLoading(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you would like to add an image to your listing',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
      ]
    );
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setImageBase64(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
  };

  const showCategoryOptions = () => {
    console.log('showCategoryOptions called');
    console.log('Current category:', category);
    setShowCategoryPicker(true);
  };

  const showConditionOptions = () => {
    console.log('showConditionOptions called');
    console.log('Current condition:', condition);
    setShowConditionPicker(true);
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});
    
    // Validate all fields
    const titleError = !title.trim() ? 'Title is required' : 
                      title.trim().length < 3 ? 'Title must be at least 3 characters' : null;
    const descError = !description.trim() ? 'Description is required' : 
                     description.trim().length < 10 ? 'Description must be at least 10 characters' : null;
    const priceError = !price.trim() ? 'Price is required' : 
                      isNaN(Number(price)) ? 'Price must be a valid number' :
                      Number(price) <= 0 ? 'Price must be greater than 0' : null;
    const categoryError = !categoryOptions.includes(category) ? 'Invalid category' : null;
    const conditionError = !conditionOptions.includes(condition) ? 'Invalid condition' : null;

    const newErrors = {};
    if (titleError) newErrors.title = titleError;
    if (descError) newErrors.description = descError;
    if (priceError) newErrors.price = priceError;
    if (categoryError) newErrors.category = categoryError;
    if (conditionError) newErrors.condition = conditionError;

    setErrors(newErrors);

    // Check if there are any validation errors
    const hasErrors = Object.keys(newErrors).length > 0;

    if (hasErrors) {
      Alert.alert('Validation Error', 'Please fix all errors before submitting.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Alert.alert(
      'Confirm Posting',
      'Are you sure you want to post this item for sale?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Post Item', onPress: performSubmit }
      ]
    );
  };

  const performSubmit = async () => {
    setLoading(true);
    Keyboard.dismiss();

    try {
      // Check authentication before proceeding
      const isAuthenticated = await ConnectionAPI.isAuthenticated();
      if (!isAuthenticated) {
        Alert.alert(
          'Authentication Required', 
          'Please log in to post items.',
          [
            { text: 'OK', onPress: () => router.push('/login') }
          ]
        );
        return;
      }

      // Prepare item data with proper validation
      const itemData = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price).toFixed(2), // Ensure proper decimal format
        category: category,
        condition: condition,
        // Handle image properly - send base64 with data URL prefix
        image: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null,
      };

      // Log data being sent (without full image data)
      console.log('Submitting item data:', {
        ...itemData,
        image: itemData.image ? 'data:image/jpeg;base64,[base64_data]' : null
      });

      // Validate data before sending
      if (!itemData.title || itemData.title.length < 3) {
        throw new Error('Title must be at least 3 characters');
      }
      if (!itemData.description || itemData.description.length < 10) {
        throw new Error('Description must be at least 10 characters');
      }
      if (isNaN(itemData.price) || parseFloat(itemData.price) <= 0) {
        throw new Error('Price must be a valid number greater than 0');
      }
      if (!categoryOptions.includes(itemData.category)) {
        throw new Error('Invalid category selected');
      }
      if (!conditionOptions.includes(itemData.condition)) {
        throw new Error('Invalid condition selected');
      }

      // Use ConnectionAPI to create marketplace item
      const response = await ConnectionAPI.createMarketplaceItem(itemData);

      console.log('API Response:', response);

      // Success handling
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Success!',
        'Your item has been posted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Upload failed:', error);
      console.error('Error details:', error.response?.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to post item. Please try again.';
      
      if (error.response?.data) {
        // Handle field-specific validation errors from Django
        const errorData = error.response.data;
        console.log('Full error data:', errorData);
        
        if (typeof errorData === 'object') {
          const errorMessages = [];
          Object.keys(errorData).forEach(field => {
            if (Array.isArray(errorData[field])) {
              errorMessages.push(`${field}: ${errorData[field].join(', ')}`);
            } else if (typeof errorData[field] === 'string') {
              errorMessages.push(`${field}: ${errorData[field]}`);
            } else {
              errorMessages.push(`${field}: ${JSON.stringify(errorData[field])}`);
            }
          });
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('\n');
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (text) => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      const formatted = parts[0] + '.' + parts.slice(1).join('');
      setPrice(formatted);
      validateField('price', formatted);
    } else {
      setPrice(cleaned);
      validateField('price', cleaned);
    }
  };

  // Custom Category Modal
  const CategoryModal = () => (
    <Modal
      visible={showCategoryPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCategoryPicker(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Category</Text>
          {categoryOptions.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.modalOption, category === cat && styles.selectedOption]}
              onPress={() => {
                setCategory(cat);
                validateField('category', cat);
                setShowCategoryPicker(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.modalOptionText, category === cat && styles.selectedOptionText]}>
                {cat}
              </Text>
              {category === cat && <Ionicons name="checkmark" size={20} color="#007AFF" />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowCategoryPicker(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Custom Condition Modal
  const ConditionModal = () => (
    <Modal
      visible={showConditionPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowConditionPicker(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowConditionPicker(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Condition</Text>
          {conditionOptions.map((cond, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.modalOption, condition === cond && styles.selectedOption]}
              onPress={() => {
                setCondition(cond);
                validateField('condition', cond);
                setShowConditionPicker(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.modalOptionText, condition === cond && styles.selectedOptionText]}>
                {cond}
              </Text>
              {condition === cond && <Ionicons name="checkmark" size={20} color="#007AFF" />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowConditionPicker(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <LinearGradient
              colors={['#007AFF', '#5856d6']}
              style={styles.header}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back('/market-place/market-place-feeds')}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Ionicons name="storefront-outline" size={32} color="white" />
              <Text style={styles.headerTitle}>Add New Listing</Text>
              <Text style={styles.headerSubtitle}>Fill in the details below</Text>
            </LinearGradient>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Ionicons name="text-outline" size={16} color="#007AFF" /> Title *
                </Text>
                <TextInput
                  placeholder="Enter item title"
                  style={[styles.input, errors.title && styles.inputError]}
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    validateField('title', text);
                  }}
                  maxLength={100}
                  placeholderTextColor="#999"
                />
                {errors.title && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ff4757" />
                    <Text style={styles.errorText}>{errors.title}</Text>
                  </View>
                )}
                <Text style={styles.characterCount}>{title.length}/100</Text>
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Ionicons name="document-text-outline" size={16} color="#007AFF" /> Description *
                </Text>
                <TextInput
                  placeholder="Describe your item in detail"
                  style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                  value={description}
                  onChangeText={(text) => {
                    setDescription(text);
                    validateField('description', text);
                  }}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
                {errors.description && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ff4757" />
                    <Text style={styles.errorText}>{errors.description}</Text>
                  </View>
                )}
                <Text style={styles.characterCount}>{description.length}/500</Text>
              </View>

              {/* Category Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Ionicons name="grid-outline" size={16} color="#007AFF" /> Category *
                </Text>
                <TouchableOpacity
                  style={[styles.pickerButton, errors.category && styles.inputError]}
                  onPress={showCategoryOptions}
                >
                  <Text style={styles.pickerButtonText}>{category}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {errors.category && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ff4757" />
                    <Text style={styles.errorText}>{errors.category}</Text>
                  </View>
                )}
              </View>

              {/* Condition Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#007AFF" /> Condition *
                </Text>
                <TouchableOpacity
                  style={[styles.pickerButton, errors.condition && styles.inputError]}
                  onPress={showConditionOptions}
                >
                  <Text style={styles.pickerButtonText}>{condition}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {errors.condition && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ff4757" />
                    <Text style={styles.errorText}>{errors.condition}</Text>
                  </View>
                )}
              </View>

              {/* Price Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Ionicons name="pricetag-outline" size={16} color="#007AFF" /> Price (UGX) *
                </Text>
                <View style={[styles.priceInputContainer, errors.price && styles.inputError]}>
                  <Text style={styles.currencySymbol}>UGX</Text>
                  <TextInput
                    placeholder="0"
                    style={styles.priceInput}
                    value={price}
                    onChangeText={formatPrice}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
                {errors.price && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ff4757" />
                    <Text style={styles.errorText}>{errors.price}</Text>
                  </View>
                )}
              </View>

              {/* Image Section */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Ionicons name="camera-outline" size={16} color="#007AFF" /> Product Image
                </Text>
                
                {!imageBase64 ? (
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={showImagePicker}
                    disabled={imagePickerLoading}
                  >
                    {imagePickerLoading ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
                        <Text style={styles.imagePickerText}>Add Photo</Text>
                        <Text style={styles.imagePickerSubtext}>Tap to select from gallery or take a photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: `data:image/jpeg;base64,${imageBase64}` }} 
                      style={styles.imagePreview} 
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={removeImage}
                    >
                      <Ionicons name="close-circle" size={24} color="#ff4757" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#ccc', '#999'] : ['#28a745', '#20c997']}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                      <Text style={styles.submitButtonText}>ADD ITEM</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Help Text */}
              <View style={styles.helpContainer}>
                <Ionicons name="information-circle-outline" size={16} color="#666" />
                <Text style={styles.helpText}>
                  Make sure to provide accurate information and clear photos to attract buyers.
                </Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Custom Modals */}
      <CategoryModal />
      <ConditionModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 60 : 30,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  formContainer: {
    padding: 20,
    marginTop: -15,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4757',
    backgroundColor: '#fff5f5',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 14,
    marginLeft: 5,
  },
  characterCount: {
    textAlign: 'right',
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    paddingLeft: 15,
    paddingRight: 5,
  },
  priceInput: {
    flex: 1,
    padding: 15,
    paddingLeft: 5,
    fontSize: 16,
    color: '#333',
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 10,
  },
  imagePickerSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: width / 2 - 108,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f7ff',
    borderRadius: 10,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalCancelButton: {
    marginTop: 10,
    padding: 15,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
});




















































// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   SafeAreaView,
//   StatusBar,
//   Animated,
//   Keyboard,
//   KeyboardAvoidingView,
//   Platform,
//   Dimensions,
//   Linking
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import * as Haptics from 'expo-haptics';
// import { useRouter } from 'expo-router';
// import ConnectionAPI from '../api/connectionService'; // Update this import path

// const { width } = Dimensions.get('window');

// export default function CreateMarketplaceItemScreen() {
//   const router = useRouter();
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [price, setPrice] = useState('');
//   const [category, setCategory] = useState('Others'); // Added missing category field
//   const [condition, setCondition] = useState('Used'); // Added missing condition field
//   const [imageBase64, setImageBase64] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [imagePickerLoading, setImagePickerLoading] = useState(false);
//   const [showCategoryPicker, setShowCategoryPicker] = useState(false);
//   const [showConditionPicker, setShowConditionPicker] = useState(false);

//   // Animation references
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(50)).current;

//   // Category and Condition options
//   const categoryOptions = ['Books', 'Electronics', 'Clothing', 'Others'];
//   const conditionOptions = ['New', 'Used'];

//   React.useEffect(() => {
//     // Entrance animation
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

//   const validateField = (field, value) => {
//     const newErrors = { ...errors };
    
//     switch (field) {
//       case 'title':
//         if (!value.trim()) {
//           newErrors.title = 'Title is required';
//         } else if (value.trim().length < 3) {
//           newErrors.title = 'Title must be at least 3 characters';
//         } else if (value.trim().length > 100) {
//           newErrors.title = 'Title must be less than 100 characters';
//         } else {
//           delete newErrors.title;
//         }
//         break;
//       case 'description':
//         if (!value.trim()) {
//           newErrors.description = 'Description is required';
//         } else if (value.trim().length < 10) {
//           newErrors.description = 'Description must be at least 10 characters';
//         } else {
//           delete newErrors.description;
//         }
//         break;
//       case 'price':
//         if (!value.trim()) {
//           newErrors.price = 'Price is required';
//         } else if (isNaN(Number(value))) {
//           newErrors.price = 'Price must be a valid number';
//         } else if (Number(value) <= 0) {
//           newErrors.price = 'Price must be greater than 0';
//         } else if (Number(value) > 99999999.99) {
//           newErrors.price = 'Price is too large';
//         } else {
//           delete newErrors.price;
//         }
//         break;
//       case 'category':
//         if (!categoryOptions.includes(value)) {
//           newErrors.category = 'Please select a valid category';
//         } else {
//           delete newErrors.category;
//         }
//         break;
//       case 'condition':
//         if (!conditionOptions.includes(value)) {
//           newErrors.condition = 'Please select a valid condition';
//         } else {
//           delete newErrors.condition;
//         }
//         break;
//     }
    
//     setErrors(newErrors);
//   };

//   const pickImage = async () => {
//     try {
//       setImagePickerLoading(true);
      
//       const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           'Permission Required',
//           'Please grant permission to access your photo library to upload images.',
//           [
//             { text: 'Cancel', style: 'cancel' },
//             { text: 'Open Settings', onPress: () => Linking.openSettings() }
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.6, // Reduced quality to prevent large file sizes
//         base64: true,
//       });

//       if (!result.canceled && result.assets && result.assets[0].base64) {
//         // Create base64 string without data URL prefix for backend processing
//         setImageBase64(result.assets[0].base64);
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick image. Please try again.');
//     } finally {
//       setImagePickerLoading(false);
//     }
//   };

//   const takePhoto = async () => {
//     try {
//       setImagePickerLoading(true);
      
//       const permission = await ImagePicker.requestCameraPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           'Camera Permission Required',
//           'Please grant permission to access your camera to take photos.',
//           [
//             { text: 'Cancel', style: 'cancel' },
//             { text: 'Open Settings', onPress: () => Linking.openSettings() }
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchCameraAsync({
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.6, // Reduced quality to prevent large file sizes
//         base64: true,
//       });

//       if (!result.canceled && result.assets && result.assets[0].base64) {
//         // Create base64 string without data URL prefix for backend processing
//         setImageBase64(result.assets[0].base64);
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (error) {
//       console.error('Error taking photo:', error);
//       Alert.alert('Error', 'Failed to take photo. Please try again.');
//     } finally {
//       setImagePickerLoading(false);
//     }
//   };

//   const showImagePicker = () => {
//     Alert.alert(
//       'Select Image',
//       'Choose how you would like to add an image to your listing',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Take Photo', onPress: takePhoto },
//         { text: 'Choose from Library', onPress: pickImage },
//       ]
//     );
//   };

//   const removeImage = () => {
//     Alert.alert(
//       'Remove Image',
//       'Are you sure you want to remove this image?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Remove', 
//           style: 'destructive',
//           onPress: () => {
//             setImageBase64(null);
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//           }
//         }
//       ]
//     );
//   };

//   const showCategoryOptions = () => {
//     const options = categoryOptions.map(cat => ({
//       text: cat,
//       onPress: () => {
//         setCategory(cat);
//         validateField('category', cat);
//       }
//     }));
//     options.push({ text: 'Cancel', style: 'cancel' });
    
//     Alert.alert('Select Category', 'Choose a category for your item', options);
//   };

//   const showConditionOptions = () => {
//     const options = conditionOptions.map(cond => ({
//       text: cond,
//       onPress: () => {
//         setCondition(cond);
//         validateField('condition', cond);
//       }
//     }));
//     options.push({ text: 'Cancel', style: 'cancel' });
    
//     Alert.alert('Select Condition', 'Choose the condition of your item', options);
//   };

//   // const handleSubmit = async () => {
//   //   // Validate all fields
//   //   validateField('title', title);
//   //   validateField('description', description);
//   //   validateField('price', price);
//   //   validateField('category', category);
//   //   validateField('condition', condition);

//   //   // Check if there are any validation errors
//   //   const hasErrors = Object.keys(errors).length > 0 || 
//   //                    !title.trim() || 
//   //                    !description.trim() || 
//   //                    !price.trim();

//   //   if (hasErrors) {
//   //     Alert.alert('Validation Error', 'Please fix all errors before submitting.');
//   //     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//   //     return;
//   //   }

//   //   Alert.alert(
//   //     'Confirm Posting',
//   //     'Are you sure you want to post this item for sale?',
//   //     [
//   //       { text: 'Cancel', style: 'cancel' },
//   //       { text: 'Post Item', onPress: performSubmit }
//   //     ]
//   //   );
//   // };




//   const handleSubmit = async () => {
    
//     setErrors({});
    
//     // Validate all fields
//     const titleError = !title.trim() ? 'Title is required' : 
//                       title.trim().length < 3 ? 'Title must be at least 3 characters' : null;
//     const descError = !description.trim() ? 'Description is required' : 
//                     description.trim().length < 10 ? 'Description must be at least 10 characters' : null;
//     const priceError = !price.trim() ? 'Price is required' : 
//                       isNaN(Number(price)) ? 'Price must be a valid number' :
//                       Number(price) <= 0 ? 'Price must be greater than 0' : null;
//     const categoryError = !['Books', 'Electronics', 'Clothing', 'Others'].includes(category) ? 'Invalid category' : null;
//     const conditionError = !['New', 'Used'].includes(condition) ? 'Invalid condition' : null;

//     const newErrors = {};
//     if (titleError) newErrors.title = titleError;
//     if (descError) newErrors.description = descError;
//     if (priceError) newErrors.price = priceError;
//     if (categoryError) newErrors.category = categoryError;
//     if (conditionError) newErrors.condition = conditionError;

//     setErrors(newErrors);

//     // Check if there are any validation errors
//     const hasErrors = Object.keys(newErrors).length > 0;

//     if (hasErrors) {
//       Alert.alert('Validation Error', 'Please fix all errors before submitting.');
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       return;
//     }

//     Alert.alert(
//       'Confirm Posting',
//       'Are you sure you want to post this item for sale?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Post Item', onPress: performSubmit }
//       ]
//     );
//   };








//   // const performSubmit = async () => {
//   //   setLoading(true);
//   //   Keyboard.dismiss();

//   //   try {
//   //     // Check authentication before proceeding
//   //     const isAuthenticated = await ConnectionAPI.isAuthenticated();
//   //     if (!isAuthenticated) {
//   //       Alert.alert(
//   //         'Authentication Required', 
//   //         'Please log in to post items.',
//   //         [
//   //           { text: 'OK', onPress: () => router.push('/login') }
//   //         ]
//   //       );
//   //       return;
//   //     }

//   //     // Prepare item data matching your Django model fields
//   //     const itemData = {
//   //       title: title.trim(),
//   //       description: description.trim(),
//   //       price: parseFloat(price), // Ensure it's a number
//   //       category: category,
//   //       condition: condition,
//   //       image: imageBase64 || null, // Send base64 string or null
//   //     };

//   //     console.log('Submitting item data:', {
//   //       ...itemData,
//   //       image: itemData.image ? 'base64_image_data' : null // Don't log full base64
//   //     });

//   //     // Use ConnectionAPI to create marketplace item
//   //     const response = await ConnectionAPI.createMarketplaceItem(itemData);

//   //     // Success handling
//   //     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//   //     Alert.alert(
//   //       'Success!',
//   //       'Your item has been posted successfully.',
//   //       [
//   //         {
//   //           text: 'OK',
//   //           onPress: () => {
//   //             router.back();
//   //           }
//   //         }
//   //       ]
//   //     );

//   //   } catch (error) {
//   //     console.error('Upload failed:', error);
//   //     console.error('Error details:', error.response?.data); // Log detailed error response
//   //     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
//   //     // Enhanced error handling
//   //     let errorMessage = 'Failed to post item. Please try again.';
      
//   //     if (error.response?.data) {
//   //       // Handle field-specific validation errors from Django
//   //       const errorData = error.response.data;
//   //       if (typeof errorData === 'object') {
//   //         const errorMessages = [];
//   //         Object.keys(errorData).forEach(field => {
//   //           if (Array.isArray(errorData[field])) {
//   //             errorMessages.push(`${field}: ${errorData[field].join(', ')}`);
//   //           } else {
//   //             errorMessages.push(`${field}: ${errorData[field]}`);
//   //           }
//   //         });
//   //         if (errorMessages.length > 0) {
//   //           errorMessage = errorMessages.join('\n');
//   //         }
//   //       }
//   //     } else if (error.message) {
//   //       if (error.message.includes('Authentication') || error.message.includes('login')) {
//   //         errorMessage = 'Authentication failed. Please log in again.';
//   //       } else if (error.message.includes('too large') || error.message.includes('413')) {
//   //         errorMessage = 'Image is too large. Please choose a smaller image.';
//   //       } else if (error.message.includes('Network') || error.message.includes('connection')) {
//   //         errorMessage = 'Network connection failed. Please check your internet connection.';
//   //       } else {
//   //         errorMessage = error.message;
//   //       }
//   //     }
      
//   //     Alert.alert('Error', errorMessage);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };



//   const performSubmit = async () => {
//     setLoading(true);
//     Keyboard.dismiss();

//     try {
//       // Check authentication before proceeding
//       const isAuthenticated = await ConnectionAPI.isAuthenticated();
//       if (!isAuthenticated) {
//         Alert.alert(
//           'Authentication Required', 
//           'Please log in to post items.',
//           [
//             { text: 'OK', onPress: () => router.push('/login') }
//           ]
//         );
//         return;
//       }

//       // Prepare item data with proper validation
//       const itemData = {
//         title: title.trim(),
//         description: description.trim(),
//         price: parseFloat(price).toFixed(2), // Ensure proper decimal format
//         category: category,
//         condition: condition,
//         // Handle image properly - send base64 with data URL prefix if needed
//         image: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null,
//       };

//       // Log data being sent (without full image data)
//       console.log('Submitting item data:', {
//         ...itemData,
//         image: itemData.image ? 'data:image/jpeg;base64,[base64_data]' : null
//       });

//       // Validate data before sending
//       if (!itemData.title || itemData.title.length < 3) {
//         throw new Error('Title must be at least 3 characters');
//       }
//       if (!itemData.description || itemData.description.length < 10) {
//         throw new Error('Description must be at least 10 characters');
//       }
//       if (isNaN(itemData.price) || parseFloat(itemData.price) <= 0) {
//         throw new Error('Price must be a valid number greater than 0');
//       }
//       if (!['Books', 'Electronics', 'Clothing', 'Others'].includes(itemData.category)) {
//         throw new Error('Invalid category selected');
//       }
//       if (!['New', 'Used'].includes(itemData.condition)) {
//         throw new Error('Invalid condition selected');
//       }

//       // Use ConnectionAPI to create marketplace item
//       const response = await ConnectionAPI.createMarketplaceItem(itemData);

//       console.log('API Response:', response);

//       // Success handling
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       Alert.alert(
//         'Success!',
//         'Your item has been posted successfully.',
//         [
//           {
//             text: 'OK',
//             onPress: () => {
//               router.back();
//             }
//           }
//         ]
//       );

//     } catch (error) {
//       console.error('Upload failed:', error);
//       console.error('Error details:', error.response?.data);
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
//       // Enhanced error handling
//       let errorMessage = 'Failed to post item. Please try again.';
      
//       if (error.response?.data) {
//         // Handle field-specific validation errors from Django
//         const errorData = error.response.data;
//         console.log('Full error data:', errorData);
        
//         if (typeof errorData === 'object') {
//           const errorMessages = [];
//           Object.keys(errorData).forEach(field => {
//             if (Array.isArray(errorData[field])) {
//               errorMessages.push(`${field}: ${errorData[field].join(', ')}`);
//             } else if (typeof errorData[field] === 'string') {
//               errorMessages.push(`${field}: ${errorData[field]}`);
//             } else {
//               errorMessages.push(`${field}: ${JSON.stringify(errorData[field])}`);
//             }
//           });
//           if (errorMessages.length > 0) {
//             errorMessage = errorMessages.join('\n');
//           }
//         } else if (typeof errorData === 'string') {
//           errorMessage = errorData;
//         }
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
      
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };











//   const formatPrice = (text) => {
//     // Remove non-numeric characters except decimal point
//     const cleaned = text.replace(/[^0-9.]/g, '');
    
//     // Prevent multiple decimal points
//     const parts = cleaned.split('.');
//     if (parts.length > 2) {
//       const formatted = parts[0] + '.' + parts.slice(1).join('');
//       setPrice(formatted);
//       validateField('price', formatted);
//     } else {
//       setPrice(cleaned);
//       validateField('price', cleaned);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardView}
//       >
//         <Animated.View
//           style={[
//             styles.animatedContainer,
//             {
//               opacity: fadeAnim,
//               transform: [{ translateY: slideAnim }],
//             },
//           ]}
//         >
//           <ScrollView
//             style={styles.scrollView}
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             {/* Header */}
//             <LinearGradient
//               colors={['#007AFF', '#5856d6']}
//               style={styles.header}
//             >
//               <TouchableOpacity
//                 style={styles.backButton}
//                 onPress={() => router.back('/market-place/market-place-feeds')}
//               >
//                 <Ionicons name="arrow-back" size={24} color="white" />
//               </TouchableOpacity>
//               <Ionicons name="storefront-outline" size={32} color="white" />
//               <Text style={styles.headerTitle}>Add New Listing</Text>
//               <Text style={styles.headerSubtitle}>Fill in the details below</Text>
//             </LinearGradient>

//             {/* Form Container */}
//             <View style={styles.formContainer}>
//               {/* Title Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="text-outline" size={16} color="#007AFF" /> Title *
//                 </Text>
//                 <TextInput
//                   placeholder="Enter item title"
//                   style={[styles.input, errors.title && styles.inputError]}
//                   value={title}
//                   onChangeText={(text) => {
//                     setTitle(text);
//                     validateField('title', text);
//                   }}
//                   maxLength={100}
//                   placeholderTextColor="#999"
//                 />
//                 {errors.title && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.title}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{title.length}/100</Text>
//               </View>

//               {/* Description Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="document-text-outline" size={16} color="#007AFF" /> Description *
//                 </Text>
//                 <TextInput
//                   placeholder="Describe your item in detail"
//                   style={[styles.input, styles.textArea, errors.description && styles.inputError]}
//                   value={description}
//                   onChangeText={(text) => {
//                     setDescription(text);
//                     validateField('description', text);
//                   }}
//                   multiline
//                   numberOfLines={4}
//                   maxLength={500}
//                   textAlignVertical="top"
//                   placeholderTextColor="#999"
//                 />
//                 {errors.description && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.description}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{description.length}/500</Text>
//               </View>

//               {/* Category Selector */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="grid-outline" size={16} color="#007AFF" /> Category *
//                 </Text>
//                 <TouchableOpacity
//                   style={[styles.pickerButton, errors.category && styles.inputError]}
//                   onPress={showCategoryOptions}
//                 >
//                   <Text style={styles.pickerButtonText}>{category}</Text>
//                   <Ionicons name="chevron-down" size={20} color="#666" />
//                 </TouchableOpacity>
//                 {errors.category && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.category}</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Condition Selector */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="checkmark-circle-outline" size={16} color="#007AFF" /> Condition *
//                 </Text>
//                 <TouchableOpacity
//                   style={[styles.pickerButton, errors.condition && styles.inputError]}
//                   onPress={showConditionOptions}
//                 >
//                   <Text style={styles.pickerButtonText}>{condition}</Text>
//                   <Ionicons name="chevron-down" size={20} color="#666" />
//                 </TouchableOpacity>
//                 {errors.condition && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.condition}</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Price Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="pricetag-outline" size={16} color="#007AFF" /> Price (UGX) *
//                 </Text>
//                 <View style={[styles.priceInputContainer, errors.price && styles.inputError]}>
//                   <Text style={styles.currencySymbol}>UGX</Text>
//                   <TextInput
//                     placeholder="0"
//                     style={styles.priceInput}
//                     value={price}
//                     onChangeText={formatPrice}
//                     keyboardType="numeric"
//                     placeholderTextColor="#999"
//                   />
//                 </View>
//                 {errors.price && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.price}</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Image Section */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="camera-outline" size={16} color="#007AFF" /> Product Image
//                 </Text>
                
//                 {!imageBase64 ? (
//                   <TouchableOpacity
//                     style={styles.imagePickerButton}
//                     onPress={showImagePicker}
//                     disabled={imagePickerLoading}
//                   >
//                     {imagePickerLoading ? (
//                       <ActivityIndicator size="small" color="#007AFF" />
//                     ) : (
//                       <>
//                         <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
//                         <Text style={styles.imagePickerText}>Add Photo</Text>
//                         <Text style={styles.imagePickerSubtext}>Tap to select from gallery or take a photo</Text>
//                       </>
//                     )}
//                   </TouchableOpacity>
//                 ) : (
//                   <View style={styles.imagePreviewContainer}>
//                     <Image 
//                       source={{ uri: `data:image/jpeg;base64,${imageBase64}` }} 
//                       style={styles.imagePreview} 
//                     />
//                     <TouchableOpacity
//                       style={styles.removeImageButton}
//                       onPress={removeImage}
//                     >
//                       <Ionicons name="close-circle" size={24} color="#ff4757" />
//                     </TouchableOpacity>
//                   </View>
//                 )}
//               </View>

//               {/* Submit Button */}
//               <TouchableOpacity
//                 style={[styles.submitButton, loading && styles.submitButtonDisabled]}
//                 onPress={handleSubmit}
//                 disabled={loading}
//               >
//                 <LinearGradient
//                   colors={loading ? ['#ccc', '#999'] : ['#28a745', '#20c997']}
//                   style={styles.submitGradient}
//                 >
//                   {loading ? (
//                     <ActivityIndicator size="small" color="white" />
//                   ) : (
//                     <>
//                       <Ionicons name="checkmark-circle-outline" size={20} color="white" />
//                       <Text style={styles.submitButtonText}>ADD ITEM</Text>
//                     </>
//                   )}
//                 </LinearGradient>
//               </TouchableOpacity>

//               {/* Help Text */}
//               <View style={styles.helpContainer}>
//                 <Ionicons name="information-circle-outline" size={16} color="#666" />
//                 <Text style={styles.helpText}>
//                   Make sure to provide accurate information and clear photos to attract buyers.
//                 </Text>
//               </View>
//             </View>
//           </ScrollView>
//         </Animated.View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   keyboardView: {
//     flex: 1,
//   },
//   animatedContainer: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 32,
//   },
//   backButton: {
//     position: 'absolute',
//     top: 40,
//     left: 24,
//     padding: 8,
//     zIndex: 1,
//   },

//   // Header
//   header: {
//     paddingTop: 40,
//     paddingBottom: 32,
//     paddingHorizontal: 24,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//     marginTop: 12,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginTop: 4,
//   },

//   // Form
//   formContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     marginTop: -24,
//     paddingTop: 32,
//     paddingHorizontal: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   inputGroup: {
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   input: {
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     padding: 16,
//     fontSize: 16,
//     backgroundColor: '#fafbfc',
//     color: '#2c3e50',
//   },
//   inputError: {
//     borderColor: '#ff4757',
//     backgroundColor: '#fff5f5',
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   characterCount: {
//     fontSize: 12,
//     color: '#666',
//     textAlign: 'right',
//     marginTop: 4,
//   },
//   errorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     gap: 6,
//   },
//   errorText: {
//     fontSize: 14,
//     color: '#ff4757',
//     flex: 1,
//   },

//   // Picker Button
//   pickerButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     padding: 16,
//     backgroundColor: '#fafbfc',
//   },
//   pickerButtonText: {
//     fontSize: 16,
//     color: '#2c3e50',
//   },

//   // Price Input
//   priceInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     backgroundColor: '#fafbfc',
//     paddingLeft: 16,
//   },
//   currencySymbol: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#007AFF',
//     marginRight: 8,
//   },
//   priceInput: {
//     flex: 1,
//     padding: 16,
//     paddingLeft: 0,
//     fontSize: 16,
//     color: '#2c3e50',
//   },

//   // Image Picker
//   imagePickerButton: {
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 32,
//     alignItems: 'center',
//     backgroundColor: '#fafbfc',
//   },
//   imagePickerText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#007AFF',
//     marginTop: 12,
//   },
//   imagePickerSubtext: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     marginTop: 4,
//   },
//   imagePreviewContainer: {
//     position: 'relative',
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   imagePreview: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//   },
//   removeImageButton: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 12,
//     padding: 4,
//   },

//   // Submit Button
//   submitButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginTop: 16,
//     shadowColor: '#28a745',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   submitButtonDisabled: {
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   submitGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 18,
//     gap: 8,
//   },
//   submitButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     letterSpacing: 0.5,
//   },

//   // Help
//   helpContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginTop: 24,
//     padding: 16,
//     backgroundColor: 'rgba(0, 122, 255, 0.05)',
//     borderRadius: 12,
//     gap: 8,
//   },
//   helpText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
// });

































// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   SafeAreaView,
//   StatusBar,
//   Animated,
//   Keyboard,
//   KeyboardAvoidingView,
//   Platform,
//   Dimensions,
//   Linking
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import * as Haptics from 'expo-haptics';
// import { useRouter } from 'expo-router';
// import ConnectionAPI from '../api/connectionService'; // Update this import path

// const { width } = Dimensions.get('window');

// export default function CreateMarketplaceItemScreen() {
//   const router = useRouter();
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [price, setPrice] = useState('');
//   const [category, setCategory] = useState('Others'); // Added missing category field
//   const [condition, setCondition] = useState('Used'); // Added missing condition field
//   const [imageBase64, setImageBase64] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [imagePickerLoading, setImagePickerLoading] = useState(false);
//   const [showCategoryPicker, setShowCategoryPicker] = useState(false);
//   const [showConditionPicker, setShowConditionPicker] = useState(false);

//   // Animation references
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(50)).current;

//   // Category and Condition options
//   const categoryOptions = ['Books', 'Electronics', 'Clothing', 'Others'];
//   const conditionOptions = ['New', 'Used'];

//   React.useEffect(() => {
//     // Entrance animation
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

//   const validateField = (field, value) => {
//     const newErrors = { ...errors };
    
//     switch (field) {
//       case 'title':
//         if (!value.trim()) {
//           newErrors.title = 'Title is required';
//         } else if (value.trim().length < 3) {
//           newErrors.title = 'Title must be at least 3 characters';
//         } else if (value.trim().length > 100) {
//           newErrors.title = 'Title must be less than 100 characters';
//         } else {
//           delete newErrors.title;
//         }
//         break;
//       case 'description':
//         if (!value.trim()) {
//           newErrors.description = 'Description is required';
//         } else if (value.trim().length < 10) {
//           newErrors.description = 'Description must be at least 10 characters';
//         } else {
//           delete newErrors.description;
//         }
//         break;
//       case 'price':
//         if (!value.trim()) {
//           newErrors.price = 'Price is required';
//         } else if (isNaN(Number(value))) {
//           newErrors.price = 'Price must be a valid number';
//         } else if (Number(value) <= 0) {
//           newErrors.price = 'Price must be greater than 0';
//         } else if (Number(value) > 99999999.99) {
//           newErrors.price = 'Price is too large';
//         } else {
//           delete newErrors.price;
//         }
//         break;
//       case 'category':
//         if (!categoryOptions.includes(value)) {
//           newErrors.category = 'Please select a valid category';
//         } else {
//           delete newErrors.category;
//         }
//         break;
//       case 'condition':
//         if (!conditionOptions.includes(value)) {
//           newErrors.condition = 'Please select a valid condition';
//         } else {
//           delete newErrors.condition;
//         }
//         break;
//     }
    
//     setErrors(newErrors);
//   };

//   const pickImage = async () => {
//     try {
//       setImagePickerLoading(true);
      
//       const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           'Permission Required',
//           'Please grant permission to access your photo library to upload images.',
//           [
//             { text: 'Cancel', style: 'cancel' },
//             { text: 'Open Settings', onPress: () => Linking.openSettings() }
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.6, // Reduced quality to prevent large file sizes
//         base64: true,
//       });

//       if (!result.canceled && result.assets && result.assets[0].base64) {
//         // Create base64 string without data URL prefix for backend processing
//         setImageBase64(result.assets[0].base64);
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick image. Please try again.');
//     } finally {
//       setImagePickerLoading(false);
//     }
//   };

//   const takePhoto = async () => {
//     try {
//       setImagePickerLoading(true);
      
//       const permission = await ImagePicker.requestCameraPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           'Camera Permission Required',
//           'Please grant permission to access your camera to take photos.',
//           [
//             { text: 'Cancel', style: 'cancel' },
//             { text: 'Open Settings', onPress: () => Linking.openSettings() }
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchCameraAsync({
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.6, // Reduced quality to prevent large file sizes
//         base64: true,
//       });

//       if (!result.canceled && result.assets && result.assets[0].base64) {
//         // Create base64 string without data URL prefix for backend processing
//         setImageBase64(result.assets[0].base64);
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (error) {
//       console.error('Error taking photo:', error);
//       Alert.alert('Error', 'Failed to take photo. Please try again.');
//     } finally {
//       setImagePickerLoading(false);
//     }
//   };

//   const showImagePicker = () => {
//     Alert.alert(
//       'Select Image',
//       'Choose how you would like to add an image to your listing',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Take Photo', onPress: takePhoto },
//         { text: 'Choose from Library', onPress: pickImage },
//       ]
//     );
//   };

//   const removeImage = () => {
//     Alert.alert(
//       'Remove Image',
//       'Are you sure you want to remove this image?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Remove', 
//           style: 'destructive',
//           onPress: () => {
//             setImageBase64(null);
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//           }
//         }
//       ]
//     );
//   };

//   const showCategoryOptions = () => {
//     const options = categoryOptions.map(cat => ({
//       text: cat,
//       onPress: () => {
//         setCategory(cat);
//         validateField('category', cat);
//       }
//     }));
//     options.push({ text: 'Cancel', style: 'cancel' });
    
//     Alert.alert('Select Category', 'Choose a category for your item', options);
//   };

//   const showConditionOptions = () => {
//     const options = conditionOptions.map(cond => ({
//       text: cond,
//       onPress: () => {
//         setCondition(cond);
//         validateField('condition', cond);
//       }
//     }));
//     options.push({ text: 'Cancel', style: 'cancel' });
    
//     Alert.alert('Select Condition', 'Choose the condition of your item', options);
//   };

//   const handleSubmit = async () => {
//     // Validate all fields
//     validateField('title', title);
//     validateField('description', description);
//     validateField('price', price);
//     validateField('category', category);
//     validateField('condition', condition);

//     // Check if there are any validation errors
//     const hasErrors = Object.keys(errors).length > 0 || 
//                      !title.trim() || 
//                      !description.trim() || 
//                      !price.trim();

//     if (hasErrors) {
//       Alert.alert('Validation Error', 'Please fix all errors before submitting.');
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       return;
//     }

//     Alert.alert(
//       'Confirm Posting',
//       'Are you sure you want to post this item for sale?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Post Item', onPress: performSubmit }
//       ]
//     );
//   };

//   const performSubmit = async () => {
//     setLoading(true);
//     Keyboard.dismiss();

//     try {
//       // Check authentication before proceeding
//       const isAuthenticated = await ConnectionAPI.isAuthenticated();
//       if (!isAuthenticated) {
//         Alert.alert(
//           'Authentication Required', 
//           'Please log in to post items.',
//           [
//             { text: 'OK', onPress: () => router.push('/login') }
//           ]
//         );
//         return;
//       }

//       // Prepare item data matching your Django model fields
//       const itemData = {
//         title: title.trim(),
//         description: description.trim(),
//         price: parseFloat(price), // Ensure it's a number
//         category: category,
//         condition: condition,
//         image: imageBase64 || null, // Send base64 string or null
//       };

//       console.log('Submitting item data:', {
//         ...itemData,
//         image: itemData.image ? 'base64_image_data' : null // Don't log full base64
//       });

//       // Use ConnectionAPI to create marketplace item
//       const response = await ConnectionAPI.createMarketplaceItem(itemData);

//       // Success handling
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       Alert.alert(
//         'Success!',
//         'Your item has been posted successfully.',
//         [
//           {
//             text: 'OK',
//             onPress: () => {
//               router.back();
//             }
//           }
//         ]
//       );

//     } catch (error) {
//       console.error('Upload failed:', error);
//       console.error('Error details:', error.response?.data); // Log detailed error response
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
//       // Enhanced error handling
//       let errorMessage = 'Failed to post item. Please try again.';
      
//       if (error.response?.data) {
//         // Handle field-specific validation errors from Django
//         const errorData = error.response.data;
//         if (typeof errorData === 'object') {
//           const errorMessages = [];
//           Object.keys(errorData).forEach(field => {
//             if (Array.isArray(errorData[field])) {
//               errorMessages.push(`${field}: ${errorData[field].join(', ')}`);
//             } else {
//               errorMessages.push(`${field}: ${errorData[field]}`);
//             }
//           });
//           if (errorMessages.length > 0) {
//             errorMessage = errorMessages.join('\n');
//           }
//         }
//       } else if (error.message) {
//         if (error.message.includes('Authentication') || error.message.includes('login')) {
//           errorMessage = 'Authentication failed. Please log in again.';
//         } else if (error.message.includes('too large') || error.message.includes('413')) {
//           errorMessage = 'Image is too large. Please choose a smaller image.';
//         } else if (error.message.includes('Network') || error.message.includes('connection')) {
//           errorMessage = 'Network connection failed. Please check your internet connection.';
//         } else {
//           errorMessage = error.message;
//         }
//       }
      
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatPrice = (text) => {
//     // Remove non-numeric characters except decimal point
//     const cleaned = text.replace(/[^0-9.]/g, '');
    
//     // Prevent multiple decimal points
//     const parts = cleaned.split('.');
//     if (parts.length > 2) {
//       const formatted = parts[0] + '.' + parts.slice(1).join('');
//       setPrice(formatted);
//       validateField('price', formatted);
//     } else {
//       setPrice(cleaned);
//       validateField('price', cleaned);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardView}
//       >
//         <Animated.View
//           style={[
//             styles.animatedContainer,
//             {
//               opacity: fadeAnim,
//               transform: [{ translateY: slideAnim }],
//             },
//           ]}
//         >
//           <ScrollView
//             style={styles.scrollView}
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             {/* Header */}
//             <LinearGradient
//               colors={['#007AFF', '#5856d6']}
//               style={styles.header}
//             >
//               <TouchableOpacity
//                 style={styles.backButton}
//                 onPress={() => router.back('/market-place/market-place-feeds')}
//               >
//                 <Ionicons name="arrow-back" size={24} color="white" />
//               </TouchableOpacity>
//               <Ionicons name="storefront-outline" size={32} color="white" />
//               <Text style={styles.headerTitle}>Add New Listing</Text>
//               <Text style={styles.headerSubtitle}>Fill in the details below</Text>
//             </LinearGradient>

//             {/* Form Container */}
//             <View style={styles.formContainer}>
//               {/* Title Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="text-outline" size={16} color="#007AFF" /> Title *
//                 </Text>
//                 <TextInput
//                   placeholder="Enter item title"
//                   style={[styles.input, errors.title && styles.inputError]}
//                   value={title}
//                   onChangeText={(text) => {
//                     setTitle(text);
//                     validateField('title', text);
//                   }}
//                   maxLength={100}
//                   placeholderTextColor="#999"
//                 />
//                 {errors.title && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.title}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{title.length}/100</Text>
//               </View>

//               {/* Description Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="document-text-outline" size={16} color="#007AFF" /> Description *
//                 </Text>
//                 <TextInput
//                   placeholder="Describe your item in detail"
//                   style={[styles.input, styles.textArea, errors.description && styles.inputError]}
//                   value={description}
//                   onChangeText={(text) => {
//                     setDescription(text);
//                     validateField('description', text);
//                   }}
//                   multiline
//                   numberOfLines={4}
//                   maxLength={500}
//                   textAlignVertical="top"
//                   placeholderTextColor="#999"
//                 />
//                 {errors.description && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.description}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{description.length}/500</Text>
//               </View>

//               {/* Category Selector */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="grid-outline" size={16} color="#007AFF" /> Category *
//                 </Text>
//                 <TouchableOpacity
//                   style={[styles.pickerButton, errors.category && styles.inputError]}
//                   onPress={showCategoryOptions}
//                 >
//                   <Text style={styles.pickerButtonText}>{category}</Text>
//                   <Ionicons name="chevron-down" size={20} color="#666" />
//                 </TouchableOpacity>
//                 {errors.category && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.category}</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Condition Selector */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="checkmark-circle-outline" size={16} color="#007AFF" /> Condition *
//                 </Text>
//                 <TouchableOpacity
//                   style={[styles.pickerButton, errors.condition && styles.inputError]}
//                   onPress={showConditionOptions}
//                 >
//                   <Text style={styles.pickerButtonText}>{condition}</Text>
//                   <Ionicons name="chevron-down" size={20} color="#666" />
//                 </TouchableOpacity>
//                 {errors.condition && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.condition}</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Price Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="pricetag-outline" size={16} color="#007AFF" /> Price (UGX) *
//                 </Text>
//                 <View style={[styles.priceInputContainer, errors.price && styles.inputError]}>
//                   <Text style={styles.currencySymbol}>UGX</Text>
//                   <TextInput
//                     placeholder="0"
//                     style={styles.priceInput}
//                     value={price}
//                     onChangeText={formatPrice}
//                     keyboardType="numeric"
//                     placeholderTextColor="#999"
//                   />
//                 </View>
//                 {errors.price && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.price}</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Image Section */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="camera-outline" size={16} color="#007AFF" /> Product Image
//                 </Text>
                
//                 {!imageBase64 ? (
//                   <TouchableOpacity
//                     style={styles.imagePickerButton}
//                     onPress={showImagePicker}
//                     disabled={imagePickerLoading}
//                   >
//                     {imagePickerLoading ? (
//                       <ActivityIndicator size="small" color="#007AFF" />
//                     ) : (
//                       <>
//                         <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
//                         <Text style={styles.imagePickerText}>Add Photo</Text>
//                         <Text style={styles.imagePickerSubtext}>Tap to select from gallery or take a photo</Text>
//                       </>
//                     )}
//                   </TouchableOpacity>
//                 ) : (
//                   <View style={styles.imagePreviewContainer}>
//                     <Image 
//                       source={{ uri: `data:image/jpeg;base64,${imageBase64}` }} 
//                       style={styles.imagePreview} 
//                     />
//                     <TouchableOpacity
//                       style={styles.removeImageButton}
//                       onPress={removeImage}
//                     >
//                       <Ionicons name="close-circle" size={24} color="#ff4757" />
//                     </TouchableOpacity>
//                   </View>
//                 )}
//               </View>

//               {/* Submit Button */}
//               <TouchableOpacity
//                 style={[styles.submitButton, loading && styles.submitButtonDisabled]}
//                 onPress={handleSubmit}
//                 disabled={loading}
//               >
//                 <LinearGradient
//                   colors={loading ? ['#ccc', '#999'] : ['#28a745', '#20c997']}
//                   style={styles.submitGradient}
//                 >
//                   {loading ? (
//                     <ActivityIndicator size="small" color="white" />
//                   ) : (
//                     <>
//                       <Ionicons name="checkmark-circle-outline" size={20} color="white" />
//                       <Text style={styles.submitButtonText}>ADD ITEM</Text>
//                     </>
//                   )}
//                 </LinearGradient>
//               </TouchableOpacity>

//               {/* Help Text */}
//               <View style={styles.helpContainer}>
//                 <Ionicons name="information-circle-outline" size={16} color="#666" />
//                 <Text style={styles.helpText}>
//                   Make sure to provide accurate information and clear photos to attract buyers.
//                 </Text>
//               </View>
//             </View>
//           </ScrollView>
//         </Animated.View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   keyboardView: {
//     flex: 1,
//   },
//   animatedContainer: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 32,
//   },
//   backButton: {
//     position: 'absolute',
//     top: 40,
//     left: 24,
//     padding: 8,
//     zIndex: 1,
//   },

//   // Header
//   header: {
//     paddingTop: 40,
//     paddingBottom: 32,
//     paddingHorizontal: 24,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//     marginTop: 12,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginTop: 4,
//   },

//   // Form
//   formContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     marginTop: -24,
//     paddingTop: 32,
//     paddingHorizontal: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   inputGroup: {
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   input: {
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     padding: 16,
//     fontSize: 16,
//     backgroundColor: '#fafbfc',
//     color: '#2c3e50',
//   },
//   inputError: {
//     borderColor: '#ff4757',
//     backgroundColor: '#fff5f5',
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   characterCount: {
//     fontSize: 12,
//     color: '#666',
//     textAlign: 'right',
//     marginTop: 4,
//   },
//   errorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     gap: 6,
//   },
//   errorText: {
//     fontSize: 14,
//     color: '#ff4757',
//     flex: 1,
//   },

//   // Picker Button
//   pickerButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     padding: 16,
//     backgroundColor: '#fafbfc',
//   },
//   pickerButtonText: {
//     fontSize: 16,
//     color: '#2c3e50',
//   },

//   // Price Input
//   priceInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     backgroundColor: '#fafbfc',
//     paddingLeft: 16,
//   },
//   currencySymbol: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#007AFF',
//     marginRight: 8,
//   },
//   priceInput: {
//     flex: 1,
//     padding: 16,
//     paddingLeft: 0,
//     fontSize: 16,
//     color: '#2c3e50',
//   },

//   // Image Picker
//   imagePickerButton: {
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 32,
//     alignItems: 'center',
//     backgroundColor: '#fafbfc',
//   },
//   imagePickerText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#007AFF',
//     marginTop: 12,
//   },
//   imagePickerSubtext: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     marginTop: 4,
//   },
//   imagePreviewContainer: {
//     position: 'relative',
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   imagePreview: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//   },
//   removeImageButton: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 12,
//     padding: 4,
//   },

//   // Submit Button
//   submitButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginTop: 16,
//     shadowColor: '#28a745',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   submitButtonDisabled: {
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   submitGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 18,
//     gap: 8,
//   },
//   submitButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     letterSpacing: 0.5,
//   },

//   // Help
//   helpContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginTop: 24,
//     padding: 16,
//     backgroundColor: 'rgba(0, 122, 255, 0.05)',
//     borderRadius: 12,
//     gap: 8,
//   },
//   helpText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
// });


















// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   SafeAreaView,
//   StatusBar,
//   Animated,
//   Keyboard,
//   KeyboardAvoidingView,
//   Platform,
//   Dimensions,
//   Linking
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import * as Haptics from 'expo-haptics';
// import { useRouter } from 'expo-router';
// import ConnectionAPI from '../api/connectionService'; // Update this import path

// const { width } = Dimensions.get('window');

// export default function CreateMarketplaceItemScreen() {
//   const router = useRouter();
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [price, setPrice] = useState('');
//   const [imageBase64, setImageBase64] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [imagePickerLoading, setImagePickerLoading] = useState(false);

//   // Animation references
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(50)).current;

//   React.useEffect(() => {
//     // Entrance animation
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

//   const validateField = (field, value) => {
//     const newErrors = { ...errors };
    
//     switch (field) {
//       case 'title':
//         if (!value.trim()) {
//           newErrors.title = 'Title is required';
//         } else if (value.trim().length < 3) {
//           newErrors.title = 'Title must be at least 3 characters';
//         } else {
//           delete newErrors.title;
//         }
//         break;
//       case 'description':
//         if (!value.trim()) {
//           newErrors.description = 'Description is required';
//         } else if (value.trim().length < 10) {
//           newErrors.description = 'Description must be at least 10 characters';
//         } else {
//           delete newErrors.description;
//         }
//         break;
//       case 'price':
//         if (!value.trim()) {
//           newErrors.price = 'Price is required';
//         } else if (isNaN(Number(value))) {
//           newErrors.price = 'Price must be a valid number';
//         } else if (Number(value) <= 0) {
//           newErrors.price = 'Price must be greater than 0';
//         } else {
//           delete newErrors.price;
//         }
//         break;
//     }
    
//     setErrors(newErrors);
//   };

//   const pickImage = async () => {
//     try {
//       setImagePickerLoading(true);
      
//       const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           'Permission Required',
//           'Please grant permission to access your photo library to upload images.',
//           [
//             { text: 'Cancel', style: 'cancel' },
//             { text: 'Open Settings', onPress: () => Linking.openSettings() }
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.7,
//         base64: true,
//       });

//       if (!result.canceled && result.assets && result.assets[0].base64) {
//         setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick image. Please try again.');
//     } finally {
//       setImagePickerLoading(false);
//     }
//   };

//   const takePhoto = async () => {
//     try {
//       setImagePickerLoading(true);
      
//       const permission = await ImagePicker.requestCameraPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           'Camera Permission Required',
//           'Please grant permission to access your camera to take photos.',
//           [
//             { text: 'Cancel', style: 'cancel' },
//             { text: 'Open Settings', onPress: () => Linking.openSettings() }
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchCameraAsync({
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.7,
//         base64: true,
//       });

//       if (!result.canceled && result.assets && result.assets[0].base64) {
//         setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (error) {
//       console.error('Error taking photo:', error);
//       Alert.alert('Error', 'Failed to take photo. Please try again.');
//     } finally {
//       setImagePickerLoading(false);
//     }
//   };

//   const showImagePicker = () => {
//     Alert.alert(
//       'Select Image',
//       'Choose how you would like to add an image to your listing',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Take Photo', onPress: takePhoto },
//         { text: 'Choose from Library', onPress: pickImage },
//       ]
//     );
//   };

//   const removeImage = () => {
//     Alert.alert(
//       'Remove Image',
//       'Are you sure you want to remove this image?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Remove', 
//           style: 'destructive',
//           onPress: () => {
//             setImageBase64(null);
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//           }
//         }
//       ]
//     );
//   };

//   const handleSubmit = async () => {
//     // Validate all fields
//     validateField('title', title);
//     validateField('description', description);
//     validateField('price', price);

//     if (Object.keys(errors).length > 0 || !title.trim() || !description.trim() || !price.trim()) {
//       Alert.alert('Validation Error', 'Please fix all errors before submitting.');
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       return;
//     }

//     Alert.alert(
//       'Confirm Posting',
//       'Are you sure you want to post this item for sale?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Post Item', onPress: performSubmit }
//       ]
//     );
//   };

//   const performSubmit = async () => {
//     setLoading(true);
//     Keyboard.dismiss();

//     try {
//       // Check authentication before proceeding
//       const isAuthenticated = await ConnectionAPI.isAuthenticated();
//       if (!isAuthenticated) {
//         Alert.alert(
//           'Authentication Required', 
//           'Please log in to post items.',
//           [
//             { text: 'OK', onPress: () => router.push('/login') } // Adjust route as needed
//           ]
//         );
//         return;
//       }

//       // Prepare item data
//       const itemData = {
//         title: title.trim(),
//         description: description.trim(),
//         price: Number(price),
//         image: imageBase64 || null,
//       };

//       // Use ConnectionAPI to create marketplace item
//       const response = await ConnectionAPI.createMarketplaceItem(itemData);

//       // Success handling
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       Alert.alert(
//         'Success!',
//         'Your item has been posted successfully.',
//         [
//           {
//             text: 'OK',
//             onPress: () => {
//               router.back();
//             }
//           }
//         ]
//       );

//     } catch (error) {
//       console.error('Upload failed:', error);
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
//       // Enhanced error handling using ConnectionAPI's error messages
//       let errorMessage = 'Failed to post item. Please try again.';
      
//       if (error.message) {
//         // ConnectionAPI provides structured error messages
//         if (error.message.includes('Authentication') || error.message.includes('login')) {
//           errorMessage = 'Authentication failed. Please log in again.';
//         } else if (error.message.includes('too large') || error.message.includes('413')) {
//           errorMessage = 'Image is too large. Please choose a smaller image.';
//         } else if (error.message.includes('Network') || error.message.includes('connection')) {
//           errorMessage = 'Network connection failed. Please check your internet connection.';
//         } else {
//           errorMessage = error.message;
//         }
//       }
      
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatPrice = (text) => {
//     // Remove non-numeric characters except decimal point
//     const cleaned = text.replace(/[^0-9.]/g, '');
//     setPrice(cleaned);
//     validateField('price', cleaned);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardView}
//       >
//         <Animated.View
//           style={[
//             styles.animatedContainer,
//             {
//               opacity: fadeAnim,
//               transform: [{ translateY: slideAnim }],
//             },
//           ]}
//         >
//           <ScrollView
//             style={styles.scrollView}
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             {/* Header */}
//             <LinearGradient
//               colors={['#007AFF', '#5856d6']}
//               style={styles.header}
//             >
//               <TouchableOpacity
//                 style={styles.backButton}
//                 onPress={() => router.back('/market-place/market-place-feeds')}
//               >
//                 <Ionicons name="arrow-back" size={24} color="white" />
//               </TouchableOpacity>
//               <Ionicons name="storefront-outline" size={32} color="white" />
//               <Text style={styles.headerTitle}>Add New Listing</Text>
//               <Text style={styles.headerSubtitle}>Fill in the details below</Text>
//             </LinearGradient>

//             {/* Form Container */}
//             <View style={styles.formContainer}>
//               {/* Title Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="text-outline" size={16} color="#007AFF" /> Title *
//                 </Text>
//                 <TextInput
//                   placeholder="Enter item title"
//                   style={[styles.input, errors.title && styles.inputError]}
//                   value={title}
//                   onChangeText={(text) => {
//                     setTitle(text);
//                     validateField('title', text);
//                   }}
//                   maxLength={100}
//                   placeholderTextColor="#999"
//                 />
//                 {errors.title && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.title}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{title.length}/100</Text>
//               </View>

//               {/* Description Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="document-text-outline" size={16} color="#007AFF" /> Description *
//                 </Text>
//                 <TextInput
//                   placeholder="Describe your item in detail"
//                   style={[styles.input, styles.textArea, errors.description && styles.inputError]}
//                   value={description}
//                   onChangeText={(text) => {
//                     setDescription(text);
//                     validateField('description', text);
//                   }}
//                   multiline
//                   numberOfLines={4}
//                   maxLength={500}
//                   textAlignVertical="top"
//                   placeholderTextColor="#999"
//                 />
//                 {errors.description && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.description}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{description.length}/500</Text>
//               </View>

//               {/* Price Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="pricetag-outline" size={16} color="#007AFF" /> Price (UGX) *
//                 </Text>
//                 <View style={[styles.priceInputContainer, errors.price && styles.inputError]}>
//                   <Text style={styles.currencySymbol}>UGX</Text>
//                   <TextInput
//                     placeholder="0"
//                     style={styles.priceInput}
//                     value={price}
//                     onChangeText={formatPrice}
//                     keyboardType="numeric"
//                     placeholderTextColor="#999"
//                   />
//                 </View>
//                 {errors.price && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.price}</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Image Section */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="camera-outline" size={16} color="#007AFF" /> Product Image
//                 </Text>
                
//                 {!imageBase64 ? (
//                   <TouchableOpacity
//                     style={styles.imagePickerButton}
//                     onPress={showImagePicker}
//                     disabled={imagePickerLoading}
//                   >
//                     {imagePickerLoading ? (
//                       <ActivityIndicator size="small" color="#007AFF" />
//                     ) : (
//                       <>
//                         <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
//                         <Text style={styles.imagePickerText}>Add Photo</Text>
//                         <Text style={styles.imagePickerSubtext}>Tap to select from gallery or take a photo</Text>
//                       </>
//                     )}
//                   </TouchableOpacity>
//                 ) : (
//                   <View style={styles.imagePreviewContainer}>
//                     <Image source={{ uri: imageBase64 }} style={styles.imagePreview} />
//                     <TouchableOpacity
//                       style={styles.removeImageButton}
//                       onPress={removeImage}
//                     >
//                       <Ionicons name="close-circle" size={24} color="#ff4757" />
//                     </TouchableOpacity>
//                   </View>
//                 )}
//               </View>

//               {/* Submit Button */}
//               <TouchableOpacity
//                 style={[styles.submitButton, loading && styles.submitButtonDisabled]}
//                 onPress={handleSubmit}
//                 disabled={loading}
//               >
//                 <LinearGradient
//                   colors={loading ? ['#ccc', '#999'] : ['#28a745', '#20c997']}
//                   style={styles.submitGradient}
//                 >
//                   {loading ? (
//                     <ActivityIndicator size="small" color="white" />
//                   ) : (
//                     <>
//                       <Ionicons name="checkmark-circle-outline" size={20} color="white" />
//                       <Text style={styles.submitButtonText}>ADD ITEM</Text>
//                     </>
//                   )}
//                 </LinearGradient>
//               </TouchableOpacity>

//               {/* Help Text */}
//               <View style={styles.helpContainer}>
//                 <Ionicons name="information-circle-outline" size={16} color="#666" />
//                 <Text style={styles.helpText}>
//                   Make sure to provide accurate information and clear photos to attract buyers.
//                 </Text>
//               </View>
//             </View>
//           </ScrollView>
//         </Animated.View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   keyboardView: {
//     flex: 1,
//   },
//   animatedContainer: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 32,
//   },
//   backButton: {
//     position: 'absolute',
//     top: 40,
//     left: 24,
//     padding: 8,
//     zIndex: 1,
//   },

//   // Header
//   header: {
//     paddingTop: 40,
//     paddingBottom: 32,
//     paddingHorizontal: 24,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//     marginTop: 12,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginTop: 4,
//   },

//   // Form
//   formContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     marginTop: -24,
//     paddingTop: 32,
//     paddingHorizontal: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   inputGroup: {
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   input: {
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     padding: 16,
//     fontSize: 16,
//     backgroundColor: '#fafbfc',
//     color: '#2c3e50',
//   },
//   inputError: {
//     borderColor: '#ff4757',
//     backgroundColor: '#fff5f5',
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   characterCount: {
//     fontSize: 12,
//     color: '#666',
//     textAlign: 'right',
//     marginTop: 4,
//   },
//   errorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     gap: 6,
//   },
//   errorText: {
//     fontSize: 14,
//     color: '#ff4757',
//     flex: 1,
//   },

//   // Price Input
//   priceInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     backgroundColor: '#fafbfc',
//     paddingLeft: 16,
//   },
//   currencySymbol: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#007AFF',
//     marginRight: 8,
//   },
//   priceInput: {
//     flex: 1,
//     padding: 16,
//     paddingLeft: 0,
//     fontSize: 16,
//     color: '#2c3e50',
//   },

//   // Image Picker
//   imagePickerButton: {
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 32,
//     alignItems: 'center',
//     backgroundColor: '#fafbfc',
//   },
//   imagePickerText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#007AFF',
//     marginTop: 12,
//   },
//   imagePickerSubtext: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     marginTop: 4,
//   },
//   imagePreviewContainer: {
//     position: 'relative',
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   imagePreview: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//   },
//   removeImageButton: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 12,
//     padding: 4,
//   },

//   // Submit Button
//   submitButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginTop: 16,
//     shadowColor: '#28a745',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   submitButtonDisabled: {
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   submitGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 18,
//     gap: 8,
//   },
//   submitButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     letterSpacing: 0.5,
//   },

//   // Help
//   helpContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginTop: 24,
//     padding: 16,
//     backgroundColor: 'rgba(0, 122, 255, 0.05)',
//     borderRadius: 12,
//     gap: 8,
//   },
//   helpText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
// });


























































// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   SafeAreaView,
//   StatusBar,
//   Animated,
//   Keyboard,
//   KeyboardAvoidingView,
//   Platform,
//   Dimensions,
//   Linking
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import * as Haptics from 'expo-haptics';
// import { useRouter } from 'expo-router';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');

// export default function CreateMarketplaceItemScreen({ navigation }) {
//   const router = useRouter();
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [price, setPrice] = useState('');
//   const [imageBase64, setImageBase64] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [imagePickerLoading, setImagePickerLoading] = useState(false);

//   // Animation references
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(50)).current;

//   React.useEffect(() => {
//     // Entrance animation
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Setup navigation header (only if navigation is available)
//     if (navigation && navigation.setOptions) {
//       navigation.setOptions({
//         headerTitle: 'Post New Item',
//         headerStyle: {
//           backgroundColor: '#007AFF',
//         },
//         headerTintColor: 'white',
//         headerTitleStyle: {
//           fontWeight: 'bold',
//           fontSize: 18,
//         },
//         headerLeft: () => (
//           <TouchableOpacity
//             style={styles.headerButton}
//             onPress={() => {
//               if (navigation && navigation.goBack) {
//                 navigation.goBack();
//               } else {
//                 router.back();
//               }
//             }}
//           >
//             <Ionicons name="arrow-back" size={24} color="white" />
//           </TouchableOpacity>
//         ),
//       });
//     }
//   }, [navigation, router]);

//   const validateField = (field, value) => {
//     const newErrors = { ...errors };
    
//     switch (field) {
//       case 'title':
//         if (!value.trim()) {
//           newErrors.title = 'Title is required';
//         } else if (value.trim().length < 3) {
//           newErrors.title = 'Title must be at least 3 characters';
//         } else {
//           delete newErrors.title;
//         }
//         break;
//       case 'description':
//         if (!value.trim()) {
//           newErrors.description = 'Description is required';
//         } else if (value.trim().length < 10) {
//           newErrors.description = 'Description must be at least 10 characters';
//         } else {
//           delete newErrors.description;
//         }
//         break;
//       case 'price':
//         if (!value.trim()) {
//           newErrors.price = 'Price is required';
//         } else if (isNaN(Number(value))) {
//           newErrors.price = 'Price must be a valid number';
//         } else if (Number(value) <= 0) {
//           newErrors.price = 'Price must be greater than 0';
//         } else {
//           delete newErrors.price;
//         }
//         break;
//     }
    
//     setErrors(newErrors);
//   };

//   const pickImage = async () => {
//     try {
//       setImagePickerLoading(true);
      
//       const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           'Permission Required',
//           'Please grant permission to access your photo library to upload images.',
//           [
//             { text: 'Cancel', style: 'cancel' },
//             { text: 'Open Settings', onPress: () => Linking.openSettings() }
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.7,
//         base64: true,
//       });

//       if (!result.canceled && result.assets && result.assets[0].base64) {
//         setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick image. Please try again.');
//     } finally {
//       setImagePickerLoading(false);
//     }
//   };

//   const takePhoto = async () => {
//     try {
//       setImagePickerLoading(true);
      
//       const permission = await ImagePicker.requestCameraPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           'Camera Permission Required',
//           'Please grant permission to access your camera to take photos.',
//           [
//             { text: 'Cancel', style: 'cancel' },
//             { text: 'Open Settings', onPress: () => Linking.openSettings() }
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchCameraAsync({
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.7,
//         base64: true,
//       });

//       if (!result.canceled && result.assets && result.assets[0].base64) {
//         setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (error) {
//       console.error('Error taking photo:', error);
//       Alert.alert('Error', 'Failed to take photo. Please try again.');
//     } finally {
//       setImagePickerLoading(false);
//     }
//   };

//   const showImagePicker = () => {
//     Alert.alert(
//       'Select Image',
//       'Choose how you would like to add an image to your listing',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Take Photo', onPress: takePhoto },
//         { text: 'Choose from Library', onPress: pickImage },
//       ]
//     );
//   };

//   const removeImage = () => {
//     Alert.alert(
//       'Remove Image',
//       'Are you sure you want to remove this image?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Remove', 
//           style: 'destructive',
//           onPress: () => {
//             setImageBase64(null);
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//           }
//         }
//       ]
//     );
//   };

//   const getAuthToken = async () => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   const handleSubmit = async () => {
//     // Validate all fields
//     validateField('title', title);
//     validateField('description', description);
//     validateField('price', price);

//     if (Object.keys(errors).length > 0 || !title.trim() || !description.trim() || !price.trim()) {
//       Alert.alert('Validation Error', 'Please fix all errors before submitting.');
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       return;
//     }

//     Alert.alert(
//       'Confirm Posting',
//       'Are you sure you want to post this item for sale?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Post Item', onPress: performSubmit }
//       ]
//     );
//   };

//   const performSubmit = async () => {
//     setLoading(true);
//     Keyboard.dismiss();

//     try {
//       const token = await getAuthToken();
//       if (!token) {
//         Alert.alert('Authentication Error', 'Please log in to post items.');
//         return;
//       }

//       const response = await axios.post('http://127.0.0.1:8000/api/marketplace/', {
//         title: title.trim(),
//         description: description.trim(),
//         price: Number(price),
//         image: imageBase64 || null,
//       }, {
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response.status >= 200 && response.status < 300) {
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//         Alert.alert(
//           'Success!',
//           'Your item has been posted successfully.',
//           [
//             {
//               text: 'OK',
//               onPress: () => {
//                 if (navigation && navigation.goBack) {
//                   navigation.goBack();
//                 } else {
//                   router.back();
//                 }
//               }
//             }
//           ]
//         );
//       } else {
//         throw new Error('Server returned an error');
//       }
//     } catch (error) {
//       console.error('Upload failed:', error);
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
//       let errorMessage = 'Failed to post item. Please try again.';
      
//       if (error.response) {
//         if (error.response.status === 401) {
//           errorMessage = 'Authentication failed. Please log in again.';
//         } else if (error.response.status === 413) {
//           errorMessage = 'Image is too large. Please choose a smaller image.';
//         } else if (error.response.data?.message) {
//           errorMessage = error.response.data.message;
//         }
//       } else if (error.message === 'Network Error') {
//         errorMessage = 'Network connection failed. Please check your internet connection.';
//       }
      
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatPrice = (text) => {
//     // Remove non-numeric characters except decimal point
//     const cleaned = text.replace(/[^0-9.]/g, '');
//     setPrice(cleaned);
//     validateField('price', cleaned);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardView}
//       >
//         <Animated.View
//           style={[
//             styles.animatedContainer,
//             {
//               opacity: fadeAnim,
//               transform: [{ translateY: slideAnim }],
//             },
//           ]}
//         >
//           <ScrollView
//             style={styles.scrollView}
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             {/* Header */}
//             <LinearGradient
//               colors={['#007AFF', '#5856d6']}
//               style={styles.header}
//             >
//               <Ionicons name="storefront-outline" size={32} color="white" />
//               <Text style={styles.headerTitle}>Create New Listing</Text>
//               <Text style={styles.headerSubtitle}>Fill in the details below</Text>
//             </LinearGradient>

//             {/* Form Container */}
//             <View style={styles.formContainer}>
//               {/* Title Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="text-outline" size={16} color="#007AFF" /> Title *
//                 </Text>
//                 <TextInput
//                   placeholder="Enter item title"
//                   style={[styles.input, errors.title && styles.inputError]}
//                   value={title}
//                   onChangeText={(text) => {
//                     setTitle(text);
//                     validateField('title', text);
//                   }}
//                   maxLength={100}
//                   placeholderTextColor="#999"
//                 />
//                 {errors.title && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.title}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{title.length}/100</Text>
//               </View>

//               {/* Description Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="document-text-outline" size={16} color="#007AFF" /> Description *
//                 </Text>
//                 <TextInput
//                   placeholder="Describe your item in detail"
//                   style={[styles.input, styles.textArea, errors.description && styles.inputError]}
//                   value={description}
//                   onChangeText={(text) => {
//                     setDescription(text);
//                     validateField('description', text);
//                   }}
//                   multiline
//                   numberOfLines={4}
//                   maxLength={500}
//                   textAlignVertical="top"
//                   placeholderTextColor="#999"
//                 />
//                 {errors.description && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.description}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{description.length}/500</Text>
//               </View>

//               {/* Price Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="pricetag-outline" size={16} color="#007AFF" /> Price (UGX) *
//                 </Text>
//                 <View style={[styles.priceInputContainer, errors.price && styles.inputError]}>
//                   <Text style={styles.currencySymbol}>UGX</Text>
//                   <TextInput
//                     placeholder="0"
//                     style={styles.priceInput}
//                     value={price}
//                     onChangeText={formatPrice}
//                     keyboardType="numeric"
//                     placeholderTextColor="#999"
//                   />
//                 </View>
//                 {errors.price && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.price}</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Image Section */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="camera-outline" size={16} color="#007AFF" /> Product Image
//                 </Text>
                
//                 {!imageBase64 ? (
//                   <TouchableOpacity
//                     style={styles.imagePickerButton}
//                     onPress={showImagePicker}
//                     disabled={imagePickerLoading}
//                   >
//                     {imagePickerLoading ? (
//                       <ActivityIndicator size="small" color="#007AFF" />
//                     ) : (
//                       <>
//                         <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
//                         <Text style={styles.imagePickerText}>Add Photo</Text>
//                         <Text style={styles.imagePickerSubtext}>Tap to select from gallery or take a photo</Text>
//                       </>
//                     )}
//                   </TouchableOpacity>
//                 ) : (
//                   <View style={styles.imagePreviewContainer}>
//                     <Image source={{ uri: imageBase64 }} style={styles.imagePreview} />
//                     <TouchableOpacity
//                       style={styles.removeImageButton}
//                       onPress={removeImage}
//                     >
//                       <Ionicons name="close-circle" size={24} color="#ff4757" />
//                     </TouchableOpacity>
//                   </View>
//                 )}
//               </View>

//               {/* Submit Button */}
//               <TouchableOpacity
//                 style={[styles.submitButton, loading && styles.submitButtonDisabled]}
//                 onPress={handleSubmit}
//                 disabled={loading}
//               >
//                 <LinearGradient
//                   colors={loading ? ['#ccc', '#999'] : ['#28a745', '#20c997']}
//                   style={styles.submitGradient}
//                 >
//                   {loading ? (
//                     <ActivityIndicator size="small" color="white" />
//                   ) : (
//                     <>
//                       <Ionicons name="checkmark-circle-outline" size={20} color="white" />
//                       <Text style={styles.submitButtonText}>POST ITEM</Text>
//                     </>
//                   )}
//                 </LinearGradient>
//               </TouchableOpacity>

//               {/* Help Text */}
//               <View style={styles.helpContainer}>
//                 <Ionicons name="information-circle-outline" size={16} color="#666" />
//                 <Text style={styles.helpText}>
//                   Make sure to provide accurate information and clear photos to attract buyers.
//                 </Text>
//               </View>
//             </View>
//           </ScrollView>
//         </Animated.View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   keyboardView: {
//     flex: 1,
//   },
//   animatedContainer: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 32,
//   },
//   headerButton: {
//     padding: 8,
//     marginLeft: 8,
//   },

//   // Header
//   header: {
//     paddingTop: 40,
//     paddingBottom: 32,
//     paddingHorizontal: 24,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//     marginTop: 12,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginTop: 4,
//   },

//   // Form
//   formContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     marginTop: -24,
//     paddingTop: 32,
//     paddingHorizontal: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   inputGroup: {
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   input: {
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     padding: 16,
//     fontSize: 16,
//     backgroundColor: '#fafbfc',
//     color: '#2c3e50',
//   },
//   inputError: {
//     borderColor: '#ff4757',
//     backgroundColor: '#fff5f5',
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   characterCount: {
//     fontSize: 12,
//     color: '#666',
//     textAlign: 'right',
//     marginTop: 4,
//   },
//   errorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     gap: 6,
//   },
//   errorText: {
//     fontSize: 14,
//     color: '#ff4757',
//     flex: 1,
//   },

//   // Price Input
//   priceInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     backgroundColor: '#fafbfc',
//     paddingLeft: 16,
//   },
//   currencySymbol: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#007AFF',
//     marginRight: 8,
//   },
//   priceInput: {
//     flex: 1,
//     padding: 16,
//     paddingLeft: 0,
//     fontSize: 16,
//     color: '#2c3e50',
//   },

//   // Image Picker
//   imagePickerButton: {
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 32,
//     alignItems: 'center',
//     backgroundColor: '#fafbfc',
//   },
//   imagePickerText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#007AFF',
//     marginTop: 12,
//   },
//   imagePickerSubtext: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     marginTop: 4,
//   },
//   imagePreviewContainer: {
//     position: 'relative',
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   imagePreview: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//   },
//   removeImageButton: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 12,
//     padding: 4,
//   },

//   // Submit Button
//   submitButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginTop: 16,
//     shadowColor: '#28a745',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   submitButtonDisabled: {
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   submitGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 18,
//     gap: 8,
//   },
//   submitButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     letterSpacing: 0.5,
//   },

//   // Help
//   helpContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginTop: 24,
//     padding: 16,
//     backgroundColor: 'rgba(0, 122, 255, 0.05)',
//     borderRadius: 12,
//     gap: 8,
//   },
//   helpText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
// });

























































// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   SafeAreaView,
//   StatusBar,
//   Animated,
//   Keyboard,
//   KeyboardAvoidingView,
//   Platform,
//   Dimensions
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import * as Haptics from 'expo-haptics';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');

// export default function CreateMarketplaceItemScreen({ navigation }) {
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [price, setPrice] = useState('');
//   const [imageBase64, setImageBase64] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [imagePickerLoading, setImagePickerLoading] = useState(false);

//   // Animation references
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(50)).current;

//   React.useEffect(() => {
//     // Entrance animation
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Setup navigation header
//     navigation.setOptions({
//       headerTitle: 'Post New Item',
//       headerStyle: {
//         backgroundColor: '#007AFF',
//       },
//       headerTintColor: 'white',
//       headerTitleStyle: {
//         fontWeight: 'bold',
//         fontSize: 18,
//       },
//       headerLeft: () => (
//         <TouchableOpacity
//           style={styles.headerButton}
//           onPress={() => navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="white" />
//         </TouchableOpacity>
//       ),
//     });
//   }, []);

//   const validateField = (field, value) => {
//     const newErrors = { ...errors };
    
//     switch (field) {
//       case 'title':
//         if (!value.trim()) {
//           newErrors.title = 'Title is required';
//         } else if (value.trim().length < 3) {
//           newErrors.title = 'Title must be at least 3 characters';
//         } else {
//           delete newErrors.title;
//         }
//         break;
//       case 'description':
//         if (!value.trim()) {
//           newErrors.description = 'Description is required';
//         } else if (value.trim().length < 10) {
//           newErrors.description = 'Description must be at least 10 characters';
//         } else {
//           delete newErrors.description;
//         }
//         break;
//       case 'price':
//         if (!value.trim()) {
//           newErrors.price = 'Price is required';
//         } else if (isNaN(Number(value))) {
//           newErrors.price = 'Price must be a valid number';
//         } else if (Number(value) <= 0) {
//           newErrors.price = 'Price must be greater than 0';
//         } else {
//           delete newErrors.price;
//         }
//         break;
//     }
    
//     setErrors(newErrors);
//   };

//   const pickImage = async () => {
//     try {
//       setImagePickerLoading(true);
      
//       const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           'Permission Required',
//           'Please grant permission to access your photo library to upload images.',
//           [
//             { text: 'Cancel', style: 'cancel' },
//             { text: 'Open Settings', onPress: () => Linking.openSettings() }
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.7,
//         base64: true,
//       });

//       if (!result.canceled && result.assets && result.assets[0].base64) {
//         setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick image. Please try again.');
//     } finally {
//       setImagePickerLoading(false);
//     }
//   };

//   const takePhoto = async () => {
//     try {
//       setImagePickerLoading(true);
      
//       const permission = await ImagePicker.requestCameraPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           'Camera Permission Required',
//           'Please grant permission to access your camera to take photos.',
//           [
//             { text: 'Cancel', style: 'cancel' },
//             { text: 'Open Settings', onPress: () => Linking.openSettings() }
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchCameraAsync({
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.7,
//         base64: true,
//       });

//       if (!result.canceled && result.assets && result.assets[0].base64) {
//         setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (error) {
//       console.error('Error taking photo:', error);
//       Alert.alert('Error', 'Failed to take photo. Please try again.');
//     } finally {
//       setImagePickerLoading(false);
//     }
//   };

//   const showImagePicker = () => {
//     Alert.alert(
//       'Select Image',
//       'Choose how you would like to add an image to your listing',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Take Photo', onPress: takePhoto },
//         { text: 'Choose from Library', onPress: pickImage },
//       ]
//     );
//   };

//   const removeImage = () => {
//     Alert.alert(
//       'Remove Image',
//       'Are you sure you want to remove this image?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Remove', 
//           style: 'destructive',
//           onPress: () => {
//             setImageBase64(null);
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//           }
//         }
//       ]
//     );
//   };

//   const getAuthToken = async () => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   const handleSubmit = async () => {
//     // Validate all fields
//     validateField('title', title);
//     validateField('description', description);
//     validateField('price', price);

//     if (Object.keys(errors).length > 0 || !title.trim() || !description.trim() || !price.trim()) {
//       Alert.alert('Validation Error', 'Please fix all errors before submitting.');
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       return;
//     }

//     Alert.alert(
//       'Confirm Posting',
//       'Are you sure you want to post this item for sale?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Post Item', onPress: performSubmit }
//       ]
//     );
//   };

//   const performSubmit = async () => {
//     setLoading(true);
//     Keyboard.dismiss();

//     try {
//       const token = await getAuthToken();
//       if (!token) {
//         Alert.alert('Authentication Error', 'Please log in to post items.');
//         return;
//       }

//       const response = await axios.post('http://127.0.0.1:8000/api/marketplace/', {
//         title: title.trim(),
//         description: description.trim(),
//         price: Number(price),
//         image: imageBase64 || null,
//       }, {
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response.status >= 200 && response.status < 300) {
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//         Alert.alert(
//           'Success!',
//           'Your item has been posted successfully.',
//           [
//             {
//               text: 'OK',
//               onPress: () => navigation.goBack()
//             }
//           ]
//         );
//       } else {
//         throw new Error('Server returned an error');
//       }
//     } catch (error) {
//       console.error('Upload failed:', error);
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
//       let errorMessage = 'Failed to post item. Please try again.';
      
//       if (error.response) {
//         if (error.response.status === 401) {
//           errorMessage = 'Authentication failed. Please log in again.';
//         } else if (error.response.status === 413) {
//           errorMessage = 'Image is too large. Please choose a smaller image.';
//         } else if (error.response.data?.message) {
//           errorMessage = error.response.data.message;
//         }
//       } else if (error.message === 'Network Error') {
//         errorMessage = 'Network connection failed. Please check your internet connection.';
//       }
      
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatPrice = (text) => {
//     // Remove non-numeric characters except decimal point
//     const cleaned = text.replace(/[^0-9.]/g, '');
//     setPrice(cleaned);
//     validateField('price', cleaned);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardView}
//       >
//         <Animated.View
//           style={[
//             styles.animatedContainer,
//             {
//               opacity: fadeAnim,
//               transform: [{ translateY: slideAnim }],
//             },
//           ]}
//         >
//           <ScrollView
//             style={styles.scrollView}
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             {/* Header */}
//             <LinearGradient
//               colors={['#007AFF', '#5856d6']}
//               style={styles.header}
//             >
//               <Ionicons name="storefront-outline" size={32} color="white" />
//               <Text style={styles.headerTitle}>Create New Listing</Text>
//               <Text style={styles.headerSubtitle}>Fill in the details below</Text>
//             </LinearGradient>

//             {/* Form Container */}
//             <View style={styles.formContainer}>
//               {/* Title Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="text-outline" size={16} color="#007AFF" /> Title *
//                 </Text>
//                 <TextInput
//                   placeholder="Enter item title"
//                   style={[styles.input, errors.title && styles.inputError]}
//                   value={title}
//                   onChangeText={(text) => {
//                     setTitle(text);
//                     validateField('title', text);
//                   }}
//                   maxLength={100}
//                   placeholderTextColor="#999"
//                 />
//                 {errors.title && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.title}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{title.length}/100</Text>
//               </View>

//               {/* Description Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="document-text-outline" size={16} color="#007AFF" /> Description *
//                 </Text>
//                 <TextInput
//                   placeholder="Describe your item in detail"
//                   style={[styles.input, styles.textArea, errors.description && styles.inputError]}
//                   value={description}
//                   onChangeText={(text) => {
//                     setDescription(text);
//                     validateField('description', text);
//                   }}
//                   multiline
//                   numberOfLines={4}
//                   maxLength={500}
//                   textAlignVertical="top"
//                   placeholderTextColor="#999"
//                 />
//                 {errors.description && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.description}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{description.length}/500</Text>
//               </View>

//               {/* Price Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="pricetag-outline" size={16} color="#007AFF" /> Price (UGX) *
//                 </Text>
//                 <View style={[styles.priceInputContainer, errors.price && styles.inputError]}>
//                   <Text style={styles.currencySymbol}>UGX</Text>
//                   <TextInput
//                     placeholder="0"
//                     style={styles.priceInput}
//                     value={price}
//                     onChangeText={formatPrice}
//                     keyboardType="numeric"
//                     placeholderTextColor="#999"
//                   />
//                 </View>
//                 {errors.price && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{errors.price}</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Image Section */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="camera-outline" size={16} color="#007AFF" /> Product Image
//                 </Text>
                
//                 {!imageBase64 ? (
//                   <TouchableOpacity
//                     style={styles.imagePickerButton}
//                     onPress={showImagePicker}
//                     disabled={imagePickerLoading}
//                   >
//                     {imagePickerLoading ? (
//                       <ActivityIndicator size="small" color="#007AFF" />
//                     ) : (
//                       <>
//                         <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
//                         <Text style={styles.imagePickerText}>Add Photo</Text>
//                         <Text style={styles.imagePickerSubtext}>Tap to select from gallery or take a photo</Text>
//                       </>
//                     )}
//                   </TouchableOpacity>
//                 ) : (
//                   <View style={styles.imagePreviewContainer}>
//                     <Image source={{ uri: imageBase64 }} style={styles.imagePreview} />
//                     <TouchableOpacity
//                       style={styles.removeImageButton}
//                       onPress={removeImage}
//                     >
//                       <Ionicons name="close-circle" size={24} color="#ff4757" />
//                     </TouchableOpacity>
//                   </View>
//                 )}
//               </View>

//               {/* Submit Button */}
//               <TouchableOpacity
//                 style={[styles.submitButton, loading && styles.submitButtonDisabled]}
//                 onPress={handleSubmit}
//                 disabled={loading}
//               >
//                 <LinearGradient
//                   colors={loading ? ['#ccc', '#999'] : ['#28a745', '#20c997']}
//                   style={styles.submitGradient}
//                 >
//                   {loading ? (
//                     <ActivityIndicator size="small" color="white" />
//                   ) : (
//                     <>
//                       <Ionicons name="checkmark-circle-outline" size={20} color="white" />
//                       <Text style={styles.submitButtonText}>POST ITEM</Text>
//                     </>
//                   )}
//                 </LinearGradient>
//               </TouchableOpacity>

//               {/* Help Text */}
//               <View style={styles.helpContainer}>
//                 <Ionicons name="information-circle-outline" size={16} color="#666" />
//                 <Text style={styles.helpText}>
//                   Make sure to provide accurate information and clear photos to attract buyers.
//                 </Text>
//               </View>
//             </View>
//           </ScrollView>
//         </Animated.View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   keyboardView: {
//     flex: 1,
//   },
//   animatedContainer: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 32,
//   },
//   headerButton: {
//     padding: 8,
//     marginLeft: 8,
//   },

//   // Header
//   header: {
//     paddingTop: 40,
//     paddingBottom: 32,
//     paddingHorizontal: 24,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//     marginTop: 12,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     marginTop: 4,
//   },

//   // Form
//   formContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     marginTop: -24,
//     paddingTop: 32,
//     paddingHorizontal: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   inputGroup: {
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   input: {
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     padding: 16,
//     fontSize: 16,
//     backgroundColor: '#fafbfc',
//     color: '#2c3e50',
//   },
//   inputError: {
//     borderColor: '#ff4757',
//     backgroundColor: '#fff5f5',
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   characterCount: {
//     fontSize: 12,
//     color: '#666',
//     textAlign: 'right',
//     marginTop: 4,
//   },
//   errorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     gap: 6,
//   },
//   errorText: {
//     fontSize: 14,
//     color: '#ff4757',
//     flex: 1,
//   },

//   // Price Input
//   priceInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderRadius: 12,
//     backgroundColor: '#fafbfc',
//     paddingLeft: 16,
//   },
//   currencySymbol: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#007AFF',
//     marginRight: 8,
//   },
//   priceInput: {
//     flex: 1,
//     padding: 16,
//     paddingLeft: 0,
//     fontSize: 16,
//     color: '#2c3e50',
//   },

//   // Image Picker
//   imagePickerButton: {
//     borderWidth: 2,
//     borderColor: '#e1e8ed',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 32,
//     alignItems: 'center',
//     backgroundColor: '#fafbfc',
//   },
//   imagePickerText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#007AFF',
//     marginTop: 12,
//   },
//   imagePickerSubtext: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     marginTop: 4,
//   },
//   imagePreviewContainer: {
//     position: 'relative',
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   imagePreview: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//   },
//   removeImageButton: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 12,
//     padding: 4,
//   },

//   // Submit Button
//   submitButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginTop: 16,
//     shadowColor: '#28a745',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   submitButtonDisabled: {
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   submitGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 18,
//     gap: 8,
//   },
//   submitButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     letterSpacing: 0.5,
//   },

//   // Help
//   helpContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginTop: 24,
//     padding: 16,
//     backgroundColor: 'rgba(0, 122, 255, 0.05)',
//     borderRadius: 12,
//     gap: 8,
//   },
//   helpText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
// });






















































// // screens/CreateMarketplaceItemScreen.tsx
// import React, { useState } from 'react';
// import { View, Text, TextInput, Button, Image, StyleSheet, ScrollView, Alert } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export default function CreateMarketplaceItemScreen({ navigation }) {
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [price, setPrice] = useState('');
//   const [imageBase64, setImageBase64] = useState<string | null>(null);

//   const pickImage = async () => {
//     const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permission.granted) {
//       alert("Permission to access media library is required!");
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       base64: true,
//       allowsEditing: true,
//       quality: 0.7,
//     });

//     if (!result.canceled && result.assets && result.assets[0].base64) {
//       setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
//     }
//   };

//     const getAuthToken = async () => {
//         try {
//         return await AsyncStorage.getItem('access_token');
//         } catch (error) {
//         console.error('Error getting auth token:', error);
//         return null;
//         }
//     };




//   const handleSubmit = async () => {
//     if (!title || !description || !price) {
//       Alert.alert('Error', 'All fields are required');
//       return;
//     }

//     try {
//       const token = await getAuthToken(); 
//       const response = await axios.post('http://127.0.0.1:8000/api/marketplace/', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           title,
//           description,
//           price,
//           image: imageBase64 || null,
//         }),
//       });

//       if (response.status < 200 || response.status >= 300) {
//         console.error(response.data);
//         Alert.alert('Error', 'Failed to create item');
//       } else {
//         Alert.alert('Success', 'Item posted!');
//         navigation.goBack();
//       }
//     } catch (error) {
//       console.error('Upload failed:', error);
//       Alert.alert('Error', 'Network or server issue');
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.heading}>Post Item for Sale</Text>
      
//       <TextInput placeholder="Title" style={styles.input} value={title} onChangeText={setTitle} />
//       <TextInput placeholder="Description" style={[styles.input, { height: 100 }]} value={description} onChangeText={setDescription} multiline />
//       <TextInput placeholder="Price" style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

//       <Button title="Pick Image" onPress={pickImage} />
//       {imageBase64 && (
//         <Image source={{ uri: imageBase64 }} style={styles.preview} />
//       )}

//       <Button title="Post Item" onPress={handleSubmit} />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//   },
//   heading: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     marginBottom: 15,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     padding: 12,
//     marginVertical: 10,
//     borderRadius: 5,
//   },
//   preview: {
//     width: '100%',
//     height: 200,
//     marginTop: 15,
//     borderRadius: 10,
//   },
// });
