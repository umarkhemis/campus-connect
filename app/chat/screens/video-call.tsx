


// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   StatusBar,
//   Alert,
//   Animated,
//   PanResponder,
//   Image,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useLocalSearchParams, router } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';
// import {
//   RTCView,
//   RTCPeerConnection,
//   RTCSessionDescription,
//   RTCIceCandidate,
//   mediaDevices,
// } from 'react-native-webrtc';

// const { width, height } = Dimensions.get('window');

// const VideoCallScreen = () => {
//   const params = useLocalSearchParams();
//   const { userId, userName, userAvatar, callType } = params;

//   // Call states
//   const [isConnected, setIsConnected] = useState(false);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isVideoOff, setIsVideoOff] = useState(false);
//   const [isSpeakerOn, setIsSpeakerOn] = useState(false);
//   const [callDuration, setCallDuration] = useState(0);
//   const [isConnecting, setIsConnecting] = useState(true);

//   // Animation states
//   const [controlsVisible, setControlsVisible] = useState(true);
//   const controlsOpacity = useRef(new Animated.Value(1)).current;
//   const pulseAnim = useRef(new Animated.Value(1)).current;

//   // WebRTC streams (if using WebRTC)
//   const [localStream, setLocalStream] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);

//   // Draggable local video position
//   const pan = useRef(new Animated.ValueXY()).current;
//   const panResponder = useRef(
//     PanResponder.create({
//       onMoveShouldSetPanResponder: () => true,
//       onPanResponderGrant: () => {
//         pan.setOffset({
//           x: pan.x._value,
//           y: pan.y._value,
//         });
//       },
//       onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
//         useNativeDriver: false,
//       }),
//       onPanResponderRelease: () => {
//         pan.flattenOffset();
//       },
//     })
//   ).current;

//   useEffect(() => {
//     initializeCall();
//     const timerCleanup = startCallTimer();
//     const controlsCleanup = startControlsAutoHide();
//     startPulseAnimation();

//     return () => {
//       endCall();
//       timerCleanup && timerCleanup();
//       controlsCleanup && controlsCleanup();
//     };
//   }, []);

//   const initializeCall = async () => {
//     try {
//       // Simulate connection delay
//       setTimeout(() => {
//         setIsConnecting(false);
//         setIsConnected(true);
//       }, 3000);

//       // Initialize WebRTC if using it
//       // await initializeWebRTC();
      
//     } catch (error) {
//       console.error('Failed to initialize call:', error);
//       Alert.alert('Call Failed', 'Unable to connect to the call', [
//         { text: 'OK', onPress: () => router.back() }
//       ]);
//     }
//   };

//   const initializeWebRTC = async () => {
//     try {
//       // Get user media
//       const stream = await mediaDevices.getUserMedia({
//         audio: true,
//         video: true,
//       });
//       setLocalStream(stream);

//       // Create peer connection
//       const configuration = {
//         iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
//       };
//       const peerConnection = new RTCPeerConnection(configuration);

//       // Add local stream to peer connection
//       stream.getTracks().forEach(track => {
//         peerConnection.addTrack(track, stream);
//       });

//       // Handle remote stream
//       peerConnection.ontrack = (event) => {
//         setRemoteStream(event.streams[0]);
//       };

//       // Handle signaling here (WebSocket, Socket.io, etc.)
      
//     } catch (error) {
//       throw new Error('Failed to initialize WebRTC');
//     }
//   };

//   const startCallTimer = () => {
//     const interval = setInterval(() => {
//       setCallDuration(prev => prev + 1);
//     }, 1000);

//     return () => clearInterval(interval);
//   };

//   const startControlsAutoHide = () => {
//     const timer = setTimeout(() => {
//       hideControls();
//     }, 5000);

//     return () => clearTimeout(timer);
//   };

//   const startPulseAnimation = () => {
//     const pulse = () => {
//       Animated.sequence([
//         Animated.timing(pulseAnim, {
//           toValue: 1.1,
//           duration: 1000,
//           useNativeDriver: true,
//         }),
//         Animated.timing(pulseAnim, {
//           toValue: 1,
//           duration: 1000,
//           useNativeDriver: true,
//         }),
//       ]).start(() => {
//         if (isConnecting) pulse();
//       });
//     };
//     pulse();
//   };

//   const formatCallDuration = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const toggleControls = () => {
//     if (controlsVisible) {
//       hideControls();
//     } else {
//       showControls();
//     }
//   };

//   const showControls = () => {
//     setControlsVisible(true);
//     Animated.timing(controlsOpacity, {
//       toValue: 1,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
//   };

//   const hideControls = () => {
//     Animated.timing(controlsOpacity, {
//       toValue: 0,
//       duration: 300,
//       useNativeDriver: true,
//     }).start(() => {
//       setControlsVisible(false);
//     });
//   };

//   const toggleMute = () => {
//     setIsMuted(!isMuted);
//     // Implement actual mute functionality
//     if (localStream) {
//       localStream.getAudioTracks().forEach(track => {
//         track.enabled = isMuted;
//       });
//     }
//   };

//   const toggleVideo = () => {
//     setIsVideoOff(!isVideoOff);
//     // Implement actual video toggle functionality
//     if (localStream) {
//       localStream.getVideoTracks().forEach(track => {
//         track.enabled = isVideoOff;
//       });
//     }
//   };

//   const toggleSpeaker = () => {
//     setIsSpeakerOn(!isSpeakerOn);
//     // Implement speaker toggle functionality
//     // This would typically involve native audio routing
//   };

//   const endCall = () => {
//     // Clean up streams
//     if (localStream) {
//       localStream.getTracks().forEach(track => track.stop());
//     }
//     if (remoteStream) {
//       remoteStream.getTracks().forEach(track => track.stop());
//     }
    
//     // Navigate back
//     router.back();
//   };

//   const handleEndCall = () => {
//     Alert.alert(
//       'End Call',
//       'Are you sure you want to end this call?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'End Call', style: 'destructive', onPress: endCall }
//       ]
//     );
//   };

//   const switchCamera = () => {
//     // Implement camera switching functionality
//     if (localStream) {
//       // This would typically involve getting a new stream from the opposite camera
//       console.log('Switching camera...');
//     }
//   };

//   const renderConnectingScreen = () => (
//     <View style={styles.connectingContainer}>
//       <LinearGradient
//         colors={['#667eea', '#764ba2']}
//         style={styles.backgroundGradient}
//       >
//         <View style={styles.connectingContent}>
//           <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
//             {userAvatar ? (
//               <Image source={{ uri: userAvatar }} style={styles.avatar} />
//             ) : (
//               <View style={styles.avatarPlaceholder}>
//                 <Ionicons name="person" size={60} color="#fff" />
//               </View>
//             )}
//           </Animated.View>
//           <Text style={styles.connectingName}>{userName}</Text>
//           <Text style={styles.connectingStatus}>Connecting...</Text>
//         </View>
//       </LinearGradient>
//     </View>
//   );

//   const renderVideoCall = () => (
//     <View style={styles.container}>
//       {/* Remote video (full screen) */}
//       <TouchableOpacity 
//         style={styles.remoteVideoContainer} 
//         activeOpacity={1}
//         onPress={toggleControls}
//       >
//         {/* Replace with RTCView when using WebRTC */}
//         {/* <RTCView streamURL={remoteStream?.toURL()} style={styles.remoteVideo} /> */}
//         <View style={styles.remoteVideoPlaceholder}>
//           <Ionicons name="videocam" size={100} color="rgba(255,255,255,0.3)" />
//         </View>
//       </TouchableOpacity>

//       {/* Local video (draggable) */}
//       <Animated.View
//         style={[
//           styles.localVideoContainer,
//           { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
//         ]}
//         {...panResponder.panHandlers}
//       >
//         {!isVideoOff ? (
//           <View style={styles.localVideoPlaceholder}>
//             {/* Replace with RTCView when using WebRTC */}
//             {/* <RTCView streamURL={localStream?.toURL()} style={styles.localVideo} /> */}
//             <Ionicons name="videocam" size={30} color="rgba(255,255,255,0.8)" />
//           </View>
//         ) : (
//           <View style={styles.localVideoOff}>
//             <Ionicons name="videocam-off" size={30} color="#fff" />
//           </View>
//         )}
//       </Animated.View>

//       {/* Controls overlay */}
//       <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
//         <BlurView intensity={20} tint="dark" style={styles.topControls}>
//           <View style={styles.callInfo}>
//             <Text style={styles.callerName}>{userName}</Text>
//             <Text style={styles.callDuration}>{formatCallDuration(callDuration)}</Text>
//           </View>
//         </BlurView>

//         <View style={styles.bottomControls}>
//           <BlurView intensity={20} tint="dark" style={styles.controlsContainer}>
//             <TouchableOpacity
//               style={[styles.controlButton, isMuted && styles.activeButton]}
//               onPress={toggleMute}
//             >
//               <Ionicons 
//                 name={isMuted ? "mic-off" : "mic"} 
//                 size={24} 
//                 color={isMuted ? "#ff4757" : "#fff"} 
//               />
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.controlButton, styles.endCallButton]}
//               onPress={handleEndCall}
//             >
//               <Ionicons name="call" size={28} color="#fff" />
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.controlButton, isVideoOff && styles.activeButton]}
//               onPress={toggleVideo}
//             >
//               <Ionicons 
//                 name={isVideoOff ? "videocam-off" : "videocam"} 
//                 size={24} 
//                 color={isVideoOff ? "#ff4757" : "#fff"} 
//               />
//             </TouchableOpacity>
//           </BlurView>

//           <BlurView intensity={20} tint="dark" style={styles.secondaryControls}>
//             <TouchableOpacity
//               style={[styles.secondaryButton, isSpeakerOn && styles.activeSecondaryButton]}
//               onPress={toggleSpeaker}
//             >
//               <Ionicons 
//                 name={isSpeakerOn ? "volume-high" : "volume-low"} 
//                 size={20} 
//                 color={isSpeakerOn ? "#2ed573" : "#fff"} 
//               />
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.secondaryButton}
//               onPress={switchCamera}
//             >
//               <Ionicons name="camera-reverse" size={20} color="#fff" />
//             </TouchableOpacity>
//           </BlurView>
//         </View>
//       </Animated.View>
//     </View>
//   );

//   return (
//     <View style={styles.wrapper}>
//       <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
//       {isConnecting ? renderConnectingScreen() : renderVideoCall()}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   wrapper: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   connectingContainer: {
//     flex: 1,
//   },
//   backgroundGradient: {
//     flex: 1,
//   },
//   connectingContent: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   avatarContainer: {
//     marginBottom: 30,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     borderWidth: 4,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   avatarPlaceholder: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 4,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   connectingName: {
//     fontSize: 28,
//     fontWeight: '600',
//     color: '#fff',
//     marginBottom: 10,
//   },
//   connectingStatus: {
//     fontSize: 16,
//     color: 'rgba(255,255,255,0.8)',
//   },
//   remoteVideoContainer: {
//     flex: 1,
//     backgroundColor: '#1e1e1e',
//   },
//   remoteVideo: {
//     flex: 1,
//   },
//   remoteVideoPlaceholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#2c2c2c',
//   },
//   localVideoContainer: {
//     position: 'absolute',
//     top: 100,
//     right: 20,
//     width: 120,
//     height: 160,
//     borderRadius: 12,
//     overflow: 'hidden',
//     borderWidth: 2,
//     borderColor: 'rgba(255,255,255,0.3)',
//   },
//   localVideo: {
//     width: '100%',
//     height: '100%',
//   },
//   localVideoPlaceholder: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: '#3c3c3c',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   localVideoOff: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: '#1e1e1e',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   controlsOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'space-between',
//   },
//   topControls: {
//     paddingTop: StatusBar.currentHeight || 44,
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },
//   callInfo: {
//     alignItems: 'center',
//   },
//   callerName: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   callDuration: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//   },
//   bottomControls: {
//     alignItems: 'center',
//     paddingBottom: 50,
//   },
//   controlsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 30,
//     paddingVertical: 20,
//     borderRadius: 25,
//     marginBottom: 20,
//   },
//   controlButton: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginHorizontal: 15,
//   },
//   activeButton: {
//     backgroundColor: 'rgba(255, 71, 87, 0.8)',
//   },
//   endCallButton: {
//     backgroundColor: '#ff4757',
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     transform: [{ rotate: '135deg' }],
//   },
//   secondaryControls: {
//     flexDirection: 'row',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 20,
//   },
//   secondaryButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginHorizontal: 8,
//   },
//   activeSecondaryButton: {
//     backgroundColor: 'rgba(46, 213, 115, 0.3)',
//   },
// });

// export default VideoCallScreen;