
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   StatusBar,
//   Image,
//   Dimensions,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useLocalSearchParams, router } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';

// const { width, height } = Dimensions.get('window');

// const AudioCallScreen = () => {
//   const params = useLocalSearchParams();
//   const { userId, userName, userAvatar } = params;
//   const [callDuration, setCallDuration] = useState(0);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isSpeakerOn, setIsSpeakerOn] = useState(false);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCallDuration(prev => prev + 1);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   const formatDuration = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const handleEndCall = () => {
//     router.back();
//   };

//   const toggleMute = () => {
//     setIsMuted(!isMuted);
//   };

//   const toggleSpeaker = () => {
//     setIsSpeakerOn(!isSpeakerOn);
//   };

//   return (
//     <View style={audioCallStyles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#667eea" />
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={audioCallStyles.gradient}
//       >
//         <View style={audioCallStyles.header}>
//           <Text style={audioCallStyles.callStatus}>Audio Call</Text>
//           <Text style={audioCallStyles.duration}>{formatDuration(callDuration)}</Text>
//         </View>

//         <View style={audioCallStyles.userSection}>
//           <Image
//             source={{ uri: userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=200&background=fff&color=667eea` }}
//             style={audioCallStyles.avatar}
//           />
//           <Text style={audioCallStyles.userName}>{userName}</Text>
//           <Text style={audioCallStyles.callType}>Audio Call</Text>
//         </View>

//         <View style={audioCallStyles.controls}>
//           <TouchableOpacity 
//             style={[audioCallStyles.controlButton, isMuted && audioCallStyles.activeControl]}
//             onPress={toggleMute}
//           >
//             <Ionicons 
//               name={isMuted ? "mic-off" : "mic"} 
//               size={24} 
//               color="#fff" 
//             />
//           </TouchableOpacity>

//           <TouchableOpacity 
//             style={audioCallStyles.endCallButton}
//             onPress={handleEndCall}
//           >
//             <Ionicons name="call" size={28} color="#fff" />
//           </TouchableOpacity>

//           <TouchableOpacity 
//             style={[audioCallStyles.controlButton, isSpeakerOn && audioCallStyles.activeControl]}
//             onPress={toggleSpeaker}
//           >
//             <Ionicons 
//               name={isSpeakerOn ? "volume-high" : "volume-low"} 
//               size={24} 
//               color="#fff" 
//             />
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>
//     </View>
//   );
// };

// const audioCallStyles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   gradient: {
//     flex: 1,
//     justifyContent: 'space-between',
//     paddingVertical: 60,
//     paddingHorizontal: 30,
//   },
//   header: {
//     alignItems: 'center',
//   },
//   callStatus: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '500',
//     marginBottom: 8,
//   },
//   duration: {
//     color: 'rgba(255,255,255,0.8)',
//     fontSize: 16,
//   },
//   userSection: {
//     alignItems: 'center',
//     flex: 1,
//     justifyContent: 'center',
//   },
//   avatar: {
//     width: 150,
//     height: 150,
//     borderRadius: 75,
//     marginBottom: 20,
//     borderWidth: 4,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   userName: {
//     color: '#fff',
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   callType: {
//     color: 'rgba(255,255,255,0.8)',
//     fontSize: 16,
//   },
//   controls: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//   },
//   controlButton: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   activeControl: {
//     backgroundColor: 'rgba(255,255,255,0.3)',
//   },
//   endCallButton: {
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     backgroundColor: '#FF6B6B',
//     alignItems: 'center',
//     justifyContent: 'center',
//     transform: [{ rotate: '135deg' }],
//   },
// });

// export default AudioCallScreen;