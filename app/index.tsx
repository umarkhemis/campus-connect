
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   Dimensions,
//   Modal,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import ProfileScreen from './profile'; 

// const { width } = Dimensions.get('window');

// type UserProfile = {
//   username?: string;
//   profile_picture?: string | null;
//   course?: string;
//   year?: string | number;
//   email?: string;
// };

// export default function Dashboard() {
//   const router = useRouter();
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [showProfile, setShowProfile] = useState(false);

//   useEffect(() => {
//     loadUserProfile();
//   }, []);

//   const loadUserProfile = async () => {
//     try {
//       const storedProfile = await AsyncStorage.getItem('user_profile');
//       if (storedProfile) {
//         const profile = JSON.parse(storedProfile);
//         setUserProfile(profile);
//       }
//     } catch (error) {
//       console.error('Error loading user profile:', error);
//       Alert.alert('Error', 'Failed to load user profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     Alert.alert(
//       'Logout',
//       'Are you sure you want to logout?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Logout',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await AsyncStorage.removeItem('access_token');
//               await AsyncStorage.removeItem('user_profile');
//               await AsyncStorage.removeItem('user');
//               router.replace('/login');
//             } catch (error) {
//               console.error('Error during logout:', error);
//               Alert.alert('Error', 'Failed to logout properly');
//             }
//           },
//         },
//       ]
//     );

//       await AsyncStorage.removeItem('access_token');
//       await AsyncStorage.removeItem('user');
//       router.replace('/login');
//   };

//   const hasProfileImage = (): boolean => {
//     if (!userProfile?.profile_picture) return false;
    
//     const pic = userProfile.profile_picture.trim();
    
//     // Check for invalid values
//     if (pic === '' || pic === 'null' || pic === 'undefined') return false;
    
//     return true;
//   };

//   const getProfileImageSource = () => {
//     if (!hasProfileImage()) return null;
    
//     const pic = userProfile!.profile_picture!.trim();
    
//     // If it's already a complete data URI
//     if (pic.startsWith('data:image')) {
//       return { uri: pic };
//     }
    
//     // If it's a complete URL (starts with http)
//     if (pic.startsWith('http')) {
//       return { uri: pic };
//     }
    
//     // If it contains /media/ path, construct full URL
//     if (pic.includes('/media/')) {
//       const baseUrl = 'http://127.0.0.1:8000'; // Your Django backend URL
//       const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
//       console.log('Converting media path to URL:', fullUrl);
//       return { uri: fullUrl };
//     }
    
//     // If it looks like a valid base64 string (no file paths)
//     if (typeof pic === 'string' && 
//         !pic.includes('/') && 
//         !pic.includes('.') && 
//         pic.length > 50) { // Base64 strings are typically long
//       return { uri: `data:image/jpeg;base64,${pic}` };
//     }
    
//     console.log('Unrecognized profile picture format:', pic.substring(0, 100));
//     return null;
//   };

//   const getInitials = (name?: string): string => {
//     if (!name) return 'U';
//     return name.charAt(0).toUpperCase();
//   };

//   const getGreeting = (): string => {
//     const hour = new Date().getHours();
//     if (hour < 12) return 'Good Morning';
//     if (hour < 18) return 'Good Afternoon';
//     return 'Good Evening';
//   };

//   const handleProfilePress = () => {
//     setShowProfile(true);
//   };

//   const onProfileUpdate = async () => {
//     // Reload profile data after update
//     await loadUserProfile();
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading Dashboard...</Text>
//       </View>
//     );
//   }

//   return (
//     <>
//       <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//         <LinearGradient
//           colors={['#667eea', '#764ba2']}
//           style={styles.headerGradient}
//         >
//           <View style={styles.header}>
//             <TouchableOpacity 
//               style={styles.profileSection}
//               onPress={handleProfilePress}
//             >
//               <View style={styles.profileImageContainer}>
//                 {hasProfileImage() && getProfileImageSource() ? (
//                   <Image 
//                     source={getProfileImageSource()!} 
//                     style={styles.profileImage}
//                     onError={(error) => {
//                       console.log('Profile image failed to load:', error);
//                     }}
//                   />
//                 ) : (
//                   <View style={styles.profilePlaceholder}>
//                     <Text style={styles.initials}>
//                       {getInitials(userProfile?.username)}
//                     </Text>
//                   </View>
//                 )}
//                 <View style={styles.onlineIndicator} />
//               </View>
              
//               <View style={styles.userInfo}>
//                 <Text style={styles.greeting}>{getGreeting()}</Text>
//                 <Text style={styles.userName}>
//                   {userProfile?.username || 'Student'}
//                 </Text>
//                 <View style={styles.userDetails}>
//                   {userProfile?.course && (
//                     <View style={styles.detailItem}>
//                       <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.8)" />
//                       <Text style={styles.detailText}>{userProfile.course}</Text>
//                     </View>
//                   )}
//                   {userProfile?.year && (
//                     <View style={styles.detailItem}>
//                       <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
//                       <Text style={styles.detailText}>Year {userProfile.year}</Text>
//                     </View>
//                   )}
//                 </View>
//               </View>
              
//               <View style={styles.profileArrow}>
//                 <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
//               </View>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={styles.logoutButton} 
//               onPress={handleLogout}
//             >
//               <Ionicons name="log-out-outline" size={24} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </LinearGradient>

//         <View style={styles.content}>
//           <View style={styles.welcomeCard}>
//             <Text style={styles.welcomeTitle}>Welcome to CampusConnect</Text>
//             <Text style={styles.welcomeSubtitle}>
//               Your gateway to campus life and connections
//             </Text>
//           </View>

//           {/* Quick Stats */}
//           <View style={styles.statsContainer}>
//             <View style={styles.statCard}>
//               <Ionicons name="people-outline" size={24} color="#667eea" />
//               <Text style={styles.statNumber}>0</Text>
//               <Text style={styles.statLabel}>Connections</Text>
//             </View>
//             <View style={styles.statCard}>
//               <Ionicons name="chatbubbles-outline" size={24} color="#667eea" />
//               <Text style={styles.statNumber}>0</Text>
//               <Text style={styles.statLabel}>Messages</Text>
//             </View>
//             <View style={styles.statCard}>
//               <Ionicons name="calendar-outline" size={24} color="#667eea" />
//               <Text style={styles.statNumber}>0</Text>
//               <Text style={styles.statLabel}>Events</Text>
//             </View>
//           </View>

//           {/* Quick Actions */}
//           <View style={styles.actionsContainer}>
//             <Text style={styles.sectionTitle}>Quick Actions</Text>
            
//             <TouchableOpacity style={styles.actionCard}>
//               <View style={styles.actionIcon}>
//                 <Ionicons name="person-add-outline" size={24} color="#667eea" />
//               </View>
//               <View style={styles.actionContent}>
//                 <Text style={styles.actionTitle}>Find Students</Text>
//                 <Text style={styles.actionSubtitle}>Connect with your classmates</Text>
//               </View>
//               <Ionicons name="chevron-forward" size={20} color="#ccc" />
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.actionCard}>
//               <View style={styles.actionIcon}>
//                 <Ionicons name="chatbubble-outline" size={24} color="#667eea" />
//               </View>
//               <View style={styles.actionContent}>
//                 <Text style={styles.actionTitle}>Messages</Text>
//                 <Text style={styles.actionSubtitle}>Chat with your connections</Text>
//               </View>
//               <Ionicons name="chevron-forward" size={20} color="#ccc" />
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.actionCard}>
//               <View style={styles.actionIcon}>
//                 <Ionicons name="calendar-outline" size={24} color="#667eea" />
//               </View>
//               <View style={styles.actionContent}>
//                 <Text style={styles.actionTitle}>Events</Text>
//                 <Text style={styles.actionSubtitle}>Discover campus events</Text>
//               </View>
//               <Ionicons name="chevron-forward" size={20} color="#ccc" />
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={styles.actionCard}
//               onPress={handleProfilePress}
//             >
//               <View style={styles.actionIcon}>
//                 <Ionicons name="settings-outline" size={24} color="#667eea" />
//               </View>
//               <View style={styles.actionContent}>
//                 <Text style={styles.actionTitle}>Profile & Settings</Text>
//                 <Text style={styles.actionSubtitle}>Manage your account</Text>
//               </View>
//               <Ionicons name="chevron-forward" size={20} color="#ccc" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </ScrollView>

//       {/* Profile Modal */}
//       <Modal
//         visible={showProfile}
//         animationType="slide"
//         presentationStyle="pageSheet"
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>Profile</Text>
//             <TouchableOpacity
//               style={styles.closeButton}
//               onPress={() => setShowProfile(false)}
//             >
//               <Ionicons name="close" size={24} color="#333" />
//             </TouchableOpacity>
//           </View>
//           <ProfileScreen onProfileUpdate={onProfileUpdate} />
//         </View>
//       </Modal>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9ff',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9ff',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#667eea',
//   },
//   headerGradient: {
//     paddingTop: 50,
//     paddingBottom: 30,
//     borderBottomLeftRadius: 25,
//     borderBottomRightRadius: 25,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//   },
//   profileSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     paddingRight: 10,
//   },
//   profileImageContainer: {
//     position: 'relative',
//     marginRight: 15,
//   },
//   profileImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   profilePlaceholder: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   initials: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#2ed573',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   userInfo: {
//     flex: 1,
//   },
//   greeting: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     marginBottom: 2,
//   },
//   userName: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 5,
//   },
//   userDetails: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 15,
//     marginBottom: 2,
//   },
//   detailText: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.8)',
//     marginLeft: 4,
//   },
//   profileArrow: {
//     marginLeft: 10,
//   },
//   logoutButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     padding: 20,
//   },
//   welcomeCard: {
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     padding: 20,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   welcomeTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 5,
//   },
//   welcomeSubtitle: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 25,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 15,
//     alignItems: 'center',
//     marginHorizontal: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 8,
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#666',
//   },
//   actionsContainer: {
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 15,
//   },
//   actionCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   actionIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#f8f9ff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   actionContent: {
//     flex: 1,
//   },
//   actionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 2,
//   },
//   actionSubtitle: {
//     fontSize: 13,
//     color: '#666',
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 50,
//     paddingBottom: 20,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   closeButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#f5f5f5',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });
































































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   Dimensions,
//   Modal,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// // import ProfileScreen from './ProfileScreen'; // Adjust path as needed
// import ProfileScreen from './profile'

