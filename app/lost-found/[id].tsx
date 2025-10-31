
// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Share,
//   Dimensions,
//   ActivityIndicator,
//   SafeAreaView
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import Icon from 'react-native-vector-icons/Ionicons';
// import { useRouter, useLocalSearchParams } from 'expo-router';

// const { width } = Dimensions.get('window');

// const LostFoundDetail = () => {
//   const router = useRouter();
//   const params = useLocalSearchParams();
  
//   // Extract ID from route parameters
//   const getItemId = () => {
//     // For expo-router dynamic routes like /lost-found/[id]/
//     if (params.id) return params.id;
    
//     // Alternative parameter names
//     if (params.itemId) return params.itemId;
    
//     // Check if it's in a nested object
//     if (params.item && typeof params.item === 'object') {
//       return params.item.id;
//     }
    
//     // If params.item is a JSON string, parse it
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

//   const id = getItemId();
//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [imageLoading, setImageLoading] = useState(true);
//   const [isFavorite, setIsFavorite] = useState(false);
//   const [error, setError] = useState(null);

//   // Debug logging
//   useEffect(() => {
//     console.log('Expo Router params:', JSON.stringify(params, null, 2));
//     console.log('Extracted ID:', id);
//     console.log('ID type:', typeof id);
//   }, [params]);

//   useEffect(() => {
//     if (id) {
//       fetchItemDetails();
//       checkFavoriteStatus();
//     } else {
//       setLoading(false);
//       setError('No valid ID found in route parameters');
//       console.error('Available params:', Object.keys(params));
//     }
//   }, [id]);

//   const fetchItemDetails = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }
      
//       const formattedId = String(id).trim();
//       console.log('Fetching item with ID:', formattedId);
      
//       // const response = await axios.get(`http://127.0.0.1:8000/api/lost-found/${formattedId}/`, {
//       // const response = await axios.get(`http://192.168.220.16:8000/api/lost-found/${formattedId}/`, {
//       const response = await axios.get(`http://192.168.130.16:8000/api/lost-found/${formattedId}/`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       if (response.data) {
//         setItem(response.data);
//       } else {
//         throw new Error('No data received from server');
//       }
//     } catch (error) {
//       console.error('Error fetching item:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to load item details';
//       setError(errorMessage);
      
//       Alert.alert(
//         'Error', 
//         errorMessage + '. Please try again.',
//         [
//           { text: 'Retry', onPress: fetchItemDetails },
//           { text: 'Go Back', onPress: () => router.back() }
//         ]
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkFavoriteStatus = async () => {
//     try {
//       const favorites = await AsyncStorage.getItem('favorites');
//       if (favorites) {
//         const favArray = JSON.parse(favorites);
//         setIsFavorite(favArray.some(favId => String(favId) === String(id)));
//       }
//     } catch (error) {
//       console.error('Error checking favorite status:', error);
//     }
//   };

//   const toggleFavorite = async () => {
//     try {
//       const favorites = await AsyncStorage.getItem('favorites');
//       let favArray = favorites ? JSON.parse(favorites) : [];
      
//       const stringId = String(id);
//       const isCurrentlyFavorite = favArray.some(favId => String(favId) === stringId);
      
//       if (isCurrentlyFavorite) {
//         favArray = favArray.filter(favId => String(favId) !== stringId);
//       } else {
//         favArray.push(id);
//       }
      
//       await AsyncStorage.setItem('favorites', JSON.stringify(favArray));
//       setIsFavorite(!isCurrentlyFavorite);
//     } catch (error) {
//       console.error('Error toggling favorite:', error);
//     }
//   };

//   const handleShare = async () => {
//     if (!item) return;
    
//     try {
//       const shareContent = {
//         message: `${item.title}\n\nStatus: ${item.status}\nLocation: ${item.location}\nDate: ${item.date}\n\n${item.description}`,
//         title: item.title,
//       };
//       await Share.share(shareContent);
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   const handleContact = () => {
//     if (!item) return;
    
//     Alert.alert(
//       'Contact Owner',
//       `Would you like to contact ${item.owner}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Message', onPress: () => console.log('Open messaging') },
//         { text: 'Call', onPress: () => console.log('Make call') }
//       ]
//     );

//   };


//   const formatDate = (dateString) => {
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       });
//     } catch (error) {
//       return dateString;
//     }
//   };

//   const getStatusColor = (status) => {
//     return status?.toLowerCase() === 'lost' ? '#ff6b6b' : '#4ecdc4';
//   };

//   const getStatusIcon = (status) => {
//     return status?.toLowerCase() === 'lost' ? 'search-outline' : 'checkmark-circle-outline';
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#4ecdc4" />
//         <Text style={styles.loadingText}>Loading item details...</Text>
//       </SafeAreaView>
//     );
//   }

