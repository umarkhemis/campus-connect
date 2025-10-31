
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import mime from 'mime';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
};

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [secureConfirmText, setSecureConfirmText] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Validation states
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    course: '',
    year: '',
    password: '',
    confirmPassword: '',
  });
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const router = useRouter();

  // Animation on component mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'username':
        newErrors.username = value.length < 3 ? 'Username must be at least 3 characters' : '';
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        newErrors.email = !emailRegex.test(value) ? 'Please enter a valid email' : '';
        break;
      case 'course':
        newErrors.course = value.length < 2 ? 'Course name is required' : '';
        break;
      case 'year':
        const yearNum = parseInt(value);
        newErrors.year = !yearNum || yearNum < 1 || yearNum > 6 ? 'Enter valid year (1-6)' : '';
        break;
      case 'password':
        newErrors.password = value.length < 6 ? 'Password must be at least 6 characters' : '';
        break;
      case 'confirmPassword':
        newErrors.confirmPassword = value !== password ? 'Passwords do not match' : '';
        break;
    }
    
    setErrors(newErrors);
  };

  // const pickImage = async () => {
  //   try {
  //     // Show action sheet for image source selection
  //     Alert.alert(
  //       'Select Profile Picture',
  //       'Choose your profile picture source',
  //       [
  //         { text: 'Camera', onPress: () => openCamera() },
  //         { text: 'Gallery', onPress: () => openGallery() },
  //         { text: 'Cancel', style: 'cancel' },
  //       ]
  //     );
  //   } catch (error) {
  //     console.error('Error in pickImage:', error);
  //     Alert.alert('Error', 'Failed to open image picker');
  //   }
  // };

  // const openCamera = async () => {
  //   const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
  //   if (permissionResult.granted === false) {
  //     Alert.alert('Permission Required', 'Camera permission is required!');
  //     return;
  //   }

  //   const result = await ImagePicker.launchCameraAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     quality: 0.7,
  //     base64: true,
  //   });

  //   handleImageResult(result);
  // };

  // const openGallery = async () => {
  //   const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
  //   if (permissionResult.granted === false) {
  //     Alert.alert('Permission Required', 'Permission to access gallery is required!');
  //     return;
  //   }

  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     quality: 0.7,
  //     base64: true,
  //   });

  //   handleImageResult(result);
  // };

  // const handleImageResult = async (result: any) => {
  //   if (!result.canceled && result.assets && result.assets.length > 0) {
  //     const asset = result.assets[0];
  //     const uri = asset.uri;
      
  //     let base64;
      
  //     if (Platform.OS === 'web') {
  //       base64 = asset.base64 || await convertUriToBase64(uri);
  //     } else {
  //       try {
  //         base64 = await FileSystem.readAsStringAsync(uri, {
  //           encoding: FileSystem.EncodingType.Base64,
  //         });
  //       } catch (fileError) {
  //         console.error('Error reading file:', fileError);
  //         Alert.alert('Error', 'Failed to process the image');
  //         return;
  //       }
  //     }
      
  //     setProfileImageBase64(base64);
  //     setProfileImage(uri);
  //   }
  // };

  // const convertUriToBase64 = async (uri: string): Promise<string> => {
  //   try {
  //     const response = await fetch(uri);
  //     const blob = await response.blob();
  //     return new Promise((resolve, reject) => {
  //       const reader = new FileReader();
  //       reader.onloadend = () => {
  //         const base64String = reader.result?.toString().split(',')[1];
  //         resolve(base64String || '');
  //       };
  //       reader.onerror = reject;
  //       reader.readAsDataURL(blob);
  //     });
  //   } catch (error) {
  //     console.error('Error converting to base64:', error);
  //     throw error;
  //   }
  // };


  // Replace your pickImage, openCamera, and openGallery functions with these fixed versions:

  const pickImage = async () => {
    try {
      console.log('pickImage called'); // Debug log
      
      // For web platform, directly open gallery
      if (Platform.OS === 'web') {
        console.log('Web platform detected, opening gallery directly');
        await openGallery();
        return;
      }

      // Show action sheet for mobile platforms
      Alert.alert(
        'Select Profile Picture',
        'Choose your profile picture source',
        [
          { 
            text: 'Camera', 
            onPress: () => {
              console.log('Camera selected');
              openCamera();
            }
          },
          { 
            text: 'Gallery', 
            onPress: () => {
              console.log('Gallery selected');
              openGallery();
            }
          },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error in pickImage:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const openCamera = async () => {
    try {
      console.log('Opening camera...');
      
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos!');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.7,
        base64: true,
      });

      console.log('Camera result:', result);
      handleImageResult(result);
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
    }
  };

  const openGallery = async () => {
    try {
      console.log('Opening gallery...');
      
      // For web, we don't need permissions
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Gallery permission result:', permissionResult);
        
        if (permissionResult.granted === false) {
          Alert.alert('Permission Required', 'Permission to access photo library is required!');
          return;
        }
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.7,
        base64: true,
      });

      console.log('Gallery result:', result);
      handleImageResult(result);
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Gallery Error', 'Failed to open photo library. Please try again.');
    }
  };

  // Also update your handleImageResult function with better error handling:
  const handleImageResult = async (result: any) => {
    try {
      console.log('Processing image result:', result);
      
      // Check if user cancelled
      if (result.canceled) {
        console.log('User cancelled image selection');
        return;
      }

      // Check if we have assets
      if (!result.assets || result.assets.length === 0) {
        console.log('No assets found in result');
        Alert.alert('Error', 'No image selected');
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      console.log('Selected image URI:', uri);
      
      let base64;
      
      if (Platform.OS === 'web') {
        // For web platform
        base64 = asset.base64;
        if (!base64) {
          console.log('Converting web URI to base64...');
          base64 = await convertUriToBase64(uri);
        }
      } else {
        // For mobile platforms
        try {
          console.log('Reading file as base64...');
          base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (fileError) {
          console.error('Error reading file:', fileError);
          Alert.alert('Error', 'Failed to process the selected image');
          return;
        }
      }
      
      if (!base64) {
        Alert.alert('Error', 'Failed to process the image');
        return;
      }

      console.log('Base64 length:', base64.length);
      setProfileImageBase64(base64);
      setProfileImage(uri);
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error handling image result:', error);
      Alert.alert('Error', 'Failed to process the selected image');
    }
  };

  const convertUriToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result?.toString().split(',')[1];
          resolve(base64String || '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw error;
    }
  };





  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { text: 'Weak', color: '#ff4757' };
      case 2:
        return { text: 'Fair', color: '#ffa502' };
      case 3:
        return { text: 'Good', color: '#2ed573' };
      case 4:
        return { text: 'Strong', color: '#1e90ff' };
      default:
        return { text: '', color: '#ccc' };
    }
  };

  const handleRegister = async () => {
    // Validate all fields
    validateField('username', username);
    validateField('email', email);
    validateField('course', course);
    validateField('year', year);
    validateField('password', password);
    validateField('confirmPassword', confirmPassword);

    // Check if any errors exist
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors || !username?.trim() || !email?.trim() || !course?.trim() || !year?.trim() || !password?.trim()) {
      Alert.alert('Error', 'Please fix all errors and fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const getBaseUrl = () => {
        if (Platform.OS === 'web') {
          return 'http://localhost:8000';
        } else if (Platform.OS === 'android') {
          // return 'http://10.0.2.2:8000';
          // return 'http://10.22.3.34:8000';
          // return 'http://192.168.220.16:8000';
          return 'http://192.168.130.16:8000';
        } else {
          return 'http://localhost:8000';
        }
      };

      const payload = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        course: course.trim(),
        year: year.trim(),
        profile_picture_base64: profileImageBase64 || null,
      };

      const response = await axios.post(`${getBaseUrl()}/api/register/`, payload, {
        headers: { 
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      setLoading(false);
      Alert.alert(
        'Success! 🎉',
        'Your account has been created successfully!',
        [
          {
            text: 'Continue to Login',
            onPress: () => {
              // Reset form
              setUsername('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setCourse('');
              setYear('');
              setProfileImage(null);
              setProfileImageBase64(null);
              setErrors({
                username: '',
                email: '',
                course: '',
                year: '',
                password: '',
                confirmPassword: '',
              });
              
              router.push('/login');
            }
          }
        ]
      );
      router.push('/login');

    } catch (error: any) {
      setLoading(false);
      console.log(error.response?.data);
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      
      if (error.response) {
        errorMessage = error.response.data?.detail || 
                      error.response.data?.message || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      }
      
      Alert.alert('Registration Failed', errorMessage);
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Join CampusConnect</Text>
              <Text style={styles.subtitle}>Create your student account</Text>
            </View>

            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {profileImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: profileImage }} style={styles.image} />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={20} color="#fff" />
                  </View>
                </View>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="person-add" size={40} color="#667eea" />
                  <Text style={styles.placeholderText}>Add Profile Picture</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
                <Ionicons name="person-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  placeholder="Username"
                  style={styles.input}
                  onChangeText={(text) => {
                    setUsername(text);
                    validateField('username', text);
                  }}
                  value={username}
                  autoCapitalize="none"
                />
              </View>
              {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

              <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
                <Ionicons name="mail-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  placeholder="Email"
                  style={styles.input}
                  onChangeText={(text) => {
                    setEmail(text);
                    validateField('email', text);
                  }}
                  keyboardType="email-address"
                  value={email}
                  autoCapitalize="none"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

              <View style={[styles.inputWrapper, errors.course ? styles.inputError : null]}>
                <Ionicons name="school-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  placeholder="Course/Program"
                  style={styles.input}
                  onChangeText={(text) => {
                    setCourse(text);
                    validateField('course', text);
                  }}
                  value={course}
                />
              </View>
              {errors.course ? <Text style={styles.errorText}>{errors.course}</Text> : null}

              <View style={[styles.inputWrapper, errors.year ? styles.inputError : null]}>
                <Ionicons name="calendar-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  placeholder="Year of Study"
                  style={styles.input}
                  onChangeText={(text) => {
                    setYear(text);
                    validateField('year', text);
                  }}
                  value={year}
                  keyboardType="numeric"
                />
              </View>
              {errors.year ? <Text style={styles.errorText}>{errors.year}</Text> : null}

              <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  style={styles.input}
                  secureTextEntry={secureText}
                  onChangeText={(text) => {
                    setPassword(text);
                    validateField('password', text);
                  }}
                  value={password}
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                  <Ionicons name={secureText ? 'eye-off' : 'eye'} size={20} color="#667eea" />
                </TouchableOpacity>
              </View>
              {password.length > 0 && (
                <View style={styles.passwordStrength}>
                  <Text style={[styles.strengthText, { color: strengthInfo.color }]}>
                    Password Strength: {strengthInfo.text}
                  </Text>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3, 4].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthSegment,
                          level <= passwordStrength ? { backgroundColor: strengthInfo.color } : null
                        ]}
                      />
                    ))}
                  </View>
                </View>
              )}
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

              <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
                <TextInput
                  placeholder="Confirm Password"
                  style={styles.input}
                  secureTextEntry={secureConfirmText}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    validateField('confirmPassword', text);
                  }}
                  value={confirmPassword}
                />
                <TouchableOpacity onPress={() => setSecureConfirmText(!secureConfirmText)} style={styles.eyeIcon}>
                  <Ionicons name={secureConfirmText ? 'eye-off' : 'eye'} size={20} color="#667eea" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <Text style={styles.linkTextBold}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  placeholderContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8f9ff',
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#667eea',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  // inputWrapper: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   backgroundColor:

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e1e8ff',
  },
  inputError: {
    borderColor: '#ff4757',
    backgroundColor: '#fff5f5',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  passwordStrength: {
    marginBottom: 10,
  },
  strengthText: {
    fontSize: 12,
    marginBottom: 5,
    fontWeight: '500',
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 3,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#e1e8ff',
    borderRadius: 2,
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a5b3f0',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 16,
  },
  linkTextBold: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
























































// import React, { useState } from 'react';
// import { View, Text, TextInput, Platform, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
// import axios from 'axios';
// import * as ImagePicker from 'expo-image-picker';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import mime from 'mime';
// import * as FileSystem from 'expo-file-system';

// import type { StackNavigationProp } from '@react-navigation/stack';

// type RootStackParamList = {
//   Login: undefined;
//   Register: undefined;
// };

// type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

// interface RegisterScreenProps {
//   navigation: RegisterScreenNavigationProp;
// }

// const RegisterScreen = () => {
//   const [username, setUsername] = useState('');
//   const [email, setEmail] = useState('');
//   const [course, setCourse] = useState('');
//   const [year, setYear] = useState('');
//   const [password, setPassword] = useState('');
//   const [secureText, setSecureText] = useState(true);
//   const [profileImage, setProfileImage] = useState<string | null>(null);
//   const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null); // THIS WAS MISSING!
//   const [loading, setLoading] = useState(false);

//   const router = useRouter();

//   const pickImage = async () => {
//     try {
//       // Request permissions for camera roll access
//       const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
//       if (permissionResult.granted === false) {
//         Alert.alert('Permission Required', 'Permission to access camera roll is required!');
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         quality: 0.7,
//         base64: true, // This will include base64 in the result
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         const asset = result.assets[0];
//         const uri = asset.uri;
        
//         // For web, we can use the base64 directly from the result
//         // For mobile, we might need to read the file
//         let base64;
        
//         if (Platform.OS === 'web') {
//           // On web, the base64 might be included in the result
//           base64 = asset.base64 || await convertUriToBase64(uri);
//         } else {
//           // On mobile, read the file as base64
//           try {
//             base64 = await FileSystem.readAsStringAsync(uri, {
//               encoding: FileSystem.EncodingType.Base64,
//             });
//           } catch (fileError) {
//             console.error('Error reading file:', fileError);
//             Alert.alert('Error', 'Failed to process the image');
//             return;
//           }
//         }
        
//         setProfileImageBase64(base64);
//         setProfileImage(uri); // for preview
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick image');
//     }
//   };

//   // Helper function for web base64 conversion
//   const convertUriToBase64 = async (uri: string): Promise<string> => {
//     try {
//       const response = await fetch(uri);
//       const blob = await response.blob();
//       return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onloadend = () => {
//           const base64String = reader.result?.toString().split(',')[1];
//           resolve(base64String || '');
//         };
//         reader.onerror = reject;
//         reader.readAsDataURL(blob);
//       });
//     } catch (error) {
//       console.error('Error converting to base64:', error);
//       throw error;
//     }
//   };

//   const handleRegister = async () => {
//     // Validate required fields
//     if (!username?.trim() || !email?.trim() || !course?.trim() || !year?.trim() || !password?.trim()) {
//       Alert.alert('Error', 'Please fill all fields');
//       return;
//     }

//     // Basic email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email.trim())) {
//       Alert.alert('Error', 'Please enter a valid email address');
//       return;
//     }

//     setLoading(true);

//     try {
//       // Determine the base URL based on platform
//       const getBaseUrl = () => {
//         if (Platform.OS === 'web') {
//           return 'http://localhost:8000'; // or your web server URL
//         } else if (Platform.OS === 'android') {
//           return 'http://10.0.2.2:8000'; // Android emulator
//         } else {
//           return 'http://localhost:8000'; // iOS simulator
//         }
//       };

//       const payload = {
//         username: username.trim(),
//         email: email.trim().toLowerCase(),
//         password,
//         course: course.trim(),
//         year: year.trim(),
//         profile_picture_base64: profileImageBase64 || null, // handle case where no image is selected
//       };

//       const response = await axios.post(`${getBaseUrl()}/api/register/`, payload, {
//         headers: { 
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000, // 10 second timeout
//       });

//       setLoading(false);
//       Alert.alert('Success', 'Registration complete!', [
//         {
//           text: 'OK',
//           onPress: () => {
//             // Reset form if needed
//             setUsername('');
//             setEmail('');
//             setPassword('');
//             setCourse('');
//             setYear('');
//             setProfileImage(null);
//             setProfileImageBase64(null);
            
//             // Navigate to login
//             if (router && router.push) {
//               router.push('/login');
//             }
//           }
//         }
//       ]);
//        router.push('/login');

//     } catch (error: any) {
//       setLoading(false);
//       console.log(error.response?.data);
//       console.error('Registration error:', error);
      
//       let errorMessage = 'Registration failed';
      
//       if (error.response) {
//         // Server responded with error status
//         errorMessage = error.response.data?.detail || 
//                       error.response.data?.message || 
//                       `Server error: ${error.response.status}`;
//       } else if (error.request) {
//         // Network error
//         errorMessage = 'Network error. Please check your connection.';
//       } else if (error.code === 'ECONNABORTED') {
//         // Timeout error
//         errorMessage = 'Request timeout. Please try again.';
//       }
      
//       Alert.alert('Error', errorMessage);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>CampusConnect Register</Text>

//       <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
//         {profileImage ? (
//           <Image source={{ uri: profileImage }} style={styles.image} />
//         ) : (
//           <Text>Select Profile Picture</Text>
//         )}
//       </TouchableOpacity>

//       <TextInput placeholder="Username" style={styles.input} onChangeText={setUsername} value={username} />
//       <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} keyboardType="email-address" value={email} />
//       <TextInput placeholder="Course" style={styles.input} onChangeText={setCourse} value={course} />
//       <TextInput placeholder="Year" style={styles.input} onChangeText={setYear} value={year} />

//       <View style={styles.passwordContainer}>
//         <TextInput
//           placeholder="Password"
//           style={styles.passwordInput}
//           secureTextEntry={secureText}
//           onChangeText={setPassword}
//           value={password}
//         />
//         <TouchableOpacity onPress={() => setSecureText(!secureText)}>
//           <Ionicons name={secureText ? 'eye-off' : 'eye'} size={24} color="gray" />
//         </TouchableOpacity>
//       </View>

//       <TouchableOpacity style={styles.button} onPress={handleRegister}>
//         {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
//       </TouchableOpacity>

//       <TouchableOpacity onPress={() => router.push('/login')}>
//         <Text style={styles.linkText}>Already have an account? Login</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default RegisterScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', padding: 20 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
//   input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
//   imagePicker: { alignItems: 'center', marginBottom: 10 },
//   image: { width: 80, height: 80, borderRadius: 40 },
//   passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginBottom: 10 },
//   passwordInput: { flex: 1, paddingVertical: 10 },
//   button: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
//   buttonText: { color: '#fff', fontWeight: 'bold' },
//   linkText: { textAlign: 'center', color: '#007bff' },
// });


















































// import React, { useState } from 'react';
// import { View, Text, TextInput, Platform, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
// import axios from 'axios';
// import * as ImagePicker from 'expo-image-picker';
// import { Ionicons } from '@expo/vector-icons';
// // import { Platform, Alert } from 'react-native';
// import { useRouter } from 'expo-router';
// import mime from 'mime';
// import * as FileSystem from 'expo-file-system';
// // import * as ImagePicker from 'expo-image-picker';
// //   import * as FileSystem from 'expo-file-system';

// import type { StackNavigationProp } from '@react-navigation/stack';

// type RootStackParamList = {
//   Login: undefined;
//   Register: undefined;
// };

// type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

// interface RegisterScreenProps {
//   navigation: RegisterScreenNavigationProp;
// }

// const RegisterScreen = () => {
//   const [username, setUsername] = useState('');
//   const [email, setEmail] = useState('');
//   const [course, setCourse] = useState('');
//   const [year, setYear] = useState('');
//   const [password, setPassword] = useState('');
//   const [secureText, setSecureText] = useState(true);
//   const [profileImage, setProfileImage] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   const router = useRouter();

 

//   const pickImage = async () => {
//     try {
//       // Request permissions for camera roll access
//       const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
//       if (permissionResult.granted === false) {
//         Alert.alert('Permission Required', 'Permission to access camera roll is required!');
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         quality: 0.7,
//         base64: true, // This will include base64 in the result
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         const asset = result.assets[0];
//         const uri = asset.uri;
        
//         // For web, we can use the base64 directly from the result
//         // For mobile, we might need to read the file
//         let base64;
        
//         if (Platform.OS === 'web') {
//           // On web, the base64 might be included in the result
//           base64 = asset.base64 || await convertUriToBase64(uri);
//         } else {
//           // On mobile, read the file as base64
//           try {
//             base64 = await FileSystem.readAsStringAsync(uri, {
//               encoding: FileSystem.EncodingType.Base64,
//             });
//           } catch (fileError) {
//             console.error('Error reading file:', fileError);
//             Alert.alert('Error', 'Failed to process the image');
//             return;
//           }
//         }
        
//         setProfileImageBase64(base64);
//         setProfileImage(uri); // for preview
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick image');
//     }
//   };

//   // Helper function for web base64 conversion
//   const convertUriToBase64 = async (uri) => {
//     try {
//       const response = await fetch(uri);
//       const blob = await response.blob();
//       return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onloadend = () => {
//           const base64String = reader.result?.toString().split(',')[1];
//           resolve(base64String);
//         };
//         reader.onerror = reject;
//         reader.readAsDataURL(blob);
//       });
//     } catch (error) {
//       console.error('Error converting to base64:', error);
//       throw error;
//     }
//   };

//   const handleRegister = async () => {
//     // Validate required fields
//     if (!username?.trim() || !email?.trim() || !course?.trim() || !year?.trim() || !password?.trim()) {
//       Alert.alert('Error', 'Please fill all fields');
//       return;
//     }

//     // Basic email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email.trim())) {
//       Alert.alert('Error', 'Please enter a valid email address');
//       return;
//     }

//     setLoading(true);

//     try {
//       // Determine the base URL based on platform
//       const getBaseUrl = () => {
//         if (Platform.OS === 'web') {
//           return 'http://localhost:8000'; // or your web server URL
//         } else if (Platform.OS === 'android') {
//           return 'http://10.0.2.2:8000'; // Android emulator
//         } else {
//           return 'http://localhost:8000'; // iOS simulator
//         }
//       };

//       const payload = {
//         username: username.trim(),
//         email: email.trim().toLowerCase(),
//         password,
//         course: course.trim(),
//         year: year.trim(),
//         profile_picture_base64: profileImageBase64 || null, // handle case where no image is selected
//       };

//       const response = await axios.post(`${getBaseUrl()}/api/register/`, payload, {
//         headers: { 
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000, // 10 second timeout
//       });

//       setLoading(false);
//       Alert.alert('Success', 'Registration complete!', [
//         {
//           text: 'OK',
//           onPress: () => {
//             // Reset form if needed
//             setUsername('');
//             setEmail('');
//             setPassword('');
//             setCourse('');
//             setYear('');
//             setProfileImage(null);
//             setProfileImageBase64(null);
            
//             // Navigate to login
//             if (router && router.push) {
//               router.push('/login');
//             }
//           }
//         }
//       ]);

//     } catch (error) {
//       setLoading(false);
//       console.error('Registration error:', error);
      
//       let errorMessage = 'Registration failed';
      
//       if (error.response) {
//         // Server responded with error status
//         errorMessage = error.response.data?.detail || 
//                       error.response.data?.message || 
//                       `Server error: ${error.response.status}`;
//       } else if (error.request) {
//         // Network error
//         errorMessage = 'Network error. Please check your connection.';
//       } else if (error.code === 'ECONNABORTED') {
//         // Timeout error
//         errorMessage = 'Request timeout. Please try again.';
//       }
      
//       Alert.alert('Error', errorMessage);
//     }
//   };










































//   // const pickImage = async () => {
//   //   let result = await ImagePicker.launchImageLibraryAsync({
//   //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
//   //     allowsEditing: true,
//   //     quality: 1,
//   //   });

//   //   if (!result.canceled) {
//   //     setProfileImage(result.assets[0].uri);
//   //   }
//   // };


  

//   // const pickImage = async () => {
//   //   const result = await ImagePicker.launchImageLibraryAsync({
//   //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
//   //     allowsEditing: true,
//   //     quality: 0.7,
//   //   });

//   //   if (!result.canceled) {
//   //     const uri = result.assets[0].uri;
//   //     const base64 = await FileSystem.readAsStringAsync(uri, {
//   //       encoding: FileSystem.EncodingType.Base64,
//   //     });
//   //     setProfileImageBase64(base64);  // this is the encoded image
//   //     setProfileImage(uri); // for preview
//   //   }
//   // };



//   // const handleRegister = async () => {
//   //   if (!username || !email || !course || !year || !password) {
//   //     return Alert.alert('Error', 'Please fill all fields');
//   //   }

//   //   setLoading(true);

//   //   try {
//   //     const payload = {
//   //       username,
//   //       email,
//   //       password,
//   //       course,
//   //       year,
//   //       profile_picture_base64: profileImageBase64,  // send base64 string
//   //     };

//   //     await axios.post('http://127.0.0.1:8000/api/register/', payload, {
//   //       headers: { 'Content-Type': 'application/json' },
//   //     });

//   //     setLoading(false);
//   //     Alert.alert('Success', 'Registration complete!');
//   //     router.push('/login');
//   //   } catch (error: any) {
//   //     setLoading(false);
//   //     Alert.alert('Error', error?.response?.data?.detail || 'Registration failed');
//   //   }
//   // };


















//   // const handleRegister = async () => {
//   //   if (!username || !email || !course || !year || !password) {
//   //     return Alert.alert('Error', 'Please fill all fields');
//   //   }

//   //   setLoading(true);

//   //   try {
//   //     const formData = {
//   //       username,
//   //       email,
//   //       password,
//   //       course,
//   //       year,
//   //     };

//   //     // Convert formData into JSON string and save it in a field
//   //     const fields = Object.keys(formData).map((key) => ({
//   //       name: key,
//   //       data: String(formData[key as keyof typeof formData]),
//   //     }));

//   //     // Prepare file if profileImage exists
//   //     const fileField = profileImage
//   //       ? [
//   //           {
//   //             name: 'profile_picture',
//   //             filename: profileImage.split('/').pop() || 'profile.jpg',
//   //             // type: Mime.getMimeType(profileImage) || 'image/jpeg',
//   //             type: mime.getType(profileImage) || 'image/jpeg',
//   //             uri: profileImage,
//   //           },
//   //         ]
//   //       : [];

//   //     const result = await FileSystem.uploadAsync(
//   //       'http://127.0.0.1:8000/api/register/',
//   //       profileImage || '', // any file URI just to trigger upload
//   //       {
//   //         fieldName: 'profile_picture',
//   //         httpMethod: 'POST',
//   //         uploadType: FileSystem.FileSystemUploadType.MULTIPART,
//   //         parameters: formData,
//   //         // mimeType: mime.getMimeType(profileImage) || 'image/jpeg',
//   //         type: mime.getType(profileImage) || 'image/jpeg',
//   //         headers: {
//   //           'Content-Type': 'multipart/form-data',
//   //         },
//   //       }
//   //     );

//   //     console.log(result.body); // the response from your backend

//   //     if (result.status === 200 || result.status === 201) {
//   //       setLoading(false);
//   //       Alert.alert('Success', 'Registration complete!');
//   //       router.push('/login');
//   //     } else {
//   //       setLoading(false);
//   //       Alert.alert('Error', 'Registration failed.');
//   //     }
//   //   } catch (error) {
//   //     console.error(error);
//   //     setLoading(false);
//   //     Alert.alert('Error', 'Something went wrong');
//   //   }
//   // };









//   // const handleRegister = async () => {
//   //   if (!username || !email || !course || !year || !password) {
//   //     return Alert.alert('Error', 'Please fill all fields');
//   //   }

//   //   setLoading(true);

//   //   const formData = new FormData();
//   //   formData.append('username', username);
//   //   formData.append('email', email);
//   //   formData.append('password', password);
//   //   formData.append('course', course);
//   //   formData.append('year', year);

//   //   // if (profileImage) {
//   //   //   const filename = profileImage.split('/').pop() || 'profile.jpg';
//   //   //   const type = `image/${filename.split('.').pop()}`;
//   //   //   formData.append('profile_picture', {
//   //   //     uri: profileImage,
//   //   //     name: filename,
//   //   //     type,
//   //   //   });
//   //   // }


//   //   if (profileImage) {
//   //     const filename = profileImage.split('/').pop() || 'profile.jpg';
//   //     const type = `image/${filename.split('.').pop()}`;

//   //     formData.append('profile_picture', {
//   //       uri: profileImage,
//   //       name: filename,
//   //       type,
//   //     } as any); 
//   //   }

//   //   console.log("Profile Image URI:", profileImage);

//   //   try {

//   //     for (const pair of formData.entries()) {
//   //       console.log(`${pair[0]}: ${pair[1]}`);
//   //     }
//   //     await axios.post('http://127.0.0.1:8000/api/register/', formData, {
//   //       headers: { 'Content-Type': 'multipart/form-data' },
//   //     });
//   //     setLoading(false);
//   //     Alert.alert('Success', 'Registration complete!');
//   //     router.push('/login');
//   //   } catch (error) {
//   //     setLoading(false);
//   //     console.log(error.response?.data);
//   //     Alert.alert('Error', 'Registration failed');
//   //   }
//   // };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>CampusConnect Register</Text>

//       <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
//         {profileImage ? (
//           <Image source={{ uri: profileImage }} style={styles.image} />
//         ) : (
//           <Text>Select Profile Picture</Text>
//         )}
//       </TouchableOpacity>

//       <TextInput placeholder="Username" style={styles.input} onChangeText={setUsername} />
//       <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} keyboardType="email-address" />
//       <TextInput placeholder="Course" style={styles.input} onChangeText={setCourse} />
//       <TextInput placeholder="Year" style={styles.input} onChangeText={setYear} />

//       <View style={styles.passwordContainer}>
//         <TextInput
//           placeholder="Password"
//           style={styles.passwordInput}
//           secureTextEntry={secureText}
//           onChangeText={setPassword}
//         />
//         <TouchableOpacity onPress={() => setSecureText(!secureText)}>
//           <Ionicons name={secureText ? 'eye-off' : 'eye'} size={24} color="gray" />
//         </TouchableOpacity>
//       </View>

//       <TouchableOpacity style={styles.button} onPress={handleRegister}>
//         {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
//       </TouchableOpacity>

//       <TouchableOpacity onPress={() => router.push('/login')}>
//         <Text style={styles.linkText}>Already have an account? Login</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default RegisterScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', padding: 20 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
//   input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
//   imagePicker: { alignItems: 'center', marginBottom: 10 },
//   image: { width: 80, height: 80, borderRadius: 40 },
//   passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginBottom: 10 },
//   passwordInput: { flex: 1, paddingVertical: 10 },
//   button: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
//   buttonText: { color: '#fff', fontWeight: 'bold' },
//   linkText: { textAlign: 'center', color: '#007bff' },
// });
