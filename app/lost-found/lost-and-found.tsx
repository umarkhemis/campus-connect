

// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   FlatList, 
//   Image, 
//   TouchableOpacity, 
//   StyleSheet, 
//   ActivityIndicator, 
//   RefreshControl,
//   TextInput,
//   Alert,
//   StatusBar,
//   Dimensions,
//   Animated,
//   Modal,
//   ScrollView,
//   SafeAreaView,
//   Share,
//   KeyboardAvoidingView,
//   Platform
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { useRouter } from 'expo-router';
// import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';

// const { width, height } = Dimensions.get('window');

// const LostFoundList = () => {
//   const [items, setItems] = useState([]);
//   const [filteredItems, setFilteredItems] = useState([]);
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [fadeAnim] = useState(new Animated.Value(0));
  
//   // Detail Modal State
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [detailModalVisible, setDetailModalVisible] = useState(false);
//   const [isFavorite, setIsFavorite] = useState(false);
//   const [imageLoading, setImageLoading] = useState(true);
  
//   // Post Modal State
//   const [postModalVisible, setPostModalVisible] = useState(false);
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [status, setStatus] = useState('lost');
//   const [location, setLocation] = useState('');
//   const [date, setDate] = useState('');
//   const [image, setImage] = useState(null);
//   const [postLoading, setPostLoading] = useState(false);
//   const [errors, setErrors] = useState({});

//   const router = useRouter();

//   // Enhanced color scheme
//   const statusColors = {
//     lost: '#FF6B6B',
//     found: '#4ECDC4',
//     claimed: '#45B7D1',
//     all: '#6C5CE7'
//   };

//   const statusIcons = {
//     lost: 'close-circle',
//     found: 'checkmark-circle',
//     claimed: 'trophy',
//     all: 'grid'
//   };

//   const statusOptions = [
//     { key: 'lost', label: 'Lost', icon: 'close', color: '#FF6B6B' },
//     { key: 'found', label: 'Found', icon: 'checkmark', color: '#4ECDC4' },
//     { key: 'claimed', label: 'Claimed', icon: 'trophy', color: '#45B7D1' }
//   ];

//   useEffect(() => {
//     fetchItems();
//     requestPermissions();
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
//   }, []);

//   useEffect(() => {
//     filterItems();
//   }, [items, statusFilter, searchQuery]);

//   const requestPermissions = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission Required', 'We need camera roll permissions to upload images.');
//     }
//   };

//   const fetchItems = async () => {
//     try {
//       setLoading(true);
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         Alert.alert('Error', 'No authentication token found');
//         return;
//       }

//       // const response = await axios.get('http://127.0.0.1:8000/api/lost-found/', {
//       // const response = await axios.get('http://192.168.220.16:8000/api/lost-found/', {
//       const response = await axios.get('http://192.168.130.16:8000/api/lost-found/', {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       setItems(response.data);
//     } catch (error) {
//       console.error('Failed to fetch Lost & Found:', error);
//       Alert.alert('Error', 'Failed to load items. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchItems();
//     setRefreshing(false);
//   };

//   const filterItems = () => {
//     let filtered = items;
    
//     if (statusFilter !== 'all') {
//       filtered = filtered.filter(item => item.status === statusFilter);
//     }
    
//     if (searchQuery.trim()) {
//       filtered = filtered.filter(item =>
//         item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.location.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }
    
//     setFilteredItems(filtered);
//   };

//   const getStatusColor = (status) => statusColors[status] || '#666';

//   const handleBackPress = () => {
//     router.push('/auth/dashboard');
//   };

//   // Detail Modal Functions
//   const openDetailModal = async (item) => {
//     setSelectedItem(item);
//     setDetailModalVisible(true);
//     await checkFavoriteStatus(item.id);
//   };

//   const closeDetailModal = () => {
//     setDetailModalVisible(false);
//     setSelectedItem(null);
//     setIsFavorite(false);
//   };

//   const checkFavoriteStatus = async (itemId) => {
//     try {
//       const favorites = await AsyncStorage.getItem('favorites');
//       if (favorites) {
//         const favArray = JSON.parse(favorites);
//         setIsFavorite(favArray.some(favId => String(favId) === String(itemId)));
//       }
//     } catch (error) {
//       console.error('Error checking favorite status:', error);
//     }
//   };

//   const toggleFavorite = async () => {
//     if (!selectedItem) return;
    
//     try {
//       const favorites = await AsyncStorage.getItem('favorites');
//       let favArray = favorites ? JSON.parse(favorites) : [];
      
//       const stringId = String(selectedItem.id);
//       const isCurrentlyFavorite = favArray.some(favId => String(favId) === stringId);
      
//       if (isCurrentlyFavorite) {
//         favArray = favArray.filter(favId => String(favId) !== stringId);
//       } else {
//         favArray.push(selectedItem.id);
//       }
      
//       await AsyncStorage.setItem('favorites', JSON.stringify(favArray));
//       setIsFavorite(!isCurrentlyFavorite);
//     } catch (error) {
//       console.error('Error toggling favorite:', error);
//     }
//   };

//   const handleShare = async () => {
//     if (!selectedItem) return;
    
//     try {
//       const shareContent = {
//         message: `${selectedItem.title}\n\nStatus: ${selectedItem.status}\nLocation: ${selectedItem.location}\nDate: ${selectedItem.date}\n\n${selectedItem.description}`,
//         title: selectedItem.title,
//       };
//       await Share.share(shareContent);
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   const handleContact = () => {
//     if (!selectedItem) return;
    
//     Alert.alert(
//       'Contact Owner',
//       `Would you like to contact ${selectedItem.owner || 'the owner'}?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Message', onPress: () => console.log('Open messaging') },
//         { text: 'Call', onPress: () => console.log('Make call') }
//       ]
//     );
//   };

//   // Post Modal Functions
//   const openPostModal = () => {
//     setPostModalVisible(true);
//     resetPostForm();
//   };

//   const closePostModal = () => {
//     setPostModalVisible(false);
//     resetPostForm();
//   };

//   const resetPostForm = () => {
//     setTitle('');
//     setDescription('');
//     setStatus('lost');
//     setLocation('');
//     setDate(new Date().toISOString().split('T')[0]);
//     setImage(null);
//     setErrors({});
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

//   const handleSubmit = async () => {
//     if (!validateForm()) {
//       Alert.alert('Validation Error', 'Please fill in all required fields.');
//       return;
//     }

//     setPostLoading(true);

//     const postData = {
//       title: title.trim(),
//       description: description.trim(),
//       status,
//       location: location.trim(),
//       date,
//       image: image ? `data:image/jpeg;base64,${image.base64}` : null,
//     };

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
//             onPress: () => {
//               closePostModal();
//               fetchItems(); // Refresh the list
//             },
//           },
//         ]
//       );

//     } catch (error) {
//       console.error('Post failed:', error);
      
//       if (error.response) {
//         Alert.alert(
//           'Error',
//           `Server error (${error.response.status}): ${JSON.stringify(error.response.data)}`
//         );
//       } else if (error.request) {
//         Alert.alert('Error', 'Network error. Please check your connection.');
//       } else {
//         Alert.alert('Error', error.message);
//       }
//     } finally {
//       setPostLoading(false);
//     }
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

//   const getStatusIcon = (status) => {
//     return status?.toLowerCase() === 'lost' ? 'search-outline' : 'checkmark-circle-outline';
//   };

//   const renderFilterButton = (status) => (
//     <TouchableOpacity
//       key={status}
//       onPress={() => setStatusFilter(status)}
//       style={[
//         styles.filterButton,
//         {
//           backgroundColor: statusFilter === status ? statusColors[status] : 'white',
//           borderColor: statusColors[status],
//         }
//       ]}
//       activeOpacity={0.7}
//     >
//       <Ionicons name={statusIcons[status]} size={14} color={statusFilter === status ? 'white' : statusColors[status]} />
//       <Text style={[
//         styles.filterText,
//         { color: statusFilter === status ? 'white' : statusColors[status] }
//       ]}>
//         {status.toUpperCase()}
//       </Text>
//     </TouchableOpacity>
//   );

//   const renderItem = ({ item, index }) => (
//     <Animated.View
//       style={[
//         styles.cardContainer,
//         {
//           opacity: fadeAnim,
//           transform: [{
//             translateY: fadeAnim.interpolate({
//               inputRange: [0, 1],
//               outputRange: [50, 0],
//             }),
//           }],
//         }
//       ]}
//     >
//       <TouchableOpacity
//         onPress={() => openDetailModal(item)}
//         style={styles.card}
//         activeOpacity={0.9}
//       >
//         <View style={styles.cardHeader}>
//           <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
//             <Ionicons name={statusIcons[item.status]} size={14} color="white" />
//             <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
//           </View>
//           <Text style={styles.dateText}>{item.date}</Text>
//         </View>

//         {item.image && (
//           <View style={styles.imageContainer}>
//             <Image 
//               source={{ uri: item.image }} 
//               style={styles.image}
//               resizeMode="cover"
//             />
//           </View>
//         )}

//         <View style={styles.cardContent}>
//           <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
//           <View style={styles.locationContainer}>
//             <Ionicons name="location-outline" size={16} color="#6c757d" />
//             <Text style={styles.locationText}>{item.location}</Text>
//           </View>
//         </View>
//       </TouchableOpacity>
//     </Animated.View>
//   );

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Feather name="search" size={48} color="#6c757d" />
//       <Text style={styles.emptyTitle}>No items found</Text>
//       <Text style={styles.emptySubtitle}>
//         {searchQuery ? 'Try adjusting your search' : 'No items match the selected filter'}
//       </Text>
//     </View>
//   );

//   const renderStatusButton = (option) => (
//     <TouchableOpacity
//       key={option.key}
//       onPress={() => setStatus(option.key)}
//       style={[
//         styles.postStatusButton,
//         {
//           backgroundColor: status === option.key ? option.color : 'white',
//           borderColor: option.color,
//         }
//       ]}
//       activeOpacity={0.7}
//     >
//       <Ionicons 
//         name={option.icon} 
//         size={16} 
//         color={status === option.key ? 'white' : option.color} 
//         style={styles.statusIcon}
//       />
//       <Text style={[
//         styles.postStatusText,
//         { color: status === option.key ? 'white' : option.color }
//       ]}>
//         {option.label.toUpperCase()}
//       </Text>
//     </TouchableOpacity>
//   );

//   const renderInput = (placeholder, value, onChangeText, multiline = false, error = null, icon = null) => (
//     <View style={styles.inputContainer}>
//       <View style={styles.labelWithIcon}>
//         {icon && <Ionicons name={icon} size={18} color="#333" />}
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
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
//       {/* Header with Back Button */}
//       <View style={styles.header}>
//         <View style={styles.headerTop}>
//           <TouchableOpacity 
//             onPress={handleBackPress}
//             style={styles.backButton}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="arrow-back" size={20} color="#6C5CE7" />
//             <Text style={styles.backText}>Dashboard</Text>
//           </TouchableOpacity>
//         </View>
//         <Text style={styles.headerTitle}>Lost & Found</Text>
//         <Text style={styles.headerSubtitle}>
//           {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
//         </Text>
//       </View>

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <Feather name="search" size={16} color="#999" />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search items or locations..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           placeholderTextColor="#999"
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
//             <Ionicons name="close" size={16} color="#999" />
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Filter Bar */}
//       <View style={styles.filterBar}>
//         {['all', 'lost', 'found', 'claimed'].map(renderFilterButton)}
//       </View>

//       {/* Content */}
//       {loading ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#6C5CE7" />
//           <Text style={styles.loadingText}>Loading items...</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredItems}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={renderItem}
//           contentContainerStyle={styles.listContainer}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={['#6C5CE7']}
//               tintColor="#6C5CE7"
//             />
//           }
//           ListEmptyComponent={renderEmptyComponent}
//         />
//       )}

//       {/* Floating Action Button */}
//       <TouchableOpacity
//         style={styles.fab}
//         onPress={openPostModal}
//         activeOpacity={0.8}
//       >
//         <Ionicons name="add" size={24} color="white" />
//         <Text style={styles.fabText}>Post Item</Text>
//       </TouchableOpacity>

//       {/* Detail Modal */}
//       <Modal
//         visible={detailModalVisible}
//         animationType="slide"
//         onRequestClose={closeDetailModal}
//       >
//         <SafeAreaView style={styles.modalContainer}>
//           {selectedItem && (
//             <ScrollView showsVerticalScrollIndicator={false}>
//               {/* Header with actions */}
//               <View style={styles.detailHeader}>
//                 <TouchableOpacity onPress={closeDetailModal} style={styles.closeButton}>
//                   <Ionicons name="close" size={24} color="#333" />
//                 </TouchableOpacity>
//                 <View style={styles.headerActions}>
//                   <TouchableOpacity onPress={toggleFavorite} style={styles.actionButton}>
//                     <Ionicons 
//                       name={isFavorite ? "heart" : "heart-outline"} 
//                       size={24} 
//                       color={isFavorite ? "#FF6B6B" : "#666"} 
//                     />
//                   </TouchableOpacity>
//                   <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
//                     <Ionicons name="share-outline" size={24} color="#666" />
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               {/* Image */}
//               {selectedItem.image && (
//                 <View style={styles.detailImageContainer}>
//                   <Image 
//                     source={{ uri: selectedItem.image }} 
//                     style={styles.detailImage}
//                     onLoadStart={() => setImageLoading(true)}
//                     onLoadEnd={() => setImageLoading(false)}
//                   />
//                   {imageLoading && (
//                     <View style={styles.imageLoader}>
//                       <ActivityIndicator size="large" color="#6C5CE7" />
//                     </View>
//                   )}
//                 </View>
//               )}

//               {/* Content */}
//               <View style={styles.detailContent}>
//                 {/* Status Badge */}
//                 <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedItem.status) }]}>
//                   <Ionicons 
//                     name={getStatusIcon(selectedItem.status)} 
//                     size={16} 
//                     color="white" 
//                     style={styles.statusIcon} 
//                   />
//                   <Text style={styles.detailStatusText}>{selectedItem.status?.toUpperCase() || 'UNKNOWN'}</Text>
//                 </View>

//                 {/* Title */}
//                 <Text style={styles.detailTitle}>{selectedItem.title || 'Untitled Item'}</Text>

//                 {/* Description */}
//                 <Text style={styles.detailDescription}>{selectedItem.description || 'No description available'}</Text>

//                 {/* Details Section */}
//                 <View style={styles.detailsSection}>
//                   <Text style={styles.sectionTitle}>Details</Text>
                  
//                   <View style={styles.detailItem}>
//                     <Ionicons name="location-outline" size={20} color="#666" />
//                     <Text style={styles.detailText}>{selectedItem.location || 'Location not specified'}</Text>
//                   </View>

//                   <View style={styles.detailItem}>
//                     <Ionicons name="calendar-outline" size={20} color="#666" />
//                     <Text style={styles.detailText}>{selectedItem.date ? formatDate(selectedItem.date) : 'Date not specified'}</Text>
//                   </View>

//                   <View style={styles.detailItem}>
//                     <Ionicons name="person-outline" size={20} color="#666" />
//                     <Text style={styles.detailText}>Posted by {selectedItem.owner || 'Unknown'}</Text>
//                   </View>
//                 </View>

//                 {/* Contact Button */}
//                 <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
//                   <Ionicons name="chatbubble-outline" size={20} color="white" />
//                   <Text style={styles.contactButtonText}>Contact Owner</Text>
//                 </TouchableOpacity>
//               </View>
//             </ScrollView>
//           )}
//         </SafeAreaView>
//       </Modal>

//       {/* Post Modal */}
//       <Modal
//         visible={postModalVisible}
//         animationType="slide"
//         onRequestClose={closePostModal}
//       >
//         <KeyboardAvoidingView 
//           style={styles.modalContainer} 
//           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         >
//           <SafeAreaView style={styles.modalContainer}>
//             {/* Post Header */}
//             <View style={styles.postHeader}>
//               <TouchableOpacity onPress={closePostModal} style={styles.closeButton}>
//                 <Ionicons name="close" size={24} color="#333" />
//               </TouchableOpacity>
//               <Text style={styles.postHeaderTitle}>Post Item</Text>
//               <View style={styles.headerPlaceholder} />
//             </View>

//             <ScrollView 
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={styles.postScrollContainer}
//             >
//               {/* Form Header */}
//               <View style={styles.postFormHeader}>
//                 <View style={styles.headerIconContainer}>
//                   <Ionicons name="create-outline" size={28} color="#6C5CE7" />
//                 </View>
//                 <Text style={styles.postFormTitle}>Post Lost & Found Item</Text>
//                 <Text style={styles.postFormSubtitle}>
//                   Help others find their lost items or return found items
//                 </Text>
//               </View>

//               {/* Form */}
//               <View style={styles.postForm}>
//                 {renderInput('Title', title, setTitle, false, errors.title, 'create-outline')}
//                 {renderInput('Description', description, setDescription, true, errors.description)}
//                 {renderInput('Location', location, setLocation, false, errors.location, 'location-outline')}

//                 {/* Date Input */}
//                 <View style={styles.inputContainer}>
//                   <View style={styles.labelWithIcon}>
//                     <Ionicons name="calendar-outline" size={18} color="#333" />
//                     <Text style={styles.label}>
//                       Date <Text style={styles.required}>*</Text>
//                     </Text>
//                   </View>
//                   <TextInput
//                     placeholder="YYYY-MM-DD"
//                     value={date}
//                     onChangeText={setDate}
//                     style={[styles.input, errors.date && styles.inputError]}
//                     placeholderTextColor="#999"
//                   />
//                   {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
//                 </View>

//                 {/* Status Selection */}
//                 <View style={styles.inputContainer}>
//                   <Text style={styles.label}>
//                     Status <Text style={styles.required}>*</Text>
//                   </Text>
//                   <View style={styles.postStatusContainer}>
//                     {statusOptions.map(renderStatusButton)}
//                   </View>
//                 </View>

//                 {/* Image Upload */}
//                 <View style={styles.inputContainer}>
//                   <View style={styles.labelWithIcon}>
//                     <Ionicons name="camera-outline" size={18} color="#333" />
//                     <Text style={styles.label}>Image (Optional)</Text>
//                   </View>
                  
//                   {!image ? (
//                     <TouchableOpacity onPress={pickImage} style={styles.imageUploadButton}>
//                       <Ionicons name="camera-outline" size={32} color="#6c757d" style={styles.imageUploadIcon} />
//                       <Text style={styles.imageUploadText}>Choose Image</Text>
//                       <Text style={styles.imageUploadSubtext}>Tap to select from gallery</Text>
//                     </TouchableOpacity>
//                   ) : (
//                     <View style={styles.imagePreviewContainer}>
//                       <Image source={{ uri: image.uri }} style={styles.imagePreview} />
//                       <View style={styles.imageActions}>
//                         <TouchableOpacity onPress={pickImage} style={styles.changeImageButton}>
//                           <Ionicons name="camera-outline" size={14} color="white" />
//                           <Text style={styles.changeImageText}>Change Image</Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity onPress={removeImage} style={styles.removeImageButton}>
//                           <Ionicons name="trash-outline" size={14} color="white" />
//                           <Text style={styles.removeImageText}>Remove</Text>
//                         </TouchableOpacity>
//                       </View>
//                     </View>
//                   )}
//                 </View>
//               </View>

//               {/* Submit Button */}
//               <TouchableOpacity
//                 onPress={handleSubmit}
//                 style={[styles.submitButton, postLoading && styles.submitButtonDisabled]}
//                 disabled={postLoading}
//                 activeOpacity={0.8}
//               >
//                 {postLoading ? (
//                   <View style={styles.loadingContainer}>
//                     <ActivityIndicator color="white" size="small" />
//                     <Text style={styles.submitButtonText}>Posting...</Text>
//                   </View>
//                 ) : (
//                   <View style={styles.submitButtonContent}>
//                     <Ionicons name="send-outline" size={18} color="white" />
//                     <Text style={styles.submitButtonText}>Post Item</Text>
//                   </View>
//                 )}
//               </TouchableOpacity>
//             </ScrollView>
//           </SafeAreaView>
//         </KeyboardAvoidingView>
//       </Modal>
//     </View>
//   );
// };


















import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  SafeAreaView,
  Share,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ConnectionAPI from '../api/connectionService'; 

const { width, height } = Dimensions.get('window');

const LostFoundList = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Post Modal State
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('lost');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const router = useRouter();

  // Enhanced color scheme
  const statusColors = {
    lost: '#FF6B6B',
    found: '#4ECDC4',
    claimed: '#45B7D1',
    all: '#6C5CE7'
  };

  const statusIcons = {
    lost: 'close-circle',
    found: 'checkmark-circle',
    claimed: 'trophy',
    all: 'grid'
  };

  const statusOptions = [
    { key: 'lost', label: 'Lost', icon: 'close', color: '#FF6B6B' },
    { key: 'found', label: 'Found', icon: 'checkmark', color: '#4ECDC4' },
    { key: 'claimed', label: 'Claimed', icon: 'trophy', color: '#45B7D1' }
  ];

  useEffect(() => {
    fetchItems();
    requestPermissions();
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
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, statusFilter, searchQuery]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to upload images.');
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await ConnectionAPI.getLostFoundItems();
      setItems(response);
    } catch (error) {
      console.error('Failed to fetch Lost & Found:', error);
      Alert.alert('Error', 'Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const filterItems = () => {
    let filtered = items;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  };

  const getStatusColor = (status) => statusColors[status] || '#666';

  const handleBackPress = () => {
    router.push('/auth/dashboard');
  };

  // Detail Modal Functions
  const openDetailModal = async (item) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
    await checkFavoriteStatus(item.id);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedItem(null);
    setIsFavorite(false);
  };

  const checkFavoriteStatus = async (itemId) => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      if (favorites) {
        const favArray = JSON.parse(favorites);
        setIsFavorite(favArray.some(favId => String(favId) === String(itemId)));
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!selectedItem) return;
    
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      let favArray = favorites ? JSON.parse(favorites) : [];
      
      const stringId = String(selectedItem.id);
      const isCurrentlyFavorite = favArray.some(favId => String(favId) === stringId);
      
      if (isCurrentlyFavorite) {
        favArray = favArray.filter(favId => String(favId) !== stringId);
      } else {
        favArray.push(selectedItem.id);
      }
      
      await AsyncStorage.setItem('favorites', JSON.stringify(favArray));
      setIsFavorite(!isCurrentlyFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = async () => {
    if (!selectedItem) return;
    
    try {
      const shareContent = {
        message: `${selectedItem.title}\n\nStatus: ${selectedItem.status}\nLocation: ${selectedItem.location}\nDate: ${selectedItem.date}\n\n${selectedItem.description}`,
        title: selectedItem.title,
      };
      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleContact = () => {
    if (!selectedItem) return;
    
    Alert.alert(
      'Contact Owner',
      `Would you like to contact ${selectedItem.owner || 'the owner'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Message', onPress: () => console.log('Open messaging') },
        { text: 'Call', onPress: () => console.log('Make call') }
      ]
    );
  };

  // Post Modal Functions
  const openPostModal = () => {
    setPostModalVisible(true);
    resetPostForm();
  };

  const closePostModal = () => {
    setPostModalVisible(false);
    resetPostForm();
  };

  const resetPostForm = () => {
    setTitle('');
    setDescription('');
    setStatus('lost');
    setLocation('');
    setDate(new Date().toISOString().split('T')[0]);
    setImage(null);
    setErrors({});
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setPostLoading(true);

    const postData = {
      title: title.trim(),
      description: description.trim(),
      status,
      location: location.trim(),
      date,
      image: image ? `data:image/jpeg;base64,${image.base64}` : null,
    };

    try {
      await ConnectionAPI.createLostFoundItem(postData);

      Alert.alert(
        'Success! 🎉',
        'Your item has been posted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              closePostModal();
              fetchItems(); // Refresh the list
            },
          },
        ]
      );

    } catch (error) {
      console.error('Post failed:', error);
      
      if (error.response) {
        Alert.alert(
          'Error',
          `Server error (${error.response.status}): ${JSON.stringify(error.response.data)}`
        );
      } else if (error.request) {
        Alert.alert('Error', 'Network error. Please check your connection.');
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setPostLoading(false);
    }
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

  const getStatusIcon = (status) => {
    return status?.toLowerCase() === 'lost' ? 'search-outline' : 'checkmark-circle-outline';
  };

  const renderFilterButton = (status) => (
    <TouchableOpacity
      key={status}
      onPress={() => setStatusFilter(status)}
      style={[
        styles.filterButton,
        {
          backgroundColor: statusFilter === status ? statusColors[status] : 'white',
          borderColor: statusColors[status],
        }
      ]}
      activeOpacity={0.7}
    >
      <Ionicons name={statusIcons[status]} size={14} color={statusFilter === status ? 'white' : statusColors[status]} />
      <Text style={[
        styles.filterText,
        { color: statusFilter === status ? 'white' : statusColors[status] }
      ]}>
        {status.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }],
        }
      ]}
    >
      <TouchableOpacity
        onPress={() => openDetailModal(item)}
        style={styles.card}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons name={statusIcons[item.status]} size={14} color="white" />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>

        {item.image && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.image }} 
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#6c757d" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Feather name="search" size={48} color="#6c757d" />
      <Text style={styles.emptyTitle}>No items found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try adjusting your search' : 'No items match the selected filter'}
      </Text>
    </View>
  );

  const renderStatusButton = (option) => (
    <TouchableOpacity
      key={option.key}
      onPress={() => setStatus(option.key)}
      style={[
        styles.postStatusButton,
        {
          backgroundColor: status === option.key ? option.color : 'white',
          borderColor: option.color,
        }
      ]}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={option.icon} 
        size={16} 
        color={status === option.key ? 'white' : option.color} 
        style={styles.statusIcon}
      />
      <Text style={[
        styles.postStatusText,
        { color: status === option.key ? 'white' : option.color }
      ]}>
        {option.label.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  const renderInput = (placeholder, value, onChangeText, multiline = false, error = null, icon = null) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelWithIcon}>
        {icon && <Ionicons name={icon} size={18} color="#333" />}
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#6C5CE7" />
            <Text style={styles.backText}>Dashboard</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Lost & Found</Text>
        <Text style={styles.headerSubtitle}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={16} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items or locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close" size={16} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        {['all', 'lost', 'found', 'claimed'].map(renderFilterButton)}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6C5CE7']}
              tintColor="#6C5CE7"
            />
          }
          ListEmptyComponent={renderEmptyComponent}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openPostModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.fabText}>Post Item</Text>
      </TouchableOpacity>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        onRequestClose={closeDetailModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedItem && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header with actions */}
              <View style={styles.detailHeader}>
                <TouchableOpacity onPress={closeDetailModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerActions}>
                  <TouchableOpacity onPress={toggleFavorite} style={styles.actionButton}>
                    <Ionicons 
                      name={isFavorite ? "heart" : "heart-outline"} 
                      size={24} 
                      color={isFavorite ? "#FF6B6B" : "#666"} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                    <Ionicons name="share-outline" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Image */}
              {selectedItem.image && (
                <View style={styles.detailImageContainer}>
                  <Image 
                    source={{ uri: selectedItem.image }} 
                    style={styles.detailImage}
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                  />
                  {imageLoading && (
                    <View style={styles.imageLoader}>
                      <ActivityIndicator size="large" color="#6C5CE7" />
                    </View>
                  )}
                </View>
              )}

              {/* Content */}
              <View style={styles.detailContent}>
                {/* Status Badge */}
                <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedItem.status) }]}>
                  <Ionicons 
                    name={getStatusIcon(selectedItem.status)} 
                    size={16} 
                    color="white" 
                    style={styles.statusIcon} 
                  />
                  <Text style={styles.detailStatusText}>{selectedItem.status?.toUpperCase() || 'UNKNOWN'}</Text>
                </View>

                {/* Title */}
                <Text style={styles.detailTitle}>{selectedItem.title || 'Untitled Item'}</Text>

                {/* Description */}
                <Text style={styles.detailDescription}>{selectedItem.description || 'No description available'}</Text>

                {/* Details Section */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Details</Text>
                  
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={20} color="#666" />
                    <Text style={styles.detailText}>{selectedItem.location || 'Location not specified'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <Text style={styles.detailText}>{selectedItem.date ? formatDate(selectedItem.date) : 'Date not specified'}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <Text style={styles.detailText}>Posted by {selectedItem.owner || 'Unknown'}</Text>
                  </View>
                </View>

                {/* Contact Button */}
                <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
                  <Ionicons name="chatbubble-outline" size={20} color="white" />
                  <Text style={styles.contactButtonText}>Contact Owner</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Post Modal */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        onRequestClose={closePostModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={styles.modalContainer}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <TouchableOpacity onPress={closePostModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.postHeaderTitle}>Post Item</Text>
              <View style={styles.headerPlaceholder} />
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.postScrollContainer}
            >
              {/* Form Header */}
              <View style={styles.postFormHeader}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="create-outline" size={28} color="#6C5CE7" />
                </View>
                <Text style={styles.postFormTitle}>Post Lost & Found Item</Text>
                <Text style={styles.postFormSubtitle}>
                  Help others find their lost items or return found items
                </Text>
              </View>

              {/* Form */}
              <View style={styles.postForm}>
                {renderInput('Title', title, setTitle, false, errors.title, 'create-outline')}
                {renderInput('Description', description, setDescription, true, errors.description)}
                {renderInput('Location', location, setLocation, false, errors.location, 'location-outline')}

                {/* Date Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelWithIcon}>
                    <Ionicons name="calendar-outline" size={18} color="#333" />
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
                  <View style={styles.postStatusContainer}>
                    {statusOptions.map(renderStatusButton)}
                  </View>
                </View>

                {/* Image Upload */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelWithIcon}>
                    <Ionicons name="camera-outline" size={18} color="#333" />
                    <Text style={styles.label}>Image (Optional)</Text>
                  </View>
                  
                  {!image ? (
                    <TouchableOpacity onPress={pickImage} style={styles.imageUploadButton}>
                      <Ionicons name="camera-outline" size={32} color="#6c757d" style={styles.imageUploadIcon} />
                      <Text style={styles.imageUploadText}>Choose Image</Text>
                      <Text style={styles.imageUploadSubtext}>Tap to select from gallery</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                      <View style={styles.imageActions}>
                        <TouchableOpacity onPress={pickImage} style={styles.changeImageButton}>
                          <Ionicons name="camera-outline" size={14} color="white" />
                          <Text style={styles.changeImageText}>Change Image</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={removeImage} style={styles.removeImageButton}>
                          <Ionicons name="trash-outline" size={14} color="white" />
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
                style={[styles.submitButton, postLoading && styles.submitButtonDisabled]}
                disabled={postLoading}
                activeOpacity={0.8}
              >
                {postLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.submitButtonText}>Posting...</Text>
                  </View>
                ) : (
                  <View style={styles.submitButtonContent}>
                    <Ionicons name="send-outline" size={18} color="white" />
                    <Text style={styles.submitButtonText}>Post Item</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    marginBottom: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FF',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E8E6FF',
  },
  backText: {
    fontSize: 16,
    color: '#6C5CE7',
    fontWeight: '600',
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#636E72',
    fontWeight: '500',
  },
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  clearButton: {
    padding: 5,
  },
  // Filter Styles
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  // List Styles
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    paddingTop: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 6,
    fontWeight: '500',
  },
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#6C5CE7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Detail Modal Styles
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  detailImageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  detailContent: {
    padding: 20,
  },
  detailStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3436',
    marginBottom: 16,
    lineHeight: 36,
  },
  detailDescription: {
    fontSize: 16,
    color: '#636E72',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
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
    color: '#636E72',
    marginLeft: 12,
    flex: 1,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Post Modal Styles
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  postHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  headerPlaceholder: {
    width: 40,
  },
  postScrollContainer: {
    paddingBottom: 30,
  },
  postFormHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  postFormTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  postFormSubtitle: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  postForm: {
    paddingHorizontal: 20,
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
    color: '#2D3436',
    marginLeft: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  postStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  postStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    flex: 0.32,
    justifyContent: 'center',
  },
  postStatusText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  statusIcon: {
    marginRight: 4,
  },
  imageUploadButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadIcon: {
    marginBottom: 12,
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  imageUploadSubtext: {
    fontSize: 14,
    color: '#6c757d',
  },
  imagePreviewContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  imageActions: {
    flexDirection: 'row',
    padding: 12,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    flex: 1,
    justifyContent: 'center',
  },
  changeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#6C5CE7',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default LostFoundList;

