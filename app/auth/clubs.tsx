

import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  TextInput,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ClubCard from '../../components/ClubCard';
import { useRouter } from 'expo-router';
import ConnectionAPI from '../api/connectionService'; // Import the API service

const { width } = Dimensions.get('window');

interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
  joined: boolean;
  members_count: number;
  createdAt?: string;
}

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

interface Member {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_picture?: string;
}

const ClubsScreen = () => {
  const navigation = useNavigation();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'recent'>('name');
  const [showJoinedOnly, setShowJoinedOnly] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [clubMembers, setClubMembers] = useState<Member[]>([]);

  const router = useRouter();

  const handleApiError = (error: any): ApiError => {
    // Handle different types of errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      switch (status) {
        case 401:
          return {
            message: 'Your session has expired. Please log in again.',
            status: 401,
            code: 'UNAUTHORIZED'
          };
        case 403:
          return {
            message: 'You don\'t have permission to access this resource.',
            status: 403,
            code: 'FORBIDDEN'
          };
        case 404:
          return {
            message: 'The requested resource was not found.',
            status: 404,
            code: 'NOT_FOUND'
          };
        case 429:
          return {
            message: 'Too many requests. Please try again later.',
            status: 429,
            code: 'RATE_LIMITED'
          };
        case 500:
        default:
          return {
            message: errorData?.message || 'Server is temporarily unavailable. Please try again later.',
            status: status,
            code: 'SERVER_ERROR'
          };
      }
    } else if (error.request) {
      return {
        message: 'Unable to connect to server. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      };
    } else if (error.message) {
      return {
        message: error.message,
        code: 'API_ERROR'
      };
    }
    
    return {
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR'
    };
  };

  const loadClubs = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      // Use ConnectionAPI method instead of direct axios call
      const clubsData = await ConnectionAPI.getClubs();
      setClubs(clubsData);
      
      // Extract unique categories
      const uniqueCategories = ['all', ...new Set(clubsData.map((club: Club) => club.category))];
      setCategories(uniqueCategories);
      
    } catch (error) {
      // console.error('Error loading clubs:', error);
      const apiError = handleApiError(error);
      setError(apiError);
      
      // If unauthorized, the ConnectionAPI will handle token refresh automatically
      // or clear tokens if refresh fails
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadClubMembers = async (clubId: number) => {
    try {
      setError(null);
      
      // Use ConnectionAPI method instead of direct axios call
      const membersData = await ConnectionAPI.getClubMembers(clubId);
      setClubMembers(membersData);
      
    } catch (error) {
      console.error('Error loading club members:', error);
      const apiError = handleApiError(error);
      Alert.alert('Error', `Failed to load members: ${apiError.message}`);
    }
  };

  const handleViewMembers = async (club: Club) => {
    setSelectedClub(club);
    setShowMembersModal(true);
    await loadClubMembers(club.id);
  };

  const toggleJoin = async (clubId: number) => {
    try {
      setJoining(clubId);
      setError(null);
      
      // Use ConnectionAPI method instead of direct axios call
      await ConnectionAPI.joinLeaveClub(clubId);

      // Update the club's joined status locally for immediate feedback
      setClubs(prevClubs => 
        prevClubs.map(club => 
          club.id === clubId 
            ? { 
                ...club, 
                joined: !club.joined,
                members_count: club.joined ? club.members_count - 1 : club.members_count + 1
              }
            : club
        )
      );
      
    } catch (error) {
      console.error('Error toggling club membership:', error);
      const apiError = handleApiError(error);
      
      Alert.alert(
        'Action Failed',
        apiError.message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => toggleJoin(clubId) }
        ]
      );
    } finally {
      setJoining(null);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadClubs(false);
  }, []);

  const filterAndSortClubs = useCallback(() => {
    let filtered = clubs.filter((club: Club) => {
      const matchesSearch = 
        club.name.toLowerCase().includes(query.toLowerCase()) ||
        club.description.toLowerCase().includes(query.toLowerCase()) ||
        club.category.toLowerCase().includes(query.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || club.category === selectedCategory;
      const matchesJoinedFilter = !showJoinedOnly || club.joined;
      
      return matchesSearch && matchesCategory && matchesJoinedFilter;
    });

    // Sort clubs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'members':
          return (b.members_count || 0) - (a.members_count || 0);
        case 'recent':
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredClubs(filtered);
  }, [clubs, query, selectedCategory, sortBy, showJoinedOnly]);

  useEffect(() => {
    loadClubs();
  }, []);

  useEffect(() => {
    filterAndSortClubs();
  }, [filterAndSortClubs]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Icon name="arrow-back" size={24} color="#2c3e50" />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Clubs</Text>
        <Text style={styles.headerSubtitle}>
          {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''} available
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => loadClubs(true)}
        activeOpacity={0.7}
      >
        <Icon name="refresh" size={24} color="#2c3e50" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
        <TextInput
          placeholder="Search clubs..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          placeholderTextColor="#bdc3c7"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            style={styles.clearButton}
          >
            <Icon name="close-circle" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, showJoinedOnly && styles.filterButtonActive]}
            onPress={() => setShowJoinedOnly(!showJoinedOnly)}
          >
            <Icon 
              name={showJoinedOnly ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={16} 
              color={showJoinedOnly ? "#fff" : "#667eea"} 
            />
            <Text style={[styles.filterButtonText, showJoinedOnly && styles.filterButtonTextActive]}>
              My Clubs
            </Text>
          </TouchableOpacity>
          
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
              onPress={() => setSortBy('name')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
                Name
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'members' && styles.sortButtonActive]}
              onPress={() => setSortBy('members')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'members' && styles.sortButtonTextActive]}>
                Members
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <FlatList
          data={categories}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === item && styles.categoryChipTextActive
              ]}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="people-outline" size={64} color="#bdc3c7" />
      <Text style={styles.emptyTitle}>
        {query || selectedCategory !== 'all' || showJoinedOnly
          ? 'No clubs found'
          : 'No clubs available'
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {query || selectedCategory !== 'all' || showJoinedOnly
          ? 'Try adjusting your search or filters'
          : 'Check back later for new clubs'
        }
      </Text>
      {(query || selectedCategory !== 'all' || showJoinedOnly) && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => {
            setQuery('');
            setSelectedCategory('all');
            setShowJoinedOnly(false);
          }}
        >
          <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Icon 
        name={error?.code === 'NETWORK_ERROR' ? "wifi-outline" : "alert-circle-outline"} 
        size={64} 
        color="#e74c3c" 
      />
      <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
      <Text style={styles.errorMessage}>{error?.message}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => loadClubs(true)}
      >
        <Icon name="refresh" size={20} color="#fff" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMembersModal = () => (
    <Modal
      visible={showMembersModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowMembersModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowMembersModal(false)}
            style={styles.modalCloseButton}
          >
            <Icon name="close" size={24} color="#2c3e50" />
          </TouchableOpacity>
          
          <View style={styles.modalHeaderContent}>
            <Text style={styles.modalTitle}>{selectedClub?.name}</Text>
            <Text style={styles.modalSubtitle}>
              {clubMembers.length} member{clubMembers.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <View style={styles.modalPlaceholder} />
        </View>
        
        <ScrollView style={styles.modalContent}>
          {clubMembers.length === 0 ? (
            <View style={styles.emptyMembersContainer}>
              <Icon name="people-outline" size={64} color="#bdc3c7" />
              <Text style={styles.emptyMembersTitle}>No members yet</Text>
              <Text style={styles.emptyMembersSubtitle}>
                Be the first to join this club!
              </Text>
            </View>
          ) : (
            clubMembers.map((member, index) => (
              <View key={member.id || index} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  {member.profile_picture ? (
                    <Image 
                      source={{ uri: ConnectionAPI.getUserProfilePicture(member) || 'https://via.placeholder.com/50x50.png?text=U' }} 
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {member.first_name?.[0] || member.username?.[0] || '?'}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.first_name && member.last_name 
                      ? `${member.first_name} ${member.last_name}`
                      : member.username || 'Unknown User'
                    }
                  </Text>
                  <Text style={styles.memberUsername}>@{member.username}</Text>
                  {member.email && (
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  )}
                </View>
                
                <TouchableOpacity style={styles.memberActionButton}>
                  <Icon name="chatbubble-outline" size={20} color="#667eea" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#667eea" />
      <Text style={styles.loadingText}>Loading clubs...</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
        {renderHeader()}
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
        {renderHeader()}
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
      {renderHeader()}
      
      <FlatList
        data={filteredClubs}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderSearchAndFilters}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => (
          <ClubCard
            name={item.name}
            description={item.description}
            category={item.category}
            joined={item.joined}
            memberCount={item.members_count}
            onToggleJoin={() => toggleJoin(item.id)}
            onViewMembers={() => handleViewMembers(item)}
            loading={joining === item.id}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
      {renderMembersModal()}
    </SafeAreaView>
  );
};

// Add your existing styles here - I notice they weren't included in the original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6ed',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6ed',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#2c3e50',
  },
  clearButton: {
    padding: 5,
  },
  filtersContainer: {
    gap: 15,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#667eea',
    gap: 5,
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f8f9ff',
  },
  sortButtonActive: {
    backgroundColor: '#667eea',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  categoriesList: {
    marginHorizontal: -5,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  categoryChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  separator: {
    height: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 40,
  },
  clearFiltersButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#667eea',
    borderRadius: 20,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    marginTop: 15,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7f8c8d',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6ed',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalHeaderContent: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  emptyMembersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyMembersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 15,
  },
  emptyMembersSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 5,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    gap: 15,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  memberUsername: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 1,
  },
  memberActionButton: {
    padding: 10,
  },
});

export default ClubsScreen;


















































// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   FlatList,
//   TextInput,
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   TouchableOpacity,
//   RefreshControl,
//   Dimensions,
//   StatusBar,
//   SafeAreaView,
//   Platform,
//   Modal,
//   ScrollView,
//   Image,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import ClubCard from '../../components/ClubCard';
// import { useRouter} from 'expo-router';

// const { width } = Dimensions.get('window');

// interface Club {
//   id: number;
//   name: string;
//   description: string;
//   category: string;
//   joined: boolean;
//   members_count: number;
//   createdAt?: string;
// }

// interface ApiError {
//   message: string;
//   status?: number;
//   code?: string;
// }

// interface Member {
//   id: number;
//   username: string;
//   first_name?: string;
//   last_name?: string;
//   email?: string;
//   profile_picture?: string;
// }

// const ClubsScreen = () => {
//   const navigation = useNavigation();
//   const [clubs, setClubs] = useState<Club[]>([]);
//   const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
//   const [query, setQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState<string>('all');
//   const [error, setError] = useState<ApiError | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [joining, setJoining] = useState<number | null>(null);
//   const [categories, setCategories] = useState<string[]>(['all']);
//   const [sortBy, setSortBy] = useState<'name' | 'members' | 'recent'>('name');
//   const [showJoinedOnly, setShowJoinedOnly] = useState(false);
//   const [selectedClub, setSelectedClub] = useState<Club | null>(null);
//   const [showMembersModal, setShowMembersModal] = useState(false);
//   const [clubMembers, setClubMembers] = useState<Member[]>([]);

//   const router = useRouter();

//   const getAuthToken = async (): Promise<string | null> => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   const handleApiError = (error: any): ApiError => {
//     if (axios.isAxiosError(error)) {
//       if (error.response?.status === 401) {
//         return {
//           message: 'Your session has expired. Please log in again.',
//           status: 401,
//           code: 'UNAUTHORIZED'
//         };
//       } else if (error.response?.status === 403) {
//         return {
//           message: 'You don\'t have permission to access this resource.',
//           status: 403,
//           code: 'FORBIDDEN'
//         };
//       } else if (error.response?.status === 404) {
//         return {
//           message: 'The requested resource was not found.',
//           status: 404,
//           code: 'NOT_FOUND'
//         };
//       } else if (error.response?.status >= 500) {
//         return {
//           message: 'Server is temporarily unavailable. Please try again later.',
//           status: error.response.status,
//           code: 'SERVER_ERROR'
//         };
//       } else if (error.code === 'ECONNABORTED') {
//         return {
//           message: 'Request timed out. Please check your internet connection.',
//           code: 'TIMEOUT'
//         };
//       } else if (error.request) {
//         return {
//           message: 'Unable to connect to server. Please check your internet connection.',
//           code: 'NETWORK_ERROR'
//         };
//       } else if (error.response) {
//         return {
//           message: error.response.data?.message || `Request failed with status ${error.response.status}`,
//           status: error.response.status,
//           code: 'API_ERROR'
//         };
//       }
//     }
    
//     return {
//       message: 'An unexpected error occurred. Please try again.',
//       code: 'UNKNOWN_ERROR'
//     };
//   };

//   const loadClubs = async (showLoading = true) => {
//     try {
//       if (showLoading) {
//         setLoading(true);
//       }
//       setError(null);
      
//       const token = await getAuthToken();
      
//       if (!token) {
//         setError({
//           message: 'Authentication required. Please log in to continue.',
//           code: 'NO_TOKEN'
//         });
//         return;
//       }
      
//       // const response = await axios.get('http://127.0.0.1:8000/api/clubs/', {
//       // const response = await axios.get('http://192.168.220.16:8000/api/clubs/', {
//       const response = await axios.get('http://192.168.130.16:8000/api/clubs/', {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 15000
//       });

//       const clubsData = response.data;
//       setClubs(clubsData);
      
//       // Extract unique categories
//       const uniqueCategories = ['all', ...new Set(clubsData.map((club: Club) => club.category))];
//       setCategories(uniqueCategories);
      
//     } catch (error) {
//       console.error('Error loading clubs:', error);
//       const apiError = handleApiError(error);
//       setError(apiError);
      
//       // If unauthorized, clear token and redirect to login
//       if (apiError.status === 401) {
//         await AsyncStorage.removeItem('access_token');
//         // You might want to navigate to login screen here
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const loadClubMembers = async (clubId: number) => {
//     try {
//       setError(null);
      
//       const token = await getAuthToken();
      
//       if (!token) {
//         Alert.alert('Error', 'Authentication required to view members.');
//         return;
//       }
      
//       // const response = await axios.get(`http://127.0.0.1:8000/api/clubs/${clubId}/members/`, {
//       // const response = await axios.get(`http://192.168.220.16:8000/api/clubs/${clubId}/members/`, {
//       const response = await axios.get(`http://192.168.130.16:8000/api/clubs/${clubId}/members/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });

//       setClubMembers(response.data);
      
//     } catch (error) {
//       console.error('Error loading club members:', error);
//       const apiError = handleApiError(error);
//       Alert.alert('Error', `Failed to load members: ${apiError.message}`);
//     }
//   };

//   const handleViewMembers = async (club: Club) => {
//     setSelectedClub(club);
//     setShowMembersModal(true);
//     await loadClubMembers(club.id);
//   };

//   const toggleJoin = async (clubId: number) => {
//     try {
//       setJoining(clubId);
//       setError(null);
      
//       const token = await getAuthToken();
      
//       if (!token) {
//         Alert.alert(
//           'Authentication Required',
//           'Please log in to join clubs.',
//           [{ text: 'OK' }]
//         );
//         return;
//       }
      
//       // await axios.post(`http://127.0.0.1:8000/api/clubs/${clubId}/join_leave/`, {}, {
//       await axios.post(`http://192.168.130.16:8000/api/clubs/${clubId}/join_leave/`, {}, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });

//       // Update the club's joined status locally for immediate feedback
//       setClubs(prevClubs => 
//         prevClubs.map(club => 
//           club.id === clubId 
//             ? { 
//                 ...club, 
//                 joined: !club.joined,
//                 members_count: club.joined ? club.members_count - 1 : club.members_count + 1
//               }
//             : club
//         )
//       );
      
//     } catch (error) {
//       console.error('Error toggling club membership:', error);
//       const apiError = handleApiError(error);
      
//       Alert.alert(
//         'Action Failed',
//         apiError.message,
//         [
//           { text: 'Cancel', style: 'cancel' },
//           { text: 'Retry', onPress: () => toggleJoin(clubId) }
//         ]
//       );
//     } finally {
//       setJoining(null);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     loadClubs(false);
//   }, []);

//   const filterAndSortClubs = useCallback(() => {
//     let filtered = clubs.filter((club: Club) => {
//       const matchesSearch = 
//         club.name.toLowerCase().includes(query.toLowerCase()) ||
//         club.description.toLowerCase().includes(query.toLowerCase()) ||
//         club.category.toLowerCase().includes(query.toLowerCase());
      
//       const matchesCategory = selectedCategory === 'all' || club.category === selectedCategory;
//       const matchesJoinedFilter = !showJoinedOnly || club.joined;
      
//       return matchesSearch && matchesCategory && matchesJoinedFilter;
//     });

//     // Sort clubs
//     filtered.sort((a, b) => {
//       switch (sortBy) {
//         case 'members':
//           return (b.members_count || 0) - (a.members_count || 0);
//         case 'recent':
//           return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
//         case 'name':
//         default:
//           return a.name.localeCompare(b.name);
//       }
//     });

//     setFilteredClubs(filtered);
//   }, [clubs, query, selectedCategory, sortBy, showJoinedOnly]);

//   useEffect(() => {
//     loadClubs();
//   }, []);

//   useEffect(() => {
//     filterAndSortClubs();
//   }, [filterAndSortClubs]);

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <TouchableOpacity
//         style={styles.backButton}
//         onPress={() => router.back()}
//         activeOpacity={0.7}
//       >
//         <Icon name="arrow-back" size={24} color="#2c3e50" />
//       </TouchableOpacity>
      
//       <View style={styles.headerContent}>
//         <Text style={styles.headerTitle}>Clubs</Text>
//         <Text style={styles.headerSubtitle}>
//           {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''} available
//         </Text>
//       </View>
      
//       <TouchableOpacity
//         style={styles.refreshButton}
//         onPress={() => loadClubs(true)}
//         activeOpacity={0.7}
//       >
//         <Icon name="refresh" size={24} color="#2c3e50" />
//       </TouchableOpacity>
//     </View>
//   );

//   const renderSearchAndFilters = () => (
//     <View style={styles.searchSection}>
//       <View style={styles.searchContainer}>
//         <Icon name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
//         <TextInput
//           placeholder="Search clubs..."
//           value={query}
//           onChangeText={setQuery}
//           style={styles.searchInput}
//           placeholderTextColor="#bdc3c7"
//         />
//         {query.length > 0 && (
//           <TouchableOpacity
//             onPress={() => setQuery('')}
//             style={styles.clearButton}
//           >
//             <Icon name="close-circle" size={20} color="#7f8c8d" />
//           </TouchableOpacity>
//         )}
//       </View>
      
//       <View style={styles.filtersContainer}>
//         <View style={styles.filterRow}>
//           <TouchableOpacity
//             style={[styles.filterButton, showJoinedOnly && styles.filterButtonActive]}
//             onPress={() => setShowJoinedOnly(!showJoinedOnly)}
//           >
//             <Icon 
//               name={showJoinedOnly ? "checkmark-circle" : "checkmark-circle-outline"} 
//               size={16} 
//               color={showJoinedOnly ? "#fff" : "#667eea"} 
//             />
//             <Text style={[styles.filterButtonText, showJoinedOnly && styles.filterButtonTextActive]}>
//               My Clubs
//             </Text>
//           </TouchableOpacity>
          
//           <View style={styles.sortContainer}>
//             <Text style={styles.sortLabel}>Sort by:</Text>
//             <TouchableOpacity
//               style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
//               onPress={() => setSortBy('name')}
//             >
//               <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
//                 Name
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.sortButton, sortBy === 'members' && styles.sortButtonActive]}
//               onPress={() => setSortBy('members')}
//             >
//               <Text style={[styles.sortButtonText, sortBy === 'members' && styles.sortButtonTextActive]}>
//                 Members
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
        
//         <FlatList
//           data={categories}
//           keyExtractor={(item) => item}
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           style={styles.categoriesList}
//           renderItem={({ item }) => (
//             <TouchableOpacity
//               style={[
//                 styles.categoryChip,
//                 selectedCategory === item && styles.categoryChipActive
//               ]}
//               onPress={() => setSelectedCategory(item)}
//             >
//               <Text style={[
//                 styles.categoryChipText,
//                 selectedCategory === item && styles.categoryChipTextActive
//               ]}>
//                 {item.charAt(0).toUpperCase() + item.slice(1)}
//               </Text>
//             </TouchableOpacity>
//           )}
//         />
//       </View>
//     </View>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Icon name="people-outline" size={64} color="#bdc3c7" />
//       <Text style={styles.emptyTitle}>
//         {query || selectedCategory !== 'all' || showJoinedOnly
//           ? 'No clubs found'
//           : 'No clubs available'
//         }
//       </Text>
//       <Text style={styles.emptySubtitle}>
//         {query || selectedCategory !== 'all' || showJoinedOnly
//           ? 'Try adjusting your search or filters'
//           : 'Check back later for new clubs'
//         }
//       </Text>
//       {(query || selectedCategory !== 'all' || showJoinedOnly) && (
//         <TouchableOpacity
//           style={styles.clearFiltersButton}
//           onPress={() => {
//             setQuery('');
//             setSelectedCategory('all');
//             setShowJoinedOnly(false);
//           }}
//         >
//           <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <Icon 
//         name={error?.code === 'NETWORK_ERROR' ? "wifi-outline" : "alert-circle-outline"} 
//         size={64} 
//         color="#e74c3c" 
//       />
//       <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
//       <Text style={styles.errorMessage}>{error?.message}</Text>
//       <TouchableOpacity
//         style={styles.retryButton}
//         onPress={() => loadClubs(true)}
//       >
//         <Icon name="refresh" size={20} color="#fff" />
//         <Text style={styles.retryButtonText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderMembersModal = () => (
//     <Modal
//       visible={showMembersModal}
//       animationType="slide"
//       presentationStyle="pageSheet"
//       onRequestClose={() => setShowMembersModal(false)}
//     >
//       <SafeAreaView style={styles.modalContainer}>
//         <View style={styles.modalHeader}>
//           <TouchableOpacity
//             onPress={() => setShowMembersModal(false)}
//             style={styles.modalCloseButton}
//           >
//             <Icon name="close" size={24} color="#2c3e50" />
//           </TouchableOpacity>
          
//           <View style={styles.modalHeaderContent}>
//             <Text style={styles.modalTitle}>{selectedClub?.name}</Text>
//             <Text style={styles.modalSubtitle}>
//               {clubMembers.length} member{clubMembers.length !== 1 ? 's' : ''}
//             </Text>
//           </View>
          
//           <View style={styles.modalPlaceholder} />
//         </View>
        
//         <ScrollView style={styles.modalContent}>
//           {clubMembers.length === 0 ? (
//             <View style={styles.emptyMembersContainer}>
//               <Icon name="people-outline" size={64} color="#bdc3c7" />
//               <Text style={styles.emptyMembersTitle}>No members yet</Text>
//               <Text style={styles.emptyMembersSubtitle}>
//                 Be the first to join this club!
//               </Text>
//             </View>
//           ) : (
//             clubMembers.map((member, index) => (
//               <View key={member.id || index} style={styles.memberItem}>
//                 <View style={styles.memberAvatar}>
//                   {member.profile_picture ? (
//                     <Image 
//                       source={{ uri: member.profile_picture }} 
//                       style={styles.avatarImage}
//                     />
//                   ) : (
//                     <View style={styles.avatarPlaceholder}>
//                       <Text style={styles.avatarText}>
//                         {member.first_name?.[0] || member.username?.[0] || '?'}
//                       </Text>
//                     </View>
//                   )}
//                 </View>
                
//                 <View style={styles.memberInfo}>
//                   <Text style={styles.memberName}>
//                     {member.first_name && member.last_name 
//                       ? `${member.first_name} ${member.last_name}`
//                       : member.username || 'Unknown User'
//                     }
//                   </Text>
//                   <Text style={styles.memberUsername}>@{member.username}</Text>
//                   {member.email && (
//                     <Text style={styles.memberEmail}>{member.email}</Text>
//                   )}
//                 </View>
                
//                 <TouchableOpacity style={styles.memberActionButton}>
//                   <Icon name="chatbubble-outline" size={20} color="#667eea" />
//                 </TouchableOpacity>
//               </View>
//             ))
//           )}
//         </ScrollView>
//       </SafeAreaView>
//     </Modal>
//   );

//   const renderLoadingState = () => (
//     <View style={styles.loadingContainer}>
//       <ActivityIndicator size="large" color="#667eea" />
//       <Text style={styles.loadingText}>Loading clubs...</Text>
//     </View>
//   );

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
//         {renderHeader()}
//         {renderLoadingState()}
//       </SafeAreaView>
//     );
//   }

//   if (error) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
//         {renderHeader()}
//         {renderErrorState()}
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
//       {renderHeader()}
      
//       <FlatList
//         data={filteredClubs}
//         keyExtractor={(item) => item.id.toString()}
//         ListHeaderComponent={renderSearchAndFilters}
//         ListEmptyComponent={renderEmptyState}
//         renderItem={({ item }) => (
//           <ClubCard
//             name={item.name}
//             description={item.description}
//             category={item.category}
//             joined={item.joined}
//             memberCount={item.members_count}
//             onToggleJoin={() => toggleJoin(item.id)}
//             onViewMembers={() => handleViewMembers(item)}
//             loading={joining === item.id}
//           />
//         )}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#667eea']}
//             tintColor="#667eea"
//           />
//         }
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.listContainer}
//         ItemSeparatorComponent={() => <View style={styles.separator} />}
//       />
      
//       {renderMembersModal()}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9ff',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e8ed',
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
//   headerContent: {
//     flex: 1,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     marginTop: 2,
//   },
//   refreshButton: {
//     padding: 8,
//     marginLeft: 8,
//   },
//   searchSection: {
//     backgroundColor: '#fff',
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     marginBottom: 8,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f5f6fa',
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     marginBottom: 16,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#2c3e50',
//   },
//   clearButton: {
//     padding: 4,
//   },
//   filtersContainer: {
//     marginBottom: 16,
//   },
//   filterRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   filterButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#667eea',
//   },
//   filterButtonActive: {
//     backgroundColor: '#667eea',
//   },
//   filterButtonText: {
//     marginLeft: 6,
//     fontSize: 14,
//     color: '#667eea',
//     fontWeight: '500',
//   },
//   filterButtonTextActive: {
//     color: '#fff',
//   },
//   sortContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   sortLabel: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     marginRight: 8,
//   },
//   sortButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     marginLeft: 4,
//     backgroundColor: '#f5f6fa',
//   },
//   sortButtonActive: {
//     backgroundColor: '#667eea',
//   },
//   sortButtonText: {
//     fontSize: 12,
//     color: '#7f8c8d',
//     fontWeight: '500',
//   },
//   sortButtonTextActive: {
//     color: '#fff',
//   },
//   categoriesList: {
//     marginBottom: 8,
//   },
//   categoryChip: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 8,
//     backgroundColor: '#f5f6fa',
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: 'transparent',
//   },
//   categoryChipActive: {
//     backgroundColor: '#667eea',
//   },
//   categoryChipText: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     fontWeight: '500',
//   },
//   categoryChipTextActive: {
//     color: '#fff',
//   },
//   listContainer: {
//     paddingHorizontal: 16,
//     paddingBottom: 20,
//   },
//   separator: {
//     height: 12,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//     paddingHorizontal: 32,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginTop: 16,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtitle: {
//     fontSize: 16,
//     color: '#7f8c8d',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   clearFiltersButton: {
//     marginTop: 20,
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     backgroundColor: '#667eea',
//     borderRadius: 20,
//   },
//   clearFiltersButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//     paddingHorizontal: 32,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginTop: 16,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   errorMessage: {
//     fontSize: 16,
//     color: '#7f8c8d',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },
//   retryButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     backgroundColor: '#667eea',
//     borderRadius: 24,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#667eea',
//     fontWeight: '500',
//   },
//   // Modal Styles
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#f8f9ff',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e8ed',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   modalCloseButton: {
//     padding: 8,
//   },
//   modalHeaderContent: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   modalSubtitle: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     marginTop: 2,
//   },
//   modalPlaceholder: {
//     width: 40,
//   },
//   modalContent: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   emptyMembersContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 80,
//   },
//   emptyMembersTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyMembersSubtitle: {
//     fontSize: 16,
//     color: '#7f8c8d',
//     textAlign: 'center',
//   },
//   memberItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     marginVertical: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   memberAvatar: {
//     marginRight: 12,
//   },
//   avatarImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//   },
//   avatarPlaceholder: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#667eea',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   avatarText: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//     textTransform: 'uppercase',
//   },
//   memberInfo: {
//     flex: 1,
//   },
//   memberName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 2,
//   },
//   memberUsername: {
//     fontSize: 14,
//     color: '#667eea',
//     marginBottom: 2,
//   },
//   memberEmail: {
//     fontSize: 12,
//     color: '#7f8c8d',
//   },
//   memberActionButton: {
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: '#667eea' + '10',
//   },
// });

// export default ClubsScreen;






























































// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   FlatList,
//   TextInput,
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   TouchableOpacity,
//   RefreshControl,
//   Dimensions,
//   StatusBar,
//   SafeAreaView,
//   Platform,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import ClubCard from '../../components/ClubCard';

// const { width } = Dimensions.get('window');

// interface Club {
//   id: number;
//   name: string;
//   description: string;
//   category: string;
//   joined: boolean;
//   memberCount?: number;
//   createdAt?: string;
//   isActive?: boolean;
// }

// interface ApiError {
//   message: string;
//   status?: number;
//   code?: string;
// }

// const ClubsScreen = () => {
//   const navigation = useNavigation();
//   const [clubs, setClubs] = useState<Club[]>([]);
//   const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
//   const [query, setQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState<string>('all');
//   const [error, setError] = useState<ApiError | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [joining, setJoining] = useState<number | null>(null);
//   const [categories, setCategories] = useState<string[]>(['all']);
//   const [sortBy, setSortBy] = useState<'name' | 'members' | 'recent'>('name');
//   const [showJoinedOnly, setShowJoinedOnly] = useState(false);

//   const getAuthToken = async (): Promise<string | null> => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   const handleApiError = (error: any): ApiError => {
//     if (axios.isAxiosError(error)) {
//       if (error.response?.status === 401) {
//         return {
//           message: 'Your session has expired. Please log in again.',
//           status: 401,
//           code: 'UNAUTHORIZED'
//         };
//       } else if (error.response?.status === 403) {
//         return {
//           message: 'You don\'t have permission to access this resource.',
//           status: 403,
//           code: 'FORBIDDEN'
//         };
//       } else if (error.response?.status === 404) {
//         return {
//           message: 'The requested resource was not found.',
//           status: 404,
//           code: 'NOT_FOUND'
//         };
//       } else if (error.response?.status >= 500) {
//         return {
//           message: 'Server is temporarily unavailable. Please try again later.',
//           status: error.response.status,
//           code: 'SERVER_ERROR'
//         };
//       } else if (error.code === 'ECONNABORTED') {
//         return {
//           message: 'Request timed out. Please check your internet connection.',
//           code: 'TIMEOUT'
//         };
//       } else if (error.request) {
//         return {
//           message: 'Unable to connect to server. Please check your internet connection.',
//           code: 'NETWORK_ERROR'
//         };
//       } else if (error.response) {
//         return {
//           message: error.response.data?.message || `Request failed with status ${error.response.status}`,
//           status: error.response.status,
//           code: 'API_ERROR'
//         };
//       }
//     }
    
//     return {
//       message: 'An unexpected error occurred. Please try again.',
//       code: 'UNKNOWN_ERROR'
//     };
//   };

//   const loadClubs = async (showLoading = true) => {
//     try {
//       if (showLoading) {
//         setLoading(true);
//       }
//       setError(null);
      
//       const token = await getAuthToken();
      
//       if (!token) {
//         setError({
//           message: 'Authentication required. Please log in to continue.',
//           code: 'NO_TOKEN'
//         });
//         return;
//       }
      
//       const response = await axios.get('http://127.0.0.1:8000/api/clubs/', {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 15000
//       });

//       const clubsData = response.data;
//       setClubs(clubsData);
      
//       // Extract unique categories
//       const uniqueCategories = ['all', ...new Set(clubsData.map((club: Club) => club.category))];
//       setCategories(uniqueCategories);
      
//     } catch (error) {
//       console.error('Error loading clubs:', error);
//       const apiError = handleApiError(error);
//       setError(apiError);
      
//       // If unauthorized, clear token and redirect to login
//       if (apiError.status === 401) {
//         await AsyncStorage.removeItem('access_token');
//         // You might want to navigate to login screen here
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const toggleJoin = async (clubId: number) => {
//     try {
//       setJoining(clubId);
//       setError(null);
      
//       const token = await getAuthToken();
      
//       if (!token) {
//         Alert.alert(
//           'Authentication Required',
//           'Please log in to join clubs.',
//           [{ text: 'OK' }]
//         );
//         return;
//       }
      
//       await axios.post(`http://127.0.0.1:8000/api/clubs/${clubId}/join_leave/`, {}, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });

//       // Update the club's joined status locally for immediate feedback
//       setClubs(prevClubs => 
//         prevClubs.map(club => 
//           club.id === clubId 
//             ? { ...club, joined: !club.joined }
//             : club
//         )
//       );
      
//     } catch (error) {
//       console.error('Error toggling club membership:', error);
//       const apiError = handleApiError(error);
      
//       Alert.alert(
//         'Action Failed',
//         apiError.message,
//         [
//           { text: 'Cancel', style: 'cancel' },
//           { text: 'Retry', onPress: () => toggleJoin(clubId) }
//         ]
//       );
//     } finally {
//       setJoining(null);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     loadClubs(false);
//   }, []);

//   const filterAndSortClubs = useCallback(() => {
//     let filtered = clubs.filter((club: Club) => {
//       const matchesSearch = 
//         club.name.toLowerCase().includes(query.toLowerCase()) ||
//         club.description.toLowerCase().includes(query.toLowerCase()) ||
//         club.category.toLowerCase().includes(query.toLowerCase());
      
//       const matchesCategory = selectedCategory === 'all' || club.category === selectedCategory;
//       const matchesJoinedFilter = !showJoinedOnly || club.joined;
      
//       return matchesSearch && matchesCategory && matchesJoinedFilter;
//     });

//     // Sort clubs
//     filtered.sort((a, b) => {
//       switch (sortBy) {
//         case 'members':
//           return (b.memberCount || 0) - (a.memberCount || 0);
//         case 'recent':
//           return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
//         case 'name':
//         default:
//           return a.name.localeCompare(b.name);
//       }
//     });

//     setFilteredClubs(filtered);
//   }, [clubs, query, selectedCategory, sortBy, showJoinedOnly]);

//   useEffect(() => {
//     loadClubs();
//   }, []);

//   useEffect(() => {
//     filterAndSortClubs();
//   }, [filterAndSortClubs]);

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <TouchableOpacity
//         style={styles.backButton}
//         onPress={() => navigation.navigate('auth/dashboard' as never)}
//         activeOpacity={0.7}
//       >
//         <Icon name="arrow-back" size={24} color="#2c3e50" />
//       </TouchableOpacity>
      
//       <View style={styles.headerContent}>
//         <Text style={styles.headerTitle}>Clubs</Text>
//         <Text style={styles.headerSubtitle}>
//           {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''} available
//         </Text>
//       </View>
      
//       <TouchableOpacity
//         style={styles.refreshButton}
//         onPress={() => loadClubs(true)}
//         activeOpacity={0.7}
//       >
//         <Icon name="refresh" size={24} color="#2c3e50" />
//       </TouchableOpacity>
//     </View>
//   );

//   const renderSearchAndFilters = () => (
//     <View style={styles.searchSection}>
//       <View style={styles.searchContainer}>
//         <Icon name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
//         <TextInput
//           placeholder="Search clubs..."
//           value={query}
//           onChangeText={setQuery}
//           style={styles.searchInput}
//           placeholderTextColor="#bdc3c7"
//         />
//         {query.length > 0 && (
//           <TouchableOpacity
//             onPress={() => setQuery('')}
//             style={styles.clearButton}
//           >
//             <Icon name="close-circle" size={20} color="#7f8c8d" />
//           </TouchableOpacity>
//         )}
//       </View>
      
//       <View style={styles.filtersContainer}>
//         <View style={styles.filterRow}>
//           <TouchableOpacity
//             style={[styles.filterButton, showJoinedOnly && styles.filterButtonActive]}
//             onPress={() => setShowJoinedOnly(!showJoinedOnly)}
//           >
//             <Icon 
//               name={showJoinedOnly ? "checkmark-circle" : "checkmark-circle-outline"} 
//               size={16} 
//               color={showJoinedOnly ? "#fff" : "#667eea"} 
//             />
//             <Text style={[styles.filterButtonText, showJoinedOnly && styles.filterButtonTextActive]}>
//               My Clubs
//             </Text>
//           </TouchableOpacity>
          
//           <View style={styles.sortContainer}>
//             <Text style={styles.sortLabel}>Sort by:</Text>
//             <TouchableOpacity
//               style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
//               onPress={() => setSortBy('name')}
//             >
//               <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
//                 Name
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.sortButton, sortBy === 'members' && styles.sortButtonActive]}
//               onPress={() => setSortBy('members')}
//             >
//               <Text style={[styles.sortButtonText, sortBy === 'members' && styles.sortButtonTextActive]}>
//                 Members
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
        
