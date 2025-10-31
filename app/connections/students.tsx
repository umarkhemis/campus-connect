

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ConnectionAPI from '../api/connectionService';

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [connectingIds, setConnectingIds] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    console.log(' useEffect triggered - students:', students.length, 'searchQuery:', searchQuery);
    filterStudents();
  }, [students, searchQuery]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ConnectionAPI.getStudents();
      
      console.log('API Response:', JSON.stringify(data, null, 2));
      console.log('Number of students:', data?.length);
      
      const studentsArray = Array.isArray(data) ? data : [];
      setStudents(studentsArray);
      
    } catch (error) {
      console.error(' Error loading students:', error);
      const errorMessage = error.message || 'Failed to load students';
      setError(errorMessage);
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const filterStudents = () => {
    console.log(' Filtering students...');
    console.log(' Search query:', searchQuery);
    console.log(' Total students:', students.length);
    
    if (!searchQuery.trim()) {
      console.log(' No search query, showing all students');
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
      if (!student.username) {
        console.log(' Student missing username:', student);
        return false;
      }
      return student.username.toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    console.log('Filtered students:', filtered.length);
    setFilteredStudents(filtered);
  };

  const sendConnectionRequest = async (receiverId) => {
    try {
      setConnectingIds(prev => new Set([...prev, receiverId]));
      await ConnectionAPI.sendConnectionRequest(receiverId);
      
      Alert.alert('Request Sent! ', 'Your connection request has been sent successfully.');
      loadStudents();
    } catch (error) {
      const errorMessage = error.message || 'Failed to send connection request';
      Alert.alert('Request Failed', errorMessage);
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(receiverId);
        return newSet;
      });
    }
  };

  const navigateToConnections = () => {
    navigation.navigate('connections/connection-screen');
  };

  const renderStudent = ({ item, index }) => {
    console.log(`👤 Rendering student ${index}:`, item.username);
    
    return (
      <View style={styles.studentCard}>
        <View style={styles.cardContent}>
          <View style={styles.studentInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ 
                  uri: item.profile_picture || 'https://via.placeholder.com/60' 
                }}
                style={styles.avatar}
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
              />
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.username}>@{item.username}</Text>
              {item.course && (
                <Text style={styles.courseText}>
                  {item.course} {item.year ? `• Year ${item.year}` : ''}
                </Text>
              )}
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Available</Text>
                </View>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.connectButton,
              connectingIds.has(item.id) && styles.connectButtonDisabled
            ]}
            onPress={() => sendConnectionRequest(item.id)}
            disabled={connectingIds.has(item.id)}
            activeOpacity={0.8}
          >
            {connectingIds.has(item.id) ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="person-add" size={16} color="white" />
                <Text style={styles.connectButtonText}>Connect</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students by username..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="people-outline" size={64} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>No students found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try a different search term' : 'Pull down to refresh and discover new connections'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadStudents}>
        <Ionicons name="refresh" size={18} color="white" />
        <Text style={styles.retryButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#667EEA" />
            <Text style={styles.loadingText}>Discovering students...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Discover</Text>
            <Text style={styles.headerSubtitle}>Connect with fellow students</Text>
          </View>
          <TouchableOpacity 
            style={styles.connectionsButton}
            onPress={navigateToConnections}
            activeOpacity={0.8}
          >
            <Ionicons name="people" size={20} color="#667EEA" />
            <Text style={styles.connectionsButtonText}>Connections</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {renderSearchBar()}
      
      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667EEA']}
            tintColor="#667EEA"
          />
        }
        ListEmptyComponent={renderEmptyState()}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: '30px'
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  connectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  connectionsButtonText: {
    color: '#667EEA',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 0,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardContent: {
    flexDirection: 'column',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  studentDetails: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  courseText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: '#667EEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    backgroundColor: '#F8FAFC',
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#667EEA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '500',
  },
});





















































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   TextInput,
//   RefreshControl,
//   Alert,
//   ActivityIndicator,
//   SafeAreaView,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import ConnectionAPI from '../api/connectionService';

// export default function DiscoverScreen() {
//   const [students, setStudents] = useState([]);
//   const [filteredStudents, setFilteredStudents] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [connectingIds, setConnectingIds] = useState(new Set());
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     loadStudents();
//   }, []);

//   useEffect(() => {
//     console.log(' useEffect triggered - students:', students.length, 'searchQuery:', searchQuery);
//     filterStudents();
//   }, [students, searchQuery]);

//   const loadStudents = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const data = await ConnectionAPI.getStudents();
      
//       console.log('API Response:', JSON.stringify(data, null, 2));
//       console.log('Number of students:', data?.length);
      
//       const studentsArray = Array.isArray(data) ? data : [];
//       setStudents(studentsArray);
      
//     } catch (error) {
//       console.error(' Error loading students:', error);
//       const errorMessage = error.message || 'Failed to load students';
//       setError(errorMessage);
//       Alert.alert('Connection Error', errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadStudents();
//     setRefreshing(false);
//   };

//   const filterStudents = () => {
//     console.log(' Filtering students...');
//     console.log(' Search query:', searchQuery);
//     console.log(' Total students:', students.length);
    
//     if (!searchQuery.trim()) {
//       console.log(' No search query, showing all students');
//       setFilteredStudents(students);
//       return;
//     }

//     const filtered = students.filter(student => {
//       if (!student.username) {
//         console.log('⚠️ Student missing username:', student);
//         return false;
//       }
//       return student.username.toLowerCase().includes(searchQuery.toLowerCase());
//     });
    
//     console.log('Filtered students:', filtered.length);
//     setFilteredStudents(filtered);
//   };

//   const sendConnectionRequest = async (receiverId) => {
//     try {
//       setConnectingIds(prev => new Set([...prev, receiverId]));
//       await ConnectionAPI.sendConnectionRequest(receiverId);
      
//       Alert.alert('Request Sent! ', 'Your connection request has been sent successfully.');
//       loadStudents();
//     } catch (error) {
//       const errorMessage = error.message || 'Failed to send connection request';
//       Alert.alert('Request Failed', errorMessage);
//     } finally {
//       setConnectingIds(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(receiverId);
//         return newSet;
//       });
//     }
//   };

//   // 🔧 SIMPLIFIED RENDER FUNCTION - No animations, basic styling
//   const renderStudent = ({ item, index }) => {
//     console.log(`👤 Rendering student ${index}:`, item.username);
    
//     return (
//       <View style={styles.studentCard}>
//         <View style={styles.cardContent}>
//           <View style={styles.studentInfo}>
//             <Image
//               source={{ 
//                 uri: item.profile_picture || 'https://via.placeholder.com/60' 
//               }}
//               style={styles.avatar}
//               onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
//             />
//             <View style={styles.studentDetails}>
//               <Text style={styles.username}>@{item.username}</Text>
//               {item.course && (
//                 <Text style={styles.courseText}>
//                   {item.course} {item.year ? `- Year ${item.year}` : ''}
//                 </Text>
//               )}
//             </View>
//           </View>
          
//           <TouchableOpacity
//             style={[
//               styles.connectButton,
//               connectingIds.has(item.id) && styles.connectButtonDisabled
//             ]}
//             onPress={() => sendConnectionRequest(item.id)}
//             disabled={connectingIds.has(item.id)}
//           >
//             {connectingIds.has(item.id) ? (
//               <ActivityIndicator size="small" color="white" />
//             ) : (
//               <Text style={styles.connectButtonText}>Connect</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   const renderDebugInfo = () => (
//     <View style={styles.debugContainer}>
//       <Text style={styles.debugTitle}>🔍 DEBUG INFO</Text>
//       <Text style={styles.debugText}>Students: {students.length}</Text>
//       <Text style={styles.debugText}>Filtered: {filteredStudents.length}</Text>
//       <Text style={styles.debugText}>Loading: {loading.toString()}</Text>
//       <Text style={styles.debugText}>Error: {error || 'None'}</Text>
//     </View>
//   );

//   const renderSearchBar = () => (
//     <View style={styles.searchContainer}>
//       <TextInput
//         style={styles.searchInput}
//         placeholder="Search by username..."
//         value={searchQuery}
//         onChangeText={setSearchQuery}
//       />
//     </View>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyTitle}>No students found</Text>
//       <TouchableOpacity style={styles.retryButton} onPress={loadStudents}>
//         <Text style={styles.retryButtonText}>Refresh</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   if (loading && !refreshing) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#3B82F6" />
//           <Text>Loading students...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Discover Students</Text>
//       </View>
      
//       {renderSearchBar()}
//       {renderDebugInfo()}
      