// const { width } = Dimensions.get('window');

// type UserProfile = {
//   username?: string;
//   profile_picture?: string | null;
//   course?: string;
//   year?: string | number;
//   email?: string;
// };

// export default function Dashboard() {
//   const router = useRouter();
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [showProfile, setShowProfile] = useState(false);

//   useEffect(() => {
//     loadUserProfile();
//   }, []);

//   const loadUserProfile = async () => {
//     try {
//       const storedProfile = await AsyncStorage.getItem('user_profile');
//       if (storedProfile) {
//         const profile = JSON.parse(storedProfile);
//         setUserProfile(profile);
//       }
//     } catch (error) {
//       console.error('Error loading user profile:', error);
//       Alert.alert('Error', 'Failed to load user profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     Alert.alert(
//       'Logout',
//       'Are you sure you want to logout?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Logout',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await AsyncStorage.removeItem('access_token');
//               await AsyncStorage.removeItem('user_profile');
//               await AsyncStorage.removeItem('user');
//               router.replace('/login');
//             } catch (error) {
//               console.error('Error during logout:', error);
//               Alert.alert('Error', 'Failed to logout properly');
//             }
//           },
//         },
//       ]
//     );
//         await AsyncStorage.removeItem('access_token');
//         await AsyncStorage.removeItem('user');
//         router.replace('/login');
//   };

//   const hasProfileImage = (): boolean => {
//     if (!userProfile?.profile_picture) return false;
    
//     const pic = userProfile.profile_picture.trim();
    
//     // Check for invalid values
//     if (pic === '' || pic === 'null' || pic === 'undefined') return false;
    
//     // Check if it contains file path (invalid for web)
//     if (pic.includes('/media/') && !pic.startsWith('http') && !pic.startsWith('data:')) {
//       console.log('Invalid profile picture format detected:', pic);
//       return false;
//     }
    
//     return true;
//   };

//   const getProfileImageSource = () => {
//     if (!hasProfileImage()) return null;
    
//     const pic = userProfile!.profile_picture!.trim();
    
//     // If it's already a complete data URI
//     if (pic.startsWith('data:image')) {
//       return { uri: pic };
//     }
    
//     // If it's a complete URL (starts with http)
//     if (pic.startsWith('http')) {
//       return { uri: pic };
//     }
    
//     // If it looks like a valid base64 string (no file paths)
//     if (typeof pic === 'string' && 
//         !pic.includes('/') && 
//         !pic.includes('.') && 
//         pic.length > 50) { // Base64 strings are typically long
//       return { uri: `data:image/jpeg;base64,${pic}` };
//     }
    
//     console.log('Unrecognized profile picture format:', pic.substring(0, 100));
//     return null;
//   };

//   const getInitials = (name?: string): string => {
//     if (!name) return 'U';
//     return name.charAt(0).toUpperCase();
//   };

//   const getGreeting = (): string => {
//     const hour = new Date().getHours();
//     if (hour < 12) return 'Good Morning';
//     if (hour < 18) return 'Good Afternoon';
//     return 'Good Evening';
//   };

//   const handleProfilePress = () => {
//     setShowProfile(true);
//   };

//   const onProfileUpdate = async () => {
//     // Reload profile data after update
//     await loadUserProfile();
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading Dashboard...</Text>
//       </View>
//     );
//   }

//   return (
//     <>
//       <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//         <LinearGradient
//           colors={['#667eea', '#764ba2']}
//           style={styles.headerGradient}
//         >
//           <View style={styles.header}>
//             <TouchableOpacity 
//               style={styles.profileSection}
//               onPress={handleProfilePress}
//             >
//               <View style={styles.profileImageContainer}>
//                 {hasProfileImage() && getProfileImageSource() ? (
//                   <Image 
//                     source={getProfileImageSource()!} 
//                     style={styles.profileImage}
//                     onError={(error) => {
//                       console.log('Profile image failed to load:', error);
//                     }}
//                   />
//                 ) : (
//                   <View style={styles.profilePlaceholder}>
//                     <Text style={styles.initials}>
//                       {getInitials(userProfile?.username)}
//                     </Text>
//                   </View>
//                 )}
//                 <View style={styles.onlineIndicator} />
//               </View>
              
//               <View style={styles.userInfo}>
//                 <Text style={styles.greeting}>{getGreeting()}</Text>
//                 <Text style={styles.userName}>
//                   {userProfile?.username || 'Student'}
//                 </Text>
//                 <View style={styles.userDetails}>
//                   {userProfile?.course && (
//                     <View style={styles.detailItem}>
//                       <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.8)" />
//                       <Text style={styles.detailText}>{userProfile.course}</Text>
//                     </View>
//                   )}
//                   {userProfile?.year && (
//                     <View style={styles.detailItem}>
//                       <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
//                       <Text style={styles.detailText}>Year {userProfile.year}</Text>
//                     </View>
//                   )}
//                 </View>
//               </View>
              
//               <View style={styles.profileArrow}>
//                 <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
//               </View>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={styles.logoutButton} 
//               onPress={handleLogout}
//             >
//               <Ionicons name="log-out-outline" size={24} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </LinearGradient>

//         <View style={styles.content}>
//           <View style={styles.welcomeCard}>
//             <Text style={styles.welcomeTitle}>Welcome to CampusConnect</Text>
//             <Text style={styles.welcomeSubtitle}>
//               Your gateway to campus life and connections
//             </Text>
//           </View>

//           {/* Quick Stats */}
//           <View style={styles.statsContainer}>
//             <View style={styles.statCard}>
//               <Ionicons name="people-outline" size={24} color="#667eea" />
//               <Text style={styles.statNumber}>0</Text>
//               <Text style={styles.statLabel}>Connections</Text>
//             </View>
//             <View style={styles.statCard}>
//               <Ionicons name="chatbubbles-outline" size={24} color="#667eea" />
//               <Text style={styles.statNumber}>0</Text>
//               <Text style={styles.statLabel}>Messages</Text>
//             </View>
//             <View style={styles.statCard}>
//               <Ionicons name="calendar-outline" size={24} color="#667eea" />
//               <Text style={styles.statNumber}>0</Text>
//               <Text style={styles.statLabel}>Events</Text>
//             </View>
//           </View>

//           {/* Quick Actions */}
//           <View style={styles.actionsContainer}>
//             <Text style={styles.sectionTitle}>Quick Actions</Text>
            
//             <TouchableOpacity style={styles.actionCard}>
//               <View style={styles.actionIcon}>
//                 <Ionicons name="person-add-outline" size={24} color="#667eea" />
//               </View>
//               <View style={styles.actionContent}>
//                 <Text style={styles.actionTitle}>Find Students</Text>
//                 <Text style={styles.actionSubtitle}>Connect with your classmates</Text>
//               </View>
//               <Ionicons name="chevron-forward" size={20} color="#ccc" />
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.actionCard}>
//               <View style={styles.actionIcon}>
//                 <Ionicons name="chatbubble-outline" size={24} color="#667eea" />
//               </View>
//               <View style={styles.actionContent}>
//                 <Text style={styles.actionTitle}>Messages</Text>
//                 <Text style={styles.actionSubtitle}>Chat with your connections</Text>
//               </View>
//               <Ionicons name="chevron-forward" size={20} color="#ccc" />
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.actionCard}>
//               <View style={styles.actionIcon}>
//                 <Ionicons name="calendar-outline" size={24} color="#667eea" />
//               </View>
//               <View style={styles.actionContent}>
//                 <Text style={styles.actionTitle}>Events</Text>
//                 <Text style={styles.actionSubtitle}>Discover campus events</Text>
//               </View>
//               <Ionicons name="chevron-forward" size={20} color="#ccc" />
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={styles.actionCard}
//               onPress={handleProfilePress}
//             >
//               <View style={styles.actionIcon}>
//                 <Ionicons name="settings-outline" size={24} color="#667eea" />
//               </View>
//               <View style={styles.actionContent}>
//                 <Text style={styles.actionTitle}>Profile & Settings</Text>
//                 <Text style={styles.actionSubtitle}>Manage your account</Text>
//               </View>
//               <Ionicons name="chevron-forward" size={20} color="#ccc" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </ScrollView>

//       {/* Profile Modal */}
//       <Modal
//         visible={showProfile}
//         animationType="slide"
//         presentationStyle="pageSheet"
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>Profile</Text>
//             <TouchableOpacity
//               style={styles.closeButton}
//               onPress={() => setShowProfile(false)}
//             >
//               <Ionicons name="close" size={24} color="#333" />
//             </TouchableOpacity>
//           </View>
//           <ProfileScreen onProfileUpdate={onProfileUpdate} />
//         </View>
//       </Modal>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9ff',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9ff',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#667eea',
//   },
//   headerGradient: {
//     paddingTop: 50,
//     paddingBottom: 30,
//     borderBottomLeftRadius: 25,
//     borderBottomRightRadius: 25,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//   },
//   profileSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     paddingRight: 10,
//   },
//   profileImageContainer: {
//     position: 'relative',
//     marginRight: 15,
//   },
//   profileImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   profilePlaceholder: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   initials: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#2ed573',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   userInfo: {
//     flex: 1,
//   },
//   greeting: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     marginBottom: 2,
//   },
//   userName: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 5,
//   },
//   userDetails: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 15,
//     marginBottom: 2,
//   },
//   detailText: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.8)',
//     marginLeft: 4,
//   },
//   profileArrow: {
//     marginLeft: 10,
//   },
//   logoutButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     padding: 20,
//   },
//   welcomeCard: {
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     padding: 20,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   welcomeTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 5,
//   },
//   welcomeSubtitle: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 25,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 15,
//     alignItems: 'center',
//     marginHorizontal: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 8,
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#666',
//   },
//   actionsContainer: {
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 15,
//   },
//   actionCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   actionIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#f8f9ff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   actionContent: {
//     flex: 1,
//   },
//   actionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 2,
//   },
//   actionSubtitle: {
//     fontSize: 13,
//     color: '#666',
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 50,
//     paddingBottom: 20,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   closeButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#f5f5f5',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });





































































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   Dimensions,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';

// const { width } = Dimensions.get('window');

// export default function Dashboard() {
//   const router = useRouter();
//   type UserProfile = {
//     username?: string;
//     profile_picture?: string | null;
//     course?: string;
//     year?: string | number;
//     // add other properties as needed
//   };
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadUserProfile();
//   }, []);

//   const loadUserProfile = async () => {
//     try {
//       const storedProfile = await AsyncStorage.getItem('user_profile');
//       if (storedProfile) {
//         const profile = JSON.parse(storedProfile);
//         setUserProfile(profile);
//       }
//     } catch (error) {
//       console.error('Error loading user profile:', error);
//       Alert.alert('Error', 'Failed to load user profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     Alert.alert(
//       'Logout',
//       'Are you sure you want to logout?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Logout',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await AsyncStorage.removeItem('access_token');
//               await AsyncStorage.removeItem('user_profile');
//               router.replace('/login');
//             } catch (error) {
//               console.error('Error during logout:', error);
//               Alert.alert('Error', 'Failed to logout properly');
//             }
//           },
//         },
//       ]
//     );

//       await AsyncStorage.removeItem('access_token');
//       await AsyncStorage.removeItem('user');
//       router.replace('/login');

//   };

//   const hasProfileImage = () => {
//     if (!userProfile?.profile_picture) return false;
    
//     if (!userProfile) return false;
//     const pic = userProfile.profile_picture.trim();
    
//     // Check for invalid values
//     if (pic === '' || pic === 'null' || pic === null) return false;
    
//     // Check if it contains file path (invalid for web)
//     if (pic.includes('/media/') || pic.includes('.jpeg') || pic.includes('.jpg') || pic.includes('.png')) {
//       console.log('Invalid profile picture format detected:', pic);
//       return false;
//     }
    
//     return true;
//   };

//   const getProfileImageSource = () => {
//     if (hasProfileImage()) {
//       const pic = userProfile.profile_picture.trim();
      
//       // If it's already a complete data URI
//       if (pic.startsWith('data:image')) {
//         return { uri: pic };
//       }
      
//       // If it looks like a valid base64 string (no file paths)
//       if (typeof pic === 'string' && 
//           !pic.includes('/') && 
//           !pic.includes('.') && 
//           pic.length > 50) { // Base64 strings are typically long
//         return { uri: `data:image/jpeg;base64,${pic}` };
//       }
      
//       // If it's a complete URL (starts with http)
//       if (pic.startsWith('http')) {
//         return { uri: pic };
//       }
      
//       console.log('Unrecognized profile picture format:', pic.substring(0, 100));
//     }
//     return null;
//   };

//   const getInitials = (name) => {
//     if (!name) return 'U';
//     // Get only the first letter of the name (first name)
//     return name.charAt(0).toUpperCase();
//   };

//   const getGreeting = () => {
//     const hour = new Date().getHours();
//     if (hour < 12) return 'Good Morning';
//     if (hour < 18) return 'Good Afternoon';
//     return 'Good Evening';
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading Dashboard...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.headerGradient}
//       >
//         <View style={styles.header}>
//           <View style={styles.profileSection}>
//             <View style={styles.profileImageContainer}>
//               {hasProfileImage() ? (
//                 <Image 
//                   source={getProfileImageSource()} 
//                   style={styles.profileImage}
//                   onError={() => {
//                     // If image fails to load, fall back to initials
//                     console.log('Profile image failed to load');
//                   }}
//                 />
//               ) : (
//                 <View style={styles.profilePlaceholder}>
//                   <Text style={styles.initials}>
//                     {getInitials(userProfile?.username)}
//                   </Text>
//                 </View>
//               )}
//               <View style={styles.onlineIndicator} />
//             </View>
            
//             <View style={styles.userInfo}>
//               <Text style={styles.greeting}>{getGreeting()}</Text>
//               <Text style={styles.userName}>
//                 {userProfile?.username || 'Student'}
//               </Text>
//               <View style={styles.userDetails}>
//                 {userProfile?.course && (
//                   <View style={styles.detailItem}>
//                     <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.8)" />
//                     <Text style={styles.detailText}>{userProfile.course}</Text>
//                   </View>
//                 )}
//                 {userProfile?.year && (
//                   <View style={styles.detailItem}>
//                     <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
//                     <Text style={styles.detailText}>Year {userProfile.year}</Text>
//                   </View>
//                 )}
//               </View>
//             </View>
//           </View>

//           <TouchableOpacity 
//             style={styles.logoutButton} 
//             onPress={handleLogout}
//           >
//             <Ionicons name="log-out-outline" size={24} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>

//       <View style={styles.content}>
//         <View style={styles.welcomeCard}>
//           <Text style={styles.welcomeTitle}>Welcome to CampusConnect</Text>
//           <Text style={styles.welcomeSubtitle}>
//             Your gateway to campus life and connections
//           </Text>
//         </View>

//         {/* Quick Stats */}
//         <View style={styles.statsContainer}>
//           <View style={styles.statCard}>
//             <Ionicons name="people-outline" size={24} color="#667eea" />
//             <Text style={styles.statNumber}>0</Text>
//             <Text style={styles.statLabel}>Connections</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Ionicons name="chatbubbles-outline" size={24} color="#667eea" />
//             <Text style={styles.statNumber}>0</Text>
//             <Text style={styles.statLabel}>Messages</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Ionicons name="calendar-outline" size={24} color="#667eea" />
//             <Text style={styles.statNumber}>0</Text>
//             <Text style={styles.statLabel}>Events</Text>
//           </View>
//         </View>