//         <FlatList
//           data={categories}
//           keyExtractor={(item) => item}
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           style={styles.categoriesList}
//           renderItem={({ item }) => (
//             <TouchableOpacity
//               style={[
//                 styles.categoryChip,
//                 selectedCategory === item && styles.categoryChipActive
//               ]}
//               onPress={() => setSelectedCategory(item)}
//             >
//               <Text style={[
//                 styles.categoryChipText,
//                 selectedCategory === item && styles.categoryChipTextActive
//               ]}>
//                 {item.charAt(0).toUpperCase() + item.slice(1)}
//               </Text>
//             </TouchableOpacity>
//           )}
//         />
//       </View>
//     </View>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Icon name="people-outline" size={64} color="#bdc3c7" />
//       <Text style={styles.emptyTitle}>
//         {query || selectedCategory !== 'all' || showJoinedOnly
//           ? 'No clubs found'
//           : 'No clubs available'
//         }
//       </Text>
//       <Text style={styles.emptySubtitle}>
//         {query || selectedCategory !== 'all' || showJoinedOnly
//           ? 'Try adjusting your search or filters'
//           : 'Check back later for new clubs'
//         }
//       </Text>
//       {(query || selectedCategory !== 'all' || showJoinedOnly) && (
//         <TouchableOpacity
//           style={styles.clearFiltersButton}
//           onPress={() => {
//             setQuery('');
//             setSelectedCategory('all');
//             setShowJoinedOnly(false);
//           }}
//         >
//           <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   const renderErrorState = () => (
//     <View style={styles.errorContainer}>
//       <Icon 
//         name={error?.code === 'NETWORK_ERROR' ? "wifi-outline" : "alert-circle-outline"} 
//         size={64} 
//         color="#e74c3c" 
//       />
//       <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
//       <Text style={styles.errorMessage}>{error?.message}</Text>
//       <TouchableOpacity
//         style={styles.retryButton}
//         onPress={() => loadClubs(true)}
//       >
//         <Icon name="refresh" size={20} color="#fff" />
//         <Text style={styles.retryButtonText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderLoadingState = () => (
//     <View style={styles.loadingContainer}>
//       <ActivityIndicator size="large" color="#667eea" />
//       <Text style={styles.loadingText}>Loading clubs...</Text>
//     </View>
//   );

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
//         {renderHeader()}
//         {renderLoadingState()}
//       </SafeAreaView>
//     );
//   }

//   if (error) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
//         {renderHeader()}
//         {renderErrorState()}
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
//       {renderHeader()}
      
//       <FlatList
//         data={filteredClubs}
//         keyExtractor={(item) => item.id.toString()}
//         ListHeaderComponent={renderSearchAndFilters}
//         ListEmptyComponent={renderEmptyState}
//         renderItem={({ item }) => (
//           <ClubCard
//             name={item.name}
//             description={item.description}
//             category={item.category}
//             joined={item.joined}
//             memberCount={item.memberCount}
//             onToggleJoin={() => toggleJoin(item.id)}
//             loading={joining === item.id}
//           />
//         )}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#667eea']}
//             tintColor="#667eea"
//           />
//         }
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.listContainer}
//         ItemSeparatorComponent={() => <View style={styles.separator} />}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9ff',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e8ed',
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
//   headerContent: {
//     flex: 1,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     marginTop: 2,
//   },
//   refreshButton: {
//     padding: 8,
//     marginLeft: 8,
//   },
//   searchSection: {
//     backgroundColor: '#fff',
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     marginBottom: 8,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f5f6fa',
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     marginBottom: 16,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#2c3e50',
//   },
//   clearButton: {
//     padding: 4,
//   },
//   filtersContainer: {
//     marginBottom: 16,
//   },
//   filterRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   filterButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#667eea',
//   },
//   filterButtonActive: {
//     backgroundColor: '#667eea',
//   },
//   filterButtonText: {
//     marginLeft: 6,
//     fontSize: 14,
//     color: '#667eea',
//     fontWeight: '500',
//   },
//   filterButtonTextActive: {
//     color: '#fff',
//   },
//   sortContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   sortLabel: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     marginRight: 8,
//   },
//   sortButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     marginLeft: 4,
//     backgroundColor: '#f5f6fa',
//   },
//   sortButtonActive: {
//     backgroundColor: '#667eea',
//   },
//   sortButtonText: {
//     fontSize: 12,
//     color: '#7f8c8d',
//     fontWeight: '500',
//   },
//   sortButtonTextActive: {
//     color: '#fff',
//   },
//   categoriesList: {
//     marginBottom: 8,
//   },
//   categoryChip: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 8,
//     backgroundColor: '#f5f6fa',
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: 'transparent',
//   },
//   categoryChipActive: {
//     backgroundColor: '#667eea',
//   },
//   categoryChipText: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     fontWeight: '500',
//   },
//   categoryChipTextActive: {
//     color: '#fff',
//   },
//   listContainer: {
//     paddingHorizontal: 16,
//     paddingBottom: 20,
//   },
//   separator: {
//     height: 12,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//     paddingHorizontal: 32,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginTop: 16,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtitle: {
//     fontSize: 16,
//     color: '#7f8c8d',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   clearFiltersButton: {
//     marginTop: 20,
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     backgroundColor: '#667eea',
//     borderRadius: 20,
//   },
//   clearFiltersButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//     paddingHorizontal: 32,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginTop: 16,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   errorMessage: {
//     fontSize: 16,
//     color: '#7f8c8d',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 24,
//   },
//   retryButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     backgroundColor: '#667eea',
//     borderRadius: 24,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#667eea',
//     fontWeight: '500',
//   },
// });

// export default ClubsScreen;





































































// import React, { useEffect, useState } from 'react';
// import { 
//   FlatList, 
//   TextInput, 
//   View, 
//   Text, 
//   StyleSheet, 
//   ActivityIndicator, 
//   Alert 
// } from 'react-native';
// import ClubCard from '../../components/ClubCard';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// interface Club {
//   id: number;
//   name: string;
//   description: string;
//   category: string;
//   joined: boolean;
// }

// const ClubsScreen = () => {
//   const [clubs, setClubs] = useState<Club[]>([]);
//   const [query, setQuery] = useState('');
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [joining, setJoining] = useState<number | null>(null);

//   const getAuthToken = async (): Promise<string | null> => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   const loadClubs = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const token = await getAuthToken();
//       console.log('Token found:', token ? 'Yes' : 'No');
      
//       if (!token) {
//         setError('No authentication token found. Please log in again.');
//         return;
//       }
      
//       // Fixed: Changed https to http (unless you have SSL configured)
//       const response = await axios.get('http://127.0.0.1:8000/api/clubs/', {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });

//       setClubs(response.data);
//     } catch (error) {
//       console.error('Error loading clubs:', error);
      
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 401) {
//           setError('Authentication failed. Please log in again.');
//         } else if (error.code === 'ECONNABORTED') {
//           setError('Request timeout. Please check your connection.');
//         } else if (error.response) {
//           setError(`Server error: ${error.response.status}`);
//         } else if (error.request) {
//           setError('Network error. Please check your connection.');
//         } else {
//           setError('An unexpected error occurred.');
//         }
//       } else {
//         setError('An unexpected error occurred.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const toggleJoin = async (clubId: number) => {
//     try {
//       setJoining(clubId);
//       setError(null);
      
//       const token = await getAuthToken();
      
//       if (!token) {
//         setError('No authentication token found. Please log in again.');
//         return;
//       }
      
//       // Fixed: Changed GET to POST for join/leave action
//       await axios.post(`http://127.0.0.1:8000/api/clubs/${clubId}/join_leave/`, {}, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });

//       // Reload clubs to get updated join status
//       await loadClubs();
      
//     } catch (error) {
//       console.error('Error toggling club membership:', error);
      
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 401) {
//           Alert.alert('Error', 'Authentication failed. Please log in again.');
//         } else if (error.response?.status === 404) {
//           Alert.alert('Error', 'Club not found.');
//         } else if (error.code === 'ECONNABORTED') {
//           Alert.alert('Error', 'Request timeout. Please try again.');
//         } else {
//           Alert.alert('Error', 'Failed to update club membership. Please try again.');
//         }
//       } else {
//         Alert.alert('Error', 'An unexpected error occurred.');
//       }
//     } finally {
//       setJoining(null);
//     }
//   };

//   useEffect(() => {
//     loadClubs();
//   }, []);

//   const filteredClubs = clubs.filter((club: Club) =>
//     club.name.toLowerCase().includes(query.toLowerCase()) ||
//     club.description.toLowerCase().includes(query.toLowerCase()) ||
//     club.category.toLowerCase().includes(query.toLowerCase())
//   );

//   if (loading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading clubs...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <Text 
//           style={styles.retryText} 
//           onPress={loadClubs}
//         >
//           Tap to retry
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <TextInput
//         placeholder="Search clubs by name, description, or category"
//         value={query}
//         onChangeText={setQuery}
//         style={styles.searchInput}
//       />
      
//       {filteredClubs.length === 0 ? (
//         <View style={styles.centerContainer}>
//           <Text style={styles.emptyText}>
//             {query ? 'No clubs match your search' : 'No clubs available'}
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredClubs}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={({ item }) => (
//             <ClubCard
//               name={item.name}
//               description={item.description}
//               category={item.category}
//               joined={item.joined}
//               onToggleJoin={() => toggleJoin(item.id)}
//               loading={joining === item.id}
//             />
//           )}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.listContainer}
//         />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9ff',
//     padding: 16,
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   searchInput: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//     backgroundColor: '#fff',
//     fontSize: 16,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#667eea',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#e74c3c',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   retryText: {
//     fontSize: 16,
//     color: '#667eea',
//     textDecorationLine: 'underline',
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
// });

// export default ClubsScreen;











































// import React, { useEffect, useState } from 'react';
// import { FlatList, TextInput, View, Text } from 'react-native';
// import ClubCard from '../components/ClubCard';
// import { fetchWithAuth } from './api/campus';
// import { getClubs } from './api/campus';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const ClubsScreen = () => {
//   const [clubs, setClubs] = useState([]);
//   const [query, setQuery] = useState('');
//   const [error, setError] = useState(null);

//   const getAuthToken = async () => {
//       try {
//         return await AsyncStorage.getItem('access_token');
//       } catch (error) {
//         console.error('Error getting auth token:', error);
//         return null;
//       }
//   };

//   const loadClubs = async () => {
//     // const token = await AsyncStorage.getItem('access_token');
//     // const data = await getClubs(token!);
//     // const data = await fetchWithAuth(`/clubs/`, token!);

//     const token = await getAuthToken();
//     console.log('Token found:', token ? 'Yes' : 'No');
    
//     if (!token) {
//       setError('No authentication token found. Please log in again.');
//       return;
//     }
    
//     const res = await axios.get(`https://127.0.0.1:8000/api/clubs/`, {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//       timeout: 10000
//     });


//     setClubs(res.data);
//   };

//   const toggleJoin = async (clubId: number) => {
//     // const token = await AsyncStorage.getItem('access_token');
//     // await fetchWithAuth(`/clubs/${clubId}/join_leave/`, token!, { method: 'POST' });

//     const token = await getAuthToken();
//     console.log('Token found:', token ? 'Yes' : 'No');
    
//     if (!token) {
//       setError('No authentication token found. Please log in again.');
//       return;
//     }
    
//     const res = await axios.get(`https://127.0.0.1:8000/api/clubs/${clubId}/join_leave/`, {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//       // timeout: 10000
//     });

//     loadClubs();
//   };

//   useEffect(() => {
//     loadClubs();
//   }, []);

//   const filtered = clubs.filter((club: any) =>
//     club.name.toLowerCase().includes(query.toLowerCase())
//   );

//   return (
//     <View style={{ flex: 1, padding: 10 }}>
//       <TextInput
//         placeholder="Search clubs"
//         value={query}
//         onChangeText={setQuery}
//         style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
//       />
//       <FlatList
//         data={filtered}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={({ item }) => (
//           <ClubCard
//             name={item.name}
//             description={item.description}
//             category={item.category}
//             joined={item.joined}
//             onToggleJoin={() => toggleJoin(item.id)}
//           />
//         )}
//       />
//     </View>
//   );
// };

// export default ClubsScreen;
