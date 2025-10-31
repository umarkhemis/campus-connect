

// import React, { useState, useEffect, useRef } from 'react';
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
//   FlatList,
//   RefreshControl,
//   Platform,
//   Animated,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import ProfileScreen from './profile';
// import ForumHome from './forum';
// import PostDetail from '../forum/[id]';
// import LostFoundList from '../lost-found/lost-and-found';
// import LostFoundDetail from '../lost-found/[id]';
// import MarketplaceFeed from '../market-place/market-place-feeds';
// import MarketplaceDetail from '../market-place/market-place-item-detail';
// import CreateMarketplaceItem from '../market-place/create-market-place-item';
// import axios from 'axios';
// import ConnectionAPI from '../api/connectionService'
// import useProtectedRoute  from '../hooks/useProtectedRoute';

// const { width } = Dimensions.get('window');

// // ... (keep all your existing type definitions)
// type UserProfile = {
//   username?: string;
//   profile_picture?: string | null;
//   course?: string;
//   year?: string | number;
//   email?: string;
// };

// type Event = {
//   id: number;
//   title: string;
//   location: string;
//   start_time: string;
//   end_time: string;
//   rsvped: boolean;
//   description?: string;
// };

// type Club = {
//   id: number;
//   name: string;
//   description: string;
//   category: string;
//   joined: boolean;
//   member_count?: number;
// };

// type DashboardStats = {
//   connections: number;
//   messages: number;
//   events: number;
//   clubs: number;
//   posts: number;
//   lostFoundItems: number;
// };

// type Post = {
//   id: number;
//   title: string;
//   content: string;
//   author_name: string;
//   author_avatar?: string;
//   created_at: string;
//   likes_count: number;
//   comments_count: number;
//   category: string;
//   image?: string;
//   is_liked_by_user?: boolean;
// };

// type Connection = {
//   id: number;
//   content: string;
//   user_1: string;
//   user_2: string;
//   created_at: string;
// };

// type MarketplaceItem = {
//   id: number;
//   title: string;
//   price: string;
//   category: string;
//   condition: string;
//   image: string | null;
//   is_sold?: boolean;
//   created_at?: string;
//   owner?: {
//     username: string;
//   };
// };

// type LostFoundItem = {
//   id: number;
//   title: string;
//   description: string;
//   status: 'lost' | 'found' | 'claimed';
//   location: string;
//   date: string;
//   image?: string;
//   owner: string;
// };

// const ConfirmationModal = ({ 
//   visible, 
//   onClose, 
//   onConfirm, 
//   title, 
//   message, 
//   confirmText = 'Confirm',
//   cancelText = 'Cancel',
//   isDestructive = false 
// }) => {
//   return (
//     <Modal
//       visible={visible}
//       transparent={true}
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContainer}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>{title}</Text>
//           </View>
          
//           <View style={styles.modalBody}>
//             <Text style={styles.modalMessage}>{message}</Text>
//           </View>
          
//           <View style={styles.modalFooter}>
//             <TouchableOpacity
//               style={[styles.modalButton, styles.cancelButton]}
//               onPress={onClose}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.cancelButtonText}>{cancelText}</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.modalButton, 
//                 isDestructive ? styles.destructiveButton : styles.confirmButton
//               ]}
//               onPress={onConfirm}
//               activeOpacity={0.8}
//             >
//               <Text style={[
//                 styles.confirmButtonText,
//                 isDestructive && styles.destructiveButtonText
//               ]}>
//                 {confirmText}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// export default function Dashboard() {
//   const router = useRouter();
//   const { user, isLoading: authLoading, isAuthenticated, LoadingComponent } = useProtectedRoute();
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [showProfile, setShowProfile] = useState(false);
//   const [showKabFunCommunity, setShowKabFunCommunity] = useState(false);
//   const [showPostDetail, setShowPostDetail] = useState(false);
//   const [showLostFound, setShowLostFound] = useState(false);
//   const [showLostFoundDetail, setShowLostFoundDetail] = useState(false);
//   const [showMarketplace, setShowMarketplace] = useState(false);
//   const [showMarketplaceDetail, setShowMarketplaceDetail] = useState(false);
//   const [showCreateMarketplaceItem, setShowCreateMarketplaceItem] = useState(false);
//   const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
//   const [selectedLostFoundId, setSelectedLostFoundId] = useState<number | null>(null);
//   const [selectedMarketplaceItemId, setSelectedMarketplaceItemId] = useState<number | null>(null);
//   const [events, setEvents] = useState<Event[]>([]);
//   const [clubs, setClubs] = useState<Club[]>([]);
//   const [recentPosts, setRecentPosts] = useState<Post[]>([]);
//   const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>([]);
//   const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
//   const [stats, setStats] = useState<DashboardStats>({
//     connections: 0,
//     messages: 0,
//     events: 0,
//     clubs: 0,
//     posts: 0,
//     lostFoundItems: 0,
//     marketplaceItems: 0,
//   });
//   const [dataLoading, setDataLoading] = useState(false);
//   const [isGridView, setIsGridView] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [showLogoutModal, setShowLogoutModal] = useState(false);
//   const [currentEventIndex, setCurrentEventIndex] = useState(0);
//   const [currentClubIndex, setCurrentClubIndex] = useState(0);

//   // Animation refs for smooth transitions
//   const eventSlideAnim = useRef(new Animated.Value(0)).current;
//   const clubSlideAnim = useRef(new Animated.Value(0)).current;
//   const eventOpacityAnim = useRef(new Animated.Value(1)).current;
//   const clubOpacityAnim = useRef(new Animated.Value(1)).current;
 
//   const params = useLocalSearchParams();

//   useEffect(() => {
//     loadUserProfile();
//     loadDashboardData();
//   }, []);

//   const loadUserProfile = async () => {
//     try {
//       const currentUser = await ConnectionAPI.getCurrentUser();
//       if (currentUser) {
//         setUserProfile(currentUser);
//       } else {
//         const storedProfile = await AsyncStorage.getItem('user_profile');
//         if (storedProfile) {
//           const profile = JSON.parse(storedProfile);
//           setUserProfile(profile);
//         }
//       }
//     } catch (error) {
//       console.error('Error loading user profile:', error);
//       setError('Failed to load user profile');
      
//       try {
//         const storedProfile = await AsyncStorage.getItem('user_profile');
//         if (storedProfile) {
//           const profile = JSON.parse(storedProfile);
//           setUserProfile(profile);
//         }
//       } catch (fallbackError) {
//         console.error('Fallback profile loading failed:', fallbackError);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadDashboardData = async () => {
//     try {
//       setDataLoading(true);
//       setError(null);
//       const token = await ConnectionAPI.getAuthToken();
      
//       if (!token) {
//         setError('Authentication required. Please login again.');
//         return;
//       }

//       const [eventsResponse, clubsResponse, postsResponse, lostFoundResponse, marketplaceResponse, connectionResponse] = await Promise.allSettled([
//         ConnectionAPI.getEvents(),
//         ConnectionAPI.getClubs(), 
//         ConnectionAPI.getPosts(),
//         ConnectionAPI.getLostFoundItems(),
//         ConnectionAPI.getMarketplaceItems(),
//         ConnectionAPI.getMyConnections(),
//       ]);

//       console.log('=== DETAILED DEBUG RESPONSES ===');

//       if (eventsResponse.status === 'fulfilled') {
//         console.log('Events - Full Response Value:', eventsResponse.value);
        
//         let eventsData = [];
//         if (eventsResponse.value?.data) {
//           eventsData = eventsResponse.value.data;
//         } else if (Array.isArray(eventsResponse.value)) {
//           eventsData = eventsResponse.value;
//         } else if (eventsResponse.value?.results) {
//           eventsData = eventsResponse.value.results;
//         }
        
//         console.log('Events - Extracted Data:', eventsData);
//         console.log('Events - Is Array:', Array.isArray(eventsData));
//         console.log('Events - Length:', eventsData.length);
        
//         setEvents(Array.isArray(eventsData) ? eventsData.slice(0, 3) : []);
//         setStats(prev => ({ 
//           ...prev, 
//           events: Array.isArray(eventsData) ? eventsData.filter((event) => event.rsvped).length : 0
//         }));
//       } else {
//         console.error('Failed to load events:', eventsResponse.reason);
//         setEvents([]);
//       }

//       if (clubsResponse.status === 'fulfilled') {
//         console.log('Clubs - Full Response Value:', clubsResponse.value);
        
//         let clubsData = [];
//         if (clubsResponse.value?.data) {
//           clubsData = clubsResponse.value.data;
//         } else if (Array.isArray(clubsResponse.value)) {
//           clubsData = clubsResponse.value;
//         } else if (clubsResponse.value?.results) {
//           clubsData = clubsResponse.value.results;
//         }
        
//         console.log('Clubs - Extracted Data:', clubsData);
//         console.log('Clubs - Is Array:', Array.isArray(clubsData));
//         console.log('Clubs - Length:', clubsData.length);
        
//         setClubs(Array.isArray(clubsData) ? clubsData.slice(0, 3) : []);
//         setStats(prev => ({ 
//           ...prev, 
//           clubs: Array.isArray(clubsData) ? clubsData.filter((club) => club.joined).length : 0
//         }));
//       } else {
//         console.error('Failed to load clubs:', clubsResponse.reason);
//         setClubs([]);
//       }

//       if (postsResponse.status === 'fulfilled') {
//         console.log('Posts - Full Response Value:', postsResponse.value);
        
//         let postsData = [];
//         if (postsResponse.value?.data) {
//           postsData = postsResponse.value.data;
//         } else if (Array.isArray(postsResponse.value)) {
//           postsData = postsResponse.value;
//         } else if (postsResponse.value?.results) {
//           postsData = postsResponse.value.results;
//         }
        
//         console.log('Posts - Extracted Data:', postsData);
//         console.log('Posts - Is Array:', Array.isArray(postsData));
//         console.log('Posts - Length:', postsData.length);
        
//         setRecentPosts(Array.isArray(postsData) ? postsData.slice(0, 3) : []);
//         setStats(prev => ({ 
//           ...prev, 
//           posts: Array.isArray(postsData) ? postsData.length : 0
//         }));
//       } else {
//         console.error('Failed to load posts:', postsResponse.reason);
//         setRecentPosts([]);
//       }

//       if (lostFoundResponse.status === 'fulfilled') {
//         console.log('Lost Found - Full Response Value:', lostFoundResponse.value);
        
//         let lostFoundData = [];
//         if (lostFoundResponse.value?.data) {
//           lostFoundData = lostFoundResponse.value.data;
//         } else if (Array.isArray(lostFoundResponse.value)) {
//           lostFoundData = lostFoundResponse.value;
//         } else if (lostFoundResponse.value?.results) {
//           lostFoundData = lostFoundResponse.value.results;
//         }
        
//         console.log('Lost Found - Extracted Data:', lostFoundData);
//         console.log('Lost Found - Is Array:', Array.isArray(lostFoundData));
//         console.log('Lost Found - Length:', lostFoundData.length);
        
//         setLostFoundItems(Array.isArray(lostFoundData) ? lostFoundData.slice(0, 3) : []);
//         setStats(prev => ({ 
//           ...prev, 
//           lostFoundItems: Array.isArray(lostFoundData) ? lostFoundData.length : 0
//         }));
//       } else {
//         console.error('Failed to load lost-found items:', lostFoundResponse.reason);
//         setLostFoundItems([]);
//       }

//       if (marketplaceResponse.status === 'fulfilled') {
//         console.log('Marketplace - Full Response Value:', marketplaceResponse.value);
        
//         let marketplaceData = [];
//         if (marketplaceResponse.value?.data) {
//           marketplaceData = marketplaceResponse.value.data;
//         } else if (Array.isArray(marketplaceResponse.value)) {
//           marketplaceData = marketplaceResponse.value;
//         } else if (marketplaceResponse.value?.results) {
//           marketplaceData = marketplaceResponse.value.results;
//         }
        
//         console.log('Marketplace - Extracted Data:', marketplaceData);
//         console.log('Marketplace - Is Array:', Array.isArray(marketplaceData));
//         console.log('Marketplace - Length:', marketplaceData.length);
        
//         setMarketplaceItems(Array.isArray(marketplaceData) ? marketplaceData.slice(0, 3) : []);
//         setStats(prev => ({ 
//           ...prev, 
//           marketplaceItems: Array.isArray(marketplaceData) ? marketplaceData.length : 0
//         }));
//       } else {
//         console.error('Failed to load marketplace items:', marketplaceResponse.reason);
//         setMarketplaceItems([]);
//       }

//       if (connectionResponse.status === 'fulfilled') {
//         console.log('Connection - Full Response Value:', connectionResponse.value);
        
//         let connectionData = [];
//         if (connectionResponse.value?.data) {
//           connectionData = connectionResponse.value.data;
//         } else if (Array.isArray(connectionResponse.value)) {
//           connectionData = connectionResponse.value;
//         } else if (connectionResponse.value?.results) {
//           connectionData = connectionResponse.value.results;
//         }
        
//         console.log('Connection - Extracted Data:', connectionData);
//         console.log('Connection - Is Array:', Array.isArray(connectionData));
//         console.log('Connection - Length:', connectionData.length);
        
//         setStats(prev => ({ 
//           ...prev, 
//           connections: Array.isArray(connectionData) ? connectionData.length : 0
//         }));
//       } else {
//         console.error('Failed to load connections:', connectionResponse.reason);
//         setStats(prev => ({ 
//           ...prev, 
//           connections: 0
//         }));
//       }

//     } catch (error) {
//       console.error('Error loading dashboard data:', error);
//       setError('Failed to load dashboard data. Please check your connection.');
      
//       setEvents([]);
//       setClubs([]);
//       setRecentPosts([]);
//       setLostFoundItems([]);
//       setMarketplaceItems([]);
//     } finally {
//       setDataLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await Promise.all([loadUserProfile(), loadDashboardData()]);
//     setRefreshing(false);
//   };

//   const handleLogout = () => {
//     setShowLogoutModal(true);
//   };

//   const confirmLogout = async () => {
//     try {
//       setShowLogoutModal(false);
//       await ConnectionAPI.handleLogout();
//       router.replace('/login');
//     } catch (error) {
//       console.error('Error during logout:', error);
//       try {
//         await AsyncStorage.multiRemove(['access_token', 'user_profile', 'user']);
//         router.replace('/login');
//       } catch (fallbackError) {
//         console.error('Fallback logout failed:', fallbackError);
//         Alert.alert('Error', 'Failed to logout properly');
//       }
//     }
//   };

//   const cancelLogout = () => {
//     setShowLogoutModal(false);
//   };

//   const hasProfileImage = (): boolean => {
//     if (!userProfile?.profile_picture) return false;
    
//     const pic = userProfile.profile_picture.trim();
    
//     if (pic === '' || pic === 'null' || pic === 'undefined') return false;
    
//     return true;
//   };

//   const getProfileImageSource = () => {
//     if (!hasProfileImage()) return null;
    
//     const pic = userProfile!.profile_picture!.trim();
    
//     if (pic.startsWith('data:image')) {
//       return { uri: pic };
//     }
    
//     if (pic.startsWith('http')) {
//       return { uri: pic };
//     }
    
//     if (pic.includes('/media/')) {
//       const baseUrl = 'http://10.22.3.34:8000';
//       const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
//       return { uri: fullUrl };
//     }
    
//     if (typeof pic === 'string' && 
//         !pic.includes('/') && 
//         !pic.includes('.') && 
//         pic.length > 50) {
//       return { uri: `data:image/jpeg;base64,${pic}` };
//     }
    
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
//     await loadUserProfile();
//   };

//   const formatEventTime = (dateTimeString: string) => {
//     try {
//       const date = new Date(dateTimeString);
//       return date.toLocaleDateString('en-US', { 
//         month: 'short', 
//         day: 'numeric',
//         hour: 'numeric',
//         minute: '2-digit'
//       });
//     } catch {
//       return dateTimeString;
//     }
//   };

//   const formatTimeAgo = (dateString: string) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
//     if (diffInSeconds < 60) return 'Just now';
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
//     return `${Math.floor(diffInSeconds / 86400)}d ago`;
//   };

//   // Enhanced navigation functions with smooth animations
//   const navigateToEvents = (direction: 'prev' | 'next') => {
//     if (events.length === 0) return;
    
//     const slideValue = direction === 'next' ? -50 : 50;
    
//     // Start slide and fade out animation
//     Animated.parallel([
//       Animated.timing(eventSlideAnim, {
//         toValue: slideValue,
//         duration: 150,
//         useNativeDriver: true,
//       }),
//       Animated.timing(eventOpacityAnim, {
//         toValue: 0,
//         duration: 150,
//         useNativeDriver: true,
//       })
//     ]).start(() => {
//       // Update index after fade out
//       if (direction === 'next') {
//         setCurrentEventIndex((prev) => (prev + 1) % events.length);
//       } else {
//         setCurrentEventIndex((prev) => (prev - 1 + events.length) % events.length);
//       }
      
//       // Reset position and slide in from opposite direction
//       eventSlideAnim.setValue(-slideValue);
      
//       Animated.parallel([
//         Animated.timing(eventSlideAnim, {
//           toValue: 0,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//         Animated.timing(eventOpacityAnim, {
//           toValue: 1,
//           duration: 200,
//           useNativeDriver: true,
//         })
//       ]).start();
//     });
//   };