//   // Error states
//   if (!id) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <Icon name="alert-circle-outline" size={64} color="#ff6b6b" />
//         <Text style={styles.errorText}>Invalid item ID</Text>
//         <Text style={styles.errorSubtext}>
//           Available params: {Object.keys(params).join(', ') || 'none'}
//         </Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
//           <Text style={styles.retryButtonText}>Go Back</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   if (error || !item) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <Icon name="alert-circle-outline" size={64} color="#ff6b6b" />
//         <Text style={styles.errorText}>
//           {error || 'Item not found'}
//         </Text>
//         <Text style={styles.errorSubtext}>
//           ID: {id}
//         </Text>
//         <View style={styles.errorActions}>
//           <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetails}>
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={[styles.retryButton, styles.secondaryButton]} 
//             onPress={() => router.back()}
//           >
//             <Text style={[styles.retryButtonText, styles.secondaryButtonText]}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView showsVerticalScrollIndicator={false}>
//         {/* Header with actions */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => router.push('/lost-found/lost-and-found')} style={styles.backButton}>
//             <Icon name="arrow-back" size={24} color="#333" />
//           </TouchableOpacity>
//           <View style={styles.headerActions}>
//             <TouchableOpacity onPress={toggleFavorite} style={styles.actionButton}>
//               <Icon 
//                 name={isFavorite ? "heart" : "heart-outline"} 
//                 size={24} 
//                 color={isFavorite ? "#ff6b6b" : "#666"} 
//               />
//             </TouchableOpacity>
//             <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
//               <Icon name="share-outline" size={24} color="#666" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Image */}
//         {item.image && (
//           <View style={styles.imageContainer}>
//             <Image 
//               source={{ uri: item.image }} 
//               style={styles.image}
//               onLoadStart={() => setImageLoading(true)}
//               onLoadEnd={() => setImageLoading(false)}
//             />
//             {imageLoading && (
//               <View style={styles.imageLoader}>
//                 <ActivityIndicator size="large" color="#4ecdc4" />
//               </View>
//             )}
//           </View>
//         )}

//         {/* Content */}
//         <View style={styles.content}>
//           {/* Status Badge */}
//           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
//             <Icon 
//               name={getStatusIcon(item.status)} 
//               size={16} 
//               color="white" 
//               style={styles.statusIcon} 
//             />
//             <Text style={styles.statusText}>{item.status?.toUpperCase() || 'UNKNOWN'}</Text>
//           </View>

//           {/* Title */}
//           <Text style={styles.title}>{item.title || 'Untitled Item'}</Text>

//           {/* Description */}
//           <Text style={styles.description}>{item.description || 'No description available'}</Text>

//           {/* Details Section */}
//           <View style={styles.detailsSection}>
//             <Text style={styles.sectionTitle}>Details</Text>
            
//             <View style={styles.detailItem}>
//               <Icon name="location-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>{item.location || 'Location not specified'}</Text>
//             </View>

//             <View style={styles.detailItem}>
//               <Icon name="calendar-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>{item.date ? formatDate(item.date) : 'Date not specified'}</Text>
//             </View>

//             <View style={styles.detailItem}>
//               <Icon name="person-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>Posted by {item.owner || 'Unknown'}</Text>
//             </View>
//           </View>

//           {/* Contact Button */}
//           <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
//             <Icon name="chatbubble-outline" size={20} color="white" />
//             <Text style={styles.contactButtonText}>Contact Owner</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };







































import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ConnectionAPI from '../api/connectionService'; // Adjust path as needed

const { width } = Dimensions.get('window');

const LostFoundDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Extract ID from route parameters
  const getItemId = () => {
    // For expo-router dynamic routes like /lost-found/[id]/
    if (params.id) return params.id;
    
    // Alternative parameter names
    if (params.itemId) return params.itemId;
    
    // Check if it's in a nested object
    if (params.item && typeof params.item === 'object') {
      return params.item.id;
    }
    
    // If params.item is a JSON string, parse it
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

  const id = getItemId();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('Expo Router params:', JSON.stringify(params, null, 2));
    console.log('Extracted ID:', id);
    console.log('ID type:', typeof id);
  }, [params]);

  useEffect(() => {
    if (id) {
      fetchItemDetails();
      checkFavoriteStatus();
    } else {
      setLoading(false);
      setError('No valid ID found in route parameters');
      console.error('Available params:', Object.keys(params));
    }
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const formattedId = String(id).trim();
      console.log('Fetching item with ID:', formattedId);
      
      const response = await ConnectionAPI.getLostFoundItemById(formattedId);
      
      if (response) {
        setItem(response);
      } else {
        throw new Error('No data received from server');
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load item details';
      setError(errorMessage);
      
      Alert.alert(
        'Error', 
        errorMessage + '. Please try again.',
        [
          { text: 'Retry', onPress: fetchItemDetails },
          { text: 'Go Back', onPress: () => router.back() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      if (favorites) {
        const favArray = JSON.parse(favorites);
        setIsFavorite(favArray.some(favId => String(favId) === String(id)));
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      let favArray = favorites ? JSON.parse(favorites) : [];
      
      const stringId = String(id);
      const isCurrentlyFavorite = favArray.some(favId => String(favId) === stringId);
      
      if (isCurrentlyFavorite) {
        favArray = favArray.filter(favId => String(favId) !== stringId);
      } else {
        favArray.push(id);
      }
      
      await AsyncStorage.setItem('favorites', JSON.stringify(favArray));
      setIsFavorite(!isCurrentlyFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = async () => {
    if (!item) return;
    
    try {
      const shareContent = {
        message: `${item.title}\n\nStatus: ${item.status}\nLocation: ${item.location}\nDate: ${item.date}\n\n${item.description}`,
        title: item.title,
      };
      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleContact = () => {
    if (!item) return;
    
    Alert.alert(
      'Contact Owner',
      `Would you like to contact ${item.owner}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Message', onPress: () => console.log('Open messaging') },
        { text: 'Call', onPress: () => console.log('Make call') }
      ]
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    return status?.toLowerCase() === 'lost' ? '#ff6b6b' : '#4ecdc4';
  };

  const getStatusIcon = (status) => {
    return status?.toLowerCase() === 'lost' ? 'search-outline' : 'checkmark-circle-outline';
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ecdc4" />
        <Text style={styles.loadingText}>Loading item details...</Text>
      </SafeAreaView>
    );
  }

  // Error states
  if (!id) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>Invalid item ID</Text>
        <Text style={styles.errorSubtext}>
          Available params: {Object.keys(params).join(', ') || 'none'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>
          {error || 'Item not found'}
        </Text>
        <Text style={styles.errorSubtext}>
          ID: {id}
        </Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.retryButton, styles.secondaryButton]} 
            onPress={() => router.back()}
          >
            <Text style={[styles.retryButtonText, styles.secondaryButtonText]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with actions */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/lost-found/lost-and-found')} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleFavorite} style={styles.actionButton}>
              <Icon 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#ff6b6b" : "#666"} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
              <Icon name="share-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image */}
        {item.image && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.image }} 
              style={styles.image}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {imageLoading && (
              <View style={styles.imageLoader}>
                <ActivityIndicator size="large" color="#4ecdc4" />
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Icon 
              name={getStatusIcon(item.status)} 
              size={16} 
              color="white" 
              style={styles.statusIcon} 
            />
            <Text style={styles.statusText}>{item.status?.toUpperCase() || 'UNKNOWN'}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{item.title || 'Untitled Item'}</Text>

          {/* Description */}
          <Text style={styles.description}>{item.description || 'No description available'}</Text>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.detailItem}>
              <Icon name="location-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{item.location || 'Location not specified'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Icon name="calendar-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{item.date ? formatDate(item.date) : 'Date not specified'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Icon name="person-outline" size={20} color="#666" />
              <Text style={styles.detailText}>Posted by {item.owner || 'Unknown'}</Text>
            </View>
          </View>

          {/* Contact Button */}
          <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
            <Icon name="chatbubble-outline" size={20} color="white" />
            <Text style={styles.contactButtonText}>Contact Owner</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4ecdc4',
  },
  secondaryButtonText: {
    color: '#4ecdc4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: width,
    height: 300,
    backgroundColor: '#e9ecef',
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
  },
  content: {
    padding: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  contactButton: {
    backgroundColor: '#4ecdc4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#4ecdc4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default LostFoundDetail;
































































// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Share,
//   Dimensions,
//   ActivityIndicator,
//   SafeAreaView
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import Icon from 'react-native-vector-icons/Ionicons';

// const { width } = Dimensions.get('window');

// const LostFoundDetail = ({ route, navigation }) => {
//   // Enhanced ID extraction with multiple fallback options
//   const getItemId = () => {
//     // Method 1: Standard route params
//     if (route?.params?.id) return route.params.id;
    
//     // Method 2: Check for itemId (alternative param name)
//     if (route?.params?.itemId) return route.params.itemId;
    
//     // Method 3: Check for item object with id property
//     if (route?.params?.item?.id) return route.params.item.id;
    
//     // Method 4: Check for direct id in route params (string conversion)
//     if (route?.params && Object.keys(route.params).length > 0) {
//       const params = route.params;
//       // Look for any numeric value that could be an ID
//       for (const key in params) {
//         if (key.toLowerCase().includes('id') && params[key]) {
//           return params[key];
//         }
//       }
//     }
    
//     return null;
//   };

//   const id = getItemId();
//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [imageLoading, setImageLoading] = useState(true);
//   const [isFavorite, setIsFavorite] = useState(false);
//   const [error, setError] = useState(null);

//   // Debug logging to help identify the issue
//   useEffect(() => {
//     console.log('Route params:', JSON.stringify(route?.params, null, 2));
//     console.log('Extracted ID:', id);
//     console.log('ID type:', typeof id);
//   }, []);

//   useEffect(() => {
//     if (id) {
//       fetchItemDetails();
//       checkFavoriteStatus();
//     } else {
//       setLoading(false);
//       setError('No valid ID found in navigation parameters');
//       console.error('Route params debug:', {
//         hasRoute: !!route,
//         hasParams: !!route?.params,
//         params: route?.params,
//         allKeys: route?.params ? Object.keys(route.params) : []
//       });
//     }
//   }, [id]);

//   const fetchItemDetails = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       // Ensure ID is properly formatted for the API call
//       const formattedId = String(id).trim();
//       console.log('Fetching item with ID:', formattedId);
      
//       const response = await axios.get(`/lost-found/${formattedId}/`);
      
//       if (response.data) {
//         setItem(response.data);
//       } else {
//         throw new Error('No data received from server');
//       }
//     } catch (error) {
//       console.error('Error fetching item:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to load item details';
//       setError(errorMessage);
      
//       Alert.alert(
//         'Error', 
//         errorMessage + '. Please try again.',
//         [
//           { text: 'Retry', onPress: fetchItemDetails },
//           { text: 'Go Back', onPress: () => navigation?.goBack() }
//         ]
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkFavoriteStatus = async () => {
//     try {
//       const favorites = await AsyncStorage.getItem('favorites');
//       if (favorites) {
//         const favArray = JSON.parse(favorites);
//         // Convert both to strings for comparison to handle type mismatches
//         setIsFavorite(favArray.some(favId => String(favId) === String(id)));
//       }
//     } catch (error) {
//       console.error('Error checking favorite status:', error);
//     }
//   };

//   const toggleFavorite = async () => {
//     try {
//       const favorites = await AsyncStorage.getItem('favorites');
//       let favArray = favorites ? JSON.parse(favorites) : [];
      
//       // Convert to strings for consistent comparison
//       const stringId = String(id);
//       const isCurrentlyFavorite = favArray.some(favId => String(favId) === stringId);
      
//       if (isCurrentlyFavorite) {
//         favArray = favArray.filter(favId => String(favId) !== stringId);
//       } else {
//         favArray.push(id); // Keep original type
//       }
      
//       await AsyncStorage.setItem('favorites', JSON.stringify(favArray));
//       setIsFavorite(!isCurrentlyFavorite);
//     } catch (error) {
//       console.error('Error toggling favorite:', error);
//     }
//   };

//   const handleShare = async () => {
//     if (!item) return;
    
//     try {
//       const shareContent = {
//         message: `${item.title}\n\nStatus: ${item.status}\nLocation: ${item.location}\nDate: ${item.date}\n\n${item.description}`,
//         title: item.title,
//       };
//       await Share.share(shareContent);
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   const handleContact = () => {
//     if (!item) return;
    
//     Alert.alert(
//       'Contact Owner',
//       `Would you like to contact ${item.owner}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Message', onPress: () => console.log('Open messaging') },
//         { text: 'Call', onPress: () => console.log('Make call') }
//       ]
//     );
//   };

//   const formatDate = (dateString) => {
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       });
//     } catch (error) {
//       return dateString; // Return original if parsing fails
//     }
//   };

//   const getStatusColor = (status) => {
//     return status?.toLowerCase() === 'lost' ? '#ff6b6b' : '#4ecdc4';
//   };

//   const getStatusIcon = (status) => {
//     return status?.toLowerCase() === 'lost' ? 'search-outline' : 'checkmark-circle-outline';
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#4ecdc4" />
//         <Text style={styles.loadingText}>Loading item details...</Text>
//       </SafeAreaView>
//     );
//   }

//   // Error states
//   if (!id) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <Icon name="alert-circle-outline" size={64} color="#ff6b6b" />
//         <Text style={styles.errorText}>Invalid item ID</Text>
//         <Text style={styles.errorSubtext}>
//           No valid ID found in navigation parameters
//         </Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => navigation?.goBack()}>
//           <Text style={styles.retryButtonText}>Go Back</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   if (error || !item) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <Icon name="alert-circle-outline" size={64} color="#ff6b6b" />
//         <Text style={styles.errorText}>
//           {error || 'Item not found'}
//         </Text>
//         <Text style={styles.errorSubtext}>
//           ID: {id}
//         </Text>
//         <View style={styles.errorActions}>
//           <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetails}>
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={[styles.retryButton, styles.secondaryButton]} 
//             onPress={() => navigation?.goBack()}
//           >
//             <Text style={[styles.retryButtonText, styles.secondaryButtonText]}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView showsVerticalScrollIndicator={false}>
//         {/* Header with actions */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
//             <Icon name="arrow-back" size={24} color="#333" />
//           </TouchableOpacity>
//           <View style={styles.headerActions}>
//             <TouchableOpacity onPress={toggleFavorite} style={styles.actionButton}>
//               <Icon 
//                 name={isFavorite ? "heart" : "heart-outline"} 
//                 size={24} 
//                 color={isFavorite ? "#ff6b6b" : "#666"} 
//               />
//             </TouchableOpacity>
//             <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
//               <Icon name="share-outline" size={24} color="#666" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Image */}
//         {item.image && (
//           <View style={styles.imageContainer}>
//             <Image 
//               source={{ uri: item.image }} 
//               style={styles.image}
//               onLoadStart={() => setImageLoading(true)}
//               onLoadEnd={() => setImageLoading(false)}
//             />
//             {imageLoading && (
//               <View style={styles.imageLoader}>
//                 <ActivityIndicator size="large" color="#4ecdc4" />
//               </View>
//             )}
//           </View>
//         )}

//         {/* Content */}
//         <View style={styles.content}>
//           {/* Status Badge */}
//           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
//             <Icon 
//               name={getStatusIcon(item.status)} 
//               size={16} 
//               color="white" 
//               style={styles.statusIcon} 
//             />
//             <Text style={styles.statusText}>{item.status?.toUpperCase() || 'UNKNOWN'}</Text>
//           </View>

//           {/* Title */}
//           <Text style={styles.title}>{item.title || 'Untitled Item'}</Text>

//           {/* Description */}
//           <Text style={styles.description}>{item.description || 'No description available'}</Text>

//           {/* Details Section */}
//           <View style={styles.detailsSection}>
//             <Text style={styles.sectionTitle}>Details</Text>
            
//             <View style={styles.detailItem}>
//               <Icon name="location-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>{item.location || 'Location not specified'}</Text>
//             </View>

//             <View style={styles.detailItem}>
//               <Icon name="calendar-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>{item.date ? formatDate(item.date) : 'Date not specified'}</Text>
//             </View>

//             <View style={styles.detailItem}>
//               <Icon name="person-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>Posted by {item.owner || 'Unknown'}</Text>
//             </View>
//           </View>

//           {/* Contact Button */}
//           <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
//             <Icon name="chatbubble-outline" size={20} color="white" />
//             <Text style={styles.contactButtonText}>Contact Owner</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     padding: 20,
//   },
//   errorText: {
//     fontSize: 18,
//     color: '#666',
//     marginTop: 16,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   errorSubtext: {
//     fontSize: 14,
//     color: '#999',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   errorActions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   retryButton: {
//     backgroundColor: '#4ecdc4',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 25,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   secondaryButton: {
//     backgroundColor: 'transparent',
//     borderWidth: 2,
//     borderColor: '#4ecdc4',
//   },
//   secondaryButtonText: {
//     color: '#4ecdc4',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerActions: {
//     flexDirection: 'row',
//   },
//   actionButton: {
//     padding: 8,
//     marginLeft: 8,
//   },
//   imageContainer: {
//     position: 'relative',
//   },
//   image: {
//     width: width,
//     height: 300,
//     backgroundColor: '#e9ecef',
//   },
//   imageLoader: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(248, 249, 250, 0.8)',
//   },
//   content: {
//     padding: 20,
//     backgroundColor: 'white',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     marginTop: -20,
//   },
//   statusBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-start',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     marginBottom: 16,
//   },
//   statusIcon: {
//     marginRight: 6,
//   },
//   statusText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#2c3e50',
//     marginBottom: 16,
//     lineHeight: 34,
//   },
//   description: {
//     fontSize: 16,
//     color: '#555',
//     lineHeight: 24,
//     marginBottom: 24,
//   },
//   detailsSection: {
//     marginBottom: 30,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 16,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f1f3f4',
//   },
//   detailText: {
//     fontSize: 16,
//     color: '#666',
//     marginLeft: 12,
//     flex: 1,
//   },
//   contactButton: {
//     backgroundColor: '#4ecdc4',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     shadowColor: '#4ecdc4',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   contactButtonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
// });

// export default LostFoundDetail;


























































// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Share,
//   Dimensions,
//   ActivityIndicator,
//   SafeAreaView
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import Icon from 'react-native-vector-icons/Ionicons';

// const { width } = Dimensions.get('window');

// const LostFoundDetail = ({ route, navigation }) => {
//   // Add safety check for route and params
//   const id = route?.params?.id;
//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [imageLoading, setImageLoading] = useState(true);
//   const [isFavorite, setIsFavorite] = useState(false);

//   useEffect(() => {
//     // Only fetch if id exists
//     if (id) {
//       fetchItemDetails();
//       checkFavoriteStatus();
//     } else {
//       setLoading(false);
//       console.error('No ID provided in route params');
//     }
//   }, [id]);

//   const fetchItemDetails = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`/lost-found/${id}/`);
//       setItem(response.data);
//     } catch (error) {
//       console.error('Error fetching item:', error);
//       Alert.alert('Error', 'Failed to load item details. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkFavoriteStatus = async () => {
//     try {
//       const favorites = await AsyncStorage.getItem('favorites');
//       if (favorites) {
//         const favArray = JSON.parse(favorites);
//         setIsFavorite(favArray.includes(id));
//       }
//     } catch (error) {
//       console.error('Error checking favorite status:', error);
//     }
//   };

//   const toggleFavorite = async () => {
//     try {
//       const favorites = await AsyncStorage.getItem('favorites');
//       let favArray = favorites ? JSON.parse(favorites) : [];
      
//       if (isFavorite) {
//         favArray = favArray.filter(favId => favId !== id);
//       } else {
//         favArray.push(id);
//       }
      
//       await AsyncStorage.setItem('favorites', JSON.stringify(favArray));
//       setIsFavorite(!isFavorite);
//     } catch (error) {
//       console.error('Error toggling favorite:', error);
//     }
//   };

//   const handleShare = async () => {
//     try {
//       const shareContent = {
//         message: `${item.title}\n\nStatus: ${item.status}\nLocation: ${item.location}\nDate: ${item.date}\n\n${item.description}`,
//         title: item.title,
//       };
//       await Share.share(shareContent);
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   const handleContact = () => {
//     Alert.alert(
//       'Contact Owner',
//       `Would you like to contact ${item.owner}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Message', onPress: () => console.log('Open messaging') },
//         { text: 'Call', onPress: () => console.log('Make call') }
//       ]
//     );
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const getStatusColor = (status) => {
//     return status.toLowerCase() === 'lost' ? '#ff6b6b' : '#4ecdc4';
//   };

//   const getStatusIcon = (status) => {
//     return status.toLowerCase() === 'lost' ? 'search-outline' : 'checkmark-circle-outline';
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#4ecdc4" />
//         <Text style={styles.loadingText}>Loading item details...</Text>
//       </SafeAreaView>
//     );
//   }

//   if (!id) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <Icon name="alert-circle-outline" size={64} color="#ff6b6b" />
//         <Text style={styles.errorText}>Invalid item ID</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => navigation?.goBack()}>
//           <Text style={styles.retryButtonText}>Go Back</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   if (!item) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <Icon name="alert-circle-outline" size={64} color="#ff6b6b" />
//         <Text style={styles.errorText}>Item not found</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetails}>
//           <Text style={styles.retryButtonText}>Retry</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView showsVerticalScrollIndicator={false}>
//         {/* Header with actions */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
//             <Icon name="arrow-back" size={24} color="#333" />
//           </TouchableOpacity>
//           <View style={styles.headerActions}>
//             <TouchableOpacity onPress={toggleFavorite} style={styles.actionButton}>
//               <Icon 
//                 name={isFavorite ? "heart" : "heart-outline"} 
//                 size={24} 
//                 color={isFavorite ? "#ff6b6b" : "#666"} 
//               />
//             </TouchableOpacity>
//             <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
//               <Icon name="share-outline" size={24} color="#666" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Image */}
//         {item.image && (
//           <View style={styles.imageContainer}>
//             <Image 
//               source={{ uri: item.image }} 
//               style={styles.image}
//               onLoadStart={() => setImageLoading(true)}
//               onLoadEnd={() => setImageLoading(false)}
//             />
//             {imageLoading && (
//               <View style={styles.imageLoader}>
//                 <ActivityIndicator size="large" color="#4ecdc4" />
//               </View>
//             )}
//           </View>
//         )}

//         {/* Content */}
//         <View style={styles.content}>
//           {/* Status Badge */}
//           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
//             <Icon 
//               name={getStatusIcon(item.status)} 
//               size={16} 
//               color="white" 
//               style={styles.statusIcon} 
//             />
//             <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
//           </View>

//           {/* Title */}
//           <Text style={styles.title}>{item.title}</Text>

//           {/* Description */}
//           <Text style={styles.description}>{item.description}</Text>

//           {/* Details Section */}
//           <View style={styles.detailsSection}>
//             <Text style={styles.sectionTitle}>Details</Text>
            
//             <View style={styles.detailItem}>
//               <Icon name="location-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>{item.location}</Text>
//             </View>

//             <View style={styles.detailItem}>
//               <Icon name="calendar-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>{formatDate(item.date)}</Text>
//             </View>

//             <View style={styles.detailItem}>
//               <Icon name="person-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>Posted by {item.owner}</Text>
//             </View>
//           </View>

//           {/* Contact Button */}
//           <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
//             <Icon name="chatbubble-outline" size={20} color="white" />
//             <Text style={styles.contactButtonText}>Contact Owner</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     padding: 20,
//   },
//   errorText: {
//     fontSize: 18,
//     color: '#666',
//     marginTop: 16,
//     marginBottom: 20,
//   },
//   retryButton: {
//     backgroundColor: '#4ecdc4',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 25,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerActions: {
//     flexDirection: 'row',
//   },
//   actionButton: {
//     padding: 8,
//     marginLeft: 8,
//   },
//   imageContainer: {
//     position: 'relative',
//   },
//   image: {
//     width: width,
//     height: 300,
//     backgroundColor: '#e9ecef',
//   },
//   imageLoader: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(248, 249, 250, 0.8)',
//   },
//   content: {
//     padding: 20,
//     backgroundColor: 'white',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     marginTop: -20,
//   },
//   statusBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-start',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     marginBottom: 16,
//   },
//   statusIcon: {
//     marginRight: 6,
//   },
//   statusText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#2c3e50',
//     marginBottom: 16,
//     lineHeight: 34,
//   },
//   description: {
//     fontSize: 16,
//     color: '#555',
//     lineHeight: 24,
//     marginBottom: 24,
//   },
//   detailsSection: {
//     marginBottom: 30,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 16,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f1f3f4',
//   },
//   detailText: {
//     fontSize: 16,
//     color: '#666',
//     marginLeft: 12,
//     flex: 1,
//   },
//   contactButton: {
//     backgroundColor: '#4ecdc4',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     shadowColor: '#4ecdc4',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   contactButtonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
// });

// export default LostFoundDetail;




































































// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   Share,
//   Dimensions,
//   ActivityIndicator,
//   SafeAreaView
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import Icon from 'react-native-vector-icons/Ionicons';

// const { width } = Dimensions.get('window');

// // const LostFoundDetail = ({ route, navigation }) => {
// const LostFoundDetail = ({ route, navigation }) => {
//   const { id } = route.params;
//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [imageLoading, setImageLoading] = useState(true);
//   const [isFavorite, setIsFavorite] = useState(false);

//   useEffect(() => {
//     fetchItemDetails();
//     checkFavoriteStatus();
//   }, [id]);

//   const fetchItemDetails = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`/lost-found/${id}/`);
//       setItem(response.data);
//     } catch (error) {
//       console.error('Error fetching item:', error);
//       Alert.alert('Error', 'Failed to load item details. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkFavoriteStatus = async () => {
//     try {
//       const favorites = await AsyncStorage.getItem('favorites');
//       if (favorites) {
//         const favArray = JSON.parse(favorites);
//         setIsFavorite(favArray.includes(id));
//       }
//     } catch (error) {
//       console.error('Error checking favorite status:', error);
//     }
//   };

//   const toggleFavorite = async () => {
//     try {
//       const favorites = await AsyncStorage.getItem('favorites');
//       let favArray = favorites ? JSON.parse(favorites) : [];
      
//       if (isFavorite) {
//         favArray = favArray.filter(favId => favId !== id);
//       } else {
//         favArray.push(id);
//       }
      
//       await AsyncStorage.setItem('favorites', JSON.stringify(favArray));
//       setIsFavorite(!isFavorite);
//     } catch (error) {
//       console.error('Error toggling favorite:', error);
//     }
//   };

//   const handleShare = async () => {
//     try {
//       const shareContent = {
//         message: `${item.title}\n\nStatus: ${item.status}\nLocation: ${item.location}\nDate: ${item.date}\n\n${item.description}`,
//         title: item.title,
//       };
//       await Share.share(shareContent);
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   const handleContact = () => {
//     Alert.alert(
//       'Contact Owner',
//       `Would you like to contact ${item.owner}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Message', onPress: () => console.log('Open messaging') },
//         { text: 'Call', onPress: () => console.log('Make call') }
//       ]
//     );
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const getStatusColor = (status) => {
//     return status.toLowerCase() === 'lost' ? '#ff6b6b' : '#4ecdc4';
//   };

//   const getStatusIcon = (status) => {
//     return status.toLowerCase() === 'lost' ? 'search-outline' : 'checkmark-circle-outline';
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#4ecdc4" />
//         <Text style={styles.loadingText}>Loading item details...</Text>
//       </SafeAreaView>
//     );
//   }

//   if (!item) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <Icon name="alert-circle-outline" size={64} color="#ff6b6b" />
//         <Text style={styles.errorText}>Item not found</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetails}>
//           <Text style={styles.retryButtonText}>Retry</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView showsVerticalScrollIndicator={false}>
//         {/* Header with actions */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//             <Icon name="arrow-back" size={24} color="#333" />
//           </TouchableOpacity>
//           <View style={styles.headerActions}>
//             <TouchableOpacity onPress={toggleFavorite} style={styles.actionButton}>
//               <Icon 
//                 name={isFavorite ? "heart" : "heart-outline"} 
//                 size={24} 
//                 color={isFavorite ? "#ff6b6b" : "#666"} 
//               />
//             </TouchableOpacity>
//             <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
//               <Icon name="share-outline" size={24} color="#666" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Image */}
//         {item.image && (
//           <View style={styles.imageContainer}>
//             <Image 
//               source={{ uri: item.image }} 
//               style={styles.image}
//               onLoadStart={() => setImageLoading(true)}
//               onLoadEnd={() => setImageLoading(false)}
//             />
//             {imageLoading && (
//               <View style={styles.imageLoader}>
//                 <ActivityIndicator size="large" color="#4ecdc4" />
//               </View>
//             )}
//           </View>
//         )}

//         {/* Content */}
//         <View style={styles.content}>
//           {/* Status Badge */}
//           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
//             <Icon 
//               name={getStatusIcon(item.status)} 
//               size={16} 
//               color="white" 
//               style={styles.statusIcon} 
//             />
//             <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
//           </View>

//           {/* Title */}
//           <Text style={styles.title}>{item.title}</Text>

//           {/* Description */}
//           <Text style={styles.description}>{item.description}</Text>

//           {/* Details Section */}
//           <View style={styles.detailsSection}>
//             <Text style={styles.sectionTitle}>Details</Text>
            
//             <View style={styles.detailItem}>
//               <Icon name="location-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>{item.location}</Text>
//             </View>

//             <View style={styles.detailItem}>
//               <Icon name="calendar-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>{formatDate(item.date)}</Text>
//             </View>

//             <View style={styles.detailItem}>
//               <Icon name="person-outline" size={20} color="#666" />
//               <Text style={styles.detailText}>Posted by {item.owner}</Text>
//             </View>
//           </View>

//           {/* Contact Button */}
//           <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
//             <Icon name="chatbubble-outline" size={20} color="white" />
//             <Text style={styles.contactButtonText}>Contact Owner</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     padding: 20,
//   },
//   errorText: {
//     fontSize: 18,
//     color: '#666',
//     marginTop: 16,
//     marginBottom: 20,
//   },
//   retryButton: {
//     backgroundColor: '#4ecdc4',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 25,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerActions: {
//     flexDirection: 'row',
//   },
//   actionButton: {
//     padding: 8,
//     marginLeft: 8,
//   },
//   imageContainer: {
//     position: 'relative',
//   },
//   image: {
//     width: width,
//     height: 300,
//     backgroundColor: '#e9ecef',
//   },
//   imageLoader: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(248, 249, 250, 0.8)',
//   },
//   content: {
//     padding: 20,
//     backgroundColor: 'white',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     marginTop: -20,
//   },
//   statusBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-start',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     marginBottom: 16,
//   },
//   statusIcon: {
//     marginRight: 6,
//   },
//   statusText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#2c3e50',
//     marginBottom: 16,
//     lineHeight: 34,
//   },
//   description: {
//     fontSize: 16,
//     color: '#555',
//     lineHeight: 24,
//     marginBottom: 24,
//   },
//   detailsSection: {
//     marginBottom: 30,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 16,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f1f3f4',
//   },
//   detailText: {
//     fontSize: 16,
//     color: '#666',
//     marginLeft: 12,
//     flex: 1,
//   },
//   contactButton: {
//     backgroundColor: '#4ecdc4',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     shadowColor: '#4ecdc4',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   contactButtonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
// });

// export default LostFoundDetail;



























































// import React, { useEffect, useState } from 'react';
// import { View, Text, Image, StyleSheet, Button, Linking } from 'react-native';
// // import axios from '../api';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios'

// const LostFoundDetail = ({ route }) => {
//   const { id } = route.params;
//   const [item, setItem] = useState(null);

//   useEffect(() => {
//     axios.get(`/lost-found/${id}/`)
//       .then(res => setItem(res.data))
//       .catch(err => console.error(err));
//   }, [id]);

//   if (!item) return <Text>Loading...</Text>;

//   return (
//     <View style={styles.container}>
//       {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
//       <Text style={styles.title}>{item.title}</Text>
//       <Text>{item.description}</Text>
//       <Text>Status: {item.status}</Text>
//       <Text>Location: {item.location}</Text>
//       <Text>Date: {item.date}</Text>
//       <Text>Posted by: {item.owner}</Text>
//     </View>
//   );
// };

// export default LostFoundDetail;

// const styles = StyleSheet.create({
//   container: { padding: 15 },
//   title: { fontWeight: 'bold', fontSize: 24, marginBottom: 10 },
//   image: { width: '100%', height: 250, borderRadius: 8, marginBottom: 10 },
// });
