



import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TextInput,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import ConnectionAPI from '../api/connectionService'; 

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface MarketplaceItem {
  id: number;
  title: string;
  price: string;
  category: string;
  condition: string;
  description?: string;
  image: string | null;
  is_sold?: boolean;
  is_current_user?: boolean;
  created_at?: string;
  owner?: {
    username: string;
  };
  seller?: {
    username: string;
    email?: string;
  };
}

export default function MarketplaceFeed() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  const categories = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other'];

  useEffect(() => {
    fetchMarketplaceItems();
    
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

    // FAB breathing animation
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(fabScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    breatheAnimation.start();

    return () => breatheAnimation.stop();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

  const fetchMarketplaceItems = async () => {
    try {
      setError(null);
      const data = await ConnectionAPI.getMarketplaceItems();
      setItems(data);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      setError(error.message || 'Failed to load marketplace items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMarketplaceItems();
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const filterItems = () => {
    let filtered = items;

    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.condition.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  };

  const handleItemPress = (item: MarketplaceItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to item detail page with item ID
    router.push(`/market-place/market-place-item-detail?itemId=${item.id}`);
  };

  const handleCreateItemPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to create item page
    router.push('/market-place/create-market-place-item');
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth/dashboard');
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getImageUri = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/')) {
      return `${ConnectionAPI.getBaseUrl()}${imageUrl}`;
    } else {
      return `${ConnectionAPI.getBaseUrl()}/${imageUrl}`;
    }
  };

  const renderGridItem = ({ item, index }: { item: MarketplaceItem; index: number }) => (
    <Animated.View
      style={[
        styles.gridCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.gridCardContent}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.gridImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: getImageUri(item.image) }}
              style={styles.gridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.gridPlaceholder}>
              <Ionicons name="image-outline" size={32} color="#ccc" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          
          {item.is_sold && (
            <View style={styles.soldBadge}>
              <Text style={styles.soldBadgeText}>SOLD</Text>
            </View>
          )}

          <View style={[styles.conditionBadge, getConditionBadgeStyle(item.condition)]}>
            <Text style={styles.conditionBadgeText}>{item.condition}</Text>
          </View>
        </View>

        <View style={styles.gridContent}>
          <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
          
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.priceContainer}
          >
            <Text style={styles.gridPrice}>UGX {Number(item.price).toLocaleString()}</Text>
          </LinearGradient>

          <View style={styles.gridMeta}>
            <View style={styles.categoryTag}>
              <Ionicons name="pricetag" size={12} color="#667eea" />
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderListItem = ({ item }: { item: MarketplaceItem }) => (
    <Animated.View
      style={[
        styles.listCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.listCardContent}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.listImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: getImageUri(item.image) }}
              style={styles.listImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.listPlaceholder}>
              <Ionicons name="image-outline" size={28} color="#ccc" />
            </View>
          )}
          
          {item.is_sold && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldOverlayText}>SOLD</Text>
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
          
          <Text style={styles.listPrice}>UGX {Number(item.price).toLocaleString()}</Text>
          
          <View style={styles.listMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={12} color="#ffa502" />
              <Text style={styles.metaText}>{item.condition}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="pricetag" size={12} color="#667eea" />
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
          </View>

          {item.owner && (
            <View style={styles.ownerInfo}>
              <Ionicons name="person-circle-outline" size={14} color="#666" />
              <Text style={styles.ownerText}>by {item.owner.username}</Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    </Animated.View>
  );

  const getConditionBadgeStyle = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new':
        return { backgroundColor: '#2ed573' };
      case 'excellent':
        return { backgroundColor: '#1e90ff' };
      case 'good':
        return { backgroundColor: '#ffa502' };
      case 'fair':
        return { backgroundColor: '#ff6b6b' };
      default:
        return { backgroundColor: '#666' };
    }
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item && styles.categoryButtonActive
            ]}
            onPress={() => {
              setSelectedCategory(item);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === item && styles.categoryButtonTextActive
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderTopBar = () => (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.topBar}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.topBarTitle}>Marketplace</Text>
        <Text style={styles.topBarSubtitle}>Buy & Sell Items</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={toggleViewMode}
        >
          <Ionicons 
            name={viewMode === 'grid' ? 'list' : 'grid'} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search marketplace..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFloatingActionButton = () => (
    <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateItemPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#ff6b6b', '#ee5a52']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="storefront-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Items Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedCategory !== 'All' 
          ? 'Try adjusting your search or filters'
          : 'Be the first to post an item for sale!'
        }
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={80} color="#ff6b6b" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={fetchMarketplaceItems}
      >
        <Ionicons name="refresh" size={20} color="white" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderTopBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading marketplace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      {renderTopBar()}
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {error ? (
          renderErrorState()
        ) : (
          <>
            {renderHeader()}
            {renderCategoryFilter()}
            
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
              numColumns={viewMode === 'grid' ? 2 : 1}
              key={viewMode} // Force re-render when view mode changes
              contentContainerStyle={[
                styles.listContainer,
                filteredItems.length === 0 && styles.emptyListContainer
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#667eea']}
                  tintColor="#667eea"
                />
              }
              ListEmptyComponent={renderEmptyState}
              onEndReachedThreshold={0.5}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={true}
              getItemLayout={viewMode === 'grid' ? undefined : (data, index) => ({
                length: 120,
                offset: 120 * index,
                index,
              })}
            />
          </>
        )}
      </Animated.View>

      {renderFloatingActionButton()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 15 : 25,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  topBarSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerActionButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 10,
  },
  categoryContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  categoryButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Grid item styles
  gridCard: {
    flex: 1,
    margin: 8,
    backgroundColor: 'white',
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridCardContent: {
    overflow: 'hidden',
    borderRadius: 15,
  },
  gridImageContainer: {
    position: 'relative',
    height: 150,
    backgroundColor: '#f8f9fa',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  soldBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  soldBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  conditionBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  gridPrice: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  // List item styles
  listCard: {
    backgroundColor: 'white',
    marginVertical: 8,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listCardContent: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  listImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    marginRight: 15,
  },
  listImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  listPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#dc3545',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 8,
  },
  soldOverlayText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  listPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
  },
  listMeta: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownerText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  // FAB styles
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

























// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   RefreshControl,
//   SafeAreaView,
//   StatusBar,
//   Dimensions,
//   TextInput,
//   Alert,
//   Animated,
//   Platform,
//   Modal,
//   ScrollView,
//   KeyboardAvoidingView,
//   Keyboard,
//   Linking,
//   Share
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import * as Haptics from 'expo-haptics';
// import * as ImagePicker from 'expo-image-picker';
// import { useNavigation } from '@react-navigation/native';
// import { useRouter } from 'expo-router';
// import ConnectionAPI from '../api/connectionService'; 

// const { width, height } = Dimensions.get('window');
// const CARD_WIDTH = (width - 48) / 2;

// interface MarketplaceItem {
//   id: number;
//   title: string;
//   price: string;
//   category: string;
//   condition: string;
//   description?: string;
//   image: string | null;
//   is_sold?: boolean;
//   is_current_user?: boolean;
//   created_at?: string;
//   owner?: {
//     username: string;
//   };
//   seller?: {
//     username: string;
//     email?: string;
//   };
// }

// export default function MarketplaceFeed() {
//   const [items, setItems] = useState<MarketplaceItem[]>([]);
//   const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('All');
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
//   const [error, setError] = useState<string | null>(null);
  
//   // Modal states
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  
//   // Create form states
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [price, setPrice] = useState('');
//   const [imageBase64, setImageBase64] = useState(null);
//   const [createLoading, setCreateLoading] = useState(false);
//   const [formErrors, setFormErrors] = useState({});
//   const [imagePickerLoading, setImagePickerLoading] = useState(false);
  
//   // Detail states
//   const [markingAsSold, setMarkingAsSold] = useState(false);
//   const [imageLoading, setImageLoading] = useState(true);

//   const router = useRouter();
//   const navigation = useNavigation();
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(30)).current;
//   const fabScale = useRef(new Animated.Value(1)).current;

//   const categories = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other'];

//   useEffect(() => {
//     fetchMarketplaceItems();
    
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

//     // FAB breathing animation
//     const breatheAnimation = Animated.loop(
//       Animated.sequence([
//         Animated.timing(fabScale, {
//           toValue: 1.1,
//           duration: 2000,
//           useNativeDriver: true,
//         }),
//         Animated.timing(fabScale, {
//           toValue: 1,
//           duration: 2000,
//           useNativeDriver: true,
//         }),
//       ])
//     );
//     breatheAnimation.start();

//     return () => breatheAnimation.stop();
//   }, []);

//   useEffect(() => {
//     filterItems();
//   }, [items, searchQuery, selectedCategory]);

//   const fetchMarketplaceItems = async () => {
//     try {
//       setError(null);
//       const data = await ConnectionAPI.getMarketplaceItems();
//       setItems(data);
//     } catch (error) {
//       console.error('Error fetching marketplace items:', error);
//       setError(error.message || 'Failed to load marketplace items. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await fetchMarketplaceItems();
//     setRefreshing(false);
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//   }, []);

//   const filterItems = () => {
//     let filtered = items;

//     if (searchQuery.trim()) {
//       filtered = filtered.filter(item =>
//         item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.condition.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     if (selectedCategory !== 'All') {
//       filtered = filtered.filter(item => item.category === selectedCategory);
//     }

//     setFilteredItems(filtered);
//   };

//   const handleItemPress = (item: MarketplaceItem) => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     setSelectedItem(item);
//     setShowDetailModal(true);
//   };

//   const handleBackPress = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     router.push('/auth/dashboard');
//   };

//   const toggleViewMode = () => {
//     setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//   };

//   const getImageUri = (imageUrl: string | null) => {
//     if (!imageUrl) return null;
    
//     if (imageUrl.startsWith('http')) {
//       return imageUrl;
//     } else if (imageUrl.startsWith('/')) {
//       return `${ConnectionAPI.getBaseUrl()}${imageUrl}`;
//     } else {
//       return `${ConnectionAPI.getBaseUrl()}/${imageUrl}`;
//     }
//   };

//   // Create Item Functions
//   const validateField = (field, value) => {
//     const newErrors = { ...formErrors };
    
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
    
//     setFormErrors(newErrors);
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

//   const handleCreateSubmit = async () => {
//     validateField('title', title);
//     validateField('description', description);
//     validateField('price', price);

//     if (Object.keys(formErrors).length > 0 || !title.trim() || !description.trim() || !price.trim()) {
//       Alert.alert('Validation Error', 'Please fix all errors before submitting.');
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       return;
//     }

//     Alert.alert(
//       'Confirm Posting',
//       'Are you sure you want to post this item for sale?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Post Item', onPress: performCreateSubmit }
//       ]
//     );
//   };

//   const performCreateSubmit = async () => {
//     setCreateLoading(true);
//     Keyboard.dismiss();

//     try {
//       const itemData = {
//         title: title.trim(),
//         description: description.trim(),
//         price: Number(price),
//         image: imageBase64 || null,
//       };

//       await ConnectionAPI.createMarketplaceItem(itemData);

//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       Alert.alert(
//         'Success!',
//         'Your item has been posted successfully.',
//         [
//           {
//             text: 'OK',
//             onPress: () => {
//               setShowCreateModal(false);
//               resetCreateForm();
//               fetchMarketplaceItems();
//             }
//           }
//         ]
//       );
//     } catch (error) {
//       console.error('Upload failed:', error);
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
//       let errorMessage = error.message || 'Failed to post item. Please try again.';
      
//       if (errorMessage.includes('413') || errorMessage.toLowerCase().includes('image too large')) {
//         errorMessage = 'Image is too large. Please choose a smaller image.';
//       } else if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('authentication')) {
//         errorMessage = 'Authentication failed. Please log in again.';
//       }
      
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setCreateLoading(false);
//     }
//   };

//   const resetCreateForm = () => {
//     setTitle('');
//     setDescription('');
//     setPrice('');
//     setImageBase64(null);
//     setFormErrors({});
//   };

//   const formatPrice = (text) => {
//     const cleaned = text.replace(/[^0-9.]/g, '');
//     setPrice(cleaned);
//     validateField('price', cleaned);
//   };

//   // Detail Functions
//   const markAsSold = async () => {
//     Alert.alert(
//       'Confirm Action',
//       'Are you sure you want to mark this item as sold?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Yes, Mark as Sold', onPress: performMarkAsSold }
//       ]
//     );
//   };

//   const performMarkAsSold = async () => {
//     setMarkingAsSold(true);
//     try {
//       await ConnectionAPI.getMarketplaceItemMarkasSold(selectedItem?.id);
      
//       Alert.alert('Success', 'Item marked as sold!');
//       fetchMarketplaceItems();
//       setShowDetailModal(false);
//     } catch (error) {
//       console.error('Error marking as sold:', error);
//       Alert.alert('Error', error.message || 'Failed to mark as sold');
//     } finally {
//       setMarkingAsSold(false);
//     }
//   };

//   const shareItem = async () => {
//     if (!selectedItem) return;
    
//     try {
//       await Share.share({
//         message: `Check out this ${selectedItem.title} for UGX ${selectedItem.price}`,
//         title: selectedItem.title,
//       });
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   const contactSeller = () => {
//     if (!selectedItem?.seller?.email) {
//       Alert.alert('Contact Info', 'No contact information available');
//       return;
//     }
    
//     Alert.alert(
//       'Contact Seller',
//       'How would you like to contact the seller?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Email', 
//           onPress: () => Linking.openURL(`mailto:${selectedItem.seller.email}?subject=Interested in ${selectedItem.title}`)
//         },
//       ]
//     );
//   };

//   const renderGridItem = ({ item, index }: { item: MarketplaceItem; index: number }) => (
//     <Animated.View
//       style={[
//         styles.gridCard,
//         {
//           opacity: fadeAnim,
//           transform: [{ translateY: slideAnim }],
//         },
//       ]}
//     >
//       <TouchableOpacity
//         style={styles.gridCardContent}
//         onPress={() => handleItemPress(item)}
//         activeOpacity={0.8}
//       >
//         <View style={styles.gridImageContainer}>
//           {item.image ? (
//             <Image
//               source={{ uri: getImageUri(item.image) }}
//               style={styles.gridImage}
//               resizeMode="cover"
//             />
//           ) : (
//             <View style={styles.gridPlaceholder}>
//               <Ionicons name="image-outline" size={32} color="#ccc" />
//               <Text style={styles.placeholderText}>No Image</Text>
//             </View>
//           )}
          
//           {item.is_sold && (
//             <View style={styles.soldBadge}>
//               <Text style={styles.soldBadgeText}>SOLD</Text>
//             </View>
//           )}

//           <View style={[styles.conditionBadge, getConditionBadgeStyle(item.condition)]}>
//             <Text style={styles.conditionBadgeText}>{item.condition}</Text>
//           </View>
//         </View>

//         <View style={styles.gridContent}>
//           <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
          
//           <LinearGradient
//             colors={['#667eea', '#764ba2']}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.priceContainer}
//           >
//             <Text style={styles.gridPrice}>UGX {Number(item.price).toLocaleString()}</Text>
//           </LinearGradient>

//           <View style={styles.gridMeta}>
//             <View style={styles.categoryTag}>
//               <Ionicons name="pricetag" size={12} color="#667eea" />
//               <Text style={styles.categoryText}>{item.category}</Text>
//             </View>
//           </View>
//         </View>
//       </TouchableOpacity>
//     </Animated.View>
//   );

//   const renderListItem = ({ item }: { item: MarketplaceItem }) => (
//     <Animated.View
//       style={[
//         styles.listCard,
//         {
//           opacity: fadeAnim,
//           transform: [{ translateY: slideAnim }],
//         },
//       ]}
//     >
//       <TouchableOpacity
//         style={styles.listCardContent}
//         onPress={() => handleItemPress(item)}
//         activeOpacity={0.8}
//       >
//         <View style={styles.listImageContainer}>
//           {item.image ? (
//             <Image
//               source={{ uri: getImageUri(item.image) }}
//               style={styles.listImage}
//               resizeMode="cover"
//             />
//           ) : (
//             <View style={styles.listPlaceholder}>
//               <Ionicons name="image-outline" size={28} color="#ccc" />
//             </View>
//           )}
          
//           {item.is_sold && (
//             <View style={styles.soldOverlay}>
//               <Text style={styles.soldOverlayText}>SOLD</Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.listContent}>
//           <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
          
//           <Text style={styles.listPrice}>UGX {Number(item.price).toLocaleString()}</Text>
          
//           <View style={styles.listMeta}>
//             <View style={styles.metaItem}>
//               <Ionicons name="star" size={12} color="#ffa502" />
//               <Text style={styles.metaText}>{item.condition}</Text>
//             </View>
//             <View style={styles.metaItem}>
//               <Ionicons name="pricetag" size={12} color="#667eea" />
//               <Text style={styles.metaText}>{item.category}</Text>
//             </View>
//           </View>

//           {item.owner && (
//             <View style={styles.ownerInfo}>
//               <Ionicons name="person-circle-outline" size={14} color="#666" />
//               <Text style={styles.ownerText}>by {item.owner.username}</Text>
//             </View>
//           )}
//         </View>

//         <Ionicons name="chevron-forward" size={20} color="#ccc" />
//       </TouchableOpacity>
//     </Animated.View>
//   );

//   const getConditionBadgeStyle = (condition: string) => {
//     switch (condition.toLowerCase()) {
//       case 'new':
//         return { backgroundColor: '#2ed573' };
//       case 'excellent':
//         return { backgroundColor: '#1e90ff' };
//       case 'good':
//         return { backgroundColor: '#ffa502' };
//       case 'fair':
//         return { backgroundColor: '#ff6b6b' };
//       default:
//         return { backgroundColor: '#666' };
//     }
//   };

//   const renderCategoryFilter = () => (
//     <View style={styles.categoryContainer}>
//       <FlatList
//         data={categories}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         keyExtractor={(item) => item}
//         contentContainerStyle={styles.categoryList}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={[
//               styles.categoryButton,
//               selectedCategory === item && styles.categoryButtonActive
//             ]}
//             onPress={() => {
//               setSelectedCategory(item);
//               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//             }}
//           >
//             <Text
//               style={[
//                 styles.categoryButtonText,
//                 selectedCategory === item && styles.categoryButtonTextActive
//               ]}
//             >
//               {item}
//             </Text>
//           </TouchableOpacity>
//         )}
//       />
//     </View>
//   );

//   const renderTopBar = () => (
//     <LinearGradient
//       colors={['#667eea', '#764ba2']}
//       style={styles.topBar}
//     >
//       <TouchableOpacity
//         style={styles.backButton}
//         onPress={handleBackPress}
//         activeOpacity={0.7}
//       >
//         <Ionicons name="arrow-back" size={24} color="white" />
//       </TouchableOpacity>

//       <View style={styles.titleContainer}>
//         <Text style={styles.topBarTitle}>Marketplace</Text>
//         <Text style={styles.topBarSubtitle}>Buy & Sell Items</Text>
//       </View>

//       <View style={styles.actionButtons}>
//         <TouchableOpacity
//           style={styles.headerActionButton}
//           onPress={toggleViewMode}
//         >
//           <Ionicons 
//             name={viewMode === 'grid' ? 'list' : 'grid'} 
//             size={24} 
//             color="white" 
//           />
//         </TouchableOpacity>
//       </View>
//     </LinearGradient>
//   );

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <View style={styles.searchContainer}>
//         <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search marketplace..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           placeholderTextColor="#999"
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity
//             onPress={() => setSearchQuery('')}
//             style={styles.clearButton}
//           >
//             <Ionicons name="close-circle" size={20} color="#666" />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );

//   const renderFloatingActionButton = () => (
//     <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
//       <TouchableOpacity
//         style={styles.fab}
//         onPress={() => {
//           setShowCreateModal(true);
//           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//         }}
//         activeOpacity={0.8}
//       >
//         <LinearGradient
//           colors={['#ff6b6b', '#ee5a52']}
//           style={styles.fabGradient}
//         >
//           <Ionicons name="add" size={28} color="white" />
//         </LinearGradient>
//       </TouchableOpacity>
//     </Animated.View>
//   );

//   const renderCreateModal = () => (
//     <Modal
//       visible={showCreateModal}
//       animationType="slide"
//       presentationStyle="fullScreen"
//       onRequestClose={() => setShowCreateModal(false)}
//     >
//       <SafeAreaView style={styles.modalContainer}>
//         <StatusBar barStyle="light-content" backgroundColor="#667eea" />
//         <KeyboardAvoidingView
//           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           style={styles.keyboardView}
//         >
//           <ScrollView
//             style={styles.scrollView}
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             <LinearGradient
//               colors={['#667eea', '#764ba2']}
//               style={styles.createHeader}
//             >
//               <TouchableOpacity
//                 style={styles.modalBackButton}
//                 onPress={() => {
//                   setShowCreateModal(false);
//                   resetCreateForm();
//                 }}
//               >
//                 <Ionicons name="close" size={24} color="white" />
//               </TouchableOpacity>
//               <Ionicons name="storefront-outline" size={32} color="white" />
//               <Text style={styles.createHeaderTitle}>Create New Listing</Text>
//               <Text style={styles.createHeaderSubtitle}>Fill in the details below</Text>
//             </LinearGradient>

//             <View style={styles.createFormContainer}>
//               {/* Title Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="text-outline" size={16} color="#667eea" /> Title *
//                 </Text>
//                 <TextInput
//                   placeholder="Enter item title"
//                   style={[styles.input, formErrors.title && styles.inputError]}
//                   value={title}
//                   onChangeText={(text) => {
//                     setTitle(text);
//                     validateField('title', text);
//                   }}
//                   maxLength={100}
//                   placeholderTextColor="#999"
//                 />
//                 {formErrors.title && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{formErrors.title}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{title.length}/100</Text>
//               </View>

//               {/* Description Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="document-text-outline" size={16} color="#667eea" /> Description *
//                 </Text>
//                 <TextInput
//                   placeholder="Describe your item in detail"
//                   style={[styles.input, styles.textArea, formErrors.description && styles.inputError]}
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
//                 {formErrors.description && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{formErrors.description}</Text>
//                   </View>
//                 )}
//                 <Text style={styles.characterCount}>{description.length}/500</Text>
//               </View>

//               {/* Price Input */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="pricetag-outline" size={16} color="#667eea" /> Price (UGX) *
//                 </Text>
//                 <View style={[styles.priceInputContainer, formErrors.price && styles.inputError]}>
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
//                 {formErrors.price && (
//                   <View style={styles.errorContainer}>
//                     <Ionicons name="alert-circle" size={16} color="#ff4757" />
//                     <Text style={styles.errorText}>{formErrors.price}</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Image Section */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>
//                   <Ionicons name="camera-outline" size={16} color="#667eea" /> Product Image
//                 </Text>
                
//                 {!imageBase64 ? (
//                   <TouchableOpacity
//                     style={styles.imagePickerButton}
//                     onPress={showImagePicker}
//                     disabled={imagePickerLoading}
//                   >
//                     {imagePickerLoading ? (
//                       <ActivityIndicator size="small" color="#667eea" />
//                     ) : (
//                       <>
//                         <Ionicons name="camera" size={32} color="#667eea" />
//                         <Text style={styles.imagePickerText}>Add Photo</Text>
//                         <Text style={styles.imagePickerSubtext}>Tap to add an image</Text>
//                       </>
//                     )}
//                   </TouchableOpacity>
//                 ) : (
//                   <View style={styles.imagePreviewContainer}>
//                     <Image
//                       source={{ uri: imageBase64 }}
//                       style={styles.imagePreview}
//                       resizeMode="cover"
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

//               {/* Submit Button - This was cut off */}
//               <TouchableOpacity
//                 style={[styles.submitButton, createLoading && styles.submitButtonDisabled]}
//                 onPress={handleCreateSubmit}
//                 disabled={createLoading}
//               >
//                 <LinearGradient
//                   colors={createLoading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
//                   style={styles.submitButtonGradient}
//                 >
//                   {createLoading ? (
//                     <ActivityIndicator size="small" color="white" />
//                   ) : (
//                     <Text style={styles.submitButtonText}>Post Item</Text>
//                   )}
//                 </LinearGradient>
//               </TouchableOpacity>
//             </View>
//           </ScrollView>
//         </KeyboardAvoidingView>
//       </SafeAreaView>
//     </Modal>
//   );

//   const renderDetailModal = () => (
//     <Modal
//       visible={showDetailModal}
//       animationType="slide"
//       presentationStyle="fullScreen"
//       onRequestClose={() => setShowDetailModal(false)}
//     >
//       <SafeAreaView style={styles.modalContainer}>
//         <StatusBar barStyle="light-content" backgroundColor="#667eea" />
//         <ScrollView
//           style={styles.scrollView}
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//         >
//           {selectedItem && (
//             <>
//               <View style={styles.detailHeader}>
//                 <TouchableOpacity
//                   style={styles.modalBackButton}
//                   onPress={() => setShowDetailModal(false)}
//                 >
//                   <Ionicons name="arrow-back" size={24} color="white" />
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   style={styles.shareButton}
//                   onPress={shareItem}
//                 >
//                   <Ionicons name="share-outline" size={24} color="white" />
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.detailImageContainer}>
//                 {selectedItem.image ? (
//                   <Image
//                     source={{ uri: getImageUri(selectedItem.image) }}
//                     style={styles.detailImage}
//                     resizeMode="cover"
//                     onLoadStart={() => setImageLoading(true)}
//                     onLoadEnd={() => setImageLoading(false)}
//                   />
//                 ) : (
//                   <View style={styles.detailPlaceholder}>
//                     <Ionicons name="image-outline" size={80} color="#ccc" />
//                     <Text style={styles.placeholderText}>No Image Available</Text>
//                   </View>
//                 )}
                
//                 {imageLoading && (
//                   <View style={styles.imageLoadingOverlay}>
//                     <ActivityIndicator size="large" color="#667eea" />
//                   </View>
//                 )}

//                 {selectedItem.is_sold && (
//                   <View style={styles.soldOverlayLarge}>
//                     <Text style={styles.soldOverlayTextLarge}>SOLD OUT</Text>
//                   </View>
//                 )}
//               </View>

//               <View style={styles.detailContent}>
//                 <View style={styles.detailPriceContainer}>
//                   <Text style={styles.detailPrice}>
//                     UGX {Number(selectedItem.price).toLocaleString()}
//                   </Text>
//                   <View style={[styles.conditionBadgeLarge, getConditionBadgeStyle(selectedItem.condition)]}>
//                     <Text style={styles.conditionBadgeTextLarge}>{selectedItem.condition}</Text>
//                   </View>
//                 </View>

//                 <Text style={styles.detailTitle}>{selectedItem.title}</Text>

//                 <View style={styles.detailMeta}>
//                   <View style={styles.metaRow}>
//                     <Ionicons name="pricetag" size={16} color="#667eea" />
//                     <Text style={styles.metaLabel}>Category:</Text>
//                     <Text style={styles.metaValue}>{selectedItem.category}</Text>
//                   </View>
                  
//                   {selectedItem.seller && (
//                     <View style={styles.metaRow}>
//                       <Ionicons name="person" size={16} color="#667eea" />
//                       <Text style={styles.metaLabel}>Seller:</Text>
//                       <Text style={styles.metaValue}>{selectedItem.seller.username}</Text>
//                     </View>
//                   )}
                  
//                   {selectedItem.created_at && (
//                     <View style={styles.metaRow}>
//                       <Ionicons name="calendar" size={16} color="#667eea" />
//                       <Text style={styles.metaLabel}>Posted:</Text>
//                       <Text style={styles.metaValue}>
//                         {new Date(selectedItem.created_at).toLocaleDateString()}
//                       </Text>
//                     </View>
//                   )}
//                 </View>

//                 {selectedItem.description && (
//                   <View style={styles.descriptionContainer}>
//                     <Text style={styles.descriptionTitle}>Description</Text>
//                     <Text style={styles.descriptionText}>{selectedItem.description}</Text>
//                   </View>
//                 )}

//                 <View style={styles.actionButtons}>
//                   {selectedItem.is_current_user ? (
//                     <TouchableOpacity
//                       style={[styles.actionButton, styles.markSoldButton]}
//                       onPress={markAsSold}
//                       disabled={markingAsSold || selectedItem.is_sold}
//                     >
//                       {markingAsSold ? (
//                         <ActivityIndicator size="small" color="white" />
//                       ) : (
//                         <>
//                           <Ionicons 
//                             name={selectedItem.is_sold ? "checkmark-circle" : "checkmark"} 
//                             size={20} 
//                             color="white" 
//                           />
//                           <Text style={styles.actionButtonText}>
//                             {selectedItem.is_sold ? "Marked as Sold" : "Mark as Sold"}
//                           </Text>
//                         </>
//                       )}
//                     </TouchableOpacity>
//                   ) : (
//                     <TouchableOpacity
//                       style={[styles.actionButton, styles.contactButton]}
//                       onPress={contactSeller}
//                       disabled={selectedItem.is_sold}
//                     >
//                       <Ionicons name="mail" size={20} color="white" />
//                       <Text style={styles.actionButtonText}>
//                         {selectedItem.is_sold ? "Item Sold" : "Contact Seller"}
//                       </Text>
//                     </TouchableOpacity>
//                   )}
//                 </View>
//               </View>
//             </>
//           )}
//         </ScrollView>
//       </SafeAreaView>
//     </Modal>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Ionicons name="storefront-outline" size={80} color="#ccc" />
//       <Text style={styles.emptyTitle}>No Items Found</Text>
//       <Text style={styles.emptySubtitle}>
//         {searchQuery || selectedCategory !== 'All' 
//           ? 'Try adjusting your search or filters'
//           : 'Be the first to post an item for sale!'
//         }
//       </Text>
//     </View>
//   );

//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <Ionicons name="alert-circle-outline" size={80} color="#ff6b6b" />
//       <Text style={styles.errorTitle}>Something went wrong</Text>
//       <Text style={styles.errorMessage}>{error}</Text>
//       <TouchableOpacity
//         style={styles.retryButton}
//         onPress={fetchMarketplaceItems}
//       >
//         <Ionicons name="refresh" size={20} color="white" />
//         <Text style={styles.retryButtonText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         {renderTopBar()}
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#667eea" />
//           <Text style={styles.loadingText}>Loading marketplace...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#667eea" />
//       {renderTopBar()}
      
//       <Animated.View
//         style={[
//           styles.content,
//           {
//             opacity: fadeAnim,
//             transform: [{ translateY: slideAnim }],
//           },
//         ]}
//       >
//         {error ? (
//           renderErrorState()
//         ) : (
//           <>
//             {renderHeader()}
//             {renderCategoryFilter()}
            
//             <FlatList
//               data={filteredItems}
//               keyExtractor={(item) => item.id.toString()}
//               renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
//               numColumns={viewMode === 'grid' ? 2 : 1}
//               key={viewMode} // Force re-render when view mode changes
//               contentContainerStyle={[
//                 styles.listContainer,
//                 filteredItems.length === 0 && styles.emptyListContainer
//               ]}
//               showsVerticalScrollIndicator={false}
//               refreshControl={
//                 <RefreshControl
//                   refreshing={refreshing}
//                   onRefresh={onRefresh}
//                   colors={['#667eea']}
//                   tintColor="#667eea"
//                 />
//               }
//               ListEmptyComponent={renderEmptyState}
//               onEndReachedThreshold={0.5}
//               initialNumToRender={10}
//               maxToRenderPerBatch={10}
//               windowSize={10}
//               removeClippedSubviews={true}
//               getItemLayout={viewMode === 'grid' ? undefined : (data, index) => ({
//                 length: 120,
//                 offset: 120 * index,
//                 index,
//               })}
//             />
//           </>
//         )}
//       </Animated.View>

//       {renderFloatingActionButton()}
//       {renderCreateModal()}
//       {renderDetailModal()}
//     </SafeAreaView>
//   );
// }





// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
  
//   // Top Bar Styles
//   topBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     paddingTop: Platform.OS === 'ios' ? 16 : 12, // Add extra padding for iOS
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   backButton: {
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//   },
//   titleContainer: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   topBarTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   topBarSubtitle: {
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.8)',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//   },
//   headerActionButton: {
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     marginLeft: 8,
//   },

//   // Header Styles
//   header: {
//     padding: 16,
//     backgroundColor: 'white',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f1f3f4',
//     borderRadius: 25,
//     paddingHorizontal: 16,
//     height: 50,
//   },
//   searchIcon: {
//     marginRight: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#333',
//   },
//   clearButton: {
//     padding: 4,
//   },

//   // Category Filter Styles
//   categoryContainer: {
//     backgroundColor: 'white',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e5e9',
//   },
//   categoryList: {
//     paddingHorizontal: 16,
//   },
//   categoryButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: '#f1f3f4',
//     marginRight: 8,
//   },
//   categoryButtonActive: {
//     backgroundColor: '#667eea',
//   },
//   categoryButtonText: {
//     fontSize: 14,
//     color: '#666',
//     fontWeight: '500',
//   },
//   categoryButtonTextActive: {
//     color: 'white',
//   },

//   // List Content Styles
//   listContent: {
//     padding: 16,
//   },
//   itemSeparator: {
//     height: 16,
//   },

//   // Grid Item Styles
//   gridCard: {
//     width: CARD_WIDTH,
//     marginHorizontal: 8,
//     marginBottom: 16,
//   },
//   gridCardContent: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     overflow: 'hidden',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   gridImageContainer: {
//     position: 'relative',
//     height: 120,
//   },
//   gridImage: {
//     width: '100%',
//     height: '100%',
//   },
//   gridPlaceholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   placeholderText: {
//     fontSize: 12,
//     color: '#999',
//     marginTop: 4,
//   },
//   soldBadge: {
//     position: 'absolute',
//     top: 8,
//     left: 8,
//     backgroundColor: '#ff4757',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   soldBadgeText: {
//     color: 'white',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   conditionBadge: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   conditionBadgeText: {
//     color: 'white',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   gridContent: {
//     padding: 12,
//   },
//   gridTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//   },
//   priceContainer: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//     marginBottom: 8,
//   },
//   gridPrice: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   gridMeta: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   categoryTag: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f1f3f4',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   categoryText: {
//     fontSize: 10,
//     color: '#667eea',
//     marginLeft: 4,
//     fontWeight: '500',
//   },

//   // List Item Styles
//   listCard: {
//     marginBottom: 16,
//   },
//   listCardContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   listImageContainer: {
//     position: 'relative',
//     width: 80,
//     height: 80,
//     borderRadius: 8,
//     overflow: 'hidden',
//     marginRight: 16,
//   },
//   listImage: {
//     width: '100%',
//     height: '100%',
//   },
//   listPlaceholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   soldOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255, 71, 87, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   soldOverlayText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   listContent: {
//     flex: 1,
//   },
//   listTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 4,
//   },
//   listPrice: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#667eea',
//     marginBottom: 8,
//   },
//   listMeta: {
//     flexDirection: 'row',
//     marginBottom: 4,
//   },
//   metaItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 16,
//   },
//   metaText: {
//     fontSize: 12,
//     color: '#666',
//     marginLeft: 4,
//   },
//   ownerInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   ownerText: {
//     fontSize: 12,
//     color: '#666',
//     marginLeft: 4,
//   },

//   // Loading and Empty States
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#ff4757',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: '#667eea',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },

//   // Floating Action Button
//   fabContainer: {
//     position: 'absolute',
//     bottom: 24,
//     right: 24,
//   },
//   fab: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//   },
//   fabGradient: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 28,
//   },

//   // Modal Styles
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   keyboardView: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     flexGrow: 1,
//   },

//   // Create Modal Styles
//   createHeader: {
//     alignItems: 'center',
//     paddingVertical: 32,
//     paddingHorizontal: 24,
//   },
//   modalBackButton: {
//     position: 'absolute',
//     top: 16,
//     left: 16,
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//   },
//   createHeaderTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//     marginTop: 12,
//   },
//   createHeaderSubtitle: {
//     fontSize: 16,
//     color: 'rgba(255,255,255,0.8)',
//     marginTop: 4,
//   },
//   createFormContainer: {
//     padding: 24,
//   },
//   inputGroup: {
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#e1e5e9',
//     borderRadius: 12,
//     padding: 16,
//     fontSize: 16,
//     backgroundColor: 'white',
//     color: '#333',
//   },
//   inputError: {
//     borderColor: '#ff4757',
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   errorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   errorText: {
//     color: '#ff4757',
//     fontSize: 14,
//     marginLeft: 8,
//   },
//   characterCount: {
//     fontSize: 12,
//     color: '#999',
//     textAlign: 'right',
//     marginTop: 4,
//   },
//   priceInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#e1e5e9',
//     borderRadius: 12,
//     backgroundColor: 'white',
//     overflow: 'hidden',
//   },
//   currencySymbol: {
//     backgroundColor: '#f1f3f4',
//     padding: 16,
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#667eea',
//   },
//   priceInput: {
//     flex: 1,
//     padding: 16,
//     fontSize: 16,
//     color: '#333',
//   },
  
//   // Image Picker Styles
//   imagePickerButton: {
//     borderWidth: 2,
//     borderColor: '#e1e5e9',
//     borderStyle: 'dashed',
//     borderRadius: 12,
//     padding: 32,
//     alignItems: 'center',
//     backgroundColor: 'white',
//   },
//   imagePickerText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#667eea',
//     marginTop: 8,
//   },
//   imagePickerSubtext: {
//     fontSize: 14,
//     color: '#999',
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
//     top: 8,
//     right: 8,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 12,
//     padding: 4,
//   },
  
//   // Submit Button Styles
//   submitButton: {
//     marginTop: 16,
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   submitButtonDisabled: {
//     opacity: 0.6,
//   },
//   submitButtonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 16,
//   },
//   submitButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginLeft: 8,
//   },

//   // Detail Modal Styles
//   detailImageContainer: {
//     position: 'relative',
//     height: 300,
//   },
//   detailImage: {
//     width: '100%',
//     height: '100%',
//   },
//   detailImagePlaceholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   imageLoadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   closeButton: {
//     position: 'absolute',
//     top: 16,
//     right: 16,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     borderRadius: 20,
//     padding: 8,
//   },
//   soldOverlayLarge: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255, 71, 87, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   soldOverlayTextLarge: {
//     color: 'white',
//     fontSize: 24,
//     fontWeight: 'bold',
//   },
//   detailContent: {
//     padding: 24,
//   },
//   detailHeader: {
//     marginBottom: 16,
//   },
//   detailTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 12,
//   },
//   detailPriceContainer: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 12,
//   },
//   detailPrice: {
//     color: 'white',
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   detailMeta: {
//     flexDirection: 'row',
//     marginBottom: 24,
//   },
//   conditionBadgeLarge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     marginRight: 12,
//   },
//   conditionBadgeTextLarge: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginLeft: 4,
//   },
//   categoryBadgeLarge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f1f3f4',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//   },
//   categoryBadgeTextLarge: {
//     color: '#667eea',
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginLeft: 4,
//   },
//   descriptionSection: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 12,
//   },
//   descriptionText: {
//     fontSize: 16,
//     color: '#666',
//     lineHeight: 24,
//   },
//   sellerSection: {
//     marginBottom: 32,
//   },
//   sellerInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   sellerName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginLeft: 8,
//   },
  
//   // Action Buttons
//   actionButtonsContainer: {
//     gap: 12,
//   },
//   contactButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   markSoldButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   actionButtonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 16,
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginLeft: 8,
//   },
//   shareButton: {
//     borderWidth: 1,
//     borderColor: '#667eea',
//     borderRadius: 12,
//     backgroundColor: 'white',
//   },
//   shareButtonContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 16,
//   },
//  shareButtonText: {
//     color: '#667eea',
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginLeft: 8,
//   },
// });

















































































// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   RefreshControl,
//   SafeAreaView,
//   StatusBar,
//   Dimensions,
//   TextInput,
//   Alert,
//   Animated,
//   Platform
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import * as Haptics from 'expo-haptics';
// import axios from 'axios';
// import { useNavigation } from '@react-navigation/native';
// import { useRouter } from 'expo-router';

// const { width } = Dimensions.get('window');
// const CARD_WIDTH = (width - 48) / 2; // Two columns with padding

// interface MarketplaceItem {
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
// }

// export default function MarketplaceFeed() {
//   const [items, setItems] = useState<MarketplaceItem[]>([]);
//   const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('All');
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
//   const [error, setError] = useState<string | null>(null);

//   const router = useRouter();
//   const navigation = useNavigation();
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(30)).current;

//   const categories = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other'];

//   useEffect(() => {
//     fetchMarketplaceItems();
    
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

//   useEffect(() => {
//     filterItems();
//   }, [items, searchQuery, selectedCategory]);

//   const fetchMarketplaceItems = async () => {
//     try {
//       setError(null);
//       const response = await axios.get('http://127.0.0.1:8000/api/marketplace/');
//       setItems(response.data);
//     } catch (error) {
//       console.error('Error fetching marketplace items:', error);
//       setError('Failed to load marketplace items. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await fetchMarketplaceItems();
//     setRefreshing(false);
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//   }, []);

//   const filterItems = () => {
//     let filtered = items;

//     // Filter by search query
//     if (searchQuery.trim()) {
//       filtered = filtered.filter(item =>
//         item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.condition.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     // Filter by category
//     if (selectedCategory !== 'All') {
//       filtered = filtered.filter(item => item.category === selectedCategory);
//     }

//     setFilteredItems(filtered);
//   };

//   const handleItemPress = (item: MarketplaceItem) => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     router.push({ 
//       pathname: 'market-place/market-place-item-detail', 
//       params: { itemId: item.id } 
//     });
//   };

//   const handleBackPress = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     router.push('auth/dashboard');
//   };

//   const toggleViewMode = () => {
//     setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//   };

//   const getImageUri = (imageUrl: string | null) => {
//     if (!imageUrl) return null;
    
//     // Handle different image URL formats
//     if (imageUrl.startsWith('http')) {
//       return imageUrl;
//     } else if (imageUrl.startsWith('/')) {
//       return `http://127.0.0.1:8000${imageUrl}`;
//     } else {
//       return `http://127.0.0.1:8000/${imageUrl}`;
//     }
//   };

//   const renderGridItem = ({ item, index }: { item: MarketplaceItem; index: number }) => (
//     <Animated.View
//       style={[
//         styles.gridCard,
//         {
//           opacity: fadeAnim,
//           transform: [{ translateY: slideAnim }],
//         },
//       ]}
//     >
//       <TouchableOpacity
//         style={styles.gridCardContent}
//         onPress={() => handleItemPress(item)}
//         activeOpacity={0.8}
//       >
//         {/* Image Section */}
//         <View style={styles.gridImageContainer}>
//           {item.image ? (
//             <Image
//               source={{ uri: getImageUri(item.image) }}
//               style={styles.gridImage}
//               resizeMode="cover"
//               onError={(error) => {
//                 console.warn('Image load error:', error.nativeEvent.error);
//               }}
//               // defaultSource={require('../../assets/images/placeholder.png')} // Add a placeholder image
//             />
//           ) : (
//             <View style={styles.gridPlaceholder}>
//               <Ionicons name="image-outline" size={32} color="#ccc" />
//               <Text style={styles.placeholderText}>No Image</Text>
//             </View>
//           )}
          
//           {item.is_sold && (
//             <View style={styles.soldBadge}>
//               <Text style={styles.soldBadgeText}>SOLD</Text>
//             </View>
//           )}

//           {/* Condition Badge */}
//           <View style={[styles.conditionBadge, getConditionBadgeStyle(item.condition)]}>
//             <Text style={styles.conditionBadgeText}>{item.condition}</Text>
//           </View>
//         </View>

//         {/* Content Section */}
//         <View style={styles.gridContent}>
//           <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
          
//           <LinearGradient
//             colors={['#007AFF', '#5856d6']}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.priceContainer}
//           >
//             <Text style={styles.gridPrice}>UGX {Number(item.price).toLocaleString()}</Text>
//           </LinearGradient>

//           <View style={styles.gridMeta}>
//             <View style={styles.categoryTag}>
//               <Ionicons name="pricetag" size={12} color="#007AFF" />
//               <Text style={styles.categoryText}>{item.category}</Text>
//             </View>
//           </View>
//         </View>
//       </TouchableOpacity>
//     </Animated.View>
//   );

//   const renderListItem = ({ item }: { item: MarketplaceItem }) => (
//     <Animated.View
//       style={[
//         styles.listCard,
//         {
//           opacity: fadeAnim,
//           transform: [{ translateY: slideAnim }],
//         },
//       ]}
//     >
//       <TouchableOpacity
//         style={styles.listCardContent}
//         onPress={() => handleItemPress(item)}
//         activeOpacity={0.8}
//       >
//         {/* Image Section */}
//         <View style={styles.listImageContainer}>
//           {item.image ? (
//             <Image
//               source={{ uri: getImageUri(item.image) }}
//               style={styles.listImage}
//               resizeMode="cover"
//               onError={(error) => {
//                 console.warn('Image load error:', error.nativeEvent.error);
//               }}
//             />
//           ) : (
//             <View style={styles.listPlaceholder}>
//               <Ionicons name="image-outline" size={28} color="#ccc" />
//             </View>
//           )}
          
//           {item.is_sold && (
//             <View style={styles.soldOverlay}>
//               <Text style={styles.soldOverlayText}>SOLD</Text>
//             </View>
//           )}
//         </View>

//         {/* Content Section */}
//         <View style={styles.listContent}>
//           <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
          
//           <Text style={styles.listPrice}>UGX {Number(item.price).toLocaleString()}</Text>
          
//           <View style={styles.listMeta}>
//             <View style={styles.metaItem}>
//               <Ionicons name="star" size={12} color="#ffa502" />
//               <Text style={styles.metaText}>{item.condition}</Text>
//             </View>
//             <View style={styles.metaItem}>
//               <Ionicons name="pricetag" size={12} color="#007AFF" />
//               <Text style={styles.metaText}>{item.category}</Text>
//             </View>
//           </View>

//           {item.owner && (
//             <View style={styles.ownerInfo}>
//               <Ionicons name="person-circle-outline" size={14} color="#666" />
//               <Text style={styles.ownerText}>by {item.owner.username}</Text>
//             </View>
//           )}
//         </View>

//         <Ionicons name="chevron-forward" size={20} color="#ccc" />
//       </TouchableOpacity>
//     </Animated.View>
//   );

//   const getConditionBadgeStyle = (condition: string) => {
//     switch (condition.toLowerCase()) {
//       case 'new':
//         return { backgroundColor: '#2ed573' };
//       case 'excellent':
//         return { backgroundColor: '#1e90ff' };
//       case 'good':
//         return { backgroundColor: '#ffa502' };
//       case 'fair':
//         return { backgroundColor: '#ff6b6b' };
//       default:
//         return { backgroundColor: '#666' };
//     }
//   };

//   const renderCategoryFilter = () => (
//     <View style={styles.categoryContainer}>
//       <FlatList
//         data={categories}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         keyExtractor={(item) => item}
//         contentContainerStyle={styles.categoryList}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={[
//               styles.categoryButton,
//               selectedCategory === item && styles.categoryButtonActive
//             ]}
//             onPress={() => {
//               setSelectedCategory(item);
//               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//             }}
//           >
//             <Text
//               style={[
//                 styles.categoryButtonText,
//                 selectedCategory === item && styles.categoryButtonTextActive
//               ]}
//             >
//               {item}
//             </Text>
//           </TouchableOpacity>
//         )}
//       />
//     </View>
//   );

//   const renderTopBar = () => (
//     <View style={styles.topBar}>
//       {/* Back Button */}
//       <TouchableOpacity
//         style={styles.backButton}
//         onPress={handleBackPress}
//         activeOpacity={0.7}
//       >
//         <Ionicons name="arrow-back" size={24} color="#007AFF" />
//       </TouchableOpacity>

//       {/* Title */}
//       <View style={styles.titleContainer}>
//         <Text style={styles.topBarTitle}>Marketplace</Text>
//         <Text style={styles.topBarSubtitle}>Buy & Sell Items</Text>
//       </View>

//       {/* Action Buttons */}
//       <View style={styles.actionButtons}>
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => router.push('market-place/create-market-place-item')}
//         >
//           <Ionicons name="add" size={24} color="#007AFF" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   const renderHeader = () => (
//     <View style={styles.header}>
//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search marketplace..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           placeholderTextColor="#999"
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity
//             onPress={() => setSearchQuery('')}
//             style={styles.clearButton}
//           >
//             <Ionicons name="close-circle" size={20} color="#666" />
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* View Mode Toggle */}
//       <TouchableOpacity
//         style={styles.viewToggle}
//         onPress={toggleViewMode}
//       >
//         <Ionicons 
//           name={viewMode === 'grid' ? 'list' : 'grid'} 
//           size={24} 
//           color="#007AFF" 
//         />
//       </TouchableOpacity>
//     </View>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Ionicons name="storefront-outline" size={64} color="#ccc" />
//       <Text style={styles.emptyTitle}>No items found</Text>
//       <Text style={styles.emptyText}>
//         {searchQuery || selectedCategory !== 'All' 
//           ? 'Try adjusting your search or filter criteria'
//           : 'Be the first to post an item for sale!'}
//       </Text>
//       <TouchableOpacity 
//         style={styles.retryButton}
//         onPress={onRefresh}
//       >
//         <Text style={styles.retryButtonText}>Refresh</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <Ionicons name="alert-circle-outline" size={64} color="#ff4757" />
//       <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
//       <Text style={styles.errorText}>{error}</Text>
//       <TouchableOpacity 
//         style={styles.retryButton}
//         onPress={() => {
//           setLoading(true);
//           fetchMarketplaceItems();
//         }}
//       >
//         <Text style={styles.retryButtonText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <StatusBar barStyle="dark-content" />
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading marketplace...</Text>
//       </SafeAreaView>
//     );
//   }

//   if (error && items.length === 0) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" />
//         {renderTopBar()}
//         {renderErrorState()}
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" />
      
//       {renderTopBar()}
//       {renderHeader()}
//       {renderCategoryFilter()}

//       <View style={styles.resultsHeader}>
//         <Text style={styles.resultsText}>
//           {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
//         </Text>
//       </View>

//       <FlatList
//         data={filteredItems}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
//         numColumns={viewMode === 'grid' ? 2 : 1}
//         key={viewMode} // Force re-render when view mode changes
//         contentContainerStyle={[
//           styles.listContainer,
//           filteredItems.length === 0 && styles.emptyListContainer
//         ]}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         ListEmptyComponent={renderEmptyState}
//         ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
//         columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
//       />
//     </SafeAreaView>
//   );
// }

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

//   // Top Bar
//   topBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e8ed',
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.1,
//         shadowRadius: 2,
//       },
//       android: {
//         elevation: 2,
//       },
//     }),
//   },
//   backButton: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: 'rgba(0, 122, 255, 0.1)',
//     minWidth: 40,
//     alignItems: 'center',
//   },
//   titleContainer: {
//     flex: 1,
//     alignItems: 'center',
//     paddingHorizontal: 16,
//   },
//   topBarTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   topBarSubtitle: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 2,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   actionButton: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: 'rgba(0, 122, 255, 0.1)',
//     minWidth: 40,
//     alignItems: 'center',
//   },

//   // Header
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e8ed',
//     gap: 12,
//   },
//   searchContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f0f0f0',
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     height: 44,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#2c3e50',
//   },
//   clearButton: {
//     padding: 4,
//   },
//   viewToggle: {
//     padding: 8,
//     backgroundColor: 'rgba(0, 122, 255, 0.1)',
//     borderRadius: 8,
//   },

//   // Category Filter
//   categoryContainer: {
//     backgroundColor: 'white',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e8ed',
//   },
//   categoryList: {
//     paddingHorizontal: 16,
//   },
//   categoryButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginRight: 8,
//     backgroundColor: '#f0f0f0',
//     borderWidth: 1,
//     borderColor: '#e1e8ed',
//   },
//   categoryButtonActive: {
//     backgroundColor: '#007AFF',
//     borderColor: '#007AFF',
//   },
//   categoryButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#666',
//   },
//   categoryButtonTextActive: {
//     color: 'white',
//   },

//   // Results Header
//   resultsHeader: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//   },
//   resultsText: {
//     fontSize: 14,
//     color: '#666',
//     fontWeight: '500',
//   },

//   // List Container
//   listContainer: {
//     padding: 16,
//   },
//   emptyListContainer: {
//     flex: 1,
//   },
//   gridRow: {
//     justifyContent: 'space-between',
//   },

//   // Grid View
//   gridCard: {
//     width: CARD_WIDTH,
//     marginBottom: 16,
//   },
//   gridCardContent: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//     overflow: 'hidden',
//   },
//   gridImageContainer: {
//     position: 'relative',
//     height: CARD_WIDTH * 0.75,
//   },
//   gridImage: {
//     width: '100%',
//     height: '100%',
//   },
//   gridPlaceholder: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: '#f0f0f0',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   placeholderText: {
//     fontSize: 12,
//     color: '#999',
//     marginTop: 4,
//   },
//   soldBadge: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     backgroundColor: '#ff4757',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   soldBadgeText: {
//     color: 'white',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   conditionBadge: {
//     position: 'absolute',
//     bottom: 8,
//     left: 8,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   conditionBadgeText: {
//     color: 'white',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   gridContent: {
//     padding: 12,
//   },
//   gridTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 8,
//     lineHeight: 20,
//   },
//   priceContainer: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//     marginBottom: 8,
//   },
//   gridPrice: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   gridMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   categoryTag: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 122, 255, 0.1)',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//     gap: 4,
//   },
//   categoryText: {
//     fontSize: 12,
//     color: '#007AFF',
//     fontWeight: '600',
//   },

//   // List View
//   listCard: {
//     marginBottom: 16,
//   },
//   listCardContent: {
//     flexDirection: 'row',
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   listImageContainer: {
//     position: 'relative',
//     marginRight: 16,
//   },
//   listImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 12,
//   },
//   listPlaceholder: {
//     width: 80,
//     height: 80,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   soldOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255, 71, 87, 0.9)',
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   soldOverlayText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   listContent: {
//     flex: 1,
//   },
//   listTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 4,
//   },
//   listPrice: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#007AFF',
//     marginBottom: 8,
//   },
//   listMeta: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 4,
//   },
//   metaItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   metaText: {
//     fontSize: 12,
//     color: '#666',
//   },
//   ownerInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   ownerText: {
//     fontSize: 12,
//     color: '#666',
//     fontStyle: 'italic',
//   },

//   // Empty State
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },

//   // Error State
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#ff4757',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },

//   // Retry Button
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });











































































// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   RefreshControl,
//   SafeAreaView,
//   StatusBar,
//   Dimensions,
//   TextInput,
//   Alert,
//   Animated,
//   Platform
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import * as Haptics from 'expo-haptics';
// import axios from 'axios';
// import { useNavigation } from '@react-navigation/native';
// import { useRouter } from 'expo-router';

// const { width } = Dimensions.get('window');
// const CARD_WIDTH = (width - 48) / 2; // Two columns with padding

// interface MarketplaceItem {
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
// }

// export default function MarketplaceFeed() {
//   const [items, setItems] = useState<MarketplaceItem[]>([]);
//   const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('All');
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
//   const [error, setError] = useState<string | null>(null);

//   const router = useRouter();
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(30)).current;

//   const categories = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other'];

//   useEffect(() => {
//     fetchMarketplaceItems();
    
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

//   useEffect(() => {
//     filterItems();
//   }, [items, searchQuery, selectedCategory]);

//   const fetchMarketplaceItems = async () => {
//     try {
//       setError(null);
//       const response = await axios.get('http://127.0.0.1:8000/api/marketplace/');
//       setItems(response.data);
//     } catch (error) {
//       console.error('Error fetching marketplace items:', error);
//       setError('Failed to load marketplace items. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await fetchMarketplaceItems();
//     setRefreshing(false);
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//   }, []);

//   const filterItems = () => {
//     let filtered = items;

//     // Filter by search query
//     if (searchQuery.trim()) {
//       filtered = filtered.filter(item =>
//         item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.condition.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     // Filter by category
//     if (selectedCategory !== 'All') {
//       filtered = filtered.filter(item => item.category === selectedCategory);
//     }

//     setFilteredItems(filtered);
//   };

//   const handleItemPress = (item: MarketplaceItem) => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     router.push({ 
//       pathname: 'market-place/market-place-item-detail', 
//       params: { itemId: item.id } 
//     });
//   };

//   const toggleViewMode = () => {
//     setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//   };

//   const renderGridItem = ({ item, index }: { item: MarketplaceItem; index: number }) => (
//     <Animated.View
//       style={[
//         styles.gridCard,
//         {
//           opacity: fadeAnim,
//           transform: [{ translateY: slideAnim }],
//         },
//       ]}
//     >
//       <TouchableOpacity
//         style={styles.gridCardContent}
//         onPress={() => handleItemPress(item)}
//         activeOpacity={0.8}
//       >
//         {/* Image Section */}
//         <View style={styles.gridImageContainer}>
//           {item.image ? (
//             <Image
//               source={{ uri: `http://127.0.0.1:8000${item.image}` }}
//               style={styles.gridImage}
//               resizeMode="cover"
//             />
//           ) : (
//             <View style={styles.gridPlaceholder}>
//               <Ionicons name="image-outline" size={32} color="#ccc" />
//             </View>
//           )}
          
