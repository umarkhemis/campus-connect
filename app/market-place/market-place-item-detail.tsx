

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Share,
  Linking,
  Modal,
  Animated,
  PanResponder,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ConnectionAPI from '../api/connectionService'; 

const { width, height } = Dimensions.get('window');

// Get base URL from ConnectionAPI
const getBaseUrl = async () => {
  return await ConnectionAPI.getBaseUrl();
};

// Custom Modal Component
const CustomModal = ({ visible, onClose, title, message, actions, type = 'info' }) => {
  const [modalY] = useState(new Animated.Value(height));

  useEffect(() => {
    if (visible) {
      Animated.spring(modalY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(modalY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getModalColors = () => {
    switch (type) {
      case 'success':
        return { primary: '#10B981', secondary: '#D1FAE5' };
      case 'error':
        return { primary: '#EF4444', secondary: '#FEE2E2' };
      case 'warning':
        return { primary: '#F59E0B', secondary: '#FEF3C7' };
      default:
        return { primary: '#3B82F6', secondary: '#DBEAFE' };
    }
  };

  const colors = getModalColors();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: modalY }] }
          ]}
        >
          <View style={[styles.modalHeader, { backgroundColor: colors.secondary }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name={getIcon()} size={32} color="white" />
            </View>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            
            <View style={styles.modalActions}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalButton,
                    action.style === 'primary' 
                      ? [styles.modalButtonPrimary, { backgroundColor: colors.primary }]
                      : styles.modalButtonSecondary
                  ]}
                  onPress={action.onPress}
                >
                  <Text 
                    style={[
                      styles.modalButtonText,
                      action.style === 'primary' 
                        ? styles.modalButtonTextPrimary
                        : [styles.modalButtonTextSecondary, { color: colors.primary }]
                    ]}
                  >
                    {action.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Contact Modal Component
const ContactModal = ({ visible, onClose, seller, itemTitle }) => {
  const [modalY] = useState(new Animated.Value(height));

  useEffect(() => {
    if (visible) {
      Animated.spring(modalY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(modalY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleEmail = () => {
    Linking.openURL(`mailto:${seller?.email}?subject=Interested in ${itemTitle}`);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.contactModalContainer,
            { transform: [{ translateY: modalY }] }
          ]}
        >
          <View style={styles.contactModalHeader}>
            <Text style={styles.contactModalTitle}>Contact Seller</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.contactModalContent}>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {seller?.username?.charAt(0)?.toUpperCase() || 'S'}
                </Text>
              </View>
              <View>
                <Text style={styles.sellerName}>{seller?.username || 'Unknown Seller'}</Text>
                <Text style={styles.sellerEmail}>{seller?.email || 'No email available'}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.contactOption}
              onPress={handleEmail}
              disabled={!seller?.email}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.contactOptionGradient}
              >
                <Ionicons name="mail" size={24} color="white" />
                <Text style={styles.contactOptionText}>Send Email</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function MarketplaceDetail() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingAsSold, setMarkingAsSold] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  
  // Modal states
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    actions: [],
    type: 'info'
  });
  const [contactModalVisible, setContactModalVisible] = useState(false);

  // Initialize base URL on component mount
  useEffect(() => {
    const initializeBaseUrl = async () => {
      try {
        const url = await ConnectionAPI.getBaseUrl();
        setBaseUrl(url);
      } catch (error) {
        console.error('Error getting base URL:', error);
      }
    };
    
    initializeBaseUrl();
  }, []);

  useEffect(() => {
    if (itemId) {
      fetchItemDetails();
    } else {
      setLoading(false);
      showModal({
        title: 'Error',
        message: 'No item ID provided',
        type: 'error',
        actions: [
          { text: 'OK', style: 'primary', onPress: () => {
            hideModal();
            router.back();
          }}
        ]
      });
    }
  }, [itemId]);

  const showModal = (config) => {
    setModalConfig({ ...config, visible: true });
  };

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await ConnectionAPI.getMarketplaceItemById(itemId);
      setItem(response);
    } catch (error) {
      console.error('Error fetching item:', error);
      showModal({
        title: 'Error',
        message: error.message || 'Failed to load item details',
        type: 'error',
        actions: [
          { text: 'Try Again', style: 'primary', onPress: () => {
            hideModal();
            fetchItemDetails();
          }},
          { text: 'Go Back', style: 'secondary', onPress: () => {
            hideModal();
            router.back();
          }}
        ]
      });
    } finally {
      setLoading(false);
    }
  };


  const getImageUri = (imageUrl: string | null) => {
      if (!imageUrl) return null;
      
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      } else if (imageUrl.startsWith('/')) {
        return `${getBaseUrl()}${imageUrl}`;
      } else {
        return `${getBaseUrl()}/${imageUrl}`;
      }
  };



  // const getImageUri = (imageUrl) => {  
  //   if (!imageUrl) return null;
    
  //   if (imageUrl.startsWith('http')) {
  //     return imageUrl;
  //   } else if (imageUrl.startsWith('/')) {
  //     return `${baseUrl}${imageUrl}`;  
  //   } else {
  //     return `${baseUrl}/${imageUrl}`;  
  //   }
  // };



  const markAsSold = async () => {
    showModal({
      title: 'Confirm Action',
      message: 'Are you sure you want to mark this item as sold?',
      type: 'warning',
      actions: [
        { text: 'Cancel', style: 'secondary', onPress: hideModal },
        { text: 'Mark as Sold', style: 'primary', onPress: performMarkAsSold }
      ]
    });
  };

  const performMarkAsSold = async () => {
    hideModal();
    setMarkingAsSold(true);
    
    try {
      // Check if user is authenticated first
      const isAuthenticated = await ConnectionAPI.isAuthenticated();
      if (!isAuthenticated) {
        showModal({
          title: 'Authentication Required',
          message: 'You must be logged in to mark an item as sold',
          type: 'warning',
          actions: [
            { text: 'OK', style: 'primary', onPress: hideModal }
          ]
        });
        return;
      }
      
      await ConnectionAPI.getMarketplaceItemMarkasSold(itemId);
      
      showModal({
        title: 'Success!',
        message: 'Item has been marked as sold successfully',
        type: 'success',
        actions: [
          { text: 'Great!', style: 'primary', onPress: hideModal }
        ]
      });
      
      // Refresh item details to show updated status
      await fetchItemDetails();
    } catch (error) {
      console.error('Error marking item as sold:', error);
      showModal({
        title: 'Error',
        message: error.message || 'Failed to mark item as sold. Please try again.',
        type: 'error',
        actions: [
          { text: 'OK', style: 'primary', onPress: hideModal }
        ]
      });
    } finally {
      setMarkingAsSold(false);
    }
  };

  const shareItem = async () => {
    if (!item) return;
    
    try {
      await Share.share({
        message: `Check out this ${item.title} for UGX ${item.price?.toLocaleString()}`,
        title: item.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const contactSeller = () => {
    if (!item?.seller?.email) {
      showModal({
        title: 'Contact Unavailable',
        message: 'No contact information available for this seller',
        type: 'warning',
        actions: [
          { text: 'OK', style: 'primary', onPress: hideModal }
        ]
      });
      return;
    }
    
    setContactModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading item details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Item Not Found</Text>
          <Text style={styles.errorMessage}>The item you're looking for doesn't exist or has been removed.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetails}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.retryButtonGradient}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header with back button and share */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back('/market-place/market-place-feeds')}
        >
          <View style={styles.headerButtonContent}>
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={shareItem}
        >
          <View style={styles.headerButtonContent}>
            <Ionicons name="share-outline" size={24} color="#3B82F6" />
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {item.image ? (
            <>
              <Image 
                source={{ uri: getImageUri(item.image) }} 
                style={styles.image}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderIcon}>
                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.placeholderText}>No Image Available</Text>
            </View>
          )}
          
          {item.is_sold && (
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.soldBadge}
            >
              <Ionicons name="checkmark-circle" size={16} color="white" />
              <Text style={styles.soldBadgeText}>SOLD</Text>
            </LinearGradient>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* Title and Price */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{item.title}</Text>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.priceContainer}
            >
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.price}>UGX {item.price?.toLocaleString()}</Text>
            </LinearGradient>
          </View>

          {/* Meta Information */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <View style={styles.metaIconContainer}>
                <Ionicons name="pricetag" size={16} color="#3B82F6" />
              </View>
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
            <View style={styles.metaItem}>
              <View style={styles.metaIconContainer}>
                <Ionicons name="star" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.metaText}>{item.condition}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descriptionContent}>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>

          {/* Seller Information */}
          <View style={styles.sellerContainer}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {item.seller?.username?.charAt(0)?.toUpperCase() || 'S'}
                </Text>
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{item.seller?.username || 'Unknown Seller'}</Text>
                <Text style={styles.sellerLabel}>Marketplace Seller</Text>
              </View>
              <View style={styles.sellerBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {item.is_current_user && !item.is_sold && (
              <TouchableOpacity
                style={styles.actionButtonContainer}
                onPress={markAsSold}
                disabled={markingAsSold}
              >
                <LinearGradient
                  colors={markingAsSold ? ['#9CA3AF', '#6B7280'] : ['#F59E0B', '#D97706']}
                  style={styles.actionButton}
                >
                  {markingAsSold ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Mark as Sold</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            {!item.is_current_user && !item.is_sold && (
              <TouchableOpacity
                style={styles.actionButtonContainer}
                onPress={contactSeller}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.actionButton}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Contact Seller</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Sold Message */}
          {item.is_sold && (
            <View style={styles.soldMessageContainer}>
              <LinearGradient
                colors={['#FEE2E2', '#FECACA']}
                style={styles.soldMessage}
              >
                <View style={styles.soldIconContainer}>
                  <Ionicons name="checkmark-circle" size={32} color="#EF4444" />
                </View>
                <View style={styles.soldMessageContent}>
                  <Text style={styles.soldMessageTitle}>Item Sold</Text>
                  <Text style={styles.soldMessageText}>This item is no longer available</Text>
                </View>
              </LinearGradient>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Modals */}
      <CustomModal
        visible={modalConfig.visible}
        onClose={hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        actions={modalConfig.actions}
        type={modalConfig.type}
      />

      <ContactModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        seller={item?.seller}
        itemTitle={item?.title}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonContent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  
  // Improved Image Styles
  imageContainer: {
    width: '100%',
    height: 300, // Fixed height for consistency
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  soldBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  soldBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 1,
  },

  // Content Styles
  contentContainer: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 36,
  },
  priceContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  price: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metaIconContainer: {
    marginRight: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  descriptionContent: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  description: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  sellerContainer: {
    marginBottom: 24,
  },
  sellerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  sellerLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  sellerBadge: {
    marginLeft: 12,
  },
  actionContainer: {
    marginBottom: 24,
  },
  actionButtonContainer: {
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  soldMessageContainer: {
    marginTop: 20,
  },
  soldMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  soldIconContainer: {
    marginRight: 12,
  },
  soldMessageContent: {
    flex: 1,
  },
  soldMessageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  soldMessageText: {
    fontSize: 14,
    color: '#991B1B',
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '500',
  },
  
  // Error container styles
  errorContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 16,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Modal styles that might be missing
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    // backgroundColor is set dynamically
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: 'white',
  },
  modalButtonTextSecondary: {
    // color is set dynamically
  },

  // Contact Modal styles
  contactModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.6,
  },
  contactModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  contactModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  contactModalContent: {
    padding: 20,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  contactOption: {
    marginBottom: 12,
  },
  contactOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  contactOptionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});































































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   StyleSheet, 
//   TouchableOpacity, 
//   ActivityIndicator,
//   ScrollView,
//   Dimensions,
//   SafeAreaView,
//   StatusBar,
//   Share,
//   Linking,
//   Modal,
//   Animated,
//   PanResponder,
//   Platform
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import ConnectionAPI from '../api/connectionService'; // Update this import path

// const { width, height } = Dimensions.get('window');

// // Get base URL from ConnectionAPI
// const getBaseUrl = async () => {
//   return await ConnectionAPI.getBaseUrl();
// };

// // Custom Modal Component
// const CustomModal = ({ visible, onClose, title, message, actions, type = 'info' }) => {
//   const [modalY] = useState(new Animated.Value(height));

//   useEffect(() => {
//     if (visible) {
//       Animated.spring(modalY, {
//         toValue: 0,
//         useNativeDriver: true,
//         tension: 100,
//         friction: 8,
//       }).start();
//     } else {
//       Animated.timing(modalY, {
//         toValue: height,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [visible]);

//   const getModalColors = () => {
//     switch (type) {
//       case 'success':
//         return { primary: '#10B981', secondary: '#D1FAE5' };
//       case 'error':
//         return { primary: '#EF4444', secondary: '#FEE2E2' };
//       case 'warning':
//         return { primary: '#F59E0B', secondary: '#FEF3C7' };
//       default:
//         return { primary: '#3B82F6', secondary: '#DBEAFE' };
//     }
//   };

//   const colors = getModalColors();

//   const getIcon = () => {
//     switch (type) {
//       case 'success':
//         return 'checkmark-circle';
//       case 'error':
//         return 'close-circle';
//       case 'warning':
//         return 'warning';
//       default:
//         return 'information-circle';
//     }
//   };

//   if (!visible) return null;

//   return (
//     <Modal transparent visible={visible} animationType="fade">
//       <View style={styles.modalOverlay}>
//         <TouchableOpacity 
//           style={styles.modalBackdrop} 
//           activeOpacity={1} 
//           onPress={onClose}
//         />
//         <Animated.View 
//           style={[
//             styles.modalContainer,
//             { transform: [{ translateY: modalY }] }
//           ]}
//         >
//           <View style={[styles.modalHeader, { backgroundColor: colors.secondary }]}>
//             <View style={[styles.modalIconContainer, { backgroundColor: colors.primary }]}>
//               <Ionicons name={getIcon()} size={32} color="white" />
//             </View>
//           </View>
          
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>{title}</Text>
//             <Text style={styles.modalMessage}>{message}</Text>
            
//             <View style={styles.modalActions}>
//               {actions.map((action, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   style={[
//                     styles.modalButton,
//                     action.style === 'primary' 
//                       ? [styles.modalButtonPrimary, { backgroundColor: colors.primary }]
//                       : styles.modalButtonSecondary
//                   ]}
//                   onPress={action.onPress}
//                 >
//                   <Text 
//                     style={[
//                       styles.modalButtonText,
//                       action.style === 'primary' 
//                         ? styles.modalButtonTextPrimary
//                         : [styles.modalButtonTextSecondary, { color: colors.primary }]
//                     ]}
//                   >
//                     {action.text}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
//         </Animated.View>
//       </View>
//     </Modal>
//   );
// };

// // Contact Modal Component
// const ContactModal = ({ visible, onClose, seller, itemTitle }) => {
//   const [modalY] = useState(new Animated.Value(height));

//   useEffect(() => {
//     if (visible) {
//       Animated.spring(modalY, {
//         toValue: 0,
//         useNativeDriver: true,
//         tension: 100,
//         friction: 8,
//       }).start();
//     } else {
//       Animated.timing(modalY, {
//         toValue: height,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [visible]);

//   const handleEmail = () => {
//     Linking.openURL(`mailto:${seller?.email}?subject=Interested in ${itemTitle}`);
//     onClose();
//   };

//   if (!visible) return null;

//   return (
//     <Modal transparent visible={visible} animationType="fade">
//       <View style={styles.modalOverlay}>
//         <TouchableOpacity 
//           style={styles.modalBackdrop} 
//           activeOpacity={1} 
//           onPress={onClose}
//         />
//         <Animated.View 
//           style={[
//             styles.contactModalContainer,
//             { transform: [{ translateY: modalY }] }
//           ]}
//         >
//           <View style={styles.contactModalHeader}>
//             <Text style={styles.contactModalTitle}>Contact Seller</Text>
//             <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//               <Ionicons name="close" size={24} color="#64748B" />
//             </TouchableOpacity>
//           </View>
          
//           <View style={styles.contactModalContent}>
//             <View style={styles.sellerInfo}>
//               <View style={styles.sellerAvatar}>
//                 <Text style={styles.sellerAvatarText}>
//                   {seller?.username?.charAt(0)?.toUpperCase() || 'S'}
//                 </Text>
//               </View>
//               <View>
//                 <Text style={styles.sellerName}>{seller?.username || 'Unknown Seller'}</Text>
//                 <Text style={styles.sellerEmail}>{seller?.email || 'No email available'}</Text>
//               </View>
//             </View>
            
//             <TouchableOpacity 
//               style={styles.contactOption}
//               onPress={handleEmail}
//               disabled={!seller?.email}
//             >
//               <LinearGradient
//                 colors={['#3B82F6', '#1D4ED8']}
//                 style={styles.contactOptionGradient}
//               >
//                 <Ionicons name="mail" size={24} color="white" />
//                 <Text style={styles.contactOptionText}>Send Email</Text>
//               </LinearGradient>
//             </TouchableOpacity>
//           </View>
//         </Animated.View>
//       </View>
//     </Modal>
//   );
// };

// export default function MarketplaceDetail() {
//   const router = useRouter();
//   const { itemId } = useLocalSearchParams();

//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [markingAsSold, setMarkingAsSold] = useState(false);
//   const [imageLoading, setImageLoading] = useState(true);
//   const [baseUrl, setBaseUrl] = useState('');
  
//   // Modal states
//   const [modalConfig, setModalConfig] = useState({
//     visible: false,
//     title: '',
//     message: '',
//     actions: [],
//     type: 'info'
//   });
//   const [contactModalVisible, setContactModalVisible] = useState(false);

//   // Initialize base URL on component mount
//   useEffect(() => {
//     const initializeBaseUrl = async () => {
//       try {
//         const url = await ConnectionAPI.getBaseUrl();
//         setBaseUrl(url);
//       } catch (error) {
//         console.error('Error getting base URL:', error);
//       }
//     };
    
//     initializeBaseUrl();
//   }, []);

//   useEffect(() => {
//     if (itemId) {
//       fetchItemDetails();
//     } else {
//       setLoading(false);
//       showModal({
//         title: 'Error',
//         message: 'No item ID provided',
//         type: 'error',
//         actions: [
//           { text: 'OK', style: 'primary', onPress: () => {
//             hideModal();
//             router.back();
//           }}
//         ]
//       });
//     }
//   }, [itemId]);

//   const showModal = (config) => {
//     setModalConfig({ ...config, visible: true });
//   };

//   const hideModal = () => {
//     setModalConfig(prev => ({ ...prev, visible: false }));
//   };

//   const fetchItemDetails = async () => {
//     try {
//       setLoading(true);
//       const response = await ConnectionAPI.getMarketplaceItemById(itemId);
//       setItem(response);
//     } catch (error) {
//       console.error('Error fetching item:', error);
//       showModal({
//         title: 'Error',
//         message: error.message || 'Failed to load item details',
//         type: 'error',
//         actions: [
//           { text: 'Try Again', style: 'primary', onPress: () => {
//             hideModal();
//             fetchItemDetails();
//           }},
//           { text: 'Go Back', style: 'secondary', onPress: () => {
//             hideModal();
//             router.back();
//           }}
//         ]
//       });
//     } finally {
//       setLoading(false);
//     }
//   };


//   const getImageUri = (imageUrl: string | null) => {
//       if (!imageUrl) return null;
      
//       if (imageUrl.startsWith('http')) {
//         return imageUrl;
//       } else if (imageUrl.startsWith('/')) {
//         return `${ConnectionAPI.getBaseUrl()}${imageUrl}`;
//       } else {
//         return `${ConnectionAPI.getBaseUrl()}/${imageUrl}`;
//       }
//   };




//   const markAsSold = async () => {
//     showModal({
//       title: 'Confirm Action',
//       message: 'Are you sure you want to mark this item as sold?',
//       type: 'warning',
//       actions: [
//         { text: 'Cancel', style: 'secondary', onPress: hideModal },
//         { text: 'Mark as Sold', style: 'primary', onPress: performMarkAsSold }
//       ]
//     });
//   };

//   const performMarkAsSold = async () => {
//     hideModal();
//     setMarkingAsSold(true);
    
//     try {
//       // Check if user is authenticated first
//       const isAuthenticated = await ConnectionAPI.isAuthenticated();
//       if (!isAuthenticated) {
//         showModal({
//           title: 'Authentication Required',
//           message: 'You must be logged in to mark an item as sold',
//           type: 'warning',
//           actions: [
//             { text: 'OK', style: 'primary', onPress: hideModal }
//           ]
//         });
//         return;
//       }
      
//       await ConnectionAPI.getMarketplaceItemMarkasSold(itemId);
      
//       showModal({
//         title: 'Success!',
//         message: 'Item has been marked as sold successfully',
//         type: 'success',
//         actions: [
//           { text: 'Great!', style: 'primary', onPress: hideModal }
//         ]
//       });
      
//       // Refresh item details to show updated status
//       await fetchItemDetails();
//     } catch (error) {
//       console.error('Error marking item as sold:', error);
//       showModal({
//         title: 'Error',
//         message: error.message || 'Failed to mark item as sold. Please try again.',
//         type: 'error',
//         actions: [
//           { text: 'OK', style: 'primary', onPress: hideModal }
//         ]
//       });
//     } finally {
//       setMarkingAsSold(false);
//     }
//   };

//   const shareItem = async () => {
//     if (!item) return;
    
//     try {
//       await Share.share({
//         message: `Check out this ${item.title} for UGX ${item.price?.toLocaleString()}`,
//         title: item.title,
//       });
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   const contactSeller = () => {
//     if (!item?.seller?.email) {
//       showModal({
//         title: 'Contact Unavailable',
//         message: 'No contact information available for this seller',
//         type: 'warning',
//         actions: [
//           { text: 'OK', style: 'primary', onPress: hideModal }
//         ]
//       });
//       return;
//     }
    
//     setContactModalVisible(true);
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
//         <View style={styles.loadingContent}>
//           <ActivityIndicator size="large" color="#3B82F6" />
//           <Text style={styles.loadingText}>Loading item details...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (!item) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
//         <View style={styles.errorContent}>
//           <View style={styles.errorIconContainer}>
//             <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
//           </View>
//           <Text style={styles.errorTitle}>Item Not Found</Text>
//           <Text style={styles.errorMessage}>The item you're looking for doesn't exist or has been removed.</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetails}>
//             <LinearGradient
//               colors={['#3B82F6', '#1D4ED8']}
//               style={styles.retryButtonGradient}
//             >
//               <Ionicons name="refresh" size={20} color="white" />
//               <Text style={styles.retryButtonText}>Try Again</Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
//       {/* Header with back button and share */}
//       <LinearGradient
//         colors={['#FFFFFF', '#F8FAFC']}
//         style={styles.header}
//       >
//         <TouchableOpacity
//           style={styles.headerButton}
//           onPress={() => router.back('/market-place/market-place-feeds')}
//         >
//           <View style={styles.headerButtonContent}>
//             <Ionicons name="arrow-back" size={24} color="#3B82F6" />
//           </View>
//         </TouchableOpacity>
//         <TouchableOpacity 
//           style={styles.headerButton}
//           onPress={shareItem}
//         >
//           <View style={styles.headerButtonContent}>
//             <Ionicons name="share-outline" size={24} color="#3B82F6" />
//           </View>
//         </TouchableOpacity>
//       </LinearGradient>

//       <ScrollView 
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         bounces={true}
//       >
//         {/* Image Section */}
//         <View style={styles.imageContainer}>
//           {item.image ? (
//             <>
//               <Image 
               
//                 source={{ uri: getImageUri(item.image) }} 
//                 style={styles.image}
//                 onLoadStart={() => setImageLoading(true)}
//                 onLoadEnd={() => setImageLoading(false)}
//               />
//               {imageLoading && (
//                 <View style={styles.imageLoadingOverlay}>
//                   <ActivityIndicator size="large" color="#3B82F6" />
//                 </View>
//               )}
//             </>
//           ) : (
//             <View style={styles.placeholder}>
//               <View style={styles.placeholderIcon}>
//                 <Ionicons name="image-outline" size={48} color="#9CA3AF" />
//               </View>
//               <Text style={styles.placeholderText}>No Image Available</Text>
//             </View>
//           )}
          
//           {item.is_sold && (
//             <LinearGradient
//               colors={['#EF4444', '#DC2626']}
//               style={styles.soldBadge}
//             >
//               <Ionicons name="checkmark-circle" size={16} color="white" />
//               <Text style={styles.soldBadgeText}>SOLD</Text>
//             </LinearGradient>
//           )}
//         </View>

//         {/* Content Section */}
//         <View style={styles.contentContainer}>
//           {/* Title and Price */}
//           <View style={styles.titleSection}>
//             <Text style={styles.title}>{item.title}</Text>
//             <LinearGradient
//               colors={['#10B981', '#059669']}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={styles.priceContainer}
//             >
//               <Text style={styles.priceLabel}>Price</Text>
//               <Text style={styles.price}>UGX {item.price?.toLocaleString()}</Text>
//             </LinearGradient>
//           </View>

//           {/* Meta Information */}
//           <View style={styles.metaContainer}>
//             <View style={styles.metaItem}>
//               <View style={styles.metaIconContainer}>
//                 <Ionicons name="pricetag" size={16} color="#3B82F6" />
//               </View>
//               <Text style={styles.metaText}>{item.category}</Text>
//             </View>
//             <View style={styles.metaItem}>
//               <View style={styles.metaIconContainer}>
//                 <Ionicons name="star" size={16} color="#F59E0B" />
//               </View>
//               <Text style={styles.metaText}>{item.condition}</Text>
//             </View>
//           </View>

//           {/* Description */}
//           <View style={styles.descriptionContainer}>
//             <Text style={styles.sectionTitle}>Description</Text>
//             <View style={styles.descriptionContent}>
//               <Text style={styles.description}>{item.description}</Text>
//             </View>
//           </View>

//           {/* Seller Information */}
//           <View style={styles.sellerContainer}>
//             <Text style={styles.sectionTitle}>Seller Information</Text>
//             <View style={styles.sellerCard}>
//               <View style={styles.sellerAvatar}>
//                 <Text style={styles.sellerAvatarText}>
//                   {item.seller?.username?.charAt(0)?.toUpperCase() || 'S'}
//                 </Text>
//               </View>
//               <View style={styles.sellerDetails}>
//                 <Text style={styles.sellerName}>{item.seller?.username || 'Unknown Seller'}</Text>
//                 <Text style={styles.sellerLabel}>Marketplace Seller</Text>
//               </View>
//               <View style={styles.sellerBadge}>
//                 <Ionicons name="checkmark-circle" size={20} color="#10B981" />
//               </View>
//             </View>
//           </View>

//           {/* Action Buttons */}
//           <View style={styles.actionContainer}>
//             {item.is_current_user && !item.is_sold && (
//               <TouchableOpacity
//                 style={styles.actionButtonContainer}
//                 onPress={markAsSold}
//                 disabled={markingAsSold}
//               >
//                 <LinearGradient
//                   colors={markingAsSold ? ['#9CA3AF', '#6B7280'] : ['#F59E0B', '#D97706']}
//                   style={styles.actionButton}
//                 >
//                   {markingAsSold ? (
//                     <ActivityIndicator size="small" color="white" />
//                   ) : (
//                     <>
//                       <Ionicons name="checkmark-circle" size={20} color="white" />
//                       <Text style={styles.actionButtonText}>Mark as Sold</Text>
//                     </>
//                   )}
//                 </LinearGradient>
//               </TouchableOpacity>
//             )}
            
//             {!item.is_current_user && !item.is_sold && (
//               <TouchableOpacity
//                 style={styles.actionButtonContainer}
//                 onPress={contactSeller}
//               >
//                 <LinearGradient
//                   colors={['#3B82F6', '#1D4ED8']}
//                   style={styles.actionButton}
//                 >
//                   <Ionicons name="chatbubble-ellipses" size={20} color="white" />
//                   <Text style={styles.actionButtonText}>Contact Seller</Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             )}
//           </View>

//           {/* Sold Message */}
//           {item.is_sold && (
//             <View style={styles.soldMessageContainer}>
//               <LinearGradient
//                 colors={['#FEE2E2', '#FECACA']}
//                 style={styles.soldMessage}
//               >
//                 <View style={styles.soldIconContainer}>
//                   <Ionicons name="checkmark-circle" size={32} color="#EF4444" />
//                 </View>
//                 <View style={styles.soldMessageContent}>
//                   <Text style={styles.soldMessageTitle}>Item Sold</Text>
//                   <Text style={styles.soldMessageText}>This item is no longer available</Text>
//                 </View>
//               </LinearGradient>
//             </View>
//           )}
//         </View>
//       </ScrollView>

//       {/* Custom Modals */}
//       <CustomModal
//         visible={modalConfig.visible}
//         onClose={hideModal}
//         title={modalConfig.title}
//         message={modalConfig.message}
//         actions={modalConfig.actions}
//         type={modalConfig.type}
//       />

//       <ContactModal
//         visible={contactModalVisible}
//         onClose={() => setContactModalVisible(false)}
//         seller={item?.seller}
//         itemTitle={item?.title}
//       />
//     </SafeAreaView>
//   );
// }
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
  
//   // Header Styles - Enhanced
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: Platform.OS === 'ios' ? 16 : 20,
//     paddingBottom: 20,
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(226, 232, 240, 0.5)',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 4,
//   },
//   headerButton: {
//     borderRadius: 16,
//     overflow: 'hidden',
//   },
//   headerButtonContent: {
//     padding: 14,
//     backgroundColor: 'rgba(59, 130, 246, 0.08)',
//     borderRadius: 16,
//     borderWidth: 1.5,
//     borderColor: 'rgba(59, 130, 246, 0.15)',
//     shadowColor: '#3B82F6',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },

//   // Loading Styles - Enhanced
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   loadingContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   loadingText: {
//     marginTop: 24,
//     fontSize: 17,
//     color: '#475569',
//     fontWeight: '600',
//     textAlign: 'center',
//     letterSpacing: 0.3,
//   },

//   // Error Styles - Enhanced
//   errorContainer: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   errorContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//   },
//   errorIconContainer: {
//     marginBottom: 28,
//     padding: 16,
//     backgroundColor: 'rgba(239, 68, 68, 0.1)',
//     borderRadius: 24,
//   },
//   errorTitle: {
//     fontSize: 26,
//     fontWeight: '800',
//     color: '#0F172A',
//     marginBottom: 16,
//     textAlign: 'center',
//     letterSpacing: -0.5,
//   },
//   errorMessage: {
//     fontSize: 17,
//     color: '#64748B',
//     textAlign: 'center',
//     lineHeight: 26,
//     marginBottom: 36,
//     maxWidth: 300,
//   },
//   retryButton: {
//     borderRadius: 16,
//     overflow: 'hidden',
//     shadowColor: '#3B82F6',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.25,
//     shadowRadius: 12,
//     elevation: 6,
//   },
//   retryButtonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 28,
//     paddingVertical: 18,
//     gap: 10,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 17,
//     fontWeight: '700',
//     letterSpacing: 0.3,
//   },

//   scrollView: {
//     flex: 1,
//   },

//   // Image Section - Enhanced
//   imageContainer: {
//     position: 'relative',
//     width: width,
//     height: width * 0.85,
//     backgroundColor: '#F1F5F9',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   imageLoadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(248, 250, 252, 0.95)',
//   },
//   placeholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F1F5F9',
//   },
//   placeholderIcon: {
//     marginBottom: 16,
//     padding: 20,
//     backgroundColor: 'rgba(156, 163, 175, 0.1)',
//     borderRadius: 20,
//   },
//   placeholderText: {
//     fontSize: 18,
//     color: '#6B7280',
//     fontWeight: '600',
//     letterSpacing: 0.3,
//   },
//   soldBadge: {
//     position: 'absolute',
//     top: 28,
//     right: 28,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 24,
//     shadowColor: '#EF4444',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.35,
//     shadowRadius: 12,
//     elevation: 8,
//     gap: 8,
//   },
//   soldBadgeText: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: '800',
//     letterSpacing: 1.5,
//   },

//   // Content Section - Enhanced
//   contentContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 36,
//     borderTopRightRadius: 36,
//     marginTop: -36,
//     paddingTop: 44,
//     paddingHorizontal: 28,
//     paddingBottom: 50,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -6 },
//     shadowOpacity: 0.12,
//     shadowRadius: 16,
//     elevation: 12,
//   },

//   // Title and Price - Enhanced
//   titleSection: {
//     marginBottom: 36,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: '800',
//     color: '#0F172A',
//     marginBottom: 24,
//     lineHeight: 40,
//     letterSpacing: -0.8,
//   },
//   priceContainer: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 24,
//     paddingVertical: 20,
//     borderRadius: 20,
//     shadowColor: '#10B981',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.3,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   priceLabel: {
//     fontSize: 13,
//     color: 'rgba(255, 255, 255, 0.85)',
//     fontWeight: '600',
//     marginBottom: 6,
//     textTransform: 'uppercase',
//     letterSpacing: 1,
//   },
//   price: {
//     fontSize: 28,
//     fontWeight: '800',
//     color: 'white',
//     letterSpacing: -0.5,
//   },

//   // Meta Information - Enhanced
//   metaContainer: {
//     flexDirection: 'row',
//     marginBottom: 36,
//     gap: 20,
//   },
//   metaItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FAFBFC',
//     paddingHorizontal: 18,
//     paddingVertical: 16,
//     borderRadius: 18,
//     borderWidth: 2,
//     borderColor: '#E2E8F0',
//     flex: 1,
//     shadowColor: '#64748B',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   metaIconContainer: {
//     marginRight: 10,
//     padding: 4,
//   },
//   metaText: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#334155',
//     textTransform: 'capitalize',
//     letterSpacing: 0.2,
//   },

//   // Description - Enhanced
//   descriptionContainer: {
//     marginBottom: 36,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: '800',
//     color: '#0F172A',
//     marginBottom: 20,
//     letterSpacing: -0.3,
//   },
//   descriptionContent: {
//     backgroundColor: '#FAFBFC',
//     borderRadius: 20,
//     borderLeftWidth: 5,
//     borderLeftColor: '#3B82F6',
//     overflow: 'hidden',
//     shadowColor: '#64748B',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   description: {
//     fontSize: 17,
//     lineHeight: 28,
//     color: '#334155',
//     padding: 24,
//     fontWeight: '500',
//   },

//   // Seller Information - Enhanced
//   sellerContainer: {
//     marginBottom: 36,
//   },
//   sellerCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FAFBFC',
//     padding: 24,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: '#E2E8F0',
//     shadowColor: '#64748B',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.08,
//     shadowRadius: 10,
//     elevation: 4,
//   },
//   sellerAvatar: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: '#3B82F6',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 20,
//     shadowColor: '#3B82F6',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.3,
//     shadowRadius: 10,
//     elevation: 6,
//   },
//   sellerAvatarText: {
//     color: 'white',
//     fontSize: 24,
//     fontWeight: '800',
//     letterSpacing: -0.5,
//   },
//   sellerDetails: {
//     flex: 1,
//   },
//   sellerName: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: '#0F172A',
//     marginBottom: 6,
//     letterSpacing: -0.2,
//   },
//   sellerLabel: {
//     fontSize: 15,
//     color: '#64748B',
//     fontWeight: '600',
//     letterSpacing: 0.2,
//   },
//   sellerBadge: {
//     marginLeft: 16,
//     padding: 4,
//   },

//   // Action Buttons - Enhanced
//   actionContainer: {
//     gap: 20,
//     marginTop: 8,
//   },
//   actionButtonContainer: {
//     borderRadius: 20,
//     overflow: 'hidden',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 22,
//     gap: 14,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.25,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: '700',
//     letterSpacing: 0.3,
//   },

//   // Sold Message - Enhanced
//   soldMessageContainer: {
//     marginTop: 28,
//   },
//   soldMessage: {
//     borderRadius: 20,
//     padding: 24,
//     flexDirection: 'row',
//     alignItems: 'center',
//     shadowColor: '#EF4444',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   soldIconContainer: {
//     marginRight: 20,
//     padding: 6,
//   },
//   soldMessageContent: {
//     flex: 1,
//   },
//   soldMessageTitle: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: '#DC2626',
//     marginBottom: 6,
//     letterSpacing: -0.2,
//   },
//   soldMessageText: {
//     fontSize: 16,
//     color: '#B91C1C',
//     fontWeight: '600',
//     letterSpacing: 0.2,
//   },

//   // Modal Styles - Enhanced
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'flex-end',
//   },
//   modalBackdrop: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   modalContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 28,
//     borderTopRightRadius: 28,
//     paddingBottom: 50,
//     maxHeight: height * 0.8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -8 },
//     shadowOpacity: 0.15,
//     shadowRadius: 20,
//     elevation: 16,
//   },
//   modalHeader: {
//     alignItems: 'center',
//     paddingTop: 36,
//     paddingBottom: 28,
//     borderTopLeftRadius: 28,
//     borderTopRightRadius: 28,
//   },
//   modalIconContainer: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   modalContent: {
//     paddingHorizontal: 28,
//   },
//   modalTitle: {
//     fontSize: 24,
//     fontWeight: '800',
//     color: '#0F172A',
//     textAlign: 'center',
//     marginBottom: 16,
//     letterSpacing: -0.3,
//   },
//   modalMessage: {
//     fontSize: 17,
//     color: '#475569',
//     textAlign: 'center',
//     lineHeight: 26,
//     marginBottom: 36,
//     paddingHorizontal: 8,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     gap: 16,
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 18,
//     borderRadius: 16,
//     alignItems: 'center',
//   },
//   modalButtonPrimary: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   modalButtonSecondary: {
//     backgroundColor: '#F8FAFC',
//     borderWidth: 2,
//     borderColor: '#E2E8F0',
//   },
//   modalButtonText: {
//     fontSize: 17,
//     fontWeight: '700',
//     letterSpacing: 0.3,
//   },
//   modalButtonTextPrimary: {
//     color: 'white',
//   },
//   modalButtonTextSecondary: {
//     fontWeight: '700',
//   },

//   // Contact Modal Styles - Enhanced
//   contactModalContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 28,
//     borderTopRightRadius: 28,
//     paddingBottom: 50,
//     maxHeight: height * 0.65,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -8 },
//     shadowOpacity: 0.15,
//     shadowRadius: 20,
//     elevation: 16,
//   },
//   contactModalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 28,
//     paddingTop: 28,
//     paddingBottom: 24,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E2E8F0',
//   },
//   contactModalTitle: {
//     fontSize: 22,
//     fontWeight: '800',
//     color: '#0F172A',
//     letterSpacing: -0.3,
//   },
//   closeButton: {
//     padding: 10,
//     borderRadius: 12,
//     backgroundColor: '#F1F5F9',
//     shadowColor: '#64748B',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   contactModalContent: {
//     padding: 28,
//   },
//   sellerInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 28,
//     padding: 20,
//     backgroundColor: '#FAFBFC',
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: '#E2E8F0',
//     shadowColor: '#64748B',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   sellerEmail: {
//     fontSize: 15,
//     color: '#64748B',
//     marginTop: 6,
//     fontWeight: '600',
//     letterSpacing: 0.2,
//   },
//   contactOption: {
//     borderRadius: 16,
//     overflow: 'hidden',
//     shadowColor: '#3B82F6',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.25,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   contactOptionGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 20,
//     gap: 12,
//   },
//   contactOptionText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: '700',
//     letterSpacing: 0.3,
//   },
// });













// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
  
//   // Header Styles
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingTop: Platform.OS === 'ios' ? 16 : 12,
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingTop: 12,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E2E8F0',
//   },
//   headerButton: {
//     borderRadius: 12,
//   },
//   headerButtonContent: {
//     padding: 12,
//     backgroundColor: 'rgba(59, 130, 246, 0.1)',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(59, 130, 246, 0.2)',
//   },

//   // Loading Styles
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   loadingContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 32,
//   },
//   loadingText: {
//     marginTop: 20,
//     fontSize: 16,
//     color: '#64748B',
//     fontWeight: '500',
//   },

//   // Error Styles
//   errorContainer: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   errorContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 32,
//   },
//   errorIconContainer: {
//     marginBottom: 24,
//   },
//   errorTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#1E293B',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   errorMessage: {
//     fontSize: 16,
//     color: '#64748B',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 32,
//   },
//   retryButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     elevation: 4,
//     shadowColor: '#3B82F6',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   retryButtonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     paddingVertical: 16,
//     gap: 8,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },

//   scrollView: {
//     flex: 1,
//   },

//   // Image Section
//   imageContainer: {
//     position: 'relative',
//     width: width,
//     height: width * 0.8,
//     backgroundColor: '#F1F5F9',
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   imageLoadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(248, 250, 252, 0.9)',
//   },
//   placeholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F1F5F9',
//   },
//   placeholderIcon: {
//     marginBottom: 12,
//   },
//   placeholderText: {
//     fontSize: 16,
//     color: '#9CA3AF',
//     fontWeight: '500',
//   },
//   soldBadge: {
//     position: 'absolute',
//     top: 24,
//     right: 24,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     shadowColor: '#EF4444',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//     gap: 6,
//   },
//   soldBadgeText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//     letterSpacing: 1,
//   },

//   // Content Section
//   contentContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 32,
//     borderTopRightRadius: 32,
//     marginTop: -32,
//     paddingTop: 40,
//     paddingHorizontal: 24,
//     paddingBottom: 40,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 8,
//   },

//   // Title and Price
//   titleSection: {
//     marginBottom: 32,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#1E293B',
//     marginBottom: 20,
//     lineHeight: 36,
//   },
//   priceContainer: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderRadius: 16,
//     shadowColor: '#10B981',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   priceLabel: {
//     fontSize: 12,
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontWeight: '500',
//     marginBottom: 4,
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   price: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//   },

//   // Meta Information
//   metaContainer: {
//     flexDirection: 'row',
//     marginBottom: 32,
//     gap: 16,
//   },
//   metaItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8FAFC',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 16,
//     borderWidth: 2,
//     borderColor: '#E2E8F0',
//     flex: 1,
//   },
//   metaIconContainer: {
//     marginRight: 8,
//   },
//   metaText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#475569',
//     textTransform: 'capitalize',
//   },

//   // Description
//   descriptionContainer: {
//     marginBottom: 32,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#1E293B',
//     marginBottom: 16,
//   },
//   descriptionContent: {
//     backgroundColor: '#F8FAFC',
//     borderRadius: 16,
//     borderLeftWidth: 4,
//     borderLeftColor: '#3B82F6',
//     overflow: 'hidden',
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 26,
//     color: '#475569',
//     padding: 20,
//   },

//   // Seller Information
//   sellerContainer: {
//     marginBottom: 32,
//   },
//   sellerCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8FAFC',
//     padding: 20,
//     borderRadius: 16,
//     borderWidth: 2,
//     borderColor: '#E2E8F0',
//   },
//   sellerAvatar: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#3B82F6',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 16,
//     shadowColor: '#3B82F6',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   sellerAvatarText: {
//     color: 'white',
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   sellerDetails: {
//     flex: 1,
//   },
//   sellerName: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1E293B',
//     marginBottom: 4,
//   },
//   sellerLabel: {
//     fontSize: 14,
//     color: '#64748B',
//     fontWeight: '500',
//   },
//   sellerBadge: {
//     marginLeft: 12,
//   },

//   // Action Buttons
//   actionContainer: {
//     gap: 16,
//   },
//   actionButtonContainer: {
//     borderRadius: 16,
//     overflow: 'hidden',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 20,
//     gap: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },

//   // Sold Message
//   soldMessageContainer: {
//     marginTop: 24,
//   },
//   soldMessage: {
//     borderRadius: 16,
//     padding: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   soldIconContainer: {
//     marginRight: 16,
//   },
//   soldMessageContent: {
//     flex: 1,
//   },
//   soldMessageTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#EF4444',
//     marginBottom: 4,
//   },
//   soldMessageText: {
//     fontSize: 14,
//     color: '#DC2626',
//     fontWeight: '500',
//   },

//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalBackdrop: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   modalContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     paddingBottom: 40,
//     maxHeight: height * 0.8,
//   },
//   modalHeader: {
//     alignItems: 'center',
//     paddingTop: 32,
//     paddingBottom: 24,
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//   },
//   modalIconContainer: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     paddingHorizontal: 24,
//   },
//   modalTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#1E293B',
//     textAlign: 'center',
//     marginBottom: 12,
//   },
//   modalMessage: {
//     fontSize: 16,
//     color: '#64748B',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 32,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   modalButtonPrimary: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   modalButtonSecondary: {
//     backgroundColor: '#F8FAFC',
//     borderWidth: 2,
//     borderColor: '#E2E8F0',
//   },
//   modalButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   modalButtonTextPrimary: {
//     color: 'white',
//   },
//   modalButtonTextSecondary: {
//     fontWeight: '600',
//   },

//   // Contact Modal Styles
//   contactModalContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     paddingBottom: 40,
//     maxHeight: height * 0.6,
//   },
//   contactModalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     paddingTop: 24,
//     paddingBottom: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E2E8F0',
//   },
//   contactModalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#1E293B',
//   },
//   closeButton: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: '#F1F5F9',
//   },
//   contactModalContent: {
//     padding: 24,
//   },
//   sellerInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 24,
//     padding: 16,
//     backgroundColor: '#F8FAFC',
//     borderRadius: 16,
//   },
//   sellerEmail: {
//     fontSize: 14,
//     color: '#64748B',
//     marginTop: 4,
//   },
//   contactOption: {
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   contactOptionGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     gap: 8,
//   },
//   contactOptionText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

































































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   StyleSheet, 
//   TouchableOpacity, 
//   Alert, 
//   ActivityIndicator,
//   ScrollView,
//   Dimensions,
//   SafeAreaView,
//   StatusBar,
//   Share,
//   Linking
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import axios from 'axios';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');
// const API_BASE_URL = 'http://127.0.0.1:8000';

// export default function MarketplaceDetail() {
//   const router = useRouter();
//   const { itemId } = useLocalSearchParams();

//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [markingAsSold, setMarkingAsSold] = useState(false);
//   const [imageLoading, setImageLoading] = useState(true);

//   useEffect(() => {
//     if (itemId) {
//       fetchItemDetails();
//     } else {
//       setLoading(false);
//       Alert.alert('Error', 'No item ID provided', [
//         { text: 'OK', onPress: () => router.back() }
//       ]);
//     }
//   }, [itemId]);

//   const fetchItemDetails = async () => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/marketplace/${itemId}/`);
//       setItem(response.data);
//     } catch (error) {
//       console.error('Error fetching item:', error);
//       Alert.alert('Error', 'Failed to load item details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getAuthToken = async () => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

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
//       const token = await getAuthToken();
//       if (!token) {
//         Alert.alert('Error', 'You must be logged in to mark an item as sold');
//         return;
//       }
      
//       await axios.patch(`${API_BASE_URL}/api/marketplace/${itemId}/mark_sold/`, {}, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
      
//       Alert.alert('Success', 'Item marked as sold!');
//       fetchItemDetails();
//     } catch (error) {
//       Alert.alert('Error', 'Failed to mark as sold');
//     } finally {
//       setMarkingAsSold(false);
//     }
//   };

//   const shareItem = async () => {
//     if (!item) return;
    
//     try {
//       await Share.share({
//         message: `Check out this ${item.title} for UGX ${item.price}`,
//         title: item.title,
//       });
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   const contactSeller = () => {
//     if (!item?.seller?.email) {
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
//           onPress: () => Linking.openURL(`mailto:${item.seller.email}?subject=Interested in ${item.title}`)
//         },
//         // You can add phone option if phone field exists in UserSerializer
//         // { 
//         //   text: 'Call', 
//         //   onPress: () => Linking.openURL(`tel:${item.seller.phone}`)
//         // },
//       ]
//     );
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <StatusBar barStyle="dark-content" />
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading item details...</Text>
//       </SafeAreaView>
//     );
//   }

//   if (!item) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <StatusBar barStyle="dark-content" />
//         <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
//         <Text style={styles.errorText}>Item not found</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetails}>
//           <Text style={styles.retryButtonText}>Try Again</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" />
      
//       {/* Header with back button and share */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.headerButton}
//           onPress={() => router.back('/market-place/market-place-feeds')}
//         >
//           <Ionicons name="arrow-back" size={24} color="#007AFF" />
//         </TouchableOpacity>
//         <TouchableOpacity 
//           style={styles.headerButton}
//           onPress={shareItem}
//         >
//           <Ionicons name="share-outline" size={24} color="#007AFF" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView 
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         bounces={true}
//       >
//         {/* Image Section */}
//         <View style={styles.imageContainer}>
//           {item.image ? (
//             <>
//               <Image 
//                 source={{ uri: `${API_BASE_URL}${item.image}` }} 
//                 style={styles.image}
//                 onLoadStart={() => setImageLoading(true)}
//                 onLoadEnd={() => setImageLoading(false)}
//               />
//               {imageLoading && (
//                 <View style={styles.imageLoadingOverlay}>
//                   <ActivityIndicator size="large" color="#007AFF" />
//                 </View>
//               )}
//             </>
//           ) : (
//             <View style={styles.placeholder}>
//               <Ionicons name="image-outline" size={48} color="#ccc" />
//               <Text style={styles.placeholderText}>No Image</Text>
//             </View>
//           )}
          
//           {item.is_sold && (
//             <View style={styles.soldBadge}>
//               <Text style={styles.soldBadgeText}>SOLD</Text>
//             </View>
//           )}
//         </View>

//         {/* Content Section */}
//         <View style={styles.contentContainer}>
//           {/* Title and Price */}
//           <View style={styles.titleSection}>
//             <Text style={styles.title}>{item.title}</Text>
//             <LinearGradient
//               colors={['#007AFF', '#5856d6']}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={styles.priceGradient}
//             >
//               <Text style={styles.price}>UGX {item.price?.toLocaleString()}</Text>
//             </LinearGradient>
//           </View>

//           {/* Meta Information */}
//           <View style={styles.metaContainer}>
//             <View style={styles.metaItem}>
//               <Ionicons name="pricetag-outline" size={16} color="#007AFF" />
//               <Text style={styles.metaText}>{item.category}</Text>
//             </View>
//             <View style={styles.metaItem}>
//               <Ionicons name="star-outline" size={16} color="#007AFF" />
//               <Text style={styles.metaText}>{item.condition}</Text>
//             </View>
//           </View>

//           {/* Description */}
//           <View style={styles.descriptionContainer}>
//             <Text style={styles.sectionTitle}>Description</Text>
//             <Text style={styles.description}>{item.description}</Text>
//           </View>

//           {/* Seller Information */}
//           <View style={styles.ownerContainer}>
//             <View style={styles.ownerInfo}>
//               <View style={styles.ownerAvatar}>
//                 <Text style={styles.ownerAvatarText}>
//                   {item.seller?.username?.charAt(0)?.toUpperCase() || 'S'}
//                 </Text>
//               </View>
//               <View style={styles.ownerDetails}>
//                 <Text style={styles.ownerName}>{item.seller?.username || 'Unknown Seller'}</Text>
//                 <Text style={styles.ownerLabel}>Seller</Text>
//               </View>
//             </View>
//           </View>

//           {/* Action Buttons */}
//           <View style={styles.actionContainer}>
//             {item.is_current_user && !item.is_sold && (
//               <TouchableOpacity
//                 style={[styles.actionButton, styles.markSoldButton]}
//                 onPress={markAsSold}
//                 disabled={markingAsSold}
//               >
//                 {markingAsSold ? (
//                   <ActivityIndicator size="small" color="white" />
//                 ) : (
//                   <>
//                     <Ionicons name="checkmark-circle-outline" size={20} color="white" />
//                     <Text style={styles.actionButtonText}>Mark as Sold</Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             )}
            
//             {!item.is_current_user && !item.is_sold && (
//               <TouchableOpacity
//                 style={[styles.actionButton, styles.contactButton]}
//                 onPress={contactSeller}
//               >
//                 <Ionicons name="chatbubble-outline" size={20} color="white" />
//                 <Text style={styles.actionButtonText}>Contact Seller</Text>
//               </TouchableOpacity>
//             )}
//           </View>

//           {/* Sold Message */}
//           {item.is_sold && (
//             <LinearGradient
//               colors={['#ff6b6b', '#ee5a52']}
//               style={styles.soldMessage}
//             >
//               <Ionicons name="checkmark-circle" size={24} color="white" />
//               <Text style={styles.soldMessageText}>This item has been sold</Text>
//             </LinearGradient>
//           )}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingTop: 12,
//     paddingBottom: 8,
//     backgroundColor: 'white',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e8ed',
//   },
//   headerButton: {
//     padding: 8,
//     borderRadius: 8,
//   },
//   scrollView: {
//     flex: 1,
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
//     padding: 32,
//   },
//   errorText: {
//     fontSize: 18,
//     color: '#666',
//     marginTop: 16,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
  
//   // Image Section
//   imageContainer: {
//     position: 'relative',
//     width: width,
//     height: width * 0.75,
//     backgroundColor: '#f0f0f0',
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   imageLoadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(248, 249, 250, 0.8)',
//   },
//   placeholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f0f0f0',
//   },
//   placeholderText: {
//     marginTop: 8,
//     fontSize: 16,
//     color: '#ccc',
//   },
//   soldBadge: {
//     position: 'absolute',
//     top: 20,
//     right: 20,
//     backgroundColor: '#ff4757',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   soldBadgeText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//     letterSpacing: 1,
//   },

//   // Content Section
//   contentContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     marginTop: -24,
//     paddingTop: 32,
//     paddingHorizontal: 24,
//     paddingBottom: 32,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   titleSection: {
//     marginBottom: 24,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 12,
//     lineHeight: 34,
//   },
//   priceGradient: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 12,
//   },
//   price: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//   },

//   // Meta Information
//   metaContainer: {
//     flexDirection: 'row',
//     marginBottom: 24,
//     gap: 16,
//   },
//   metaItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 122, 255, 0.1)',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(0, 122, 255, 0.2)',
//   },
//   metaText: {
//     marginLeft: 6,
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#007AFF',
//   },

//   // Description
//   descriptionContainer: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 12,
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: '#4a5568',
//     backgroundColor: 'rgba(0, 0, 0, 0.02)',
//     padding: 16,
//     borderRadius: 12,
//     borderLeftWidth: 4,
//     borderLeftColor: '#007AFF',
//   },

//   // Owner Information
//   ownerContainer: {
//     marginBottom: 32,
//   },
//   ownerInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.03)',
//     padding: 16,
//     borderRadius: 12,
//   },
//   ownerAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   ownerAvatarText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   ownerDetails: {
//     flex: 1,
//   },
//   ownerName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2c3e50',
//   },
//   ownerLabel: {
//     fontSize: 14,
//     color: '#666',
//     fontStyle: 'italic',
//   },

//   // Action Buttons
//   actionContainer: {
//     gap: 12,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 5,
//     gap: 8,
//   },
//   markSoldButton: {
//     backgroundColor: '#28a745',
//   },
//   contactButton: {
//     backgroundColor: '#007AFF',
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },

//   // Sold Message
//   soldMessage: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//     borderRadius: 12,
//     marginTop: 16,
//     gap: 12,
//     shadowColor: '#ff6b6b',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   soldMessageText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
// });


































































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   StyleSheet, 
//   TouchableOpacity, 
//   Alert, 
//   ActivityIndicator,
//   ScrollView,
//   Dimensions,
//   SafeAreaView,
//   StatusBar,
//   Share,
//   Linking
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import axios from 'axios';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');
// const API_BASE_URL = 'http://127.0.0.1:8000';

// export default function MarketplaceDetail() {
//   const router = useRouter();
//   const { itemId } = useLocalSearchParams();

//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [markingAsSold, setMarkingAsSold] = useState(false);
//   const [imageLoading, setImageLoading] = useState(true);

//   useEffect(() => {
//     if (itemId) {
//       fetchItemDetails();
//     } else {
//       setLoading(false);
//       Alert.alert('Error', 'No item ID provided', [
//         { text: 'OK', onPress: () => router.back() }
//       ]);
//     }
//   }, [itemId]);

//   const fetchItemDetails = async () => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/marketplace/${itemId}/`);
//       setItem(response.data);
//     } catch (error) {
//       console.error('Error fetching item:', error);
//       Alert.alert('Error', 'Failed to load item details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getAuthToken = async () => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

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
//       const token = await getAuthToken();
//       if (!token) {
//         Alert.alert('Error', 'You must be logged in to mark an item as sold');
//         return;
//       }
      
//       await axios.patch(`${API_BASE_URL}/api/marketplace/${itemId}/mark_sold/`, {}, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
      
//       Alert.alert('Success', 'Item marked as sold!');
//       fetchItemDetails();
//     } catch (error) {
//       Alert.alert('Error', 'Failed to mark as sold');
//     } finally {
//       setMarkingAsSold(false);
//     }
//   };

//   const shareItem = async () => {
//     if (!item) return;
    
//     try {
//       await Share.share({
//         message: `Check out this ${item.title} for UGX ${item.price}`,
//         title: item.title,
//       });
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   const contactSeller = () => {
//     if (!item?.owner?.phone) {
//       Alert.alert('Contact Info', 'No contact information available');
//       return;
//     }
    
//     Alert.alert(
//       'Contact Seller',
//       'How would you like to contact the seller?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Call', 
//           onPress: () => Linking.openURL(`tel:${item.owner.phone}`)
//         },
//         { 
//           text: 'SMS', 
//           onPress: () => Linking.openURL(`sms:${item.owner.phone}`)
//         }
//       ]
//     );
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <StatusBar barStyle="dark-content" />
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading item details...</Text>
//       </SafeAreaView>
//     );
//   }

//   if (!item) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <StatusBar barStyle="dark-content" />
//         <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
//         <Text style={styles.errorText}>Item not found</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetails}>
//           <Text style={styles.retryButtonText}>Try Again</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" />
      
//       {/* Header with back button and share */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.headerButton}
//           onPress={() => router.back()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#007AFF" />
//         </TouchableOpacity>
//         <TouchableOpacity 
//           style={styles.headerButton}
//           onPress={shareItem}
//         >
//           <Ionicons name="share-outline" size={24} color="#007AFF" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView 
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         bounces={true}
//       >
//         {/* Image Section */}
//         <View style={styles.imageContainer}>
//           {item.image ? (
//             <>
//               <Image 
//                 source={{ uri: `${API_BASE_URL}${item.image}` }} 
//                 style={styles.image}
//                 onLoadStart={() => setImageLoading(true)}
//                 onLoadEnd={() => setImageLoading(false)}
//               />
//               {imageLoading && (
//                 <View style={styles.imageLoadingOverlay}>
//                   <ActivityIndicator size="large" color="#007AFF" />
//                 </View>
//               )}
//             </>
//           ) : (
//             <View style={styles.placeholder}>
//               <Ionicons name="image-outline" size={48} color="#ccc" />
//               <Text style={styles.placeholderText}>No Image</Text>
//             </View>
//           )}
          
//           {item.is_sold && (
//             <View style={styles.soldBadge}>
//               <Text style={styles.soldBadgeText}>SOLD</Text>
//             </View>
//           )}
//         </View>

//         {/* Content Section */}
//         <View style={styles.contentContainer}>
//           {/* Title and Price */}
//           <View style={styles.titleSection}>
//             <Text style={styles.title}>{item.title}</Text>
//             <LinearGradient
//               colors={['#007AFF', '#5856d6']}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={styles.priceGradient}
//             >
//               <Text style={styles.price}>UGX {item.price?.toLocaleString()}</Text>
//             </LinearGradient>
//           </View>

//           {/* Meta Information */}
//           <View style={styles.metaContainer}>
//             <View style={styles.metaItem}>
//               <Ionicons name="pricetag-outline" size={16} color="#007AFF" />
//               <Text style={styles.metaText}>{item.category}</Text>
//             </View>
//             <View style={styles.metaItem}>
//               <Ionicons name="star-outline" size={16} color="#007AFF" />
//               <Text style={styles.metaText}>{item.condition}</Text>
//             </View>
//           </View>

//           {/* Description */}
//           <View style={styles.descriptionContainer}>
//             <Text style={styles.sectionTitle}>Description</Text>
//             <Text style={styles.description}>{item.description}</Text>
//           </View>

//           {/* Owner Information */}
//           <View style={styles.ownerContainer}>
//             <View style={styles.ownerInfo}>
//               <View style={styles.ownerAvatar}>
//                 <Text style={styles.ownerAvatarText}>
//                   {item.owner.username?.charAt(0).toUpperCase()}
//                 </Text>
//               </View>
//               <View style={styles.ownerDetails}>
//                 <Text style={styles.ownerName}>{item.owner.username}</Text>
//                 <Text style={styles.ownerLabel}>Seller</Text>
//               </View>
//             </View>
//           </View>

//           {/* Action Buttons */}
//           <View style={styles.actionContainer}>
//             {item.owner.is_current_user && !item.is_sold && (
//               <TouchableOpacity
//                 style={[styles.actionButton, styles.markSoldButton]}
//                 onPress={markAsSold}
//                 disabled={markingAsSold}
//               >
//                 {markingAsSold ? (
//                   <ActivityIndicator size="small" color="white" />
//                 ) : (
//                   <>
//                     <Ionicons name="checkmark-circle-outline" size={20} color="white" />
//                     <Text style={styles.actionButtonText}>Mark as Sold</Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             )}
            
//             {!item.owner.is_current_user && !item.is_sold && (
//               <TouchableOpacity
//                 style={[styles.actionButton, styles.contactButton]}
//                 onPress={contactSeller}
//               >
//                 <Ionicons name="chatbubble-outline" size={20} color="white" />
//                 <Text style={styles.actionButtonText}>Contact Seller</Text>
//               </TouchableOpacity>
//             )}
//           </View>

//           {/* Sold Message */}
//           {item.is_sold && (
//             <LinearGradient
//               colors={['#ff6b6b', '#ee5a52']}
//               style={styles.soldMessage}
//             >
//               <Ionicons name="checkmark-circle" size={24} color="white" />
//               <Text style={styles.soldMessageText}>This item has been sold</Text>
//             </LinearGradient>
//           )}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingTop: 12,
//     paddingBottom: 8,
//     backgroundColor: 'white',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e8ed',
//   },
//   headerButton: {
//     padding: 8,
//     borderRadius: 8,
//   },
//   scrollView: {
//     flex: 1,
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
//     padding: 32,
//   },
//   errorText: {
//     fontSize: 18,
//     color: '#666',
//     marginTop: 16,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
  
//   // Image Section
//   imageContainer: {
//     position: 'relative',
//     width: width,
//     height: width * 0.75,
//     backgroundColor: '#f0f0f0',
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   imageLoadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(248, 249, 250, 0.8)',
//   },
//   placeholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f0f0f0',
//   },
//   placeholderText: {
//     marginTop: 8,
//     fontSize: 16,
//     color: '#ccc',
//   },
//   soldBadge: {
//     position: 'absolute',
//     top: 20,
//     right: 20,
//     backgroundColor: '#ff4757',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   soldBadgeText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//     letterSpacing: 1,
//   },

//   // Content Section
//   contentContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     marginTop: -24,
//     paddingTop: 32,
//     paddingHorizontal: 24,
//     paddingBottom: 32,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   titleSection: {
//     marginBottom: 24,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 12,
//     lineHeight: 34,
//   },
//   priceGradient: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 12,
//   },
//   price: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//   },

//   // Meta Information
//   metaContainer: {
//     flexDirection: 'row',
//     marginBottom: 24,
//     gap: 16,
//   },
//   metaItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 122, 255, 0.1)',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(0, 122, 255, 0.2)',
//   },
//   metaText: {
//     marginLeft: 6,
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#007AFF',
//   },

//   // Description
//   descriptionContainer: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 12,
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: '#4a5568',
//     backgroundColor: 'rgba(0, 0, 0, 0.02)',
//     padding: 16,
//     borderRadius: 12,
//     borderLeftWidth: 4,
//     borderLeftColor: '#007AFF',
//   },

//   // Owner Information
//   ownerContainer: {
//     marginBottom: 32,
//   },
//   ownerInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.03)',
//     padding: 16,
//     borderRadius: 12,
//   },
//   ownerAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   ownerAvatarText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   ownerDetails: {
//     flex: 1,
//   },
//   ownerName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2c3e50',
//   },
//   ownerLabel: {
//     fontSize: 14,
//     color: '#666',
//     fontStyle: 'italic',
//   },

//   // Action Buttons
//   actionContainer: {
//     gap: 12,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 5,
//     gap: 8,
//   },
//   markSoldButton: {
//     backgroundColor: '#28a745',
//   },
//   contactButton: {
//     backgroundColor: '#007AFF',
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },

//   // Sold Message
//   soldMessage: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//     borderRadius: 12,
//     marginTop: 16,
//     gap: 12,
//     shadowColor: '#ff6b6b',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   soldMessageText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
// });

































































// import React, { useEffect, useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   StyleSheet, 
//   TouchableOpacity, 
//   Alert, 
//   ActivityIndicator,
//   ScrollView,
//   Dimensions,
//   SafeAreaView,
//   StatusBar,
//   Share,
//   Linking
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import axios from 'axios';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');
// const API_BASE_URL = 'http://127.0.0.1:8000';

// export default function MarketplaceDetail() {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const { itemId } = route.params as { itemId: number };

//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [markingAsSold, setMarkingAsSold] = useState(false);
//   const [imageLoading, setImageLoading] = useState(true);

//   useEffect(() => {
//     fetchItemDetails();
//     setupNavigationHeader();
//   }, []);

//   const setupNavigationHeader = () => {
//     navigation.setOptions({
//       headerRight: () => (
//         <TouchableOpacity 
//           style={styles.headerButton}
//           onPress={shareItem}
//         >
//           <Ionicons name="share-outline" size={24} color="#007AFF" />
//         </TouchableOpacity>
//       ),
//     });
//   };

//   const fetchItemDetails = async () => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/marketplace/${itemId}/`);
//       setItem(response.data);
//     } catch (error) {
//       console.error('Error fetching item:', error);
//       Alert.alert('Error', 'Failed to load item details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getAuthToken = async () => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

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
//       const token = await getAuthToken();
//       if (!token) {
//         Alert.alert('Error', 'You must be logged in to mark an item as sold');
//         return;
//       }
      
//       await axios.patch(`${API_BASE_URL}/api/marketplace/${itemId}/mark_sold/`, {}, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
      
//       Alert.alert('Success', 'Item marked as sold!');
//       fetchItemDetails();
//     } catch (error) {
//       Alert.alert('Error', 'Failed to mark as sold');
//     } finally {
//       setMarkingAsSold(false);
//     }
//   };

//   const shareItem = async () => {
//     if (!item) return;
    
//     try {
//       await Share.share({
//         message: `Check out this ${item.title} for UGX ${item.price}`,
//         title: item.title,
//       });
//     } catch (error) {
//       console.error('Error sharing:', error);
//     }
//   };

//   const contactSeller = () => {
//     if (!item?.owner?.phone) {
//       Alert.alert('Contact Info', 'No contact information available');
//       return;
//     }
    
//     Alert.alert(
//       'Contact Seller',
//       'How would you like to contact the seller?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Call', 
//           onPress: () => Linking.openURL(`tel:${item.owner.phone}`)
//         },
//         { 
//           text: 'SMS', 
//           onPress: () => Linking.openURL(`sms:${item.owner.phone}`)
//         }
//       ]
//     );
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <StatusBar barStyle="dark-content" />
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading item details...</Text>
//       </SafeAreaView>
//     );
//   }

//   if (!item) {
//     return (
//       <SafeAreaView style={styles.errorContainer}>
//         <StatusBar barStyle="dark-content" />
//         <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
//         <Text style={styles.errorText}>Item not found</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={fetchItemDetails}>
//           <Text style={styles.retryButtonText}>Try Again</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" />
//       <ScrollView 
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         bounces={true}
//       >
//         {/* Image Section */}
//         <View style={styles.imageContainer}>
//           {item.image ? (
//             <>
//               <Image 
//                 source={{ uri: `${API_BASE_URL}${item.image}` }} 
//                 style={styles.image}
//                 onLoadStart={() => setImageLoading(true)}
//                 onLoadEnd={() => setImageLoading(false)}
//               />
//               {imageLoading && (
//                 <View style={styles.imageLoadingOverlay}>
//                   <ActivityIndicator size="large" color="#007AFF" />
//                 </View>
//               )}
//             </>
//           ) : (
//             <View style={styles.placeholder}>
//               <Ionicons name="image-outline" size={48} color="#ccc" />
//               <Text style={styles.placeholderText}>No Image</Text>
//             </View>
//           )}
          
//           {item.is_sold && (
//             <View style={styles.soldBadge}>
//               <Text style={styles.soldBadgeText}>SOLD</Text>
//             </View>
//           )}
//         </View>

//         {/* Content Section */}
//         <View style={styles.contentContainer}>
//           {/* Title and Price */}
//           <View style={styles.titleSection}>
//             <Text style={styles.title}>{item.title}</Text>
//             <LinearGradient
//               colors={['#007AFF', '#5856d6']}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={styles.priceGradient}
//             >
//               <Text style={styles.price}>UGX {item.price?.toLocaleString()}</Text>
//             </LinearGradient>
//           </View>

//           {/* Meta Information */}
//           <View style={styles.metaContainer}>
//             <View style={styles.metaItem}>
//               <Ionicons name="pricetag-outline" size={16} color="#007AFF" />
//               <Text style={styles.metaText}>{item.category}</Text>
//             </View>
//             <View style={styles.metaItem}>
//               <Ionicons name="star-outline" size={16} color="#007AFF" />
//               <Text style={styles.metaText}>{item.condition}</Text>
//             </View>
//           </View>

//           {/* Description */}
//           <View style={styles.descriptionContainer}>
//             <Text style={styles.sectionTitle}>Description</Text>
//             <Text style={styles.description}>{item.description}</Text>
//           </View>

//           {/* Owner Information */}
//           <View style={styles.ownerContainer}>
//             <View style={styles.ownerInfo}>
//               <View style={styles.ownerAvatar}>
//                 <Text style={styles.ownerAvatarText}>
//                   {item.owner.username?.charAt(0).toUpperCase()}
//                 </Text>
//               </View>
//               <View style={styles.ownerDetails}>
//                 <Text style={styles.ownerName}>{item.owner.username}</Text>
//                 <Text style={styles.ownerLabel}>Seller</Text>
//               </View>
//             </View>
//           </View>

//           {/* Action Buttons */}
//           <View style={styles.actionContainer}>
//             {item.owner.is_current_user && !item.is_sold && (
//               <TouchableOpacity
//                 style={[styles.actionButton, styles.markSoldButton]}
//                 onPress={markAsSold}
//                 disabled={markingAsSold}
//               >
//                 {markingAsSold ? (
//                   <ActivityIndicator size="small" color="white" />
//                 ) : (
//                   <>
//                     <Ionicons name="checkmark-circle-outline" size={20} color="white" />
//                     <Text style={styles.actionButtonText}>Mark as Sold</Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             )}
            
//             {!item.owner.is_current_user && !item.is_sold && (
//               <TouchableOpacity
//                 style={[styles.actionButton, styles.contactButton]}
//                 onPress={contactSeller}
//               >
//                 <Ionicons name="chatbubble-outline" size={20} color="white" />
//                 <Text style={styles.actionButtonText}>Contact Seller</Text>
//               </TouchableOpacity>
//             )}
//           </View>

//           {/* Sold Message */}
//           {item.is_sold && (
//             <LinearGradient
//               colors={['#ff6b6b', '#ee5a52']}
//               style={styles.soldMessage}
//             >
//               <Ionicons name="checkmark-circle" size={24} color="white" />
//               <Text style={styles.soldMessageText}>This item has been sold</Text>
//             </LinearGradient>
//           )}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   scrollView: {
//     flex: 1,
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
//     padding: 32,
//   },
//   errorText: {
//     fontSize: 18,
//     color: '#666',
//     marginTop: 16,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: '#007AFF',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   headerButton: {
//     padding: 8,
//     marginRight: 8,
//   },
  
//   // Image Section
//   imageContainer: {
//     position: 'relative',
//     width: width,
//     height: width * 0.75,
//     backgroundColor: '#f0f0f0',
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   imageLoadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(248, 249, 250, 0.8)',
//   },
//   placeholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f0f0f0',
//   },
//   placeholderText: {
//     marginTop: 8,
//     fontSize: 16,
//     color: '#ccc',
//   },
//   soldBadge: {
//     position: 'absolute',
//     top: 20,
//     right: 20,
//     backgroundColor: '#ff4757',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   soldBadgeText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//     letterSpacing: 1,
//   },

//   // Content Section
//   contentContainer: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     marginTop: -24,
//     paddingTop: 32,
//     paddingHorizontal: 24,
//     paddingBottom: 32,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   titleSection: {
//     marginBottom: 24,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 12,
//     lineHeight: 34,
//   },
//   priceGradient: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 12,
//   },
//   price: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//   },

//   // Meta Information
//   metaContainer: {
//     flexDirection: 'row',
//     marginBottom: 24,
//     gap: 16,
//   },
//   metaItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 122, 255, 0.1)',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(0, 122, 255, 0.2)',
//   },
//   metaText: {
//     marginLeft: 6,
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#007AFF',
//   },

//   // Description
//   descriptionContainer: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 12,
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: '#4a5568',
//     backgroundColor: 'rgba(0, 0, 0, 0.02)',
//     padding: 16,
//     borderRadius: 12,
//     borderLeftWidth: 4,
//     borderLeftColor: '#007AFF',
//   },

//   // Owner Information
//   ownerContainer: {
//     marginBottom: 32,
//   },
//   ownerInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.03)',
//     padding: 16,
//     borderRadius: 12,
//   },
//   ownerAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   ownerAvatarText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   ownerDetails: {
//     flex: 1,
//   },
//   ownerName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2c3e50',
//   },
//   ownerLabel: {
//     fontSize: 14,
//     color: '#666',
//     fontStyle: 'italic',
//   },

//   // Action Buttons
//   actionContainer: {
//     gap: 12,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 5,
//     gap: 8,
//   },
//   markSoldButton: {
//     backgroundColor: '#28a745',
//   },
//   contactButton: {
//     backgroundColor: '#007AFF',
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },

//   // Sold Message
//   soldMessage: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//     borderRadius: 12,
//     marginTop: 16,
//     gap: 12,
//     shadowColor: '#ff6b6b',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   soldMessageText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
// });
























































// import React, { useEffect, useState } from 'react';
// import { View, Text, Image, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
// import axios from 'axios';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_BASE_URL = 'http://127.0.0.1:8000';

// export default function MarketplaceDetail() {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const { itemId } = route.params as { itemId: number };

//   const [item, setItem] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchItemDetails();
//   }, []);

//   const fetchItemDetails = async () => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/marketplace/${itemId}/`);
//       setItem(response.data);
//     } catch (error) {
//       console.error('Error fetching item:', error);
//     } finally {
//       setLoading(false);
//     }
//   };



//   const getAuthToken = async () => {
//     try {
//     return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//     console.error('Error getting auth token:', error);
//     return null;
//     }
//   };

//   const markAsSold = async () => {
//     try {

//       const token = await getAuthToken(); // Get the JWT token from storage
//       if (!token) {
//         Alert.alert('Error', 'You must be logged in to mark an item as sold');
//         return;
//       }
//       await axios.patch(`${API_BASE_URL}/api/marketplace/${itemId}/mark_sold/`, {}, {
//         headers: {
//           Authorization: `Bearer${token}`, 
//         },
//       });
//       Alert.alert('Success', 'Item marked as sold!');
//       fetchItemDetails(); // refresh
//     } catch (error) {
//       Alert.alert('Error', 'Failed to mark as sold');
//     }
//   };

//   if (loading) {
//     return <ActivityIndicator size="large" style={styles.center} />;
//   }

//   if (!item) {
//     return <Text style={styles.center}>Item not found</Text>;
//   }

//   return (
//     <View style={styles.container}>
//       {item.image ? (
//         <Image source={{ uri: `${API_BASE_URL}${item.image}` }} style={styles.image} />
//       ) : (
//         <View style={styles.placeholder}><Text>No Image</Text></View>
//       )}
//       <Text style={styles.title}>{item.title}</Text>
//       <Text style={styles.price}>UGX {item.price}</Text>
//       <Text style={styles.meta}>Category: {item.category} • Condition: {item.condition}</Text>
//       <Text style={styles.description}>{item.description}</Text>
//       <Text style={styles.owner}>Posted by: {item.owner.username}</Text>

//       {item.owner.is_current_user && !item.is_sold && (
//         <Button title="Mark as Sold" onPress={markAsSold} color="#28a745" />
//       )}

//       {item.is_sold && (
//         <Text style={styles.sold}>This item has been sold.</Text>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   image: {
//     width: '100%',
//     height: 250,
//     borderRadius: 8,
//     marginBottom: 16,
//   },
//   placeholder: {
//     width: '100%',
//     height: 250,
//     backgroundColor: '#ddd',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: 'bold',
//   },
//   price: {
//     fontSize: 18,
//     color: '#007AFF',
//     marginVertical: 4,
//   },
//   meta: {
//     fontSize: 14,
//     color: '#555',
//   },
//   description: {
//     marginVertical: 10,
//     fontSize: 16,
//   },
//   owner: {
//     fontStyle: 'italic',
//     color: '#777',
//     marginBottom: 16,
//   },
//   sold: {
//     color: 'red',
//     fontWeight: 'bold',
//     marginTop: 16,
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });
