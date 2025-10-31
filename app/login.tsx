

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   Dimensions,
//   ScrollView,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
// import ConnectionAPI from './api/connectionService'; 

// import type { StackNavigationProp } from '@react-navigation/stack';

// const { width, height } = Dimensions.get('window');

// type RootStackParamList = {
//   Dashboard: undefined;
//   Register: undefined;
// };

// type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

// interface LoginScreenProps {
//   navigation: LoginScreenNavigationProp;
// }

// const LoginScreen = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [secureText, setSecureText] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
  
//   // Enhanced validation states
//   const [errors, setErrors] = useState({
//     username: '',
//     password: '',
//     general: '',
//   });
  
//   // Animation values
//   const [fadeAnim] = useState(new Animated.Value(0));
//   const [slideAnim] = useState(new Animated.Value(50));
//   const [logoScale] = useState(new Animated.Value(0.8));
//   const [errorShake] = useState(new Animated.Value(0));

//   const router = useRouter();

//   const getBaseUrl = () => {
//     if (Platform.OS === 'web') {
//       return 'http://localhost:8000';
//     } else if (Platform.OS === 'android') {
//       return 'http://192.168.220.16:8000';
//       // return 'http://10.22.3.34:8000';
//       // return 'http://10.0.2.2:8000';
//     } else {
//       return 'http://10.22.3.34:8000';
//       // return 'http://127.0.0.1:8000';
//     }
//   };

//   // Animation on component mount
//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.spring(logoScale, {
//         toValue: 1,
//         tension: 50,
//         friction: 7,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Load saved credentials
//     loadSavedCredentials();
    
//     // Check if user is already authenticated
//     checkExistingAuth();
//   }, []);

//   const checkExistingAuth = async () => {
//     try {
//       const isAuth = await ConnectionAPI.isAuthenticated();
//       if (isAuth) {
//         // Try to get current user to verify token is still valid
//         const user = await ConnectionAPI.getCurrentUser();
//         if (user) {
//           console.log('User already authenticated, navigating to dashboard');
//           router.push('auth/dashboard');
//         }
//       }
//     } catch (error) {
//       console.log('No valid authentication found');
//       // Continue with login process
//     }
//   };

//   const loadSavedCredentials = async () => {
//     try {
//       const savedUsername = await AsyncStorage.getItem('saved_username');
//       const savedRememberMe = await AsyncStorage.getItem('remember_me');
      
//       if (savedRememberMe === 'true' && savedUsername) {
//         setUsername(savedUsername);
//         setRememberMe(true);
//       }
//     } catch (error) {
//       console.log('Error loading saved credentials:', error);
//     }
//   };

//   // Enhanced validation with better UX
//   const validateField = (field: string, value: string) => {
//     const newErrors = { ...errors };
    
//     switch (field) {
//       case 'username':
//         if (!value.trim()) {
//           newErrors.username = 'Username is required';
//         } else if (value.length < 3) {
//           newErrors.username = 'Username must be at least 3 characters';
//         } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
//           newErrors.username = 'Username can only contain letters, numbers, and underscores';
//         } else {
//           newErrors.username = '';
//         }
//         break;
//       case 'password':
//         if (!value) {
//           newErrors.password = 'Password is required';
//         } else if (value.length < 1) {
//           newErrors.password = 'Password cannot be empty';
//         } else {
//           newErrors.password = '';
//         }
//         break;
//     }
    
//     setErrors(newErrors);
//     return !newErrors[field as keyof typeof newErrors];
//   };

//   // Error shake animation
//   const shakeError = () => {
//     Animated.sequence([
//       Animated.timing(errorShake, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(errorShake, { toValue: -10, duration: 100, useNativeDriver: true }),
//       Animated.timing(errorShake, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(errorShake, { toValue: 0, duration: 100, useNativeDriver: true }),
//     ]).start();
//   };

//   // Enhanced error handling with better user feedback
//   const getErrorMessage = (error: any): string => {
//     console.error('Login error details:', error);

//     // Network connectivity issues
//     if (!error.response) {
//       if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
//         return 'Connection timeout. The server is taking too long to respond.';
//       }
//       if (error.code === 'NETWORK_ERROR' || error.message.includes('Network')) {
//         return 'Network error. Please check your internet connection and try again.';
//       }
//       if (error.message.includes('ECONNREFUSED')) {
//         return 'Cannot connect to server. Please check if the server is running.';
//       }
//       return 'Unable to connect to server. Please check your connection and try again.';
//     }

//     // Server response errors
//     const status = error.response.status;
//     const data = error.response.data;

//     switch (status) {
//       case 400:
//         if (data?.username) return `Username: ${data.username[0]}`;
//         if (data?.password) return `Password: ${data.password[0]}`;
//         if (data?.non_field_errors) return data.non_field_errors[0];
//         if (data?.detail) return data.detail;
//         return 'Invalid login credentials. Please check your username and password.';
      
//       case 401:
//         if (data?.detail?.includes('credentials')) {
//           return 'Invalid username or password. Please try again.';
//         }
//         return 'Authentication failed. Please check your credentials.';
      
//       case 403:
//         return 'Account access denied. Please contact support if this persists.';
      
//       case 404:
//         return 'Login service not found. Please contact support.';
      
//       case 429:
//         return 'Too many login attempts. Please wait a few minutes before trying again.';
      
//       case 500:
//         return 'Server error occurred. Please try again in a few moments.';
      
//       case 502:
//       case 503:
//       case 504:
//         return 'Server is temporarily unavailable. Please try again later.';
      
//       default:
//         return data?.message || data?.detail || `Server error (${status}). Please try again.`;
//     }
//   };

//   const handleLogin = async () => {
//     // Clear previous errors
//     setErrors({ username: '', password: '', general: '' });

//     // Validate inputs
//     const isUsernameValid = validateField('username', username);
//     const isPasswordValid = validateField('password', password);

//     if (!isUsernameValid || !isPasswordValid) {
//       shakeError();
//       return;
//     }

//     setLoading(true);

//     try {
//       const loginData = { 
//         username: username.trim(), 
//         password 
//       };

//       console.log('Attempting login for user:', username.trim());
      
//       const response = await axios.post(`${getBaseUrl()}/api/login/`, loginData, {
//         timeout: 15000, // Increased timeout for better UX
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
      
//       console.log('Login response:', response.data);

//       // Extract tokens from response
//       const { access, refresh } = response.data;
//       if (!access || !refresh) {
//         throw new Error('Invalid response format: missing tokens');
//       }

//       // Save credentials if remember me is checked
//       if (rememberMe) {
//         await AsyncStorage.setItem('saved_username', username.trim());
//         await AsyncStorage.setItem('remember_me', 'true');
//       } else {
//         await AsyncStorage.removeItem('saved_username');
//         await AsyncStorage.removeItem('remember_me');
//       }

//       // Fetch user profile first (optional)
//       let userData = null;
//       try {
//         console.log('Fetching user profile...');
//         const profileResponse = await axios.get(`${getBaseUrl()}/api/profile/`, {
//           headers: { Authorization: `Bearer ${access}` },
//           timeout: 10000,
//         });
//         userData = profileResponse.data;
//         console.log('User profile fetched successfully');
//       } catch (profileError) {
//         console.warn('Profile fetch failed, but login succeeded:', profileError);
//         // Don't fail login if profile fetch fails
//       }

//       // Use ConnectionAPI to handle login success
//       await ConnectionAPI.handleLoginSuccess(access, refresh, userData);

//       // Success animation before navigation
//       Animated.sequence([
//         Animated.timing(logoScale, {
//           toValue: 1.1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//         Animated.timing(logoScale, {
//           toValue: 1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//       ]).start(() => {
//         console.log('Login successful, navigating to dashboard');
//         router.push('auth/dashboard');
//       });
      
//     } catch (error: any) {
//       const errorMessage = getErrorMessage(error);
//       console.error('Login failed:', errorMessage);
      
//       setErrors(prev => ({ ...prev, general: errorMessage }));
//       shakeError();
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       await ConnectionAPI.handleLogout();
//       console.log('Logout successful');
//     } catch (error) {
//       console.error('Logout error:', error);
//     }
//   };

//   return (
//     <KeyboardAvoidingView 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.keyboardContainer}
//     >
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.gradient}
//       >
//         <ScrollView 
//           contentContainerStyle={styles.scrollContainer}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           <Animated.View 
//             style={[
//               styles.container,
//               {
//                 opacity: fadeAnim,
//                 transform: [
//                   { translateY: slideAnim },
//                   { translateX: errorShake }
//                 ]
//               }
//             ]}
//           >
//             <Animated.View 
//               style={[
//                 styles.logoContainer,
//                 { transform: [{ scale: logoScale }] }
//               ]}
//             >
//               <View style={styles.logo}>
//                 <Ionicons name="school" size={50} color="#667eea" />
//               </View>
//               <Text style={styles.title}>Welcome Back</Text>
//               <Text style={styles.subtitle}>Sign in to CampusConnect</Text>
//             </Animated.View>

//             {/* General error message */}
//             {errors.general ? (
//               <View style={styles.generalErrorContainer}>
//                 <Ionicons name="alert-circle" size={20} color="#e74c3c" />
//                 <Text style={styles.generalErrorText}>{errors.general}</Text>
//               </View>
//             ) : null}

//             <View style={styles.inputContainer}>
//               <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
//                 <Ionicons name="person-outline" size={20} color="#667eea" style={styles.inputIcon} />
//                 <TextInput
//                   placeholder="Username"
//                   style={styles.input}
//                   onChangeText={(text) => {
//                     setUsername(text);
//                     validateField('username', text);
//                     // Clear general error when user starts typing
//                     if (errors.general) {
//                       setErrors(prev => ({ ...prev, general: '' }));
//                     }
//                   }}
//                   value={username}
//                   autoCapitalize="none"
//                   placeholderTextColor="#999"
//                   editable={!loading}
//                 />
//               </View>
//               {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

//               <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
//                 <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
//                 <TextInput
//                   placeholder="Password"
//                   style={styles.input}
//                   onChangeText={(text) => {
//                     setPassword(text);
//                     validateField('password', text);
//                     // Clear general error when user starts typing
//                     if (errors.general) {
//                       setErrors(prev => ({ ...prev, general: '' }));
//                     }
//                   }}
//                   value={password}
//                   secureTextEntry={secureText}
//                   placeholderTextColor="#999"
//                   editable={!loading}
//                 />
//                 <TouchableOpacity 
//                   onPress={() => setSecureText(!secureText)} 
//                   style={styles.eyeIcon}
//                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                   disabled={loading}
//                 >
//                   <Ionicons name={secureText ? 'eye-off' : 'eye'} size={20} color="#667eea" />
//                 </TouchableOpacity>
//               </View>
//               {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
//             </View>

//             <View style={styles.optionsContainer}>
//               <TouchableOpacity 
//                 style={styles.rememberMeContainer} 
//                 onPress={() => setRememberMe(!rememberMe)}
//                 disabled={loading}
//               >
//                 <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
//                   {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
//                 </View>
//                 <Text style={styles.rememberMeText}>Remember me</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.forgotPassword}
//                 onPress={() => router.push('/change-password' as any)}
//                 disabled={loading}
//               >
//                 <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
//               </TouchableOpacity>
//             </View>

//             <TouchableOpacity 
//               style={[
//                 styles.button, 
//                 loading && styles.buttonDisabled
//               ]} 
//               onPress={handleLogin}
//               disabled={loading}
//             >
//               {loading ? (
//                 <View style={styles.loadingContainer}>
//                   <ActivityIndicator color="#fff" size="small" />
//                   <Text style={styles.loadingText}>Signing in...</Text>
//                 </View>
//               ) : (
//                 <Text style={styles.buttonText}>Sign In</Text>
//               )}
//             </TouchableOpacity>

//             <View style={styles.dividerContainer}>
//               <View style={styles.divider} />
//               <Text style={styles.dividerText}>or</Text>
//               <View style={styles.divider} />
//             </View>

//             <TouchableOpacity 
//               onPress={() => router.push('/register')} 
//               style={styles.linkContainer}
//               disabled={loading}
//             >
//               <Text style={styles.linkText}>Don't have an account? </Text>
//               <Text style={styles.linkTextBold}>Create Account</Text>
//             </TouchableOpacity>

//           </Animated.View>
//         </ScrollView>
//       </LinearGradient>
//     </KeyboardAvoidingView>
//   );
// };

// // Add your existing styles here
// const styles = StyleSheet.create({
//   keyboardContainer: {
//     flex: 1,
//   },
//   gradient: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     minHeight: height,
//   },
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 40,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginBottom: 40,
//   },
//   logo: {
//     width: 80,
//     height: 80,
//     backgroundColor: '#fff',
//     borderRadius: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#e8eaf6',
//     opacity: 0.9,
//   },
//   generalErrorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#ffe8e8',
//     borderColor: '#e74c3c',
//     borderWidth: 1,
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 20,
//   },
//   generalErrorText: {
//     color: '#e74c3c',
//     fontSize: 14,
//     marginLeft: 8,
//     flex: 1,
//   },
//   inputContainer: {
//     marginBottom: 20,
//   },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     marginBottom: 6,
//     paddingHorizontal: 15,
//     height: 55,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   inputError: {
//     borderColor: '#e74c3c',
//     borderWidth: 1,
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     color: '#333',
//   },
//   eyeIcon: {
//     padding: 5,
//   },
//   errorText: {
//     color: '#e74c3c',
//     fontSize: 12,
//     marginLeft: 15,
//     marginBottom: 10,
//   },
//   optionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   rememberMeContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   checkbox: {
//     width: 20,
//     height: 20,
//     borderWidth: 2,
//     borderColor: '#fff',
//     borderRadius: 4,
//     marginRight: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   checkboxChecked: {
//     backgroundColor: '#667eea',
//     borderColor: '#667eea',
//   },
//   rememberMeText: {
//     color: '#fff',
//     fontSize: 14,
//   },
//   forgotPassword: {
//     padding: 5,
//   },
//   forgotPasswordText: {
//     color: '#e8eaf6',
//     fontSize: 14,
//     textDecorationLine: 'underline',
//   },
//   button: {
//     backgroundColor: '#667eea',
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     shadowColor: '#667eea',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   buttonDisabled: {
//     opacity: 0.7,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 16,
//     marginLeft: 10,
//   },
//   dividerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 30,
//   },
//   divider: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#e8eaf6',
//     opacity: 0.5,
//   },
//   dividerText: {
//     color: '#e8eaf6',
//     paddingHorizontal: 20,
//     fontSize: 14,
//   },
//   linkContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 15,
//   },
//   linkText: {
//     color: '#e8eaf6',
//     fontSize: 16,
//   },
//   linkTextBold: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default LoginScreen;






























































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   Dimensions,
//   ScrollView,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';

// import type { StackNavigationProp } from '@react-navigation/stack';

// const { width, height } = Dimensions.get('window');

// type RootStackParamList = {
//   Dashboard: undefined;
//   Register: undefined;
// };

// type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

// interface LoginScreenProps {
//   navigation: LoginScreenNavigationProp;
// }

// // JWT Authentication Service
// class AuthService {
//   static async storeTokens(accessToken: string, refreshToken: string) {
//     try {
//       await AsyncStorage.setItem('access_token', accessToken);
//       await AsyncStorage.setItem('refresh_token', refreshToken);
//       console.log('Tokens stored successfully');
//     } catch (error) {
//       console.error('Error storing tokens:', error);
//       throw new Error('Failed to store authentication tokens');
//     }
//   }

//   static async getTokens() {
//     try {
//       const accessToken = await AsyncStorage.getItem('access_token');
//       const refreshToken = await AsyncStorage.getItem('refresh_token');
//       return { accessToken, refreshToken };
//     } catch (error) {
//       console.error('Error getting tokens:', error);
//       return { accessToken: null, refreshToken: null };
//     }
//   }

//   static async clearTokens() {
//     try {
//       await AsyncStorage.multiRemove([
//         'access_token', 
//         'refresh_token', 
//         'user_profile',
//         'currentUser',
//         'saved_username',
//         'remember_me'
//       ]);
//       console.log('All tokens and user data cleared');
//     } catch (error) {
//       console.error('Error clearing tokens:', error);
//     }
//   }

//   static async refreshAccessToken() {
//     const { refreshToken } = await this.getTokens();
//     if (!refreshToken) {
//       throw new Error('No refresh token available');
//     }

//     const getBaseUrl = () => {
//       if (Platform.OS === 'web') {
//         return 'http://localhost:8000';
//       } else if (Platform.OS === 'android') {
//         return 'http://10.0.2.2:8000';
//       } else {
//         return 'http://127.0.0.1:8000';
//       }
//     };

//     try {
//       const response = await axios.post(`${getBaseUrl()}/api/refresh/`, {
//         refresh: refreshToken,
//       }, {
//         timeout: 10000,
//       });

//       const { access, refresh } = response.data;
//       await this.storeTokens(access, refresh || refreshToken);
//       return access;
//     } catch (error: any) {
//       console.error('Token refresh failed:', error);
//       await this.clearTokens();
//       throw new Error('Session expired. Please login again.');
//     }
//   }

//   static async isAuthenticated() {
//     const { accessToken } = await this.getTokens();
//     return !!accessToken;
//   }
// }

// const LoginScreen = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [secureText, setSecureText] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
  
//   // Enhanced validation states
//   const [errors, setErrors] = useState({
//     username: '',
//     password: '',
//     general: '',
//   });
  
//   // Animation values
//   const [fadeAnim] = useState(new Animated.Value(0));
//   const [slideAnim] = useState(new Animated.Value(50));
//   const [logoScale] = useState(new Animated.Value(0.8));
//   const [errorShake] = useState(new Animated.Value(0));

//   const router = useRouter();

//   const getBaseUrl = () => {
//     if (Platform.OS === 'web') {
//       return 'http://localhost:8000';
//     } else if (Platform.OS === 'android') {
//       return 'http://10.0.2.2:8000';
//     } else {
//       return 'http://127.0.0.1:8000';
//     }
//   };

//   // Animation on component mount
//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.spring(logoScale, {
//         toValue: 1,
//         tension: 50,
//         friction: 7,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Load saved credentials
//     loadSavedCredentials();
//   }, []);

//   const loadSavedCredentials = async () => {
//     try {
//       const savedUsername = await AsyncStorage.getItem('saved_username');
//       const savedRememberMe = await AsyncStorage.getItem('remember_me');
      
//       if (savedRememberMe === 'true' && savedUsername) {
//         setUsername(savedUsername);
//         setRememberMe(true);
//       }
//     } catch (error) {
//       console.log('Error loading saved credentials:', error);
//     }
//   };

//   // Enhanced validation with better UX
//   const validateField = (field: string, value: string) => {
//     const newErrors = { ...errors };
    
//     switch (field) {
//       case 'username':
//         if (!value.trim()) {
//           newErrors.username = 'Username is required';
//         } else if (value.length < 3) {
//           newErrors.username = 'Username must be at least 3 characters';
//         } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
//           newErrors.username = 'Username can only contain letters, numbers, and underscores';
//         } else {
//           newErrors.username = '';
//         }
//         break;
//       case 'password':
//         if (!value) {
//           newErrors.password = 'Password is required';
//         } else if (value.length < 1) {
//           newErrors.password = 'Password cannot be empty';
//         } else {
//           newErrors.password = '';
//         }
//         break;
//     }
    
//     setErrors(newErrors);
//     return !newErrors[field as keyof typeof newErrors];
//   };

//   // Error shake animation
//   const shakeError = () => {
//     Animated.sequence([
//       Animated.timing(errorShake, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(errorShake, { toValue: -10, duration: 100, useNativeDriver: true }),
//       Animated.timing(errorShake, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(errorShake, { toValue: 0, duration: 100, useNativeDriver: true }),
//     ]).start();
//   };

//   // Enhanced error handling with better user feedback
//   const getErrorMessage = (error: any): string => {
//     console.error('Login error details:', error);

//     // Network connectivity issues
//     if (!error.response) {
//       if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
//         return 'Connection timeout. The server is taking too long to respond.';
//       }
//       if (error.code === 'NETWORK_ERROR' || error.message.includes('Network')) {
//         return 'Network error. Please check your internet connection and try again.';
//       }
//       if (error.message.includes('ECONNREFUSED')) {
//         return 'Cannot connect to server. Please check if the server is running.';
//       }
//       return 'Unable to connect to server. Please check your connection and try again.';
//     }

//     // Server response errors
//     const status = error.response.status;
//     const data = error.response.data;

//     switch (status) {
//       case 400:
//         if (data?.username) return `Username: ${data.username[0]}`;
//         if (data?.password) return `Password: ${data.password[0]}`;
//         if (data?.non_field_errors) return data.non_field_errors[0];
//         if (data?.detail) return data.detail;
//         return 'Invalid login credentials. Please check your username and password.';
      
//       case 401:
//         if (data?.detail?.includes('credentials')) {
//           return 'Invalid username or password. Please try again.';
//         }
//         return 'Authentication failed. Please check your credentials.';
      
//       case 403:
//         return 'Account access denied. Please contact support if this persists.';
      
//       case 404:
//         return 'Login service not found. Please contact support.';
      
//       case 429:
//         return 'Too many login attempts. Please wait a few minutes before trying again.';
      
//       case 500:
//         return 'Server error occurred. Please try again in a few moments.';
      
//       case 502:
//       case 503:
//       case 504:
//         return 'Server is temporarily unavailable. Please try again later.';
      
//       default:
//         return data?.message || data?.detail || `Server error (${status}). Please try again.`;
//     }
//   };

//   const handleLogin = async () => {
//     // Clear previous errors
//     setErrors({ username: '', password: '', general: '' });

//     // Validate inputs
//     const isUsernameValid = validateField('username', username);
//     const isPasswordValid = validateField('password', password);

//     if (!isUsernameValid || !isPasswordValid) {
//       shakeError();
//       return;
//     }

//     setLoading(true);

//     try {
//       const loginData = { 
//         username: username.trim(), 
//         password 
//       };

//       console.log('Attempting login for user:', username.trim());
      
//       const response = await axios.post(`${getBaseUrl()}/api/login/`, loginData, {
//         timeout: 15000, // Increased timeout for better UX
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
      
//       console.log('Login response:', response.data);

//       // Store JWT tokens (access and refresh)
//       const { access, refresh } = response.data;
//       if (!access || !refresh) {
//         throw new Error('Invalid response format: missing tokens');
//       }

//       await AuthService.storeTokens(access, refresh);

//       // Save credentials if remember me is checked
//       if (rememberMe) {
//         await AsyncStorage.setItem('saved_username', username.trim());
//         await AsyncStorage.setItem('remember_me', 'true');
//       } else {
//         await AsyncStorage.removeItem('saved_username');
//         await AsyncStorage.removeItem('remember_me');
//       }

//       // Fetch user profile
//       console.log('Fetching user profile...');
//       try {
//         const profileResponse = await axios.get(`${getBaseUrl()}/api/profile/`, {
//           headers: { Authorization: `Bearer ${access}` },
//           timeout: 10000,
//         });

//         await AsyncStorage.setItem('user_profile', JSON.stringify(profileResponse.data));
//         console.log('User profile stored successfully');
//       } catch (profileError) {
//         console.warn('Profile fetch failed, but login succeeded:', profileError);
//         // Don't fail login if profile fetch fails
//       }

//       // Success animation before navigation
//       Animated.sequence([
//         Animated.timing(logoScale, {
//           toValue: 1.1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//         Animated.timing(logoScale, {
//           toValue: 1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//       ]).start(() => {
//         console.log('Login successful, navigating to dashboard');
//         router.push('auth/dashboard');
//       });
      
//     } catch (error: any) {
//       const errorMessage = getErrorMessage(error);
//       console.error('Login failed:', errorMessage);
      
//       setErrors(prev => ({ ...prev, general: errorMessage }));
//       shakeError();
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.keyboardContainer}
//     >
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.gradient}
//       >
//         <ScrollView 
//           contentContainerStyle={styles.scrollContainer}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           <Animated.View 
//             style={[
//               styles.container,
//               {
//                 opacity: fadeAnim,
//                 transform: [
//                   { translateY: slideAnim },
//                   { translateX: errorShake }
//                 ]
//               }
//             ]}
//           >
//             <Animated.View 
//               style={[
//                 styles.logoContainer,
//                 { transform: [{ scale: logoScale }] }
//               ]}
//             >
//               <View style={styles.logo}>
//                 <Ionicons name="school" size={50} color="#667eea" />
//               </View>
//               <Text style={styles.title}>Welcome Back</Text>
//               <Text style={styles.subtitle}>Sign in to CampusConnect</Text>
//             </Animated.View>

//             {/* General error message */}
//             {errors.general ? (
//               <View style={styles.generalErrorContainer}>
//                 <Ionicons name="alert-circle" size={20} color="#e74c3c" />
//                 <Text style={styles.generalErrorText}>{errors.general}</Text>
//               </View>
//             ) : null}

//             <View style={styles.inputContainer}>
//               <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
//                 <Ionicons name="person-outline" size={20} color="#667eea" style={styles.inputIcon} />
//                 <TextInput
//                   placeholder="Username"
//                   style={styles.input}
//                   onChangeText={(text) => {
//                     setUsername(text);
//                     validateField('username', text);
//                     // Clear general error when user starts typing
//                     if (errors.general) {
//                       setErrors(prev => ({ ...prev, general: '' }));
//                     }
//                   }}
//                   value={username}
//                   autoCapitalize="none"
//                   placeholderTextColor="#999"
//                   editable={!loading}
//                 />
//               </View>
//               {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

//               <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
//                 <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
//                 <TextInput
//                   placeholder="Password"
//                   style={styles.input}
//                   onChangeText={(text) => {
//                     setPassword(text);
//                     validateField('password', text);
//                     // Clear general error when user starts typing
//                     if (errors.general) {
//                       setErrors(prev => ({ ...prev, general: '' }));
//                     }
//                   }}
//                   value={password}
//                   secureTextEntry={secureText}
//                   placeholderTextColor="#999"
//                   editable={!loading}
//                 />
//                 <TouchableOpacity 
//                   onPress={() => setSecureText(!secureText)} 
//                   style={styles.eyeIcon}
//                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                   disabled={loading}
//                 >
//                   <Ionicons name={secureText ? 'eye-off' : 'eye'} size={20} color="#667eea" />
//                 </TouchableOpacity>
//               </View>
//               {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
//             </View>

//             <View style={styles.optionsContainer}>
//               <TouchableOpacity 
//                 style={styles.rememberMeContainer} 
//                 onPress={() => setRememberMe(!rememberMe)}
//                 disabled={loading}
//               >
//                 <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
//                   {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
//                 </View>
//                 <Text style={styles.rememberMeText}>Remember me</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.forgotPassword}
//                 onPress={() => router.push('/change-password' as any)}
//                 disabled={loading}
//               >
//                 <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
//               </TouchableOpacity>
//             </View>

//             <TouchableOpacity 
//               style={[
//                 styles.button, 
//                 loading && styles.buttonDisabled
//               ]} 
//               onPress={handleLogin}
//               disabled={loading}
//             >
//               {loading ? (
//                 <View style={styles.loadingContainer}>
//                   <ActivityIndicator color="#fff" size="small" />
//                   <Text style={styles.loadingText}>Signing in...</Text>
//                 </View>
//               ) : (
//                 <Text style={styles.buttonText}>Sign In</Text>
//               )}
//             </TouchableOpacity>

//             <View style={styles.dividerContainer}>
//               <View style={styles.divider} />
//               <Text style={styles.dividerText}>or</Text>
//               <View style={styles.divider} />
//             </View>

//             <TouchableOpacity 
//               onPress={() => router.push('/register')} 
//               style={styles.linkContainer}
//               disabled={loading}
//             >
//               <Text style={styles.linkText}>Don't have an account? </Text>
//               <Text style={styles.linkTextBold}>Create Account</Text>
//             </TouchableOpacity>
//           </Animated.View>
//         </ScrollView>
//       </LinearGradient>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   keyboardContainer: {
//     flex: 1,
//   },
//   gradient: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     minHeight: height,
//   },
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 30,
//     paddingVertical: 50,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginBottom: 40,
//   },
//   logo: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     textAlign: 'center',
//   },
//   generalErrorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(231, 76, 60, 0.9)',
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginBottom: 20,
//     width: '100%',
//   },
//   generalErrorText: {
//     color: '#fff',
//     fontSize: 14,
//     marginLeft: 8,
//     flex: 1,
//     lineHeight: 18,
//   },
//   inputContainer: {
//     width: '100%',
//     marginBottom: 20,
//   },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 12,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     height: 55,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   inputError: {
//     borderWidth: 1,
//     borderColor: '#e74c3c',
//     backgroundColor: 'rgba(231, 76, 60, 0.05)',
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     color: '#333',
//     paddingVertical: 0,
//   },
//   eyeIcon: {
//     padding: 5,
//   },
//   errorText: {
//     color: '#e74c3c',
//     fontSize: 12,
//     marginTop: -10,
//     marginBottom: 10,
//     marginLeft: 5,
//     fontWeight: '500',
//   },
//   optionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     width: '100%',
//     marginBottom: 30,
//   },
//   rememberMeContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   checkbox: {
//     width: 20,
//     height: 20,
//     borderRadius: 4,
//     borderWidth: 2,
//     borderColor: 'rgba(255, 255, 255, 0.7)',
//     marginRight: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   checkboxChecked: {
//     backgroundColor: '#667eea',
//     borderColor: '#667eea',
//   },
//   rememberMeText: {
//     color: 'rgba(255, 255, 255, 0.9)',
//     fontSize: 14,
//   },
//   forgotPassword: {
//     padding: 5,
//   },
//   forgotPasswordText: {
//     color: 'rgba(255, 255, 255, 0.9)',
//     fontSize: 14,
//     textDecorationLine: 'underline',
//   },
//   button: {
//     backgroundColor: '#667eea',
//     paddingVertical: 16,
//     paddingHorizontal: 40,
//     borderRadius: 12,
//     width: '100%',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   buttonDisabled: {
//     backgroundColor: 'rgba(102, 126, 234, 0.5)',
//     shadowOpacity: 0.1,
//     elevation: 2,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 16,
//     marginLeft: 10,
//     fontWeight: '600',
//   },
//   dividerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 30,
//     width: '100%',
//   },
//   divider: {
//     flex: 1,
//     height: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   dividerText: {
//     color: 'rgba(255, 255, 255, 0.7)',
//     paddingHorizontal: 20,
//     fontSize: 14,
//   },
//   linkContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   linkText: {
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontSize: 16,
//   },
//   linkTextBold: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     textDecorationLine: 'underline',
//   },
// });

// export { AuthService };
// export default LoginScreen;



















































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   Dimensions,
//   ScrollView,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';

// import type { StackNavigationProp } from '@react-navigation/stack';

// const { width, height } = Dimensions.get('window');

// type RootStackParamList = {
//   Dashboard: undefined;
//   Register: undefined;
// };

// type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

// interface LoginScreenProps {
//   navigation: LoginScreenNavigationProp;
// }

// // JWT Authentication Service
// class AuthService {
//   static async storeTokens(accessToken: string, refreshToken: string) {
//     try {
//       await AsyncStorage.setItem('access_token', accessToken);
//       await AsyncStorage.setItem('refresh_token', refreshToken);
//       console.log('Tokens stored successfully');
//     } catch (error) {
//       console.error('Error storing tokens:', error);
//       throw new Error('Failed to store authentication tokens');
//     }
//   }

//   static async getTokens() {
//     try {
//       const accessToken = await AsyncStorage.getItem('access_token');
//       const refreshToken = await AsyncStorage.getItem('refresh_token');
//       return { accessToken, refreshToken };
//     } catch (error) {
//       console.error('Error getting tokens:', error);
//       return { accessToken: null, refreshToken: null };
//     }
//   }

//   static async clearTokens() {
//     try {
//       await AsyncStorage.multiRemove([
//         'access_token', 
//         'refresh_token', 
//         'user_profile',
//         'currentUser',
//         'saved_username',
//         'remember_me'
//       ]);
//       console.log('All tokens and user data cleared');
//     } catch (error) {
//       console.error('Error clearing tokens:', error);
//     }
//   }

//   static async refreshAccessToken() {
//     const { refreshToken } = await this.getTokens();
//     if (!refreshToken) {
//       throw new Error('No refresh token available');
//     }

//     const getBaseUrl = () => {
//       if (Platform.OS === 'web') {
//         return 'http://localhost:8000';
//       } else if (Platform.OS === 'android') {
//         return 'http://10.0.2.2:8000';
//       } else {
//         return 'http://127.0.0.1:8000';
//       }
//     };

//     try {
//       const response = await axios.post(`${getBaseUrl()}/api/refresh/`, {
//         refresh: refreshToken,
//       }, {
//         timeout: 10000,
//       });

//       const { access, refresh } = response.data;
//       await this.storeTokens(access, refresh || refreshToken);
//       return access;
//     } catch (error: any) {
//       console.error('Token refresh failed:', error);
//       await this.clearTokens();
//       throw new Error('Session expired. Please login again.');
//     }
//   }

//   static async isAuthenticated() {
//     const { accessToken } = await this.getTokens();
//     return !!accessToken;
//   }
// }

// const LoginScreen = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [secureText, setSecureText] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
  