//           {item.is_sold && (
//             <View style={styles.soldBadge}>
//               <Text style={styles.soldBadgeText}>SOLD</Text>
//             </View>
//           )}

//           {/* Condition Badge */}
//           <View style={[styles.conditionBadge, getConditionBadgeStyle(item.condition)]}>
//             <Text style={styles.conditionBadgeText}>{item.condition}</Text>
//           </View>
//         </View>

//         {/* Content Section */}
//         <View style={styles.gridContent}>
//           <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
          
//           <LinearGradient
//             colors={['#007AFF', '#5856d6']}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.priceContainer}
//           >
//             <Text style={styles.gridPrice}>UGX {Number(item.price).toLocaleString()}</Text>
//           </LinearGradient>

//           <View style={styles.gridMeta}>
//             <View style={styles.categoryTag}>
//               <Ionicons name="pricetag" size={12} color="#007AFF" />
//               <Text style={styles.categoryText}>{item.category}</Text>
//             </View>
//           </View>
//         </View>
//       </TouchableOpacity>
//     </Animated.View>
//   );

//   const renderListItem = ({ item }: { item: MarketplaceItem }) => (
//     <Animated.View
//       style={[
//         styles.listCard,
//         {
//           opacity: fadeAnim,
//           transform: [{ translateY: slideAnim }],
//         },
//       ]}
//     >
//       <TouchableOpacity
//         style={styles.listCardContent}
//         onPress={() => handleItemPress(item)}
//         activeOpacity={0.8}
//       >
//         {/* Image Section */}
//         <View style={styles.listImageContainer}>
//           {item.image ? (
//             <Image
//               source={{ uri: `http://127.0.0.1:8000${item.image}` }}
//               style={styles.listImage}
//               resizeMode="cover"
//             />
//           ) : (
//             <View style={styles.listPlaceholder}>
//               <Ionicons name="image-outline" size={28} color="#ccc" />
//             </View>
//           )}
          
//           {item.is_sold && (
//             <View style={styles.soldOverlay}>
//               <Text style={styles.soldOverlayText}>SOLD</Text>
//             </View>
//           )}
//         </View>

//         {/* Content Section */}
//         <View style={styles.listContent}>
//           <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
          
//           <Text style={styles.listPrice}>UGX {Number(item.price).toLocaleString()}</Text>
          
//           <View style={styles.listMeta}>
//             <View style={styles.metaItem}>
//               <Ionicons name="star" size={12} color="#ffa502" />
//               <Text style={styles.metaText}>{item.condition}</Text>
//             </View>
//             <View style={styles.metaItem}>
//               <Ionicons name="pricetag" size={12} color="#007AFF" />
//               <Text style={styles.metaText}>{item.category}</Text>
//             </View>
//           </View>

//           {item.owner && (
//             <View style={styles.ownerInfo}>
//               <Ionicons name="person-circle-outline" size={14} color="#666" />
//               <Text style={styles.ownerText}>by {item.owner.username}</Text>
//             </View>
//           )}
//         </View>

//         <Ionicons name="chevron-forward" size={20} color="#ccc" />
//       </TouchableOpacity>
//     </Animated.View>
//   );

//   const getConditionBadgeStyle = (condition: string) => {
//     switch (condition.toLowerCase()) {
//       case 'new':
//         return { backgroundColor: '#2ed573' };
//       case 'excellent':
//         return { backgroundColor: '#1e90ff' };
//       case 'good':
//         return { backgroundColor: '#ffa502' };
//       case 'fair':
//         return { backgroundColor: '#ff6b6b' };
//       default:
//         return { backgroundColor: '#666' };
//     }
//   };

//   const renderCategoryFilter = () => (
//     <View style={styles.categoryContainer}>
//       <FlatList
//         data={categories}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         keyExtractor={(item) => item}
//         contentContainerStyle={styles.categoryList}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={[
//               styles.categoryButton,
//               selectedCategory === item && styles.categoryButtonActive
//             ]}
//             onPress={() => {
//               setSelectedCategory(item);
//               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//             }}
//           >
//             <Text
//               style={[
//                 styles.categoryButtonText,
//                 selectedCategory === item && styles.categoryButtonTextActive
//               ]}
//             >
//               {item}
//             </Text>
//           </TouchableOpacity>
//         )}
//       />
//     </View>
//   );

//   const renderHeader = () => (
//     <View style={styles.header}>
//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search marketplace..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           placeholderTextColor="#999"
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity
//             onPress={() => setSearchQuery('')}
//             style={styles.clearButton}
//           >
//             <Ionicons name="close-circle" size={20} color="#666" />
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* View Mode Toggle */}
//       <TouchableOpacity
//         style={styles.viewToggle}
//         onPress={toggleViewMode}
//       >
//         <Ionicons 
//           name={viewMode === 'grid' ? 'list' : 'grid'} 
//           size={24} 
//           color="#007AFF" 
//         />
//       </TouchableOpacity>
//     </View>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Ionicons name="storefront-outline" size={64} color="#ccc" />
//       <Text style={styles.emptyTitle}>No items found</Text>
//       <Text style={styles.emptyText}>
//         {searchQuery || selectedCategory !== 'All' 
//           ? 'Try adjusting your search or filter criteria'
//           : 'Be the first to post an item for sale!'}
//       </Text>
//       <TouchableOpacity 
//         style={styles.retryButton}
//         onPress={onRefresh}
//       >
//         <Text style={styles.retryButtonText}>Refresh</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <Ionicons name="alert-circle-outline" size={64} color="#ff4757" />
//       <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
//       <Text style={styles.errorText}>{error}</Text>
//       <TouchableOpacity 
//         style={styles.retryButton}
//         onPress={() => {
//           setLoading(true);
//           fetchMarketplaceItems();
//         }}
//       >
//         <Text style={styles.retryButtonText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <StatusBar barStyle="dark-content" />
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading marketplace...</Text>
//       </SafeAreaView>
//     );
//   }

//   if (error && items.length === 0) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" />
//         {renderErrorState()}
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" />
      
//       {renderHeader()}
//       {renderCategoryFilter()}

//       <View style={styles.resultsHeader}>
//         <Text style={styles.resultsText}>
//           {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
//         </Text>
//       </View>

//       <FlatList
//         data={filteredItems}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
//         numColumns={viewMode === 'grid' ? 2 : 1}
//         key={viewMode} // Force re-render when view mode changes
//         contentContainerStyle={[
//           styles.listContainer,
//           filteredItems.length === 0 && styles.emptyListContainer
//         ]}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         ListEmptyComponent={renderEmptyState}
//         ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
//         columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
//       />
//     </SafeAreaView>
//   );
// }

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

//   // Header
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e8ed',
//     gap: 12,
//   },
//   searchContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f0f0f0',
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     height: 44,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#2c3e50',
//   },
//   clearButton: {
//     padding: 4,
//   },
//   viewToggle: {
//     padding: 8,
//     backgroundColor: 'rgba(0, 122, 255, 0.1)',
//     borderRadius: 8,
//   },

//   // Category Filter
//   categoryContainer: {
//     backgroundColor: 'white',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e8ed',
//   },
//   categoryList: {
//     paddingHorizontal: 16,
//   },
//   categoryButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginRight: 8,
//     backgroundColor: '#f0f0f0',
//     borderWidth: 1,
//     borderColor: '#e1e8ed',
//   },
//   categoryButtonActive: {
//     backgroundColor: '#007AFF',
//     borderColor: '#007AFF',
//   },
//   categoryButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#666',
//   },
//   categoryButtonTextActive: {
//     color: 'white',
//   },

//   // Results Header
//   resultsHeader: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//   },
//   resultsText: {
//     fontSize: 14,
//     color: '#666',
//     fontWeight: '500',
//   },

//   // List Container
//   listContainer: {
//     padding: 16,
//   },
//   emptyListContainer: {
//     flex: 1,
//   },
//   gridRow: {
//     justifyContent: 'space-between',
//   },

//   // Grid View
//   gridCard: {
//     width: CARD_WIDTH,
//     marginBottom: 16,
//   },
//   gridCardContent: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//     overflow: 'hidden',
//   },
//   gridImageContainer: {
//     position: 'relative',
//     height: CARD_WIDTH * 0.75,
//   },
//   gridImage: {
//     width: '100%',
//     height: '100%',
//   },
//   gridPlaceholder: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: '#f0f0f0',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   soldBadge: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     backgroundColor: '#ff4757',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   soldBadgeText: {
//     color: 'white',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   conditionBadge: {
//     position: 'absolute',
//     bottom: 8,
//     left: 8,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   conditionBadgeText: {
//     color: 'white',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   gridContent: {
//     padding: 12,
//   },
//   gridTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 8,
//     lineHeight: 20,
//   },
//   priceContainer: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//     marginBottom: 8,
//   },
//   gridPrice: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   gridMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   categoryTag: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 122, 255, 0.1)',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//     gap: 4,
//   },
//   categoryText: {
//     fontSize: 12,
//     color: '#007AFF',
//     fontWeight: '600',
//   },

//   // List View
//   listCard: {
//     marginBottom: 16,
//   },
//   listCardContent: {
//     flexDirection: 'row',
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   listImageContainer: {
//     position: 'relative',
//     marginRight: 16,
//   },
//   listImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 12,
//   },
//   listPlaceholder: {
//     width: 80,
//     height: 80,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   soldOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255, 71, 87, 0.9)',
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   soldOverlayText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   listContent: {
//     flex: 1,
//   },
//   listTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 4,
//   },
//   listPrice: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#007AFF',
//     marginBottom: 8,
//   },
//   listMeta: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 4,
//   },
//   metaItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   metaText: {
//     fontSize: 12,
//     color: '#666',
//   },
//   ownerInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   ownerText: {
//     fontSize: 12,
//     color: '#666',
//     fontStyle: 'italic',
//   },

//   // Empty State
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },

//   // Error State
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#ff4757',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },

//   // Retry Button
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });















































// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
// import axios from 'axios';
// import { useNavigation } from '@react-navigation/native';
// import { useRouter} from 'expo-router';

// interface MarketplaceItem {
//   id: number;
//   title: string;
//   price: string;
//   category: string;
//   condition: string;
//   image: string | null;
// }

// export default function MarketplaceFeed() {
//   const [items, setItems] = useState<MarketplaceItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   // const navigation = useNavigation();
//   const router = useRouter();

//   useEffect(() => {
//     fetchMarketplaceItems();
//   }, []);

//   const fetchMarketplaceItems = async () => {
//     try {
//       const response = await axios.get('http://127.0.0.1:8000/api/marketplace/');
//       setItems(response.data);
//     } catch (error) {
//       console.error('Error fetching marketplace items:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderItem = ({ item }: { item: MarketplaceItem }) => (
//     <TouchableOpacity
//       style={styles.card}
//       onPress={() => router.push({ pathname: '/market-place-item-detail', params: { itemId: item.id } })}
//     //   onPress={() => navigation.navigate('MarketplaceDetail', { itemId: item.id })}
//     >
//       {item.image ? (
//         <Image
//           source={{ uri: `http://127.0.0.1:8000${item.image}` }}
//           style={styles.image}
//         />
//       ) : (
//         <View style={styles.placeholder}>
//           <Text style={styles.placeholderText}>No Image</Text>
//         </View>
//       )}
//       <View style={styles.info}>
//         <Text style={styles.title}>{item.title}</Text>
//         <Text style={styles.price}>UGX {item.price}</Text>
//         <Text style={styles.meta}>{item.condition} • {item.category}</Text>
//       </View>
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={items}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderItem}
//         contentContainerStyle={{ paddingBottom: 20 }}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 10,
//   },
//   card: {
//     flexDirection: 'row',
//     marginBottom: 12,
//     backgroundColor: '#f8f8f8',
//     borderRadius: 8,
//     overflow: 'hidden',
//     elevation: 2,
//   },
//   image: {
//     width: 100,
//     height: 100,
//   },
//   placeholder: {
//     width: 100,
//     height: 100,
//     backgroundColor: '#ddd',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   placeholderText: {
//     color: '#888',
//   },
//   info: {
//     flex: 1,
//     padding: 10,
//     justifyContent: 'center',
//   },
//   title: {
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   price: {
//     color: '#007AFF',
//     fontSize: 14,
//     marginTop: 4,
//   },
//   meta: {
//     color: '#666',
//     fontSize: 13,
//     marginTop: 2,
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });
