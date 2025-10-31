

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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import EventCard from '../../components/EventCard';
import ConnectionAPI from '../api/connectionService';

const { width } = Dimensions.get('window');

interface Event {
  id: number;
  title: string;
  location: string;
  start_time: string;
  end_time: string;
  rsvped: boolean;
  description?: string;
  organizer?: string;
  category?: string;
  max_attendees?: number;
  current_attendees?: number;
}

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

const EventsScreen = () => {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'rsvped' | 'today'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'location'>('date');
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState<number | null>(null);

  const handleApiError = (error: any): ApiError => {
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
            message: 'Events not found.',
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

  const loadEvents = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const eventsData = await ConnectionAPI.getEvents();
      setEvents(eventsData);
      
    } catch (error) {
      // console.error('Error loading events:', error);
      const apiError = handleApiError(error);
      setError(apiError);
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleRSVP = async (eventId: number) => {
    try {
      setRsvpLoading(eventId);
      setError(null);

      await ConnectionAPI.rsvpEvent(eventId);

      // Update the event's RSVP status locally for immediate feedback
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                rsvped: !event.rsvped,
                current_attendees: event.rsvped 
                  ? (event.current_attendees || 1) - 1 
                  : (event.current_attendees || 0) + 1
              }
            : event
        )
      );
      
    } catch (error) {
      // console.error('Error toggling RSVP:', error);
      const apiError = handleApiError(error);
      
      Alert.alert(
        'RSVP Failed',
        apiError.message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => toggleRSVP(eventId) }
        ]
      );
    } finally {
      setRsvpLoading(null);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents(false);
  }, []);

  const filterAndSortEvents = useCallback(() => {
    let filtered = events.filter((event: Event) => {
      // Search filter
      const matchesSearch = 
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.location.toLowerCase().includes(query.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(query.toLowerCase())) ||
        (event.organizer && event.organizer.toLowerCase().includes(query.toLowerCase()));

      // Status filter
      const now = new Date();
      const eventDate = new Date(event.start_time);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let matchesFilter = true;
      switch (selectedFilter) {
        case 'upcoming':
          matchesFilter = eventDate > now;
          break;
        case 'rsvped':
          matchesFilter = event.rsvped;
          break;
        case 'today':
          matchesFilter = eventDate >= today && eventDate < tomorrow;
          break;
        case 'all':
        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    });

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'date':
        default:
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      }
    });

    setFilteredEvents(filtered);
  }, [events, query, selectedFilter, sortBy]);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterAndSortEvents();
  }, [filterAndSortEvents]);

  const getFilterCount = (filter: string) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filter) {
      case 'upcoming':
        return events.filter(event => new Date(event.start_time) > now).length;
      case 'rsvped':
        return events.filter(event => event.rsvped).length;
      case 'today':
        return events.filter(event => {
          const eventDate = new Date(event.start_time);
          return eventDate >= today && eventDate < tomorrow;
        }).length;
      case 'all':
      default:
        return events.length;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('auth/dashboard')}
        activeOpacity={0.7}
      >
        <Icon name="arrow-back" size={24} color="#2c3e50" />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Events</Text>
        <Text style={styles.headerSubtitle}>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => loadEvents(true)}
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
          placeholder="Search events..."
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
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {[
            { key: 'all', label: 'All', icon: 'calendar-outline' },
            { key: 'today', label: 'Today', icon: 'today-outline' },
            { key: 'upcoming', label: 'Upcoming', icon: 'time-outline' },
            { key: 'rsvped', label: 'My RSVPs', icon: 'checkmark-circle-outline' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                selectedFilter === filter.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Icon 
                name={filter.icon} 
                size={16} 
                color={selectedFilter === filter.key ? "#fff" : "#667eea"} 
              />
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter.key && styles.filterChipTextActive
              ]}>
                {filter.label} ({getFilterCount(filter.key)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort:</Text>
          {[
            { key: 'date', label: 'Date', icon: 'calendar' },
            { key: 'title', label: 'Title', icon: 'text' },
            { key: 'location', label: 'Location', icon: 'location' },
          ].map((sort) => (
            <TouchableOpacity
              key={sort.key}
              style={[
                styles.sortButton,
                sortBy === sort.key && styles.sortButtonActive
              ]}
              onPress={() => setSortBy(sort.key as any)}
            >
              <Icon 
                name={sort.icon} 
                size={14} 
                color={sortBy === sort.key ? "#fff" : "#667eea"} 
              />
              <Text style={[
                styles.sortButtonText,
                sortBy === sort.key && styles.sortButtonTextActive
              ]}>
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon 
        name={
          query || selectedFilter !== 'all' 
            ? "search-outline" 
            : selectedFilter === 'rsvped' 
            ? "calendar-outline" 
            : "calendar-clear-outline"
        } 
        size={64} 
        color="#bdc3c7" 
      />
      <Text style={styles.emptyTitle}>
        {query || selectedFilter !== 'all'
          ? 'No events found'
          : selectedFilter === 'rsvped'
          ? 'No RSVPs yet'
          : 'No events available'
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {query || selectedFilter !== 'all'
          ? 'Try adjusting your search or filters'
          : selectedFilter === 'rsvped'
          ? 'RSVP to events to see them here'
          : 'Check back later for new events'
        }
      </Text>
      {(query || selectedFilter !== 'all') && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => {
            setQuery('');
            setSelectedFilter('all');
          }}
        >
          <Icon name="refresh" size={16} color="#fff" />
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
        onPress={() => loadEvents(true)}
      >
        <Icon name="refresh" size={20} color="#fff" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#667eea" />
      <Text style={styles.loadingText}>Loading events...</Text>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Icon name="calendar-outline" size={20} color="#667eea" />
        <Text style={styles.statNumber}>{events.length}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statItem}>
        <Icon name="checkmark-circle-outline" size={20} color="#27ae60" />
        <Text style={styles.statNumber}>{events.filter(e => e.rsvped).length}</Text>
        <Text style={styles.statLabel}>RSVPed</Text>
      </View>
      <View style={styles.statItem}>
        <Icon name="time-outline" size={20} color="#f39c12" />
        <Text style={styles.statNumber}>
          {events.filter(e => new Date(e.start_time) > new Date()).length}
        </Text>
        <Text style={styles.statLabel}>Upcoming</Text>
      </View>
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
        data={filteredEvents}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            {renderSearchAndFilters()}
            {events.length > 0 && renderStats()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => (
          <EventCard
            title={item.title}
            location={item.location}
            start_time={item.start_time}
            end_time={item.end_time}
            rsvped={item.rsvped}
            onToggleRSVP={() => toggleRSVP(item.id)}
            loading={rsvpLoading === item.id}
            description={item.description}
            organizer={item.organizer}
            category={item.category}
            max_attendees={item.max_attendees}
            current_attendees={item.current_attendees}
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
    </SafeAreaView>
  );
};

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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9ff',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
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
    borderRadius: 20,
    backgroundColor: '#f8f9ff',
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e6ed',
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
  filterScroll: {
    marginHorizontal: -5,
  },
  filterScrollContent: {
    paddingHorizontal: 5,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#667eea',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterChipText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e6ed',
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#667eea',
    borderRadius: 25,
    gap: 8,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e74c3c',
    marginTop: 20,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 25,
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
    fontWeight: '500',
  },
});

export default EventsScreen;















































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
// import EventCard from '../../components/EventCard';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// interface Event {
//   id: number;
//   title: string;
//   location: string;
//   start_time: string;
//   end_time: string;
//   rsvped: boolean;
//   description?: string;
//   organizer?: string;
// }

// const EventsScreen = () => {
//   const [events, setEvents] = useState<Event[]>([]);
//   const [query, setQuery] = useState('');
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [rsvpLoading, setRsvpLoading] = useState<number | null>(null);

//   const getAuthToken = async (): Promise<string | null> => {
//     try {
//       return await AsyncStorage.getItem('access_token');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   const loadEvents = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const token = await getAuthToken();
//       console.log('Token found:', token ? 'Yes' : 'No');
      
//       if (!token) {
//         setError('No authentication token found. Please log in again.');
//         return;
//       }
      
//       // Fixed: Changed URL from /clubs/ to /events/ and https to http
//       // const response = await axios.get('http://127.0.0.1:8000/api/events/', {
//       // const response = await axios.get('http://10.22.3.34:8000/api/events/', {
//       // const response = await axios.get('http://192.168.220.16:8000/api/events/', {
//       const response = await axios.get('http://192.168.130.16:8000/api/events/', {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });

//       setEvents(response.data);
//     } catch (error) {
//       console.error('Error loading events:', error);
      
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

//   const toggleRSVP = async (eventId: number) => {
//     try {
//       setRsvpLoading(eventId);
//       setError(null);
      
//       const token = await getAuthToken();
//       console.log('Token found:', token ? 'Yes' : 'No');

//       if (!token) {
//         setError('No authentication token found. Please log in again.');
//         return;
//       }

//       // Fixed: Changed https to http
//       // await axios.post(`http://127.0.0.1:8000/api/events/${eventId}/rsvp/`, {}, {
//       // await axios.post(`http://10.22.3.34:8000/api/events/${eventId}/rsvp/`, {}, {
//       // await axios.post(`http://192.168.220.16:8000/api/events/${eventId}/rsvp/`, {}, {
//       await axios.post(`http://192.168.130.16:8000/api/events/${eventId}/rsvp/`, {}, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000
//       });

//       // Reload events to get updated RSVP status
//       await loadEvents();
      
//     } catch (error) {
//       console.error('Error toggling RSVP:', error);
      
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 401) {
//           Alert.alert('Error', 'Authentication failed. Please log in again.');
//         } else if (error.response?.status === 404) {
//           Alert.alert('Error', 'Event not found.');
//         } else if (error.code === 'ECONNABORTED') {
//           Alert.alert('Error', 'Request timeout. Please try again.');
//         } else if (error.response?.status === 400) {
//           Alert.alert('Error', 'Unable to update RSVP. Please try again.');
//         } else {
//           Alert.alert('Error', 'Failed to update RSVP. Please try again.');
//         }
//       } else {
//         Alert.alert('Error', 'An unexpected error occurred.');
//       }
//     } finally {
//       setRsvpLoading(null);
//     }
//   };

//   useEffect(() => {
//     loadEvents();
//   }, []);

//   const filteredEvents = events.filter((event: Event) =>
//     event.title.toLowerCase().includes(query.toLowerCase()) ||
//     event.location.toLowerCase().includes(query.toLowerCase()) ||
//     (event.description && event.description.toLowerCase().includes(query.toLowerCase()))
//   );

//   if (loading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading events...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.errorText}>{error}</Text>
//         <Text 
//           style={styles.retryText} 
//           onPress={loadEvents}
//         >
//           Tap to retry
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <TextInput
//         placeholder="Search events by title, location, or description"
//         value={query}
//         onChangeText={setQuery}
//         style={styles.searchInput}
//       />
      
//       {filteredEvents.length === 0 ? (
//         <View style={styles.centerContainer}>
//           <Text style={styles.emptyText}>
//             {query ? 'No events match your search' : 'No events available'}
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredEvents}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={({ item }) => (
//             <EventCard
//               title={item.title}
//               location={item.location}
//               start_time={item.start_time}
//               end_time={item.end_time}
//               rsvped={item.rsvped}
//               onToggleRSVP={() => toggleRSVP(item.id)}
//               loading={rsvpLoading === item.id}
//               description={item.description}
//               organizer={item.organizer}
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

// export default EventsScreen;




































// import React, { useEffect, useState } from 'react';
// import { FlatList, TextInput, View } from 'react-native';
// import EventCard from '../components/EventCard';
// import { fetchWithAuth } from './api/campus';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const EventsScreen = () => {
//   const [events, setEvents] = useState([]);
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



//   const loadEvents = async () => {
//     // const token = await AsyncStorage.getItem('access_token');
//     // const data = await fetchWithAuth(`/events/`, token!);

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

//     setEvents(res.data);
//   };

//   const toggleRSVP = async (eventId: number) => {
//     // const token = await AsyncStorage.getItem('access_token');
//     // await fetchWithAuth(`/events/${eventId}/rsvp/`, token!, { method: 'POST' });

//     const token = await getAuthToken();
//     console.log('Token found:', token ? 'Yes' : 'No');

//     const res = await axios.post(`https://127.0.0.1:8000/api/events/${eventId}/rsvp/`, {}, {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//       // timeout: 10000
//     });

//     loadEvents();
//   };

//   // useEffect(() => {
//   //   loadEvents();
//   // }, []);
//   //     },
//   //     // timeout: 10000
//   //   });

//   //   loadEvents();
//   // };

//   useEffect(() => {
//     loadEvents();
//   }, []);

//   const filtered = events.filter((event: any) =>
//     event.title.toLowerCase().includes(query.toLowerCase())
//   );

//   return (
//     <View style={{ flex: 1, padding: 10 }}>
//       <TextInput
//         placeholder="Search events"
//         value={query}
//         onChangeText={setQuery}
//         style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
//       />
//       <FlatList
//         data={filtered}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={({ item }) => (
//           <EventCard
//             title={item.title}
//             location={item.location}
//             start_time={item.start_time}
//             end_time={item.end_time}
//             rsvped={item.rsvped}
//             onToggleRSVP={() => toggleRSVP(item.id)}
//           />
//         )}
//       />
//     </View>
//   );
// };

// export default EventsScreen;







































// import React, { useEffect, useState } from 'react';
// import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_BASE = 'http://127.0.0.1:8000/api';

// const getAuthHeader = async () => {
//   const token = await AsyncStorage.getItem('accessToken');
//   return {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   };
// };

// const EventsClubsScreen = () => {
//   const [events, setEvents] = useState([]);
//   const [clubs, setClubs] = useState([]);
//   const [search, setSearch] = useState('');
//   const [filter, setFilter] = useState('All');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchData();
//   }, [filter]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const config = await getAuthHeader();
//       const [eventsRes, clubsRes] = await Promise.all([
//         axios.get(`${API_BASE}/events/`, config),
//         axios.get(`${API_BASE}/clubs/`, config),
//       ]);

//       setEvents(eventsRes.data);
//       setClubs(clubsRes.data);
//     } catch (error) {
//       console.error('Fetch error:', error.response?.data || error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const rsvpEvent = async (id: number) => {
//     try {
//       const config = await getAuthHeader();
//       await axios.post(`${API_BASE}/events/${id}/rsvp/`, {}, config);
//       alert('RSVP successful!');
//     } catch (error) {
//       alert('Failed to RSVP');
//       console.error(error.response?.data || error.message);
//     }
//   };

//   const joinClub = async (id: number) => {
//     try {
//       const config = await getAuthHeader();
//       await axios.post(`${API_BASE}/clubs/${id}/join/`, {}, config);
//       alert('Joined club!');
//     } catch (error) {
//       alert('Failed to join club');
//       console.error(error.response?.data || error.message);
//     }
//   };

//   const filteredEvents = events.filter(event =>
//     (filter === 'All' || event.category === filter) &&
//     event.title.toLowerCase().includes(search.toLowerCase())
//   );

//   const filteredClubs = clubs.filter(club =>
//     club.name.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.heading}>Events & Clubs</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Search events or clubs..."
//         value={search}
//         onChangeText={setSearch}
//       />

//       <View style={styles.filters}>
//         {['All', 'Tech', 'Academics', 'Fun'].map(cat => (
//           <TouchableOpacity key={cat} onPress={() => setFilter(cat)} style={[styles.filterButton, filter === cat && styles.active]}>
//             <Text style={filter === cat ? styles.activeText : styles.filterText}>{cat}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {loading ? (
//         <ActivityIndicator size="large" color="blue" />
//       ) : (
//         <FlatList
//           ListHeaderComponent={<Text style={styles.section}>Upcoming Events</Text>}
//           data={filteredEvents}
//           keyExtractor={item => `event-${item.id}`}
//           renderItem={({ item }) => (
//             <View style={styles.card}>
//               <Text style={styles.cardTitle}>{item.title}</Text>
//               <Text>{item.date}</Text>
//               <Text>{item.category}</Text>
//               <TouchableOpacity style={styles.button} onPress={() => rsvpEvent(item.id)}>
//                 <Text style={styles.buttonText}>RSVP</Text>
//               </TouchableOpacity>
//             </View>
//           )}
//           ListFooterComponent={
//             <>
//               <Text style={styles.section}>Student Clubs</Text>
//               {filteredClubs.map(club => (
//                 <View key={club.id} style={styles.card}>
//                   <Text style={styles.cardTitle}>{club.name}</Text>
//                   <Text>{club.description}</Text>
//                   <TouchableOpacity style={styles.button} onPress={() => joinClub(club.id)}>
//                     <Text style={styles.buttonText}>Join</Text>
//                   </TouchableOpacity>
//                 </View>
//               ))}
//             </>
//           }
//         />
//       )}
//     </View>
//   );
// };

// export default EventsClubsScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 12,
//     backgroundColor: '#fff',
//   },
//   heading: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginVertical: 10,
//   },
//   input: {
//     backgroundColor: '#eee',
//     padding: 10,
//     borderRadius: 8,
//     marginBottom: 10,
//   },
//   filters: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: 10,
//   },
//   filterButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     backgroundColor: '#ddd',
//   },
//   active: {
//     backgroundColor: '#007bff',
//   },
//   filterText: {
//     color: '#333',
//   },
//   activeText: {
//     color: '#fff',
//   },
//   section: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginTop: 20,
//     marginBottom: 8,
//   },
//   card: {
//     padding: 12,
//     borderRadius: 10,
//     backgroundColor: '#f9f9f9',
//     marginVertical: 6,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   button: {
//     marginTop: 8,
//     backgroundColor: '#007bff',
//     padding: 8,
//     borderRadius: 6,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//   },
// });
