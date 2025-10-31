

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  Text,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
// import * as DocumentPicker from 'expo-document-picker';
// import * as Audio from 'expo-av';
import Toast from 'react-native-toast-message';

const { width: screenWidth } = Dimensions.get('window');

// Chat Constants
export const CHAT_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 4000,
  TYPING_TIMEOUT: 3000, // 3 seconds
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov', 'avi', 'mkv'],
  SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'm4a', 'aac'],
  SUPPORTED_DOCUMENT_FORMATS: ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'ppt'],
  MAX_AUDIO_DURATION: 300, // 5 minutes in seconds
  IMAGE_QUALITY: 0.8,
  IMAGE_MAX_WIDTH: 1920,
  IMAGE_MAX_HEIGHT: 1920,
  VOICE_MESSAGE_SAMPLE_RATE: 44100,
  VOICE_MESSAGE_CHANNELS: 1,
  VOICE_MESSAGE_BITRATE: 128000,
};

export const MessageInput = ({
  onSendMessage,
  onSendMedia,
  onSendVoice,
  onTypingStart,
  onTypingStop,
  sending = false,
  disabled = false,
  replyToMessage = null,
  onCancelReply,
  placeholder = "Type a message...",
  showAttachments = true,
  showVoiceNote = true,
  maxLines = 5,
}) => {
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recordingRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation for recording button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handleInputChange = (text) => {
    if (text.length > CHAT_CONSTANTS.MAX_MESSAGE_LENGTH) {
      Toast.show({
        type: 'error',
        text1: 'Message Too Long',
        text2: `Maximum ${CHAT_CONSTANTS.MAX_MESSAGE_LENGTH} characters allowed`,
        position: 'bottom',
      });
      return;
    }

    setInputText(text);

    // Handle typing indicators
    if (text.length > 0 && inputText.length === 0) {
      onTypingStart?.();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout for typing stop
    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop?.();
      }, CHAT_CONSTANTS.TYPING_TIMEOUT);
    } else {
      onTypingStop?.();
    }
  };

  const handleContentSizeChange = (event) => {
    const { height } = event.nativeEvent.contentSize;
    const maxHeight = 20 * maxLines + 20; // Approximate line height * maxLines + padding
    const newHeight = Math.min(Math.max(height, 40), maxHeight);
    setInputHeight(newHeight);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending || disabled) return;

    const messageText = inputText.trim();
    setInputText('');
    setInputHeight(40);
    onTypingStop?.();

    try {
      await onSendMessage(messageText, replyToMessage?.id);
      onCancelReply?.();
      
      Toast.show({
        type: 'success',
        text1: 'Message Sent',
        position: 'bottom',
        visibilityTime: 1500,
      });
    } catch (error) {
      // Restore message text if sending failed
      setInputText(messageText);
      Toast.show({
        type: 'error',
        text1: 'Send Failed',
        text2: 'Failed to send message. Please try again.',
        position: 'bottom',
      });
    }
  };

  const showAttachmentOptions = () => {
    const options = [
      'Camera',
      'Photo Library',
      'Document',
      'Location',
      'Cancel'
    ];

    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: 'Send Media',
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0:
              openCamera();
              break;
            case 1:
              openImagePicker();
              break;
            case 2:
              openDocumentPicker();
              break;
            case 3:
              sendLocation();
              break;
          }
        }
      );
    } else {
      Alert.alert(
        'Send Media',
        'Choose an option',
        [
          { text: 'Camera', onPress: openCamera },
          { text: 'Photo Library', onPress: openImagePicker },
          { text: 'Document', onPress: openDocumentPicker },
          { text: 'Location', onPress: sendLocation },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant camera permission to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: CHAT_CONSTANTS.IMAGE_QUALITY,
        maxWidth: CHAT_CONSTANTS.IMAGE_MAX_WIDTH,
        maxHeight: CHAT_CONSTANTS.IMAGE_MAX_HEIGHT,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        await handleMediaSelection(result.assets[0]);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Camera Error',
        text2: 'Failed to open camera. Please try again.',
        position: 'bottom',
      });
    }
  };

  const openImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant photo library permission to select images.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: CHAT_CONSTANTS.IMAGE_QUALITY,
        maxWidth: CHAT_CONSTANTS.IMAGE_MAX_WIDTH,
        maxHeight: CHAT_CONSTANTS.IMAGE_MAX_HEIGHT,
        allowsEditing: true,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        await handleMediaSelection(result.assets[0]);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Gallery Error',
        text2: 'Failed to open photo library. Please try again.',
        position: 'bottom',
      });
    }
  };

  const openDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        if (result.size > CHAT_CONSTANTS.MAX_FILE_SIZE) {
          Toast.show({
            type: 'error',
            text1: 'File Too Large',
            text2: `Maximum file size is ${CHAT_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB`,
            position: 'bottom',
          });
          return;
        }

        await handleDocumentSelection(result);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Document Error',
        text2: 'Failed to select document. Please try again.',
        position: 'bottom',
      });
    }
  };

  const handleMediaSelection = async (asset) => {
    try {
      await onSendMedia?.(asset);
      Toast.show({
        type: 'success',
        text1: 'Media Sent',
        position: 'bottom',
        visibilityTime: 1500,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Send Failed',
        text2: 'Failed to send media. Please try again.',
        position: 'bottom',
      });
    }
  };

  const handleDocumentSelection = async (document) => {
    try {
      await onSendMedia?.(document);
      Toast.show({
        type: 'success',
        text1: 'Document Sent',
        position: 'bottom',
        visibilityTime: 1500,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Send Failed',
        text2: 'Failed to send document. Please try again.',
        position: 'bottom',
      });
    }
  };

  const sendLocation = () => {
    Toast.show({
      type: 'info',
      text1: 'Coming Soon',
      text2: 'Location sharing will be available soon',
      position: 'bottom',
    });
  };

  const startVoiceRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant microphone permission to record voice messages.',
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: CHAT_CONSTANTS.VOICE_MESSAGE_SAMPLE_RATE,
          numberOfChannels: CHAT_CONSTANTS.VOICE_MESSAGE_CHANNELS,
          bitRate: CHAT_CONSTANTS.VOICE_MESSAGE_BITRATE,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: CHAT_CONSTANTS.VOICE_MESSAGE_SAMPLE_RATE,
          numberOfChannels: CHAT_CONSTANTS.VOICE_MESSAGE_CHANNELS,
          bitRate: CHAT_CONSTANTS.VOICE_MESSAGE_BITRATE,
        },
      });

      await recording.startAsync();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingRef.current = recording;

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= CHAT_CONSTANTS.MAX_AUDIO_DURATION) {
            stopVoiceRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Recording Error',
        text2: 'Failed to start voice recording',
        position: 'bottom',
      });
    }
  };

  const stopVoiceRecording = async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      
      if (uri && recordingDuration > 1) { // At least 1 second
        await onSendVoice?.(uri, recordingDuration);
        Toast.show({
          type: 'success',
          text1: 'Voice Message Sent',
          position: 'bottom',
          visibilityTime: 1500,
        });
      }
      
      recordingRef.current = null;
      setRecordingDuration(0);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Recording Error',
        text2: 'Failed to stop voice recording',
        position: 'bottom',
      });
    }
  };

  const cancelVoiceRecording = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
      }
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      recordingRef.current = null;
      setRecordingDuration(0);
    } catch (error) {
      console.log('Error canceling recording:', error);
    }
  };

  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const canSend = inputText.trim().length > 0 && !sending && !disabled;
  const showVoiceButton = showVoiceNote && inputText.trim().length === 0 && !sending;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Reply Preview */}
      {replyToMessage && (
        <View style={styles.replyContainer}>
          <View style={styles.replyContent}>
            <Text style={styles.replyToText}>
              Replying to {replyToMessage.sender?.first_name || 'User'}
            </Text>
            <Text style={styles.replyMessageText} numberOfLines={1}>
              {replyToMessage.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyButton}>
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      )}

      {/* Voice Recording UI */}
      {isRecording && (
        <View style={styles.recordingContainer}>
          <TouchableOpacity onPress={cancelVoiceRecording} style={styles.cancelRecordingButton}>
            <Ionicons name="trash" size={24} color="#FF3B30" />
          </TouchableOpacity>
          
          <View style={styles.recordingInfo}>
            <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.recordingText}>Recording...</Text>
            <Text style={styles.recordingTime}>{formatRecordingTime(recordingDuration)}</Text>
          </View>
          
          <TouchableOpacity onPress={stopVoiceRecording} style={styles.stopRecordingButton}>
            <Ionicons name="send" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Input Container */}
      {!isRecording && (
        <View style={styles.inputContainer}>
          {/* Attachment Button */}
          {showAttachments && (
            <TouchableOpacity
              onPress={showAttachmentOptions}
              style={styles.attachmentButton}
              disabled={disabled}
            >
              <Ionicons
                name="add-circle"
                size={28}
                color={disabled ? '#C7C7CC' : '#007AFF'}
              />
            </TouchableOpacity>
          )}

          {/* Text Input */}
          <View style={[styles.textInputContainer, { height: inputHeight }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { height: inputHeight - 16 }]}
              placeholder={placeholder}
              placeholderTextColor="#8E8E93"
              value={inputText}
              onChangeText={handleInputChange}
              onContentSizeChange={handleContentSizeChange}
              multiline
              maxLength={CHAT_CONSTANTS.MAX_MESSAGE_LENGTH}
              editable={!disabled && !isRecording}
              textAlignVertical="top"
              returnKeyType="default"
              blurOnSubmit={false}
            />
            
            {/* Character Count */}
            {inputText.length > CHAT_CONSTANTS.MAX_MESSAGE_LENGTH * 0.8 && (
              <Text style={[
                styles.characterCount,
                inputText.length >= CHAT_CONSTANTS.MAX_MESSAGE_LENGTH && styles.characterCountLimit
              ]}>
                {inputText.length}/{CHAT_CONSTANTS.MAX_MESSAGE_LENGTH}
              </Text>
            )}
          </View>

          {/* Send/Voice Button */}
          {showVoiceButton ? (
            <TouchableOpacity
              onPressIn={startVoiceRecording}
              style={styles.voiceButton}
              disabled={disabled}
            >
              <Ionicons name="mic" size={24} color="#007AFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSendMessage}
              style={[styles.sendButton, canSend && styles.sendButtonActive]}
              disabled={!canSend}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  // Reply Styles
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  replyContent: {
    flex: 1,
    marginRight: 12,
  },
  replyToText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  replyMessageText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  cancelReplyButton: {
    padding: 4,
  },

  // Voice Recording Styles
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  cancelRecordingButton: {
    padding: 8,
    marginRight: 12,
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    marginRight: 12,
  },
  recordingTime: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  stopRecordingButton: {
    padding: 8,
    marginLeft: 12,
  },

  // Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 56,
  },
  attachmentButton: {
    padding: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    minHeight: 40,
    maxHeight: 120,
    justifyContent: 'center',
    position: 'relative',
  },
  textInput: {
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'center',
    includeFontPadding: false,
    ...Platform.select({
      ios: {
        paddingTop: 0,
        paddingBottom: 0,
      },
      android: {
        paddingVertical: 0,
        textAlignVertical: 'center',
      },
    }),
  },
  characterCount: {
    position: 'absolute',
    bottom: 2,
    right: 8,
    fontSize: 10,
    color: '#8E8E93',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  characterCountLimit: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
});


































































// import React, { useState, useRef } from 'react';
// import { 
//   View, 
//   TextInput, 
//   TouchableOpacity, 
//   ActivityIndicator,
//   Alert 
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { launchImagePicker } from 'react-native-image-picker';
// import { CHAT_CONSTANTS } from '../constants/chatConstants';

// export const MessageInput = ({ 
//   onSendMessage, 
//   onTypingStart, 
//   onTypingStop,
//   sending = false,
//   disabled = false 
// }) => {
//   const [inputText, setInputText] = useState('');
//   const inputRef = useRef(null);

//   const handleInputChange = (text) => {
//     setInputText(text);
    
//     if (text.length === 1 && onTypingStart) {
//       onTypingStart();
//     } else if (text.length === 0 && onTypingStop) {
//       onTypingStop();
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!inputText.trim() || sending || disabled) return;
    
//     const messageText = inputText.trim();
//     setInputText('');
//     onTypingStop?.();
    
//     try {
//       await onSendMessage(messageText);
//     } catch (error) {
//       // Restore message text if sending failed
//       setInputText(messageText);
//       Alert.alert('Error', 'Failed to send message. Please try again.');
//     }
//   };

//   const handleImagePicker = () => {
//     const options = {
//       mediaType: 'photo',
//       quality: 0.7,
//       maxWidth: 1024,
//       maxHeight: 1024,
//     };
    
//     launchImagePicker(options, (response) => {
//       if (response.assets && response.assets[0]) {
//         const asset = response.assets[0];
//         onSendMessage('', 'image', asset);
//       }
//     });
//   };

//   const canSend = inputText.trim().length > 0 && !sending && !disabled;

//   return (
//     <View>
//       <TouchableOpacity 
//         onPress={handleImagePicker}
//         disabled={disabled}
//       >
//         <Icon name="attach-file" size={24} color={disabled ? '#C7C7CC' : '#007AFF'} />
//       </TouchableOpacity>
      
//       <TextInput
//         ref={inputRef}
//         placeholder="Type a message..."
//         placeholderTextColor="#C7C7CC"
//         value={inputText}
//         onChangeText={handleInputChange}
//         multiline
//         maxLength={CHAT_CONSTANTS.MAX_MESSAGE_LENGTH}
//         editable={!disabled}
//         onFocus={onTypingStart}
//         onBlur={onTypingStop}
//       />
      
//       <TouchableOpacity
//         onPress={handleSendMessage}
//         disabled={!canSend}
//       >
//         {sending ? (
//           <ActivityIndicator size="small" color="#FFFFFF" />
//         ) : (
//           <Icon name="send" size={20} color={canSend ? '#FFFFFF' : '#C7C7CC'} />
//         )}
//       </TouchableOpacity>
//     </View>
//   );
// };




































// // components/chat/MessageInput.js
// import React, { useState, useRef } from 'react';
// import { 
//   View, 
//   TextInput, 
//   TouchableOpacity, 
//   ActivityIndicator,
//   Alert 
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { launchImagePicker } from 'react-native-image-picker';
// // import { chatStyles } from '../../styles/chatStyles';
// import { CHAT_CONSTANTS } from '../constants/chatConstants';

// export const MessageInput = ({ 
//   onSendMessage, 
//   onTypingStart, 
//   onTypingStop,
//   sending = false,
//   disabled = false 
// }) => {
//   const [inputText, setInputText] = useState('');
//   const inputRef = useRef(null);

//   const handleInputChange = (text) => {
//     setInputText(text);
    
//     if (text.length === 1 && onTypingStart) {
//       onTypingStart();
//     } else if (text.length === 0 && onTypingStop) {
//       onTypingStop();
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!inputText.trim() || sending || disabled) return;
    
//     const messageText = inputText.trim();
//     setInputText('');
//     onTypingStop?.();
    
//     try {
//       await onSendMessage(messageText);
//     } catch (error) {
//       // Restore message text if sending failed
//       setInputText(messageText);
//       Alert.alert('Error', 'Failed to send message. Please try again.');
//     }
//   };

//   const handleImagePicker = () => {
//     const options = {
//       mediaType: 'photo',
//       quality: 0.7,
//       maxWidth: 1024,
//       maxHeight: 1024,
//     };
    
//     launchImagePicker(options, (response) => {
//       if (response.assets && response.assets[0]) {
//         const asset = response.assets[0];
//         // Handle image sending
//         onSendMessage('', 'image', asset);
//       }
//     });
//   };

//   const canSend = inputText.trim().length > 0 && !sending && !disabled;

//   return (
//     <View style={chatStyles.inputContainer}>
//       <TouchableOpacity 
//         style={chatStyles.attachButton} 
//         onPress={handleImagePicker}
//         disabled={disabled}
//       >
//         <Icon name="attach-file" size={24} color={disabled ? '#C7C7CC' : '#007AFF'} />
//       </TouchableOpacity>
      
//       <TextInput
//         ref={inputRef}
//         style={[chatStyles.textInput, disabled && chatStyles.textInputDisabled]}
//         placeholder="Type a message..."
//         placeholderTextColor="#C7C7CC"
//         value={inputText}
//         onChangeText={handleInputChange}
//         multiline
//         maxLength={CHAT_CONSTANTS.MAX_MESSAGE_LENGTH}
//         editable={!disabled}
//         onFocus={onTypingStart}
//         onBlur={onTypingStop}
//       />
      
//       <TouchableOpacity
//         style={[
//           chatStyles.sendButton,
//           !canSend && chatStyles.sendButtonDisabled
//         ]}
//         onPress={handleSendMessage}
//         disabled={!canSend}
//       >
//         {sending ? (
//           <ActivityIndicator size="small" color="#FFFFFF" />
//         ) : (
//           <Icon name="send" size={20} color={canSend ? '#FFFFFF' : '#C7C7CC'} />
//         )}
//       </TouchableOpacity>
//     </View>
//   );
// };