//   const navigateToClubs = (direction: 'prev' | 'next') => {
//     if (clubs.length === 0) return;

//     const slideValue = direction === 'next' ? -50 : 50;
    
//     // Start slide and fade out animation
//     Animated.parallel([
//       Animated.timing(clubSlideAnim, {
//         toValue: slideValue,
//         duration: 150,
//         useNativeDriver: true,
//       }),
//       Animated.timing(clubOpacityAnim, {
//         toValue: 0,
//         duration: 150,
//         useNativeDriver: true,
//       })
//     ]).start(() => {
//       // Update index after fade out
//       if (direction === 'next') {
//         setCurrentClubIndex((prev) => (prev + 1) % clubs.length);
//       } else {
//         setCurrentClubIndex((prev) => (prev - 1 + clubs.length) % clubs.length);
//       }
      
//       // Reset position and slide in from opposite direction
//       clubSlideAnim.setValue(-slideValue);
      
//       Animated.parallel([
//         Animated.timing(clubSlideAnim, {
//           toValue: 0,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//         Animated.timing(clubOpacityAnim, {
//           toValue: 1,
//           duration: 200,
//           useNativeDriver: true,
//         })
//       ]).start();
//     });
//   };

//   const handleSeeAllEvents = () => {
//     router.push('/auth/events');
//   };

//   const handleSeeAllClubs = () => {
//     router.push('/auth/clubs');
//   };

//   const handleOpenKabFunCommunity = () => {
//     router.push('/auth/forum')
//   };

//   const handleConnection = () => {
//     router.push('/connections/connection-screen')
//   }

//   const handleOpenLostFound = () => {
//     router.push('/lost-found/lost-and-found')
//   };

//   const handleOpenMarketplace = () => {
//     router.push('/market-place/market-place-feeds')
//   };

//   const handleOpenChat = () => {
//     router.push('/chat/screens/chat-list-screen')
//   };

//   const handleCreatePost = () => {
//     setShowKabFunCommunity(false);
//     router.push('/forum/create-post');
//   };

//   const handleCreateLostFoundPost = () => {
//     setShowLostFound(false);
//     router.push('/lost-found/lost-and-found-post');
//   };

//   const handleCreateMarketplaceItem = () => {
//     setShowMarketplace(false);
//     setShowCreateMarketplaceItem(true);
//   };

//   const handlePostPress = (postId: number) => {
//     console.log('Post pressed with ID:', postId, typeof postId);
//     setSelectedPostId(postId);
//     setShowKabFunCommunity(false);
//     setTimeout(() => {
//       setShowPostDetail(true);
//     }, 100);
//   };

//   const getItemId = () => {
//     if (params.id) return params.id;
//     if (params.itemId) return params.itemId;
    
//     if (params.item && typeof params.item === 'object') {
//       return params.item.id;
//     }
    
//     if (params.item && typeof params.item === 'string') {
//       try {
//         const parsedItem = JSON.parse(params.item);
//         return parsedItem.id;
//       } catch (e) {
//         console.error('Failed to parse item param:', e);
//       }
//     }
    
//     return null;
//   };

//   const itemId = getItemId();

//   const handleLostFoundItemPress = (itemId: number) => {
//     console.log('Lost & Found item pressed with ID:', itemId, typeof itemId);
//     setSelectedLostFoundId(itemId);
//     setShowLostFound(false);
//     setTimeout(() => {
//       setShowLostFoundDetail(true);
//     }, 100);
//   };

//   const handleMarketplaceItemPress = (itemId: number) => {
//     console.log('Marketplace item pressed with ID:', itemId, typeof itemId);
//     setSelectedMarketplaceItemId(itemId);
//     setShowMarketplace(false);
//     setTimeout(() => {
//       setShowMarketplaceDetail(true);
//     }, 100);
//   };

//   const quickActions = [
//     {
//       id: 'community',
//       title: 'KabFunCommunity',
//       subtitle: 'Join discussions and share posts',
//       icon: 'chatbubbles-outline',
//       color: '#6366f1',
//       onPress: handleOpenKabFunCommunity,
//     },
//     {
//     id: 'marketplace', 
//     title: 'MarketPlace',
//     subtitle: 'Buy and sell items with classmates', 
//     icon: 'storefront-outline', 
//     color: '#667eea', 
//     onPress: handleOpenMarketplace, 
//     },
//     {
//       id: 'lost-found',
//       title: 'Lost & Found',
//       subtitle: 'Find lost items or report found items',
//       icon: 'search-outline',
//       color: '#06b6d4',
//       onPress: handleOpenLostFound,
//     },
//     {
//       id: 'chat',
//       title: 'Chat',
//       subtitle: 'Message your friends and classmates',
//       icon: 'chatbubble-ellipses-outline',
//       color: '#10b981',
//       onPress: handleOpenChat,
//     },
//     {
//       id: 'find-students',
//       title: 'Find Students',
//       subtitle: 'Connect with your classmates',
//       icon: 'person-add-outline',
//       color: '#8b5cf6',
//       onPress: handleConnection,
//     },
//   ];

//   const renderQuickActionItem = ({ item }: { item: any }) => {
//     const cardStyle = isGridView ? styles.gridActionCard : styles.listActionCard;
//     const contentStyle = isGridView ? styles.gridActionContent : styles.listActionContent;

//     return (
//       <TouchableOpacity 
//         style={[cardStyle, item.comingSoon && styles.comingSoonCard]}
//         onPress={item.onPress}
//         activeOpacity={0.7}
//       >
//         <View style={[styles.actionIcon, { backgroundColor: `${item.color}15` }]}>
//           <Ionicons name={item.icon} size={24} color={item.color} />
//           {item.comingSoon && (
//             <View style={styles.comingSoonBadge}>
//               <Text style={styles.comingSoonText}>Soon</Text>
//             </View>
//           )}
//         </View>
//         <View style={contentStyle}>
//           <Text style={styles.actionTitle}>{item.title}</Text>
//           <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
//         </View>
//         {!isGridView && (
//           <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
//         )}
//       </TouchableOpacity>
//     );
//   };

//   // Enhanced Event Card with animation
//   const EventCard = ({ event }: { event: Event }) => (
//     <Animated.View
//       style={[
//         styles.enhancedItemCard,
//         {
//           transform: [{ translateX: eventSlideAnim }],
//           opacity: eventOpacityAnim,
//         }
//       ]}
//     >
//       <TouchableOpacity style={styles.cardContent} activeOpacity={0.8}>
//         <LinearGradient
//           colors={['#6366f1', '#8b5cf6']}
//           style={styles.cardGradient}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 0 }}
//         >
//           <View style={styles.cardIconContainer}>
//             <Ionicons name="calendar" size={24} color="#fff" />
//           </View>
//         </LinearGradient>
        
//         <View style={styles.cardTextContent}>
//           <Text style={styles.enhancedItemTitle} numberOfLines={1}>{event.title}</Text>
//           <View style={styles.itemDetailRow}>
//             <Ionicons name="location-outline" size={16} color="#64748b" />
//             <Text style={styles.enhancedItemSubtitle} numberOfLines={1}>
//               {event.location}
//             </Text>
//           </View>
//           <View style={styles.itemDetailRow}>
//             <Ionicons name="time-outline" size={16} color="#64748b" />
//             <Text style={styles.enhancedItemTime}>
//               {formatEventTime(event.start_time)}
//             </Text>
//           </View>
//         </View>
        
//         {event.rsvped && (
//           <View style={styles.enhancedRsvpBadge}>
//             <Ionicons name="checkmark-circle" size={16} color="#10b981" />
//             <Text style={styles.enhancedRsvpText}>RSVP'd</Text>
//           </View>
//         )}
//       </TouchableOpacity>
//     </Animated.View>
//   );

//   // Enhanced Club Card with animation
//   const ClubCard = ({ club }: { club: Club }) => (
//     <Animated.View
//       style={[
//         styles.enhancedItemCard,
//         {
//           transform: [{ translateX: clubSlideAnim }],
//           opacity: clubOpacityAnim,
//         }
//       ]}
//     >
//       <TouchableOpacity style={styles.cardContent} activeOpacity={0.8}>
//         <LinearGradient
//           colors={['#06b6d4', '#0ea5e9']}
//           style={styles.cardGradient}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 0 }}
//         >
//           <View style={styles.cardIconContainer}>
//             <Ionicons name="people" size={24} color="#fff" />
//           </View>
//         </LinearGradient>
        
//         <View style={styles.cardTextContent}>
//           <Text style={styles.enhancedItemTitle} numberOfLines={1}>{club.name}</Text>
//           <Text style={styles.enhancedItemSubtitle} numberOfLines={2}>
//             {club.description}
//           </Text>
//           <View style={styles.itemDetailRow}>
//             <Ionicons name="pricetag-outline" size={16} color="#64748b" />
//             <Text style={styles.enhancedItemCategory}>{club.category}</Text>
//             {club.member_count && (
//               <>
//                 <Text style={styles.memberSeparator}>•</Text>
//                 <Text style={styles.memberCount}>{club.member_count} members</Text>
//               </>
//             )}
//           </View>
//         </View>
        
//         {club.joined && (
//           <View style={styles.enhancedJoinedBadge}>
//             <Ionicons name="checkmark-circle" size={16} color="#10b981" />
//             <Text style={styles.enhancedJoinedText}>Joined</Text>
//           </View>
//         )}
//       </TouchableOpacity>
//     </Animated.View>
//   );

//   // Enhanced loading state
//   if (authLoading || loading) {
//     return <LoadingComponent />;
//   }

//   // Enhanced error state
//   if (error && !userProfile) {
//     return (
//       <View style={styles.errorContainer}>
//         <View style={styles.errorContent}>
//           <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
//           <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
//           <Text style={styles.errorMessage}>{error}</Text>
//           <TouchableOpacity 
//             style={styles.retryButton}
//             onPress={() => {
//               setError(null);
//               loadUserProfile();
//               loadDashboardData();
//             }}
//             activeOpacity={0.8}
//           >
//             <Ionicons name="refresh-outline" size={20} color="#fff" />
//             <Text style={styles.retryButtonText}>Try Again</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   // Profile screen modal
//   if (showProfile) {
//     return (
//       <ProfileScreen
//         onBack={() => setShowProfile(false)}
//         onProfileUpdate={onProfileUpdate}
//       />
//     );
//   }

//   // KabFun Community Forum screen
//   if (showKabFunCommunity) {
//     return (
//       <ForumHome
//         onBack={() => setShowKabFunCommunity(false)}
//         onCreatePost={handleCreatePost}
//         onPostPress={handlePostPress}
//       />
//     );
//   }

//   // Post detail screen
//   if (showPostDetail && selectedPostId) {
//     return (
//       <PostDetail
//         id={selectedPostId}
//         onBack={() => {
//           setShowPostDetail(false);
//           setSelectedPostId(null);
//         }}
//       />
//     );
//   }

//   // Lost & Found list screen
//   if (showLostFound) {
//     return (
//       <LostFoundList
//         onBack={() => setShowLostFound(false)}
//         onCreatePost={handleCreateLostFoundPost}
//         onItemPress={handleLostFoundItemPress}
//       />
//     );
//   }

//   // Lost & Found detail screen
//   if (showLostFoundDetail && selectedLostFoundId) {
//     return (
//       <LostFoundDetail
//         id={selectedLostFoundId}
//         onBack={() => {
//           setShowLostFoundDetail(false);
//           setSelectedLostFoundId(null);
//         }}
//       />
//     );
//   }

//   // Marketplace feed screen
//   if (showMarketplace) {
//     return (
//       <MarketplaceFeed
//         onBack={() => setShowMarketplace(false)}
//         onCreateItem={handleCreateMarketplaceItem}
//         onItemPress={handleMarketplaceItemPress}
//       />
//     );
//   }

//   // Marketplace detail screen
//   if (showMarketplaceDetail && selectedMarketplaceItemId) {
//     return (
//       <MarketplaceDetail
//         id={selectedMarketplaceItemId}
//         onBack={() => {
//           setShowMarketplaceDetail(false);
//           setSelectedMarketplaceItemId(null);
//         }}
//       />
//     );
//   }

//   // Create marketplace item screen
//   if (showCreateMarketplaceItem) {
//     return (
//       <CreateMarketplaceItem
//         onBack={() => setShowCreateMarketplaceItem(false)}
//         onSuccess={() => {
//           setShowCreateMarketplaceItem(false);
//           loadDashboardData(); // Refresh data after creating item
//         }}
//       />
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <ScrollView
//         contentContainerStyle={styles.scrollContent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#6366f1']}
//             tintColor="#6366f1"
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Enhanced Header Section */}
//         <LinearGradient
//           colors={['#6366f1', '#8b5cf6']}
//           style={styles.headerGradient}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//         >
//           <View style={styles.headerContent}>
//             <View style={styles.userSection}>
//               <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8}>
//                 <View style={styles.profileContainer}>
//                   {hasProfileImage() ? (
//                     <Image
//                       // source={getProfileImageSource()}
//                       source={ConnectionAPI.getUserProfilePicture(user)}
//                       style={styles.profileImage}
//                       // defaultSource={require('../../assets/default-avatar.png')}
//                     />
//                   ) : (
//                     <View style={styles.profileInitials}>
//                       <Text style={styles.initialsText}>
//                         {getInitials(userProfile?.username)}
//                       </Text>
//                     </View>
//                   )}
//                   <View style={styles.profileBadge}>
//                     <Ionicons name="camera" size={12} color="#fff" />
//                   </View>
//                 </View>
//               </TouchableOpacity>
              
//               <View style={styles.greetingContainer}>
//                 <Text style={styles.greeting}>{getGreeting()}</Text>
//                 <Text style={styles.username}>
//                   {userProfile?.username || 'Student'}
//                 </Text>
//                 {userProfile?.course && (
//                   <Text style={styles.courseInfo}>
//                     {userProfile.course} {userProfile.year && `• Year ${userProfile.year}`}
//                   </Text>
//                 )}
//               </View>
//             </View>

//             <TouchableOpacity 
//               style={styles.logoutButton}
//               onPress={handleLogout}
//               activeOpacity={0.8}
//             >
//               <Ionicons name="log-out-outline" size={24} color="#fff" />
//             </TouchableOpacity>
//           </View>

//           {/* Enhanced Stats Section */}
//           <View style={styles.statsContainer}>
//             <View style={styles.statItem}>
//               <Text style={styles.statNumber}>{stats.connections}</Text>
//               <Text style={styles.statLabel}>Connections</Text>
//             </View>
//             <View style={styles.statDivider} />
//             <View style={styles.statItem}>
//               <Text style={styles.statNumber}>{stats.events}</Text>
//               <Text style={styles.statLabel}>Events</Text>
//             </View>
//             <View style={styles.statDivider} />
//             <View style={styles.statItem}>
//               <Text style={styles.statNumber}>{stats.clubs}</Text>
//               <Text style={styles.statLabel}>Clubs</Text>
//             </View>
//             <View style={styles.statDivider} />
//             <View style={styles.statItem}>
//               <Text style={styles.statNumber}>{stats.posts}</Text>
//               <Text style={styles.statLabel}>Posts</Text>
//             </View>
//           </View>
//         </LinearGradient>

//         {/* Quick Actions Section */}
//         <View style={styles.quickActionsSection}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Quick Actions</Text>
//             <TouchableOpacity 
//               style={styles.viewToggle}
//               onPress={() => setIsGridView(!isGridView)}
//               activeOpacity={0.7}
//             >
//               <Ionicons 
//                 name={isGridView ? "list" : "grid"} 
//                 size={20} 
//                 color="#6366f1" 
//               />
//             </TouchableOpacity>
//           </View>
          
//           <FlatList
//             data={quickActions}
//             renderItem={renderQuickActionItem}
//             keyExtractor={(item) => item.id}
//             numColumns={isGridView ? 2 : 1}
//             key={isGridView ? 'grid' : 'list'}
//             columnWrapperStyle={isGridView ? styles.gridRow : null}
//             scrollEnabled={false}
//             showsVerticalScrollIndicator={false}
//           />
//         </View>

//         {/* Enhanced Upcoming Events Section */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Upcoming Events</Text>
//             <TouchableOpacity 
//               style={styles.seeAllButton}
//               onPress={handleSeeAllEvents}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.seeAllText}>See All</Text>
//               <Ionicons name="chevron-forward" size={16} color="#6366f1" />
//             </TouchableOpacity>
//           </View>

//           {dataLoading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="small" color="#6366f1" />
//             </View>
//           ) : events.length > 0 ? (
//             <View style={styles.carouselContainer}>
//               {events.length > 1 && (
//                 <TouchableOpacity
//                   style={[styles.navButton, styles.prevButton]}
//                   onPress={() => navigateToEvents('prev')}
//                   activeOpacity={0.7}
//                 >
//                   <Ionicons name="chevron-back" size={20} color="#6366f1" />
//                 </TouchableOpacity>
//               )}

//               <EventCard event={events[currentEventIndex]} />

//               {events.length > 1 && (
//                 <TouchableOpacity
//                   style={[styles.navButton, styles.nextButton]}
//                   onPress={() => navigateToEvents('next')}
//                   activeOpacity={0.7}
//                 >
//                   <Ionicons name="chevron-forward" size={20} color="#6366f1" />
//                 </TouchableOpacity>
//               )}
//             </View>
//           ) : (
//             <View style={styles.emptyState}>
//               <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
//               <Text style={styles.emptyStateTitle}>No Upcoming Events</Text>
//               <Text style={styles.emptyStateSubtitle}>
//                 Check back later for new events
//               </Text>
//             </View>
//           )}

//           {events.length > 1 && (
//             <View style={styles.carouselIndicators}>
//               {events.map((_, index) => (
//                 <View
//                   key={index}
//                   style={[
//                     styles.indicator,
//                     index === currentEventIndex && styles.activeIndicator
//                   ]}
//                 />
//               ))}
//             </View>
//           )}
//         </View>

//         {/* Enhanced Clubs Section */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Your Clubs</Text>
//             <TouchableOpacity 
//               style={styles.seeAllButton}
//               onPress={handleSeeAllClubs}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.seeAllText}>See All</Text>
//               <Ionicons name="chevron-forward" size={16} color="#6366f1" />
//             </TouchableOpacity>
//           </View>

//           {dataLoading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="small" color="#6366f1" />
//             </View>
//           ) : clubs.length > 0 ? (
//             <View style={styles.carouselContainer}>
//               {clubs.length > 1 && (
//                 <TouchableOpacity
//                   style={[styles.navButton, styles.prevButton]}
//                   onPress={() => navigateToClubs('prev')}
//                   activeOpacity={0.7}
//                 >
//                   <Ionicons name="chevron-back" size={20} color="#6366f1" />
//                 </TouchableOpacity>
//               )}

//               <ClubCard club={clubs[currentClubIndex]} />

//               {clubs.length > 1 && (
//                 <TouchableOpacity
//                   style={[styles.navButton, styles.nextButton]}
//                   onPress={() => navigateToClubs('next')}
//                   activeOpacity={0.7}
//                 >
//                   <Ionicons name="chevron-forward" size={20} color="#6366f1" />
//                 </TouchableOpacity>
//               )}
//             </View>
//           ) : (
//             <View style={styles.emptyState}>
//               <Ionicons name="people-outline" size={48} color="#cbd5e1" />
//               <Text style={styles.emptyStateTitle}>No Clubs Yet</Text>
//               <Text style={styles.emptyStateSubtitle}>
//                 Join clubs to connect with like-minded students
//               </Text>
//             </View>
//           )}

//           {clubs.length > 1 && (
//             <View style={styles.carouselIndicators}>
//               {clubs.map((_, index) => (
//                 <View
//                   key={index}
//                   style={[
//                     styles.indicator,
//                     index === currentClubIndex && styles.activeIndicator
//                   ]}
//                 />
//               ))}
//             </View>
//           )}
//         </View>

//         {/* Recent Posts Section */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Recent Posts</Text>
//             <TouchableOpacity 
//               style={styles.seeAllButton}
//               onPress={handleOpenKabFunCommunity}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.seeAllText}>See All</Text>
//               <Ionicons name="chevron-forward" size={16} color="#6366f1" />
//             </TouchableOpacity>
//           </View>

//           {dataLoading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="small" color="#6366f1" />
//             </View>
//           ) : recentPosts.length > 0 ? (
//             <View style={styles.postsContainer}>
//               {recentPosts.map((post) => (
//                 <TouchableOpacity
//                   key={post.id}
//                   style={styles.postCard}
//                   onPress={() => handlePostPress(post.id)}
//                   activeOpacity={0.8}
//                 >
//                   <View style={styles.postHeader}>
//                     <View style={styles.postAuthor}>
//                       {post.author_avatar ? (
//                         <Image
//                           source={{ uri: post.author_avatar }}
//                           style={styles.authorAvatar}
//                         />
//                       ) : (
//                         <View style={styles.authorInitials}>
//                           <Text style={styles.authorInitialsText}>
//                             {getInitials(post.author_name)}
//                           </Text>
//                         </View>
//                       )}
//                       <View style={styles.postAuthorInfo}>
//                         <Text style={styles.authorName}>{post.author_name}</Text>
//                         <Text style={styles.postTime}>
//                           {formatTimeAgo(post.created_at)}
//                         </Text>
//                       </View>
//                     </View>
//                     <View style={styles.postCategory}>
//                       <Text style={styles.categoryText}>{post.category}</Text>
//                     </View>
//                   </View>

//                   <Text style={styles.postTitle} numberOfLines={2}>
//                     {post.title}
//                   </Text>
                  
//                   <Text style={styles.postContent} numberOfLines={3}>
//                     {post.content}
//                   </Text>

//                   {post.image && (
//                     <Image
//                       source={{ uri: post.image }}
//                       style={styles.postImage}
//                       resizeMode="cover"
//                     />
//                   )}

//                   <View style={styles.postStats}>
//                     <View style={styles.statItem}>
//                       <Ionicons
//                         name={post.is_liked_by_user ? "heart" : "heart-outline"}
//                         size={18}
//                         color={post.is_liked_by_user ? "#ef4444" : "#64748b"}
//                       />
//                       <Text style={styles.statText}>{post.likes_count}</Text>
//                     </View>
//                     <View style={styles.statItem}>
//                       <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
//                       <Text style={styles.statText}>{post.comments_count}</Text>
//                     </View>
//                   </View>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           ) : (
//             <View style={styles.emptyState}>
//               <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
//               <Text style={styles.emptyStateTitle}>No Recent Posts</Text>
//               <Text style={styles.emptyStateSubtitle}>
//                 Be the first to share something with the community
//               </Text>
//             </View>
//           )}
//         </View>

//         {/* Lost & Found Items Section */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Lost & Found</Text>
//             <TouchableOpacity 
//               style={styles.seeAllButton}
//               onPress={handleOpenLostFound}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.seeAllText}>See All</Text>
//               <Ionicons name="chevron-forward" size={16} color="#6366f1" />
//             </TouchableOpacity>
//           </View>

//           {dataLoading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="small" color="#6366f1" />
//             </View>
//           ) : lostFoundItems.length > 0 ? (
//             <View style={styles.lostFoundContainer}>
//               {lostFoundItems.map((item) => (
//                 <TouchableOpacity
//                   key={item.id}
//                   style={styles.lostFoundCard}
//                   onPress={() => handleLostFoundItemPress(item.id)}
//                   activeOpacity={0.8}
//                 >
//                   <View style={styles.lostFoundHeader}>
//                     <View style={[
//                       styles.statusBadge,
//                       item.status === 'lost' && styles.lostBadge,
//                       item.status === 'found' && styles.foundBadge,
//                       item.status === 'claimed' && styles.claimedBadge,
//                     ]}>
//                       <Text style={styles.statusText}>
//                         {item.status.toUpperCase()}
//                       </Text>
//                     </View>
//                     <Text style={styles.lostFoundDate}>
//                       {formatTimeAgo(item.date)}
//                     </Text>
//                   </View>

//                   <Text style={styles.lostFoundTitle} numberOfLines={1}>
//                     {item.title}
//                   </Text>
                  
//                   <Text style={styles.lostFoundDescription} numberOfLines={2}>
//                     {item.description}
//                   </Text>

//                   <View style={styles.lostFoundFooter}>
//                     <View style={styles.locationInfo}>
//                       <Ionicons name="location-outline" size={16} color="#64748b" />
//                       <Text style={styles.locationText}>{item.location}</Text>
//                     </View>
//                     <Text style={styles.ownerText}>by {item.owner}</Text>
//                   </View>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           ) : (
//             <View style={styles.emptyState}>
//               <Ionicons name="search-outline" size={48} color="#cbd5e1" />
//               <Text style={styles.emptyStateTitle}>No Lost & Found Items</Text>
//               <Text style={styles.emptyStateSubtitle}>
//                 Help others by reporting lost or found items
//               </Text>
//             </View>
//           )}
//         </View>

//         {/* Marketplace Items Section */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Marketplace</Text>
//             <TouchableOpacity 
//               style={styles.seeAllButton}
//               onPress={handleOpenMarketplace}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.seeAllText}>See All</Text>
//               <Ionicons name="chevron-forward" size={16} color="#6366f1" />
//             </TouchableOpacity>
//           </View>

//           {dataLoading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="small" color="#6366f1" />
//             </View>
//           ) : marketplaceItems.length > 0 ? (
//             <ScrollView 
//               horizontal 
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={styles.marketplaceScroll}
//             >
//               {marketplaceItems.map((item) => (
//                 <TouchableOpacity
//                   key={item.id}
//                   style={styles.marketplaceCard}
//                   onPress={() => handleMarketplaceItemPress(item.id)}
//                   activeOpacity={0.8}
//                 >
//                   {item.image ? (
//                     <Image
//                       source={{ uri: item.image }}
//                       style={styles.marketplaceImage}
//                       resizeMode="cover"
//                     />
//                   ) : (
//                     <View style={styles.marketplacePlaceholder}>
//                       <Ionicons name="image-outline" size={32} color="#cbd5e1" />
//                     </View>
//                   )}

//                   <View style={styles.marketplaceInfo}>
//                     <Text style={styles.marketplaceTitle} numberOfLines={1}>
//                       {item.title}
//                     </Text>
//                     <Text style={styles.marketplacePrice}>{item.price}</Text>
                    
//                     <View style={styles.marketplaceMeta}>
//                       <Text style={styles.marketplaceCategory}>{item.category}</Text>
//                       <Text style={styles.marketplaceCondition}>{item.condition}</Text>
//                     </View>

//                     {item.owner && (
//                       <Text style={styles.marketplaceSeller}>
//                         by {item.owner.username}
//                       </Text>
//                     )}
//                   </View>

//                   {item.is_sold && (
//                     <View style={styles.soldOverlay}>
//                       <Text style={styles.soldText}>SOLD</Text>
//                     </View>
//                   )}
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           ) : (
//             <View style={styles.emptyState}>
//               <Ionicons name="storefront-outline" size={48} color="#cbd5e1" />
//               <Text style={styles.emptyStateTitle}>No Marketplace Items</Text>
//               <Text style={styles.emptyStateSubtitle}>
//                 Start selling items to your classmates
//               </Text>
//             </View>
//           )}
//         </View>

//         {/* Bottom spacing */}
//         <View style={styles.bottomSpacing} />
//       </ScrollView>

//       {/* Logout Confirmation Modal */}
//       <ConfirmationModal
//         visible={showLogoutModal}
//         onClose={cancelLogout}
//         onConfirm={confirmLogout}
//         title="Confirm Logout"
//         message="Are you sure you want to logout? You'll need to sign in again to access your account."
//         confirmText="Logout"
//         cancelText="Cancel"
//         isDestructive={true}
//       />
//     </View>
//   );
// }

// // Enhanced StyleSheet
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   scrollContent: {
//     flexGrow: 1,
//   },
  
//   // Header Styles
//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 60 : 40,
//     paddingBottom: 24,
//     paddingHorizontal: 20,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//     marginBottom: 24,
//   },
//   userSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   profileContainer: {
//     position: 'relative',
//     marginRight: 16,
//   },
//   profileImage: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     borderWidth: 3,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   profileInitials: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 3,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   initialsText: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: '600',
//   },
//   profileBadge: {
//     position: 'absolute',
//     bottom: -2,
//     right: -2,
//     backgroundColor: '#10b981',
//     borderRadius: 12,
//     width: 24,
//     height: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   greetingContainer: {
//     flex: 1,
//   },
//   greeting: {
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontSize: 14,
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   username: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: '700',
//     marginBottom: 2,
//   },
//   courseInfo: {
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontSize: 12,
//     fontWeight: '400',
//   },
//   logoutButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     borderRadius: 12,
//     padding: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
  
//   // Stats Styles
//   statsContainer: {
//     flexDirection: 'row',
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     borderRadius: 16,
//     paddingVertical: 16,
//     paddingHorizontal: 8,
//     backdropFilter: 'blur(10px)',
//   },
//   statItem: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   statNumber: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '700',
//     marginBottom: 4,
//   },
//   statLabel: {
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   statDivider: {
//     width: 1,
//     height: '100%',
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     marginHorizontal: 8,
//   },

//   // Section Styles
//   section: {
//     marginTop: 24,
//     paddingHorizontal: 20,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1e293b',
//   },
//   seeAllButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 8,
//     backgroundColor: 'rgba(99, 102, 241, 0.1)',
//   },
//   seeAllText: {
//     color: '#6366f1',
//     fontSize: 14,
//     fontWeight: '600',
//     marginRight: 4,
//   },

//   // Quick Actions Styles
//   quickActionsSection: {
//     marginTop: 24,
//     paddingHorizontal: 20,
//   },
//   viewToggle: {
//     backgroundColor: 'rgba(99, 102, 241, 0.1)',
//     borderRadius: 8,
//     padding: 8,
//   },
//   gridRow: {
//     justifyContent: 'space-between',
//   },
//   gridActionCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     marginHorizontal: 4,
//     marginVertical: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   listActionCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     marginVertical: 6,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   gridActionContent: {
//     alignItems: 'center',
//     marginTop: 12,
//   },
//   listActionContent: {
//     flex: 1,
//     marginLeft: 16,
//   },
//   actionIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },
//   actionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1e293b',
//     marginBottom: 4,
//     textAlign: 'center',
//   },
//   actionSubtitle: {
//     fontSize: 12,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 16,
//   },
//   comingSoonCard: {
//     opacity: 0.6,
//   },
//   comingSoonBadge: {
//     position: 'absolute',
//     top: -4,
//     right: -4,
//     backgroundColor: '#f59e0b',
//     borderRadius: 8,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//   },
//   comingSoonText: {
//     color: '#fff',
//     fontSize: 8,
//     fontWeight: '600',
//   },

//   // Enhanced Item Card Styles
//   enhancedItemCard: {
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     marginHorizontal: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 5,
//     overflow: 'hidden',
//   },
//   cardContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//   },
//   cardGradient: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//   },
//   cardIconContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cardTextContent: {
//     flex: 1,
//   },
//   enhancedItemTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1e293b',
//     marginBottom: 8,
//   },
//   enhancedItemSubtitle: {
//     fontSize: 14,
//     color: '#64748b',
//     marginBottom: 6,
//     lineHeight: 18,
//   },
//   enhancedItemTime: {
//     fontSize: 12,
//     color: '#64748b',
//     fontWeight: '500',
//   },
//   enhancedItemCategory: {
//     fontSize: 12,
//     color: '#64748b',
//     fontWeight: '500',
//   },
//   itemDetailRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   memberSeparator: {
//     color: '#cbd5e1',
//     marginHorizontal: 8,
//     fontSize: 12,
//   },
//   memberCount: {
//     fontSize: 12,
//     color: '#64748b',
//     fontWeight: '500',
//   },
//   enhancedRsvpBadge: {
//     backgroundColor: '#dcfce7',
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginLeft: 8,
//   },
//   enhancedRsvpText: {
//     color: '#10b981',
//     fontSize: 10,
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   enhancedJoinedBadge: {
//     backgroundColor: '#dcfce7',
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginLeft: 8,
//   },
//   enhancedJoinedText: {
//     color: '#10b981',
//     fontSize: 10,
//     fontWeight: '600',
//     marginLeft: 4,
//   },

//   // Carousel Styles
//   carouselContainer: {
//     position: 'relative',
//     alignItems: 'center',
//   },
//   navButton: {
//     position: 'absolute',
//     top: '50%',
//     zIndex: 10,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     width: 40,
//     height: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     transform: [{ translateY: -20 }],
//   },
//   prevButton: {
//     left: -20,
//   },
//   nextButton: {
//     right: -20,
//   },
//   carouselIndicators: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 16,
//   },
//   indicator: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#e2e8f0',
//     marginHorizontal: 4,
//   },
//   activeIndicator: {
//     backgroundColor: '#6366f1',
//   },

//   // Posts Styles
//   postsContainer: {
//     gap: 16,
//   },
//   postCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   postHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   postAuthor: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   authorAvatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     marginRight: 8,
//   },
//   authorInitials: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#e2e8f0',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 8,
//   },
//   authorInitialsText: {
//     color: '#64748b',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   postAuthorInfo: {
//     flex: 1,
//   },
//   authorName: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#1e293b',
//   },
//   postTime: {
//     fontSize: 12,
//     color: '#64748b',
//   },
//   postCategory: {
//     backgroundColor: '#f1f5f9',
//     borderRadius: 8,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   },
//   categoryText: {
//     fontSize: 10,
//     fontWeight: '600',
//     color: '#475569',
//     textTransform: 'uppercase',
//   },
//   postTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1e293b',
//     marginBottom: 8,
//     lineHeight: 22,
//   },
//   postContent: {
//     fontSize: 14,
//     color: '#64748b',
//     lineHeight: 20,
//     marginBottom: 12,
//   },
//   postImage: {
//     width: '100%',
//     height: 120,
//     borderRadius: 12,
//     marginBottom: 12,
//   },
//   postStats: {
//     flexDirection: 'row',
//     gap: 16,
//   },
//   statText: {
//     fontSize: 12,
//     color: '#64748b',
//     marginLeft: 4,
//   },

//   // Lost & Found Styles
//   lostFoundContainer: {
//     gap: 12,
//   },
//   lostFoundCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   lostFoundHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   statusBadge: {
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   },
//   lostBadge: {
//     backgroundColor: '#fef3c7',
//   },
//   foundBadge: {
//     backgroundColor: '#dcfce7',
//   },
//   claimedBadge: {
//     backgroundColor: '#e0e7ff',
//   },
//   statusText: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#374151',
//   },
//   lostFoundDate: {
//     fontSize: 12,
//     color: '#64748b',
//   },
//   lostFoundTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1e293b',
//     marginBottom: 8,
//   },
//   lostFoundDescription: {
//     fontSize: 14,
//     color: '#64748b',
//     lineHeight: 18,
//     marginBottom: 12,
//   },
//   lostFoundFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   locationInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   locationText: {
//     fontSize: 12,
//     color: '#64748b',
//     marginLeft: 4,
//   },
//   ownerText: {
//     fontSize: 12,
//     color: '#64748b',
//     fontStyle: 'italic',
//   },

//   // Marketplace Styles
//   marketplaceScroll: {
//     paddingRight: 20,
//   },
//   marketplaceCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     width: 160,
//     marginRight: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//     position: 'relative',
//   },
//   marketplaceImage: {
//     width: '100%',
//     height: 120,
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//   },
//   marketplacePlaceholder: {
//     width: '100%',
//     height: 120,
//     backgroundColor: '#f1f5f9',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//   },
//   marketplaceInfo: {
//     padding: 12,
//   },
//   marketplaceTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#1e293b',
//     marginBottom: 4,
//   },
//   marketplacePrice: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#10b981',
//     marginBottom: 8,
//   },
//   marketplaceMeta: {
//     marginBottom: 8,
//   },
//   marketplaceCategory: {
//     fontSize: 12,
//     color: '#64748b',
//     textTransform: 'capitalize',
//   },
//   marketplaceCondition: {
//     fontSize: 12,
//     color: '#64748b',
//     textTransform: 'capitalize',
//   },
//   marketplaceSeller: {
//     fontSize: 11,
//     color: '#94a3b8',
//     fontStyle: 'italic',
//   },
//   soldOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 16,
//   },
//   soldText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '700',
//   },

//   // Loading and Error Styles
//   loadingContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 40,
//   },
//   errorContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 32,
//     backgroundColor: '#f8fafc',
//   },
//   errorContent: {
//     alignItems: 'center',
//     maxWidth: 300,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1e293b',
//     marginTop: 16,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   errorMessage: {
//     fontSize: 14,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 20,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: '#6366f1',
//     borderRadius: 12,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },

//   // Empty State Styles
//   emptyState: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyStateTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#64748b',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyStateSubtitle: {
//     fontSize: 14,
//     color: '#94a3b8',
//     textAlign: 'center',
//     lineHeight: 20,
//   },

//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 32,
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     width: '100%',
//     maxWidth: 320,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.25,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   modalHeader: {
//     paddingTop: 24,
//     paddingHorizontal: 24,
//     paddingBottom: 16,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1e293b',
//     textAlign: 'center',
//   },
//   modalBody: {
//     paddingHorizontal: 24,
//     paddingBottom: 24,
//   },
//   modalMessage: {
//     fontSize: 14,
//     color: '#64748b',
//     lineHeight: 20,
//     textAlign: 'center',
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     borderTopWidth: 1,
//     borderTopColor: '#e2e8f0',
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cancelButton: {
//     borderRightWidth: 1,
//     borderRightColor: '#e2e8f0',
//   },
//   confirmButton: {
//     backgroundColor: '#6366f1',
//   },
//   destructiveButton: {
//     backgroundColor: '#ef4444',
//   },
//   cancelButtonText: {
//     color: '#64748b',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   confirmButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   destructiveButtonText: {
//     color: '#fff',
//   },

//   // Bottom Spacing
//   bottomSpacing: {
//     height: 40,
//   },
// });

































































import React, { useState, useEffect,  useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
  RefreshControl,
  Platform,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileScreen from './profile';
import ForumHome from './forum';
import PostDetail from '../forum/[id]';
import LostFoundList from '../lost-found/lost-and-found';
import LostFoundDetail from '../lost-found/[id]';
import MarketplaceFeed from '../market-place/market-place-feeds';
import MarketplaceDetail from '../market-place/market-place-item-detail';
import CreateMarketplaceItem from '../market-place/create-market-place-item';
import axios from 'axios';
import ConnectionAPI from '../api/connectionService'
import useProtectedRoute  from '../hooks/useProtectedRoute';
import NotificationBell from '../notifications/components/notification-bell';


const { width } = Dimensions.get('window');

type UserProfile = {
  username?: string;
  profile_picture?: string | null;
  course?: string;
  year?: string | number;
  email?: string;
};

type Event = {
  id: number;
  title: string;
  location: string;
  start_time: string;
  end_time: string;
  rsvped: boolean;
  description?: string;
};

type Club = {
  id: number;
  name: string;
  description: string;
  category: string;
  joined: boolean;
  member_count?: number;
};

type DashboardStats = {
  connections: number;
  messages: number;
  events: number;
  clubs: number;
  posts: number;
  lostFoundItems: number;
};

type Post = {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  category: string;
  image?: string;
  is_liked_by_user?: boolean;
};

type Connection = {
  id: number;
  content: string;
  user_1: string;
  user_2: string;
  created_at: string;
};


type MarketplaceItem = {
  id: number;
  title: string;
  price: string;
  category: string;
  condition: string;
  image: string | null;
  is_sold?: boolean;
  created_at?: string;
  owner?: {
    username: string;
  };
};

type LostFoundItem = {
  id: number;
  title: string;
  description: string;
  status: 'lost' | 'found' | 'claimed';
  location: string;
  date: string;
  image?: string;
  owner: string;
};


const ConfirmationModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false 
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalMessage}>{message}</Text>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modalButton, 
                isDestructive ? styles.destructiveButton : styles.confirmButton
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.confirmButtonText,
                isDestructive && styles.destructiveButtonText
              ]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};



export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, LoadingComponent } = useProtectedRoute();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showKabFunCommunity, setShowKabFunCommunity] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [showLostFound, setShowLostFound] = useState(false);
  const [showLostFoundDetail, setShowLostFoundDetail] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showMarketplaceDetail, setShowMarketplaceDetail] = useState(false);
  const [showCreateMarketplaceItem, setShowCreateMarketplaceItem] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedLostFoundId, setSelectedLostFoundId] = useState<number | null>(null);
  const [selectedMarketplaceItemId, setSelectedMarketplaceItemId] = useState<number | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    connections: 0,
    messages: 0,
    events: 0,
    clubs: 0,
    posts: 0,
    lostFoundItems: 0,
    marketplaceItems: 0,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [currentClubIndex, setCurrentClubIndex] = useState(0);


  const eventSlideAnim = useRef(new Animated.Value(0)).current;
  const clubSlideAnim = useRef(new Animated.Value(0)).current;
  const eventOpacityAnim = useRef(new Animated.Value(1)).current;
  const clubOpacityAnim = useRef(new Animated.Value(1)).current;


 
  const params = useLocalSearchParams();

  // useEffect(() => {
  //   loadUserProfile();
  //   loadDashboardData();
  // }, []);


  useEffect(() => {
    // Initialize animations to prevent mobile issues
    eventSlideAnim.setValue(0);
    clubSlideAnim.setValue(0);
    eventOpacityAnim.setValue(1);
    clubOpacityAnim.setValue(1);
    
    loadUserProfile();
    loadDashboardData();
  }, []);

  // Your existing useEffect (only run when authenticated)
  // useEffect(() => {
  // // Only run the effect when authenticated
  //   if (isAuthenticated) {
  //     loadUserProfile();
  //     loadDashboardData();
  //   }
  // }, []);
  // // }, [isAuthenticated]);


  // if (authLoading) {
  //   return <LoadingComponent />;
  // }

  // // If not authenticated, the hook will handle redirect, but we can show loading
  // if (!isAuthenticated) {
  //   return <LoadingComponent />;
  // }

  

  const loadUserProfile = async () => {
    try {
      // First try to get current user from ConnectionAPI (which handles caching)
      const currentUser = await ConnectionAPI.getCurrentUser();
      if (currentUser) {
        setUserProfile(currentUser);
      } else {
        // Fallback to AsyncStorage if needed
        const storedProfile = await AsyncStorage.getItem('user_profile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile');
      
   
      try {
        const storedProfile = await AsyncStorage.getItem('user_profile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          setUserProfile(profile);
        }
      } catch (fallbackError) {
        console.error('Fallback profile loading failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };


  const loadDashboardData = async () => {
    try {
      setDataLoading(true);
      setError(null);
      const token = await ConnectionAPI.getAuthToken();
      
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }

      // Load events, clubs, posts, and lost-found items concurrently
      const [eventsResponse, clubsResponse, postsResponse, lostFoundResponse, marketplaceResponse, connectionResponse] = await Promise.allSettled([
        ConnectionAPI.getEvents(),
        ConnectionAPI.getClubs(), 
        ConnectionAPI.getPosts(),
        ConnectionAPI.getLostFoundItems(),
        ConnectionAPI.getMarketplaceItems(),
        ConnectionAPI.getMyConnections(),
      ]);

      console.log('=== DETAILED DEBUG RESPONSES ===');

      // Handle events response - Fixed data extraction
      if (eventsResponse.status === 'fulfilled') {
        console.log('Events - Full Response Value:', eventsResponse.value);
        
        // Try different possible data structures
        let eventsData = [];
        if (eventsResponse.value?.data) {
          eventsData = eventsResponse.value.data;
        } else if (Array.isArray(eventsResponse.value)) {
          eventsData = eventsResponse.value;
        } else if (eventsResponse.value?.results) {
          eventsData = eventsResponse.value.results;
        }
    
        setEvents(Array.isArray(eventsData) ? eventsData.slice(0, 3) : []);
        setStats(prev => ({ 
          ...prev, 
          events: Array.isArray(eventsData) ? eventsData.filter((event) => event.rsvped).length : 0
        }));
      } else {
        console.error('Failed to load events:', eventsResponse.reason);
        setEvents([]);
      }

      // Handle clubs response - Fixed data extraction
      if (clubsResponse.status === 'fulfilled') {
        console.log('Clubs - Full Response Value:', clubsResponse.value);
        
        let clubsData = [];
        if (clubsResponse.value?.data) {
          clubsData = clubsResponse.value.data;
        } else if (Array.isArray(clubsResponse.value)) {
          clubsData = clubsResponse.value;
        } else if (clubsResponse.value?.results) {
          clubsData = clubsResponse.value.results;
        }
      
        setClubs(Array.isArray(clubsData) ? clubsData.slice(0, 3) : []);
        setStats(prev => ({ 
          ...prev, 
          clubs: Array.isArray(clubsData) ? clubsData.filter((club) => club.joined).length : 0
        }));
      } else {
        console.error('Failed to load clubs:', clubsResponse.reason);
        setClubs([]);
      }

      // Handle posts response - Fixed data extraction
      if (postsResponse.status === 'fulfilled') {
        console.log('Posts - Full Response Value:', postsResponse.value);
        
        let postsData = [];
        if (postsResponse.value?.data) {
          postsData = postsResponse.value.data;
        } else if (Array.isArray(postsResponse.value)) {
          postsData = postsResponse.value;
        } else if (postsResponse.value?.results) {
          postsData = postsResponse.value.results;
        }
      
        setRecentPosts(Array.isArray(postsData) ? postsData.slice(0, 3) : []);
        setStats(prev => ({ 
          ...prev, 
          posts: Array.isArray(postsData) ? postsData.length : 0
        }));
      } else {
        console.error('Failed to load posts:', postsResponse.reason);
        setRecentPosts([]);
      }

      // Handle lost-found response - Fixed data extraction
      if (lostFoundResponse.status === 'fulfilled') {
        console.log('Lost Found - Full Response Value:', lostFoundResponse.value);
        
        let lostFoundData = [];
        if (lostFoundResponse.value?.data) {
          lostFoundData = lostFoundResponse.value.data;
        } else if (Array.isArray(lostFoundResponse.value)) {
          lostFoundData = lostFoundResponse.value;
        } else if (lostFoundResponse.value?.results) {
          lostFoundData = lostFoundResponse.value.results;
        }
    
        setLostFoundItems(Array.isArray(lostFoundData) ? lostFoundData.slice(0, 3) : []);
        setStats(prev => ({ 
          ...prev, 
          lostFoundItems: Array.isArray(lostFoundData) ? lostFoundData.length : 0
        }));
      } else {
        console.error('Failed to load lost-found items:', lostFoundResponse.reason);
        setLostFoundItems([]);
      }

      // Handle marketplace response - Fixed data extraction
      if (marketplaceResponse.status === 'fulfilled') {
        console.log('Marketplace - Full Response Value:', marketplaceResponse.value);
        
        let marketplaceData = [];
        if (marketplaceResponse.value?.data) {
          marketplaceData = marketplaceResponse.value.data;
        } else if (Array.isArray(marketplaceResponse.value)) {
          marketplaceData = marketplaceResponse.value;
        } else if (marketplaceResponse.value?.results) {
          marketplaceData = marketplaceResponse.value.results;
        }
       
        setMarketplaceItems(Array.isArray(marketplaceData) ? marketplaceData.slice(0, 3) : []);
        setStats(prev => ({ 
          ...prev, 
          marketplaceItems: Array.isArray(marketplaceData) ? marketplaceData.length : 0
        }));
      } else {
        console.error('Failed to load marketplace items:', marketplaceResponse.reason);
        setMarketplaceItems([]);
      }

      // Handle connections response - Fixed data extraction (this one already works)
      if (connectionResponse.status === 'fulfilled') {
        console.log('Connection - Full Response Value:', connectionResponse.value);
        
        let connectionData = [];
        if (connectionResponse.value?.data) {
          connectionData = connectionResponse.value.data;
        } else if (Array.isArray(connectionResponse.value)) {
          connectionData = connectionResponse.value;
        } else if (connectionResponse.value?.results) {
          connectionData = connectionResponse.value.results;
        }
        
        setStats(prev => ({ 
          ...prev, 
          connections: Array.isArray(connectionData) ? connectionData.length : 0
        }));
      } else {
        console.error('Failed to load connections:', connectionResponse.reason);
        setStats(prev => ({ 
          ...prev, 
          connections: 0
        }));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection.');
      
      // Set empty arrays to prevent undefined errors
      setEvents([]);
      setClubs([]);
      setRecentPosts([]);
      setLostFoundItems([]);
      setMarketplaceItems([]);
    } finally {
      setDataLoading(false);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserProfile(), loadDashboardData()]);
    setRefreshing(false);
  };

  // const handleLogout = async () => {
  //   Alert.alert(
  //     'Logout',
  //     'Are you sure you want to logout?',
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       {
  //         text: 'Logout',
  //         style: 'destructive',
  //         onPress: async () => {
  //           try {
  //           // Clear all stored data
  //           await AsyncStorage.multiRemove(['access_token', 'user_profile', 'user']);
            
  //           // Navigate to login screen
  //           router.replace('/login'); // Use replace instead of push to prevent going back
  //           } catch (error) {
  //             console.error('Error during logout:', error);
  //             Alert.alert('Error', 'Failed to logout properly');
  //           }
  //         }
  //       },
  //     ]
  //   );
  // };



  const handleLogout = () => {
    setShowLogoutModal(true);
  };


  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      
      await ConnectionAPI.handleLogout();
      router.replace('/login');

    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: manually clear storage if ConnectionAPI fails
      try {
        await AsyncStorage.multiRemove(['access_token', 'currentUser', 'user_profile', 'user']);
        router.replace('/login');

      } catch (fallbackError) {
        console.error('Fallback logout failed:', fallbackError);
        // You can add your toast notification here
        showToast('Failed to logout properly', 'error');
        // Alert.alert('Error', 'Failed to logout properly');
      }
    }
  };



  // Cancel logout
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };



  // const hasProfileImage = (): boolean => {
  //   if (!userProfile?.profile_picture) return false;
    
  //   const pic = userProfile.profile_picture.trim();
    
  //   if (pic === '' || pic === 'null' || pic === 'undefined') return false;
    
  //   return true;
  // };



  const hasProfileImage = (): boolean => {
    if (!userProfile?.profile_picture) return false;
    
    const pic = userProfile.profile_picture.trim();
    
    if (pic === '' || pic === 'null' || pic === 'undefined') return false;
    
    return true;
  };

  const getProfileImageSource = () => {
    if (!hasProfileImage()) return null;
    
    const pic = userProfile!.profile_picture!.trim();
    
    if (pic.startsWith('data:image')) {
      return { uri: pic };
    }
    
    if (pic.startsWith('http')) {
      return { uri: pic };
    }
    
    if (pic.includes('/media/')) {
      const baseUrl = 'http://192.168.130.16:8000';
      const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
      return { uri: fullUrl };
    }
    
    if (typeof pic === 'string' && 
        !pic.includes('/') && 
        !pic.includes('.') && 
        pic.length > 50) {
      return { uri: `data:image/jpeg;base64,${pic}` };
    }
    
    return null;
  };



  // const getProfileImageSource = () => {
  //   if (!userProfile?.profile_picture) return null;
    
  //   const pic = userProfile.profile_picture.trim();
    
  //   // Handle empty or null values
  //   if (!pic || pic === '' || pic === 'null' || pic === 'undefined') {
  //     return null;
  //   }
    
  //   // Handle base64 data URLs
  //   if (pic.startsWith('data:image')) {
  //     return { uri: pic };
  //   }
    
  //   // Handle full URLs
  //   if (pic.startsWith('http://') || pic.startsWith('https://')) {
  //     return { uri: pic };
  //   }
    
  //   // Handle relative paths from your backend
  //   if (pic.includes('/media/') || pic.startsWith('/')) {
  //     const baseUrl = 'http://192.168.130.16 :8000'; // Your backend URL
  //     const fullUrl = pic.startsWith('/') ? `${baseUrl}${pic}` : `${baseUrl}/${pic}`;
  //     return { uri: fullUrl };
  //   }
    
  //   // Handle base64 without data URL prefix
  //   if (pic.length > 50 && !pic.includes('/') && !pic.includes('.')) {
  //     return { uri: `data:image/jpeg;base64,${pic}` };
  //   }
    
  //   return null;
  // };

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleProfilePress = () => {
    setShowProfile(true);
  };

  const onProfileUpdate = async () => {
    await loadUserProfile();
  };

  const formatEventTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };



  // const navigateToEvents = (direction: 'prev' | 'next') => {
  //   if (events.length === 0) return;
    
  //   if (direction === 'next') {
  //     setCurrentEventIndex((prev) => (prev + 1) % events.length);
  //   } else {
  //     setCurrentEventIndex((prev) => (prev - 1 + events.length) % events.length);
  //   }
  //   // Remove the router.push - this was causing navigation to the page
  // };



    const navigateToEvents = (direction: 'prev' | 'next') => {
    if (events.length === 0) return;
    
    const slideValue = direction === 'next' ? -50 : 50;
    
    // Start slide and fade out animation
    Animated.parallel([
      Animated.timing(eventSlideAnim, {
        toValue: slideValue,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(eventOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Update index after fade out
      if (direction === 'next') {
        setCurrentEventIndex((prev) => (prev + 1) % events.length);
      } else {
        setCurrentEventIndex((prev) => (prev - 1 + events.length) % events.length);
      }
      
      // Reset position and slide in from opposite direction
      eventSlideAnim.setValue(-slideValue);
      
      Animated.parallel([
        Animated.timing(eventSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(eventOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    });
  };






  // const navigateToClubs = (direction: 'prev' | 'next') => {
  //   if (clubs.length === 0) return;

  //   if (direction === 'next') {
  //     setCurrentClubIndex((prev) => (prev + 1) % clubs.length);
  //   } else {
  //     setCurrentClubIndex((prev) => (prev - 1 + clubs.length) % clubs.length);
  //   }
  //   // Remove the router.push - this was causing navigation to the page
  // };


    const navigateToClubs = (direction: 'prev' | 'next') => {
    if (clubs.length === 0) return;

    const slideValue = direction === 'next' ? -50 : 50;
    
    // Start slide and fade out animation
    Animated.parallel([
      Animated.timing(clubSlideAnim, {
        toValue: slideValue,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(clubOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Update index after fade out
      if (direction === 'next') {
        setCurrentClubIndex((prev) => (prev + 1) % clubs.length);
      } else {
        setCurrentClubIndex((prev) => (prev - 1 + clubs.length) % clubs.length);
      }
      
      // Reset position and slide in from opposite direction
      clubSlideAnim.setValue(-slideValue);
      
      Animated.parallel([
        Animated.timing(clubSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(clubOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    });
  };





  const handleSeeAllEvents = () => {
    router.push('/auth/events');
  };

  const handleSeeAllClubs = () => {
    router.push('/auth/clubs');
  };


  const handleOpenKabFunCommunity = () => {
    router.push('/auth/forum')
  };
  // const handleOpenKabFunCommunity = () => {
  //   setShowKabFunCommunity(true);
  // };


  const handleConnection = () => {
    router.push('/connections/connection-screen')
  }

  const handleOpenLostFound = () => {
    router.push('/lost-found/lost-and-found')
    // setShowLostFound(true);
  };

  const handleOpenMarketplace = () => {
    router.push('/market-place/market-place-feeds')
    // setShowMarketplace(true);
  };

  const handleOpenChat = () => {
    router.push('/chat/screens/chat-list-screen')
    // router.push('/features/chat/chat-feature-screen')
    // Alert.alert('Coming Soon', 'Chat feature will be available soon!');
  };

  const handleCreatePost = () => {
    setShowKabFunCommunity(false);
    router.push('/forum/create-post');
  };

  const handleCreateLostFoundPost = () => {
    setShowLostFound(false);
    router.push('/lost-found/lost-and-found-post');
  };

  const handleCreateMarketplaceItem = () => {
    setShowMarketplace(false);
    setShowCreateMarketplaceItem(true);
  };

  const handlePostPress = (postId: number) => {
    console.log('Post pressed with ID:', postId, typeof postId);
    setSelectedPostId(postId);
    setShowKabFunCommunity(false);
    setTimeout(() => {
      setShowPostDetail(true);
    }, 100);
  };

  const getItemId = () => {
    if (params.id) return params.id;
    if (params.itemId) return params.itemId;
    
    if (params.item && typeof params.item === 'object') {
      return params.item.id;
    }
    
    if (params.item && typeof params.item === 'string') {
      try {
        const parsedItem = JSON.parse(params.item);
        return parsedItem.id;
      } catch (e) {
        console.error('Failed to parse item param:', e);
      }
    }
    
    return null;
  };

  const itemId = getItemId();

  const handleLostFoundItemPress = (itemId: number) => {
    console.log('Lost & Found item pressed with ID:', itemId, typeof itemId);
    setSelectedLostFoundId(itemId);
    setShowLostFound(false);
    setTimeout(() => {
      setShowLostFoundDetail(true);
    }, 100);
  };

  const handleMarketplaceItemPress = (itemId: number) => {
    console.log('Marketplace item pressed with ID:', itemId, typeof itemId);
    setSelectedMarketplaceItemId(itemId);
    setShowMarketplace(false);
    setTimeout(() => {
      setShowMarketplaceDetail(true);
    }, 100);
  };

  const quickActions = [
    {
      id: 'community',
      title: 'KabFunCommunity',
      subtitle: 'Join discussions and share posts',
      icon: 'chatbubbles-outline',
      color: '#6366f1',
      onPress: handleOpenKabFunCommunity,
    },
    {
    id: 'marketplace', 
    title: 'MarketPlace',
    subtitle: 'Buy and sell items with classmates', 
    icon: 'storefront-outline', 
    color: '#667eea', 
    onPress: handleOpenMarketplace, 
    },
    {
      id: 'lost-found',
      title: 'Lost & Found',
      subtitle: 'Find lost items or report found items',
      icon: 'search-outline',
      color: '#06b6d4',
      onPress: handleOpenLostFound,
    },
    {
      id: 'chat',
      title: 'Chat',
      subtitle: 'Message your friends and classmates',
      icon: 'chatbubble-ellipses-outline',
      color: '#10b981',
      onPress: handleOpenChat,
      // comingSoon: false,
    },
    {
      id: 'find-students',
      title: 'Find Students',
      subtitle: 'Connect with your classmates',
      icon: 'person-add-outline',
      color: '#8b5cf6',
      onPress: handleConnection,
      
    },
    // Commented out as requested
    // {
    //   id: 'events',
    //   title: 'Events',
    //   subtitle: 'Discover campus events',
    //   icon: 'calendar-outline',
    //   color: '#f59e0b',
    //   onPress: navigateToEvents,
    // },
    // {
    //   id: 'clubs',
    //   title: 'Clubs',
    //   subtitle: 'Join student organizations',
    //   icon: 'people-outline',
    //   color: '#ef4444',
    //   onPress: navigateToClubs,
    // },
  ];

  const renderQuickActionItem = ({ item }: { item: any }) => {
    const cardStyle = isGridView ? styles.gridActionCard : styles.listActionCard;
    const contentStyle = isGridView ? styles.gridActionContent : styles.listActionContent;

    return (
      <TouchableOpacity 
        style={[cardStyle, item.comingSoon && styles.comingSoonCard]}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.actionIcon, { backgroundColor: `${item.color}15` }]}>
          <Ionicons name={item.icon} size={24} color={item.color} />
          {item.comingSoon && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          )}
        </View>
        <View style={contentStyle}>
          <Text style={styles.actionTitle}>{item.title}</Text>
          <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
        </View>
        {!isGridView && (
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        )}
      </TouchableOpacity>
    );
  };

  // const EventCard = ({ event }: { event: Event }) => (
  //   <TouchableOpacity style={styles.itemCard} activeOpacity={0.7}>
  //     <View style={styles.itemHeader}>
  //       <Ionicons name="calendar" size={20} color="#6366f1" />
  //       <Text style={styles.itemTitle} numberOfLines={1}>{event.title}</Text>
  //     </View>
  //     <Text style={styles.itemSubtitle} numberOfLines={1}>
  //       {event.location}
  //     </Text>
  //     <Text style={styles.itemTime}>
  //       {formatEventTime(event.start_time)}
  //     </Text>
  //     {event.rsvped && (
  //       <View style={styles.rsvpBadge}>
  //         <Text style={styles.rsvpText}>RSVP'd</Text>
  //       </View>
  //     )}
  //   </TouchableOpacity>
  // );

  // const ClubCard = ({ club }: { club: Club }) => (
  //   <TouchableOpacity style={styles.itemCard} activeOpacity={0.7}>
  //     <View style={styles.itemHeader}>
  //       <Ionicons name="people" size={20} color="#6366f1" />
  //       <Text style={styles.itemTitle} numberOfLines={1}>{club.name}</Text>
  //     </View>
  //     <Text style={styles.itemSubtitle} numberOfLines={2}>
  //       {club.description}
  //     </Text>
  //     <Text style={styles.itemCategory}>{club.category}</Text>
  //     {club.joined && (
  //       <View style={styles.joinedBadge}>
  //         <Text style={styles.joinedText}>Joined</Text>
  //       </View>
  //     )}
  //   </TouchableOpacity>
  // );


  // const EventCard = ({ event }: { event: Event }) => (
  //   <Animated.View
  //     style={[
  //       styles.enhancedItemCard,
  //       {
  //         transform: [{ translateX: eventSlideAnim }],
  //         opacity: eventOpacityAnim,
  //       }
  //     ]}
  //   >
  //     <TouchableOpacity style={styles.cardContent} activeOpacity={0.8}>
  //       <LinearGradient
  //         colors={['#6366f1', '#8b5cf6']}
  //         style={styles.cardGradient}
  //         start={{ x: 0, y: 0 }}
  //         end={{ x: 1, y: 0 }}
  //       >
  //         <View style={styles.cardIconContainer}>
  //           <Ionicons name="calendar" size={24} color="#fff" />
  //         </View>
  //       </LinearGradient>
        
  //       <View style={styles.cardTextContent}>
  //         <Text style={styles.enhancedItemTitle} numberOfLines={1}>{event.title}</Text>
  //         <View style={styles.itemDetailRow}>
  //           <Ionicons name="location-outline" size={16} color="#64748b" />
  //           <Text style={styles.enhancedItemSubtitle} numberOfLines={1}>
  //             {event.location}
  //           </Text>
  //         </View>
  //         <View style={styles.itemDetailRow}>
  //           <Ionicons name="time-outline" size={16} color="#64748b" />
  //           <Text style={styles.enhancedItemTime}>
  //             {formatEventTime(event.start_time)}
  //           </Text>
  //         </View>
  //       </View>
        
  //       {event.rsvped && (
  //         <View style={styles.enhancedRsvpBadge}>
  //           <Ionicons name="checkmark-circle" size={16} color="#10b981" />
  //           <Text style={styles.enhancedRsvpText}>RSVP'd</Text>
  //         </View>
  //       )}
  //     </TouchableOpacity>
  //   </Animated.View>
  // );





  const EventCard = ({ event }: { event: Event }) => (
    <Animated.View
      style={[
        styles.enhancedItemCard,
        {
          transform: [{ translateX: eventSlideAnim }],
          opacity: eventOpacityAnim,
        }
      ]}
    >
      <TouchableOpacity style={styles.cardContent} activeOpacity={0.8}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="calendar" size={22} color="#fff" />
          </View>
        </LinearGradient>
        
        <View style={styles.cardTextContent}>
          <Text style={styles.enhancedItemTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={styles.itemDetailRow}>
            <Ionicons name="location-outline" size={14} color="#64748b" />
            <Text style={styles.enhancedItemSubtitle} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
          <View style={styles.itemDetailRow}>
            <Ionicons name="time-outline" size={14} color="#64748b" />
            <Text style={styles.enhancedItemTime}>
              {formatEventTime(event.start_time)}
            </Text>
          </View>
          
          {event.rsvped && (
            <View style={styles.enhancedRsvpBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text style={styles.enhancedRsvpText}>RSVP'd</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );










  // Enhanced Club Card with animation
  // const ClubCard = ({ club }: { club: Club }) => (
  //   <Animated.View
  //     style={[
  //       styles.enhancedItemCard,
  //       {
  //         transform: [{ translateX: clubSlideAnim }],
  //         opacity: clubOpacityAnim,
  //       }
  //     ]}
  //   >
  //     <TouchableOpacity style={styles.cardContent} activeOpacity={0.8}>
  //       <LinearGradient
  //         colors={['#06b6d4', '#0ea5e9']}
  //         style={styles.cardGradient}
  //         start={{ x: 0, y: 0 }}
  //         end={{ x: 1, y: 0 }}
  //       >
  //         <View style={styles.cardIconContainer}>
  //           <Ionicons name="people" size={24} color="#fff" />
  //         </View>
  //       </LinearGradient>
        
  //       <View style={styles.cardTextContent}>
  //         <Text style={styles.enhancedItemTitle} numberOfLines={1}>{club.name}</Text>
  //         <Text style={styles.enhancedItemSubtitle} numberOfLines={2}>
  //           {club.description}
  //         </Text>
  //         <View style={styles.itemDetailRow}>
  //           <Ionicons name="pricetag-outline" size={16} color="#64748b" />
  //           <Text style={styles.enhancedItemCategory}>{club.category}</Text>
  //           {club.member_count && (
  //             <>
  //               <Text style={styles.memberSeparator}>•</Text>
  //               <Text style={styles.memberCount}>{club.member_count} members</Text>
  //             </>
  //           )}
  //         </View>
  //       </View>
        
  //       {club.joined && (
  //         <View style={styles.enhancedJoinedBadge}>
  //           <Ionicons name="checkmark-circle" size={16} color="#10b981" />
  //           <Text style={styles.enhancedJoinedText}>Joined</Text>
  //         </View>
  //       )}
  //     </TouchableOpacity>
  //   </Animated.View>
  // );




  // const ErrorBanner = () => {
  //   if (!error) return null;
    
  //   return (
  //     <View style={styles.errorBanner}>
  //       <Ionicons name="warning-outline" size={20} color="#ef4444" />
  //       <Text style={styles.errorText}>{error}</Text>
  //       <TouchableOpacity onPress={() => setError(null)}>
  //         <Ionicons name="close" size={20} color="#ef4444" />
  //       </TouchableOpacity>
  //     </View>
  //   );
  // };





  const ClubCard = ({ club }: { club: Club }) => (
    <Animated.View
      style={[
        styles.enhancedItemCard,
        {
          transform: [{ translateX: clubSlideAnim }],
          opacity: clubOpacityAnim,
        }
      ]}
    >
      <TouchableOpacity style={styles.cardContent} activeOpacity={0.8}>
        <LinearGradient
          colors={['#06b6d4', '#0ea5e9']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="people" size={22} color="#fff" />
          </View>
        </LinearGradient>
        
        <View style={styles.cardTextContent}>
          <Text style={styles.enhancedItemTitle} numberOfLines={1}>
            {club.name}
          </Text>
          <Text style={styles.enhancedItemSubtitle} numberOfLines={2}>
            {club.description}
          </Text>
          <View style={styles.itemDetailRow}>
            <Ionicons name="pricetag-outline" size={14} color="#64748b" />
            <Text style={styles.enhancedItemCategory}>{club.category}</Text>
            {club.member_count && (
              <>
                <Text style={styles.memberSeparator}>•</Text>
                <Text style={styles.memberCount}>{club.member_count} members</Text>
              </>
            )}
          </View>
          
          {club.joined && (
            <View style={styles.enhancedJoinedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text style={styles.enhancedJoinedText}>Joined</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );










  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#a855f7']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.profileSection}
              onPress={handleProfilePress}
              activeOpacity={0.8}
            >
              <View style={styles.profileImageContainer}>
                
                {hasProfileImage() && ConnectionAPI.getUserProfilePicture(user) ? (
                  <Image 
                    source={ConnectionAPI.getUserProfilePicture(user)!} 
                    style={styles.profileImage}
                    onError={(error) => {
                      console.log('Profile image failed to load:', error);
                    }}
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={styles.initials}>
                      {getInitials(userProfile?.username)}
                    </Text>
                  </View>
                )}
                <View style={styles.onlineIndicator} />
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>
                  {userProfile?.username || 'Student'}
                </Text>
                <View style={styles.userDetails}>
                  {userProfile?.course && (
                    <View style={styles.detailItem}>
                      <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.detailText}>{userProfile.course}</Text>
                    </View>
                  )}
                  {userProfile?.year && (
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.detailText}>Year {userProfile.year}</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.profileArrow}>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.7}            
            >
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <ConfirmationModal
              visible={showLogoutModal}
              onClose={cancelLogout}
              onConfirm={confirmLogout}
              title="Logout"
              message="Are you sure you want to logout?"
              confirmText="Logout"
              cancelText="Cancel"
              isDestructive={true}
            />

          </View>
        </LinearGradient> */}



          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.header}>
              {/* Left Section - Logo and App Name */}
              <View style={styles.leftSection}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>KC</Text>
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>KABCONNECT</Text>
                  <Text style={styles.appTagline}>Stay Connected</Text>
                </View>
              </View>

              {/* Right Section - Notifications and Profile */}
              <View style={styles.rightSection}>
                {/* Notification Bell */}
                <TouchableOpacity
                  style={styles.notificationContainer}
                  onPress={() => router.push('/notifications/components/notification-screen')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications-outline" size={24} color="#fff" />
                  {/* Add notification badge if needed */}
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>2</Text>
                  </View>
                </TouchableOpacity>

                {/* Profile Section */}
                <TouchableOpacity 
                  style={styles.profileContainer}
                  onPress={handleProfilePress}
                  activeOpacity={0.8}
                >
                  <View style={styles.profileImageWrapper}>
                    {/* {hasProfileImage() && ConnectionAPI.getUserProfilePicture(user) ? (
                    <Image 
                      source={ConnectionAPI.getUserProfilePicture(user)!} 
                      style={styles.profileImage}
                      onError={(error) => {
                        console.log('Profile image failed to load:', error);
                      }}
                    />
                    ) : ( */}

                    
                    {hasProfileImage() ? (
                    <Image
                      source={getProfileImageSource(userProfile)}
                      // source={ConnectionAPI.getUserProfilePicture(userProfile)}
                      style={styles.profileImage}
                      // defaultSource={require('../../assets/default-avatar.png')}
                    />
                    ) : (
                      <View style={styles.profilePlaceholder}>
                        <Text style={styles.initials}>
                          {getInitials(userProfile?.username)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.onlineIndicator} />
                  </View>
                  
                  <View style={styles.profileInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {userProfile?.username || 'Student'}
                    </Text>
                    <Text style={styles.userRole} numberOfLines={1}>
                      {userProfile?.course || 'Student'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Settings/Menu Button */}
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>



        <View style={styles.content}>
          {/* <ErrorBanner /> */}
          
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome to CampusConnect</Text>
            <Text style={styles.welcomeSubtitle}>
              Your gateway to campus life and connections
            </Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={24} color="#6366f1" />
              <Text style={styles.statNumber}>{stats.connections}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="chatbubbles-outline" size={24} color="#10b981" />
              <Text style={styles.statNumber}>{stats.messages}</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="search-outline" size={24} color="#06b6d4" />
              <Text style={styles.statNumber}>{stats.lostFoundItems}</Text>
              <Text style={styles.statLabel}>Lost & Found</Text>
            </View>
            

            <View style={styles.statCard}>
               <Ionicons name="storefront-outline" size={24} color="#667eea" />
               <Text style={styles.statNumber}>{stats.marketplaceItems}</Text>
               <Text style={styles.statLabel}>Buy&Sale Items</Text>
            </View>


            <View style={styles.statCard}>
              <Ionicons name="heart-outline" size={24} color="#ec4899" />
              <Text style={styles.statNumber}>{stats.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Upcoming Events */}
  
          {/* <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity onPress={handleSeeAllEvents}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {dataLoading ? (
              <ActivityIndicator size="small" color="#6366f1" style={styles.sectionLoader} />
            ) : events.length > 0 ? (
              <View style={styles.sliderContainer}>
                <TouchableOpacity 
                  style={styles.sliderArrow} 
                  onPress={() => navigateToEvents('prev')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={20} color="#6366f1" />
                </TouchableOpacity>
                
                <View style={styles.sliderCardContainer}>
                  <EventCard event={events[currentEventIndex]} />
                </View>
                
                <TouchableOpacity 
                  style={styles.sliderArrow} 
                  onPress={() => navigateToEvents('next')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={20} color="#6366f1" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No upcoming events</Text>
                <Text style={styles.emptySubtext}>Check back later for new events</Text>
              </View>
            )}
            
            
            {events.length > 1 && (
              <View style={styles.indicatorContainer}>
                {events.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentEventIndex && styles.activeIndicator
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          

  //           <View style={styles.sectionContainer}>
  //             <View style={styles.sectionHeader}>
  //               <Text style={styles.sectionTitle}>Popular Clubs</Text>
  //               <TouchableOpacity onPress={handleSeeAllClubs}>
  //                 <Text style={styles.seeAllText}>See All</Text>
  //               </TouchableOpacity>
  //             </View>
              
  //             {dataLoading ? (
  //               <ActivityIndicator size="small" color="#6366f1" style={styles.sectionLoader} />
  //             ) : clubs.length > 0 ? (
  //               <View style={styles.sliderContainer}>
  //                 <TouchableOpacity 
  //                   style={styles.sliderArrow} 
  //                   onPress={() => navigateToClubs('prev')}
  //                   activeOpacity={0.7}
  //                 >
  //                   <Ionicons name="chevron-back" size={20} color="#6366f1" />
  //                 </TouchableOpacity>
                  
  //                 <View style={styles.sliderCardContainer}>
  //                   <ClubCard club={clubs[currentClubIndex]} />
  //                 </View>
                  
  //                 <TouchableOpacity 
  //                   style={styles.sliderArrow} 
  //                   onPress={() => navigateToClubs('next')}
  //                   activeOpacity={0.7}
  //                 >
  //                   <Ionicons name="chevron-forward" size={20} color="#6366f1" />
  //                 </TouchableOpacity>
  //               </View>
  //             ) : (
  //               <View style={styles.emptyContainer}>
  //                 <Ionicons name="people-outline" size={48} color="#cbd5e1" />
  //                 <Text style={styles.emptyText}>No clubs available</Text>
  //                 <Text style={styles.emptySubtext}>Be the first to join a club</Text>
  //               </View>
  //             )}
              
              
  //             {clubs.length > 1 && (
  //               <View style={styles.indicatorContainer}>
  //                 {clubs.map((_, index) => (
  //                   <View
  //                     key={index}
  //                     style={[
  //                       styles.indicator,
  //                       index === currentClubIndex && styles.activeIndicator
  //                     ]}
  //                   />
  //                 ))}
  //               </View>
  //             )}
  //           </View> */}




  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      <TouchableOpacity 
        style={styles.seeAllButton}
        onPress={handleSeeAllEvents}
        activeOpacity={0.7}
      >
        <Text style={styles.seeAllText}>See All</Text>
        <Ionicons name="chevron-forward" size={16} color="#6366f1" />
      </TouchableOpacity>
    </View>

    {dataLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#6366f1" /> 
      </View>
    ) : events.length > 0 ? (
      <View style={styles.carouselContainer}>
        {events.length > 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.prevButton]}
            onPress={() => navigateToEvents('prev')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#6366f1" />
          </TouchableOpacity>
      )}

        <EventCard event={events[currentEventIndex]} />

        {events.length > 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={() => navigateToEvents('next')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={20} color="#6366f1" />
          </TouchableOpacity>
        )}
      </View>
    ) : (
      <View style={styles.emptyState}>               
        <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
        <Text style={styles.emptyStateTitle}>No Upcoming Events</Text>
        <Text style={styles.emptyStateSubtitle}>
          Check back later for new events
        </Text>
      </View>
    )}

    {events.length > 1 && (
      <View style={styles.carouselIndicators}>
        {events.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentEventIndex && styles.activeIndicator
            ]}
          />
        ))}
      </View>
    )}
  </View>

      {/* Enhanced Clubs Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Clubs</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={handleSeeAllClubs}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {dataLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        ) : clubs.length > 0 ? (
          <View style={styles.carouselContainer}>
            {clubs.length > 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={() => navigateToClubs('prev')}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color="#6366f1" />
              </TouchableOpacity>
            )}

            <ClubCard club={clubs[currentClubIndex]} />

            {clubs.length > 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={() => navigateToClubs('next')}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={20} color="#6366f1" />
              </TouchableOpacity>
            )}
          </View>           ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No Clubs Yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Join clubs to connect with like-minded students
            </Text>
          </View>
        )}

        {clubs.length > 1 && (
          <View style={styles.carouselIndicators}>
            {clubs.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentClubIndex && styles.activeIndicator
              ]}
              />
            ))}
          </View>
        )}
      </View>












        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionsHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, isGridView && styles.activeToggle]}
                onPress={() => setIsGridView(true)}
              >
                <Ionicons name="grid-outline" size={18} color={isGridView ? '#fff' : '#6366f1'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !isGridView && styles.activeToggle]}
                onPress={() => setIsGridView(false)}
              >
                <Ionicons name="list-outline" size={18} color={!isGridView ? '#fff' : '#6366f1'} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={quickActions}
            renderItem={renderQuickActionItem}
            keyExtractor={(item) => item.id}
            numColumns={isGridView ? 2 : 1}
            key={isGridView ? 'grid' : 'list'}
            scrollEnabled={false}
            contentContainerStyle={isGridView ? styles.gridContainer : styles.listContainer}
          />
        </View>
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <Modal
        visible={showProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfile(false)}
      >
        <ProfileScreen 
          onClose={() => setShowProfile(false)}
          onProfileUpdate={onProfileUpdate}
        />
      </Modal>

      {/* KabFunCommunity (Forum) Modal */}
      <Modal
        visible={showKabFunCommunity}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowKabFunCommunity(false)}
      >
        <ForumHome 
          onClose={() => setShowKabFunCommunity(false)}
          onCreatePost={handleCreatePost}
          onPostPress={handlePostPress}
        />
      </Modal>

      {/* Post Detail Modal */}
      <Modal
        visible={showPostDetail}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPostDetail(false)}
      >
        <PostDetail 
          postId={selectedPostId}
          onClose={() => setShowPostDetail(false)}
        />
      </Modal>

      {/* Lost & Found Modal */}
      <Modal
        visible={showLostFound}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowLostFound(false)}
      >
        <LostFoundList 
          onClose={() => setShowLostFound(false)}
          onCreatePost={handleCreateLostFoundPost}
          onItemPress={handleLostFoundItemPress}
        />
      </Modal>

     {/* Lost & Found Detail Modal */}
      <Modal
        visible={showLostFoundDetail}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowLostFoundDetail(false)}
      >
        <LostFoundDetail 
          itemId={selectedLostFoundId}
          onClose={() => setShowLostFoundDetail(false)}
        />
      </Modal>

      {/* Marketplace Modal */}
      <Modal
        visible={showMarketplace}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMarketplace(false)}
      >
        <MarketplaceFeed 
          onClose={() => setShowMarketplace(false)}
          onCreateItem={handleCreateMarketplaceItem}
          onItemPress={handleMarketplaceItemPress}
        />
      </Modal>

      {/* Marketplace Detail Modal */}
      <Modal
        visible={showMarketplaceDetail}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMarketplaceDetail(false)}
      >
        <MarketplaceDetail 
          itemId={selectedMarketplaceItemId}
          onClose={() => setShowMarketplaceDetail(false)}
        />
      </Modal>

      {/* Create Marketplace Item Modal */}
      <Modal
        visible={showCreateMarketplaceItem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateMarketplaceItem(false)}
      >
        <CreateMarketplaceItem 
          onClose={() => setShowCreateMarketplaceItem(false)}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ==================== MAIN CONTAINER ====================
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // ==================== LOADING STATES ====================
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },

  // ==================== HEADER SECTION ====================
  headerGradient: {
    // paddingTop: Platform.OS === 'ios' ? 50 : 35,
    paddingTop: Platform.OS === 'ios' ? 44 : 25,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
   minHeight: 60,
  },
  
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: '60%',
  },
  
  logoContainer: {
    width: 74,
    height: 84,
    borderRadius: 22,
    backgroundColor: 'rgba(46, 44, 44, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 2
  },
  
  logoText: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  appInfo: {
    flex: 1,
    marginTop: -110,
    marginLeft: 40
  },
  
  appName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    marginRight: -50
  },
  
  appTagline: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: '40%',
  },

  // ==================== NOTIFICATION STYLES ====================
  notificationContainer: {
    position: 'relative',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: -122
  },
  
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    
  },
  
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },

  // ==================== PROFILE STYLES ====================
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // marginLeft: -100,
  },
  
  profileImageWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  
  profilePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  
  initials: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  onlineIndicator: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    backgroundColor: '#10b981',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  
  profileInfo: {
    maxWidth: 100,
    minWidth: 0,
  },
  
  userName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  
  userRole: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  
  menuButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // ==================== CONTENT AREA ====================
content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16, 
    paddingBottom: 20,
  },

  // ==================== WELCOME CARD ====================
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 20,
    fontWeight: '500',
  },

  // ==================== STATS CONTAINER ====================
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minHeight: 75,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },

  // ==================== SECTION STYLES ====================
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  seeAllText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },

  // ==================== ENHANCED CARD STYLES ====================
  // enhancedItemCard: {
  //   backgroundColor: '#ffffff',
  //   borderRadius: 16,
  //   marginHorizontal: 4,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 6 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 16,
  //   elevation: 6,
  //   overflow: 'hidden',
  //   borderWidth: 1,
  //   borderColor: '#f1f5f9',
  // },
  // cardContent: {
  //   flexDirection: 'row',
  //   alignItems: 'flex-start',
  //   padding: 16,
  //   minHeight: 100,
  // },
  // cardGradient: {
  //   width: 56,
  //   height: 56,
  //   borderRadius: 28,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   marginRight: 14,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.15,
  //   shadowRadius: 4,
  //   elevation: 3,
  // },
  // cardIconContainer: {
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  // cardTextContent: {
  //   flex: 1,
  //   paddingRight: 8,
  // },
  // enhancedItemTitle: {
  //   fontSize: 16,
  //   fontWeight: '700',
  //   color: '#1e293b',
  //   marginBottom: 6,
  //   lineHeight: 20,
  // },
  // enhancedItemSubtitle: {
  //   fontSize: 14,
  //   color: '#64748b',
  //   marginBottom: 6,
  //   lineHeight: 18,
  //   fontWeight: '500',
  // },
  // enhancedItemTime: {
  //   fontSize: 12,
  //   color: '#64748b',
  //   fontWeight: '600',
  // },
  // enhancedItemCategory: {
  //   fontSize: 12,
  //   color: '#64748b',
  //   fontWeight: '600',
  // },
  // itemDetailRow: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginBottom: 4,
  //   flexWrap: 'wrap',
  // },
  // memberSeparator: {
  //   color: '#cbd5e1',
  //   marginHorizontal: 8,
  //   fontSize: 12,
  //   fontWeight: '500',
  // },
  // memberCount: {
  //   fontSize: 12,
  //   color: '#64748b',
  //   fontWeight: '600',
  // },

   enhancedItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 8, 
    width: width - 80, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    minHeight: 110, 
  },
  
  cardGradient: {
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    flexShrink: 0, 
  },
  
  cardIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  cardTextContent: {
    flex: 1,
    paddingRight: 8,
    minWidth: 0, 
  },
  
  enhancedItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 20,
  },
  
  enhancedItemSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
    lineHeight: 18,
    fontWeight: '500',
  },
  
  itemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  
  enhancedItemTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: 4, 
  },
  
  enhancedItemCategory: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: 4, 
  },



  // ==================== BADGES ====================
  // enhancedRsvpBadge: {
  //   backgroundColor: '#dcfce7',
  //   borderRadius: 12,
  //   paddingHorizontal: 10,
  //   paddingVertical: 4,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginLeft: 8,
  // },
  // enhancedRsvpText: {
  //   color: '#10b981',
  //   fontSize: 10,
  //   fontWeight: '700',
  //   marginLeft: 4,
  // },
  // enhancedJoinedBadge: {
  //   backgroundColor: '#dcfce7',
  //   borderRadius: 12,
  //   paddingHorizontal: 10,
  //   paddingVertical: 4,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginLeft: 8,
  // },
  // enhancedJoinedText: {
  //   color: '#10b981',
  //   fontSize: 10,
  //   fontWeight: '700',
  //   marginLeft: 4,
  // },




   enhancedRsvpBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 10, 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', 
    marginTop: 4, 
  },
  
  enhancedRsvpText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3, 
  },
  
  enhancedJoinedBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 10, 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', 
    marginTop: 4, 
  },
  
  enhancedJoinedText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },


  // ==================== CAROUSEL STYLES ====================
  carouselContainer: {
    position: 'relative',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginHorizontal: -16,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ translateY: -18 }],
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  prevButton: {
    left: 8,
  },
  nextButton: {
    right: 8,
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 2,
  },
  activeIndicator: {
    backgroundColor: '#6366f1',
    width: 24,
  },

  // ==================== EMPTY STATES ====================
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    fontWeight: '500',
  },

  // ==================== ACTIONS SECTION ====================
  actionsContainer: {
    marginBottom: 28,
  },
  actionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: '#6366f1',
  },

  // ==================== ACTION CARDS ====================
  gridContainer: {
    gap: 12,
  },
  listContainer: {
    gap: 10,
  },
  gridActionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minHeight: 120,
    margin: 4,
  },
  listActionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginVertical: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  gridActionContent: {
    alignItems: 'center',
  },
  listActionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },

  // ==================== COMING SOON ====================
  comingSoonCard: {
    opacity: 0.8,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },

  // ==================== ERROR BANNER ====================
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },

  // ==================== MODAL STYLES ====================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  destructiveButton: {
    backgroundColor: '#ef4444',
  },
  destructiveButtonText: {
    color: '#ffffff',
  },

  // ==================== PLATFORM SPECIFIC ====================
  ...Platform.select({
    ios: {
      headerGradient: {
        paddingTop: 50,
      },
    },
    android: {
      headerGradient: {
        paddingTop: 35,
      },
    },
  }),
});


















// const styles = StyleSheet.create({
//   // Main Container
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
  
//   // Loading States
//   loadingContainer: {
//     paddingVertical: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     marginHorizontal: 8,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#64748b',
//     fontWeight: '500',
//   },

//   // Header Section
//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 50 : 30,
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between', // Keep this
//     paddingHorizontal: 20,
//   },
//   profileSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   profileImageContainer: {
//     position: 'relative',
//     marginRight: 12,
//   },
//   profileImage: {
//     width: 50, 
//     height: 50, 
//     borderRadius: 18, 
//     borderWidth: 3,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   profilePlaceholder: {
//     width: 50, 
//     height: 50, 
//     borderRadius: 18, 
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   initials: {
//     color: '#ffffff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     width: 10, 
//     height: 10, 
//     backgroundColor: '#10b981',
//     borderRadius: 5,
//     borderWidth: 2,
//     borderColor: '#ffffff',
//   },
//   userInfo: {
//     marginLeft: 8, 
//     marginRight: 8,
//   },
//   greeting: {
//      color: 'rgba(255, 255, 255, 0.9)',
//     fontSize: 12, 
//     fontWeight: '400',
//     marginBottom: 1,
//   },
//   userName: {
//     color: '#ffffff',
//     fontSize: 16, 
//     fontWeight: '700',
//     marginBottom: 2,
//   },
//   userDetails: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   detailText: {
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontSize: 10,
//     fontWeight: '500',
//   },
//   profileArrow: {
//     padding: 2,
//   },
//   logoutButton: {
//     padding: 12,
//     borderRadius: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },

//   // Content Area
//   content: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 20,
//   },

//   // Welcome Card
//   welcomeCard: {
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },
//   welcomeTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1e293b',
//     marginBottom: 4,
//   },
//   welcomeSubtitle: {
//     fontSize: 14,
//     color: '#64748b',
//     lineHeight: 20,
//   },

//   // Stats Container
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 24,
//     gap: 8,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//     minHeight: 80,
//     justifyContent: 'center',
//   },
//   statNumber: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1e293b',
//     marginTop: 8,
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 11,
//     color: '#64748b',
//     fontWeight: '500',
//     textAlign: 'center',
//     lineHeight: 14,
//   },

//   // Section Containers
//   sectionContainer: {
//     marginBottom: 24,
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//     paddingHorizontal: 4,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1e293b',
//   },
//   seeAllButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     backgroundColor: 'rgba(99, 102, 241, 0.1)',
//   },
//   seeAllText: {
//     color: '#6366f1',
//     fontSize: 14,
//     fontWeight: '600',
//     marginRight: 4,
//   },
//   sectionLoader: {
//     paddingVertical: 20,
//   },

//   // Slider Components
//   sliderContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   sliderArrow: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#ffffff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 4,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },
//   sliderCardContainer: {
//     flex: 1,
//   },
//   indicatorContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 16,
//     paddingHorizontal: 20,
//     // gap: 6,
//   },
  
//   enhancedItemCard: {
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     marginHorizontal: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 5,
//     overflow: 'hidden',
//   },
//   cardContent: {
//     flexDirection: 'row',
//     alignItems: 'flex-start', // Changed from 'center'
//     padding: 16,
//     minHeight: 100, // Ensure consistent height
//   },
//   cardGradient: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//   },
//   cardIconContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cardTextContent: {
//     flex: 1,
//     paddingRight: 8, // Add padding to prevent text overflow
//   },
//   enhancedItemTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1e293b',
//     marginBottom: 6,
//     lineHeight: 20,
//   },
//   enhancedItemSubtitle: {
//     fontSize: 14,
//     color: '#64748b',
//     marginBottom: 6,
//     lineHeight: 18,
//   },
//   enhancedItemTime: {
//     fontSize: 12,
//     color: '#64748b',
//     fontWeight: '500',
//   },
//   enhancedItemCategory: {
//     fontSize: 12,
//     color: '#64748b',
//     fontWeight: '500',
//   },
//   itemDetailRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//     flexWrap: 'wrap', // Allow wrapping on small screens
//   },
//   memberSeparator: {
//     color: '#cbd5e1',
//     marginHorizontal: 8,
//     fontSize: 12,
//   },
//   memberCount: {
//     fontSize: 12,
//     color: '#64748b',
//     fontWeight: '500',
//   },
//   enhancedRsvpBadge: {
//     backgroundColor: '#dcfce7',
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginLeft: 8,
//   },
//   enhancedRsvpText: {
//     color: '#10b981',
//     fontSize: 10,
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   enhancedJoinedBadge: {
//     backgroundColor: '#dcfce7',
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginLeft: 8,
//   },
//   enhancedJoinedText: {
//     color: '#10b981',
//     fontSize: 10,
//     fontWeight: '600',
//     marginLeft: 4,
//   },

//   // Carousel Styles
//   carouselContainer: {
//     position: 'relative',
//     alignItems: 'center',
//     paddingHorizontal: 40, // Add padding for nav buttons
//     marginHorizontal: -20, // Compensate for container padding
//   },
//   navButton: {
//     position: 'absolute',
//     top: '50%',
//     zIndex: 10,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     width: 36,
//     height: 36,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     transform: [{ translateY: -18 }],
//   },
  
//   prevButton: {
//     left: 8, 
//   },
  
//   nextButton: {
//     right: 8, 
//   },
//   carouselIndicators: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 16,
//     paddingHorizontal: 20,
//   },
//   indicator: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#e2e8f0',
//     marginHorizontal: 3,
//     transition: 'all 0.3s ease', // Smooth transitions
//   },
//   activeIndicator: {
//     backgroundColor: '#6366f1',
//     width: 24, // Wider active indicator
//   },



//   // Badges
//   rsvpBadge: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: '#10b981',
//     borderRadius: 6,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   },
//   rsvpText: {
//     color: '#ffffff',
//     fontSize: 10,
//     fontWeight: '600',
//   },
//   joinedBadge: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: '#6366f1',
//     borderRadius: 6,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   },
//   joinedText: {
//     color: '#ffffff',
//     fontSize: 10,
//     fontWeight: '600',
//   },

//   // Actions Section
//   actionsContainer: {
//     marginBottom: 24,
//   },
//   actionsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   viewToggle: {
//     flexDirection: 'row',
//     backgroundColor: '#f1f5f9',
//     borderRadius: 8,
//     padding: 2,
//   },
//   toggleButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   activeToggle: {
//     backgroundColor: '#6366f1',
//   },

//   // Grid and List Containers
//   gridContainer: {
//     gap: 12,
//   },
//   listContainer: {
//     gap: 8,
//   },

//   // Action Cards
//   gridActionCard: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 2,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//     minHeight: 120,
//     margin: 4,
//   },
//   listActionCard: {
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 2,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },
//   actionIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 8,
//     position: 'relative',
//   },
//   gridActionContent: {
//     alignItems: 'center',
//   },
//   listActionContent: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   actionTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#1e293b',
//     marginBottom: 4,
//     textAlign: 'center',
//   },
//   actionSubtitle: {
//     fontSize: 12,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 16,
//   },

//   // Coming Soon
//   comingSoonCard: {
//     opacity: 0.7,
//   },
//   comingSoonBadge: {
//     position: 'absolute',
//     top: -4,
//     right: -4,
//     backgroundColor: '#f59e0b',
//     borderRadius: 8,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//   },
//   comingSoonText: {
//     color: '#ffffff',
//     fontSize: 8,
//     fontWeight: '600',
//   },

//   // Empty States
//   // emptyContainer: {
//   //   alignItems: 'center',
//   //   paddingVertical: 40,
//   //   paddingHorizontal: 20,
//   // },
//   emptyContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//     paddingHorizontal: 20,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     marginHorizontal: 8,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },
//   emptyText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#64748b',
//     marginTop: 16,
//     marginBottom: 4,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#94a3b8',
//     textAlign: 'center',
//     lineHeight: 18,
//   },

//   // Error Banner
//   errorBanner: {
//     backgroundColor: '#fef2f2',
//     borderLeftWidth: 4,
//     borderLeftColor: '#ef4444',
//     padding: 12,
//     marginBottom: 16,
//     borderRadius: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   errorText: {
//     flex: 1,
//     color: '#dc2626',
//     fontSize: 14,
//     fontWeight: '500',
//   },

//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     width: '100%',
//     maxWidth: 400,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.15,
//     shadowRadius: 16,
//     elevation: 8,
//   },
//   modalHeader: {
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f1f5f9',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1e293b',
//     textAlign: 'center',
//   },
//   modalBody: {
//     padding: 20,
//   },
//   modalMessage: {
//     fontSize: 14,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     gap: 12,
//     padding: 20,
//     paddingTop: 0,
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     minHeight: 44,
//   },
//   cancelButton: {
//     backgroundColor: '#f8fafc',
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   cancelButtonText: {
//     color: '#64748b',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   confirmButton: {
//     backgroundColor: '#6366f1',
//   },
//   confirmButtonText: {
//     color: '#ffffff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   destructiveButton: {
//     backgroundColor: '#ef4444',
//   },
//   destructiveButtonText: {
//     color: '#ffffff',
//   },

//   // Additional Utility Styles
//   shadow: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   cardBorder: {
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },
//   textPrimary: {
//     color: '#1e293b',
//   },
//   textSecondary: {
//     color: '#64748b',
//   },
//   textMuted: {
//     color: '#94a3b8',
//   },
//   bottomSpacing: {
//     height: 40,
//   },
//   // Responsive adjustments
//   ...Platform.select({
//     ios: {
//       headerGradient: {
//         paddingTop: 50,
//       },
//     },
//     android: {
//       headerGradient: {
//         paddingTop: 30,
//       },
//     },
//   }),
//   logoSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   logoContainer: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 8,
//     borderWidth: 2,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   logoText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   appName: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
  
//   // Header Right Section Styles
//   headerRightSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
  
//   // Notification Bell Styles
//   notificationBell: {
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     borderRadius: 10,
//     padding: 8,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },

// });















// const styles = StyleSheet.create({
//   // Main Container
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },

//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8fafc',
//     paddingHorizontal: 20,
//   },

//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#64748b',
//     fontWeight: '500',
//     textAlign: 'center',
//   },

//   // Header Styles
//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 50 : 25,
//     paddingBottom: 20,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.12,
//     shadowRadius: 12,
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//   },

//   // Profile Section in Header
//   profileSection: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     borderRadius: 20,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },

//   profileImageContainer: {
//     position: 'relative',
//     marginRight: 14,
//   },

//   profileImage: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     borderWidth: 2,
//     borderColor: 'rgba(255, 255, 255, 0.8)',
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//   },

//   profilePlaceholder: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },

//   initials: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#ffffff',
//     letterSpacing: 0.5,
//   },

//   onlineIndicator: {
//     position: 'absolute',
//     bottom: -1,
//     right: -1,
//     width: 14,
//     height: 14,
//     backgroundColor: '#10b981',
//     borderRadius: 7,
//     borderWidth: 2,
//     borderColor: '#ffffff',
//   },

//   userInfo: {
//     flex: 1,
//     justifyContent: 'center',
//   },

//   greeting: {
//     fontSize: 12,
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontWeight: '500',
//     marginBottom: 2,
//     letterSpacing: 0.3,
//   },

//   userName: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#ffffff',
//     marginBottom: 4,
//     letterSpacing: 0.3,
//   },

//   userDetails: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//     gap: 8,
//   },

//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },

//   detailText: {
//     fontSize: 11,
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontWeight: '500',
//   },

//   profileArrow: {
//     marginLeft: 8,
//     opacity: 0.7,
//   },

//   // Logout Button
//   logoutButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },

//   // Content Area
//   content: {
//     flex: 1,
//     paddingTop: 16,
//   },

//   // Welcome Card
//   welcomeCard: {
//     backgroundColor: '#ffffff',
//     marginHorizontal: 20,
//     marginBottom: 20,
//     borderRadius: 20,
//     paddingVertical: 24,
//     paddingHorizontal: 20,
//     alignItems: 'center',
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 4,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },

//   welcomeTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1e293b',
//     textAlign: 'center',
//     marginBottom: 6,
//     letterSpacing: 0.3,
//   },

//   welcomeSubtitle: {
//     fontSize: 14,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 20,
//     opacity: 0.8,
//   },

//   // Stats Container
//   statsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     paddingHorizontal: 20,
//     marginBottom: 24,
//     gap: 12,
//   },

//   statCard: {
//     flex: 1,
//     minWidth: width * 0.26,
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     paddingVertical: 16,
//     paddingHorizontal: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },

//   statNumber: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: '#1e293b',
//     marginTop: 8,
//     marginBottom: 4,
//     letterSpacing: 0.5,
//   },

//   statLabel: {
//     fontSize: 11,
//     color: '#64748b',
//     textAlign: 'center',
//     fontWeight: '500',
//     letterSpacing: 0.2,
//   },

//   // Section Containers
//   sectionContainer: {
//     // marginBottom: 20,
//     marginTop: 200,
//     paddingHorizontal: 20,
//   },

//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16, // Changed from negative margin
//     paddingHorizontal: 0, // Removed since parent has padding
//   },

//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1e293b',
//     letterSpacing: 0.3,
//     marginBottom: -300,
//   },

//   seeAllText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#6366f1',
//     letterSpacing: 0.2,
//   },

//   sectionLoader: {
//     marginVertical: 20,
//     alignSelf: 'center',
//   },

//   // Slider Styles
//   sliderContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     paddingHorizontal: 0, // Removed padding since parent has it
//   },

//   sliderArrow: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#ffffff',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     marginHorizontal: 8, // Add horizontal margin
//   },

//   sliderCardContainer: {
//     flex: 1,
//     marginHorizontal: 8, // Reduced margin
//   },

//   // Indicator Styles - UPDATED
//   indicatorContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 8,
//     marginBottom: 4,
//     gap: 6,
//     paddingHorizontal: 0,
//   },

//   indicator: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#cbd5e1',
//     opacity: 0.5,
//   },

//   activeIndicator: {
//     backgroundColor: '#6366f1',
//     width: 20,
//     opacity: 1,
//     height: 6,
//   },

//   // Item Cards (Events & Clubs) - UPDATED
//   itemCard: {
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     padding: 16,
//     marginVertical: 0, // Removed vertical margin
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//     position: 'relative',
//     minHeight: 120, // Ensure consistent height
//   },

//   itemHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//     gap: 8,
//   },

//   itemTitle: {
//     flex: 1,
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#1e293b',
//     letterSpacing: 0.1,
//     lineHeight: 20,
//   },

//   itemSubtitle: {
//     fontSize: 13,
//     color: '#64748b',
//     lineHeight: 18,
//     marginBottom: 6,
//   },

//   itemTime: {
//     fontSize: 12,
//     color: '#8b5cf6',
//     fontWeight: '500',
//     marginBottom: 4,
//   },

//   itemCategory: {
//     fontSize: 11,
//     color: '#059669',
//     fontWeight: '600',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },

//   // Badges - UPDATED
//   rsvpBadge: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: '#dcfdf7',
//     paddingHorizontal: 6,
//     paddingVertical: 3,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: '#6ee7b7',
//   },

//   rsvpText: {
//     fontSize: 9,
//     fontWeight: '600',
//     color: '#059669',
//     letterSpacing: 0.2,
//   },

//   joinedBadge: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: '#ddd6fe',
//     paddingHorizontal: 6,
//     paddingVertical: 3,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: '#c4b5fd',
//   },

//   joinedText: {
//     fontSize: 9,
//     fontWeight: '600',
//     color: '#7c3aed',
//     letterSpacing: 0.2,
//   },

//   // Empty States - UPDATED
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 32,
//     paddingHorizontal: 20,
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//     marginHorizontal: 0, // Removed since parent has padding
//   },

//   emptyText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#64748b',
//     textAlign: 'center',
//     marginTop: 10,
//     marginBottom: 4,
//   },

//   emptySubtext: {
//     fontSize: 13,
//     color: '#94a3b8',
//     textAlign: 'center',
//     lineHeight: 18,
//     opacity: 0.8,
//   },

//   // Quick Actions
//   actionsContainer: {
//     paddingHorizontal: 20,
//     marginBottom: 20,
//   },

//   actionsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },

//   viewToggle: {
//     flexDirection: 'row',
//     backgroundColor: '#f1f5f9',
//     borderRadius: 12,
//     padding: 3,
//   },

//   toggleButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 9,
//     alignItems: 'center',
//     justifyContent: 'center',
//     minWidth: 40,
//   },

//   activeToggle: {
//     backgroundColor: '#6366f1',
//     shadowColor: '#6366f1',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 2,
//   },

//   // Grid and List Containers
//   gridContainer: {
//     gap: 12,
//   },

//   listContainer: {
//     gap: 8,
//   },

//   // Action Cards
//   gridActionCard: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//     borderRadius: 18,
//     padding: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 4,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//     minHeight: 120,
//     marginBottom: 6,
//   },

//   listActionCard: {
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//     marginBottom: 4,
//   },

//   gridActionContent: {
//     alignItems: 'center',
//     marginTop: 12,
//   },

//   listActionContent: {
//     flex: 1,
//     marginLeft: 14,
//   },

//   actionIcon: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//   },

//   actionTitle: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#1e293b',
//     textAlign: 'center',
//     marginBottom: 4,
//     letterSpacing: 0.2,
//   },

//   actionSubtitle: {
//     fontSize: 12,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 16,
//     opacity: 0.8,
//   },

//   // Coming Soon Styles
//   comingSoonCard: {
//     opacity: 0.7,
//   },

//   comingSoonBadge: {
//     position: 'absolute',
//     top: -6,
//     right: -8,
//     backgroundColor: '#f59e0b',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 8,
//     borderWidth: 2,
//     borderColor: '#ffffff',
//   },

//   comingSoonText: {
//     fontSize: 9,
//     fontWeight: '700',
//     color: '#ffffff',
//     letterSpacing: 0.3,
//   },

//   // Error Banner
//   errorBanner: {
//     backgroundColor: '#fef2f2',
//     marginHorizontal: 20,
//     marginBottom: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#fecaca',
//   },

//   errorText: {
//     flex: 1,
//     fontSize: 13,
//     color: '#dc2626',
//     fontWeight: '500',
//     marginLeft: 8,
//     marginRight: 8,
//   },

//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },

//   modalContainer: {
//     backgroundColor: '#ffffff',
//     borderRadius: 24,
//     width: '100%',
//     maxWidth: 380,
//     overflow: 'hidden',
//     shadowColor: '#1e293b',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.2,
//     shadowRadius: 25,
//     elevation: 10,
//   },

//   modalHeader: {
//     paddingHorizontal: 24,
//     paddingTop: 24,
//     paddingBottom: 8,
//   },

//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1e293b',
//     textAlign: 'center',
//     letterSpacing: 0.3,
//   },

//   modalBody: {
//     paddingHorizontal: 24,
//     paddingBottom: 24,
//   },

//   modalMessage: {
//     fontSize: 16,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 24,
//   },

//   modalFooter: {
//     flexDirection: 'row',
//     borderTopWidth: 1,
//     borderTopColor: '#f1f5f9',
//   },

//   modalButton: {
//     flex: 1,
//     paddingVertical: 18,
//     paddingHorizontal: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   cancelButton: {
//     borderRightWidth: 1,
//     borderRightColor: '#f1f5f9',
//   },

//   confirmButton: {
//     backgroundColor: 'rgba(99, 102, 241, 0.05)',
//   },

//   destructiveButton: {
//     backgroundColor: 'rgba(239, 68, 68, 0.05)',
//   },

//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#64748b',
//   },

//   confirmButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#6366f1',
//   },

//   destructiveButtonText: {
//     color: '#ef4444',
//   },
// });







// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     // backgroundColorrgba(214, 215, 218, 1)72a', // Dark slate background
//     backgroundColor: '#c7c8c9ffff', // Dark slate background
//   },
  
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#0f172a',
//   },
  
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#e2e8f0',
//     fontWeight: '500',
//   },

//   // Header Section
//   headerGradient: {
//     paddingTop: Platform.OS === 'ios' ? 50 : 30,
//     paddingBottom: 25,
//     borderBottomLeftRadius: 28,
//     borderBottomRightRadius: 28,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//   },

//   profileSection: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.12)',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     marginRight: 12,
//     backdropFilter: 'blur(10px)',
//   },

//   profileImageContainer: {
//     position: 'relative',
//     marginRight: 14,
//   },

//   profileImage: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     borderWidth: 3,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },

//   profilePlaceholder: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 3,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },

//   initials: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#ffffff',
//   },

//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#22c55e',
//     borderWidth: 2,
//     borderColor: '#ffffff',
//   },

//   userInfo: {
//     flex: 1,
//   },

//   greeting: {
//     fontSize: 14,
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontWeight: '500',
//     marginBottom: 2,
//   },

//   userName: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#ffffff',
//     marginBottom: 4,
//   },

//   userDetails: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },

//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 12,
//     marginBottom: 2,
//   },

//   detailText: {
//     fontSize: 12,
//     color: 'rgba(255, 255, 255, 0.7)',
//     marginLeft: 4,
//     fontWeight: '500',
//   },

//   profileArrow: {
//     marginLeft: 8,
//   },

//   logoutButton: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: 'rgba(255, 255, 255, 0.15)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     backdropFilter: 'blur(10px)',
//   },

//   content: {
//     flex: 2,
//     paddingHorizontal: 15,
//     paddingTop: 25,
//   },

//   // Welcome Card
//   welcomeCard: {
//     backgroundColor: '#1e293b',
//     borderRadius: 20,
//     padding: 24,
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: '#334155',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 6,
//   },

//   welcomeTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#f8fafc',
//     marginBottom: 8,
//     textAlign: 'center',
//   },

//   welcomeSubtitle: {
//     fontSize: 16,
//     color: '#94a3b8',
//     textAlign: 'center',
//     lineHeight: 22,
//     fontWeight: '500',
//   },

//   // Stats Section
//   statsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'center', // Center the cards
//     marginBottom: 28,
//     gap: 8, // Reduced from 12 to 8
//     paddingHorizontal: 4, // Add some padding
//   },

//   statCard: {
//     backgroundColor: '#1e293b',
//     borderRadius: 16,
//     padding: 14, // Slightly reduced padding
//     alignItems: 'center',
//     width: (width - 80) / 3, // Show 3 cards per row with tighter spacing
//     minWidth: 95, // Minimum width to prevent too small cards
//     maxWidth: 110, // Maximum width to keep them compact
//     borderWidth: 1,
//     borderColor: '#334155',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 4,
//     marginHorizontal: 2, // Small horizontal margin
//   },
//   statNumber: {
//     fontSize: 22, // Slightly smaller
//     fontWeight: '700',
//     color: '#60a5fa',
//     marginVertical: 6, // Reduced vertical margin
//   },

//   statLabel: {
//     fontSize: 11, // Slightly smaller
//     color: '#94a3b8',
//     textAlign: 'center',
//     fontWeight: '600',
//     lineHeight: 14, // Better line height for multi-line labels
//   },

//   // Section Containers
//   sectionContainer: {
//     marginBottom: 28,
//   },

//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//     paddingHorizontal: 4,
//   },

//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#f8fafc',
//   },

//   seeAllText: {
//     fontSize: 14,
//     color: '#60a5fa',
//     fontWeight: '600',
//   },

//   sectionLoader: {
//     paddingVertical: 20,
//   },

//   // Item Cards
//   itemCard: {
//     backgroundColor: '#1e293b',
//     borderRadius: 16,
//     padding: 16,
//     marginRight: 16,
//     width: 200,
//     borderWidth: 1,
//     borderColor: '#334155',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 4,
//   },

//   itemHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },

//   itemTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#f8fafc',
//     marginLeft: 8,
//     flex: 1,
//   },

//   itemSubtitle: {
//     fontSize: 14,
//     color: '#94a3b8',
//     marginBottom: 8,
//     lineHeight: 20,
//   },

//   itemTime: {
//     fontSize: 12,
//     color: '#64748b',
//     fontWeight: '500',
//   },

//   itemCategory: {
//     fontSize: 12,
//     color: '#60a5fa',
//     fontWeight: '600',
//     marginTop: 4,
//   },

//   // Badges
//   rsvpBadge: {
//     backgroundColor: '#22c55e',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     alignSelf: 'flex-start',
//     marginTop: 8,
//   },

//   rsvpText: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#ffffff',
//   },

//   joinedBadge: {
//     backgroundColor: '#60a5fa',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     alignSelf: 'flex-start',
//     marginTop: 8,
//   },

//   joinedText: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#ffffff',
//   },

//   comingSoonBadge: {
//     position: 'absolute',
//     top: -4,
//     right: -4,
//     backgroundColor: '#f59e0b',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 8,
//   },

//   comingSoonText: {
//     fontSize: 8,
//     fontWeight: '700',
//     color: '#ffffff',
//   },

//   // Quick Actions
//   actionsContainer: {
//     marginBottom: 24,
//   },

//   actionsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//     paddingHorizontal: 4,
//   },

//   viewToggle: {
//     flexDirection: 'row',
//     backgroundColor: '#1e293b',
//     borderRadius: 12,
//     padding: 4,
//     borderWidth: 1,
//     borderColor: '#334155',
//   },

//   toggleButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },

//   activeToggle: {
//     backgroundColor: '#60a5fa',
//   },

//   gridContainer: {
//     gap: 12,
//   },

//   listContainer: {
//     gap: 8,
//   },

//   gridActionCard: {
//     backgroundColor: '#1e293b',
//     borderRadius: 18,
//     padding: 20,
//     flex: 1,
//     margin: 4,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#334155',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.12,
//     shadowRadius: 6,
//     elevation: 5,
//   },

//   listActionCard: {
//     backgroundColor: '#1e293b',
//     borderRadius: 16,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 4,
//     borderWidth: 1,
//     borderColor: '#334155',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 4,
//   },

//   comingSoonCard: {
//     opacity: 0.7,
//   },

//   actionIcon: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 12,
//     position: 'relative',
//   },

//   gridActionContent: {
//     alignItems: 'center',
//     flex: 1,
//   },

//   listActionContent: {
//     flex: 1,
//     marginLeft: 16,
//   },

//   actionTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#f8fafc',
//     marginBottom: 4,
//     textAlign: 'center',
//   },

//   actionSubtitle: {
//     fontSize: 13,
//     color: '#94a3b8',
//     textAlign: 'center',
//     lineHeight: 18,
//     fontWeight: '500',
//   },

//   // Empty States
//   emptyContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//     paddingHorizontal: 20,
//   },

//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#64748b',
//     marginTop: 16,
//     marginBottom: 8,
//   },

//   emptySubtext: {
//     fontSize: 14,
//     color: '#475569',
//     textAlign: 'center',
//     lineHeight: 20,
//   },

//   // Error Banner
//   errorBanner: {
//     backgroundColor: '#dc2626',
//     borderRadius: 12,
//     padding: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 4,
//   },

//   errorText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#ffffff',
//     marginLeft: 8,
//     fontWeight: '500',
//   },

//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },

//   modalContainer: {
//     backgroundColor: '#1e293b',
//     borderRadius: 20,
//     width: '100%',
//     maxWidth: 400,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#334155',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     elevation: 10,
//   },

//   modalHeader: {
//     padding: 24,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#334155',
//   },

//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#f8fafc',
//     textAlign: 'center',
//   },

//   modalBody: {
//     padding: 24,
//     paddingTop: 16,
//     paddingBottom: 24,
//   },

//   modalMessage: {
//     fontSize: 16,
//     color: '#94a3b8',
//     textAlign: 'center',
//     lineHeight: 24,
//     fontWeight: '500',
//   },

//   modalFooter: {
//     flexDirection: 'row',
//     borderTopWidth: 1,
//     borderTopColor: '#334155',
//   },

//   modalButton: {
//     flex: 1,
//     paddingVertical: 18,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   cancelButton: {
//     borderRightWidth: 1,
//     borderRightColor: '#334155',
//     backgroundColor: '#374151',
//   },

//   confirmButton: {
//     backgroundColor: '#60a5fa',
//   },

//   destructiveButton: {
//     backgroundColor: '#dc2626',
//   },

//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#d1d5db',
//   },

//   confirmButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#ffffff',
//   },

//   destructiveButtonText: {
//     color: '#ffffff',
//   },
//   sliderContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 10,
//     marginVertical: 10,
//   },
  
//   sliderArrow: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#f8fafc',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
  
//   sliderCardContainer: {
//     flex: 1,
//     marginHorizontal: 15,
//   },
  
//   indicatorContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 15,
//     gap: 8,
//   },
  
//   indicator: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#cbd5e1',
//   },
  
//   activeIndicator: {
//     backgroundColor: '#6366f1',
//     width: 20,
//   },
// });
















// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#eadcdcc6',
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
//     color: '#64748b',
//     fontWeight: '500',
//   },
//   headerGradient: {
//     paddingTop: 50,
//     paddingBottom: 20,
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
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 3,
//     borderColor: 'rgba(255,255,255,0.3)',
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
//     backgroundColor: '#10b981',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   userInfo: {
//     flex: 1,
//     marginLeft: 16,
//   },
//   greeting: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     fontWeight: '400',
//   },
//   userName: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginTop: 2,
//   },
//   userDetails: {
//     flexDirection: 'row',
//     marginTop: 4,
//     flexWrap: 'wrap',
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 12,
//     marginTop: 2,
//   },
//   detailText: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.8)',
//     marginLeft: 4,
//   },
//   profileArrow: {
//     marginLeft: 8,
//   },
//   logoutButton: {
//     padding: 12,
//     borderRadius: 12,
//     backgroundColor: 'rgba(255,255,255,0.1)',
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 20,
//   },
//   errorBanner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fef2f2',
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 16,
//     borderLeftWidth: 4,
//     borderLeftColor: '#ef4444',
//   },
//   errorText: {
//     flex: 1,
//     color: '#ef4444',
//     fontSize: 14,
//     marginLeft: 8,
//   },
//   welcomeCard: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 16,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   welcomeTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#1e293b',
//     marginBottom: 4,
//   },
//   welcomeSubtitle: {
//     fontSize: 16,
//     color: '#64748b',
//     lineHeight: 22,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 24,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginHorizontal: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   statNumber: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#1e293b',
//     marginTop: 8,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#64748b',
//     marginTop: 4,
//     textAlign: 'center',
//   },
//   sectionContainer: {
//     marginBottom: 24,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#1e293b',
//   },
//   seeAllText: {
//     fontSize: 14,
//     color: '#6366f1',
//     fontWeight: '600',
//   },
//   sectionLoader: {
//     paddingVertical: 20,
//   },
//   itemCard: {
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 12,
//     marginRight: 12,
//     width: width * 0.7,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//     position: 'relative',
//   },
//   itemHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   itemTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1e293b',
//     marginLeft: 8,
//     flex: 1,
//   },
//   itemSubtitle: {
//     fontSize: 14,
//     color: '#64748b',
//     marginBottom: 8,
//     lineHeight: 20,
//   },
//   itemTime: {
//     fontSize: 12,
//     color: '#6366f1',
//     fontWeight: '500',
//   },
//   itemCategory: {
//     fontSize: 12,
//     color: '#8b5cf6',
//     fontWeight: '500',
//   },
//   rsvpBadge: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: '#10b981',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   rsvpText: {
//     fontSize: 10,
//     color: '#fff',
//     fontWeight: '600',
//   },
//   joinedBadge: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: '#6366f1',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   joinedText: {
//     fontSize: 10,
//     color: '#fff',
//     fontWeight: '600',
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#64748b',
//     marginTop: 12,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#94a3b8',
//     marginTop: 4,
//   },
//   actionsContainer: {
//     marginBottom: 40,
//   },
//   actionsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   viewToggle: {
//     flexDirection: 'row',
//     backgroundColor: '#f1f5f9',
//     borderRadius: 8,
//     padding: 2,
//   },
//   toggleButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   activeToggle: {
//     backgroundColor: '#6366f1',
//   },
//   gridContainer: {
//     paddingVertical: 8,
//   },
//   listContainer: {
//     paddingVertical: 8,
//   },
//   gridActionCard: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 12,
//     margin: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//     minHeight: 120,
//   },
//   listActionCard: {
//     backgroundColor: '#fff',
//     padding: 16,
//     borderRadius: 12,
//     marginVertical: 4,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   gridActionContent: {
//     marginTop: 12,
//   },
//   listActionContent: {
//     flex: 1,
//     marginLeft: 16,
//   },
//   actionIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//     position: 'relative',
//   },
//   comingSoonCard: {
//     opacity: 0.7,
//   },
//   comingSoonBadge: {
//     position: 'absolute',
//     top: -4,
//     right: -4,
//     backgroundColor: '#f59e0b',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 8,
//   },
//   comingSoonText: {
//     fontSize: 8,
//     color: '#fff',
//     fontWeight: '600',
//   },
//   actionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1e293b',
//     marginBottom: 4,
//   },
//   actionSubtitle: {
//     fontSize: 13,
//     color: '#64748b',
//     lineHeight: 18,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     width: '100%',
//     maxWidth: 400,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.25,
//     shadowRadius: 16,
//     elevation: 10,
//   },
//   modalHeader: {
//     paddingHorizontal: 24,
//     paddingTop: 24,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f1f5f9',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#1f2937',
//     textAlign: 'center',
//   },
//   modalBody: {
//     paddingHorizontal: 24,
//     paddingVertical: 20,
//   },
//   modalMessage: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     paddingHorizontal: 24,
//     paddingBottom: 24,
//     paddingTop: 16,
//     gap: 12,
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cancelButton: {
//     backgroundColor: '#f8fafc',
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   confirmButton: {
//     backgroundColor: '#667eea',
//   },
//   destructiveButton: {
//     backgroundColor: '#ef4444',
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#64748b',
//   },
//   confirmButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   destructiveButtonText: {
//     color: '#fff',
//   },


// });