//   // Enhanced validation states
//   const [errors, setErrors] = useState({
//     username: '',
//     password: '',
//     general: '',
//   });
  
//   // Connection status
//   const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
//   // Animation values
//   const [fadeAnim] = useState(new Animated.Value(0));
//   const [slideAnim] = useState(new Animated.Value(50));
//   const [logoScale] = useState(new Animated.Value(0.8));
//   const [errorShake] = useState(new Animated.Value(0));

//   const router = useRouter();

//   const getBaseUrl = () => {
//     if (Platform.OS === 'web') {
//       return 'http://localhost:8000';
//     } else if (Platform.OS === 'android') {
//       return 'http://10.0.2.2:8000';
//     } else {
//       return 'http://127.0.0.1:8000';
//     }
//   };

//   // Check network connectivity
//   const checkConnectivity = async () => {
//     try {
//       setConnectionStatus('checking');
//       const response = await axios.get(`${getBaseUrl()}/api/health/`, { 
//         timeout: 5000 
//       });
//       setConnectionStatus('online');
//       return true;
//     } catch (error) {
//       setConnectionStatus('offline');
//       return false;
//     }
//   };

//   // Animation on component mount
//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.spring(logoScale, {
//         toValue: 1,
//         tension: 50,
//         friction: 7,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Load saved credentials and check connectivity
//     loadSavedCredentials();
//     checkConnectivity();
//   }, []);

//   const loadSavedCredentials = async () => {
//     try {
//       const savedUsername = await AsyncStorage.getItem('saved_username');
//       const savedRememberMe = await AsyncStorage.getItem('remember_me');
      
//       if (savedRememberMe === 'true' && savedUsername) {
//         setUsername(savedUsername);
//         setRememberMe(true);
//       }
//     } catch (error) {
//       console.log('Error loading saved credentials:', error);
//     }
//   };

//   // Enhanced validation with better UX
//   const validateField = (field: string, value: string) => {
//     const newErrors = { ...errors };
    
//     switch (field) {
//       case 'username':
//         if (!value.trim()) {
//           newErrors.username = 'Username is required';
//         } else if (value.length < 3) {
//           newErrors.username = 'Username must be at least 3 characters';
//         } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
//           newErrors.username = 'Username can only contain letters, numbers, and underscores';
//         } else {
//           newErrors.username = '';
//         }
//         break;
//       case 'password':
//         if (!value) {
//           newErrors.password = 'Password is required';
//         } else if (value.length < 1) {
//           newErrors.password = 'Password cannot be empty';
//         } else {
//           newErrors.password = '';
//         }
//         break;
//     }
    
//     setErrors(newErrors);
//     return !newErrors[field as keyof typeof newErrors];
//   };

//   // Error shake animation
//   const shakeError = () => {
//     Animated.sequence([
//       Animated.timing(errorShake, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(errorShake, { toValue: -10, duration: 100, useNativeDriver: true }),
//       Animated.timing(errorShake, { toValue: 10, duration: 100, useNativeDriver: true }),
//       Animated.timing(errorShake, { toValue: 0, duration: 100, useNativeDriver: true }),
//     ]).start();
//   };

//   // Enhanced error handling with better user feedback
//   const getErrorMessage = (error: any): string => {
//     console.error('Login error details:', error);

//     // Network connectivity issues
//     if (!error.response) {
//       if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
//         return 'Connection timeout. The server is taking too long to respond.';
//       }
//       if (error.code === 'NETWORK_ERROR' || error.message.includes('Network')) {
//         return 'Network error. Please check your internet connection and try again.';
//       }
//       if (error.message.includes('ECONNREFUSED')) {
//         return 'Cannot connect to server. Please check if the server is running.';
//       }
//       return 'Unable to connect to server. Please check your connection and try again.';
//     }

//     // Server response errors
//     const status = error.response.status;
//     const data = error.response.data;

//     switch (status) {
//       case 400:
//         if (data?.username) return `Username: ${data.username[0]}`;
//         if (data?.password) return `Password: ${data.password[0]}`;
//         if (data?.non_field_errors) return data.non_field_errors[0];
//         if (data?.detail) return data.detail;
//         return 'Invalid login credentials. Please check your username and password.';
      
//       case 401:
//         if (data?.detail?.includes('credentials')) {
//           return 'Invalid username or password. Please try again.';
//         }
//         return 'Authentication failed. Please check your credentials.';
      
//       case 403:
//         return 'Account access denied. Please contact support if this persists.';
      
//       case 404:
//         return 'Login service not found. Please contact support.';
      
//       case 429:
//         return 'Too many login attempts. Please wait a few minutes before trying again.';
      
//       case 500:
//         return 'Server error occurred. Please try again in a few moments.';
      
//       case 502:
//       case 503:
//       case 504:
//         return 'Server is temporarily unavailable. Please try again later.';
      
//       default:
//         return data?.message || data?.detail || `Server error (${status}). Please try again.`;
//     }
//   };

//   const handleLogin = async () => {
//     // Clear previous errors
//     setErrors({ username: '', password: '', general: '' });

//     // Validate inputs
//     const isUsernameValid = validateField('username', username);
//     const isPasswordValid = validateField('password', password);

//     if (!isUsernameValid || !isPasswordValid) {
//       shakeError();
//       return;
//     }

//     // Check connectivity first
//     setLoading(true);
//     const isConnected = await checkConnectivity();
    
//     if (!isConnected) {
//       setLoading(false);
//       setErrors(prev => ({ 
//         ...prev, 
//         general: 'No internet connection. Please check your network and try again.' 
//       }));
//       shakeError();
//       return;
//     }

//     try {
//       const loginData = { 
//         username: username.trim(), 
//         password 
//       };

//       console.log('Attempting login for user:', username.trim());
      
//       const response = await axios.post(`${getBaseUrl()}/api/login/`, loginData, {
//         timeout: 15000, // Increased timeout for better UX
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
      
//       console.log('Login response:', response.data);

//       // Store JWT tokens (access and refresh)
//       const { access, refresh } = response.data;
//       if (!access || !refresh) {
//         throw new Error('Invalid response format: missing tokens');
//       }

//       await AuthService.storeTokens(access, refresh);

//       // Save credentials if remember me is checked
//       if (rememberMe) {
//         await AsyncStorage.setItem('saved_username', username.trim());
//         await AsyncStorage.setItem('remember_me', 'true');
//       } else {
//         await AsyncStorage.removeItem('saved_username');
//         await AsyncStorage.removeItem('remember_me');
//       }

//       // Fetch user profile
//       console.log('Fetching user profile...');
//       try {
//         const profileResponse = await axios.get(`${getBaseUrl()}/api/profile/`, {
//           headers: { Authorization: `Bearer ${access}` },
//           timeout: 10000,
//         });

//         await AsyncStorage.setItem('user_profile', JSON.stringify(profileResponse.data));
//         console.log('User profile stored successfully');
//       } catch (profileError) {
//         console.warn('Profile fetch failed, but login succeeded:', profileError);
//         // Don't fail login if profile fetch fails
//       }

//       // Success animation before navigation
//       Animated.sequence([
//         Animated.timing(logoScale, {
//           toValue: 1.1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//         Animated.timing(logoScale, {
//           toValue: 1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//       ]).start(() => {
//         console.log('Login successful, navigating to dashboard');
//         router.push('auth/dashboard');
//       });
      
//     } catch (error: any) {
//       const errorMessage = getErrorMessage(error);
//       console.error('Login failed:', errorMessage);
      
//       setErrors(prev => ({ ...prev, general: errorMessage }));
//       shakeError();
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Retry connection
//   const retryConnection = async () => {
//     const isConnected = await checkConnectivity();
//     if (isConnected) {
//       setErrors(prev => ({ ...prev, general: '' }));
//     }
//   };

//   const renderConnectionStatus = () => {
//     if (connectionStatus === 'checking') {
//       return (
//         <View style={styles.connectionStatus}>
//           <ActivityIndicator size="small" color="#667eea" />
//           <Text style={styles.connectionText}>Checking connection...</Text>
//         </View>
//       );
//     }
    
//     if (connectionStatus === 'offline') {
//       return (
//         <View style={[styles.connectionStatus, styles.connectionOffline]}>
//           <Ionicons name="wifi-outline" size={16} color="#e74c3c" />
//           <Text style={[styles.connectionText, styles.connectionOfflineText]}>
//             No connection
//           </Text>
//           <TouchableOpacity onPress={retryConnection} style={styles.retryButton}>
//             <Text style={styles.retryText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       );
//     }

//     return null;
//   };

//   return (
//     <KeyboardAvoidingView 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.keyboardContainer}
//     >
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.gradient}
//       >
//         <ScrollView 
//           contentContainerStyle={styles.scrollContainer}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           <Animated.View 
//             style={[
//               styles.container,
//               {
//                 opacity: fadeAnim,
//                 transform: [
//                   { translateY: slideAnim },
//                   { translateX: errorShake }
//                 ]
//               }
//             ]}
//           >
//             {renderConnectionStatus()}
            
//             <Animated.View 
//               style={[
//                 styles.logoContainer,
//                 { transform: [{ scale: logoScale }] }
//               ]}
//             >
//               <View style={styles.logo}>
//                 <Ionicons name="school" size={50} color="#667eea" />
//               </View>
//               <Text style={styles.title}>Welcome Back</Text>
//               <Text style={styles.subtitle}>Sign in to CampusConnect</Text>
//             </Animated.View>

//             {/* General error message */}
//             {errors.general ? (
//               <View style={styles.generalErrorContainer}>
//                 <Ionicons name="alert-circle" size={20} color="#e74c3c" />
//                 <Text style={styles.generalErrorText}>{errors.general}</Text>
//               </View>
//             ) : null}

//             <View style={styles.inputContainer}>
//               <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
//                 <Ionicons name="person-outline" size={20} color="#667eea" style={styles.inputIcon} />
//                 <TextInput
//                   placeholder="Username"
//                   style={styles.input}
//                   onChangeText={(text) => {
//                     setUsername(text);
//                     validateField('username', text);
//                     // Clear general error when user starts typing
//                     if (errors.general) {
//                       setErrors(prev => ({ ...prev, general: '' }));
//                     }
//                   }}
//                   value={username}
//                   autoCapitalize="none"
//                   placeholderTextColor="#999"
//                   editable={!loading}
//                 />
//               </View>
//               {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

//               <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
//                 <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
//                 <TextInput
//                   placeholder="Password"
//                   style={styles.input}
//                   onChangeText={(text) => {
//                     setPassword(text);
//                     validateField('password', text);
//                     // Clear general error when user starts typing
//                     if (errors.general) {
//                       setErrors(prev => ({ ...prev, general: '' }));
//                     }
//                   }}
//                   value={password}
//                   secureTextEntry={secureText}
//                   placeholderTextColor="#999"
//                   editable={!loading}
//                 />
//                 <TouchableOpacity 
//                   onPress={() => setSecureText(!secureText)} 
//                   style={styles.eyeIcon}
//                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                   disabled={loading}
//                 >
//                   <Ionicons name={secureText ? 'eye-off' : 'eye'} size={20} color="#667eea" />
//                 </TouchableOpacity>
//               </View>
//               {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
//             </View>