//         {/* Quick Actions */}
//         <View style={styles.actionsContainer}>
//           <Text style={styles.sectionTitle}>Quick Actions</Text>
          
//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="person-add-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Find Students</Text>
//               <Text style={styles.actionSubtitle}>Connect with your classmates</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="chatbubble-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Messages</Text>
//               <Text style={styles.actionSubtitle}>Chat with your connections</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="calendar-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Events</Text>
//               <Text style={styles.actionSubtitle}>Discover campus events</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="settings-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Settings</Text>
//               <Text style={styles.actionSubtitle}>Manage your account</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </ScrollView>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9ff',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9ff',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#667eea',
//   },
//   headerGradient: {
//     paddingTop: 50,
//     paddingBottom: 30,
//     borderBottomLeftRadius: 25,
//     borderBottomRightRadius: 25,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//   },
//   profileSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   profileImageContainer: {
//     position: 'relative',
//     marginRight: 15,
//   },
//   profileImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   profilePlaceholder: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   initials: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#2ed573',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   userInfo: {
//     flex: 1,
//   },
//   greeting: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     marginBottom: 2,
//   },
//   userName: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 5,
//   },
//   userDetails: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 15,
//     marginBottom: 2,
//   },
//   detailText: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.8)',
//     marginLeft: 4,
//   },
//   logoutButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     padding: 20,
//   },
//   welcomeCard: {
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     padding: 20,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   welcomeTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 5,
//   },
//   welcomeSubtitle: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 25,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 15,
//     alignItems: 'center',
//     marginHorizontal: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 8,
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#666',
//   },
//   actionsContainer: {
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 15,
//   },
//   actionCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   actionIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#f8f9ff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   actionContent: {
//     flex: 1,
//   },
//   actionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 2,
//   },
//   actionSubtitle: {
//     fontSize: 13,
//     color: '#666',
//   },
// });

















































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   Dimensions,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';

// const { width } = Dimensions.get('window');

// export default function Dashboard() {
//   const router = useRouter();
//   const [userProfile, setUserProfile] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadUserProfile();
//   }, []);

//   const loadUserProfile = async () => {
//     try {
//       // const storedProfile = await AsyncStorage.getItem('user');
//       const storedProfile = await AsyncStorage.getItem('user_profile');
//       if (storedProfile) {
//         const profile = JSON.parse(storedProfile);
//         setUserProfile(profile);
//       }
//     } catch (error) {
//       console.error('Error loading user profile:', error);
//       Alert.alert('Error', 'Failed to load user profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     Alert.alert(
//       'Logout',
//       'Are you sure you want to logout?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Logout',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await AsyncStorage.removeItem('access_token');
//               await AsyncStorage.removeItem('user');
//               router.replace('/login');
//             } catch (error) {
//               console.error('Error during logout:', error);
//               Alert.alert('Error', 'Failed to logout properly');
//             }
//           },
//         },
//       ]
//     );

//       await AsyncStorage.removeItem('access_token');
//       await AsyncStorage.removeItem('user');
//       router.replace('/login');
//   };

//   const hasProfileImage = () => {
//     return userProfile?.profile_picture && 
//            userProfile.profile_picture.trim() !== '' &&
//            userProfile.profile_picture !== 'null' &&
//            userProfile.profile_picture !== null;
//   };

//   const getProfileImageSource = () => {
//     if (hasProfileImage()) {
//       // If it's a base64 string
//       if (userProfile.profile_picture.startsWith('data:image')) {
//         return { uri: userProfile.profile_picture };
//       }
//       // If it's just base64 without data URI prefix
//       if (typeof userProfile.profile_picture === 'string') {
//         return { uri: `data:image/jpeg;base64,${userProfile.profile_picture}` };
//       }
//       // If it's a URL
//       return { uri: userProfile.profile_picture };
//     }
//     return null;
//   };

//   const getInitials = (name) => {
//     if (!name) return 'U';
//     // Get only the first letter of the name (first name)
//     return name.charAt(0).toUpperCase();
//   };

//   const getGreeting = () => {
//     const hour = new Date().getHours();
//     if (hour < 12) return 'Good Morning';
//     if (hour < 18) return 'Good Afternoon';
//     return 'Good Evening';
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading Dashboard...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.headerGradient}
//       >
//         <View style={styles.header}>
//           <View style={styles.profileSection}>
//             <View style={styles.profileImageContainer}>
//               {hasProfileImage() ? (
//                 <Image 
//                   source={getProfileImageSource()} 
//                   style={styles.profileImage}
//                   onError={() => {
//                     // If image fails to load, fall back to initials
//                     console.log('Profile image failed to load');
//                   }}
//                 />
//               ) : (
//                 <View style={styles.profilePlaceholder}>
//                   <Text style={styles.initials}>
//                     {getInitials(userProfile?.username)}
//                   </Text>
//                 </View>
//               )}
//               <View style={styles.onlineIndicator} />
//             </View>
            
//             <View style={styles.userInfo}>
//               <Text style={styles.greeting}>{getGreeting()}</Text>
//               <Text style={styles.userName}>
//                 {userProfile?.username || 'Student'}
//               </Text>
//               <View style={styles.userDetails}>
//                 {userProfile?.course && (
//                   <View style={styles.detailItem}>
//                     <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.8)" />
//                     <Text style={styles.detailText}>{userProfile.course}</Text>
//                   </View>
//                 )}
//                 {userProfile?.year && (
//                   <View style={styles.detailItem}>
//                     <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
//                     <Text style={styles.detailText}>Year {userProfile.year}</Text>
//                   </View>
//                 )}
//               </View>
//             </View>
//           </View>

//           <TouchableOpacity 
//             style={styles.logoutButton} 
//             onPress={handleLogout}
//           >
//             <Ionicons name="log-out-outline" size={24} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>

//       <View style={styles.content}>
//         <View style={styles.welcomeCard}>
//           <Text style={styles.welcomeTitle}>Welcome to CampusConnect</Text>
//           <Text style={styles.welcomeSubtitle}>
//             Your gateway to campus life and connections
//           </Text>
//         </View>

//         {/* Quick Stats */}
//         <View style={styles.statsContainer}>
//           <View style={styles.statCard}>
//             <Ionicons name="people-outline" size={24} color="#667eea" />
//             <Text style={styles.statNumber}>0</Text>
//             <Text style={styles.statLabel}>Connections</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Ionicons name="chatbubbles-outline" size={24} color="#667eea" />
//             <Text style={styles.statNumber}>0</Text>
//             <Text style={styles.statLabel}>Messages</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Ionicons name="calendar-outline" size={24} color="#667eea" />
//             <Text style={styles.statNumber}>0</Text>
//             <Text style={styles.statLabel}>Events</Text>
//           </View>
//         </View>

//         {/* Quick Actions */}
//         <View style={styles.actionsContainer}>
//           <Text style={styles.sectionTitle}>Quick Actions</Text>
          
//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="person-add-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Find Students</Text>
//               <Text style={styles.actionSubtitle}>Connect with your classmates</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="chatbubble-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Messages</Text>
//               <Text style={styles.actionSubtitle}>Chat with your connections</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="calendar-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Events</Text>
//               <Text style={styles.actionSubtitle}>Discover campus events</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="settings-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Settings</Text>
//               <Text style={styles.actionSubtitle}>Manage your account</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9ff',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9ff',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#667eea',
//   },
//   headerGradient: {
//     paddingTop: 50,
//     paddingBottom: 30,
//     borderBottomLeftRadius: 25,
//     borderBottomRightRadius: 25,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//   },
//   profileSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   profileImageContainer: {
//     position: 'relative',
//     marginRight: 15,
//   },
//   profileImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   profilePlaceholder: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   initials: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#2ed573',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   userInfo: {
//     flex: 1,
//   },
//   greeting: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     marginBottom: 2,
//   },
//   userName: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 5,
//   },
//   userDetails: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 15,
//     marginBottom: 2,
//   },
//   detailText: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.8)',
//     marginLeft: 4,
//   },
//   logoutButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     padding: 20,
//   },
//   welcomeCard: {
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     padding: 20,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   welcomeTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 5,
//   },
//   welcomeSubtitle: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 25,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 15,
//     alignItems: 'center',
//     marginHorizontal: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 8,
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#666',
//   },
//   actionsContainer: {
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 15,
//   },
//   actionCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   actionIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#f8f9ff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   actionContent: {
//     flex: 1,
//   },
//   actionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 2,
//   },
//   actionSubtitle: {
//     fontSize: 13,
//     color: '#666',
//   },
// });








































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   Dimensions,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';

// const { width } = Dimensions.get('window');

// export default function Dashboard() {
//   const router = useRouter();
//   const [userProfile, setUserProfile] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadUserProfile();
//   }, []);

//   const loadUserProfile = async () => {
//     try {
//       const storedProfile = await AsyncStorage.getItem('user_profile');
//       if (storedProfile) {
//         const profile = JSON.parse(storedProfile);
//         setUserProfile(profile);
//       }
//     } catch (error) {
//       console.error('Error loading user profile:', error);
//       Alert.alert('Error', 'Failed to load user profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     Alert.alert(
//       'Logout',
//       'Are you sure you want to logout?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Logout',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await AsyncStorage.removeItem('access_token');
//               await AsyncStorage.removeItem('user_profile');
//               router.replace('/login');
//             } catch (error) {
//               console.error('Error during logout:', error);
//               Alert.alert('Error', 'Failed to logout properly');
//             }
//           },
//         },
//       ]
//     );
//   };

//   const getProfileImageSource = () => {
//     if (userProfile?.profile_picture) {
//       // If it's a base64 string
//       if (userProfile.profile_picture.startsWith('data:image')) {
//         return { uri: userProfile.profile_picture };
//       }
//       // If it's just base64 without data URI prefix
//       if (typeof userProfile.profile_picture === 'string') {
//         return { uri: `data:image/jpeg;base64,${userProfile.profile_picture}` };
//       }
//       // If it's a URL
//       return { uri: userProfile.profile_picture };
//     }
//     return null;
//   };

//   const getInitials = (name) => {
//     if (!name) return 'U';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0))
//       .join('')
//       .toUpperCase()
//       .substring(0, 2);
//   };

//   const getGreeting = () => {
//     const hour = new Date().getHours();
//     if (hour < 12) return 'Good Morning';
//     if (hour < 18) return 'Good Afternoon';
//     return 'Good Evening';
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading Dashboard...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.headerGradient}
//       >
//         <View style={styles.header}>
//           <View style={styles.profileSection}>
//             <View style={styles.profileImageContainer}>
//               {getProfileImageSource() ? (
//                 <Image 
//                   source={getProfileImageSource()} 
//                   style={styles.profileImage}
//                   defaultSource={require('./assets/default-avatar.png')} // Add a default image
//                 />
//               ) : (
//                 <View style={styles.profilePlaceholder}>
//                   <Text style={styles.initials}>
//                     {getInitials(userProfile?.username)}
//                   </Text>
//                 </View>
//               )}
//               <View style={styles.onlineIndicator} />
//             </View>
            
//             <View style={styles.userInfo}>
//               <Text style={styles.greeting}>{getGreeting()}</Text>
//               <Text style={styles.userName}>
//                 {userProfile?.username || 'Student'}
//               </Text>
//               <View style={styles.userDetails}>
//                 {userProfile?.course && (
//                   <View style={styles.detailItem}>
//                     <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.8)" />
//                     <Text style={styles.detailText}>{userProfile.course}</Text>
//                   </View>
//                 )}
//                 {userProfile?.year && (
//                   <View style={styles.detailItem}>
//                     <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
//                     <Text style={styles.detailText}>Year {userProfile.year}</Text>
//                   </View>
//                 )}
//               </View>
//             </View>
//           </View>

//           <TouchableOpacity 
//             style={styles.logoutButton} 
//             onPress={handleLogout}
//           >
//             <Ionicons name="log-out-outline" size={24} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>

//       <View style={styles.content}>
//         <View style={styles.welcomeCard}>
//           <Text style={styles.welcomeTitle}>Welcome to CampusConnect</Text>
//           <Text style={styles.welcomeSubtitle}>
//             Your gateway to campus life and connections
//           </Text>
//         </View>

//         {/* Quick Stats */}
//         <View style={styles.statsContainer}>
//           <View style={styles.statCard}>
//             <Ionicons name="people-outline" size={24} color="#667eea" />
//             <Text style={styles.statNumber}>0</Text>
//             <Text style={styles.statLabel}>Connections</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Ionicons name="chatbubbles-outline" size={24} color="#667eea" />
//             <Text style={styles.statNumber}>0</Text>
//             <Text style={styles.statLabel}>Messages</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Ionicons name="calendar-outline" size={24} color="#667eea" />
//             <Text style={styles.statNumber}>0</Text>
//             <Text style={styles.statLabel}>Events</Text>
//           </View>
//         </View>

//         {/* Quick Actions */}
//         <View style={styles.actionsContainer}>
//           <Text style={styles.sectionTitle}>Quick Actions</Text>
          
//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="person-add-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Find Students</Text>
//               <Text style={styles.actionSubtitle}>Connect with your classmates</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="chatbubble-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Messages</Text>
//               <Text style={styles.actionSubtitle}>Chat with your connections</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="calendar-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Events</Text>
//               <Text style={styles.actionSubtitle}>Discover campus events</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.actionCard}>
//             <View style={styles.actionIcon}>
//               <Ionicons name="settings-outline" size={24} color="#667eea" />
//             </View>
//             <View style={styles.actionContent}>
//               <Text style={styles.actionTitle}>Settings</Text>
//               <Text style={styles.actionSubtitle}>Manage your account</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#ccc" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9ff',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9ff',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#667eea',
//   },
//   headerGradient: {
//     paddingTop: 50,
//     paddingBottom: 30,
//     borderBottomLeftRadius: 25,
//     borderBottomRightRadius: 25,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//   },
//   profileSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   profileImageContainer: {
//     position: 'relative',
//     marginRight: 15,
//   },
//   profileImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   profilePlaceholder: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   initials: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#2ed573',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   userInfo: {
//     flex: 1,
//   },
//   greeting: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     marginBottom: 2,
//   },
//   userName: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 5,
//   },
//   userDetails: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 15,
//     marginBottom: 2,
//   },
//   detailText: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.8)',
//     marginLeft: 4,
//   },
//   logoutButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     padding: 20,
//   },
//   welcomeCard: {
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     padding: 20,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   welcomeTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 5,
//   },
//   welcomeSubtitle: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 25,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 15,
//     alignItems: 'center',
//     marginHorizontal: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 8,
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#666',
//   },
//   actionsContainer: {
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 15,
//   },
//   actionCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   actionIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#f8f9ff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   actionContent: {
//     flex: 1,
//   },
//   actionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 2,
//   },
//   actionSubtitle: {
//     fontSize: 13,
//     color: '#666',
//   },
// });
































// import { useRouter } from 'expo-router';
// import { View, Text, Button, StyleSheet } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // export default function Dashboard() {
// //   const router = useRouter();

// //   const handleLogout = async () => {
// //     await AsyncStorage.removeItem('access_token');
// //     await AsyncStorage.removeItem('user');
// //     router.replace('/login');
// //   };

// //   return (
// //     <View style={styles.container}>
// //       <Text style={styles.heading}>Welcome to CompassConnect</Text>
// //       <Button title="Logout" onPress={handleLogout} />
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: { padding: 20, marginTop: 60 },
// //   heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
// // });

























import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
       <Text style={styles.heading}>Welcome to CompassConnect</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 60 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
});