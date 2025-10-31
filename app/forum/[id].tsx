

// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View, 
//   Text, 
//   StyleSheet, 
//   Image, 
//   TextInput, 
//   TouchableOpacity, 
//   Alert, 
//   ScrollView,
//   ActivityIndicator,
//   RefreshControl,
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   Dimensions,
//   SafeAreaView,
//   StatusBar
// } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');

// const getProfilePictureUri = (user) => {
//   if (user?.profile_picture) {
//     // Check if it's already a full URL
//     if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
//       return user.profile_picture;
//     }
    
//     // Use your API base URL from config or environment
//     // const API_BASE_URL = process.env.REACT_NATIVE_API_URL || 'http://localhost:8000';
//     // const API_BASE_URL = 'http://127.0.0.1:8000'; // Replace with your actual server URL
//     // const API_BASE_URL = 'http://192.168.220.16:8000'; // Replace with your actual server URL
//     const API_BASE_URL = 'http://192.168.130.16:8000'; // Replace with your actual server URL
    
//     // Clean up the path
//     const cleanPath = user.profile_picture.startsWith('/') 
//       ? user.profile_picture 
//       : `/${user.profile_picture}`;
    
//     return `${API_BASE_URL}${cleanPath}`;
//   }
  
//   // Fallback to username-based avatar
//   return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=10b981&color=fff&size=128`;
// };




// // Error Toast Component
// const ErrorToast = ({ message, visible, onHide }) => {
//   const [fadeAnim] = useState(new Animated.Value(0));

//   useEffect(() => {
//     if (visible) {
//       Animated.sequence([
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }),
//         Animated.delay(3000),
//         Animated.timing(fadeAnim, {
//           toValue: 0,
//           duration: 300,
//           useNativeDriver: true,
//         }),
//       ]).start(() => onHide());
//     }
//   }, [visible]);

//   if (!visible) return null;

//   return (
//     <Animated.View style={[styles.errorToast, { opacity: fadeAnim }]}>
//       <Ionicons name="alert-circle" size={20} color="#ffffff" />
//       <Text style={styles.errorToastText}>{message}</Text>
//     </Animated.View>
//   );
// };

// // Success Toast Component
// const SuccessToast = ({ message, visible, onHide }) => {
//   const [fadeAnim] = useState(new Animated.Value(0));

//   useEffect(() => {
//     if (visible) {
//       Animated.sequence([
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }),
//         Animated.delay(2000),
//         Animated.timing(fadeAnim, {
//           toValue: 0,
//           duration: 300,
//           useNativeDriver: true,
//         }),
//       ]).start(() => onHide());
//     }
//   }, [visible]);

//   if (!visible) return null;

//   return (
//     <Animated.View style={[styles.successToast, { opacity: fadeAnim }]}>
//       <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
//       <Text style={styles.successToastText}>{message}</Text>
//     </Animated.View>
//   );
// };

// const CommentItem = ({
//   comment, 
//   onReply,
//   level = 0
// }: { 
//   comment: any; 
//   onReply: (text: string, parentId: number) => void;
//   level?: number;
// }) => {
//   const [replyText, setReplyText] = useState('');
//   const [showReplyInput, setShowReplyInput] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleReply = async () => {
//     if (!replyText.trim()) {
//       Alert.alert('Error', 'Please enter a reply');
//       return;
//     }
    
//     setIsSubmitting(true);
//     try {
//       await onReply(replyText, comment.id);
//       setReplyText('');
//       setShowReplyInput(false);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to post reply');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const formatTimeAgo = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now - date) / 1000);
    
//     if (diffInSeconds < 60) return 'Just now';
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
//     return `${Math.floor(diffInSeconds / 86400)}d ago`;
//   };


//   // const getProfilePictureUri = (user) => {
//   //   if (user?.profile_picture) {
//   //     // Check if it's already a full URL
//   //     if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
//   //       return user.profile_picture;
//   //     }
      
//   //     // Use your API base URL from config or environment
//   //     // const API_BASE_URL = process.env.REACT_NATIVE_API_URL || 'http://localhost:8000';
//   //     const API_BASE_URL = 'http://127.0.0.1:8000'; // Replace with your actual server URL
      
//   //     // Clean up the path
//   //     const cleanPath = user.profile_picture.startsWith('/') 
//   //       ? user.profile_picture 
//   //       : `/${user.profile_picture}`;
      
//   //     return `${API_BASE_URL}${cleanPath}`;
//   //   }
    
//   //   // Fallback to username-based avatar
//   //   return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=10b981&color=fff&size=128`;
//   // };





//   return (
//     <View style={[
//       styles.commentBlock,
//       { 
//         marginLeft: level * 16, 
//         marginBottom: level === 0 ? 16 : 8,
//         borderLeftWidth: level > 0 ? 2 : 0,
//         borderLeftColor: level > 0 ? '#e0e0e0' : 'transparent',
//         paddingLeft: level > 0 ? 12 : 16
//       }
//     ]}>
//       <View style={styles.commentHeader}>
//         <Image 
//           source={{ 
//             uri: getProfilePictureUri(comment.author_name) || 'https://via.placeholder.com/32/007AFF/white?text=U' 
//             // uri: comment.author_avatar || 'https://via.placeholder.com/32/007AFF/white?text=U' 
//           }} 
//           style={styles.commentAvatar}
//           defaultSource={{
//             uri: 'https://via.placeholder.com/32/007AFF/white?text=U'
//           }}
//         />
//         <View style={styles.commentMeta}>
//           <Text style={styles.commentAuthor}>{comment.author_name || 'Anonymous'}</Text>
//           <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
//         </View>
//       </View>
      
//       <Text style={styles.commentContent}>{comment.content}</Text>
      
//       <View style={styles.commentActions}>
//         <TouchableOpacity 
//           onPress={() => setShowReplyInput(!showReplyInput)}
//           style={styles.replyButton}
//           activeOpacity={0.7}
//         >
//           <Ionicons 
//             name={showReplyInput ? "close" : "chatbubble-outline"} 
//             size={16} 
//             color="#007AFF" 
//           />
//           <Text style={styles.replyBtnText}>
//             {showReplyInput ? 'Cancel' : 'Reply'}
//           </Text>
//         </TouchableOpacity>
        
//         {comment.replies && comment.replies.length > 0 && (
//           <View style={styles.repliesCountContainer}>
//             <Ionicons name="chatbubbles-outline" size={14} color="#8e8e93" />
//             <Text style={styles.repliesCount}>
//               {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
//             </Text>
//           </View>
//         )}
//       </View>

//       {showReplyInput && (
//         <View style={styles.replyInputContainer}>
//           <TextInput
//             value={replyText}
//             onChangeText={setReplyText}
//             placeholder="Write a reply..."
//             placeholderTextColor="#8e8e93"
//             style={styles.replyInput}
//             multiline
//             textAlignVertical="top"
//             maxLength={500}
//           />
//           <View style={styles.replyInputFooter}>
//             <Text style={styles.characterCount}>{replyText.length}/500</Text>
//             <View style={styles.replyActions}>
//               <TouchableOpacity 
//                 onPress={() => {
//                   setShowReplyInput(false);
//                   setReplyText('');
//                 }}
//                 style={styles.cancelButton}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity 
//                 onPress={handleReply}
//                 style={[styles.submitReplyButton, (!replyText.trim() || isSubmitting) && styles.disabledButton]}
//                 disabled={!replyText.trim() || isSubmitting}
//               >
//                 {isSubmitting ? (
//                   <ActivityIndicator size="small" color="#ffffff" />
//                 ) : (
//                   <>
//                     <Ionicons name="send" size={14} color="#ffffff" />
//                     <Text style={styles.submitReplyText}>Reply</Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       )}

//       {comment.replies?.map((reply) => (
//         <CommentItem 
//           key={reply.id} 
//           comment={reply} 
//           onReply={onReply}
//           level={level + 1}
//         />
//       ))}
//     </View>
//   );
// };

