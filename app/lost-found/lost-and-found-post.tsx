
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   TextInput,
//   Text,
//   StyleSheet,
//   Image,
//   TouchableOpacity,
//   Alert,
//   ScrollView,
//   StatusBar,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Animated
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { useRouter } from 'expo-router';
// import { 
//   ArrowLeft, 
//   Edit3, 
//   MapPin, 
//   Calendar, 
//   X, 
//   Check, 
//   PartyPopper, 
//   Camera, 
//   Trash2, 
//   Send 
// } from 'lucide-react-native';

// const LostFoundPost = () => {
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [status, setStatus] = useState('lost');
//   const [location, setLocation] = useState('');
//   const [date, setDate] = useState('');
//   const [image, setImage] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [fadeAnim] = useState(new Animated.Value(0));

//   const router = useRouter();

//   const statusOptions = [
//     { key: 'lost', label: 'Lost', icon: X, color: '#ff6b6b' },
//     { key: 'found', label: 'Found', icon: Check, color: '#4ecdc4' },
//     { key: 'claimed', label: 'Claimed', icon: PartyPopper, color: '#45b7d1' }
//   ];

//   useEffect(() => {
//     // Set today's date as default
//     const today = new Date();
//     const formattedDate = today.toISOString().split('T')[0];
//     setDate(formattedDate);

//     // Fade in animation
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 800,
//       useNativeDriver: true,
//     }).start();

//     // Request camera permissions
//     requestPermissions();
//   }, []);

//   const requestPermissions = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission Required', 'We need camera roll permissions to upload images.');
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!title.trim()) newErrors.title = 'Title is required';
//     if (!description.trim()) newErrors.description = 'Description is required';
//     if (!location.trim()) newErrors.location = 'Location is required';
//     if (!date.trim()) newErrors.date = 'Date is required';

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const pickImage = async () => {
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.8,
//         base64: true,
//       });

//       if (!result.canceled) {
//         setImage(result.assets[0]);
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to pick image. Please try again.');
//     }
//   };

//   const removeImage = () => {
//     setImage(null);
//   };

//   const handleBack = () => {
//     router.push('/auth/dashboard');
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) {
//       Alert.alert('Validation Error', 'Please fill in all required fields.');
//       return;
//     }

//     setLoading(true);

//     const postData = {
//       title: title.trim(),
//       description: description.trim(),
//       status,
//       location: location.trim(),
//       date,
//       image: image ? `data:image/jpeg;base64,${image.base64}` : null,
//     };

//     // Debug: Log the data being sent (remove in production)
//     console.log('Sending data:', {
//       ...postData,
//       image: image ? 'base64 data present' : null // Don't log actual base64
//     });

//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       // const response = await axios.post('http://127.0.0.1:8000/api/lost-found/', postData, {
//       // const response = await axios.post('http://192.168.220.16:8000/api/lost-found/', postData, {
//       const response = await axios.post('http://192.168.130.16:8000/api/lost-found/', postData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       Alert.alert(
//         'Success! 🎉',
//         'Your item has been posted successfully.',
//         [
//           {
//             text: 'OK',
//             onPress: () => router.push('/auth/dashboard'),
//           },
//         ]
//       );

//       // Reset form
//       setTitle('');
//       setDescription('');
//       setStatus('lost');
//       setLocation('');
//       setDate(new Date().toISOString().split('T')[0]);
//       setImage(null);
//       setErrors({});

//     } catch (error) {
//       console.error('Post failed:', error);
      
//       // More detailed error logging
//       if (error.response) {
//         console.error('Response data:', error.response.data);
//         console.error('Response status:', error.response.status);
//         console.error('Response headers:', error.response.headers);
        
//         Alert.alert(
//           'Error',
//           `Server error (${error.response.status}): ${JSON.stringify(error.response.data)}`
//         );
//       } else if (error.request) {
//         console.error('Request error:', error.request);
//         Alert.alert('Error', 'Network error. Please check your connection.');
//       } else {
//         console.error('Error:', error.message);
//         Alert.alert('Error', error.message);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderStatusButton = (option) => {
//     const IconComponent = option.icon;
//     return (
//       <TouchableOpacity
//         key={option.key}
//         onPress={() => setStatus(option.key)}
//         style={[
//           styles.statusButton,
//           {
//             backgroundColor: status === option.key ? option.color : 'white',
//             borderColor: option.color,
//           }
//         ]}
//         activeOpacity={0.7}
//       >
//         <IconComponent 
//           size={16} 
//           color={status === option.key ? 'white' : option.color} 
//           style={styles.statusIcon}
//         />
//         <Text style={[
//           styles.statusText,
//           { color: status === option.key ? 'white' : option.color }
//         ]}>
//           {option.label.toUpperCase()}
//         </Text>
//       </TouchableOpacity>
//     );
//   };

//   const renderInput = (placeholder, value, onChangeText, multiline = false, error = null, icon = null) => (
//     <View style={styles.inputContainer}>
//       <View style={styles.labelWithIcon}>
//         {icon && React.createElement(icon, { size: 18, color: '#333' })}
//         <Text style={styles.label}>
//           {placeholder} <Text style={styles.required}>*</Text>
//         </Text>
//       </View>
//       <TextInput
//         placeholder={`Enter ${placeholder.toLowerCase()}...`}
//         value={value}
//         onChangeText={onChangeText}
//         style={[
//           styles.input,
//           multiline && styles.textArea,
//           error && styles.inputError
//         ]}
//         multiline={multiline}
//         numberOfLines={multiline ? 4 : 1}
//         placeholderTextColor="#999"
//       />
//       {error && <Text style={styles.errorText}>{error}</Text>}
//     </View>
//   );

//   return (
//     <KeyboardAvoidingView 
//       style={styles.container} 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
//       {/* Back Button */}
//       <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
//         <ArrowLeft size={24} color="#007bff" />
//         <Text style={styles.backButtonText}>Dashboard</Text>
//       </TouchableOpacity>
      
//       <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
//         <ScrollView 
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.scrollContainer}
//         >
//           {/* Header */}
//           <View style={styles.header}>
//             <View style={styles.headerIconContainer}>
//               <Edit3 size={28} color="#007bff" />
//             </View>
//             <Text style={styles.headerTitle}>Post Lost & Found Item</Text>
//             <Text style={styles.headerSubtitle}>
//               Help others find their lost items or return found items
//             </Text>
//           </View>

//           {/* Form */}
//           <View style={styles.form}>
//             {renderInput('Title', title, setTitle, false, errors.title, Edit3)}
//             {renderInput('Description', description, setDescription, true, errors.description)}
//             {renderInput('Location', location, setLocation, false, errors.location, MapPin)}

//             {/* Date Input */}
//             <View style={styles.inputContainer}>
//               <View style={styles.labelWithIcon}>
//                 <Calendar size={18} color="#333" />
//                 <Text style={styles.label}>
//                   Date <Text style={styles.required}>*</Text>
//                 </Text>
//               </View>
//               <TextInput
//                 placeholder="YYYY-MM-DD"
//                 value={date}
//                 onChangeText={setDate}
//                 style={[styles.input, errors.date && styles.inputError]}
//                 placeholderTextColor="#999"
//               />
//               {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
//             </View>

//             {/* Status Selection */}
//             <View style={styles.inputContainer}>
//               <Text style={styles.label}>
//                 Status <Text style={styles.required}>*</Text>
//               </Text>
//               <View style={styles.statusContainer}>
//                 {statusOptions.map(renderStatusButton)}
//               </View>
//             </View>

//             {/* Image Upload */}
//             <View style={styles.inputContainer}>
//               <View style={styles.labelWithIcon}>
//                 <Camera size={18} color="#333" />
//                 <Text style={styles.label}>Image (Optional)</Text>
//               </View>
              
//               {!image ? (
//                 <TouchableOpacity onPress={pickImage} style={styles.imageUploadButton}>
//                   <Camera size={32} color="#6c757d" style={styles.imageUploadIcon} />
//                   <Text style={styles.imageUploadText}>Choose Image</Text>
//                   <Text style={styles.imageUploadSubtext}>Tap to select from gallery</Text>
//                 </TouchableOpacity>
//               ) : (
//                 <View style={styles.imagePreviewContainer}>
//                   <Image source={{ uri: image.uri }} style={styles.imagePreview} />
//                   <View style={styles.imageActions}>
//                     <TouchableOpacity onPress={pickImage} style={styles.changeImageButton}>
//                       <Camera size={14} color="white" />
//                       <Text style={styles.changeImageText}>Change Image</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity onPress={removeImage} style={styles.removeImageButton}>
//                       <Trash2 size={14} color="white" />
//                       <Text style={styles.removeImageText}>Remove</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               )}
//             </View>
//           </View>

//           {/* Submit Button */}
//           <TouchableOpacity
//             onPress={handleSubmit}
//             style={[styles.submitButton, loading && styles.submitButtonDisabled]}
//             disabled={loading}
//             activeOpacity={0.8}
//           >
//             {loading ? (
//               <View style={styles.loadingContainer}>
//                 <ActivityIndicator color="white" size="small" />
//                 <Text style={styles.submitButtonText}>Posting...</Text>
//               </View>
//             ) : (
//               <View style={styles.submitButtonContent}>
//                 <Send size={18} color="white" />
//                 <Text style={styles.submitButtonText}>Post Item</Text>
//               </View>
//             )}
//           </TouchableOpacity>
//         </ScrollView>
//       </Animated.View>
//     </KeyboardAvoidingView>
//   );
// };



























import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Edit3, 
  MapPin, 
  Calendar, 
  X, 
  Check, 
  PartyPopper, 
  Camera, 
  Trash2, 
  Send 
} from 'lucide-react-native';
import ConnectionAPI from '../api/connectionService'; // Adjust path as needed

const LostFoundPost = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('lost');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));

  const router = useRouter();

  const statusOptions = [
    { key: 'lost', label: 'Lost', icon: X, color: '#ff6b6b' },
    { key: 'found', label: 'Found', icon: Check, color: '#4ecdc4' },
    { key: 'claimed', label: 'Claimed', icon: PartyPopper, color: '#45b7d1' }
  ];

  useEffect(() => {
    // Set today's date as default
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setDate(formattedDate);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Request camera permissions
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to upload images.');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!date.trim()) newErrors.date = 'Date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const handleBack = () => {
    router.push('/auth/dashboard');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);

    const postData = {
      title: title.trim(),
      description: description.trim(),
      status,
      location: location.trim(),
      date,
      image: image ? `data:image/jpeg;base64,${image.base64}` : null,
    };

    // Debug: Log the data being sent (remove in production)
    console.log('Sending data:', {
      ...postData,
      image: image ? 'base64 data present' : null // Don't log actual base64
    });

    try {
      await ConnectionAPI.createLostFoundItem(postData);

      Alert.alert(
        'Success! 🎉',
        'Your item has been posted successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/auth/dashboard'),
          },
        ]
      );

      // Reset form
      setTitle('');
      setDescription('');
      setStatus('lost');
      setLocation('');
      setDate(new Date().toISOString().split('T')[0]);
      setImage(null);
      setErrors({});

    } catch (error) {
      console.error('Post failed:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        
        Alert.alert(
          'Error',
          `Server error (${error.response.status}): ${JSON.stringify(error.response.data)}`
        );
      } else if (error.request) {
        console.error('Request error:', error.request);
        Alert.alert('Error', 'Network error. Please check your connection.');
      } else {
        console.error('Error:', error.message);
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStatusButton = (option) => {
    const IconComponent = option.icon;
    return (
      <TouchableOpacity
        key={option.key}
        onPress={() => setStatus(option.key)}
        style={[
          styles.statusButton,
          {
            backgroundColor: status === option.key ? option.color : 'white',
            borderColor: option.color,
          }
        ]}
        activeOpacity={0.7}
      >
        <IconComponent 
          size={16} 
          color={status === option.key ? 'white' : option.color} 
          style={styles.statusIcon}
        />
        <Text style={[
          styles.statusText,
          { color: status === option.key ? 'white' : option.color }
        ]}>
          {option.label.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderInput = (placeholder, value, onChangeText, multiline = false, error = null, icon = null) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelWithIcon}>
        {icon && React.createElement(icon, { size: 18, color: '#333' })}
        <Text style={styles.label}>
          {placeholder} <Text style={styles.required}>*</Text>
        </Text>
      </View>
      <TextInput
        placeholder={`Enter ${placeholder.toLowerCase()}...`}
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.input,
          multiline && styles.textArea,
          error && styles.inputError
        ]}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        placeholderTextColor="#999"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Back Button */}
      <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
        <ArrowLeft size={24} color="#007bff" />
        <Text style={styles.backButtonText}>Dashboard</Text>
      </TouchableOpacity>
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <Edit3 size={28} color="#007bff" />
            </View>
            <Text style={styles.headerTitle}>Post Lost & Found Item</Text>
            <Text style={styles.headerSubtitle}>
              Help others find their lost items or return found items
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {renderInput('Title', title, setTitle, false, errors.title, Edit3)}
            {renderInput('Description', description, setDescription, true, errors.description)}
            {renderInput('Location', location, setLocation, false, errors.location, MapPin)}

            {/* Date Input */}
            <View style={styles.inputContainer}>
              <View style={styles.labelWithIcon}>
                <Calendar size={18} color="#333" />
                <Text style={styles.label}>
                  Date <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <TextInput
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
                style={[styles.input, errors.date && styles.inputError]}
                placeholderTextColor="#999"
              />
              {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
            </View>

            {/* Status Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Status <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.statusContainer}>
                {statusOptions.map(renderStatusButton)}
              </View>
            </View>

            {/* Image Upload */}
            <View style={styles.inputContainer}>
              <View style={styles.labelWithIcon}>
                <Camera size={18} color="#333" />
                <Text style={styles.label}>Image (Optional)</Text>
              </View>
              
              {!image ? (
                <TouchableOpacity onPress={pickImage} style={styles.imageUploadButton}>
                  <Camera size={32} color="#6c757d" style={styles.imageUploadIcon} />
                  <Text style={styles.imageUploadText}>Choose Image</Text>
                  <Text style={styles.imageUploadSubtext}>Tap to select from gallery</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                  <View style={styles.imageActions}>
                    <TouchableOpacity onPress={pickImage} style={styles.changeImageButton}>
                      <Camera size={14} color="white" />
                      <Text style={styles.changeImageText}>Change Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={removeImage} style={styles.removeImageButton}>
                      <Trash2 size={14} color="white" />
                      <Text style={styles.removeImageText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.submitButtonText}>Posting...</Text>
              </View>
            ) : (
              <View style={styles.submitButtonContent}>
                <Send size={18} color="white" />
                <Text style={styles.submitButtonText}>Post Item</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  headerIconContainer: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  required: {
    color: '#ff6b6b',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageUploadButton: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imageUploadIcon: {
    marginBottom: 8,
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  imageUploadSubtext: {
    fontSize: 12,
    color: '#6c757d',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6c757d',
    borderRadius: 8,
  },
  changeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
  },
  removeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  submitButton: {
    backgroundColor: '#007bff',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default LostFoundPost;























































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   TextInput,
//   Text,
//   StyleSheet,
//   Image,
//   TouchableOpacity,
//   Alert,
//   ScrollView,
//   StatusBar,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Animated
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { useRouter } from 'expo-router';

// const LostFoundPost = () => {
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [status, setStatus] = useState('lost');
//   const [location, setLocation] = useState('');
//   const [date, setDate] = useState('');
//   const [image, setImage] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [fadeAnim] = useState(new Animated.Value(0));

//   const router = useRouter();

//   const statusOptions = [
//     { key: 'lost', label: 'Lost', icon: '❌', color: '#ff6b6b' },
//     { key: 'found', label: 'Found', icon: '✅', color: '#4ecdc4' },
//     { key: 'claimed', label: 'Claimed', icon: '🎉', color: '#45b7d1' }
//   ];

//   useEffect(() => {
//     // Set today's date as default
//     const today = new Date();
//     const formattedDate = today.toISOString().split('T')[0];
//     setDate(formattedDate);

//     // Fade in animation
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 800,
//       useNativeDriver: true,
//     }).start();

//     // Request camera permissions
//     requestPermissions();
//   }, []);

//   const requestPermissions = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission Required', 'We need camera roll permissions to upload images.');
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!title.trim()) newErrors.title = 'Title is required';
//     if (!description.trim()) newErrors.description = 'Description is required';
//     if (!location.trim()) newErrors.location = 'Location is required';
//     if (!date.trim()) newErrors.date = 'Date is required';

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const pickImage = async () => {
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 0.8,
//         base64: true,
//       });

//       if (!result.canceled) {
//         setImage(result.assets[0]);
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to pick image. Please try again.');
//     }
//   };

//   const removeImage = () => {
//     setImage(null);
//   };

//   // const handleSubmit = async () => {
//   //   if (!validateForm()) {
//   //     Alert.alert('Validation Error', 'Please fill in all required fields.');
//   //     return;
//   //   }

//   //   setLoading(true);

//   //   const postData = {
//   //     title: title.trim(),
//   //     description: description.trim(),
//   //     status,
//   //     location: location.trim(),
//   //     date,
//   //     image: image ? `data:image/jpeg;base64,${image.base64}` : null,
//   //   };

//   //   try {
//   //     const token = await AsyncStorage.getItem('access_token');
//   //     if (!token) {
//   //       throw new Error('No authentication token found');
//   //     }

//   //     await axios.post('http://127.0.0.1:8000/api/lost-found/', postData, {
//   //       headers: {
//   //         Authorization: `Bearer ${token}`,
//   //         'Content-Type': 'application/json',
//   //       },
//   //     });

//   //     Alert.alert(
//   //       'Success! 🎉',
//   //       'Your item has been posted successfully.',
//   //       [
//   //         {
//   //           text: 'OK',
//   //           onPress: () => router.back(),
//   //         },
//   //       ]
//   //     );

//   //     // Reset form
//   //     setTitle('');
//   //     setDescription('');
//   //     setStatus('lost');
//   //     setLocation('');
//   //     setDate(new Date().toISOString().split('T')[0]);
//   //     setImage(null);
//   //     setErrors({});

//   //   } catch (error) {
//   //     console.error('Post failed:', error);
//   //     Alert.alert(
//   //       'Error',
//   //       'Failed to post item. Please check your connection and try again.'
//   //     );
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };


//   // Replace your handleSubmit function with this version for better debugging

//   const handleSubmit = async () => {
//     if (!validateForm()) {
//       Alert.alert('Validation Error', 'Please fill in all required fields.');
//       return;
//     }

//     setLoading(true);

//     const postData = {
//       title: title.trim(),
//       description: description.trim(),
//       status,
//       location: location.trim(),
//       date,
//       image: image ? `data:image/jpeg;base64,${image.base64}` : null,
//     };

//     // Debug: Log the data being sent (remove in production)
//     console.log('Sending data:', {
//       ...postData,
//       image: image ? 'base64 data present' : null // Don't log actual base64
//     });

//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const response = await axios.post('http://127.0.0.1:8000/api/lost-found/', postData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       Alert.alert(
//         'Success! 🎉',
//         'Your item has been posted successfully.',
//         [
//           {
//             text: 'OK',
//             onPress: () => router.back(),
//           },
//         ]
//       );

//       // Reset form
//       setTitle('');
//       setDescription('');
//       setStatus('lost');
//       setLocation('');
//       setDate(new Date().toISOString().split('T')[0]);
//       setImage(null);
//       setErrors({});

//     } catch (error) {
//       console.error('Post failed:', error);
      
//       // More detailed error logging
//       if (error.response) {
//         console.error('Response data:', error.response.data);
//         console.error('Response status:', error.response.status);
//         console.error('Response headers:', error.response.headers);
        
//         Alert.alert(
//           'Error',
//           `Server error (${error.response.status}): ${JSON.stringify(error.response.data)}`
//         );
//       } else if (error.request) {
//         console.error('Request error:', error.request);
//         Alert.alert('Error', 'Network error. Please check your connection.');
//       } else {
//         console.error('Error:', error.message);
//         Alert.alert('Error', error.message);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };












//   const renderStatusButton = (option) => (
//     <TouchableOpacity
//       key={option.key}
//       onPress={() => setStatus(option.key)}
//       style={[
//         styles.statusButton,
//         {
//           backgroundColor: status === option.key ? option.color : 'white',
//           borderColor: option.color,
//         }
//       ]}
//       activeOpacity={0.7}
//     >
//       <Text style={styles.statusIcon}>{option.icon}</Text>
//       <Text style={[
//         styles.statusText,
//         { color: status === option.key ? 'white' : option.color }
//       ]}>
//         {option.label.toUpperCase()}
//       </Text>
//     </TouchableOpacity>
//   );

//   const renderInput = (placeholder, value, onChangeText, multiline = false, error = null) => (
//     <View style={styles.inputContainer}>
//       <Text style={styles.label}>
//         {placeholder} <Text style={styles.required}>*</Text>
//       </Text>
//       <TextInput
//         placeholder={`Enter ${placeholder.toLowerCase()}...`}
//         value={value}
//         onChangeText={onChangeText}
//         style={[
//           styles.input,
//           multiline && styles.textArea,
//           error && styles.inputError
//         ]}
//         multiline={multiline}
//         numberOfLines={multiline ? 4 : 1}
//         placeholderTextColor="#999"
//       />
//       {error && <Text style={styles.errorText}>{error}</Text>}
//     </View>
//   );

//   return (
//     <KeyboardAvoidingView 
//       style={styles.container} 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
//       <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
//         <ScrollView 
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.scrollContainer}
//         >
//           {/* Header */}
//           <View style={styles.header}>
//             <Text style={styles.headerTitle}>📝 Post Lost & Found Item</Text>
//             <Text style={styles.headerSubtitle}>
//               Help others find their lost items or return found items
//             </Text>
//           </View>

//           {/* Form */}
//           <View style={styles.form}>
//             {renderInput('Title', title, setTitle, false, errors.title)}
//             {renderInput('Description', description, setDescription, true, errors.description)}
//             {renderInput('Location', location, setLocation, false, errors.location)}

//             {/* Date Input */}
//             <View style={styles.inputContainer}>
//               <Text style={styles.label}>
//                 Date <Text style={styles.required}>*</Text>
//               </Text>
//               <TextInput
//                 placeholder="YYYY-MM-DD"
//                 value={date}
//                 onChangeText={setDate}
//                 style={[styles.input, errors.date && styles.inputError]}
//                 placeholderTextColor="#999"
//               />
//               {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
//             </View>

//             {/* Status Selection */}
//             <View style={styles.inputContainer}>
//               <Text style={styles.label}>
//                 Status <Text style={styles.required}>*</Text>
//               </Text>
//               <View style={styles.statusContainer}>
//                 {statusOptions.map(renderStatusButton)}
//               </View>
//             </View>

//             {/* Image Upload */}
//             <View style={styles.inputContainer}>
//               <Text style={styles.label}>Image (Optional)</Text>
              
//               {!image ? (
//                 <TouchableOpacity onPress={pickImage} style={styles.imageUploadButton}>
//                   <Text style={styles.imageUploadIcon}>📷</Text>
//                   <Text style={styles.imageUploadText}>Choose Image</Text>
//                   <Text style={styles.imageUploadSubtext}>Tap to select from gallery</Text>
//                 </TouchableOpacity>
//               ) : (
//                 <View style={styles.imagePreviewContainer}>
//                   <Image source={{ uri: image.uri }} style={styles.imagePreview} />
//                   <View style={styles.imageActions}>
//                     <TouchableOpacity onPress={pickImage} style={styles.changeImageButton}>
//                       <Text style={styles.changeImageText}>📷 Change Image</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity onPress={removeImage} style={styles.removeImageButton}>
//                       <Text style={styles.removeImageText}>🗑️ Remove</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               )}
//             </View>
//           </View>

//           {/* Submit Button */}
//           <TouchableOpacity
//             onPress={handleSubmit}
//             style={[styles.submitButton, loading && styles.submitButtonDisabled]}
//             disabled={loading}
//             activeOpacity={0.8}
//           >
//             {loading ? (
//               <View style={styles.loadingContainer}>
//                 <ActivityIndicator color="white" size="small" />
//                 <Text style={styles.submitButtonText}>Posting...</Text>
//               </View>
//             ) : (
//               <Text style={styles.submitButtonText}>📤 Post Item</Text>
//             )}
//           </TouchableOpacity>
//         </ScrollView>
//       </Animated.View>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   content: {
//     flex: 1,
//   },
//   scrollContainer: {
//     paddingBottom: 100,
//   },
//   header: {
//     backgroundColor: 'white',
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#212529',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   form: {
//     backgroundColor: 'white',
//     marginHorizontal: 20,
//     marginTop: 20,
//     borderRadius: 16,
//     padding: 20,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   inputContainer: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//   },
//   required: {
//     color: '#ff6b6b',
//   },
//   input: {
//     borderWidth: 2,
//     borderColor: '#e0e0e0',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     fontSize: 16,
//     backgroundColor: '#fff',
//     color: '#333',
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   inputError: {
//     borderColor: '#ff6b6b',
//   },
//   errorText: {
//     color: '#ff6b6b',
//     fontSize: 12,
//     marginTop: 4,
//   },
//   statusContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 8,
//   },
//   statusButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 8,
//     borderRadius: 12,
//     borderWidth: 2,
//   },
//   statusIcon: {
//     fontSize: 14,
//     marginRight: 4,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   imageUploadButton: {
//     borderWidth: 2,
//     borderColor: '#e0e0e0',
//     borderRadius: 12,
//     borderStyle: 'dashed',
//     paddingVertical: 40,
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   imageUploadIcon: {
//     fontSize: 32,
//     marginBottom: 8,
//   },
//   imageUploadText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 4,
//   },
//   imageUploadSubtext: {
//     fontSize: 12,
//     color: '#6c757d',
//   },
//   imagePreviewContainer: {
//     alignItems: 'center',
//   },
//   imagePreview: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//     marginBottom: 12,
//   },
//   imageActions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   changeImageButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     backgroundColor: '#6c757d',
//     borderRadius: 8,
//   },
//   changeImageText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   removeImageButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     backgroundColor: '#ff6b6b',
//     borderRadius: 8,
//   },
//   removeImageText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   submitButton: {
//     backgroundColor: '#007bff',
//     marginHorizontal: 20,
//     marginTop: 20,
//     paddingVertical: 16,
//     borderRadius: 12,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   submitButtonDisabled: {
//     backgroundColor: '#ccc',
//     elevation: 0,
//     shadowOpacity: 0,
//   },
//   submitButtonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//   },
// });

// export default LostFoundPost;


























































// import React, { useState } from 'react';
// import { View, TextInput, Button, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// // import axios from '../api';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const LostFoundPost = () => {
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [status, setStatus] = useState('lost');
//   const [location, setLocation] = useState('');
//   const [date, setDate] = useState('');
//   const [image, setImage] = useState(null);

//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({ base64: true });
//     if (!result.canceled) {
//       setImage(result.assets[0]);
//     }
//   };

//   const handleSubmit = async () => {
//     if (!title || !description || !location || !date) {
//       return Alert.alert('Fill all fields');
//     }

//     const postData = {
//       title,
//       description,
//       status,
//       location,
//       date,
//       image: image ? `data:image/jpeg;base64,${image.base64}` : null,
//     };

//     try {
//     //   await axios.post('/lost-found/', postData);

//         const token = await AsyncStorage.getItem('access_token');
//         if (!token) {
//         throw new Error('No authentication token found');
//         }

//         const response = await axios.post('http://127.0.0.1:8000/api/lost-found/', {
//         headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//         },
//         }); 

//       Alert.alert('Item posted!');
//       navigation.goBack();
//     } catch (error) {
//       console.error('Post failed:', error);
//       Alert.alert('Error posting item');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
//       <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} multiline />
//       <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={styles.input} />
//       <TextInput placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} style={styles.input} />

//       <View style={styles.statusButtons}>
//         {['lost', 'found', 'claimed'].map((s) => (
//           <TouchableOpacity key={s} onPress={() => setStatus(s)} style={[styles.statusButton, status === s && styles.statusActive]}>
//             <Text>{s.toUpperCase()}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <Button title="Pick Image" onPress={pickImage} />
//       {image && <Image source={{ uri: image.uri }} style={{ width: '100%', height: 200, marginTop: 10 }} />}
      
//       <Button title="Submit" onPress={handleSubmit} color="#007bff" />
//     </View>
//   );
// };

// export default LostFoundPost;

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 15 },
//   input: { borderWidth: 1, borderRadius: 6, padding: 10, marginBottom: 10 },
//   statusButtons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
//   statusButton: { padding: 10, borderWidth: 1, borderRadius: 6 },
//   statusActive: { backgroundColor: '#d0e6ff' },
// });