//       <FlatList
//         data={filteredStudents}
//         renderItem={renderStudent}
//         keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//         contentContainerStyle={styles.listContainer}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//           />
//         }
//         ListEmptyComponent={renderEmptyState()}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   header: {
//     padding: 20,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#111827',
//   },
//   searchContainer: {
//     padding: 20,
//     backgroundColor: '#FFFFFF',
//   },
//   searchInput: {
//     height: 40,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     fontSize: 16,
//   },
//   debugContainer: {
//     padding: 10,
//     backgroundColor: '#FFE4E1',
//     margin: 10,
//     borderRadius: 8,
//   },
//   debugTitle: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   debugText: {
//     fontSize: 12,
//     marginVertical: 2,
//   },
//   listContainer: {
//     padding: 20,
//   },
//   studentCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     marginVertical: 8,
//     padding: 16,
//     // Remove shadows for web compatibility
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   cardContent: {
//     // Remove flex for potential web issues
//   },
//   studentInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#E5E7EB',
//     marginRight: 12,
//   },
//   studentDetails: {
//     flex: 1,
//   },
//   username: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//     marginBottom: 4,
//   },
//   courseText: {
//     fontSize: 14,
//     color: '#6B7280',
//   },
//   connectButton: {
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 6,
//     alignItems: 'center',
//     justifyContent: 'center',
//     minHeight: 36,
//   },
//   connectButtonDisabled: {
//     backgroundColor: '#9CA3AF',
//   },
//   connectButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 60,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#374151',
//     marginBottom: 16,
//   },
//   retryButton: {
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   loadingContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });













































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   TextInput,
//   RefreshControl,
//   Alert,
//   ActivityIndicator,
//   StatusBar,
//   Animated,
//   Dimensions,
//   SafeAreaView,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import ConnectionAPI from '../api/connectionService';

// const { width } = Dimensions.get('window');

// export default function DiscoverScreen() {
//   const [students, setStudents] = useState([]);
//   const [filteredStudents, setFilteredStudents] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [connectingIds, setConnectingIds] = useState(new Set());
//   const [error, setError] = useState(null);
//   const fadeAnim = new Animated.Value(0);

//   useEffect(() => {
//     loadStudents();
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 500,
//       useNativeDriver: true,
//     }).start();
//   }, []);

//   // 🔧 FIX: Filter students whenever students array OR searchQuery changes
//   useEffect(() => {
//     console.log('🔍 useEffect triggered - students:', students.length, 'searchQuery:', searchQuery);
//     filterStudents();
//   }, [students, searchQuery]); // Make sure students comes first

//   const loadStudents = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const data = await ConnectionAPI.getStudents();
      
//       console.log('📊 API Response:', JSON.stringify(data, null, 2));
//       console.log('📈 Number of students:', data?.length);
      
//       // 🔧 FIX: Make sure we have a valid array
//       const studentsArray = Array.isArray(data) ? data : [];
//       setStudents(studentsArray);
      
//     } catch (error) {
//       console.error('❌ Error loading students:', error);
//       const errorMessage = error.message || 'Failed to load students';
//       setError(errorMessage);
//       Alert.alert(
//         'Connection Error',
//         errorMessage,
//         [
//           { text: 'Retry', onPress: loadStudents },
//           { text: 'Cancel', style: 'cancel' }
//         ]
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadStudents();
//     setRefreshing(false);
//   };

//   const filterStudents = () => {
//     console.log('🔍 Filtering students...');
//     console.log('📝 Search query:', searchQuery);
//     console.log('👥 Total students:', students.length);
    
//     if (!searchQuery.trim()) {
//       console.log('✅ No search query, showing all students');
//       setFilteredStudents(students);
//       return;
//     }

//     const filtered = students.filter(student => {
//       if (!student.username) {
//         console.log('⚠️ Student missing username:', student);
//         return false;
//       }
//       return student.username.toLowerCase().includes(searchQuery.toLowerCase());
//     });
    
//     console.log('🎯 Filtered students:', filtered.length);
//     setFilteredStudents(filtered);
//   };

//   const sendConnectionRequest = async (receiverId) => {
//     try {
//       setConnectingIds(prev => new Set([...prev, receiverId]));
//       await ConnectionAPI.sendConnectionRequest(receiverId);
      
//       Alert.alert(
//         'Request Sent! 🎉',
//         'Your connection request has been sent successfully.',
//         [{ text: 'Great!', style: 'default' }]
//       );
      
//       loadStudents();
//     } catch (error) {
//       const errorMessage = error.message || 'Failed to send connection request';
//       Alert.alert(
//         'Request Failed',
//         errorMessage,
//         [
//           { text: 'Try Again', onPress: () => sendConnectionRequest(receiverId) },
//           { text: 'Cancel', style: 'cancel' }
//         ]
//       );
//     } finally {
//       setConnectingIds(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(receiverId);
//         return newSet;
//       });
//     }
//   };

//   const renderStudent = ({ item, index }) => {
//     console.log(`👤 Rendering student ${index}:`, item.username);
    
//     return (
//       <Animated.View
//         style={[
//           styles.studentCard,
//           {
//             opacity: fadeAnim,
//             transform: [{
//               translateY: fadeAnim.interpolate({
//                 inputRange: [0, 1],
//                 outputRange: [30, 0],
//               }),
//             }],
//           }
//         ]}
//       >
//         <View style={styles.cardContent}>
//           <View style={styles.studentInfo}>
//             <View style={styles.avatarContainer}>
//               <Image
//                 source={{ 
//                   uri: item.profile_picture || 'https://via.placeholder.com/60' 
//                 }}
//                 style={styles.avatar}
//                 onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
//               />
//               <View style={styles.onlineIndicator} />
//             </View>
//             <View style={styles.studentDetails}>
//               <Text style={styles.username}>@{item.username}</Text>
//               {item.course && (
//                 <Text style={styles.bio}>
//                   {item.course} {item.year ? `- Year ${item.year}` : ''}
//                 </Text>
//               )}
//               <View style={styles.statsContainer}>
//                 <View style={styles.statItem}>
//                   <Ionicons name="people" size={12} color="#666" />
//                   <Text style={styles.statText}>120 connections</Text>
//                 </View>
//               </View>
//             </View>
//           </View>
          
//           <TouchableOpacity
//             style={[
//               styles.connectButton,
//               connectingIds.has(item.id) && styles.connectButtonDisabled
//             ]}
//             onPress={() => sendConnectionRequest(item.id)}
//             disabled={connectingIds.has(item.id)}
//             activeOpacity={0.8}
//           >
//             {connectingIds.has(item.id) ? (
//               <ActivityIndicator size="small" color="white" />
//             ) : (
//               <>
//                 <Ionicons name="person-add" size={18} color="white" />
//                 <Text style={styles.connectButtonText}>Connect</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>
//       </Animated.View>
//     );
//   };

//   const renderHeader = () => (
//     <View style={styles.headerContainer}>
//       <Text style={styles.headerTitle}>Discover Students</Text>
//       <Text style={styles.headerSubtitle}>
//         Connect with fellow students and expand your network
//       </Text>
//     </View>
//   );

//   const renderEmptyState = () => (
//     <View style={styles.emptyContainer}>
//       <View style={styles.emptyIconContainer}>
//         <Ionicons name="people" size={80} color="#E5E7EB" />
//       </View>
//       <Text style={styles.emptyTitle}>
//         {searchQuery ? 'No students found' : 'No students available'}
//       </Text>
//       <Text style={styles.emptySubtitle}>
//         {searchQuery 
//           ? 'Try adjusting your search terms' 
//           : 'Check back later for new students to connect with'
//         }
//       </Text>
//       {!searchQuery && (
//         <TouchableOpacity style={styles.retryButton} onPress={loadStudents}>
//           <Text style={styles.retryButtonText}>Refresh</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   const renderSearchBar = () => (
//     <View style={styles.searchContainer}>
//       <View style={styles.searchInputContainer}>
//         <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search by username..."
//           placeholderTextColor="#9CA3AF"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           returnKeyType="search"
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity
//             onPress={() => setSearchQuery('')}
//             style={styles.clearButton}
//           >
//             <Ionicons name="close-circle" size={20} color="#9CA3AF" />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );

//   const renderLoadingState = () => (
//     <View style={styles.loadingContainer}>
//       <ActivityIndicator size="large" color="#3B82F6" />
//       <Text style={styles.loadingText}>Loading students...</Text>
//     </View>
//   );

//   // 🔧 DEBUG: Add debug info temporarily
//   const renderDebugInfo = () => (
//     <View style={{padding: 10, backgroundColor: '#FFE4E1', margin: 10}}>
//       <Text style={{fontSize: 14, fontWeight: 'bold'}}>🔍 DEBUG INFO</Text>
//       <Text>Students: {students.length}</Text>
//       <Text>Filtered: {filteredStudents.length}</Text>
//       <Text>Loading: {loading.toString()}</Text>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
//       {renderHeader()}
//       {renderSearchBar()}
//       {renderDebugInfo()}
      
//       {loading && !refreshing ? (
//         renderLoadingState()
//       ) : (
//         <FlatList
//           data={filteredStudents}
//           renderItem={renderStudent}
//           keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.listContainer}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={['#3B82F6']}
//               tintColor="#3B82F6"
//             />
//           }
//           ListEmptyComponent={renderEmptyState()}
//           ItemSeparatorComponent={() => <View style={styles.separator} />}
//         />
//       )}
//     </SafeAreaView>
//   );


// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   headerContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#111827',
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: '#6B7280',
//     fontWeight: '400',
//   },
//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#FFFFFF',
//   },
//   searchInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F3F4F6',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     height: 48,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   searchIcon: {
//     marginRight: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     color: '#111827',
//     fontWeight: '400',
//   },
//   clearButton: {
//     padding: 4,
//   },
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 12,
//     paddingBottom: 20,
//   },
//   studentCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 4,
//     marginVertical: 6,
//   },
//   cardContent: {
//     padding: 20,
//   },
//   studentInfo: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginRight: 16,
//   },
//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#E5E7EB',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 2,
//     right: 2,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#10B981',
//     borderWidth: 2,
//     borderColor: '#FFFFFF',
//   },
//   studentDetails: {
//     flex: 1,
//   },
//   username: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#111827',
//     marginBottom: 4,
//   },
//   bio: {
//     fontSize: 14,
//     color: '#6B7280',
//     lineHeight: 20,
//     marginBottom: 8,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//   },
//   statItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 16,
//   },
//   statText: {
//     fontSize: 12,
//     color: '#6B7280',
//     marginLeft: 4,
//     fontWeight: '500',
//   },
//   connectButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//     minHeight: 40,
//   },
//   connectButtonDisabled: {
//     backgroundColor: '#9CA3AF',
//   },
//   connectButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 6,
//   },
//   separator: {
//     height: 8,
//   },
//   emptyContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 80,
//     paddingHorizontal: 40,
//   },
//   emptyIconContainer: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: '#F3F4F6',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 24,
//   },
//   emptyTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#374151',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtitle: {
//     fontSize: 16,
//     color: '#6B7280',
//     textAlign: 'center',
//     lineHeight: 24,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   loadingContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 80,
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#6B7280',
//     marginTop: 16,
//     fontWeight: '500',
//   },
// });



















































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   TextInput,
//   RefreshControl,
//   Alert,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import ConnectionAPI from '../api/connectionService'; // Adjust the import path as necessary

// export default function DiscoverScreen() {
//   const [students, setStudents] = useState([]);
//   const [filteredStudents, setFilteredStudents] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   useEffect(() => {
//     loadStudents();
//   }, []);

//   useEffect(() => {
//     filterStudents();
//   }, [searchQuery, students]);

//   const loadStudents = async () => {
//     try {
//       setLoading(true);
//       const data = await ConnectionAPI.getStudents();
//       setStudents(data);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to load students');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadStudents();
//     setRefreshing(false);
//   };

//   const filterStudents = () => {
//     if (!searchQuery.trim()) {
//       setFilteredStudents(students);
//       return;
//     }

//     const filtered = students.filter(student =>
//       student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     //   student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     //   student.last_name.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//     setFilteredStudents(filtered);
//   };

//   const sendConnectionRequest = async (receiverId) => {
//     try {
//       await ConnectionAPI.sendConnectionRequest(receiverId);
//       Alert.alert('Success', 'Connection request sent!');
//       loadStudents(); // Refresh to remove the user from the list
//     } catch (error) {
//       Alert.alert('Error', 'Failed to send connection request');
//     }
//   };

//   const renderStudent = ({ item }) => (
//     <View style={styles.studentCard}>
//       <View style={styles.studentInfo}>
//         <Image
//           source={{ uri: item.avatar || 'https://via.placeholder.com/50' }}
//           style={styles.avatar}
//         />
//         <View style={styles.studentDetails}>
//           {/* <Text style={styles.studentName}>
//             {item.first_name} {item.last_name}
//           </Text> */}
//           <Text style={styles.username}>@{item.username}</Text>
//           {item.user && (
//             <Text style={styles.bio} numberOfLines={2}>
//               {item.user.bio}
//             </Text>
//           )}
//         </View>
//       </View>
//       <TouchableOpacity
//         style={styles.connectButton}
//         onPress={() => sendConnectionRequest(item.id)}
//       >
//         <Ionicons name="person-add" size={20} color="white" />
//         <Text style={styles.connectButtonText}>Connect</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Discover Students</Text>
//       </View>
      
//       <View style={styles.searchContainer}>
//         <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search students..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//       </View>

//       <FlatList
//         data={filteredStudents}
//         renderItem={renderStudent}
//         keyExtractor={(item) => item.id.toString()}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons name="people" size={64} color="#ccc" />
//             <Text style={styles.emptyText}>No students found</Text>
//           </View>
//         }
//       />
//     </View>
//   );
// }














































// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   FlatList,
//   Text,
//   StyleSheet,
//   RefreshControl,
//   TextInput,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import StudentCard from '../../components/student-card';
// import connectionService from '../api/connectionService';

// const StudentsScreen = () => {
//   const [students, setStudents] = useState([]);
//   const [filteredStudents, setFilteredStudents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');

//   const fetchStudents = async () => {
//     try {
//       setLoading(true);
//       const data = await connectionService.getStudents();
//       setStudents(data);
//       setFilteredStudents(data);
//     } catch (error) {
//       console.error('Error fetching students:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = (query) => {
//     setSearchQuery(query);
//     if (query.trim() === '') {
//       setFilteredStudents(students);
//     } else {
//       const filtered = students.filter((student) =>
//         `${student.user.first_name} ${student.user.last_name}`
//           .toLowerCase()
//           .includes(query.toLowerCase()) ||
//         student.user.username.toLowerCase().includes(query.toLowerCase()) ||
//         (student.course && student.course.toLowerCase().includes(query.toLowerCase()))
//       );
//       setFilteredStudents(filtered);
//     }
//   };

//   useEffect(() => {
//     fetchStudents();
//   }, []);

//   const renderStudent = ({ item }) => (
//     <StudentCard
//       student={item}
//       onConnect={fetchStudents}
//       showConnectButton={true}
//     />
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.searchContainer}>
//         <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search students..."
//           value={searchQuery}
//           onChangeText={handleSearch}
//         />
//       </View>
      
//       <FlatList
//         data={filteredStudents}
//         renderItem={renderStudent}
//         keyExtractor={(item) => item.user.id.toString()}
//         refreshControl={
//           <RefreshControl refreshing={loading} onRefresh={fetchStudents} />
//         }
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons name="people-outline" size={64} color="#ccc" />
//             <Text style={styles.emptyText}>No students found</Text>
//           </View>
//         }
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'white',
//     margin: 16,
//     paddingHorizontal: 12,
//     borderRadius: 25,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingTop: 100,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//     marginTop: 16,
//   },
// });

// export default StudentsScreen;


































































// // screens/StudentsScreen.js - FIXED VERSION
// import React, { useEffect, useState, useCallback } from 'react';
// import { 
//   View, 
//   FlatList, 
//   ActivityIndicator, 
//   Text, 
//   StyleSheet, 
//   RefreshControl,
//   Alert,
//   SafeAreaView,
//   StatusBar
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import ProfileCard from '../../components/ProfileCard';
// import UserDetailModal from './user-details';

// const StudentsScreen = ({ currentUser }) => {
//   const [students, setStudents] = useState([]);
//   const [connections, setConnections] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [token, setToken] = useState(null);
//   const [selectedUserId, setSelectedUserId] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [pendingRequests, setPendingRequests] = useState(new Set()); // Track pending requests locally

//   // Get token from AsyncStorage
//   const getAuthToken = async () => {
//     try {
//       const storedToken = await AsyncStorage.getItem('access_token');
//       return storedToken;
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   // Initialize token and data
//   useEffect(() => {
//     const initializeApp = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         const authToken = await getAuthToken();
        
//         if (!authToken) {
//           setError('No authentication token found. Please log in again.');
//           setLoading(false);
//           return;
//         }

//         setToken(authToken);
//         axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//         await Promise.all([fetchStudents(), fetchConnections()]);
//       } catch (err) {
//         setError('Failed to load data. Please try again.');
//         console.error('Error initializing data:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initializeApp();
//   }, []);

//   const fetchStudents = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/users/');
      