// export default function PostDetail() {
//   const { id } = useLocalSearchParams();
//   const router = useRouter();
//   const [post, setPost] = useState(null);
//   const [comments, setComments] = useState([]);
//   const [newComment, setNewComment] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);
//   const [showErrorToast, setShowErrorToast] = useState(false);
//   const [showSuccessToast, setShowSuccessToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState('');
//   const [isLiked, setIsLiked] = useState(false);
//   const [likesCount, setLikesCount] = useState(0);

//   useEffect(() => {
//     fetchDetail();
//   }, []);

//   // Show error toast
//   const showError = (message) => {
//     setToastMessage(message);
//     setShowErrorToast(true);
//   };

//   // Show success toast
//   const showSuccess = (message) => {
//     setToastMessage(message);
//     setShowSuccessToast(true);
//   };

//   // Helper function to get full image URL
//   const getImageUrl = (imageUrl) => {
//     if (!imageUrl) return null;
//     if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
//       return imageUrl;
//     }
//     // return `http://127.0.0.1:8000${imageUrl}`;
//     return `http://192.168.220.16:8000${imageUrl}`;
//   };

//   const fetchDetail = async (isRefresh = false) => {
//     try {
//       if (!isRefresh) setLoading(true);
//       setError(null);

//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         throw new Error('Authentication required. Please log in again.');
//       }

//       // const response = await axios.get(`http://127.0.0.1:8000/api/posts/${id}/`, {
//       // const response = await axios.get(`http://192.168.220.16:8000/api/posts/${id}/`, {
//       const response = await axios.get(`http://192.168.130.16:8000/api/posts/${id}/`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000, // 10 second timeout
//       });
      
//       setPost(response.data);
//       setComments(response.data.comments || []);
//       setLikesCount(response.data.likes_count || 0);
//       setIsLiked(response.data.is_liked || false);
//     } catch (err) {
//       console.error('Error fetching post detail:', err);
//       const errorMessage = err.response?.data?.message || 
//                           err.message || 
//                           'Failed to load post details. Please check your connection.';
//       setError(errorMessage);
//       if (!isRefresh) {
//         showError(errorMessage);
//       }
//     } finally {
//       setLoading(false);
//       if (isRefresh) setRefreshing(false);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchDetail(true);
//   }, []);

//   const handleBack = () => {
//     router.push('/auth/forum');
//   };

//   const handleLike = async () => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         showError('Authentication required');
//         return;
//       }

//       // Optimistic update
//       const newIsLiked = !isLiked;
//       const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
//       setIsLiked(newIsLiked);
//       setLikesCount(newLikesCount);

//       // await axios.post(`http://127.0.0.1:8000/api/posts/${id}/like/`, {}, {
//       // await axios.post(`http://192.168.220.16:8000/api/posts/${id}/like/`, {}, {
//       await axios.post(`http://192.168.130.16:8000/api/posts/${id}/like/`, {}, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 5000,
//       });
      
//     } catch (err) {
//       // Revert optimistic update on error
//       setIsLiked(!isLiked);
//       setLikesCount(isLiked ? likesCount + 1 : likesCount - 1);
      
//       console.error('Error liking post:', err);
//       const errorMessage = err.response?.data?.message || 'Failed to update like status';
//       showError(errorMessage);
//     }
//   };

//   const handleReport = async () => {
//     Alert.alert(
//       'Report Post',
//       'Are you sure you want to report this post for violating community guidelines?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Report', 
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               const token = await AsyncStorage.getItem('access_token');
//               if (!token) {
//                 showError('Authentication required');
//                 return;
//               }

//               // await axios.post(`http://127.0.0.1:8000/api/posts/${id}/report/`, 
//               // await axios.post(`http://192.168.220.16:8000/api/posts/${id}/report/`, 
//               await axios.post(`http://192.168.130.16:8000/api/posts/${id}/report/`, 
//                 { post_id: id },
//                 {
//                   headers: {
//                     Authorization: `Bearer ${token}`,
//                     'Content-Type': 'application/json',
//                   },
//                   timeout: 5000,
//                 }
//               );
//               showSuccess('Post reported successfully. Thank you for keeping our community safe.');
//             } catch (err) {
//               console.error('Error reporting post:', err);
//               const errorMessage = err.response?.data?.message || 'Failed to report post';
//               showError(errorMessage);
//             }
//           }
//         }
//       ]
//     );
//   };

//   const postComment = async (content, parentId = null) => {
//     const trimmedContent = content.trim();
//     if (!trimmedContent) {
//       showError('Please enter a comment');
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         showError('Authentication required');
//         return;
//       }

//       // await axios.post(`http://127.0.0.1:8000/api/posts/${id}/comments/`, {
//       // await axios.post(`http://192.168.220.16:8000/api/posts/${id}/comments/`, {
//       await axios.post(`http://192.168.130.16:8000/api/posts/${id}/comments/`, {
//         content: trimmedContent,
//         parent: parentId
//       }, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000,
//       });
      
//       if (!parentId) {
//         setNewComment('');
//       }
//       await fetchDetail();
//       showSuccess(parentId ? 'Reply posted successfully!' : 'Comment posted successfully!');
//     } catch (err) {
//       console.error('Error posting comment:', err);
//       const errorMessage = err.response?.data?.message || 
//                           err.response?.data?.error || 
//                           'Failed to post comment. Please try again.';
//       showError(errorMessage);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const formatTimeAgo = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now - date) / 1000);
    
//     if (diffInSeconds < 60) return 'Just now';
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
//     return `${Math.floor(diffInSeconds / 86400)}d ago`;
//   };

//   if (loading && !post) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
//         {/* Header with back button */}
//         <View style={styles.headerBar}>
//           <TouchableOpacity onPress={handleBack} style={styles.backButton}>
//             <Ionicons name="arrow-back" size={24} color="#007AFF" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Post Details</Text>
//           <View style={styles.headerRight} />
//         </View>

//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading post...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (error && !post) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
//         {/* Header with back button */}
//         <View style={styles.headerBar}>
//           <TouchableOpacity onPress={handleBack} style={styles.backButton}>
//             <Ionicons name="arrow-back" size={24} color="#007AFF" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Post Details</Text>
//           <View style={styles.headerRight} />
//         </View>

//         <View style={styles.errorContainer}>
//           <Ionicons name="alert-circle-outline" size={64} color="#ff3b30" />
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={() => fetchDetail()}>
//             <Ionicons name="refresh" size={20} color="#ffffff" />
//             <Text style={styles.retryText}>Try Again</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (!post) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
//         {/* Header with back button */}
//         <View style={styles.headerBar}>
//           <TouchableOpacity onPress={handleBack} style={styles.backButton}>
//             <Ionicons name="arrow-back" size={24} color="#007AFF" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Post Details</Text>
//           <View style={styles.headerRight} />
//         </View>

//         <View style={styles.errorContainer}>
//           <Ionicons name="document-outline" size={64} color="#8e8e93" />
//           <Text style={styles.errorText}>Post not found</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
//             <Ionicons name="arrow-back" size={20} color="#ffffff" />
//             <Text style={styles.retryText}>Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
//       {/* Header with back button */}
//       <View style={styles.headerBar}>
//         <TouchableOpacity onPress={handleBack} style={styles.backButton}>
//           <Ionicons name="arrow-back" size={24} color="#007AFF" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Post Details</Text>
//         <View style={styles.headerRight} />
//       </View>

//       <KeyboardAvoidingView 
//         style={styles.keyboardContainer} 
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         <ScrollView 
//           style={styles.scrollContainer}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={['#007AFF']}
//               tintColor="#007AFF"
//             />
//           }
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.scrollContent}
//         >
//           {/* Post Header */}
//           <View style={styles.header}>
//             <Image 
//               source={{ 
//                 uri: getProfilePictureUri(post.author) || 'https://via.placeholder.com/50/007AFF/white?text=U' 
//                 // uri: post.author_avatar || 'https://via.placeholder.com/50/007AFF/white?text=U' 
//               }} 
//               style={styles.avatar}
//               defaultSource={{
//                 uri: 'https://via.placeholder.com/50/007AFF/white?text=U'
//               }}
//             />
//             <View style={styles.headerContent}>
//               <Text style={styles.title}>{post.title}</Text>
//               <View style={styles.metaRow}>
//                 <Ionicons name="person-outline" size={14} color="#8e8e93" />
//                 <Text style={styles.meta}>{post.author_name || 'Anonymous'}</Text>
//                 <Text style={styles.metaDot}>•</Text>
//                 <Ionicons name="time-outline" size={14} color="#8e8e93" />
//                 <Text style={styles.metaTime}>{formatTimeAgo(post.created_at)}</Text>
//                 {post.category && (
//                   <>
//                     <Text style={styles.metaDot}>•</Text>
//                     <Ionicons name="folder-outline" size={14} color="#007AFF" />
//                     <Text style={styles.metaCategory}>{post.category}</Text>
//                   </>
//                 )}
//               </View>
//             </View>
//           </View>

//           {/* Post Content */}
//           <View style={styles.contentContainer}>
//             <Text style={styles.content}>{post.content}</Text>
            
//             {/* Post Image */}
//             {post.image && (
//               <View style={styles.imageContainer}>
//                 <Image
//                   source={{ uri: getImageUrl(post.image) }}
//                   style={styles.postImage}
//                   resizeMode="cover"
//                   onError={(error) => {
//                     console.log('Image load error:', error.nativeEvent.error);
//                   }}
//                 />
//               </View>
//             )}
//           </View>

//           {/* Post Actions */}
//           <View style={styles.postActions}>
//             <TouchableOpacity 
//               style={[styles.actionButton, isLiked && styles.likedButton]}
//               onPress={handleLike}
//               activeOpacity={0.7}
//             >
//               <Ionicons 
//                 name={isLiked ? "heart" : "heart-outline"} 
//                 size={20} 
//                 color={isLiked ? "#ffffff" : "#ff3b30"} 
//               />
//               <Text style={[styles.likeText, isLiked && styles.likedText]}>
//                 {likesCount}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.reportButton}
//               onPress={handleReport}
//               activeOpacity={0.7}
//             >
//               <Ionicons name="flag-outline" size={20} color="#ff3b30" />
//               <Text style={styles.reportText}>Report</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Comments Section */}
//           <View style={styles.commentsSection}>
//             <View style={styles.commentsSectionHeader}>
//               <Ionicons name="chatbubbles-outline" size={24} color="#1a1a1a" />
//               <Text style={styles.sectionTitle}>
//                 Comments ({comments.length})
//               </Text>
//             </View>
            
//             {comments.length === 0 ? (
//               <View style={styles.noCommentsContainer}>
//                 <Ionicons name="chatbubble-outline" size={48} color="#c7c7cc" />
//                 <Text style={styles.noCommentsText}>No comments yet</Text>
//                 <Text style={styles.noCommentsSubtext}>Be the first to share your thoughts!</Text>
//               </View>
//             ) : (
//               comments.map((comment) => (
//                 <CommentItem 
//                   key={comment.id} 
//                   comment={comment} 
//                   onReply={postComment}
//                 />
//               ))
//             )}
//           </View>
//         </ScrollView>

//         {/* Comment Input */}
//         <View style={styles.commentInputContainer}>
//           <View style={styles.inputContainer}>
//             <TextInput
//               placeholder="Share your thoughts..."
//               placeholderTextColor="#8e8e93"
//               value={newComment}
//               onChangeText={setNewComment}
//               style={styles.input}
//               multiline
//               textAlignVertical="top"
//               maxLength={500}
//             />
//             <View style={styles.inputFooter}>
//               <Text style={styles.characterCount}>
//                 {newComment.length}/500
//               </Text>
//               <TouchableOpacity 
//                 style={[styles.btnPost, (!newComment.trim() || submitting) && styles.disabledButton]} 
//                 onPress={() => postComment(newComment)}
//                 disabled={!newComment.trim() || submitting}
//                 activeOpacity={0.8}
//               >
//                 {submitting ? (
//                   <ActivityIndicator size="small" color="#ffffff" />
//                 ) : (
//                   <>
//                     <Ionicons name="send" size={16} color="#ffffff" />
//                     <Text style={styles.btnText}>Post</Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </KeyboardAvoidingView>

//       {/* Toast Messages */}
//       <ErrorToast 
//         message={toastMessage}
//         visible={showErrorToast}
//         onHide={() => setShowErrorToast(false)}
//       />
//       <SuccessToast 
//         message={toastMessage}
//         visible={showSuccessToast}
//         onHide={() => setShowSuccessToast(false)}
//       />
//     </SafeAreaView>
//   );
// }


































import React, { useEffect, useState, useCallback } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ConnectionAPI from '../api/connectionService'; // Adjust path as needed

const { width } = Dimensions.get('window');

// const getProfilePictureUri = (user) => {
//   if (user?.profile_picture) {
//     // Check if it's already a full URL
//     if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
//       return user.profile_picture;
//     }
    
//     // Use the base URL from ConnectionAPI
//     const API_BASE_URL = ConnectionAPI.getBaseUrl();
    
//     // Clean up the path
//     const cleanPath = user.profile_picture.startsWith('/') 
//       ? user.profile_picture 
//       : `/${user.profile_picture}`;
    
//     return `${API_BASE_URL}${cleanPath}`;
//   }
  
//   // Fallback to username-based avatar
//   return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=10b981&color=fff&size=128`;
// };

// Error Toast Component
const ErrorToast = ({ message, visible, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.errorToast, { opacity: fadeAnim }]}>
      <Ionicons name="alert-circle" size={20} color="#ffffff" />
      <Text style={styles.errorToastText}>{message}</Text>
    </Animated.View>
  );
};

// Success Toast Component
const SuccessToast = ({ message, visible, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.successToast, { opacity: fadeAnim }]}>
      <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
      <Text style={styles.successToastText}>{message}</Text>
    </Animated.View>
  );
};

const CommentItem = ({
  comment, 
  onReply,
  level = 0
}: { 
  comment: any; 
  onReply: (text: string, parentId: number) => void;
  level?: number;
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onReply(replyText, comment.id);
      setReplyText('');
      setShowReplyInput(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <View style={[
      styles.commentBlock,
      { 
        marginLeft: level * 16, 
        marginBottom: level === 0 ? 16 : 8,
        borderLeftWidth: level > 0 ? 2 : 0,
        borderLeftColor: level > 0 ? '#e0e0e0' : 'transparent',
        paddingLeft: level > 0 ? 12 : 16
      }
    ]}>
      <View style={styles.commentHeader}>
        <Image 
          source={{ 
            uri: ConnectionAPI.getUserProfilePicture(comment.author_avatar) || 'https://via.placeholder.com/32/007AFF/white?text=U' 
          }} 
          style={styles.commentAvatar}
          defaultSource={{
            uri: 'https://via.placeholder.com/32/007AFF/white?text=U'
          }}
        />
        <View style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>{comment.author_name || 'Anonymous'}</Text>
          <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
        </View>
      </View>
      
      <Text style={styles.commentContent}>{comment.content}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity 
          onPress={() => setShowReplyInput(!showReplyInput)}
          style={styles.replyButton}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={showReplyInput ? "close" : "chatbubble-outline"} 
            size={16} 
            color="#007AFF" 
          />
          <Text style={styles.replyBtnText}>
            {showReplyInput ? 'Cancel' : 'Reply'}
          </Text>
        </TouchableOpacity>
        
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesCountContainer}>
            <Ionicons name="chatbubbles-outline" size={14} color="#8e8e93" />
            <Text style={styles.repliesCount}>
              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </Text>
          </View>
        )}
      </View>

      {showReplyInput && (
        <View style={styles.replyInputContainer}>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Write a reply..."
            placeholderTextColor="#8e8e93"
            style={styles.replyInput}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <View style={styles.replyInputFooter}>
            <Text style={styles.characterCount}>{replyText.length}/500</Text>
            <View style={styles.replyActions}>
              <TouchableOpacity 
                onPress={() => {
                  setShowReplyInput(false);
                  setReplyText('');
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleReply}
                style={[styles.submitReplyButton, (!replyText.trim() || isSubmitting) && styles.disabledButton]}
                disabled={!replyText.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="send" size={14} color="#ffffff" />
                    <Text style={styles.submitReplyText}>Reply</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {comment.replies?.map((reply) => (
        <CommentItem 
          key={reply.id} 
          comment={reply} 
          onReply={onReply}
          level={level + 1}
        />
      ))}
    </View>
  );
};

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchDetail();
  }, []);

  // Show error toast
  const showError = (message) => {
    setToastMessage(message);
    setShowErrorToast(true);
  };

  // Show success toast
  const showSuccess = (message) => {
    setToastMessage(message);
    setShowSuccessToast(true);
  };

  // Helper function to get full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${ConnectionAPI.getBaseUrl()}${imageUrl}`;
  };

  const fetchDetail = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      // Use ConnectionAPI to fetch post details
      const postData = await ConnectionAPI.getPostById(id);
      
      setPost(postData);
      setComments(postData.comments || []);
      setLikesCount(postData.likes_count || 0);
      setIsLiked(postData.is_liked || false);
    } catch (err) {
      console.error('Error fetching post detail:', err);
      const errorMessage = err.message || 'Failed to load post details. Please check your connection.';
      setError(errorMessage);
      if (!isRefresh) {
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail(true);
  }, []);

  const handleBack = () => {
    router.push('/auth/forum');
  };

  const handleLike = async () => {
    try {
      // Optimistic update
      const newIsLiked = !isLiked;
      const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);

      // Use ConnectionAPI to like/unlike post
      await ConnectionAPI.likePost(id);
      
    } catch (err) {
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount + 1 : likesCount - 1);
      
      console.error('Error liking post:', err);
      const errorMessage = err.message || 'Failed to update like status';
      showError(errorMessage);
    }
  };

  const handleReport = async () => {
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post for violating community guidelines?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Use ConnectionAPI to report post
              await ConnectionAPI.reportPost(id);
              showSuccess('Post reported successfully. Thank you for keeping our community safe.');
            } catch (err) {
              console.error('Error reporting post:', err);
              const errorMessage = err.message || 'Failed to report post';
              showError(errorMessage);
            }
          }
        }
      ]
    );
  };

  const postComment = async (content, parentId = null) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      showError('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      // Use ConnectionAPI to post comment
      const commentData = {
        content: trimmedContent,
        parent: parentId
      };
      
      await ConnectionAPI.commentOnPost(id, commentData);
      
      if (!parentId) {
        setNewComment('');
      }
      await fetchDetail();
      showSuccess(parentId ? 'Reply posted successfully!' : 'Comment posted successfully!');
    } catch (err) {
      console.error('Error posting comment:', err);
      const errorMessage = err.message || 'Failed to post comment. Please try again.';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading && !post) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Header with back button */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Details</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !post) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Header with back button */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Details</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff3b30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDetail()}>
            <Ionicons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Header with back button */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Details</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={64} color="#8e8e93" />
          <Text style={styles.errorText}>Post not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header with back button */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Details</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Post Header */}
          <View style={styles.header}>
            <Image 
              source={{ 
                uri: ConnectionAPI.getUserProfilePicture(post.author_avatar) || 'https://via.placeholder.com/50/007AFF/white?text=U' 
              }} 
              style={styles.avatar}
              defaultSource={{
                uri: 'https://via.placeholder.com/50/007AFF/white?text=U'
              }}
            />
            <View style={styles.headerContent}>
              <Text style={styles.title}>{post.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color="#8e8e93" />
                <Text style={styles.meta}>{post.author_name || 'Anonymous'}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Ionicons name="time-outline" size={14} color="#8e8e93" />
                <Text style={styles.metaTime}>{formatTimeAgo(post.created_at)}</Text>
                {post.category && (
                  <>
                    <Text style={styles.metaDot}>•</Text>
                    <Ionicons name="folder-outline" size={14} color="#007AFF" />
                    <Text style={styles.metaCategory}>{post.category}</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Post Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.content}>{post.content}</Text>
            
            {/* Post Image */}
            {post.image && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: getImageUrl(post.image) }}
                  style={styles.postImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log('Image load error:', error.nativeEvent.error);
                  }}
                />
              </View>
            )}
          </View>

          {/* Post Actions */}
          <View style={styles.postActions}>
            <TouchableOpacity 
              style={[styles.actionButton, isLiked && styles.likedButton]}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={20} 
                color={isLiked ? "#ffffff" : "#ff3b30"} 
              />
              <Text style={[styles.likeText, isLiked && styles.likedText]}>
                {likesCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={handleReport}
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={20} color="#ff3b30" />
              <Text style={styles.reportText}>Report</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsSectionHeader}>
              <Ionicons name="chatbubbles-outline" size={24} color="#1a1a1a" />
              <Text style={styles.sectionTitle}>
                Comments ({comments.length})
              </Text>
            </View>
            
            {comments.length === 0 ? (
              <View style={styles.noCommentsContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#c7c7cc" />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to share your thoughts!</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  onReply={postComment}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Share your thoughts..."
              placeholderTextColor="#8e8e93"
              value={newComment}
              onChangeText={setNewComment}
              style={styles.input}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <View style={styles.inputFooter}>
              <Text style={styles.characterCount}>
                {newComment.length}/500
              </Text>
              <TouchableOpacity 
                style={[styles.btnPost, (!newComment.trim() || submitting) && styles.disabledButton]} 
                onPress={() => postComment(newComment)}
                disabled={!newComment.trim() || submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#ffffff" />
                    <Text style={styles.btnText}>Post</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Toast Messages */}
      <ErrorToast 
        message={toastMessage}
        visible={showErrorToast}
        onHide={() => setShowErrorToast(false)}
      />
      <SuccessToast 
        message={toastMessage}
        visible={showSuccessToast}
        onHide={() => setShowSuccessToast(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  keyboardContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerRight: {
    width: 40, // Same width as back button for centering
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8e8e93',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 16,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: { 
    width: 54, 
    height: 54, 
    borderRadius: 27, 
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  headerContent: {
    flex: 1,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 26,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  meta: { 
    color: '#8e8e93',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  metaDot: {
    fontSize: 14,
    color: '#c7c7cc',
    marginHorizontal: 6,
  },
  metaTime: {
    color: '#8e8e93',
    fontSize: 14,
    marginLeft: 4,
  },
  metaCategory: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  contentContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: { 
    fontSize: 16, 
    lineHeight: 24,
    color: '#1a1a1a',
  },
  imageContainer: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  postActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff3b30',
    gap: 6,
  },
  likedButton: {
    backgroundColor: '#ff3b30',
    borderColor: '#ff3b30',
  },
  likeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
  likedText: {
    color: '#ffffff',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff3b30',
    backgroundColor: 'transparent',
    gap: 6,
  },
  reportText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
  commentsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  noCommentsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8e8e93',
    marginTop: 12,
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#c7c7cc',
    textAlign: 'center',
  },
  commentBlock: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#e0e0e0',
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#8e8e93',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  replyBtnText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  repliesCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repliesCount: {
    fontSize: 12,
    color: '#8e8e93',
  },
  replyInputContainer: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  replyInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1a1a1a',
    minHeight: 40,
    maxHeight: 100,
  },
  replyInputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  characterCount: {
    fontSize: 12,
    color: '#8e8e93',
  },
  replyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '500',
  },
  submitReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    gap: 4,
  },
  submitReplyText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  commentInputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 44,
    maxHeight: 120,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  btnPost: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorToast: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  errorToastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  successToast: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  successToastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

































































// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View, 
//   Text, 
//   StyleSheet, 
//   Image, 
//   TextInput, 
//   TouchableOpacity, 
//   Alert, 
//   ScrollView,
//   ActivityIndicator,
//   RefreshControl,
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   Dimensions
// } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');

// const CommentItem = ({
//   comment, 
//   onReply,
//   level = 0
// }: { 
//   comment: any; 
//   onReply: (text: string, parentId: number) => void;
//   level?: number;
// }) => {
//   const [replyText, setReplyText] = useState('');
//   const [showReplyInput, setShowReplyInput] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleReply = async () => {
//     if (!replyText.trim()) {
//       Alert.alert('Error', 'Please enter a reply');
//       return;
//     }
    
//     setIsSubmitting(true);
//     try {
//       await onReply(replyText, comment.id);
//       setReplyText('');
//       setShowReplyInput(false);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to post reply');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const formatTimeAgo = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now - date) / 1000);
    
//     if (diffInSeconds < 60) return 'Just now';
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
//     return `${Math.floor(diffInSeconds / 86400)}d ago`;
//   };

//   return (
//     <View style={[
//       styles.commentBlock,
//       { marginLeft: level * 20, marginBottom: level === 0 ? 16 : 8 }
//     ]}>
//       <View style={styles.commentHeader}>
//         <Image 
//           source={{ 
//             uri: comment.author_avatar || 'https://via.placeholder.com/30/007AFF/white?text=U' 
//           }} 
//           style={styles.commentAvatar}
//           defaultSource={{
//             uri: 'https://via.placeholder.com/30/007AFF/white?text=U'
//           }}
//         />
//         <View style={styles.commentMeta}>
//           <Text style={styles.commentAuthor}>{comment.author_name || 'Anonymous'}</Text>
//           <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
//         </View>
//       </View>
      
//       <Text style={styles.commentContent}>{comment.content}</Text>
      
//       <View style={styles.commentActions}>
//         <TouchableOpacity 
//           onPress={() => setShowReplyInput(!showReplyInput)}
//           style={styles.replyButton}
//           activeOpacity={0.7}
//         >
//           <Text style={styles.replyBtnText}>
//             {showReplyInput ? 'Cancel' : 'Reply'}
//           </Text>
//         </TouchableOpacity>
        
//         {comment.replies && comment.replies.length > 0 && (
//           <Text style={styles.repliesCount}>
//             {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
//           </Text>
//         )}
//       </View>

//       {showReplyInput && (
//         <View style={styles.replyInputContainer}>
//           <TextInput
//             value={replyText}
//             onChangeText={setReplyText}
//             placeholder="Write a reply..."
//             style={styles.replyInput}
//             multiline
//             textAlignVertical="top"
//           />
//           <View style={styles.replyActions}>
//             <TouchableOpacity 
//               onPress={() => {
//                 setShowReplyInput(false);
//                 setReplyText('');
//               }}
//               style={styles.cancelButton}
//             >
//               <Text style={styles.cancelButtonText}>Cancel</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//               onPress={handleReply}
//               style={[styles.submitReplyButton, (!replyText.trim() || isSubmitting) && styles.disabledButton]}
//               disabled={!replyText.trim() || isSubmitting}
//             >
//               {isSubmitting ? (
//                 <ActivityIndicator size="small" color="#ffffff" />
//               ) : (
//                 <Text style={styles.submitReplyText}>Reply</Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}

//       {comment.replies?.map((reply) => (
//         <CommentItem 
//           key={reply.id} 
//           comment={reply} 
//           onReply={onReply}
//           level={level + 1}
//         />
//       ))}
//     </View>
//   );
// };

// export default function PostDetail() {
//   const { id } = useLocalSearchParams();
//   const router = useRouter();
//   const [post, setPost] = useState(null);
//   const [comments, setComments] = useState([]);
//   const [newComment, setNewComment] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchDetail();
//   }, []);

//   // Helper function to get full image URL
//   const getImageUrl = (imageUrl) => {
//     if (!imageUrl) return null;
//     // If it's already a full URL, return as is
//     if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
//       return imageUrl;
//     }
//     // Otherwise, prepend your base URL
//     return `http://127.0.0.1:8000${imageUrl}`;
//   };

//   const fetchDetail = async (isRefresh = false) => {
//     try {
//       if (!isRefresh) setLoading(true);
//       setError(null);

//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const response = await axios.get(`http://127.0.0.1:8000/api/posts/${id}/`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       setPost(response.data);
//       setComments(response.data.comments || []); // Fixed: get comments from response.data
//     } catch (err) {
//       console.error('Error fetching post detail:', err);
//       setError('Failed to load post details');
//       Alert.alert('Error', 'Failed to load post details');
//     } finally {
//       setLoading(false);
//       if (isRefresh) setRefreshing(false);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchDetail(true);
//   }, []);

//   const handleLike = async () => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         Alert.alert('Error', 'Authentication required');
//         return;
//       }

//       await axios.post(`http://127.0.0.1:8000/api/posts/${id}/like/`, {}, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       // Update post locally for immediate feedback
//       setPost(prevPost => ({
//         ...prevPost,
//         likes_count: (prevPost.likes_count || 0) + 1
//       }));
//     } catch (err) {
//       console.error('Error liking post:', err);
//       Alert.alert('Error', 'Failed to like post');
//     }
//   };

//   const handleReport = async () => {
//     Alert.alert(
//       'Report Post',
//       'Are you sure you want to report this post?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Report', 
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               const token = await AsyncStorage.getItem('access_token');
//               if (!token) {
//                 Alert.alert('Error', 'Authentication required');
//                 return;
//               }

//               await axios.post(`http://127.0.0.1:8000/api/posts/${id}/report/`, 
//                 { post_id: id },
//                 {
//                   headers: {
//                     Authorization: `Bearer ${token}`,
//                     'Content-Type': 'application/json',
//                   },
//                 }
//               );
//               Alert.alert('Success', 'Post reported successfully');
//             } catch (err) {
//               console.error('Error reporting post:', err);
//               Alert.alert('Error', 'Failed to report post');
//             }
//           }
//         }
//       ]
//     );
//   };

//   const postComment = async (content, parentId = null) => {
//     if (!content.trim()) {
//       Alert.alert('Error', 'Please enter a comment');
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         Alert.alert('Error', 'Authentication required');
//         return;
//       }

//       // Fixed: Use the correct endpoint and payload
//       await axios.post(`http://127.0.0.1:8000/api/posts/${id}/comments/`, {
//         content: content.trim(),
//         parent: parentId  // Only include parent if it's for a reply
//       }, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       if (!parentId) {
//         setNewComment('');
//       }
//       await fetchDetail(); // Refresh to get updated comments
//     } catch (err) {
//       console.error('Error posting comment:', err);
//       console.error('Error response:', err.response?.data); // Add this for debugging
//       Alert.alert('Error', 'Failed to post comment');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const formatTimeAgo = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now - date) / 1000);
    
//     if (diffInSeconds < 60) return 'Just now';
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
//     return `${Math.floor(diffInSeconds / 86400)}d ago`;
//   };

//   if (loading && !post) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading post...</Text>
//       </View>
//     );
//   }

//   if (error && !post) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => fetchDetail()}>
//           <Text style={styles.retryText}>Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   if (!post) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>Post not found</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
//           <Text style={styles.retryText}>Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView 
//       style={styles.container} 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <ScrollView 
//         style={styles.scrollContainer}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Post Header */}
//         <View style={styles.header}>
//           <Image 
//             source={{ 
//               uri: post.author_avatar || 'https://via.placeholder.com/50/007AFF/white?text=U' 
//             }} 
//             style={styles.avatar}
//             defaultSource={{
//               uri: 'https://via.placeholder.com/50/007AFF/white?text=U'
//             }}
//           />
//           <View style={styles.headerContent}>
//             <Text style={styles.title}>{post.title}</Text>
//             <View style={styles.metaRow}>
//               <Text style={styles.meta}>By {post.author_name || 'Anonymous'}</Text>
//               <Text style={styles.metaDot}>•</Text>
//               <Text style={styles.metaTime}>{formatTimeAgo(post.created_at)}</Text>
//               {post.category && (
//                 <>
//                   <Text style={styles.metaDot}>•</Text>
//                   <Text style={styles.metaCategory}>{post.category}</Text>
//                 </>
//               )}
//             </View>
//           </View>
//         </View>

//         {/* Post Content */}
//         <View style={styles.contentContainer}>
//           <Text style={styles.content}>{post.content}</Text>
          
//           {/* Post Image */}
//           {post.image && (
//             <View style={styles.imageContainer}>
//               <Image
//                 source={{ uri: getImageUrl(post.image) }}
//                 style={styles.postImage}
//                 resizeMode="cover"
//                 onError={(error) => {
//                   console.log('Image load error:', error.nativeEvent.error);
//                 }}
//                 onLoad={() => {
//                   console.log('Image loaded successfully');
//                 }}
//               />
//             </View>
//           )}
//         </View>

//         {/* Post Actions */}
//         <View style={styles.postActions}>
//           <TouchableOpacity 
//             style={styles.actionButton}
//             onPress={handleLike}
//             activeOpacity={0.7}
//           >
//             <Text style={styles.likeText}>❤️ {post.likes_count || 0}</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={styles.reportButton}
//             onPress={handleReport}
//             activeOpacity={0.7}
//           >
//             <Text style={styles.reportText}>🚩 Report</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Comments Section */}
//         <View style={styles.commentsSection}>
//           <Text style={styles.sectionTitle}>
//             Comments ({comments.length})
//           </Text>
          
//           {comments.length === 0 ? (
//             <View style={styles.noCommentsContainer}>
//               <Text style={styles.noCommentsText}>No comments yet</Text>
//               <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
//             </View>
//           ) : (
//             comments.map((comment) => (
//               <CommentItem 
//                 key={comment.id} 
//                 comment={comment} 
//                 onReply={postComment}
//               />
//             ))
//           )}
//         </View>
//       </ScrollView>

//       {/* Comment Input */}
//       <View style={styles.commentInputContainer}>
//         <TextInput
//           placeholder="Write a comment..."
//           value={newComment}
//           onChangeText={setNewComment}
//           style={styles.input}
//           multiline
//           textAlignVertical="top"
//           maxLength={500}
//         />
//         <View style={styles.inputActions}>
//           <Text style={styles.characterCount}>
//             {newComment.length}/500
//           </Text>
//           <TouchableOpacity 
//             style={[styles.btnPost, (!newComment.trim() || submitting) && styles.disabledButton]} 
//             onPress={() => postComment(newComment)}
//             disabled={!newComment.trim() || submitting}
//             activeOpacity={0.8}
//           >
//             {submitting ? (
//               <ActivityIndicator size="small" color="#ffffff" />
//             ) : (
//               <Text style={styles.btnText}>Post</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#f8f9fa' 
//   },
//   scrollContainer: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#8e8e93',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     padding: 20,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#ff3b30',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   header: { 
//     flexDirection: 'row', 
//     alignItems: 'flex-start',
//     marginBottom: 16,
//     backgroundColor: '#ffffff',
//     padding: 16,
//     borderRadius: 12,
//     marginHorizontal: 16,
//     marginTop: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   avatar: { 
//     width: 54, 
//     height: 54, 
//     borderRadius: 27, 
//     marginRight: 12,
//     backgroundColor: '#f0f0f0',
//   },
//   headerContent: {
//     flex: 1,
//   },
//   title: { 
//     fontSize: 20, 
//     fontWeight: '700',
//     color: '#1a1a1a',
//     lineHeight: 26,
//     marginBottom: 6,
//   },
//   metaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//   },
//   meta: { 
//     color: '#8e8e93',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   metaDot: {
//     fontSize: 14,
//     color: '#c7c7cc',
//     marginHorizontal: 6,
//   },
//   metaTime: {
//     color: '#8e8e93',
//     fontSize: 14,
//   },
//   metaCategory: {
//     color: '#007AFF',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   contentContainer: {
//     backgroundColor: '#ffffff',
//     marginHorizontal: 16,
//     marginBottom: 16,
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   content: { 
//     fontSize: 16, 
//     lineHeight: 24,
//     color: '#1a1a1a',
//   },
//   // New styles for post images
//   imageContainer: {
//     marginTop: 16,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   postImage: {
//     width: '100%',
//     height: 250,
//     backgroundColor: '#f0f0f0',
//   },
//   postActions: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//     marginBottom: 24,
//     backgroundColor: '#ffffff',
//     marginHorizontal: 16,
//     padding: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   actionButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     backgroundColor: '#f8f9fa',
//   },
//   likeText: {
//     fontSize: 16,
//     color: '#ff3b30',
//     fontWeight: '600',
//   },
//   reportButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//   },
//   reportText: { 
//     color: '#ff3b30',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   commentsSection: {
//     marginHorizontal: 16,
//     marginBottom: 16,
//   },
//   sectionTitle: { 
//     fontSize: 20, 
//     fontWeight: '700',
//     marginBottom: 16,
//     color: '#1a1a1a',
//   },
//   noCommentsContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//   },
//   noCommentsText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#8e8e93',
//     marginBottom: 4,
//   },
//   noCommentsSubtext: {
//     fontSize: 14,
//     color: '#c7c7cc',
//   },
//   commentBlock: { 
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   commentHeader: { 
//     flexDirection: 'row', 
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   commentAvatar: { 
//     width: 32, 
//     height: 32, 
//     borderRadius: 16, 
//     marginRight: 10,
//     backgroundColor: '#f0f0f0',
//   },
//   commentMeta: {
//     flex: 1,
//   },
//   commentAuthor: { 
//     fontWeight: '600',
//     color: '#1a1a1a',
//     fontSize: 15,
//   },
//   commentTime: {
//     fontSize: 12,
//     color: '#8e8e93',
//     marginTop: 2,
//   },
//   commentContent: { 
//     marginTop: 4, 
//     fontSize: 15,
//     lineHeight: 20,
//     color: '#3a3a3c',
//   },
//   commentActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 10,
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//   },
//   replyButton: {
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     marginRight: 12,
//   },
//   replyBtnText: { 
//     color: '#007AFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   repliesCount: {
//     fontSize: 12,
//     color: '#8e8e93',
//   },
//   replyInputContainer: {
//     marginTop: 12,
//     padding: 12,
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//   },
//   replyInput: { 
//     borderWidth: 1, 
//     borderColor: '#e0e0e0', 
//     borderRadius: 8, 
//     padding: 12,
//     fontSize: 15,
//     backgroundColor: '#ffffff',
//     minHeight: 60,
//     textAlignVertical: 'top',
//   },
//   replyActions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//     marginTop: 12,
//     gap: 8,
//   },
//   cancelButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 6,
//     backgroundColor: '#f0f0f0',
//   },
//   cancelButtonText: {
//     color: '#8e8e93',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   submitReplyButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 6,
//     backgroundColor: '#007AFF',
//     minWidth: 60,
//     alignItems: 'center',
//   },
//   submitReplyText: {
//     color: '#ffffff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   disabledButton: {
//     opacity: 0.5,
//   },
//   commentInputContainer: { 
//     backgroundColor: '#ffffff',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//   },
//   input: { 
//     borderWidth: 1, 
//     borderColor: '#e0e0e0', 
//     borderRadius: 8, 
//     padding: 12,
//     fontSize: 16,
//     backgroundColor: '#f8f9fa',
//     minHeight: 60,
//     maxHeight: 120,
//     textAlignVertical: 'top',
//   },
//   inputActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   characterCount: {
//     fontSize: 12,
//     color: '#8e8e93',
//   },
//   btnPost: { 
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//     minWidth: 70,
//     alignItems: 'center',
//   },
//   btnText: { 
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });































































// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View, 
//   Text, 
//   StyleSheet, 
//   Image, 
//   TextInput, 
//   TouchableOpacity, 
//   Alert, 
//   ScrollView,
//   ActivityIndicator,
//   RefreshControl,
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   Dimensions
// } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');

// const CommentItem = ({
//   comment, 
//   onReply,
//   level = 0
// }: { 
//   comment: any; 
//   onReply: (text: string, parentId: number) => void;
//   level?: number;
// }) => {
//   const [replyText, setReplyText] = useState('');
//   const [showReplyInput, setShowReplyInput] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleReply = async () => {
//     if (!replyText.trim()) {
//       Alert.alert('Error', 'Please enter a reply');
//       return;
//     }
    
//     setIsSubmitting(true);
//     try {
//       await onReply(replyText, comment.id);
//       setReplyText('');
//       setShowReplyInput(false);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to post reply');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const formatTimeAgo = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now - date) / 1000);
    
//     if (diffInSeconds < 60) return 'Just now';
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
//     return `${Math.floor(diffInSeconds / 86400)}d ago`;
//   };

//   return (
//     <View style={[
//       styles.commentBlock,
//       { marginLeft: level * 20, marginBottom: level === 0 ? 16 : 8 }
//     ]}>
//       <View style={styles.commentHeader}>
//         <Image 
//           source={{ 
//             uri: comment.author_avatar || 'https://via.placeholder.com/30/007AFF/white?text=U' 
//           }} 
//           style={styles.commentAvatar}
//           defaultSource={{
//             uri: 'https://via.placeholder.com/30/007AFF/white?text=U'
//           }}
//         />
//         <View style={styles.commentMeta}>
//           <Text style={styles.commentAuthor}>{comment.author_name || 'Anonymous'}</Text>
//           <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
//         </View>
//       </View>
      
//       <Text style={styles.commentContent}>{comment.content}</Text>
      
//       <View style={styles.commentActions}>
//         <TouchableOpacity 
//           onPress={() => setShowReplyInput(!showReplyInput)}
//           style={styles.replyButton}
//           activeOpacity={0.7}
//         >
//           <Text style={styles.replyBtnText}>
//             {showReplyInput ? 'Cancel' : 'Reply'}
//           </Text>
//         </TouchableOpacity>
        
//         {comment.replies && comment.replies.length > 0 && (
//           <Text style={styles.repliesCount}>
//             {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
//           </Text>
//         )}
//       </View>

//       {showReplyInput && (
//         <View style={styles.replyInputContainer}>
//           <TextInput
//             value={replyText}
//             onChangeText={setReplyText}
//             placeholder="Write a reply..."
//             style={styles.replyInput}
//             multiline
//             textAlignVertical="top"
//           />
//           <View style={styles.replyActions}>
//             <TouchableOpacity 
//               onPress={() => {
//                 setShowReplyInput(false);
//                 setReplyText('');
//               }}
//               style={styles.cancelButton}
//             >
//               <Text style={styles.cancelButtonText}>Cancel</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//               onPress={handleReply}
//               style={[styles.submitReplyButton, (!replyText.trim() || isSubmitting) && styles.disabledButton]}
//               disabled={!replyText.trim() || isSubmitting}
//             >
//               {isSubmitting ? (
//                 <ActivityIndicator size="small" color="#ffffff" />
//               ) : (
//                 <Text style={styles.submitReplyText}>Reply</Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}

//       {comment.replies?.map((reply) => (
//         <CommentItem 
//           key={reply.id} 
//           comment={reply} 
//           onReply={onReply}
//           level={level + 1}
//         />
//       ))}
//     </View>
//   );
// };

// export default function PostDetail() {
//   const { id } = useLocalSearchParams();
//   const router = useRouter();
//   const [post, setPost] = useState(null);
//   const [comments, setComments] = useState([]);
//   const [newComment, setNewComment] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchDetail();
//   }, []);

//   const fetchDetail = async (isRefresh = false) => {
//     try {
//       if (!isRefresh) setLoading(true);
//       setError(null);

//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const response = await axios.get(`http://127.0.0.1:8000/api/posts/${id}/`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       setPost(response.data);
//       setComments(response.data.comments || []); // Fixed: get comments from response.data
//     } catch (err) {
//       console.error('Error fetching post detail:', err);
//       setError('Failed to load post details');
//       Alert.alert('Error', 'Failed to load post details');
//     } finally {
//       setLoading(false);
//       if (isRefresh) setRefreshing(false);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchDetail(true);
//   }, []);

//   const handleLike = async () => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         Alert.alert('Error', 'Authentication required');
//         return;
//       }

//       await axios.post(`http://127.0.0.1:8000/api/posts/${id}/like/`, {}, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       // Update post locally for immediate feedback
//       setPost(prevPost => ({
//         ...prevPost,
//         likes_count: (prevPost.likes_count || 0) + 1
//       }));
//     } catch (err) {
//       console.error('Error liking post:', err);
//       Alert.alert('Error', 'Failed to like post');
//     }
//   };

//   const handleReport = async () => {
//     Alert.alert(
//       'Report Post',
//       'Are you sure you want to report this post?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Report', 
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               const token = await AsyncStorage.getItem('access_token');
//               if (!token) {
//                 Alert.alert('Error', 'Authentication required');
//                 return;
//               }

//               await axios.post(`http://127.0.0.1:8000/api/posts/${id}/report/`, 
//                 { post_id: id },
//                 {
//                   headers: {
//                     Authorization: `Bearer ${token}`,
//                     'Content-Type': 'application/json',
//                   },
//                 }
//               );
//               Alert.alert('Success', 'Post reported successfully');
//             } catch (err) {
//               console.error('Error reporting post:', err);
//               Alert.alert('Error', 'Failed to report post');
//             }
//           }
//         }
//       ]
//     );
//   };

//   // const postComment = async (content, parentId = null) => {
//   //   if (!content.trim()) {
//   //     Alert.alert('Error', 'Please enter a comment');
//   //     return;
//   //   }

//   //   setSubmitting(true);
//   //   try {
//   //     const token = await AsyncStorage.getItem('access_token');
//   //     if (!token) {
//   //       Alert.alert('Error', 'Authentication required');
//   //       return;
//   //     }

//   //     // await axios.post(`http://127.0.0.1:8000/api/posts/${id}/comments/`, {
//   //     await axios.post('http://127.0.0.1:8000/api/comments/', {
//   //       post: id,
//   //       content: content.trim(),
//   //       parent: parentId
//   //     }, {
//   //       headers: {
//   //         Authorization: `Bearer ${token}`,
//   //         'Content-Type': 'application/json',
//   //       },
//   //     });
      
//   //     if (!parentId) {
//   //       setNewComment('');
//   //     }
//   //     await fetchDetail(); // Refresh to get updated comments
//   //   } catch (err) {
//   //     console.error('Error posting comment:', err);
//   //     Alert.alert('Error', 'Failed to post comment');
//   //   } finally {
//   //     setSubmitting(false);
//   //   }
//   // };


//   const postComment = async (content, parentId = null) => {
//     if (!content.trim()) {
//       Alert.alert('Error', 'Please enter a comment');
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         Alert.alert('Error', 'Authentication required');
//         return;
//       }

//       // Fixed: Use the correct endpoint and payload
//       await axios.post(`http://127.0.0.1:8000/api/posts/${id}/comments/`, {
//         content: content.trim(),
//         parent: parentId  // Only include parent if it's for a reply
//       }, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       if (!parentId) {
//         setNewComment('');
//       }
//       await fetchDetail(); // Refresh to get updated comments
//     } catch (err) {
//       console.error('Error posting comment:', err);
//       console.error('Error response:', err.response?.data); // Add this for debugging
//       Alert.alert('Error', 'Failed to post comment');
//     } finally {
//       setSubmitting(false);
//     }
//   };










//   const formatTimeAgo = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now - date) / 1000);
    
//     if (diffInSeconds < 60) return 'Just now';
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
//     return `${Math.floor(diffInSeconds / 86400)}d ago`;
//   };

//   if (loading && !post) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading post...</Text>
//       </View>
//     );
//   }

//   if (error && !post) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => fetchDetail()}>
//           <Text style={styles.retryText}>Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   if (!post) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>Post not found</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
//           <Text style={styles.retryText}>Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView 
//       style={styles.container} 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <ScrollView 
//         style={styles.scrollContainer}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Post Header */}
//         <View style={styles.header}>
//           <Image 
//             source={{ 
//               uri: post.author_avatar || 'https://via.placeholder.com/50/007AFF/white?text=U' 
//             }} 
//             style={styles.avatar}
//             defaultSource={{
//               uri: 'https://via.placeholder.com/50/007AFF/white?text=U'
//             }}
//           />
//           <View style={styles.headerContent}>
//             <Text style={styles.title}>{post.title}</Text>
//             <View style={styles.metaRow}>
//               <Text style={styles.meta}>By {post.author_name || 'Anonymous'}</Text>
//               <Text style={styles.metaDot}>•</Text>
//               <Text style={styles.metaTime}>{formatTimeAgo(post.created_at)}</Text>
//               {post.category && (
//                 <>
//                   <Text style={styles.metaDot}>•</Text>
//                   <Text style={styles.metaCategory}>{post.category}</Text>
//                 </>
//               )}
//             </View>
//           </View>
//         </View>

//         {/* Post Content */}
//         <View style={styles.contentContainer}>
//           <Text style={styles.content}>{post.content}</Text>
//         </View>

//         {/* Post Actions */}
//         <View style={styles.postActions}>
//           <TouchableOpacity 
//             style={styles.actionButton}
//             onPress={handleLike}
//             activeOpacity={0.7}
//           >
//             <Text style={styles.likeText}>❤️ {post.likes_count || 0}</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={styles.reportButton}
//             onPress={handleReport}
//             activeOpacity={0.7}
//           >
//             <Text style={styles.reportText}>🚩 Report</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Comments Section */}
//         <View style={styles.commentsSection}>
//           <Text style={styles.sectionTitle}>
//             Comments ({comments.length})
//           </Text>
          
//           {comments.length === 0 ? (
//             <View style={styles.noCommentsContainer}>
//               <Text style={styles.noCommentsText}>No comments yet</Text>
//               <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
//             </View>
//           ) : (
//             comments.map((comment) => (
//               <CommentItem 
//                 key={comment.id} 
//                 comment={comment} 
//                 onReply={postComment}
//               />
//             ))
//           )}
//         </View>
//       </ScrollView>

//       {/* Comment Input */}
//       <View style={styles.commentInputContainer}>
//         <TextInput
//           placeholder="Write a comment..."
//           value={newComment}
//           onChangeText={setNewComment}
//           style={styles.input}
//           multiline
//           textAlignVertical="top"
//           maxLength={500}
//         />
//         <View style={styles.inputActions}>
//           <Text style={styles.characterCount}>
//             {newComment.length}/500
//           </Text>
//           <TouchableOpacity 
//             style={[styles.btnPost, (!newComment.trim() || submitting) && styles.disabledButton]} 
//             onPress={() => postComment(newComment)}
//             disabled={!newComment.trim() || submitting}
//             activeOpacity={0.8}
//           >
//             {submitting ? (
//               <ActivityIndicator size="small" color="#ffffff" />
//             ) : (
//               <Text style={styles.btnText}>Post</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#f8f9fa' 
//   },
//   scrollContainer: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#8e8e93',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     padding: 20,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#ff3b30',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   header: { 
//     flexDirection: 'row', 
//     alignItems: 'flex-start',
//     marginBottom: 16,
//     backgroundColor: '#ffffff',
//     padding: 16,
//     borderRadius: 12,
//     marginHorizontal: 16,
//     marginTop: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   avatar: { 
//     width: 54, 
//     height: 54, 
//     borderRadius: 27, 
//     marginRight: 12,
//     backgroundColor: '#f0f0f0',
//   },
//   headerContent: {
//     flex: 1,
//   },
//   title: { 
//     fontSize: 20, 
//     fontWeight: '700',
//     color: '#1a1a1a',
//     lineHeight: 26,
//     marginBottom: 6,
//   },
//   metaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//   },
//   meta: { 
//     color: '#8e8e93',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   metaDot: {
//     fontSize: 14,
//     color: '#c7c7cc',
//     marginHorizontal: 6,
//   },
//   metaTime: {
//     color: '#8e8e93',
//     fontSize: 14,
//   },
//   metaCategory: {
//     color: '#007AFF',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   contentContainer: {
//     backgroundColor: '#ffffff',
//     marginHorizontal: 16,
//     marginBottom: 16,
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   content: { 
//     fontSize: 16, 
//     lineHeight: 24,
//     color: '#1a1a1a',
//   },
//   postActions: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//     marginBottom: 24,
//     backgroundColor: '#ffffff',
//     marginHorizontal: 16,
//     padding: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   actionButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     backgroundColor: '#f8f9fa',
//   },
//   likeText: {
//     fontSize: 16,
//     color: '#ff3b30',
//     fontWeight: '600',
//   },
//   reportButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//   },
//   reportText: { 
//     color: '#ff3b30',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   commentsSection: {
//     marginHorizontal: 16,
//     marginBottom: 16,
//   },
//   sectionTitle: { 
//     fontSize: 20, 
//     fontWeight: '700',
//     marginBottom: 16,
//     color: '#1a1a1a',
//   },
//   noCommentsContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//   },
//   noCommentsText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#8e8e93',
//     marginBottom: 4,
//   },
//   noCommentsSubtext: {
//     fontSize: 14,
//     color: '#c7c7cc',
//   },
//   commentBlock: { 
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   commentHeader: { 
//     flexDirection: 'row', 
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   commentAvatar: { 
//     width: 32, 
//     height: 32, 
//     borderRadius: 16, 
//     marginRight: 10,
//     backgroundColor: '#f0f0f0',
//   },
//   commentMeta: {
//     flex: 1,
//   },
//   commentAuthor: { 
//     fontWeight: '600',
//     color: '#1a1a1a',
//     fontSize: 15,
//   },
//   commentTime: {
//     fontSize: 12,
//     color: '#8e8e93',
//     marginTop: 2,
//   },
//   commentContent: { 
//     marginTop: 4, 
//     fontSize: 15,
//     lineHeight: 20,
//     color: '#3a3a3c',
//   },
//   commentActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 10,
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//   },
//   replyButton: {
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     marginRight: 12,
//   },
//   replyBtnText: { 
//     color: '#007AFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   repliesCount: {
//     fontSize: 12,
//     color: '#8e8e93',
//   },
//   replyInputContainer: {
//     marginTop: 12,
//     padding: 12,
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//   },
//   replyInput: { 
//     borderWidth: 1, 
//     borderColor: '#e0e0e0', 
//     borderRadius: 8, 
//     padding: 12,
//     fontSize: 15,
//     backgroundColor: '#ffffff',
//     minHeight: 60,
//     textAlignVertical: 'top',
//   },
//   replyActions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//     marginTop: 12,
//     gap: 8,
//   },
//   cancelButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 6,
//     backgroundColor: '#f0f0f0',
//   },
//   cancelButtonText: {
//     color: '#8e8e93',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   submitReplyButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 6,
//     backgroundColor: '#007AFF',
//     minWidth: 60,
//     alignItems: 'center',
//   },
//   submitReplyText: {
//     color: '#ffffff',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   disabledButton: {
//     opacity: 0.5,
//   },
//   commentInputContainer: { 
//     backgroundColor: '#ffffff',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//   },
//   input: { 
//     borderWidth: 1, 
//     borderColor: '#e0e0e0', 
//     borderRadius: 8, 
//     padding: 12,
//     fontSize: 16,
//     backgroundColor: '#f8f9fa',
//     minHeight: 60,
//     maxHeight: 120,
//     textAlignVertical: 'top',
//   },
//   inputActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   characterCount: {
//     fontSize: 12,
//     color: '#8e8e93',
//   },
//   btnPost: { 
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//     minWidth: 70,
//     alignItems: 'center',
//   },
//   btnText: { 
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });
