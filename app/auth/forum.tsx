

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  Vibration,
  TextInput,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ConnectionAPI from '../api/connectionService';

const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = 280;
const POSTS_PER_BATCH = 10;

const ForumHome = ({ onPostPress, onLikePress }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [networkError, setNetworkError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const router = useRouter();

  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 80],
    extrapolate: 'clamp',
  });

  const flatListRef = React.useRef();

  useEffect(() => {
    fetchPosts(true);
  }, []);

  const showErrorFeedback = useCallback((message, showRetry = true) => {
    const buttons = [{ text: 'OK', style: 'default' }];
    if (showRetry) {
      buttons.push({ text: 'Retry', onPress: () => fetchPosts(true) });
    }
    
    Alert.alert('Error', message, buttons, { cancelable: true });
  }, []);

  const fetchPosts = async (isInitial = false, page = 1) => {
    try {
      if (isInitial) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      setNetworkError(false);

      const isAuthenticated = await ConnectionAPI.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Add pagination parameters if your API supports it
      const response = await ConnectionAPI.getPosts({
        page: page,
        limit: POSTS_PER_BATCH,
        search: searchQuery
      });

      let postsData = [];
      let total = 0;

      // Handle different response structures
      if (response.data) {
        postsData = response.data.results || response.data.posts || response.data;
        total = response.data.count || response.data.total || postsData.length;
      } else {
        postsData = Array.isArray(response) ? response : [];
        total = postsData.length;
      }

      if (isInitial) {
        setPosts(postsData || []);
        setTotalPosts(total);
      } else {
        setPosts(prev => [...prev, ...(postsData || [])]);
      }

      // Determine if there are more posts
      const hasMore = isInitial ? 
        (postsData.length >= POSTS_PER_BATCH) : 
        (posts.length + postsData.length < total);
      
      setHasMorePosts(hasMore);
      
    } catch (err) {
      // console.error('Error fetching posts:', err);
      
      let errorMessage = 'Failed to load posts. Please try again.';
      
      if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Please check your internet connection.';
        setNetworkError(true);
      } else if (err.message?.includes('401') || err.message?.includes('authentication')) {
        errorMessage = 'Session expired. Please log in again.';
        router.push('/auth/login');
        return;
      } else if (err.message?.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message?.includes('network') || err.message?.includes('connection')) {
        errorMessage = 'Network error. Please check your connection.';
        setNetworkError(true);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      if (isInitial || posts.length === 0) {
        showErrorFeedback(errorMessage);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchPosts(true);
  }, [searchQuery]);

  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMorePosts && posts.length > 0) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchPosts(false, nextPage);
    }
  }, [loadingMore, hasMorePosts, currentPage, posts.length]);

  const toggleLike = async (postId) => {
    try {
      const isAuthenticated = await ConnectionAPI.isAuthenticated();
      if (!isAuthenticated) {
        showErrorFeedback('Authentication required. Please log in again.', false);
        return;
      }

      // Haptic feedback
      if (Platform.OS === 'ios') {
        Vibration.vibrate(50);
      }

      // Optimistic update
      const currentPost = posts.find(post => post.id === postId);
      const wasLiked = currentPost?.is_liked_by_user || false;
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked_by_user: !wasLiked,
                likes_count: wasLiked 
                  ? Math.max(0, (post.likes_count || 0) - 1)
                  : (post.likes_count || 0) + 1
              }
            : post
        )
      );

      const response = await ConnectionAPI.likePost(postId);
      
      const liked = response.liked || response.data?.liked;
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked_by_user: liked,
              }
            : post
        )
      );
      
    } catch (err) {
      console.error('Error toggling like:', err);
      
      // Revert optimistic update
      const currentPost = posts.find(post => post.id === postId);
      const wasLiked = !currentPost?.is_liked_by_user || false;
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked_by_user: wasLiked,
                likes_count: wasLiked 
                  ? (post.likes_count || 0) + 1
                  : Math.max(0, (post.likes_count || 0) - 1)
              }
            : post
        )
      );
      
      let errorMessage = 'Failed to update like. Please try again.';
      if (err.message?.includes('401') || err.message?.includes('authentication')) {
        errorMessage = 'Session expired. Please log in again.';
      }
      
      showErrorFeedback(errorMessage, false);
    }
  };

  const handleReport = async (postId) => {
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post? This action will notify moderators.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: async () => {
            try {
              const isAuthenticated = await ConnectionAPI.isAuthenticated();
              if (!isAuthenticated) {
                showErrorFeedback('Authentication required. Please log in again.', false);
                return;
              }

              await ConnectionAPI.reportPost(postId);
              
              Alert.alert(
                'Success', 
                'Post reported successfully. Thank you for helping keep our community safe.',
                [{ text: 'OK' }]
              );
            } catch (err) {
              console.error('Error reporting post:', err);
              
              let errorMessage = 'Failed to report post. Please try again.';
              if (err.message?.includes('401') || err.message?.includes('authentication')) {
                errorMessage = 'Session expired. Please log in again.';
              } else if (err.message?.includes('429')) {
                errorMessage = 'Too many reports. Please wait before reporting again.';
              }
              
              showErrorFeedback(errorMessage, false);
            }
          }
        }
      ]
    );
  };

  const formatTimeAgo = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  }, []);

  // const getProfilePictureUri = useCallback((author) => {
  //   // Handle different author structures
  //   const user = typeof author === 'object' ? author : { username: author };
    
  //   if (user?.profile_picture) {
  //     if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
  //       return user.profile_picture;
  //     }
      
  //     const baseUrl = ConnectionAPI.getBaseUrl ? ConnectionAPI.getBaseUrl() : 'http://192.168.228.16:8000';
  //     const cleanPath = user.profile_picture.startsWith('/') 
  //       ? user.profile_picture 
  //       : `/${user.profile_picture}`;
      
  //     return `${baseUrl}${cleanPath}`;
  //   }
    
  //   // Generate avatar with user's initials and consistent color
  //   const username = user?.username || 'User';
  //   const colors = ['6366f1', '8b5cf6', 'ef4444', '10b981', 'f59e0b', '3b82f6', 'ec4899'];
  //   const colorIndex = username.charCodeAt(0) % colors.length;
  //   return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=${colors[colorIndex]}&color=fff&size=128&font-size=0.5`;
  // }, []);

  const getImageUrl = useCallback((imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const baseUrl = ConnectionAPI.getBaseUrl ? ConnectionAPI.getBaseUrl() : 'http://127.0.0.1:8000';
    return `${baseUrl}${imageUrl}`;
  }, []);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    return posts.filter(post => 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [posts, searchQuery]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowScrollToTop(offsetY > 300);
      }
    }
  );

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  const renderHeader = () => (
    <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.push('/auth/dashboard')}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>Community</Text>
              
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => setShowSearch(!showSearch)}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {showSearch && (
              <Animated.View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search posts, topics, authors..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#94a3b8"
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}

            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={() => router.push('/forum/create-post')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.createPostGradient}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createPostText}>Create Post</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );

  const renderItem = ({ item, index }) => {
    const isLiked = item.is_liked_by_user || false;
    const author = item.author || item.author_name;

    return (
      <Animated.View style={[
        styles.cardContainer,
        {
          opacity: 1,
          transform: [{ translateY: 0 }],
        },
      ]}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/forum/${item.id}`)}
          activeOpacity={0.98}
        >
          <View style={styles.cardHeader}>
            <Image 
              source={{ uri: ConnectionAPI.getUserProfilePicture(item.author_avatar) }}
              style={styles.avatar}
              defaultSource={{
                uri: 'https://via.placeholder.com/48/6366f1/white?text=U'
              }}
            />
            
            <View style={styles.authorInfo}>
              <View style={styles.authorRow}>
                <Text style={styles.authorName}>
                  {typeof author === 'object' ? author.username : author || 'Anonymous'}
                </Text>
                {item.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.timeStamp}>{formatTimeAgo(item.created_at)}</Text>
            </View>

            <TouchableOpacity 
              style={styles.moreButton}
              onPress={(e) => {
                e.stopPropagation();
                handleReport(item.id);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
            <Text numberOfLines={3} style={styles.postContent}>
              {item.content}
            </Text>
          </View>
          
          {item.image && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: getImageUrl(item.image) }}
                style={styles.postImage}
                resizeMode="cover"
              />
            </View>
          )}
          
          <View style={styles.cardFooter}>
            <View style={styles.engagementRow}>
              <TouchableOpacity 
                style={[styles.actionButton, isLiked && styles.likedButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleLike(item.id);
                }}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={20} 
                  color={isLiked ? "#ef4444" : "#64748b"} 
                />
                <Text style={[
                  styles.actionText,
                  isLiked && styles.likedText
                ]}>
                  {item.likes_count || 0}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push(`/forum/${item.id}`)}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
                <Text style={styles.actionText}>
                  {item.comments_count || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                activeOpacity={0.8}
              >
                <Ionicons name="share-outline" size={20} color="#64748b" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#6366f1" />
        <Text style={styles.loadingFooterText}>Loading more posts...</Text>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="chatbubbles-outline" size={80} color="#e2e8f0" />
      </View>
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 
          `No posts found for "${searchQuery}"` : 
          'Be the first to start a conversation!'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity 
          style={styles.emptyActionButton}
          onPress={() => router.push('/forum/create')}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.emptyActionGradient}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.emptyActionText}>Create First Post</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <Ionicons 
          name={networkError ? "wifi-outline" : "alert-circle-outline"} 
          size={80} 
          color="#ef4444" 
        />
      </View>
      <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={() => fetchPosts(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#ef4444', '#dc2626']}
          style={styles.retryGradient}
        >
          <Ionicons name="refresh-outline" size={20} color="#ffffff" />
          <Text style={styles.retryText}>Try Again</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading && posts.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading amazing posts...</Text>
          <Text style={styles.loadingSubtext}>This won't take long</Text>
        </View>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      {renderHeader()}
      
      <FlatList
        ref={flatListRef}
        data={filteredPosts}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContainer,
          filteredPosts.length === 0 && styles.listContainerCentered
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
            title="Pull to refresh"
            titleColor="#64748b"
          />
        }
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
        getItemLayout={(data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.3}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {showScrollToTop && (
        <TouchableOpacity
          style={styles.scrollToTopButton}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.scrollToTopGradient}
          >
            <Ionicons name="chevron-up" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  headerGradient: {
    flex: 1,
  },
  headerSafeArea: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '400',
  },
  createPostButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  createPostGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  createPostText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingTop: 16,
  },
  listContainerCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366f1',
  },
  timeStamp: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },
  moreButton: {
    padding: 4,
  },
  cardContent: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 24,
    marginBottom: 8,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    fontWeight: '400',
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f1f5f9',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    minWidth: 60,
    justifyContent: 'center',
  },
  likedButton: {
    backgroundColor: '#fef2f2',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 6,
  },
  likedText: {
    color: '#ef4444',
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingFooterText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActionButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  scrollToTopGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ForumHome;






























// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   StyleSheet, 
//   Image, 
//   Alert,
//   RefreshControl,
//   ActivityIndicator,
//   Animated,
//   Dimensions,
//   SafeAreaView,
//   StatusBar
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import ConnectionAPI from '../api/connectionService';

// const { width } = Dimensions.get('window');

// const ForumHome = ({ onPostPress, onLikePress }) => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [networkError, setNetworkError] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const showErrorFeedback = (message) => {
//     Alert.alert(
//       'Error',
//       message,
//       [
//         { text: 'OK', style: 'default' },
//         { text: 'Retry', onPress: () => fetchPosts() }
//       ],
//       { cancelable: true }
//     );
//   };

//   const fetchPosts = async (isRefresh = false) => {
//     try {
//       if (!isRefresh) setLoading(true);
//       setError(null);
//       setNetworkError(false);

//       // Check authentication
//       const isAuthenticated = await ConnectionAPI.isAuthenticated();
//       if (!isAuthenticated) {
//         throw new Error('No authentication token found. Please log in again.');
//       }

//       const response = await ConnectionAPI.getPosts();
//       const postsData = response.data || response;
//       setPosts(postsData || []);
//     } catch (err) {
//       console.error('Error fetching posts:', err);
      
//       let errorMessage = 'Failed to load posts. Please try again.';
      
//       if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
//         errorMessage = 'Connection timeout. Please check your internet connection.';
//         setNetworkError(true);
//       } else if (err.message?.includes('401') || err.message?.includes('authentication')) {
//         errorMessage = 'Session expired. Please log in again.';
//         // Optionally redirect to login
//         router.push('/auth/login');
//         return;
//       } else if (err.message?.includes('500')) {
//         errorMessage = 'Server error. Please try again later.';
//       } else if (err.message?.includes('network') || err.message?.includes('connection')) {
//         errorMessage = 'Network error. Please check your connection.';
//         setNetworkError(true);
//       } else if (err.message) {
//         errorMessage = err.message;
//       }
      
//       setError(errorMessage);
//       if (!isRefresh) {
//         showErrorFeedback(errorMessage);
//       }
//     } finally {
//       setLoading(false);
//       if (isRefresh) setRefreshing(false);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchPosts(true);
//   }, []);

//   const toggleLike = async (postId) => {
//     try {
//       // Check authentication
//       const isAuthenticated = await ConnectionAPI.isAuthenticated();
//       if (!isAuthenticated) {
//         showErrorFeedback('Authentication required. Please log in again.');
//         return;
//       }

//       // Optimistically update UI first
//       const currentPost = posts.find(post => post.id === postId);
//       const wasLiked = currentPost?.is_liked_by_user || false;
      
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { 
//                 ...post, 
//                 is_liked_by_user: !wasLiked,
//                 likes_count: wasLiked 
//                   ? Math.max(0, (post.likes_count || 0) - 1)
//                   : (post.likes_count || 0) + 1
//               }
//             : post
//         )
//       );

//       // Make API call using ConnectionAPI
//       const response = await ConnectionAPI.likePost(postId);
      
//       // Update with actual server response if needed
//       const liked = response.liked || response.data?.liked;
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { 
//                 ...post, 
//                 is_liked_by_user: liked,
//               }
//             : post
//         )
//       );
      
//     } catch (err) {
//       console.error('Error toggling like:', err);
      
//       // Revert optimistic update on error
//       const currentPost = posts.find(post => post.id === postId);
//       const wasLiked = !currentPost?.is_liked_by_user || false;
      
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { 
//                 ...post, 
//                 is_liked_by_user: wasLiked,
//                 likes_count: wasLiked 
//                   ? (post.likes_count || 0) + 1
//                   : Math.max(0, (post.likes_count || 0) - 1)
//               }
//             : post
//         )
//       );
      
//       let errorMessage = 'Failed to update like. Please try again.';
//       if (err.message?.includes('401') || err.message?.includes('authentication')) {
//         errorMessage = 'Session expired. Please log in again.';
//       }
      
//       showErrorFeedback(errorMessage);
//     }
//   };

//   const handleReport = async (postId) => {
//     Alert.alert(
//       'Report Post',
//       'Are you sure you want to report this post? This action will notify moderators.',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Report', 
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               // Check authentication
//               const isAuthenticated = await ConnectionAPI.isAuthenticated();
//               if (!isAuthenticated) {
//                 showErrorFeedback('Authentication required. Please log in again.');
//                 return;
//               }

//               await ConnectionAPI.reportPost(postId);
              
//               Alert.alert(
//                 'Success', 
//                 'Post reported successfully. Thank you for helping keep our community safe.',
//                 [{ text: 'OK' }]
//               );
//             } catch (err) {
//               console.error('Error reporting post:', err);
              
//               let errorMessage = 'Failed to report post. Please try again.';
//               if (err.message?.includes('401') || err.message?.includes('authentication')) {
//                 errorMessage = 'Session expired. Please log in again.';
//               } else if (err.message?.includes('429')) {
//                 errorMessage = 'Too many reports. Please wait before reporting again.';
//               }
              
//               showErrorFeedback(errorMessage);
//             }
//           }
//         }
//       ]
//     );
//   };

//   const formatTimeAgo = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now - date) / 1000);
    
//     if (diffInSeconds < 60) return 'Just now';
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
//     if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
//     return `${Math.floor(diffInSeconds / 604800)}w ago`;
//   };

//   const getImageUrl = (imageUrl) => {
//     if (!imageUrl) return null;
//     if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
//       return imageUrl;
//     }
//     // Use ConnectionAPI's base URL configuration
//     const baseUrl = ConnectionAPI.getBaseUrl ? ConnectionAPI.getBaseUrl() : 'http://192.168.130.16:8000';
//     return `${baseUrl}${imageUrl}`;
//   };

//   const getProfilePictureUri = (user) => {
//     if (user?.profile_picture) {
//       // Check if it's already a full URL
//       if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
//         return user.profile_picture;
//       }
      
//       // Use ConnectionAPI's base URL configuration
//       const baseUrl = ConnectionAPI.getBaseUrl ? ConnectionAPI.getBaseUrl() : 'http://192.168.130.16:8000';
      
//       // Clean up the path
//       const cleanPath = user.profile_picture.startsWith('/') 
//         ? user.profile_picture 
//         : `/${user.profile_picture}`;
      
//       return `${baseUrl}${cleanPath}`;
//     }
    
//     // Fallback to username-based avatar
//     return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=10b981&color=fff&size=128`;
//   };

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <TouchableOpacity 
//         style={styles.backButton}
//         onPress={() => router.push('/auth/dashboard')}
//         activeOpacity={0.7}
//       >
//         <Ionicons name="arrow-back" size={24} color="#007AFF" />
//       </TouchableOpacity>
//       <Text style={styles.headerTitle}>Community Forum</Text>
//       <View style={styles.headerSpacer} />
//     </View>
//   );

//   const renderItem = ({ item, index }) => {
//     const animatedValue = new Animated.Value(0);
    
//     Animated.timing(animatedValue, {
//       toValue: 1,
//       duration: 400,
//       delay: index * 50,
//       useNativeDriver: true,
//     }).start();

//     const isLiked = item.is_liked_by_user || false;

//     return (
//       <Animated.View style={[
//         styles.cardContainer,
//         {
//           opacity: animatedValue,
//           transform: [{
//             translateY: animatedValue.interpolate({
//               inputRange: [0, 1],
//               outputRange: [30, 0],
//             }),
//           }],
//         },
//       ]}>
//         <TouchableOpacity
//           style={styles.card}
//           onPress={() => router.push(`/forum/${item.id}`)}
//           activeOpacity={0.95}
//         >
//           <View style={styles.headerRow}>
//             <Image 
//               source={{
//                 uri: getProfilePictureUri(item.author_name) 
//               }} 
//               style={styles.avatar}
//               defaultSource={{
//                 uri: 'https://via.placeholder.com/44/007AFF/white?text=U'
//               }}
//             />
//             <View style={styles.contentWrapper}>
//               <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
//               <View style={styles.metaRow}>
//                 <Text style={styles.meta}>
//                   {item.author_name || 'Anonymous'}
//                 </Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.category}>{item.category}</Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
//               </View>
//             </View>
//           </View>
          
//           <Text numberOfLines={3} style={styles.content}>
//             {item.content}
//           </Text>
          
//           {item.image && (
//             <View style={styles.imageContainer}>
//               <Image
//                 source={{ uri: getImageUrl(item.image) }}
//                 style={styles.postImage}
//                 resizeMode="cover"
//                 onError={(error) => {
//                   console.log('Image load error:', error.nativeEvent.error);
//                 }}
//               />
//             </View>
//           )}
          
//           <View style={styles.actions}>
//             <TouchableOpacity 
//               style={[
//                 styles.actionButton,
//                 isLiked && styles.likedButton
//               ]}
//               onPress={(e) => {
//                 e.stopPropagation();
//                 toggleLike(item.id);
//               }}
//               activeOpacity={0.8}
//             >
//               <Ionicons 
//                 name={isLiked ? "heart" : "heart-outline"} 
//                 size={18} 
//                 color={isLiked ? "#ff3b30" : "#8e8e93"} 
//               />
//               <Text style={[
//                 styles.actionText,
//                 isLiked && styles.likedText
//               ]}>
//                 {item.likes_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.actionButton}
//               onPress={() => router.push(`/forum/${item.id}`)}
//               activeOpacity={0.8}
//             >
//               <Ionicons name="chatbubble-outline" size={18} color="#007AFF" />
//               <Text style={styles.commentText}>
//                 {item.comments_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.reportButton}
//               onPress={(e) => {
//                 e.stopPropagation();
//                 handleReport(item.id);
//               }}
//               activeOpacity={0.8}
//             >
//               <Ionicons name="flag-outline" size={16} color="#ff9500" />
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Animated.View>
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Ionicons name="chatbubbles-outline" size={64} color="#c7c7cc" />
//       <Text style={styles.emptyText}>No posts yet</Text>
//       <Text style={styles.emptySubtext}>Be the first to start a conversation!</Text>
//       <TouchableOpacity 
//         style={styles.createPostButton}
//         onPress={() => router.push('/forum/create')}
//       >
//         <Text style={styles.createPostText}>Create Post</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <Ionicons 
//         name={networkError ? "wifi-outline" : "alert-circle-outline"} 
//         size={64} 
//         color="#ff3b30" 
//       />
//       <Text style={styles.errorText}>{error}</Text>
//       <TouchableOpacity 
//         style={styles.retryButton} 
//         onPress={() => fetchPosts()}
//         activeOpacity={0.8}
//       >
//         <Ionicons name="refresh-outline" size={20} color="#ffffff" />
//         <Text style={styles.retryText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading && posts.length === 0) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
//         {renderHeader()}
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading posts...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (error && posts.length === 0) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
//         {renderHeader()}
//         {renderErrorState()}
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
//       {renderHeader()}
//       <FlatList
//         data={posts}
//         keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//         renderItem={renderItem}
//         contentContainerStyle={[
//           styles.container,
//           posts.length === 0 && styles.containerCentered
//         ]}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//             title="Pull to refresh"
//             titleColor="#8e8e93"
//           />
//         }
//         ListEmptyComponent={renderEmptyComponent}
//         showsVerticalScrollIndicator={false}
//         initialNumToRender={8}
//         maxToRenderPerBatch={5}
//         windowSize={10}
//         removeClippedSubviews={true}
//         getItemLayout={(data, index) => ({
//           length: 200, // Approximate item height
//           offset: 200 * index,
//           index,
//         })}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e5ea',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   backButton: {
//     padding: 8,
//     marginRight: 8,
//   },
//   headerTitle: {
//     flex: 1,
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1c1c1e',
//     textAlign: 'center',
//   },
//   headerSpacer: {
//     width: 40,
//   },
//   container: {
//     padding: 16,
//   },
//   containerCentered: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   cardContainer: {
//     marginBottom: 16,
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   headerRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   avatar: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     marginRight: 12,
//     backgroundColor: '#f0f0f0',
//   },
//   contentWrapper: {
//     flex: 1,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1c1c1e',
//     marginBottom: 4,
//     lineHeight: 22,
//   },
//   metaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//   },
//   meta: {
//     fontSize: 13,
//     color: '#8e8e93',
//     fontWeight: '500',
//   },
//   dot: {
//     fontSize: 13,
//     color: '#c7c7cc',
//     marginHorizontal: 6,
//   },
//   category: {
//     fontSize: 13,
//     color: '#007AFF',
//     fontWeight: '500',
//   },
//   timeAgo: {
//     fontSize: 13,
//     color: '#8e8e93',
//   },
//   content: {
//     fontSize: 15,
//     color: '#3a3a3c',
//     lineHeight: 22,
//     marginBottom: 12,
//   },
//   imageContainer: {
//     borderRadius: 8,
//     overflow: 'hidden',
//     marginBottom: 12,
//   },
//   postImage: {
//     width: '100%',
//     height: 200,
//     backgroundColor: '#f0f0f0',
//   },
//   actions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     backgroundColor: '#f8f9fa',
//   },
//   likedButton: {
//     backgroundColor: '#ffebee',
//   },
//   actionText: {
//     fontSize: 14,
//     color: '#8e8e93',
//     marginLeft: 6,
//     fontWeight: '500',
//   },
//   likedText: {
//     color: '#ff3b30',
//   },
//   commentText: {
//     fontSize: 14,
//     color: '#007AFF',
//     marginLeft: 6,
//     fontWeight: '500',
//   },
//   reportButton: {
//     padding: 8,
//     borderRadius: 16,
//     backgroundColor: '#fff3cd',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#8e8e93',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#c7c7cc',
//     textAlign: 'center',
//     marginBottom: 24,
//   },
//   createPostButton: {
//     backgroundColor: '#007AFF',
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 25,
//   },
//   createPostText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#8e8e93',
//     marginTop: 12,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#ff3b30',
//     textAlign: 'center',
//     marginVertical: 16,
//     lineHeight: 24,
//   },
//   retryButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#ff3b30',
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 25,
//   },
//   retryText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
// });

// export default ForumHome;















































































// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   StyleSheet, 
//   Image, 
//   Alert,
//   RefreshControl,
//   ActivityIndicator,
//   Animated,
//   Dimensions,
//   SafeAreaView,
//   StatusBar
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Ionicons } from '@expo/vector-icons';

// const { width } = Dimensions.get('window');

// const ForumHome = ({ onPostPress, onLikePress }) => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [networkError, setNetworkError] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const showErrorFeedback = (message) => {
//     Alert.alert(
//       'Error',
//       message,
//       [
//         { text: 'OK', style: 'default' },
//         { text: 'Retry', onPress: () => fetchPosts() }
//       ],
//       { cancelable: true }
//     );
//   };

//   const fetchPosts = async (isRefresh = false) => {
//     try {
//       if (!isRefresh) setLoading(true);
//       setError(null);
//       setNetworkError(false);

//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         throw new Error('No authentication token found. Please log in again.');
//       }

//       // const response = await axios.get('http://127.0.0.1:8000/api/posts/', {
//       // const response = await axios.get('http://10.22.3.34:8000/api/posts/', {
//       // const response = await axios.get('http://192.168.220.16:8000/api/posts/', {
//       const response = await axios.get('http://192.168.130.16:8000/api/posts/', {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000, // 10 second timeout
//       });
      
//       setPosts(response.data || []);
//     } catch (err) {
//       console.error('Error fetching posts:', err);
      
//       let errorMessage = 'Failed to load posts. Please try again.';
      
//       if (err.code === 'ECONNABORTED') {
//         errorMessage = 'Connection timeout. Please check your internet connection.';
//         setNetworkError(true);
//       } else if (err.response?.status === 401) {
//         errorMessage = 'Session expired. Please log in again.';
//         // Optionally redirect to login
//         router.push('/auth/login');
//         return;
//       } else if (err.response?.status === 500) {
//         errorMessage = 'Server error. Please try again later.';
//       } else if (!err.response) {
//         errorMessage = 'Network error. Please check your connection.';
//         setNetworkError(true);
//       }
      
//       setError(errorMessage);
//       if (!isRefresh) {
//         showErrorFeedback(errorMessage);
//       }
//     } finally {
//       setLoading(false);
//       if (isRefresh) setRefreshing(false);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchPosts(true);
//   }, []);

//   const toggleLike = async (postId) => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         showErrorFeedback('Authentication required. Please log in again.');
//         return;
//       }

//       // Optimistically update UI first
//       const currentPost = posts.find(post => post.id === postId);
//       const wasLiked = currentPost?.is_liked_by_user || false;
      
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { 
//                 ...post, 
//                 is_liked_by_user: !wasLiked,
//                 likes_count: wasLiked 
//                   ? Math.max(0, (post.likes_count || 0) - 1)
//                   : (post.likes_count || 0) + 1
//               }
//             : post
//         )
//       );

//       // Make API call
//       // const response = await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/like/`, {}, {
//       // const response = await axios.post(`http://10.22.3.34:8000/api/posts/${postId}/like/`, {}, {
//       // const response = await axios.post(`http://192.168.220.16:8000/api/posts/${postId}/like/`, {}, {
//       const response = await axios.post(`http://192.168.130.16:8000/api/posts/${postId}/like/`, {}, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 5000,
//       });
      
//       // Update with actual server response if needed
//       const { liked } = response.data;
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { 
//                 ...post, 
//                 is_liked_by_user: liked,
//               }
//             : post
//         )
//       );
      
//     } catch (err) {
//       console.error('Error toggling like:', err);
      
//       // Revert optimistic update on error
//       const currentPost = posts.find(post => post.id === postId);
//       const wasLiked = !currentPost?.is_liked_by_user || false;
      
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { 
//                 ...post, 
//                 is_liked_by_user: wasLiked,
//                 likes_count: wasLiked 
//                   ? (post.likes_count || 0) + 1
//                   : Math.max(0, (post.likes_count || 0) - 1)
//               }
//             : post
//         )
//       );
      
//       let errorMessage = 'Failed to update like. Please try again.';
//       if (err.response?.status === 401) {
//         errorMessage = 'Session expired. Please log in again.';
//       }
      
//       showErrorFeedback(errorMessage);
//     }
//   };

//   const handleReport = async (postId) => {
//     Alert.alert(
//       'Report Post',
//       'Are you sure you want to report this post? This action will notify moderators.',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Report', 
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               const token = await AsyncStorage.getItem('access_token');
//               if (!token) {
//                 showErrorFeedback('Authentication required. Please log in again.');
//                 return;
//               }

//               // await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/report/`, 
//               // await axios.post(`http://10.22.3.34:8000/api/posts/${postId}/report/`, 
//               // await axios.post(`http://192.168.220.16:8000/api/posts/${postId}/report/`, 
//               await axios.post(`http://192.168.130.16:8000/api/posts/${postId}/report/`, 
//                 { post_id: postId },
//                 {
//                   headers: {
//                     Authorization: `Bearer ${token}`,
//                     'Content-Type': 'application/json',
//                   },
//                   timeout: 5000,
//                 }
//               );
              
//               Alert.alert(
//                 'Success', 
//                 'Post reported successfully. Thank you for helping keep our community safe.',
//                 [{ text: 'OK' }]
//               );
//             } catch (err) {
//               console.error('Error reporting post:', err);
              
//               let errorMessage = 'Failed to report post. Please try again.';
//               if (err.response?.status === 401) {
//                 errorMessage = 'Session expired. Please log in again.';
//               } else if (err.response?.status === 429) {
//                 errorMessage = 'Too many reports. Please wait before reporting again.';
//               }
              
//               showErrorFeedback(errorMessage);
//             }
//           }
//         }
//       ]
//     );
//   };

//   const formatTimeAgo = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now - date) / 1000);
    
//     if (diffInSeconds < 60) return 'Just now';
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
//     if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
//     return `${Math.floor(diffInSeconds / 604800)}w ago`;
//   };

//   const getImageUrl = (imageUrl) => {
//     if (!imageUrl) return null;
//     if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
//       return imageUrl;
//     }
//     // return `http://127.0.0.1:8000${imageUrl}`;
//     // return `http://192.168.220.16:8000${imageUrl}`;
//     return `http://192.168.130.16:8000${imageUrl}`;
//   };



//   const getProfilePictureUri = (user) => {
//     if (user?.profile_picture) {
//       // Check if it's already a full URL
//       if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
//         return user.profile_picture;
//       }
      
//       // Use your API base URL from config or environment
//       // const API_BASE_URL = process.env.REACT_NATIVE_API_URL || 'http://localhost:8000';
//       const API_BASE_URL = 'http://192.168.130.16:8000'; // Replace with your actual server URL
//       // const API_BASE_URL = 'http://192.168.220.16:8000'; // Replace with your actual server URL
//       // const API_BASE_URL = 'http://10.22.3.34:8000'; // Replace with your actual server URL
//       // const API_BASE_URL = 'http://127.0.0.1:8000'; // Replace with your actual server URL
      
//       // Clean up the path
//       const cleanPath = user.profile_picture.startsWith('/') 
//         ? user.profile_picture 
//         : `/${user.profile_picture}`;
      
//       return `${API_BASE_URL}${cleanPath}`;
//     }
    
//     // Fallback to username-based avatar
//     return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=10b981&color=fff&size=128`;
//   };



//   const renderHeader = () => (
//     <View style={styles.header}>
//       <TouchableOpacity 
//         style={styles.backButton}
//         onPress={() => router.push('/auth/dashboard')}
//         activeOpacity={0.7}
//       >
//         <Ionicons name="arrow-back" size={24} color="#007AFF" />
//       </TouchableOpacity>
//       <Text style={styles.headerTitle}>Community Forum</Text>
//       <View style={styles.headerSpacer} />
//     </View>
//   );

//   const renderItem = ({ item, index }) => {
//     const animatedValue = new Animated.Value(0);
    
//     Animated.timing(animatedValue, {
//       toValue: 1,
//       duration: 400,
//       delay: index * 50,
//       useNativeDriver: true,
//     }).start();

//     const isLiked = item.is_liked_by_user || false;

//     return (
//       <Animated.View style={[
//         styles.cardContainer,
//         {
//           opacity: animatedValue,
//           transform: [{
//             translateY: animatedValue.interpolate({
//               inputRange: [0, 1],
//               outputRange: [30, 0],
//             }),
//           }],
//         },
//       ]}>
//         <TouchableOpacity
//           style={styles.card}
//           onPress={() => router.push(`/forum/${item.id}`)}
//           activeOpacity={0.95}
//         >
//           <View style={styles.headerRow}>
//             <Image 
//               source={{
//                 uri: getProfilePictureUri(item.author_name) 
//                 // uri: item.author_avatar || item.profile_picture || 'https://via.placeholder.com/44/007AFF/white?text=U',
//               }} 
//               style={styles.avatar}
//               defaultSource={{
//                 uri: 'https://via.placeholder.com/44/007AFF/white?text=U'
//               }}
//             />
//             <View style={styles.contentWrapper}>
//               <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
//               <View style={styles.metaRow}>
//                 <Text style={styles.meta}>
//                   {item.author_name || 'Anonymous'}
//                 </Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.category}>{item.category}</Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
//               </View>
//             </View>
//           </View>
          
//           <Text numberOfLines={3} style={styles.content}>
//             {item.content}
//           </Text>
          
//           {item.image && (
//             <View style={styles.imageContainer}>
//               <Image
//                 source={{ uri: getImageUrl(item.image) }}
//                 style={styles.postImage}
//                 resizeMode="cover"
//                 onError={(error) => {
//                   console.log('Image load error:', error.nativeEvent.error);
//                 }}
//               />
//             </View>
//           )}
          
//           <View style={styles.actions}>
//             <TouchableOpacity 
//               style={[
//                 styles.actionButton,
//                 isLiked && styles.likedButton
//               ]}
//               onPress={(e) => {
//                 e.stopPropagation();
//                 toggleLike(item.id);
//               }}
//               activeOpacity={0.8}
//             >
//               <Ionicons 
//                 name={isLiked ? "heart" : "heart-outline"} 
//                 size={18} 
//                 color={isLiked ? "#ff3b30" : "#8e8e93"} 
//               />
//               <Text style={[
//                 styles.actionText,
//                 isLiked && styles.likedText
//               ]}>
//                 {item.likes_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.actionButton}
//               onPress={() => router.push(`/forum/${item.id}`)}
//               activeOpacity={0.8}
//             >
//               <Ionicons name="chatbubble-outline" size={18} color="#007AFF" />
//               <Text style={styles.commentText}>
//                 {item.comments_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.reportButton}
//               onPress={(e) => {
//                 e.stopPropagation();
//                 handleReport(item.id);
//               }}
//               activeOpacity={0.8}
//             >
//               <Ionicons name="flag-outline" size={16} color="#ff9500" />
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Animated.View>
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Ionicons name="chatbubbles-outline" size={64} color="#c7c7cc" />
//       <Text style={styles.emptyText}>No posts yet</Text>
//       <Text style={styles.emptySubtext}>Be the first to start a conversation!</Text>
//       <TouchableOpacity 
//         style={styles.createPostButton}
//         onPress={() => router.push('/forum/create')}
//       >
//         <Text style={styles.createPostText}>Create Post</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <Ionicons 
//         name={networkError ? "wifi-outline" : "alert-circle-outline"} 
//         size={64} 
//         color="#ff3b30" 
//       />
//       <Text style={styles.errorText}>{error}</Text>
//       <TouchableOpacity 
//         style={styles.retryButton} 
//         onPress={() => fetchPosts()}
//         activeOpacity={0.8}
//       >
//         <Ionicons name="refresh-outline" size={20} color="#ffffff" />
//         <Text style={styles.retryText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading && posts.length === 0) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
//         {renderHeader()}
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading posts...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (error && posts.length === 0) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
//         {renderHeader()}
//         {renderErrorState()}
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
//       {renderHeader()}
//       <FlatList
//         data={posts}
//         keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//         renderItem={renderItem}
//         contentContainerStyle={[
//           styles.container,
//           posts.length === 0 && styles.containerCentered
//         ]}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//             title="Pull to refresh"
//             titleColor="#8e8e93"
//           />
//         }
//         ListEmptyComponent={renderEmptyComponent}
//         showsVerticalScrollIndicator={false}
//         initialNumToRender={8}
//         maxToRenderPerBatch={5}
//         windowSize={10}
//         removeClippedSubviews={true}
//         getItemLayout={(data, index) => ({
//           length: 200, // Approximate item height
//           offset: 200 * index,
//           index,
//         })}
//       />
//     </SafeAreaView>
//   );
// };

// export default ForumHome;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//     marginTop: '30px'
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   backButton: {
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: '#f8f9fa',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1a1a1a',
//   },
//   headerSpacer: {
//     width: 40,
//   },
//   container: { 
//     padding: 16,
//     backgroundColor: '#f8f9fa',
//   },
//   containerCentered: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   cardContainer: {
//     marginBottom: 16,
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 4,
//     borderWidth: 1,
//     borderColor: '#f0f0f0',
//   },
//   headerRow: { 
//     flexDirection: 'row', 
//     alignItems: 'flex-start', 
//     marginBottom: 16,
//   },
//   avatar: { 
//     width: 44, 
//     height: 44, 
//     borderRadius: 22, 
//     marginRight: 12,
//     backgroundColor: '#f0f0f0',
//     borderWidth: 2,
//     borderColor: '#ffffff',
//   },
//   contentWrapper: {
//     flex: 1,
//   },
//   title: { 
//     fontSize: 18, 
//     fontWeight: '700',
//     color: '#1a1a1a',
//     lineHeight: 24,
//     marginBottom: 6,
//   },
//   metaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//   },
//   meta: { 
//     fontSize: 14, 
//     color: '#8e8e93',
//     fontWeight: '500',
//   },
//   category: {
//     fontSize: 14,
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   timeAgo: {
//     fontSize: 14,
//     color: '#8e8e93',
//   },
//   dot: {
//     fontSize: 14,
//     color: '#c7c7cc',
//     marginHorizontal: 8,
//   },
//   content: { 
//     fontSize: 16, 
//     lineHeight: 22,
//     color: '#3a3a3c',
//     marginBottom: 16,
//   },
//   imageContainer: {
//     marginBottom: 16,
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   postImage: {
//     width: '100%',
//     height: 220,
//     backgroundColor: '#f0f0f0',
//   },
//   actions: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     backgroundColor: '#f8f9fa',
//     gap: 6,
//   },
//   likedButton: {
//     backgroundColor: '#ffe6e6',
//   },
//   actionText: {
//     fontSize: 15,
//     color: '#8e8e93',
//     fontWeight: '600',
//   },
//   likedText: {
//     color: '#ff3b30',
//   },
//   commentText: {
//     fontSize: 15,
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   reportButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     backgroundColor: '#fff5e6',
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
//     color: '#8e8e93',
//     fontWeight: '500',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     padding: 32,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#ff3b30',
//     textAlign: 'center',
//     marginVertical: 20,
//     lineHeight: 22,
//   },
//   retryButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 25,
//     gap: 8,
//   },
//   retryText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     paddingVertical: 60,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#8e8e93',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#c7c7cc',
//     marginBottom: 24,
//     textAlign: 'center',
//   },
//   createPostButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 25,
//   },
//   createPostText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });




























































// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   StyleSheet, 
//   Image, 
//   Alert,
//   RefreshControl,
//   ActivityIndicator,
//   Animated,
//   Dimensions
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');

// const ForumHome = ({ onPostPress, onLikePress }) => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const router = useRouter();

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const fetchPosts = async (isRefresh = false) => {
//     try {
//       if (!isRefresh) setLoading(true);
//       setError(null);

//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const response = await axios.get('http://127.0.0.1:8000/api/posts/', {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       setPosts(response.data || []);
//     } catch (err) {
//       console.error('Error fetching posts:', err);
//       setError('Failed to load posts. Please try again.');
//       Alert.alert('Error', 'Failed to load posts');
//     } finally {
//       setLoading(false);
//       if (isRefresh) setRefreshing(false);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchPosts(true);
//   }, []);

//   const toggleLike = async (postId) => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         Alert.alert('Error', 'Authentication required');
//         return;
//       }

//       // Optimistically update UI first
//       const currentPost = posts.find(post => post.id === postId);
//       const wasLiked = currentPost?.is_liked_by_user || false;
      
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { 
//                 ...post, 
//                 is_liked_by_user: !wasLiked,
//                 likes_count: wasLiked 
//                   ? (post.likes_count || 0) - 1 
//                   : (post.likes_count || 0) + 1
//               }
//             : post
//         )
//       );

//       // Make API call
//       const response = await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/like/`, {}, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       // Update with actual server response if needed
//       const { liked } = response.data;
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { 
//                 ...post, 
//                 is_liked_by_user: liked,
//                 // Optionally fetch updated count from server or keep optimistic update
//               }
//             : post
//         )
//       );
      
//     } catch (err) {
//       console.error('Error toggling like:', err);
      
//       // Revert optimistic update on error
//       const currentPost = posts.find(post => post.id === postId);
//       const wasLiked = currentPost?.is_liked_by_user || false;
      
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { 
//                 ...post, 
//                 is_liked_by_user: !wasLiked,
//                 likes_count: !wasLiked 
//                   ? (post.likes_count || 0) - 1 
//                   : (post.likes_count || 0) + 1
//               }
//             : post
//         )
//       );
      
//       Alert.alert('Error', 'Failed to update like');
//     }
//   };

//   const handleReport = async (postId) => {
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

//               await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/report/`, 
//                 { post_id: postId },
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

//   const renderItem = ({ item, index }) => {
//     const animatedValue = new Animated.Value(0);
    
//     Animated.timing(animatedValue, {
//       toValue: 1,
//       duration: 300,
//       delay: index * 100,
//       useNativeDriver: true,
//     }).start();

//     const isLiked = item.is_liked_by_user || false;

//     return (
//       <Animated.View style={[
//         styles.cardContainer,
//         {
//           opacity: animatedValue,
//           transform: [{
//             translateY: animatedValue.interpolate({
//               inputRange: [0, 1],
//               outputRange: [50, 0],
//             }),
//           }],
//         },
//       ]}>
//         <TouchableOpacity
//           style={styles.card}
//           onPress={() => router.push(`/forum/${item.id}`)}
//           activeOpacity={0.8}
//         >
//           <View style={styles.headerRow}>
//             <Image 
//               source={{
//                 uri: item.author_avatar || item.profile_picture || 'https://via.placeholder.com/40/007AFF/white?text=U',
//               }} 
//               style={styles.avatar}
//               defaultSource={{
//                 uri: 'https://via.placeholder.com/40/007AFF/white?text=U'
//               }}
//             />
//             <View style={styles.contentWrapper}>
//               <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
//               <View style={styles.metaRow}>
//                 <Text style={styles.meta}>
//                   By {item.author_name || 'Anonymous'}
//                 </Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.category}>{item.category}</Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
//               </View>
//             </View>
//           </View>
          
//           <Text numberOfLines={3} style={styles.content}>
//             {item.content}
//           </Text>
          
//           {/* Post Image */}
//           {item.image && (
//             <View style={styles.imageContainer}>
//               <Image
//                 source={{ uri: getImageUrl(item.image) }}
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
          
//           <View style={styles.actions}>
//             <TouchableOpacity 
//               style={[
//                 styles.actionButton,
//                 isLiked && styles.likedButton
//               ]}
//               onPress={(e) => {
//                 e.stopPropagation(); // Prevent navigation when liking
//                 toggleLike(item.id);
//               }}
//               activeOpacity={0.7}
//             >
//               <Text style={[
//                 styles.likeText,
//                 isLiked && styles.likedText
//               ]}>
//                 {isLiked ? '❤️' : '🤍'} {item.likes_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.actionButton}
//               onPress={() => router.push(`/forum/${item.id}`)}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.commentText}>
//                 💬 {item.comments_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.reportButton}
//               onPress={(e) => {
//                 e.stopPropagation(); // Prevent navigation when reporting
//                 handleReport(item.id);
//               }}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.reportText}>🚩</Text>
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Animated.View>
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyText}>No posts available</Text>
//       <Text style={styles.emptySubtext}>Be the first to share something!</Text>
//     </View>
//   );

//   const renderFooter = () => {
//     if (!loading) return null;
//     return (
//       <View style={styles.footer}>
//         <ActivityIndicator size="small" color="#007AFF" />
//       </View>
//     );
//   };

//   if (loading && posts.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading posts...</Text>
//       </View>
//     );
//   }

//   if (error && posts.length === 0) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => fetchPosts()}>
//           <Text style={styles.retryText}>Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       data={posts}
//       keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//       renderItem={renderItem}
//       contentContainerStyle={[
//         styles.container,
//         posts.length === 0 && styles.containerCentered
//       ]}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           colors={['#007AFF']}
//           tintColor="#007AFF"
//         />
//       }
//       ListEmptyComponent={renderEmptyComponent}
//       ListFooterComponent={renderFooter}
//       showsVerticalScrollIndicator={false}
//       initialNumToRender={10}
//       maxToRenderPerBatch={5}
//       windowSize={10}
//     />
//   );
// };

// export default ForumHome;

// const styles = StyleSheet.create({
//   container: { 
//     padding: 16,
//     backgroundColor: '#f8f9fa',
//   },
//   containerCentered: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   cardContainer: {
//     marginBottom: 12,
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   headerRow: { 
//     flexDirection: 'row', 
//     alignItems: 'flex-start', 
//     marginBottom: 12,
//   },
//   avatar: { 
//     width: 44, 
//     height: 44, 
//     borderRadius: 22, 
//     marginRight: 12,
//     backgroundColor: '#f0f0f0',
//   },
//   contentWrapper: {
//     flex: 1,
//   },
//   title: { 
//     fontSize: 17, 
//     fontWeight: '600',
//     color: '#1a1a1a',
//     lineHeight: 22,
//     marginBottom: 4,
//   },
//   metaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//   },
//   meta: { 
//     fontSize: 13, 
//     color: '#8e8e93',
//     fontWeight: '500',
//   },
//   category: {
//     fontSize: 13,
//     color: '#007AFF',
//     fontWeight: '500',
//   },
//   timeAgo: {
//     fontSize: 13,
//     color: '#8e8e93',
//   },
//   dot: {
//     fontSize: 13,
//     color: '#c7c7cc',
//     marginHorizontal: 6,
//   },
//   content: { 
//     fontSize: 15, 
//     lineHeight: 20,
//     color: '#3a3a3c',
//     marginBottom: 16,
//   },
//   // New styles for post images
//   imageContainer: {
//     marginBottom: 16,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   postImage: {
//     width: '100%',
//     height: 200,
//     backgroundColor: '#f0f0f0',
//   },
//   actions: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 16,
//     backgroundColor: '#f8f9fa',
//   },
//   likedButton: {
//     backgroundColor: '#ffe6e6',
//   },
//   likeText: {
//     fontSize: 14,
//     color: '#8e8e93',
//     fontWeight: '600',
//   },
//   likedText: {
//     color: '#ff3b30',
//   },
//   commentText: {
//     fontSize: 14,
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   reportButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 8,
//   },
//   reportText: { 
//     fontSize: 16,
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
//   emptyContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#8e8e93',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#c7c7cc',
//   },
//   footer: {
//     paddingVertical: 20,
//   },
// });


























































// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   StyleSheet, 
//   Image, 
//   Alert,
//   RefreshControl,
//   ActivityIndicator,
//   Animated,
//   Dimensions
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');

// const ForumHome = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const router = useRouter();

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const fetchPosts = async (isRefresh = false) => {
//     try {
//       if (!isRefresh) setLoading(true);
//       setError(null);

//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const response = await axios.get('http://127.0.0.1:8000/api/posts/', {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       setPosts(response.data || []);
//     } catch (err) {
//       console.error('Error fetching posts:', err);
//       setError('Failed to load posts. Please try again.');
//       Alert.alert('Error', 'Failed to load posts');
//     } finally {
//       setLoading(false);
//       if (isRefresh) setRefreshing(false);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchPosts(true);
//   }, []);

//   const toggleLike = async (postId) => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         Alert.alert('Error', 'Authentication required');
//         return;
//       }

//       await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/like/`, {}, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       // Update posts locally for immediate feedback
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { ...post, likes_count: (post.likes_count || 0) + 1 }
//             : post
//         )
//       );
//     } catch (err) {
//       console.error('Error toggling like:', err);
//       Alert.alert('Error', 'Failed to like post');
//     }
//   };

//   const handleReport = async (postId) => {
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

//               await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/report/`, 
//                 { post_id: postId },
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

//   const renderItem = ({ item, index }) => {
//     const animatedValue = new Animated.Value(0);
    
//     Animated.timing(animatedValue, {
//       toValue: 1,
//       duration: 300,
//       delay: index * 100,
//       useNativeDriver: true,
//     }).start();

//     return (
//       <Animated.View style={[
//         styles.cardContainer,
//         {
//           opacity: animatedValue,
//           transform: [{
//             translateY: animatedValue.interpolate({
//               inputRange: [0, 1],
//               outputRange: [50, 0],
//             }),
//           }],
//         },
//       ]}>
//         <TouchableOpacity
//           style={styles.card}
//           onPress={() => router.push(`/forum/${item.id}`)}
//           activeOpacity={0.8}
//         >
//           <View style={styles.headerRow}>
//             <Image 
//               source={{
//                 uri: item.author_avatar || item.profile_picture || 'https://via.placeholder.com/40/007AFF/white?text=U',
//               }} 
//               style={styles.avatar}
//               defaultSource={{
//                 uri: 'https://via.placeholder.com/40/007AFF/white?text=U'
//               }}
//             />
//             <View style={styles.contentWrapper}>
//               <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
//               <View style={styles.metaRow}>
//                 <Text style={styles.meta}>
//                   By {item.author_name || 'Anonymous'}
//                 </Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.category}>{item.category}</Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
//               </View>
//             </View>
//           </View>
          
//           <Text numberOfLines={3} style={styles.content}>
//             {item.content}
//           </Text>
          
//           {/* Post Image */}
//           {item.image && (
//             <View style={styles.imageContainer}>
//               <Image
//                 source={{ uri: getImageUrl(item.image) }}
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
          
//           <View style={styles.actions}>
//             <TouchableOpacity 
//               style={styles.actionButton}
//               onPress={(e) => {
//                 e.stopPropagation(); // Prevent navigation when liking
//                 toggleLike(item.id);
//               }}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.likeText}>
//                 ❤️ {item.likes_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.actionButton}
//               onPress={() => router.push(`/forum/${item.id}`)}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.commentText}>
//                 💬 {item.comments_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.reportButton}
//               onPress={(e) => {
//                 e.stopPropagation(); // Prevent navigation when reporting
//                 handleReport(item.id);
//               }}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.reportText}>🚩</Text>
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Animated.View>
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyText}>No posts available</Text>
//       <Text style={styles.emptySubtext}>Be the first to share something!</Text>
//     </View>
//   );

//   const renderFooter = () => {
//     if (!loading) return null;
//     return (
//       <View style={styles.footer}>
//         <ActivityIndicator size="small" color="#007AFF" />
//       </View>
//     );
//   };

//   if (loading && posts.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading posts...</Text>
//       </View>
//     );
//   }

//   if (error && posts.length === 0) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => fetchPosts()}>
//           <Text style={styles.retryText}>Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       data={posts}
//       keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//       renderItem={renderItem}
//       contentContainerStyle={[
//         styles.container,
//         posts.length === 0 && styles.containerCentered
//       ]}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           colors={['#007AFF']}
//           tintColor="#007AFF"
//         />
//       }
//       ListEmptyComponent={renderEmptyComponent}
//       ListFooterComponent={renderFooter}
//       showsVerticalScrollIndicator={false}
//       initialNumToRender={10}
//       maxToRenderPerBatch={5}
//       windowSize={10}
//     />
//   );
// };

// export default ForumHome;

// const styles = StyleSheet.create({
//   container: { 
//     padding: 16,
//     backgroundColor: '#f8f9fa',
//   },
//   containerCentered: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   cardContainer: {
//     marginBottom: 12,
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   headerRow: { 
//     flexDirection: 'row', 
//     alignItems: 'flex-start', 
//     marginBottom: 12,
//   },
//   avatar: { 
//     width: 44, 
//     height: 44, 
//     borderRadius: 22, 
//     marginRight: 12,
//     backgroundColor: '#f0f0f0',
//   },
//   contentWrapper: {
//     flex: 1,
//   },
//   title: { 
//     fontSize: 17, 
//     fontWeight: '600',
//     color: '#1a1a1a',
//     lineHeight: 22,
//     marginBottom: 4,
//   },
//   metaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//   },
//   meta: { 
//     fontSize: 13, 
//     color: '#8e8e93',
//     fontWeight: '500',
//   },
//   category: {
//     fontSize: 13,
//     color: '#007AFF',
//     fontWeight: '500',
//   },
//   timeAgo: {
//     fontSize: 13,
//     color: '#8e8e93',
//   },
//   dot: {
//     fontSize: 13,
//     color: '#c7c7cc',
//     marginHorizontal: 6,
//   },
//   content: { 
//     fontSize: 15, 
//     lineHeight: 20,
//     color: '#3a3a3c',
//     marginBottom: 16,
//   },
//   // New styles for post images
//   imageContainer: {
//     marginBottom: 16,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   postImage: {
//     width: '100%',
//     height: 200,
//     backgroundColor: '#f0f0f0',
//   },
//   actions: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 16,
//     backgroundColor: '#f8f9fa',
//   },
//   likeText: {
//     fontSize: 14,
//     color: '#ff3b30',
//     fontWeight: '600',
//   },
//   commentText: {
//     fontSize: 14,
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   reportButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 8,
//   },
//   reportText: { 
//     fontSize: 16,
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
//   emptyContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#8e8e93',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#c7c7cc',
//   },
//   footer: {
//     paddingVertical: 20,
//   },
// });


































































// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   StyleSheet, 
//   Image, 
//   Alert,
//   RefreshControl,
//   ActivityIndicator,
//   Animated,
//   Dimensions
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');

// const ForumHome = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const router = useRouter();

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const fetchPosts = async (isRefresh = false) => {
//     try {
//       if (!isRefresh) setLoading(true);
//       setError(null);

//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const response = await axios.get('http://127.0.0.1:8000/api/posts/', {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       setPosts(response.data || []);
//     } catch (err) {
//       console.error('Error fetching posts:', err);
//       setError('Failed to load posts. Please try again.');
//       Alert.alert('Error', 'Failed to load posts');
//     } finally {
//       setLoading(false);
//       if (isRefresh) setRefreshing(false);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchPosts(true);
//   }, []);

//   const toggleLike = async (postId) => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         Alert.alert('Error', 'Authentication required');
//         return;
//       }

//       await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/like/`, {}, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       // Update posts locally for immediate feedback
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { ...post, likes_count: (post.likes_count || 0) + 1 }
//             : post
//         )
//       );
//     } catch (err) {
//       console.error('Error toggling like:', err);
//       Alert.alert('Error', 'Failed to like post');
//     }
//   };

//   const handleReport = async (postId) => {
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

//               await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/report/`, 
//                 { post_id: postId },
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

//   const renderItem = ({ item, index }) => {
//     const animatedValue = new Animated.Value(0);
    
//     Animated.timing(animatedValue, {
//       toValue: 1,
//       duration: 300,
//       delay: index * 100,
//       useNativeDriver: true,
//     }).start();

//     return (
//       <Animated.View style={[
//         styles.cardContainer,
//         {
//           opacity: animatedValue,
//           transform: [{
//             translateY: animatedValue.interpolate({
//               inputRange: [0, 1],
//               outputRange: [50, 0],
//             }),
//           }],
//         },
//       ]}>
//         <TouchableOpacity
//           style={styles.card}
//           onPress={() => router.push(`/forum/${item.id}`)}
//           activeOpacity={0.8}
//         >
//           <View style={styles.headerRow}>
//             <Image 
//               source={{
//                 // Use author_avatar for consistency with PostDetail component
//                 uri: item.author_avatar || item.profile_picture || 'https://via.placeholder.com/40/007AFF/white?text=U',
//               }} 
//               style={styles.avatar}
//               defaultSource={{
//                 uri: 'https://via.placeholder.com/40/007AFF/white?text=U'
//               }}
//             />
//             <View style={styles.contentWrapper}>
//               <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
//               <View style={styles.metaRow}>
//                 <Text style={styles.meta}>
//                   By {item.author_name || 'Anonymous'}
//                 </Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.category}>{item.category}</Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
//               </View>
//             </View>
//           </View>
          
//           <Text numberOfLines={3} style={styles.content}>
//             {item.content}
//           </Text>
          
//           <View style={styles.actions}>
//             <TouchableOpacity 
//               style={styles.actionButton}
//               onPress={(e) => {
//                 e.stopPropagation(); // Prevent navigation when liking
//                 toggleLike(item.id);
//               }}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.likeText}>
//                 ❤️ {item.likes_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.actionButton}
//               onPress={() => router.push(`/forum/${item.id}`)} // Fixed: consistent navigation
//               activeOpacity={0.7}
//             >
//               <Text style={styles.commentText}>
//                 💬 {item.comments_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.reportButton}
//               onPress={(e) => {
//                 e.stopPropagation(); // Prevent navigation when reporting
//                 handleReport(item.id);
//               }}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.reportText}>🚩</Text>
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Animated.View>
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyText}>No posts available</Text>
//       <Text style={styles.emptySubtext}>Be the first to share something!</Text>
//     </View>
//   );

//   const renderFooter = () => {
//     if (!loading) return null;
//     return (
//       <View style={styles.footer}>
//         <ActivityIndicator size="small" color="#007AFF" />
//       </View>
//     );
//   };

//   if (loading && posts.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading posts...</Text>
//       </View>
//     );
//   }

//   if (error && posts.length === 0) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => fetchPosts()}>
//           <Text style={styles.retryText}>Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       data={posts}
//       keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//       renderItem={renderItem}
//       contentContainerStyle={[
//         styles.container,
//         posts.length === 0 && styles.containerCentered
//       ]}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           colors={['#007AFF']}
//           tintColor="#007AFF"
//         />
//       }
//       ListEmptyComponent={renderEmptyComponent}
//       ListFooterComponent={renderFooter}
//       showsVerticalScrollIndicator={false}
//       initialNumToRender={10}
//       maxToRenderPerBatch={5}
//       windowSize={10}
//     />
//   );
// };

// export default ForumHome;

// const styles = StyleSheet.create({
//   container: { 
//     padding: 16,
//     backgroundColor: '#f8f9fa',
//   },
//   containerCentered: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   cardContainer: {
//     marginBottom: 12,
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   headerRow: { 
//     flexDirection: 'row', 
//     alignItems: 'flex-start', 
//     marginBottom: 12,
//   },
//   avatar: { 
//     width: 44, 
//     height: 44, 
//     borderRadius: 22, 
//     marginRight: 12,
//     backgroundColor: '#f0f0f0',
//   },
//   contentWrapper: {
//     flex: 1,
//   },
//   title: { 
//     fontSize: 17, 
//     fontWeight: '600',
//     color: '#1a1a1a',
//     lineHeight: 22,
//     marginBottom: 4,
//   },
//   metaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//   },
//   meta: { 
//     fontSize: 13, 
//     color: '#8e8e93',
//     fontWeight: '500',
//   },
//   category: {
//     fontSize: 13,
//     color: '#007AFF',
//     fontWeight: '500',
//   },
//   timeAgo: {
//     fontSize: 13,
//     color: '#8e8e93',
//   },
//   dot: {
//     fontSize: 13,
//     color: '#c7c7cc',
//     marginHorizontal: 6,
//   },
//   content: { 
//     fontSize: 15, 
//     lineHeight: 20,
//     color: '#3a3a3c',
//     marginBottom: 16,
//   },
//   actions: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 16,
//     backgroundColor: '#f8f9fa',
//   },
//   likeText: {
//     fontSize: 14,
//     color: '#ff3b30',
//     fontWeight: '600',
//   },
//   commentText: {
//     fontSize: 14,
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   reportButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 8,
//   },
//   reportText: { 
//     fontSize: 16,
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
//   emptyContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#8e8e93',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#c7c7cc',
//   },
//   footer: {
//     paddingVertical: 20,
//   },
// });






















































































// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   StyleSheet, 
//   Image, 
//   Alert,
//   RefreshControl,
//   ActivityIndicator,
//   Animated,
//   Dimensions
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');

// const ForumHome = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const router = useRouter();

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const fetchPosts = async (isRefresh = false) => {
//     try {
//       if (!isRefresh) setLoading(true);
//       setError(null);

//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const response = await axios.get('http://127.0.0.1:8000/api/posts/', {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       setPosts(response.data || []);
//     } catch (err) {
//       console.error('Error fetching posts:', err);
//       setError('Failed to load posts. Please try again.');
//       Alert.alert('Error', 'Failed to load posts');
//     } finally {
//       setLoading(false);
//       if (isRefresh) setRefreshing(false);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchPosts(true);
//   }, []);

//   const toggleLike = async (postId) => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       if (!token) {
//         Alert.alert('Error', 'Authentication required');
//         return;
//       }

//       await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/like/`, {}, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       // Update posts locally for immediate feedback
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { ...post, likes_count: (post.likes_count || 0) + 1 }
//             : post
//         )
//       );
      
//       // Optionally refetch to get accurate data
//       // fetchPosts();
//     } catch (err) {
//       console.error('Error toggling like:', err);
//       Alert.alert('Error', 'Failed to like post');
//     }
//   };

//   const handleReport = async (postId) => {
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

//               await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/report/`, 
//                 { post_id: postId },
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

//   const renderItem = ({ item, index }) => {
//     const animatedValue = new Animated.Value(0);
    
//     Animated.timing(animatedValue, {
//       toValue: 1,
//       duration: 300,
//       delay: index * 100,
//       useNativeDriver: true,
//     }).start();

//     return (
//       <Animated.View style={[
//         styles.cardContainer,
//         {
//           opacity: animatedValue,
//           transform: [{
//             translateY: animatedValue.interpolate({
//               inputRange: [0, 1],
//               outputRange: [50, 0],
//             }),
//           }],
//         },
//       ]}>
//         <TouchableOpacity
//           style={styles.card}
//           onPress={() => router.push(`/forum/${item.id}`)}
//           activeOpacity={0.8}
//         >
//           <View style={styles.headerRow}>
//             <Image 
//               source={{
//                 // uri: item.author_avatar || 'https://via.placeholder.com/40/007AFF/white?text=U',
//                 uri: item.profile_picture || 'https://via.placeholder.com/40/007AFF/white?text=U',
//               }} 
//               style={styles.avatar}
//               defaultSource={{
//                 uri: 'https://via.placeholder.com/40/007AFF/white?text=U'
//               }}
//             />
//             <View style={styles.contentWrapper}>
//               <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
//               <View style={styles.metaRow}>
//                 <Text style={styles.meta}>
//                   By {item.author_name || 'Anonymous'}
//                 </Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.category}>{item.category}</Text>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
//               </View>
//             </View>
//           </View>
          
//           <Text numberOfLines={3} style={styles.content}>
//             {item.content}
//           </Text>
          
//           <View style={styles.actions}>
//             <TouchableOpacity 
//               style={styles.actionButton}
//               onPress={() => toggleLike(item.id)}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.likeText}>
//                 ❤️ {item.likes_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.actionButton}
//               onPress={() => router.push('/post-details')}
//               // onPress={() => router.push(`/forum/${item.id}`)}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.commentText}>
//                 💬 {item.comments_count || 0}
//               </Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               style={styles.reportButton}
//               onPress={() => handleReport(item.id)}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.reportText}>🚩</Text>
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Animated.View>
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyText}>No posts available</Text>
//       <Text style={styles.emptySubtext}>Be the first to share something!</Text>
//     </View>
//   );

//   const renderFooter = () => {
//     if (!loading) return null;
//     return (
//       <View style={styles.footer}>
//         <ActivityIndicator size="small" color="#007AFF" />
//       </View>
//     );
//   };

//   if (loading && posts.length === 0) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading posts...</Text>
//       </View>
//     );
//   }

//   if (error && posts.length === 0) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => fetchPosts()}>
//           <Text style={styles.retryText}>Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       data={posts}
//       keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//       renderItem={renderItem}
//       contentContainerStyle={[
//         styles.container,
//         posts.length === 0 && styles.containerCentered
//       ]}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           colors={['#007AFF']}
//           tintColor="#007AFF"
//         />
//       }
//       ListEmptyComponent={renderEmptyComponent}
//       ListFooterComponent={renderFooter}
//       showsVerticalScrollIndicator={false}
//       initialNumToRender={10}
//       maxToRenderPerBatch={5}
//       windowSize={10}
//     />
//   );
// };

// export default ForumHome;

// const styles = StyleSheet.create({
//   container: { 
//     padding: 16,
//     backgroundColor: '#f8f9fa',
//   },
//   containerCentered: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   cardContainer: {
//     marginBottom: 12,
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   headerRow: { 
//     flexDirection: 'row', 
//     alignItems: 'flex-start', 
//     marginBottom: 12,
//   },
//   avatar: { 
//     width: 44, 
//     height: 44, 
//     borderRadius: 22, 
//     marginRight: 12,
//     backgroundColor: '#f0f0f0',
//   },
//   contentWrapper: {
//     flex: 1,
//   },
//   title: { 
//     fontSize: 17, 
//     fontWeight: '600',
//     color: '#1a1a1a',
//     lineHeight: 22,
//     marginBottom: 4,
//   },
//   metaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//   },
//   meta: { 
//     fontSize: 13, 
//     color: '#8e8e93',
//     fontWeight: '500',
//   },
//   category: {
//     fontSize: 13,
//     color: '#007AFF',
//     fontWeight: '500',
//   },
//   timeAgo: {
//     fontSize: 13,
//     color: '#8e8e93',
//   },
//   dot: {
//     fontSize: 13,
//     color: '#c7c7cc',
//     marginHorizontal: 6,
//   },
//   content: { 
//     fontSize: 15, 
//     lineHeight: 20,
//     color: '#3a3a3c',
//     marginBottom: 16,
//   },
//   actions: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 16,
//     backgroundColor: '#f8f9fa',
//   },
//   likeText: {
//     fontSize: 14,
//     color: '#ff3b30',
//     fontWeight: '600',
//   },
//   commentText: {
//     fontSize: 14,
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   reportButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 8,
//   },
//   reportText: { 
//     fontSize: 16,
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
//   emptyContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#8e8e93',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#c7c7cc',
//   },
//   footer: {
//     paddingVertical: 20,
//   },
// });






































// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert
// } from 'react-native';
// import { useRouter } from 'expo-router';
// // import { useAuth } from '../../context/AuthContext';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const ForumHome = () => {
//   const [posts, setPosts] = useState<any[]>([]);
//   // const { token } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const fetchPosts = async () => {
//     try {
//       // const res = await axios.get('http://127.0.0.1:8000/api/posts/', {
//       //   headers: { Authorization: `Bearer ${token}` },
//       // });
//       // const data = await res.json();
//       // setPosts(data);

//       const token = await AsyncStorage.getItem('access_token');
//       const response = await axios.get('http://127.0.0.1:8000/api/posts/', {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       setPosts(response.data);


//     } catch {
//       Alert.alert('Error', 'Failed to load posts');
//     }
//   };

//   const toggleLike = async (postId: number) => {
//     const token = await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/like/`, {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     fetchPosts();
//   };

//   const handleReport = async (postId: number) => {
//     await fetch(`http://127.0.0.1:8000/api/report/`, {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     Alert.alert('Reported', 'Post reported');
//   };

//   const renderItem = ({ item }: any) => (
//     <TouchableOpacity
//       style={styles.card}
//       onPress={() => router.push(`/forum/${item.id}`)}
//     >
//       <View style={styles.headerRow}>
//         <Image source={{
//           uri: item.author_avatar || 'https://via.placeholder.com/40',
//         }} style={styles.avatar} />
//         <View style={{ flex: 1 }}>
//           <Text style={styles.title}>{item.title}</Text>
//           <Text style={styles.meta}>By {item.author_name} • {item.category}</Text>
//         </View>
//       </View>
//       <Text numberOfLines={2} style={styles.content}>{item.content}</Text>
//       <View style={styles.actions}>
//         <TouchableOpacity onPress={() => toggleLike(item.id)}>
//           <Text>❤️ {item.likes_count || 0}</Text>
//         </TouchableOpacity>
//         <Text>💬 {item.comments_count || 0}</Text>
//         <TouchableOpacity onPress={() => handleReport(item.id)}>
//           <Text style={styles.report}>🚩</Text>
//         </TouchableOpacity>
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <FlatList
//       data={posts}
//       keyExtractor={(i) => i.id.toString()}
//       renderItem={renderItem}
//       contentContainerStyle={styles.container}
//     />
//   );
// };

// export default ForumHome;

// const styles = StyleSheet.create({
//   container: { padding: 16 },
//   card: {
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 12,
//     elevation: 2,
//   },
//   headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
//   avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
//   title: { fontSize: 16, fontWeight: 'bold' },
//   meta: { fontSize: 12, color: '#666' },
//   content: { fontSize: 14, marginVertical: 6 },
//   actions: { flexDirection: 'row', justifyContent: 'space-between' },
//   report: { color: 'red' },
// });