//       console.log('Students API response:', res.data);
      
//       let studentsData = [];
      
//       if (Array.isArray(res.data)) {
//         studentsData = res.data;
//       } else if (res.data && Array.isArray(res.data.results)) {
//         studentsData = res.data.results;
//       } else if (res.data && Array.isArray(res.data.data)) {
//         studentsData = res.data.data;
//       } else if (res.data && typeof res.data === 'object') {
//         studentsData = [res.data];
//       } else {
//         console.warn('Unexpected API response format:', res.data);
//         studentsData = [];
//       }
      
//       const filteredStudents = studentsData.filter(student => {
//         if (!student || typeof student !== 'object') {
//           console.warn('Invalid student object:', student);
//           return false;
//         }
        
//         if (!student.id) {
//           console.warn('Student missing id:', student);
//           return false;
//         }
        
//         return true;
//       });
      
//       setStudents(filteredStudents);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching students:', error);
//       if (error.response?.status === 401) {
//         setError('Authentication expired. Please log in again.');
//       } else {
//         setError('Failed to load students. Please try again.');
//       }
//       throw error;
//     }
//   };

//   const fetchConnections = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/connections/');
//       console.log('Connections API response:', res.data);
//       setConnections(res.data);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching connections:', error);
//       if (error.response?.status === 401) {
//         setError('Authentication expired. Please log in again.');
//       } else {
//         setError('Failed to load connections. Please try again.');
//       }
//       throw error;
//     }
//   };

//   const sendRequest = async (userId) => {
//     try {
//       console.log(`Sending connection request to user ${userId}`);
      