//             <View style={styles.optionsContainer}>
//               <TouchableOpacity 
//                 style={styles.rememberMeContainer} 
//                 onPress={() => setRememberMe(!rememberMe)}
//                 disabled={loading}
//               >
//                 <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
//                   {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
//                 </View>
//                 <Text style={styles.rememberMeText}>Remember me</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.forgotPassword}
//                 onPress={() => router.push('/change-password' as any)}
//                 disabled={loading}
//               >
//                 <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
//               </TouchableOpacity>
//             </View>

//             <TouchableOpacity 
//               style={[
//                 styles.button, 
//                 loading && styles.buttonDisabled,
//                 connectionStatus === 'offline' && styles.buttonDisabled
//               ]} 
//               onPress={handleLogin}
//               disabled={loading || connectionStatus === 'offline'}
//             >
//               {loading ? (
//                 <View style={styles.loadingContainer}>
//                   <ActivityIndicator color="#fff" size="small" />
//                   <Text style={styles.loadingText}>Signing in...</Text>
//                 </View>
//               ) : (
//                 <Text style={styles.buttonText}>Sign In</Text>
//               )}
//             </TouchableOpacity>

//             <View style={styles.dividerContainer}>
//               <View style={styles.divider} />
//               <Text style={styles.dividerText}>or</Text>
//               <View style={styles.divider} />
//             </View>

//             <TouchableOpacity 
//               onPress={() => router.push('/register')} 
//               style={styles.linkContainer}
//               disabled={loading}
//             >
//               <Text style={styles.linkText}>Don't have an account? </Text>
//               <Text style={styles.linkTextBold}>Create Account</Text>
//             </TouchableOpacity>
//           </Animated.View>
//         </ScrollView>
//       </LinearGradient>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   keyboardContainer: {
//     flex: 1,
//   },
//   gradient: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     minHeight: height,
//   },
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 30,
//     paddingVertical: 50,
//   },
//   connectionStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginBottom: 20,
//   },
//   connectionOffline: {
//     backgroundColor: 'rgba(231, 76, 60, 0.9)',
//   },
//   connectionText: {
//     marginLeft: 8,
//     fontSize: 12,
//     color: '#667eea',
//     fontWeight: '500',
//   },
//   connectionOfflineText: {
//     color: '#fff',
//   },
//   retryButton: {
//     marginLeft: 10,
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     borderRadius: 10,
//   },
//   retryText: {
//     color: '#fff',
//     fontSize: 11,
//     fontWeight: '600',
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginBottom: 40,
//   },
//   logo: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     textAlign: 'center',
//   },
//   generalErrorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(231, 76, 60, 0.9)',
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginBottom: 20,
//     width: '100%',
//   },
//   generalErrorText: {
//     color: '#fff',
//     fontSize: 14,
//     marginLeft: 8,
//     flex: 1,
//     lineHeight: 18,
//   },
//   inputContainer: {
//     width: '100%',
//     marginBottom: 20,
//   },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 12,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     height: 55,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   inputError: {
//     borderWidth: 1,
//     borderColor: '#e74c3c',
//     backgroundColor: 'rgba(231, 76, 60, 0.05)',
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     color: '#333',
//     paddingVertical: 0,
//   },
//   eyeIcon: {
//     padding: 5,
//   },
//   errorText: {
//     color: '#e74c3c',
//     fontSize: 12,
//     marginTop: -10,
//     marginBottom: 10,
//     marginLeft: 5,
//     fontWeight: '500',
//   },
//   optionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     width: '100%',
//     marginBottom: 30,
//   },
//   rememberMeContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   checkbox: {
//     width: 20,
//     height: 20,
//     borderRadius: 4,
//     borderWidth: 2,
//     borderColor: 'rgba(255, 255, 255, 0.7)',
//     marginRight: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   checkboxChecked: {
//     backgroundColor: '#667eea',
//     borderColor: '#667eea',
//   },
//   rememberMeText: {
//     color: 'rgba(255, 255, 255, 0.9)',
//     fontSize: 14,
//   },
//   forgotPassword: {
//     padding: 5,
//   },
//   forgotPasswordText: {
//     color: 'rgba(255, 255, 255, 0.9)',
//     fontSize: 14,
//     textDecorationLine: 'underline',
//   },
//   button: {
//     backgroundColor: '#667eea',
//     paddingVertical: 16,
//     paddingHorizontal: 40,
//     borderRadius: 12,
//     width: '100%',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   buttonDisabled: {
//     backgroundColor: 'rgba(102, 126, 234, 0.5)',
//     shadowOpacity: 0.1,
//     elevation: 2,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 16,
//     marginLeft: 10,
//     fontWeight: '600',
//   },
//   dividerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 30,
//     width: '100%',
//   },
//   divider: {
//     flex: 1,
//     height: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   dividerText: {
//     color: 'rgba(255, 255, 255, 0.7)',
//     paddingHorizontal: 20,
//     fontSize: 14,
//   },
//   linkContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   linkText: {
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontSize: 16,
//   },
//   linkTextBold: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     textDecorationLine: 'underline',
//   },
// });

// export { AuthService };
// export default LoginScreen;



















import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ConnectionAPI from './api/connectionService'; 

import type { StackNavigationProp } from '@react-navigation/stack';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Dashboard: undefined;
  Register: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

// Error message types for better categorization
const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  TIMEOUT: 'TIMEOUT',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
};

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState({
    type: '',
    message: '',
    visible: false
  });
  
  // Validation states
  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [logoScale] = useState(new Animated.Value(0.8));
  const [toastAnim] = useState(new Animated.Value(0));

  const router = useRouter();

  // Animation on component mount
  useEffect(() => {
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
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Load saved credentials if remember me was checked
    loadSavedCredentials();
  }, []);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const loadSavedCredentials = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('saved_username');
      const savedRememberMe = await AsyncStorage.getItem('remember_me');
      
      if (savedRememberMe === 'true' && savedUsername) {
        setUsername(savedUsername);
        setRememberMe(true);
      }
    } catch (error) {
      // console.log('Error loading saved credentials:', error);
      showToast(ERROR_TYPES.UNKNOWN, 'Failed to load saved credentials');
    }
  };

  // Toast notification functions
  const showToast = (type: string, message: string) => {
    setToast({ type, message, visible: true });
    
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false, 
      }),
      Animated.delay(3500),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start(() => {
      if (toast.visible) {
        setToast({ type: '', message: '', visible: false });
      }
    });
  };

  const hideToast = () => {
    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setToast({ type: '', message: '', visible: false });
    });
  };

  // Get error icon based on type
  const getErrorIcon = (type: string) => {
    switch (type) {
      case ERROR_TYPES.NETWORK:
        return 'wifi-outline';
      case ERROR_TYPES.AUTH:
        return 'lock-closed-outline';
      case ERROR_TYPES.TIMEOUT:
        return 'time-outline';
      case ERROR_TYPES.VALIDATION:
        return 'warning-outline';
      case ERROR_TYPES.SERVER:
        return 'server-outline';
      default:
        return 'alert-circle-outline';
    }
  };

  // Get toast background color based on type
  const getToastColor = (type: string) => {
    switch (type) {
      case ERROR_TYPES.NETWORK:
        return '#ff6b35';
      case ERROR_TYPES.AUTH:
        return '#e74c3c';
      case ERROR_TYPES.TIMEOUT:
        return '#f39c12';
      case ERROR_TYPES.VALIDATION:
        return '#e67e22';
      case ERROR_TYPES.SERVER:
        return '#9b59b6';
      default:
        return '#ff4757';
    }
  };

  // Real-time validation with better messages
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'username':
        if (!value.trim()) {
          newErrors.username = 'Username is required';
        } else if (value.length < 3) {
          newErrors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
          newErrors.username = 'Username can only contain letters, numbers, dots, dashes and underscores';
        } else {
          newErrors.username = '';
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 1) {
          newErrors.password = 'Password cannot be empty';
        } else {
          newErrors.password = '';
        }
        break;
    }
    
    setErrors(newErrors);
  };

  // Enhanced error parsing function
  const parseLoginError = (error: any) => {
    if (!error) {
      return { type: ERROR_TYPES.UNKNOWN, message: 'An unknown error occurred' };
    }

    // Network errors
    if (error.request && !error.response) {
      return {
        type: ERROR_TYPES.NETWORK,
        message: 'Unable to connect to server. Please check your internet connection.'
      };
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        type: ERROR_TYPES.TIMEOUT,
        message: 'Request timed out. Please check your connection and try again.'
      };
    }

    // Server response errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return {
            type: ERROR_TYPES.VALIDATION,
            message: data?.detail || data?.message || 'Invalid login credentials provided'
          };
        case 401:
          return {
            type: ERROR_TYPES.AUTH,
            message: 'Invalid username or password. Please check your credentials and try again.'
          };
        case 403:
          return {
            type: ERROR_TYPES.AUTH,
            message: 'Account access denied. Please contact support if this persists.'
          };
        case 404:
          return {
            type: ERROR_TYPES.SERVER,
            message: 'Login service not found. Please try again later.'
          };
        case 429:
          return {
            type: ERROR_TYPES.AUTH,
            message: 'Too many login attempts. Please wait a moment before trying again.'
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: ERROR_TYPES.SERVER,
            message: 'Server is temporarily unavailable. Please try again in a few moments.'
          };
        default:
          return {
            type: ERROR_TYPES.SERVER,
            message: data?.detail || data?.message || `Server error (${status}). Please try again.`
          };
      }
    }

    // Generic error fallback
    return {
      type: ERROR_TYPES.UNKNOWN,
      message: error.message || 'Something went wrong. Please try again.'
    };
  };

  const handleLogin = async () => {
    // Clear previous toast
    if (toast.visible) {
      hideToast();
    }

    // Validate fields
    validateField('username', username);
    validateField('password', password);

    if (!username.trim() || !password) {
      showToast(ERROR_TYPES.VALIDATION, 'Please fill in all required fields');
      return;
    }

    // Check if any errors exist
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      showToast(ERROR_TYPES.VALIDATION, 'Please fix the validation errors above');
      return;
    }

    setLoading(true);
    try {
      // Use ConnectionAPI login method
      const result = await ConnectionAPI.login({
        username: username.trim(),
        password: password
      });

      if (result.success) {
        // Save credentials if remember me is checked
        if (rememberMe) {
          await AsyncStorage.setItem('saved_username', username.trim());
          await AsyncStorage.setItem('remember_me', 'true');
        } else {
          await AsyncStorage.removeItem('saved_username');
          await AsyncStorage.removeItem('remember_me');
        }

        setLoading(false);
        
        // Success animation before navigation
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          router.push('/auth/dashboard');
        });
      } else {
        setLoading(false);
        // Parse the error from ConnectionAPI
        const parsedError = parseLoginError({ message: result.error });
        showToast(parsedError.type, parsedError.message);
      }
      
    } catch (error: any) {
      setLoading(false);
      // console.error('Login error:', error);
      
      const parsedError = parseLoginError(error);
      showToast(parsedError.type, parsedError.message);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
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
              <Animated.View 
                style={[
                  styles.logoContainer,
                  { transform: [{ scale: logoScale }] }
                ]}
              >
                <View style={styles.logo}>
                  <Ionicons name="school" size={50} color="#667eea" />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to CampusConnect</Text>
              </Animated.View>

              {/* Toast Notification - Positioned above input fields */}
              {toast.visible && (
                <Animated.View 
                  style={[
                    styles.toastContainer,
                    {
                      opacity: toastAnim,
                      transform: [
                        {
                          translateY: toastAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0]
                          })
                        },
                        {
                          scale: toastAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.95, 1]
                          })
                        }
                      ],
                      backgroundColor: getToastColor(toast.type)
                    }
                  ]}
                >
                  <View style={styles.toastContent}>
                    <Ionicons 
                      name={getErrorIcon(toast.type)} 
                      size={18} 
                      color="#fff" 
                      style={styles.toastIcon}
                    />
                    <Text style={styles.toastText}>{toast.message}</Text>
                    <TouchableOpacity 
                      onPress={hideToast}
                      style={styles.toastCloseButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

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
                    placeholderTextColor="#999"
                    editable={!loading}
                  />
                </View>
                {errors.username ? (
                  <View style={styles.fieldErrorContainer}>
                    <Ionicons name="warning-outline" size={14} color="#ff4757" />
                    <Text style={styles.errorText}>{errors.username}</Text>
                  </View>
                ) : null}

                <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Password"
                    style={styles.input}
                    onChangeText={(text) => {
                      setPassword(text);
                      validateField('password', text);
                    }}
                    value={password}
                    secureTextEntry={secureText}
                    placeholderTextColor="#999"
                    editable={!loading}
                  />
                  <TouchableOpacity 
                    onPress={() => setSecureText(!secureText)} 
                    style={styles.eyeIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={loading}
                  >
                    <Ionicons name={secureText ? 'eye-off' : 'eye'} size={20} color="#667eea" />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <View style={styles.fieldErrorContainer}>
                    <Ionicons name="warning-outline" size={14} color="#ff4757" />
                    <Text style={styles.errorText}>{errors.password}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity 
                  style={styles.rememberMeContainer} 
                  onPress={() => setRememberMe(!rememberMe)}
                  disabled={loading}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => router.push('/change-password' as any)}
                  disabled={loading}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.loadingText}>Signing in...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Sign In</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity 
                onPress={() => router.push('/register')} 
                style={styles.linkContainer}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>Don't have an account? </Text>
                <Text style={styles.linkTextBold}>Create Account</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </>
  );
};

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
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  toastContainer: {
    marginBottom: 20,
    marginHorizontal: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toastIcon: {
    marginRight: 10,
  },
  toastText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  toastCloseButton: {
    marginLeft: 10,
    padding: 2,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#ff4757',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginLeft: 5,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  rememberMeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  forgotPassword: {
    padding: 5,
  },
  forgotPasswordText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
    color: '#667eea',
  },
  buttonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 15,
    fontSize: 14,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LoginScreen;




























// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   Dimensions,
//   ScrollView,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
// import ConnectionAPI from './api/connectionService';

// import type { StackNavigationProp } from '@react-navigation/stack';

// const { width, height } = Dimensions.get('window');

// type RootStackParamList = {
//   Dashboard: undefined;
//   Register: undefined;
// };

// type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

// interface LoginScreenProps {
//   navigation: LoginScreenNavigationProp;
// }

// // Error message types for better categorization
// const ERROR_TYPES = {
//   NETWORK: 'NETWORK',
//   VALIDATION: 'VALIDATION',
//   AUTH: 'AUTH',
//   TIMEOUT: 'TIMEOUT',
//   SERVER: 'SERVER',
//   UNKNOWN: 'UNKNOWN'
// };

// const LoginScreen = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [secureText, setSecureText] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
  
//   // Toast notification state
//   const [toast, setToast] = useState({
//     type: '',
//     message: '',
//     visible: false
//   });
  
//   // Validation states
//   const [errors, setErrors] = useState({
//     username: '',
//     password: '',
//   });
  
//   // Animation values
//   const [fadeAnim] = useState(new Animated.Value(0));
//   const [slideAnim] = useState(new Animated.Value(50));
//   const [logoScale] = useState(new Animated.Value(0.8));
//   const [toastAnim] = useState(new Animated.Value(0));

//   const router = useRouter();

//   // Animation on component mount
//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.spring(logoScale, {
//         toValue: 1,
//         tension: 50,
//         friction: 7,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Load saved credentials if remember me was checked
//     loadSavedCredentials();
//   }, []);

//   // Auto-hide toast after 4 seconds
//   useEffect(() => {
//     if (toast.visible) {
//       const timer = setTimeout(() => {
//         hideToast();
//       }, 4000);
//       return () => clearTimeout(timer);
//     }
//   }, [toast.visible]);

//   const loadSavedCredentials = async () => {
//     try {
//       const savedUsername = await AsyncStorage.getItem('saved_username');
//       const savedRememberMe = await AsyncStorage.getItem('remember_me');
      
//       if (savedRememberMe === 'true' && savedUsername) {
//         setUsername(savedUsername);
//         setRememberMe(true);
//       }
//     } catch (error) {
//       console.log('Error loading saved credentials:', error);
//       showToast(ERROR_TYPES.UNKNOWN, 'Failed to load saved credentials');
//     }
//   };

//   // Toast notification functions
//   const showToast = (type: string, message: string) => {
//     setToast({ type, message, visible: true });
    
//     Animated.sequence([
//       Animated.timing(toastAnim, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }),
//       Animated.delay(3500),
//       Animated.timing(toastAnim, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       })
//     ]).start(() => {
//       if (toast.visible) {
//         setToast({ type: '', message: '', visible: false });
//       }
//     });
//   };

//   const hideToast = () => {
//     Animated.timing(toastAnim, {
//       toValue: 0,
//       duration: 300,
//       useNativeDriver: true,
//     }).start(() => {
//       setToast({ type: '', message: '', visible: false });
//     });
//   };

//   // Get error icon based on type
//   const getErrorIcon = (type: string) => {
//     switch (type) {
//       case ERROR_TYPES.NETWORK:
//         return 'wifi-outline';
//       case ERROR_TYPES.AUTH:
//         return 'lock-closed-outline';
//       case ERROR_TYPES.TIMEOUT:
//         return 'time-outline';
//       case ERROR_TYPES.VALIDATION:
//         return 'warning-outline';
//       case ERROR_TYPES.SERVER:
//         return 'server-outline';
//       default:
//         return 'alert-circle-outline';
//     }
//   };

//   // Get toast background color based on type
//   const getToastColor = (type: string) => {
//     switch (type) {
//       case ERROR_TYPES.NETWORK:
//         return '#ff6b35';
//       case ERROR_TYPES.AUTH:
//         return '#e74c3c';
//       case ERROR_TYPES.TIMEOUT:
//         return '#f39c12';
//       case ERROR_TYPES.VALIDATION:
//         return '#e67e22';
//       case ERROR_TYPES.SERVER:
//         return '#9b59b6';
//       default:
//         return '#ff4757';
//     }
//   };

//   // Real-time validation with better messages
//   const validateField = (field: string, value: string) => {
//     const newErrors = { ...errors };
    
//     switch (field) {
//       case 'username':
//         if (!value.trim()) {
//           newErrors.username = 'Username is required';
//         } else if (value.length < 3) {
//           newErrors.username = 'Username must be at least 3 characters';
//         } else if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
//           newErrors.username = 'Username can only contain letters, numbers, dots, dashes and underscores';
//         } else {
//           newErrors.username = '';
//         }
//         break;
//       case 'password':
//         if (!value) {
//           newErrors.password = 'Password is required';
//         } else if (value.length < 1) {
//           newErrors.password = 'Password cannot be empty';
//         } else {
//           newErrors.password = '';
//         }
//         break;
//     }
    
//     setErrors(newErrors);
//   };

//   // Enhanced error parsing function
//   const parseLoginError = (error: any) => {
//     if (!error) {
//       return { type: ERROR_TYPES.UNKNOWN, message: 'An unknown error occurred' };
//     }

//     // Network errors
//     if (error.request && !error.response) {
//       return {
//         type: ERROR_TYPES.NETWORK,
//         message: 'Unable to connect to server. Please check your internet connection.'
//       };
//     }

//     // Timeout errors
//     if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
//       return {
//         type: ERROR_TYPES.TIMEOUT,
//         message: 'Request timed out. Please check your connection and try again.'
//       };
//     }

//     // Server response errors
//     if (error.response) {
//       const status = error.response.status;
//       const data = error.response.data;

//       switch (status) {
//         case 400:
//           return {
//             type: ERROR_TYPES.VALIDATION,
//             message: data?.detail || data?.message || 'Invalid login credentials provided'
//           };
//         case 401:
//           return {
//             type: ERROR_TYPES.AUTH,
//             message: 'Invalid username or password. Please check your credentials and try again.'
//           };
//         case 403:
//           return {
//             type: ERROR_TYPES.AUTH,
//             message: 'Account access denied. Please contact support if this persists.'
//           };
//         case 404:
//           return {
//             type: ERROR_TYPES.SERVER,
//             message: 'Login service not found. Please try again later.'
//           };
//         case 429:
//           return {
//             type: ERROR_TYPES.AUTH,
//             message: 'Too many login attempts. Please wait a moment before trying again.'
//           };
//         case 500:
//         case 502:
//         case 503:
//         case 504:
//           return {
//             type: ERROR_TYPES.SERVER,
//             message: 'Server is temporarily unavailable. Please try again in a few moments.'
//           };
//         default:
//           return {
//             type: ERROR_TYPES.SERVER,
//             message: data?.detail || data?.message || `Server error (${status}). Please try again.`
//           };
//       }
//     }

//     // Generic error fallback
//     return {
//       type: ERROR_TYPES.UNKNOWN,
//       message: error.message || 'Something went wrong. Please try again.'
//     };
//   };

//   const handleLogin = async () => {
//     // Clear previous toast
//     if (toast.visible) {
//       hideToast();
//     }

//     // Validate fields
//     validateField('username', username);
//     validateField('password', password);

//     if (!username.trim() || !password) {
//       showToast(ERROR_TYPES.VALIDATION, 'Please fill in all required fields');
//       return;
//     }

//     // Check if any errors exist
//     const hasErrors = Object.values(errors).some(error => error !== '');
//     if (hasErrors) {
//       showToast(ERROR_TYPES.VALIDATION, 'Please fix the validation errors above');
//       return;
//     }

//     setLoading(true);
//     try {
//       const getBaseUrl = ConnectionAPI.getBaseUrl()
//       // const getBaseUrl = () => {
//       //   if (Platform.OS === 'web') {
//       //     return 'http://localhost:8000';
//       //   } else if (Platform.OS === 'android') {
//       //     return 'http://192.168.220.16:8000';
//       //     // return 'http://192.168.130.16:8000';
//       //     // return 'http://10.0.2.2:8000';
//       //   } else {
//       //     return 'http://127.0.0.1:8000';
//       //   }
//       // };

//       const res = await axios.post(`${getBaseUrl()}/api/login/`, { 
//         username: username.trim(), 
//         password 
//       }, {
//         timeout: 10000,
//       });
      
//       const token = res.data.access;

//       await AsyncStorage.setItem('access_token', token);

//       // Save credentials if remember me is checked
//       if (rememberMe) {
//         await AsyncStorage.setItem('saved_username', username.trim());
//         await AsyncStorage.setItem('remember_me', 'true');
//       } else {
//         await AsyncStorage.removeItem('saved_username');
//         await AsyncStorage.removeItem('remember_me');
//       }

//       const profile = await axios.get(`${getBaseUrl()}/api/profile/`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       await AsyncStorage.setItem('user_profile', JSON.stringify(profile.data));
//       setLoading(false);
      
//       // Success animation before navigation
//       Animated.sequence([
//         Animated.timing(logoScale, {
//           toValue: 1.1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//         Animated.timing(logoScale, {
//           toValue: 1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//       ]).start(() => {
//         router.push('auth/dashboard');
//       });
      
//     } catch (error: any) {
//       setLoading(false);
//       console.error('Login error:', error);
      
//       const parsedError = parseLoginError(error);
//       showToast(parsedError.type, parsedError.message);
//     }
//   };

//   return (
//     <KeyboardAvoidingView 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.keyboardContainer}
//     >
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.gradient}
//       >
//         {/* Toast Notification */}
//         {toast.visible && (
//           <Animated.View 
//             style={[
//               styles.toastContainer,
//               {
//                 opacity: toastAnim,
//                 transform: [
//                   {
//                     translateY: toastAnim.interpolate({
//                       inputRange: [0, 1],
//                       outputRange: [-100, 0]
//                     })
//                   },
//                   {
//                     scale: toastAnim.interpolate({
//                       inputRange: [0, 1],
//                       outputRange: [0.9, 1]
//                     })
//                   }
//                 ],
//                 backgroundColor: getToastColor(toast.type)
//               }
//             ]}
//           >
//             <View style={styles.toastContent}>
//               <Ionicons 
//                 name={getErrorIcon(toast.type)} 
//                 size={20} 
//                 color="#fff" 
//                 style={styles.toastIcon}
//               />
//               <Text style={styles.toastText}>{toast.message}</Text>
//               <TouchableOpacity 
//                 onPress={hideToast}
//                 style={styles.toastCloseButton}
//                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//               >
//                 <Ionicons name="close" size={18} color="#fff" />
//               </TouchableOpacity>
//             </View>
//           </Animated.View>
//         )}

//         <ScrollView 
//           contentContainerStyle={styles.scrollContainer}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           <Animated.View 
//             style={[
//               styles.container,
//               {
//                 opacity: fadeAnim,
//                 transform: [{ translateY: slideAnim }]
//               }
//             ]}
//           >
//             <Animated.View 
//               style={[
//                 styles.logoContainer,
//                 { transform: [{ scale: logoScale }] }
//               ]}
//             >
//               <View style={styles.logo}>
//                 <Ionicons name="school" size={50} color="#667eea" />
//               </View>
//               <Text style={styles.title}>Welcome Back</Text>
//               <Text style={styles.subtitle}>Sign in to CampusConnect</Text>
//             </Animated.View>

//             <View style={styles.inputContainer}>
//               <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
//                 <Ionicons name="person-outline" size={20} color="#667eea" style={styles.inputIcon} />
//                 <TextInput
//                   placeholder="Username"
//                   style={styles.input}
//                   onChangeText={(text) => {
//                     setUsername(text);
//                     validateField('username', text);
//                   }}
//                   value={username}
//                   autoCapitalize="none"
//                   placeholderTextColor="#999"
//                   editable={!loading}
//                 />
//               </View>
//               {errors.username ? (
//                 <View style={styles.fieldErrorContainer}>
//                   <Ionicons name="warning-outline" size={14} color="#ff4757" />
//                   <Text style={styles.errorText}>{errors.username}</Text>
//                 </View>
//               ) : null}

//               <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
//                 <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
//                 <TextInput
//                   placeholder="Password"
//                   style={styles.input}
//                   onChangeText={(text) => {
//                     setPassword(text);
//                     validateField('password', text);
//                   }}
//                   value={password}
//                   secureTextEntry={secureText}
//                   placeholderTextColor="#999"
//                   editable={!loading}
//                 />
//                 <TouchableOpacity 
//                   onPress={() => setSecureText(!secureText)} 
//                   style={styles.eyeIcon}
//                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                   disabled={loading}
//                 >
//                   <Ionicons name={secureText ? 'eye-off' : 'eye'} size={20} color="#667eea" />
//                 </TouchableOpacity>
//               </View>
//               {errors.password ? (
//                 <View style={styles.fieldErrorContainer}>
//                   <Ionicons name="warning-outline" size={14} color="#ff4757" />
//                   <Text style={styles.errorText}>{errors.password}</Text>
//                 </View>
//               ) : null}
//             </View>

//             <View style={styles.optionsContainer}>
//               <TouchableOpacity 
//                 style={styles.rememberMeContainer} 
//                 onPress={() => setRememberMe(!rememberMe)}
//                 disabled={loading}
//               >
//                 <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
//                   {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
//                 </View>
//                 <Text style={styles.rememberMeText}>Remember me</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.forgotPassword}
//                 onPress={() => router.push('/change-password' as any)}
//                 disabled={loading}
//               >
//                 <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
//               </TouchableOpacity>
//             </View>

//             <TouchableOpacity 
//               style={[styles.button, loading && styles.buttonDisabled]} 
//               onPress={handleLogin}
//               disabled={loading}
//               activeOpacity={0.8}
//             >
//               {loading ? (
//                 <View style={styles.loadingContainer}>
//                   <ActivityIndicator color="#fff" size="small" />
//                   <Text style={styles.loadingText}>Signing in...</Text>
//                 </View>
//               ) : (
//                 <>
//                   <Ionicons name="log-in-outline" size={20} color="#fff" style={styles.buttonIcon} />
//                   <Text style={styles.buttonText}>Sign In</Text>
//                 </>
//               )}
//             </TouchableOpacity>

//             <View style={styles.dividerContainer}>
//               <View style={styles.divider} />
//               <Text style={styles.dividerText}>or</Text>
//               <View style={styles.divider} />
//             </View>

//             <TouchableOpacity 
//               onPress={() => router.push('/register')} 
//               style={styles.linkContainer}
//               disabled={loading}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.linkText}>Don't have an account? </Text>
//               <Text style={styles.linkTextBold}>Create Account</Text>
//             </TouchableOpacity>
//           </Animated.View>
//         </ScrollView>
//       </LinearGradient>
//     </KeyboardAvoidingView>
//   );
// };

// export default LoginScreen;

// const styles = StyleSheet.create({
//   keyboardContainer: {
//     flex: 1,
//   },
//   gradient: {
//     flex: 1,
//   },
//   globalErrorContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 1000,
//     paddingTop: Platform.OS === 'ios' ? 50 : 30,
//     paddingHorizontal: 20,
//     paddingBottom: 15,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   errorContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   errorIcon: {
//     marginRight: 10,
//   },
//   globalErrorText: {
//     flex: 1,
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '500',
//     lineHeight: 20,
//   },
//   errorCloseButton: {
//     marginLeft: 10,
//     padding: 2,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     padding: 20,
//     paddingTop: 60, // Account for potential error message
//   },
//   container: {
//     backgroundColor: 'rgba(255, 255, 255, 0.98)',
//     borderRadius: 24,
//     padding: 32,
//     marginVertical: 20,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 15,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 25,
//     elevation: 20,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.8)',
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginBottom: 32,
//   },
//   logo: {
//     width: 90,
//     height: 90,
//     borderRadius: 45,
//     backgroundColor: '#f8f9ff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     borderWidth: 3,
//     borderColor: '#667eea',
//     shadowColor: '#667eea',
//     shadowOffset: {
//       width: 0,
//       height: 8,
//     },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: '800',
//     color: '#2c3e50',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 17,
//     color: '#7f8c8d',
//     textAlign: 'center',
//     fontWeight: '500',
//   },
//   inputContainer: {
//     marginBottom: 24,
//   },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f9ff',
//     borderRadius: 16,
//     paddingHorizontal: 18,
//     paddingVertical: 16,
//     marginBottom: 4,
//     borderWidth: 2,
//     borderColor: '#e1e8ff',
//     shadowColor: '#667eea',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   inputError: {
//     borderColor: '#ff4757',
//     backgroundColor: '#fff8f8',
//     shadowColor: '#ff4757',
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     fontSize: 17,
//     color: '#2c3e50',
//     fontWeight: '500',
//   },
//   eyeIcon: {
//     padding: 8,
//     borderRadius: 8,
//   },
//   fieldErrorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     marginLeft: 8,
//     marginTop: 4,
//   },
//   errorText: {
//     color: '#ff4757',
//     fontSize: 13,
//     marginLeft: 6,
//     fontWeight: '500',
//   },
//   optionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 28,
//   },
//   rememberMeContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   checkbox: {
//     width: 22,
//     height: 22,
//     borderRadius: 6,
//     borderWidth: 2,
//     borderColor: '#667eea',
//     marginRight: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   checkboxChecked: {
//     backgroundColor: '#667eea',
//   },
//   rememberMeText: {
//     fontSize: 15,
//     color: '#5a6c7d',
//     fontWeight: '500',
//   },
//   forgotPassword: {
//     padding: 8,
//     borderRadius: 8,
//   },
//   forgotPasswordText: {
//     fontSize: 15,
//     color: '#667eea',
//     fontWeight: '600',
//   },
//   button: {
//     backgroundColor: '#667eea',
//     borderRadius: 16,
//     paddingVertical: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 24,
//     shadowColor: '#667eea',
//     shadowOffset: {
//       width: 0,
//       height: 8,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     elevation: 12,
//     flexDirection: 'row',
//   },
//   buttonDisabled: {
//     backgroundColor: '#a5b3f0',
//     shadowOpacity: 0.1,
//   },
//   buttonIcon: {
//     marginRight: 8,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 16,
//     marginLeft: 12,
//     fontWeight: '600',
//   },
//   dividerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   divider: {
//     flex: 1,
//     height: 1.5,
//     backgroundColor: '#e1e8ff',
//   },
//   dividerText: {
//     marginHorizontal: 20,
//     color: '#95a5a6',
//     fontSize: 15,
//     fontWeight: '500',
//   },
//   linkContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 8,
//     borderRadius: 8,
//   },
//   linkText: {
//     color: '#7f8c8d',
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   linkTextBold: {
//     color: '#667eea',
//     fontSize: 16,
//     fontWeight: '700',
//   },
// });

















































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   Dimensions,
//   ScrollView,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';

// import type { StackNavigationProp } from '@react-navigation/stack';

// const { width, height } = Dimensions.get('window');

// type RootStackParamList = {
//   Dashboard: undefined;
//   Register: undefined;
// };

// type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

// interface LoginScreenProps {
//   navigation: LoginScreenNavigationProp;
// }

// const LoginScreen = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [secureText, setSecureText] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
  
//   // Validation states
//   const [errors, setErrors] = useState({
//     username: '',
//     password: '',
//   });
  
//   // Animation values
//   const [fadeAnim] = useState(new Animated.Value(0));
//   const [slideAnim] = useState(new Animated.Value(50));
//   const [logoScale] = useState(new Animated.Value(0.8));

//   const router = useRouter();

//   // Animation on component mount
//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.spring(logoScale, {
//         toValue: 1,
//         tension: 50,
//         friction: 7,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Load saved credentials if remember me was checked
//     loadSavedCredentials();
//   }, []);

//   const loadSavedCredentials = async () => {
//     try {
//       const savedUsername = await AsyncStorage.getItem('saved_username');
//       const savedRememberMe = await AsyncStorage.getItem('remember_me');
      
//       if (savedRememberMe === 'true' && savedUsername) {
//         setUsername(savedUsername);
//         setRememberMe(true);
//       }
//     } catch (error) {
//       console.log('Error loading saved credentials:', error);
//     }
//   };

//   // Real-time validation
//   const validateField = (field: string, value: string) => {
//     const newErrors = { ...errors };
    
//     switch (field) {
//       case 'username':
//         newErrors.username = value.length < 3 ? 'Username must be at least 3 characters' : '';
//         break;
//       case 'password':
//         newErrors.password = value.length < 1 ? 'Password is required' : '';
//         break;
//     }
    
//     setErrors(newErrors);
//   };

//   const handleLogin = async () => {
//     // Validate fields
//     validateField('username', username);
//     validateField('password', password);

//     if (!username || !password) {
//       return Alert.alert('Error', 'Please fill all fields');
//     }

//     // Check if any errors exist
//     const hasErrors = Object.values(errors).some(error => error !== '');
//     if (hasErrors) {
//       Alert.alert('Error', 'Please fix all errors');
//       return;
//     }

//     setLoading(true);
//     try {
//       const getBaseUrl = () => {
//         if (Platform.OS === 'web') {
//           return 'http://localhost:8000';
//         } else if (Platform.OS === 'android') {
//           // return 'http://192.168.220.16:8000';
//           return 'http://192.168.130.16:8000';
//           // return 'http://10.0.2.2:8000';
//         } else {
//           return 'http://127.0.0.1:8000';
//         }
//       };

//       const res = await axios.post(`${getBaseUrl()}/api/login/`, { 
//         username: username.trim(), 
//         password 
//       }, {
//         timeout: 10000,
//       });
      
//       const token = res.data.access;

//       await AsyncStorage.setItem('access_token', token);

//       // Save credentials if remember me is checked
//       if (rememberMe) {
//         await AsyncStorage.setItem('saved_username', username.trim());
//         await AsyncStorage.setItem('remember_me', 'true');
//       } else {
//         await AsyncStorage.removeItem('saved_username');
//         await AsyncStorage.removeItem('remember_me');
//       }

//       const profile = await axios.get(`${getBaseUrl()}/api/profile/`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       await AsyncStorage.setItem('user_profile', JSON.stringify(profile.data));
//       setLoading(false);
      
//       // Success animation before navigation
//       Animated.sequence([
//         Animated.timing(logoScale, {
//           toValue: 1.1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//         Animated.timing(logoScale, {
//           toValue: 1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//       ]).start(() => {
//         router.push('auth/dashboard');
//       });
      
//     } catch (error: any) {
//       setLoading(false);
//       console.error('Login error:', error);
      
//       let errorMessage = 'Invalid username or password';
      
//       if (error.response) {
//         errorMessage = error.response.data?.detail || 
//                       error.response.data?.message || 
//                       'Login failed';
//       } else if (error.request) {
//         errorMessage = 'Network error. Please check your connection.';
//       } else if (error.code === 'ECONNABORTED') {
//         errorMessage = 'Request timeout. Please try again.';
//       }
      
//       Alert.alert('Login Failed', errorMessage);
//     }
//   };

//   return (
//     <KeyboardAvoidingView 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.keyboardContainer}
//     >
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.gradient}
//       >
//         <ScrollView 
//           contentContainerStyle={styles.scrollContainer}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           <Animated.View 
//             style={[
//               styles.container,
//               {
//                 opacity: fadeAnim,
//                 transform: [{ translateY: slideAnim }]
//               }
//             ]}
//           >
//             <Animated.View 
//               style={[
//                 styles.logoContainer,
//                 { transform: [{ scale: logoScale }] }
//               ]}
//             >
//               <View style={styles.logo}>
//                 <Ionicons name="school" size={50} color="#667eea" />
//               </View>
//               <Text style={styles.title}>Welcome Back</Text>
//               <Text style={styles.subtitle}>Sign in to CampusConnect</Text>
//             </Animated.View>

//             <View style={styles.inputContainer}>
//               <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
//                 <Ionicons name="person-outline" size={20} color="#667eea" style={styles.inputIcon} />
//                 <TextInput
//                   placeholder="Username"
//                   style={styles.input}
//                   onChangeText={(text) => {
//                     setUsername(text);
//                     validateField('username', text);
//                   }}
//                   value={username}
//                   autoCapitalize="none"
//                   placeholderTextColor="#999"
//                 />
//               </View>
//               {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

//               <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
//                 <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.inputIcon} />
//                 <TextInput
//                   placeholder="Password"
//                   style={styles.input}
//                   onChangeText={(text) => {
//                     setPassword(text);
//                     validateField('password', text);
//                   }}
//                   value={password}
//                   secureTextEntry={secureText}
//                   placeholderTextColor="#999"
//                 />
//                 <TouchableOpacity 
//                   onPress={() => setSecureText(!secureText)} 
//                   style={styles.eyeIcon}
//                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                 >
//                   <Ionicons name={secureText ? 'eye-off' : 'eye'} size={20} color="#667eea" />
//                 </TouchableOpacity>
//               </View>
//               {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
//             </View>

//             <View style={styles.optionsContainer}>
//               <TouchableOpacity 
//                 style={styles.rememberMeContainer} 
//                 onPress={() => setRememberMe(!rememberMe)}
//               >
//                 <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
//                   {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
//                 </View>
//                 <Text style={styles.rememberMeText}>Remember me</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.forgotPassword}
//                 onPress={() => router.push('/change-password' as any)}
//               >
//                 <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
//               </TouchableOpacity>
//             </View>

//             <TouchableOpacity 
//               style={[styles.button, loading && styles.buttonDisabled]} 
//               onPress={handleLogin}
//               disabled={loading}
//             >
//               {loading ? (
//                 <View style={styles.loadingContainer}>
//                   <ActivityIndicator color="#fff" size="small" />
//                   <Text style={styles.loadingText}>Signing in...</Text>
//                 </View>
//               ) : (
//                 <Text style={styles.buttonText}>Sign In</Text>
//               )}
//             </TouchableOpacity>

//             <View style={styles.dividerContainer}>
//               <View style={styles.divider} />
//               <Text style={styles.dividerText}>or</Text>
//               <View style={styles.divider} />
//             </View>

//             <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkContainer}>
//               <Text style={styles.linkText}>Don't have an account? </Text>
//               <Text style={styles.linkTextBold}>Create Account</Text>
//             </TouchableOpacity>
//           </Animated.View>
//         </ScrollView>
//       </LinearGradient>
//     </KeyboardAvoidingView>
//   );
// };

// export default LoginScreen;

// const styles = StyleSheet.create({
//   keyboardContainer: {
//     flex: 1,
//   },
//   gradient: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     padding: 20,
//   },
//   container: {
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     borderRadius: 20,
//     padding: 30,
//     marginVertical: 20,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 10,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 10,
//     elevation: 15,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   logo: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#f8f9ff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     borderWidth: 2,
//     borderColor: '#667eea',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 5,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//   },
//   inputContainer: {
//     marginBottom: 20,
//   },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f9ff',
//     borderRadius: 12,
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: '#e1e8ff',
//   },
//   inputError: {
//     borderColor: '#ff4757',
//     backgroundColor: '#fff5f5',
//   },
//   inputIcon: {
//     marginRight: 10,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     color: '#333',
//   },
//   eyeIcon: {
//     padding: 5,
//   },
//   errorText: {
//     color: '#ff4757',
//     fontSize: 12,
//     marginBottom: 10,
//     marginLeft: 5,
//   },
//   optionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 25,
//   },
//   rememberMeContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   checkbox: {
//     width: 20,
//     height: 20,
//     borderRadius: 4,
//     borderWidth: 2,
//     borderColor: '#667eea',
//     marginRight: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   checkboxChecked: {
//     backgroundColor: '#667eea',
//   },
//   rememberMeText: {
//     fontSize: 14,
//     color: '#666',
//   },
//   forgotPassword: {
//     padding: 5,
//   },
//   forgotPasswordText: {
//     fontSize: 14,
//     color: '#667eea',
//     fontWeight: '500',
//   },
//   button: {
//     backgroundColor: '#667eea',
//     borderRadius: 12,
//     paddingVertical: 15,
//     alignItems: 'center',
//     marginBottom: 20,
//     shadowColor: '#667eea',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   buttonDisabled: {
//     backgroundColor: '#a5b3f0',
//     shadowOpacity: 0.1,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 16,
//     marginLeft: 10,
//   },
//   dividerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   divider: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#e1e8ff',
//   },
//   dividerText: {
//     marginHorizontal: 15,
//     color: '#999',
//     fontSize: 14,
//   },
//   linkContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   linkText: {
//     color: '#666',
//     fontSize: 16,
//   },
//   linkTextBold: {
//     color: '#667eea',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });














































// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';

// import type { StackNavigationProp } from '@react-navigation/stack';

// type RootStackParamList = {
//   Dashboard: undefined;
//   Register: undefined;
// };

// type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

// interface LoginScreenProps {
//   navigation: LoginScreenNavigationProp;
// }

// const LoginScreen = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [secureText, setSecureText] = useState(true);
//   const [loading, setLoading] = useState(false);

//   const router = useRouter();

//   const handleLogin = async () => {
//     if (!username || !password) {
//       return Alert.alert('Error', 'Please fill all fields');
//     }

//     setLoading(true);
//     try {
//       const res = await axios.post('http://127.0.0.1:8000/api/login/', { username, password });
//       const token = res.data.access;

//       await AsyncStorage.setItem('access_token', token);

//       const profile = await axios.get('http://127.0.0.1:8000/api/profile/', {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       await AsyncStorage.setItem('user_profile', JSON.stringify(profile.data));
//       setLoading(false);
//       router.push('/');
//     } catch (error) {
//       setLoading(false);
//       Alert.alert('Login failed', 'Invalid username or password');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>CampusConnect Login</Text>

//       <TextInput
//         placeholder="Username"
//         style={styles.input}
//         onChangeText={setUsername}
//         autoCapitalize="none"
//       />

//       <View style={styles.passwordContainer}>
//         <TextInput
//           placeholder="Password"
//           style={styles.passwordInput}
//           onChangeText={setPassword}
//           secureTextEntry={secureText}
//         />
//         <TouchableOpacity onPress={() => setSecureText(!secureText)}>
//           <Ionicons name={secureText ? 'eye-off' : 'eye'} size={24} color="gray" />
//         </TouchableOpacity>
//       </View>

//       <TouchableOpacity style={styles.button} onPress={handleLogin}>
//         {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
//       </TouchableOpacity>

//       <TouchableOpacity onPress={() => router.push('/register')}>
//         <Text style={styles.linkText}>Don't have an account? Register</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default LoginScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', padding: 20 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
//   input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 15 },
//   passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginBottom: 15 },
//   passwordInput: { flex: 1, paddingVertical: 10 },
//   button: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
//   buttonText: { color: '#fff', fontWeight: 'bold' },
//   linkText: { textAlign: 'center', color: '#007bff' },
// });
