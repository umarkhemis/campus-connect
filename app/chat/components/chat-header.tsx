

import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConnectionAPI from '../../api/connectionService'; 


const ChatHeader = ({ 
  user, 
  isOnline, 
  onBackPress, 
  onVideoCall, 
  onVoiceCall, 
  onUserPress 
}) => {
  const getStatusText = () => {
    if (isOnline) {
      return 'Online';
    }
    // for adding last seen logic later
    // if (user?.last_seen) {
    //   const lastSeenDate = new Date(user.last_seen);
    //   const now = new Date();
    //   const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);
    //   if (diffInSeconds < 60) {
    //     return 'Last seen recently';
    //   } else if (diffInSeconds < 3600) {
    //     return `Last seen ${Math.floor(diffInSeconds / 60)} minutes ago`;
    //   } else if (diffInSeconds < 86400) {
    //     return `Last seen ${Math.floor(diffInSeconds / 3600)} hours ago`;
    //   } else {
    //     return `Last seen ${Math.floor(diffInSeconds / 86400)} days ago`;
    //   }
    // }
    // Fallback for when last seen is not available
    // You can customize this message as needed
    // if (user?.last_seen) {
    //   return `Last seen ${new Date(user.last_seen).toLocaleTimeString()()}`;
    // }
    // Fallback for when last seen is not available
    return 'Last seen recently';
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <TouchableOpacity 
            onPress={onBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onUserPress?.(user)}
            style={styles.userInfo}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  // uri: user?.profile_picture || 
                  //  uri: profilePictureUrl ||
                  uri: ConnectionAPI.getUserProfilePicture(user) ||
                  `https://via.placeholder.com/40x40.png?text=${user?.username?.[0] || 'U'}`
                }}
                style={styles.avatar}
              />
              {isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.username}
                {/* {user?.usernamename} */}
                {/* {user?.usernamename} {user?.last_name} */}
              </Text>
              <Text style={styles.userStatus} numberOfLines={1}>
                {getStatusText()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.rightSection}>
          {onVoiceCall && (
            <TouchableOpacity 
              onPress={() => onVoiceCall(user)}
              style={styles.actionButton}
            >
              <Ionicons name="call" size={22} color="#007AFF" />
            </TouchableOpacity>
          )}

          {onVideoCall && (
            <TouchableOpacity 
              onPress={() => onVideoCall(user)}
              style={styles.actionButton}
            >
              <Ionicons name="videocam" size={22} color="#007AFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Show chat options menu
              console.log('Show chat options');
            }}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  textContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  userStatus: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default ChatHeader;




























// import React from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   TouchableOpacity, 
//   StyleSheet,
//   SafeAreaView 
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { Ionicons } from '@expo/vector-icons';
// import { router } from 'expo-router';

// const ChatHeader = ({ user, isOnline, onVideoCall, onVoiceCall, onUserPress }) => {
//   const navigation = useNavigation();

//   const handleBackPress = () => {
//     router.push('/chat-list'); // Navigate back to chat list
    
//     // navigation.goBack();
//   };

//   const handleUserPress = () => {
//     if (onUserPress) {
//       onUserPress(user);
//     } else {
//       // Navigate to user profile or show user details
//     //   navigation.navigate('UserProfile', { userId: user.id });
//       router.push(`auth/profile/${user.id}`);
//     }
//   };

//   const getStatusText = () => {
//     if (isOnline) {
//       return 'Online';
//     }
//     // You can add last seen logic here
//     return 'Last seen recently';
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <View style={styles.leftSection}>
//           <TouchableOpacity 
//             onPress={handleBackPress}
//             style={styles.backButton}
//           >
//             <Ionicons name="arrow-back" size={24} color="#007AFF" />
//           </TouchableOpacity>

//           <TouchableOpacity 
//             onPress={handleUserPress}
//             style={styles.userInfo}
//           >
//             <View style={styles.avatarContainer}>
//               <Image
//                 source={{
//                   uri: user?.profile_picture || 
//                        'https://via.placeholder.com/40x40.png?text=' + 
//                        (user?.first_name?.[0] || 'U')
//                 }}
//                 style={styles.avatar}
//               />
//               {isOnline && <View style={styles.onlineIndicator} />}
//             </View>

//             <View style={styles.textContainer}>
//               <Text style={styles.userName} numberOfLines={1}>
//                 {user?.first_name} {user?.last_name}
//               </Text>
//               <Text style={styles.userStatus} numberOfLines={1}>
//                 {getStatusText()}
//               </Text>
//             </View>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.rightSection}>
//           {onVoiceCall && (
//             <TouchableOpacity 
//               onPress={() => onVoiceCall(user)}
//               style={styles.actionButton}
//             >
//               <Ionicons name="call" size={22} color="#007AFF" />
//             </TouchableOpacity>
//           )}

//           {onVideoCall && (
//             <TouchableOpacity 
//               onPress={() => onVideoCall(user)}
//               style={styles.actionButton}
//             >
//               <Ionicons name="videocam" size={22} color="#007AFF" />
//             </TouchableOpacity>
//           )}

//           <TouchableOpacity 
//             style={styles.actionButton}
//             onPress={() => {
//               // Show chat options menu
//               console.log('Show chat options');
//             }}
//           >
//             <Ionicons name="ellipsis-vertical" size={22} color="#007AFF" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     backgroundColor: '#fff',
//   },
//   container: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderBottomWidth: 0.5,
//     borderBottomColor: '#E0E0E0',
//     backgroundColor: '#fff',
//   },
//   leftSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   backButton: {
//     padding: 8,
//     marginRight: 8,
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginRight: 12,
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#f0f0f0',
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#4CAF50',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   textContainer: {
//     flex: 1,
//   },
//   userName: {
//     fontSize: 17,
//     fontWeight: '600',
//     color: '#000',
//   },
//   userStatus: {
//     fontSize: 13,
//     color: '#8E8E93',
//     marginTop: 1,
//   },
//   rightSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   actionButton: {
//     padding: 8,
//     marginLeft: 4,
//   },
// });

// export default ChatHeader;