//       // Immediately add to pending requests for UI feedback
//       setPendingRequests(prev => new Set([...prev, userId]));
      
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         setPendingRequests(prev => {
//           const newSet = new Set(prev);
//           newSet.delete(userId);
//           return newSet;
//         });
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
//       // Send the connection request
//       const response = await axios.post(`http://127.0.0.1:8000/api/connections/send/${userId}/`);
//       console.log('Send request response:', response.data);
      
//       // Refresh connections to get the latest data
//       await fetchConnections();
      
//       // Remove from pending requests set since we now have the actual data
//       setPendingRequests(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(userId);
//         return newSet;
//       });
      
//       Alert.alert('Success', 'Connection request sent!');
//     } catch (error) {
//       console.error('Error sending request:', error);
//       console.error('Error response:', error.response?.data);
      
//       // Remove from pending requests on error
//       setPendingRequests(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(userId);
//         return newSet;
//       });
      
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else if (error.response?.status === 400) {
//         const errorMessage = error.response?.data?.detail || 'Connection request already exists or invalid request.';
//         Alert.alert('Error', errorMessage);
//       } else {
//         Alert.alert('Error', 'Failed to send connection request. Please try again.');
//       }
//     }
//   };

//   const cancelRequest = async (connId) => {
//     try {
//       console.log(`Cancelling connection request ${connId}`);
      
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       const response = await axios.delete(`http://127.0.0.1:8000/api/connections/cancel/${connId}/`);
//       console.log('Cancel request response:', response.data);
      
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request cancelled.');
//     } catch (error) {
//       console.error('Error cancelling request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to cancel request. Please try again.');
//       }
//     }
//   };

//   const acceptRequest = async (connId) => {
//     try {
//       console.log(`Accepting connection request ${connId}`);
      
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       const response = await axios.post(`http://127.0.0.1:8000/api/connections/accept/${connId}/`);
//       console.log('Accept request response:', response.data);
      
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request accepted!');
//     } catch (error) {
//       console.error('Error accepting request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to accept request. Please try again.');
//       }
//     }
//   };

//   const rejectRequest = async (connId) => {
//     try {
//       console.log(`Rejecting connection request ${connId}`);
      
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       const response = await axios.post(`http://127.0.0.1:8000/api/connections/reject/${connId}/`);
//       console.log('Reject request response:', response.data);
      
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request rejected.');
//     } catch (error) {
//       console.error('Error rejecting request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to reject request. Please try again.');
//       }
//     }
//   };

//   const getConnectionInfo = (userId) => {
//     if (!currentUser) return { status: 'none', connectionId: null };
    
//     // Check if we have a pending request for this user (for immediate UI feedback)
//     if (pendingRequests.has(userId)) {
//       return { status: 'pending_sent', connectionId: null };
//     }
    
//     const conn = connections.find(c =>
//       (c.sender.id === userId && c.receiver.id === currentUser.id) ||
//       (c.receiver.id === userId && c.sender.id === currentUser.id)
//     );
    
//     console.log(`Connection info for user ${userId}:`, conn);
    
//     if (!conn) return { status: 'none', connectionId: null };
    
//     // Handle different statuses properly
//     if (conn.status === 'accepted') {
//       return { status: 'accepted', connectionId: conn.id };
//     }
    
//     if (conn.status === 'rejected') {
//       return { status: 'none', connectionId: null }; // Treated as no connection
//     }
    
//     if (conn.status === 'pending') {
//       if (conn.sender.id === currentUser.id) {
//         return { status: 'pending_sent', connectionId: conn.id };
//       }
//       return { status: 'pending_received', connectionId: conn.id };
//     }
    
//     return { status: 'none', connectionId: null };
//   };

//   const handleProfilePress = (userId) => {
//     setSelectedUserId(userId);
//     setModalVisible(true);
//   };

//   const handleCloseModal = () => {
//     setModalVisible(false);
//     setSelectedUserId(null);
//   };

//   const handleModalConnect = async (userId) => {
//     await sendRequest(userId);
//     await fetchConnections();
//   };

//   const handleModalCancel = async () => {
//     if (selectedUserId) {
//       const connectionInfo = getConnectionInfo(selectedUserId);
//       if (connectionInfo.connectionId) {
//         await cancelRequest(connectionInfo.connectionId);
//         await fetchConnections();
//       }
//     }
//   };

//   const handleModalAccept = async () => {
//     if (selectedUserId) {
//       const connectionInfo = getConnectionInfo(selectedUserId);
//       if (connectionInfo.connectionId) {
//         await acceptRequest(connectionInfo.connectionId);
//         await fetchConnections();
//       }
//     }
//   };

//   const handleModalReject = async () => {
//     if (selectedUserId) {
//       const connectionInfo = getConnectionInfo(selectedUserId);
//       if (connectionInfo.connectionId) {
//         await rejectRequest(connectionInfo.connectionId);
//         await fetchConnections();
//       }
//     }
//   };

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       const authToken = await getAuthToken();
//       if (authToken) {
//         axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//         await Promise.all([fetchStudents(), fetchConnections()]);
//         setError(null);
//         setPendingRequests(new Set()); // Clear pending requests on refresh
//       } else {
//         setError('No authentication token found. Please log in again.');
//       }
//     } catch (err) {
//       setError('Failed to refresh data');
//     } finally {
//       setRefreshing(false);
//     }
//   }, []);

//   const renderStudent = ({ item }) => {
//     if (!item || !item.id) {
//       console.warn('Invalid student item in renderStudent:', item);
//       return null;
//     }
    
//     const connectionInfo = getConnectionInfo(item.id);
//     console.log(`Rendering student ${item.username} with status: ${connectionInfo.status}`);
    
//     return (
//       <ProfileCard
//         user={item}
//         status={connectionInfo.status}
//         onPress={handleProfilePress}
//         onConnect={() => sendRequest(item.id)}
//         onCancel={() => cancelRequest(connectionInfo.connectionId)}
//         onAccept={() => acceptRequest(connectionInfo.connectionId)}
//         onReject={() => rejectRequest(connectionInfo.connectionId)}
//       />
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyIcon}>👥</Text>
//       <Text style={styles.emptyText}>No students found</Text>
//       <Text style={styles.emptySubtext}>
//         {error 
//           ? 'Please check your connection and try again' 
//           : 'Check back later for new connections'
//         }
//       </Text>
//     </View>
//   );

//   const renderHeader = () => (
//     <View style={styles.headerContainer}>
//       <Text style={styles.headerTitle}>Connect with Students</Text>
//       <Text style={styles.headerSubtitle}>
//         Discover and connect with fellow students in your network
//       </Text>
//     </View>
//   );

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading students...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const selectedUserConnectionInfo = selectedUserId ? getConnectionInfo(selectedUserId) : { status: 'none' };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      
//       <FlatList
//         data={students}
//         renderItem={renderStudent}
//         keyExtractor={(item) => item.id.toString()}
//         contentContainerStyle={styles.listContainer}
//         ListHeaderComponent={renderHeader}
//         ListEmptyComponent={renderEmptyComponent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         showsVerticalScrollIndicator={false}
//         extraData={connections} // Force re-render when connections change
//       />

//       <UserDetailModal
//         visible={modalVisible}
//         userId={selectedUserId}
//         onClose={handleCloseModal}
//         onConnect={handleModalConnect}
//         onCancel={handleModalCancel}
//         onAccept={handleModalAccept}
//         onReject={handleModalReject}
//         status={selectedUserConnectionInfo.status}
//       />
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
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//   },
//   listContainer: {
//     flexGrow: 1,
//     paddingBottom: 20,
//   },
//   headerContainer: {
//     padding: 20,
//     backgroundColor: '#ffffff',
//     marginBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 8,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: '#6c757d',
//     lineHeight: 22,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     paddingVertical: 60,
//   },
//   emptyIcon: {
//     fontSize: 48,
//     marginBottom: 16,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#212529',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
// });

// export default StudentsScreen;








































































// // screens/StudentsScreen.js
// import React, { useEffect, useState, useCallback } from 'react';
// import { 
//   View, 
//   FlatList, 
//   ActivityIndicator, 
//   Text, 
//   StyleSheet, 
//   RefreshControl,
//   Alert,
//   SafeAreaView,
//   StatusBar
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import ProfileCard from '../../components/ProfileCard';
// import UserDetailModal from './user-details';



// const StudentsScreen = ({ currentUser }) => {
//   const [students, setStudents] = useState([]);
//   const [connections, setConnections] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [token, setToken] = useState(null);
//   const [selectedUserId, setSelectedUserId] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);

//   // Get token from AsyncStorage
//   const getAuthToken = async () => {
//     try {
//       const storedToken = await AsyncStorage.getItem('access_token');
//       return storedToken;
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   // Initialize token and data
//   useEffect(() => {
//     const initializeApp = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         const authToken = await getAuthToken();
        
//         if (!authToken) {
//           setError('No authentication token found. Please log in again.');
//           setLoading(false);
//           return;
//         }

//         setToken(authToken);
//         axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//         await Promise.all([fetchStudents(), fetchConnections()]);
//       } catch (err) {
//         setError('Failed to load data. Please try again.');
//         console.error('Error initializing data:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initializeApp();
//   }, []);

//   const fetchStudents = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/users/');
      
//       // Debug: Log the response to see what we're getting
//       console.log('Students API response:', res.data);
      
//       // Handle different response formats
//       let studentsData = [];
      
//       if (Array.isArray(res.data)) {
//         studentsData = res.data;
//       } else if (res.data && Array.isArray(res.data.results)) {
//         studentsData = res.data.results;
//       } else if (res.data && Array.isArray(res.data.data)) {
//         studentsData = res.data.data;
//       } else if (res.data && typeof res.data === 'object') {
//         studentsData = [res.data];
//       } else {
//         console.warn('Unexpected API response format:', res.data);
//         studentsData = [];
//       }
      
//       // Filter out invalid students (backend should already exclude current user)
//       const filteredStudents = studentsData.filter(student => {
//         if (!student || typeof student !== 'object') {
//           console.warn('Invalid student object:', student);
//           return false;
//         }
        
//         if (!student.id) {
//           console.warn('Student missing id:', student);
//           return false;
//         }
        
//         return true;
//       });
      
//       setStudents(filteredStudents);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching students:', error);
//       if (error.response?.status === 401) {
//         setError('Authentication expired. Please log in again.');
//       } else {
//         setError('Failed to load students. Please try again.');
//       }
//       throw error;
//     }
//   };

//   const fetchConnections = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/connections/');
//       setConnections(res.data);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching connections:', error);
//       if (error.response?.status === 401) {
//         setError('Authentication expired. Please log in again.');
//       } else {
//         setError('Failed to load connections. Please try again.');
//       }
//       throw error;
//     }
//   };

//   // const sendRequest = async (userId) => {
//   //   try {
//   //     const authToken = await getAuthToken();
//   //     if (!authToken) {
//   //       Alert.alert('Error', 'No authentication token found. Please log in again.');
//   //       return;
//   //     }
      
//   //     axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//   //     await axios.post(`http://127.0.0.1:8000/api/connections/send/${userId}/`);
//   //     await fetchConnections();
//   //     Alert.alert('Success', 'Connection request sent!');
//   //   } catch (error) {
//   //     console.error('Error sending request:', error);
//   //     if (error.response?.status === 401) {
//   //       Alert.alert('Error', 'Authentication expired. Please log in again.');
//   //     } else {
//   //       Alert.alert('Error', 'Failed to send connection request. Please try again.');
//   //     }
//   //   }
//   // };

//   const sendRequest = async (userId) => {
//     try {
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
//       // Send the connection request
//       await axios.post(`http://127.0.0.1:8000/api/connections/send/${userId}/`);
      
//       // Immediately refresh the connections to update the UI
//       await fetchConnections();
      
//       // Show success message
//       Alert.alert('Success', 'Connection request sent!');
//     } catch (error) {
//       console.error('Error sending request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else if (error.response?.status === 400) {
//         Alert.alert('Error', 'Connection request already exists or invalid request.');
//       } else {
//         Alert.alert('Error', 'Failed to send connection request. Please try again.');
//       }
//     }
//   };




//   const cancelRequest = async (connId) => {
//     try {
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       await axios.delete(`http://127.0.0.1:8000/api/connections/cancel/${connId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request cancelled.');
//     } catch (error) {
//       console.error('Error cancelling request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to cancel request. Please try again.');
//       }
//     }
//   };

//   // const acceptRequest = async (connId) => {
//   //   try {
//   //     const authToken = await getAuthToken();
//   //     if (!authToken) {
//   //       Alert.alert('Error', 'No authentication token found. Please log in again.');
//   //       return;
//   //     }
      
//   //     axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//   //     await axios.post(`http://127.0.0.1:8000/api/connections/accept/${connId}/`);
//   //     await fetchConnections();
//   //     Alert.alert('Success', 'Connection request accepted!');
//   //   } catch (error) {
//   //     console.error('Error accepting request:', error);
//   //     if (error.response?.status === 401) {
//   //       Alert.alert('Error', 'Authentication expired. Please log in again.');
//   //     } else {
//   //       Alert.alert('Error', 'Failed to accept request. Please try again.');
//   //     }
//   //   }
//   // };


//   const acceptRequest = async (connId) => {
//     try {
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       await axios.post(`http://127.0.0.1:8000/api/connections/accept/${connId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request accepted!');
//     } catch (error) {
//       console.error('Error accepting request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to accept request. Please try again.');
//       }
//     }
//   };





//   // const rejectRequest = async (connId) => {
//   //   try {
//   //     const authToken = await getAuthToken();
//   //     if (!authToken) {
//   //       Alert.alert('Error', 'No authentication token found. Please log in again.');
//   //       return;
//   //     }
      
//   //     axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//   //     await axios.post(`http://127.0.0.1:8000/api/connections/reject/${connId}/`);
//   //     await fetchConnections();
//   //     Alert.alert('Success', 'Connection request rejected.');
//   //   } catch (error) {
//   //     console.error('Error rejecting request:', error);
//   //     if (error.response?.status === 401) {
//   //       Alert.alert('Error', 'Authentication expired. Please log in again.');
//   //     } else {
//   //       Alert.alert('Error', 'Failed to reject request. Please try again.');
//   //     }
//   //   }
//   // };


//    const rejectRequest = async (connId) => {
//     try {
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       await axios.post(`http://127.0.0.1:8000/api/connections/reject/${connId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request rejected.');
//     } catch (error) {
//       console.error('Error rejecting request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to reject request. Please try again.');
//       }
//     }
//   };








//   // const getConnectionInfo = (userId) => {
//   //   if (!currentUser) return { status: 'none', connectionId: null };
    
//   //   const conn = connections.find(c =>
//   //     (c.sender.id === userId && c.receiver.id === currentUser.id) ||
//   //     (c.receiver.id === userId && c.sender.id === currentUser.id)
//   //   );
    
//   //   if (!conn) return { status: 'none', connectionId: null };
    
//   //   if (conn.status === 'pending') {
//   //     if (conn.sender.id === currentUser.id) {
//   //       return { status: 'pending_sent', connectionId: conn.id };
//   //     }
//   //     return { status: 'pending_received', connectionId: conn.id };
//   //   }
    
//   //   return { status: 'accepted', connectionId: conn.id };
//   // };

//     const getConnectionInfo = (userId) => {
//     if (!currentUser) return { status: 'none', connectionId: null };
    
//     const conn = connections.find(c =>
//       (c.sender.id === userId && c.receiver.id === currentUser.id) ||
//       (c.receiver.id === userId && c.sender.id === currentUser.id)
//     );
    
//     if (!conn) return { status: 'none', connectionId: null };
    
//     // Handle different statuses properly
//     if (conn.status === 'accepted') {
//       return { status: 'accepted', connectionId: conn.id };
//     }
    
//     if (conn.status === 'rejected') {
//       return { status: 'none', connectionId: null }; // Treated as no connection
//     }
    
//     if (conn.status === 'pending') {
//       if (conn.sender.id === currentUser.id) {
//         return { status: 'pending_sent', connectionId: conn.id };
//       }
//       return { status: 'pending_received', connectionId: conn.id };
//     }
    
//     return { status: 'none', connectionId: null };
//   };



//   const handleProfilePress = (userId) => {
//     setSelectedUserId(userId);
//     setModalVisible(true);
//   };

//   const handleCloseModal = () => {
//     setModalVisible(false);
//     setSelectedUserId(null);
//   };

//   const handleModalConnect = async (userId) => {
//     await sendRequest(userId);
//     // Refresh the modal data after connection request
//     await fetchConnections();
//   };

//   const handleModalCancel = async () => {
//     if (selectedUserId) {
//       const connectionInfo = getConnectionInfo(selectedUserId);
//       if (connectionInfo.connectionId) {
//         await cancelRequest(connectionInfo.connectionId);
//         await fetchConnections();
//       }
//     }
//   };

//   const handleModalAccept = async () => {
//     if (selectedUserId) {
//       const connectionInfo = getConnectionInfo(selectedUserId);
//       if (connectionInfo.connectionId) {
//         await acceptRequest(connectionInfo.connectionId);
//         await fetchConnections();
//       }
//     }
//   };

//   const handleModalReject = async () => {
//     if (selectedUserId) {
//       const connectionInfo = getConnectionInfo(selectedUserId);
//       if (connectionInfo.connectionId) {
//         await rejectRequest(connectionInfo.connectionId);
//         await fetchConnections();
//       }
//     }
//   };

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       const authToken = await getAuthToken();
//       if (authToken) {
//         axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//         await Promise.all([fetchStudents(), fetchConnections()]);
//         setError(null);
//       } else {
//         setError('No authentication token found. Please log in again.');
//       }
//     } catch (err) {
//       setError('Failed to refresh data');
//     } finally {
//       setRefreshing(false);
//     }
//   }, []);

//   const renderStudent = ({ item }) => {
//     if (!item || !item.id) {
//       console.warn('Invalid student item in renderStudent:', item);
//       return null;
//     }
    
//     const connectionInfo = getConnectionInfo(item.id);
    
//     return (
//       <ProfileCard
//         user={item}
//         status={connectionInfo.status}
//         onPress={handleProfilePress}
//         onConnect={() => sendRequest(item.id)}
//         onCancel={() => cancelRequest(connectionInfo.connectionId)}
//         onAccept={() => acceptRequest(connectionInfo.connectionId)}
//         onReject={() => rejectRequest(connectionInfo.connectionId)}
//       />
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyIcon}>👥</Text>
//       <Text style={styles.emptyText}>No students found</Text>
//       <Text style={styles.emptySubtext}>
//         {error 
//           ? 'Please check your connection and try again' 
//           : 'Check back later for new connections'
//         }
//       </Text>
//     </View>
//   );

//   const renderHeader = () => (
//     <View style={styles.headerContainer}>
//       <Text style={styles.headerTitle}>Connect with Students</Text>
//       <Text style={styles.headerSubtitle}>
//         Discover and connect with fellow students in your network
//       </Text>
//     </View>
//   );

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading students...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const selectedUserConnectionInfo = selectedUserId ? getConnectionInfo(selectedUserId) : { status: 'none' };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      
//       <FlatList
//         data={students}
//         renderItem={renderStudent}
//         keyExtractor={(item) => item.id.toString()}
//         contentContainerStyle={styles.listContainer}
//         ListHeaderComponent={renderHeader}
//         ListEmptyComponent={renderEmptyComponent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       />

//       <UserDetailModal
//         visible={modalVisible}
//         userId={selectedUserId}
//         onClose={handleCloseModal}
//         onConnect={handleModalConnect}
//         onCancel={handleModalCancel}
//         onAccept={handleModalAccept}
//         onReject={handleModalReject}
//         status={selectedUserConnectionInfo.status}
//       />
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
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//   },
//   listContainer: {
//     flexGrow: 1,
//     paddingBottom: 20,
//   },
//   headerContainer: {
//     padding: 20,
//     backgroundColor: '#ffffff',
//     marginBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 8,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: '#6c757d',
//     lineHeight: 22,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     paddingVertical: 60,
//   },
//   emptyIcon: {
//     fontSize: 48,
//     marginBottom: 16,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#212529',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
// });

// export default StudentsScreen;
































































// import React, { useEffect, useState, useCallback } from 'react';
// import { 
//   View, 
//   FlatList, 
//   ActivityIndicator, 
//   Text, 
//   StyleSheet, 
//   RefreshControl,
//   Alert,
//   SafeAreaView,
//   StatusBar
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import ProfileCard from '../../components/ProfileCard';

// const StudentsScreen = ({ currentUser }) => {
//   const [students, setStudents] = useState([]);
//   const [connections, setConnections] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [token, setToken] = useState(null);

//   // Get token from AsyncStorage
//   const getAuthToken = async () => {
//     try {
//       const storedToken = await AsyncStorage.getItem('access_token');
//       return storedToken;
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   // Initialize token and data
//   useEffect(() => {
//     const initializeApp = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         const authToken = await getAuthToken();
        
//         if (!authToken) {
//           setError('No authentication token found. Please log in again.');
//           setLoading(false);
//           return;
//         }

//         setToken(authToken);
//         axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//         await Promise.all([fetchStudents(), fetchConnections()]);
//       } catch (err) {
//         setError('Failed to load data. Please try again.');
//         console.error('Error initializing data:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initializeApp();
//   }, []);

//   const fetchStudents = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/users/');
      
//       // Debug: Log the response to see what we're getting
//       console.log('Students API response:', res.data);
//       console.log('Response type:', typeof res.data);
//       console.log('Is array:', Array.isArray(res.data));
      
//       // Handle different response formats
//       let studentsData = [];
      
//       if (Array.isArray(res.data)) {
//         studentsData = res.data;
//       } else if (res.data && Array.isArray(res.data.results)) {
//         // Paginated response format
//         studentsData = res.data.results;
//       } else if (res.data && Array.isArray(res.data.data)) {
//         // Nested data format
//         studentsData = res.data.data;
//       } else if (res.data && typeof res.data === 'object') {
//         // Single object - convert to array
//         studentsData = [res.data];
//       } else {
//         console.warn('Unexpected API response format:', res.data);
//         studentsData = [];
//       }
      
//       // Filter out current user from the list and ensure valid data
//       const filteredStudents = studentsData.filter(student => {
//         // Check if student has required properties
//         if (!student || typeof student !== 'object') {
//           console.warn('Invalid student object:', student);
//           return false;
//         }
        
//         // Ensure student has an id
//         if (!student.id) {
//           console.warn('Student missing id:', student);
//           return false;
//         }
        
//         // Filter out current user
//         return currentUser ? student.id !== currentUser.id : true;
//       });
      
//       setStudents(filteredStudents);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching students:', error);
//       if (error.response?.status === 401) {
//         setError('Authentication expired. Please log in again.');
//       } else {
//         setError('Failed to load students. Please try again.');
//       }
//       throw error;
//     }
//   };

//   const fetchConnections = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/connections/');
//       setConnections(res.data);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching connections:', error);
//       if (error.response?.status === 401) {
//         setError('Authentication expired. Please log in again.');
//       } else {
//         setError('Failed to load connections. Please try again.');
//       }
//       throw error;
//     }
//   };

//   const sendRequest = async (userId) => {
//     try {
//       // Re-check token before making request
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       await axios.post(`http://127.0.0.1:8000/api/connections/send/${userId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request sent!');
//     } catch (error) {
//       console.error('Error sending request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to send connection request. Please try again.');
//       }
//     }
//   };

//   const cancelRequest = async (connId) => {
//     try {
//       // Re-check token before making request
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       await axios.delete(`http://127.0.0.1:8000/api/connections/cancel/${connId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request cancelled.');
//     } catch (error) {
//       console.error('Error cancelling request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to cancel request. Please try again.');
//       }
//     }
//   };

//   const acceptRequest = async (connId) => {
//     try {
//       // Re-check token before making request
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       await axios.post(`http://127.0.0.1:8000/api/connections/accept/${connId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request accepted!');
//     } catch (error) {
//       console.error('Error accepting request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to accept request. Please try again.');
//       }
//     }
//   };

//   const rejectRequest = async (connId) => {
//     try {
//       // Re-check token before making request
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       await axios.post(`http://127.0.0.1:8000/api/connections/reject/${connId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request rejected.');
//     } catch (error) {
//       console.error('Error rejecting request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to reject request. Please try again.');
//       }
//     }
//   };

//   const getConnectionInfo = (userId) => {
//     if (!currentUser) return { status: 'none', connectionId: null };
    
//     const conn = connections.find(c =>
//       (c.sender.id === userId && c.receiver.id === currentUser.id) ||
//       (c.receiver.id === userId && c.sender.id === currentUser.id)
//     );
    
//     if (!conn) return { status: 'none', connectionId: null };
    
//     if (conn.status === 'pending') {
//       if (conn.sender.id === currentUser.id) {
//         return { status: 'pending_sent', connectionId: conn.id };
//       }
//       return { status: 'pending_received', connectionId: conn.id };
//     }
    
//     return { status: 'accepted', connectionId: conn.id };
//   };

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       // Re-check token before refreshing
//       const authToken = await getAuthToken();
//       if (authToken) {
//         axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//         await Promise.all([fetchStudents(), fetchConnections()]);
//         setError(null);
//       } else {
//         setError('No authentication token found. Please log in again.');
//       }
//     } catch (err) {
//       setError('Failed to refresh data');
//     } finally {
//       setRefreshing(false);
//     }
//   }, []);

//   const renderStudent = ({ item }) => {
//     // Safety check for item
//     if (!item || !item.id) {
//       console.warn('Invalid student item in renderStudent:', item);
//       return null;
//     }
    
//     const connectionInfo = getConnectionInfo(item.id);
    
//     return (
//       <ProfileCard
//         user={item}
//         status={connectionInfo.status}
//         onConnect={() => sendRequest(item.id)}
//         onCancel={() => cancelRequest(connectionInfo.connectionId)}
//         onAccept={() => acceptRequest(connectionInfo.connectionId)}
//         onReject={() => rejectRequest(connectionInfo.connectionId)}
//       />
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyIcon}>👥</Text>
//       <Text style={styles.emptyText}>No students found</Text>
//       <Text style={styles.emptySubtext}>
//         {error 
//           ? 'Please check your connection and try again' 
//           : 'Check back later for new connections'
//         }
//       </Text>
//     </View>
//   );

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <Text style={styles.headerTitle}>Connect with Students</Text>
//       <Text style={styles.headerSubtitle}>
//         Discover and connect with fellow students
//       </Text>
//     </View>
//   );

//   if (loading && !refreshing) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading students...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
//       {error && !refreshing && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//         </View>
//       )}
      
//       <FlatList
//         data={students}
//         keyExtractor={(item, index) => item.id ? item.id.toString() : `student-${index}`}
//         renderItem={renderStudent}
//         ListHeaderComponent={renderHeader}
//         ListEmptyComponent={renderEmptyComponent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         contentContainerStyle={[
//           styles.listContainer,
//           students.length === 0 && styles.emptyListContainer
//         ]}
//         showsVerticalScrollIndicator={false}
//         initialNumToRender={10}
//         maxToRenderPerBatch={10}
//         windowSize={10}
//       />
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
//     fontWeight: '500',
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//     marginBottom: 8,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: '#6c757d',
//     lineHeight: 22,
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
//   emptyListContainer: {
//     flexGrow: 1,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     paddingVertical: 60,
//   },
//   emptyIcon: {
//     fontSize: 48,
//     marginBottom: 16,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#495057',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   errorContainer: {
//     backgroundColor: '#f8d7da',
//     borderColor: '#f5c6cb',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     marginHorizontal: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     color: '#721c24',
//     fontSize: 14,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
// });

// export default StudentsScreen;


















































// import React, { useEffect, useState, useCallback } from 'react';
// import { 
//   View, 
//   FlatList, 
//   ActivityIndicator, 
//   Text, 
//   StyleSheet, 
//   RefreshControl,
//   Alert,
//   SafeAreaView,
//   StatusBar
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import ProfileCard from '../../components/ProfileCard';

// const StudentsScreen = ({ currentUser }) => {
//   const [students, setStudents] = useState([]);
//   const [connections, setConnections] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [token, setToken] = useState(null);

//   // Get token from AsyncStorage
//   const getAuthToken = async () => {
//     try {
//       const storedToken = await AsyncStorage.getItem('access_token');
//       return storedToken;
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   };

//   // Initialize token and data
//   useEffect(() => {
//     const initializeApp = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         const authToken = await getAuthToken();
        
//         if (!authToken) {
//           setError('No authentication token found. Please log in again.');
//           setLoading(false);
//           return;
//         }

//         setToken(authToken);
//         axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//         await Promise.all([fetchStudents(), fetchConnections()]);
//       } catch (err) {
//         setError('Failed to load data. Please try again.');
//         console.error('Error initializing data:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initializeApp();
//   }, []);

//   const fetchStudents = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/profile/');
//       // Filter out current user from the list
//       const filteredStudents = res.data.filter(student => 
//         currentUser ? student.id !== currentUser.id : true
//       );
//       setStudents(filteredStudents);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching students:', error);
//       if (error.response?.status === 401) {
//         setError('Authentication expired. Please log in again.');
//       } else {
//         setError('Failed to load students. Please try again.');
//       }
//       throw error;
//     }
//   };

//   const fetchConnections = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/connections/');
//       setConnections(res.data);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching connections:', error);
//       if (error.response?.status === 401) {
//         setError('Authentication expired. Please log in again.');
//       } else {
//         setError('Failed to load connections. Please try again.');
//       }
//       throw error;
//     }
//   };

//   const sendRequest = async (userId) => {
//     try {
//       // Re-check token before making request
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       await axios.post(`http://127.0.0.1:8000/api/connections/send/${userId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request sent!');
//     } catch (error) {
//       console.error('Error sending request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to send connection request. Please try again.');
//       }
//     }
//   };

//   const cancelRequest = async (connId) => {
//     try {
//       // Re-check token before making request
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       await axios.delete(`http://127.0.0.1:8000/api/connections/cancel/${connId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request cancelled.');
//     } catch (error) {
//       console.error('Error cancelling request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to cancel request. Please try again.');
//       }
//     }
//   };

//   const acceptRequest = async (connId) => {
//     try {
//       // Re-check token before making request
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       await axios.post(`http://127.0.0.1:8000/api/connections/accept/${connId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request accepted!');
//     } catch (error) {
//       console.error('Error accepting request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to accept request. Please try again.');
//       }
//     }
//   };

//   const rejectRequest = async (connId) => {
//     try {
//       // Re-check token before making request
//       const authToken = await getAuthToken();
//       if (!authToken) {
//         Alert.alert('Error', 'No authentication token found. Please log in again.');
//         return;
//       }
      
//       axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//       await axios.post(`http://127.0.0.1:8000/api/connections/reject/${connId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request rejected.');
//     } catch (error) {
//       console.error('Error rejecting request:', error);
//       if (error.response?.status === 401) {
//         Alert.alert('Error', 'Authentication expired. Please log in again.');
//       } else {
//         Alert.alert('Error', 'Failed to reject request. Please try again.');
//       }
//     }
//   };

//   const getConnectionInfo = (userId) => {
//     if (!currentUser) return { status: 'none', connectionId: null };
    
//     const conn = connections.find(c =>
//       (c.sender.id === userId && c.receiver.id === currentUser.id) ||
//       (c.receiver.id === userId && c.sender.id === currentUser.id)
//     );
    
//     if (!conn) return { status: 'none', connectionId: null };
    
//     if (conn.status === 'pending') {
//       if (conn.sender.id === currentUser.id) {
//         return { status: 'pending_sent', connectionId: conn.id };
//       }
//       return { status: 'pending_received', connectionId: conn.id };
//     }
    
//     return { status: 'accepted', connectionId: conn.id };
//   };

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       // Re-check token before refreshing
//       const authToken = await getAuthToken();
//       if (authToken) {
//         axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
//         await Promise.all([fetchStudents(), fetchConnections()]);
//         setError(null);
//       } else {
//         setError('No authentication token found. Please log in again.');
//       }
//     } catch (err) {
//       setError('Failed to refresh data');
//     } finally {
//       setRefreshing(false);
//     }
//   }, []);

//   const renderStudent = ({ item }) => {
//     const connectionInfo = getConnectionInfo(item.id);
    
//     return (
//       <ProfileCard
//         user={item}
//         status={connectionInfo.status}
//         onConnect={() => sendRequest(item.id)}
//         onCancel={() => cancelRequest(connectionInfo.connectionId)}
//         onAccept={() => acceptRequest(connectionInfo.connectionId)}
//         onReject={() => rejectRequest(connectionInfo.connectionId)}
//       />
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyIcon}>👥</Text>
//       <Text style={styles.emptyText}>No students found</Text>
//       <Text style={styles.emptySubtext}>
//         {error 
//           ? 'Please check your connection and try again' 
//           : 'Check back later for new connections'
//         }
//       </Text>
//     </View>
//   );

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <Text style={styles.headerTitle}>Connect with Students</Text>
//       <Text style={styles.headerSubtitle}>
//         Discover and connect with fellow students
//       </Text>
//     </View>
//   );

//   if (loading && !refreshing) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading students...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
//       {error && !refreshing && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//         </View>
//       )}
      
//       <FlatList
//         data={students}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderStudent}
//         ListHeaderComponent={renderHeader}
//         ListEmptyComponent={renderEmptyComponent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         contentContainerStyle={[
//           styles.listContainer,
//           students.length === 0 && styles.emptyListContainer
//         ]}
//         showsVerticalScrollIndicator={false}
//         initialNumToRender={10}
//         maxToRenderPerBatch={10}
//         windowSize={10}
//       />
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
//     fontWeight: '500',
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//     marginBottom: 8,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: '#6c757d',
//     lineHeight: 22,
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
//   emptyListContainer: {
//     flexGrow: 1,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     paddingVertical: 60,
//   },
//   emptyIcon: {
//     fontSize: 48,
//     marginBottom: 16,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#495057',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   errorContainer: {
//     backgroundColor: '#f8d7da',
//     borderColor: '#f5c6cb',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     marginHorizontal: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     color: '#721c24',
//     fontSize: 14,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
// });

// export default StudentsScreen;
























































// import React, { useEffect, useState, useCallback } from 'react';
// import { 
//   View, 
//   FlatList, 
//   ActivityIndicator, 
//   Text, 
//   StyleSheet, 
//   RefreshControl,
//   Alert,
//   SafeAreaView,
//   StatusBar
// } from 'react-native';
// import axios from 'axios';
// import ProfileCard from '../../components/ProfileCard';

// const StudentsScreen = ({ token, currentUser }) => {
//   const [students, setStudents] = useState([]);
//   const [connections, setConnections] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (token) {
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//       initializeData();
//     }
//   }, [token]);

//   const initializeData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       await Promise.all([fetchStudents(), fetchConnections()]);
//     } catch (err) {
//       setError('Failed to load data. Please try again.');
//       console.error('Error initializing data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStudents = async () => {
//     try {
//     //   const res = await axios.get('/users/');
//       const res = await axios.get('http://127.0.0.1:8000/api/profile/');
//       // Filter out current user from the list
//       const filteredStudents = res.data.filter(student => 
//         currentUser ? student.id !== currentUser.id : true
//       );
//       setStudents(filteredStudents);
//     } catch (error) {
//       console.error('Error fetching students:', error);
//       throw error;
//     }
//   };

//   const fetchConnections = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/api/connections/');
//       setConnections(res.data);
//     } catch (error) {
//       console.error('Error fetching connections:', error);
//       throw error;
//     }
//   };

//   const sendRequest = async (userId) => {
//     try {
//       await axios.post(`http://127.0.0.1:8000/api/connections/send/${userId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request sent!');
//     } catch (error) {
//       console.error('Error sending request:', error);
//       Alert.alert('Error', 'Failed to send connection request. Please try again.');
//     }
//   };

//   const cancelRequest = async (connId) => {
//     try {
//       await axios.delete(`http://127.0.0.1:8000/api/connections/cancel/${connId}/`);
//       await fetchConnections();
//       Alert.alert('Success', 'Connection request cancelled.');
//     } catch (error) {
//       console.error('Error cancelling request:', error);
//       Alert.alert('Error', 'Failed to cancel request. Please try again.');
//     }
//   };

//   const getConnectionInfo = (userId) => {
//     if (!currentUser) return { status: 'none', connectionId: null };
    
//     const conn = connections.find(c =>
//       (c.sender.id === userId && c.receiver.id === currentUser.id) ||
//       (c.receiver.id === userId && c.sender.id === currentUser.id)
//     );
    
//     if (!conn) return { status: 'none', connectionId: null };
    
//     if (conn.status === 'pending') {
//       if (conn.sender.id === currentUser.id) {
//         return { status: 'pending_sent', connectionId: conn.id };
//       }
//       return { status: 'pending_received', connectionId: conn.id };
//     }
    
//     return { status: 'accepted', connectionId: conn.id };
//   };

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       await Promise.all([fetchStudents(), fetchConnections()]);
//       setError(null);
//     } catch (err) {
//       setError('Failed to refresh data');
//     } finally {
//       setRefreshing(false);
//     }
//   }, []);

//   const renderStudent = ({ item }) => {
//     const connectionInfo = getConnectionInfo(item.id);
    
//     return (
//       <ProfileCard
//         user={item}
//         status={connectionInfo.status}
//         onConnect={() => sendRequest(item.id)}
//         onCancel={() => cancelRequest(connectionInfo.connectionId)}
//       />
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyText}>No students found</Text>
//       <Text style={styles.emptySubtext}>
//         {error ? 'Please check your connection and try again' : 'Check back later for new connections'}
//       </Text>
//     </View>
//   );

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <Text style={styles.headerTitle}>Connect with Students</Text>
//       <Text style={styles.headerSubtitle}>
//         Discover and connect with fellow students
//       </Text>
//     </View>
//   );

//   if (loading && !refreshing) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.loadingText}>Loading students...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
//       {error && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//         </View>
//       )}
      
//       <FlatList
//         data={students}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderStudent}
//         ListHeaderComponent={renderHeader}
//         ListEmptyComponent={renderEmptyComponent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={['#007AFF']}
//             tintColor="#007AFF"
//           />
//         }
//         contentContainerStyle={[
//           styles.listContainer,
//           students.length === 0 && styles.emptyListContainer
//         ]}
//         showsVerticalScrollIndicator={false}
//         initialNumToRender={10}
//         maxToRenderPerBatch={10}
//         windowSize={10}
//       />
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
//     fontWeight: '500',
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//     marginBottom: 8,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: '#6c757d',
//     lineHeight: 22,
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
//   emptyListContainer: {
//     flexGrow: 1,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 40,
//     paddingVertical: 60,
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#495057',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtext: {
//     fontSize: 16,
//     color: '#6c757d',
//     textAlign: 'center',
//     lineHeight: 22,
//   },
//   errorContainer: {
//     backgroundColor: '#f8d7da',
//     borderColor: '#f5c6cb',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     marginHorizontal: 16,
//     marginBottom: 8,
//   },
//   errorText: {
//     color: '#721c24',
//     fontSize: 14,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
// });

// export default StudentsScreen;
































































// import React, { useEffect, useState } from 'react';
// import { View, FlatList, ActivityIndicator, Text } from 'react-native';
// // import api from '../utils/api';
// import ProfileCard from '../../components/ProfileCard';
// import axios from 'axios'


// const StudentsScreen = ({ token }) => {
//   const [students, setStudents] = useState([]);
//   const [connections, setConnections] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     fetchStudents();
//     fetchConnections();
//   }, []);

//   const fetchStudents = async () => {
//     const res = await axios.get('/users/');
//     setStudents(res.data);
//     setLoading(false);
//   };

//   const fetchConnections = async () => {
//     const res = await axios.get('/connections/');
//     setConnections(res.data);
//   };

//   const sendRequest = async (userId) => {
//     await axios.post(`/connections/send/${userId}/`);
//     fetchConnections();
//   };

//   const cancelRequest = async (connId) => {
//     await axios.delete(`/connections/cancel/${connId}/`);
//     fetchConnections();
//   };

//   const getStatus = (userId) => {
//     const conn = connections.find(c =>
//       (c.sender.id === userId && c.receiver.id === currentUser.id) ||
//       (c.receiver.id === userId && c.sender.id === currentUser.id)
//     );
//     if (!conn) return 'none';
//     if (conn.status === 'pending') {
//       if (conn.sender.id === currentUser.id) return 'pending_sent';
//       return 'pending_received';
//     }
//     return 'accepted';
//   };

//   const currentUser = null; // Replace with actual logged-in user

//   if (loading) return <ActivityIndicator />;

//   return (
//     <FlatList
//       data={students}
//       keyExtractor={(item) => item.id.toString()}
//       renderItem={({ item }) => (
//         <ProfileCard
//           user={item}
//           status={getStatus(item.id)}
//           onConnect={() => sendRequest(item.id)}
//           onCancel={() => cancelRequest(item.id)}
//         />
//       )}
//     />
//   );
// };

// export default StudentsScreen;
