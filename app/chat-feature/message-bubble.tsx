
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { formatMessageTime } from '../utils/timeUtils';

const { width: screenWidth } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = screenWidth * 0.75;

export const MessageBubble = ({
  message,
  isCurrentUser,
  showAvatar = false,
  showTimestamp = true,
  isConsecutive = false,
  onLongPress,
  onPress,
  onReaction,
  onReply,
  isSelected = false,
  isFirstInGroup = false,
  isLastInGroup = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  const handlePress = () => {
    if (onPress) {
      onPress(message);
    } else {
      // Default press behavior - show/hide details
      setShowDetails(!showDetails);
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(message);
    } else {
      // Default long press with haptic feedback
      showMessageOptions();
    }
  };

  const showMessageOptions = () => {
    const options = [
      { text: 'Copy', onPress: () => handleCopy() },
      { text: 'Reply', onPress: () => handleReply() },
    ];

    if (isCurrentUser) {
      options.push(
        { text: 'Edit', onPress: () => handleEdit() },
        { text: 'Delete', onPress: () => handleDelete(), style: 'destructive' }
      );
    } else {
      options.push({ text: 'Forward', onPress: () => handleForward() });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Message Options', '', options);
  };

  const handleCopy = () => {
    // Copy message content to clipboard
    Toast.show({
      type: 'success',
      text1: 'Copied',
      text2: 'Message copied to clipboard',
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const handleReply = () => {
    onReply?.(message);
    Toast.show({
      type: 'info',
      text1: 'Reply Mode',
      text2: 'Replying to message',
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const handleEdit = () => {
    Toast.show({
      type: 'info',
      text1: 'Edit Mode',
      text2: 'Edit message feature coming soon',
      position: 'bottom',
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Toast.show({
              type: 'success',
              text1: 'Deleted',
              text2: 'Message deleted successfully',
              position: 'bottom',
            });
          },
        },
      ]
    );
  };

  const handleForward = () => {
    Toast.show({
      type: 'info',
      text1: 'Forward',
      text2: 'Forward feature coming soon',
      position: 'bottom',
    });
  };

  const handleReaction = (emoji) => {
    onReaction?.(message.id, emoji);
    Toast.show({
      type: 'success',
      text1: 'Reaction Added',
      text2: `Reacted with ${emoji}`,
      position: 'bottom',
      visibilityTime: 1500,
    });
  };

  const detectLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <Text
            key={index}
            style={styles.link}
            onPress={() => {
              Linking.openURL(part).catch(() => {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: 'Unable to open link',
                  position: 'bottom',
                });
              });
            }}
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const getMessageStatus = () => {
    if (!isCurrentUser || !message.status) return null;

    const statusConfig = {
      sending: { icon: 'time-outline', color: '#8E8E93' },
      sent: { icon: 'checkmark', color: '#8E8E93' },
      delivered: { icon: 'checkmark-done', color: '#8E8E93' },
      read: { icon: 'checkmark-done', color: '#007AFF' },
      failed: { icon: 'alert-circle', color: '#FF3B30' },
    };

    const config = statusConfig[message.status] || statusConfig.sent;

    return (
      <Ionicons
        name={config.icon}
        size={14}
        color={config.color}
        style={styles.statusIcon}
      />
    );
  };

  const renderAvatar = () => {
    if (!showAvatar || isCurrentUser) return null;

    return (
      <View style={styles.avatarContainer}>
        {message.sender?.profile_picture && !imageError ? (
          <Image
            source={{ uri: message.sender.profile_picture }}
            style={styles.avatar}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {message.sender?.first_name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    return (
      <View style={styles.reactionsContainer}>
        {message.reactions.map((reaction, index) => (
          <TouchableOpacity
            key={index}
            style={styles.reactionBubble}
            onPress={() => handleReaction(reaction.emoji)}
          >
            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
            <Text style={styles.reactionCount}>{reaction.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMessageContent = () => {
    // Handle different message types
    switch (message.type) {
      case 'image':
        return (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: message.content }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {message.caption && (
              <Text style={[styles.messageText, styles.caption]}>
                {detectLinks(message.caption)}
              </Text>
            )}
          </View>
        );
      
      case 'file':
        return (
          <View style={styles.fileContainer}>
            <Ionicons name="document" size={24} color="#007AFF" />
            <Text style={styles.fileName}>{message.fileName || 'Document'}</Text>
            <Text style={styles.fileSize}>{message.fileSize || ''}</Text>
          </View>
        );
      
      case 'audio':
        return (
          <View style={styles.audioContainer}>
            <Ionicons name="play-circle" size={32} color="#007AFF" />
            <Text style={styles.audioDuration}>{message.duration || '0:00'}</Text>
          </View>
        );
      
      default:
        return (
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {detectLinks(message.content)}
          </Text>
        );
    }
  };

  const bubbleStyle = [
    styles.bubble,
    isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
    isFirstInGroup && (isCurrentUser ? styles.currentUserFirst : styles.otherUserFirst),
    isLastInGroup && (isCurrentUser ? styles.currentUserLast : styles.otherUserLast),
    isConsecutive && styles.consecutiveBubble,
    isSelected && styles.selectedBubble,
    message.status === 'failed' && styles.failedBubble,
  ];

  return (
    <Animated.View 
      style={[
        styles.container,
        isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      {renderAvatar()}
      
      <View style={styles.messageWrapper}>
        {/* Reply indicator */}
        {message.replyTo && (
          <View style={[styles.replyContainer, isCurrentUser && styles.currentUserReply]}>
            <View style={styles.replyLine} />
            <Text style={styles.replyText} numberOfLines={1}>
              {message.replyTo.content}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={bubbleStyle}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          delayLongPress={500}
          activeOpacity={0.8}
        >
          {renderMessageContent()}
          
          {/* Timestamp and status row */}
          {(showTimestamp || isCurrentUser) && (
            <View style={styles.metaContainer}>
              {showTimestamp && (
                <Text style={[
                  styles.timestamp,
                  isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp
                ]}>
                  {formatMessageTime(message.created_at)}
                </Text>
              )}
              {getMessageStatus()}
            </View>
          )}
        </TouchableOpacity>

        {renderReactions()}

        {/* Detailed info when pressed */}
        {showDetails && (
          <Animated.View style={[styles.detailsContainer, { opacity: fadeAnim }]}>
            <Text style={styles.detailsText}>
              Sent: {new Date(message.created_at).toLocaleString()}
            </Text>
            {message.edited_at && (
              <Text style={styles.detailsText}>
                Edited: {new Date(message.edited_at).toLocaleString()}
              </Text>
            )}
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 12,
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },

  // Avatar Styles
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Message Wrapper
  messageWrapper: {
    maxWidth: MAX_BUBBLE_WIDTH,
    alignItems: 'flex-end',
  },

  // Bubble Styles
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    marginLeft: 50,
  },
  otherUserBubble: {
    backgroundColor: '#E5E5EA',
    marginRight: 50,
  },
  consecutiveBubble: {
    marginTop: 1,
  },
  selectedBubble: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  failedBubble: {
    backgroundColor: '#FF3B30',
    opacity: 0.7,
  },

  // Bubble shapes for grouping
  currentUserFirst: {
    borderBottomRightRadius: 4,
  },
  currentUserLast: {
    borderTopRightRadius: 4,
  },
  otherUserFirst: {
    borderBottomLeftRadius: 4,
  },
  otherUserLast: {
    borderTopLeftRadius: 4,
  },

  // Message Content Styles
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#000000',
  },
  link: {
    textDecorationLine: 'underline',
    color: '#007AFF',
  },

  // Meta Information
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
    marginRight: 4,
  },
  currentUserTimestamp: {
    color: '#FFFFFF',
  },
  otherUserTimestamp: {
    color: '#8E8E93',
  },
  statusIcon: {
    marginLeft: 2,
  },

  // Media Content Styles
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: 200,
  },
  messageImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  caption: {
    marginTop: 4,
    fontSize: 14,
  },

  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
    color: '#007AFF',
  },
  fileSize: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },

  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  audioDuration: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },

  // Reply Styles
  replyContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    paddingLeft: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    padding: 6,
  },
  currentUserReply: {
    borderLeftColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  replyLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#007AFF',
  },
  replyText: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
  },

  // Reactions
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 2,
  },
  reactionCount: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Details
  detailsContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  detailsText: {
    fontSize: 11,
    color: '#8E8E93',
  },
});

// Message grouping utility function
export const groupMessages = (messages) => {
  if (!messages || messages.length === 0) return [];

  return messages.map((message, index) => {
    const prevMessage = messages[index - 1];
    const nextMessage = messages[index + 1];
    
    const isSameSender = prevMessage && prevMessage.sender_id === message.sender_id;
    const isNextSameSender = nextMessage && nextMessage.sender_id === message.sender_id;
    
    const timeDiff = prevMessage ? 
      new Date(message.created_at) - new Date(prevMessage.created_at) : 
      Infinity;
    
    const isConsecutive = isSameSender && timeDiff < 60000; // 1 minute
    const isFirstInGroup = !isConsecutive;
    const isLastInGroup = !isNextSameSender || 
      (nextMessage && new Date(nextMessage.created_at) - new Date(message.created_at) > 60000);

    return {
      ...message,
      showAvatar: isLastInGroup && !message.is_current_user,
      isConsecutive,
      isFirstInGroup,
      isLastInGroup,
    };
  });
};






















































// import React from 'react';
// import { View, Text, TouchableOpacity, Image } from 'react-native';
// import { formatMessageTime } from '../utils/timeUtils';

// export const MessageBubble = ({ 
//   message, 
//   isCurrentUser, 
//   showAvatar = false, 
//   onLongPress,
//   onPress 
// }) => {
//   return (
//     <View>
//       {showAvatar && !isCurrentUser && (
//         <View>
//           {message.sender?.profile_picture ? (
//             <Image
//               source={{ uri: message.sender.profile_picture }}
//             />
//           ) : (
//             <View>
//               <Text>
//                 {message.sender?.first_name?.[0]?.toUpperCase() || 'U'}
//               </Text>
//             </View>
//           )}
//         </View>
//       )}
      
//       <TouchableOpacity
//         onPress={onPress}
//         onLongPress={() => onLongPress?.(message)}
//         delayLongPress={300}
//       >
//         <Text>
//           {message.content}
//         </Text>
        
//         <View>
//           <Text>
//             {formatMessageTime(message.created_at)}
//           </Text>
          
//           {isCurrentUser && message.status && (
//             <Text>
//               {message.status === 'sent' ? '✓' : 
//                message.status === 'delivered' ? '✓✓' : 
//                message.status === 'read' ? '✓✓' : ''}
//             </Text>
//           )}
//         </View>
//       </TouchableOpacity>
//     </View>
//   );
// };

































// import React from 'react';
// import { View, Text, TouchableOpacity } from 'react-native';
// // import { chatStyles } from '../../styles/chatStyles';
// import { formatMessageTime } from '../utils/dateUtils';

// export const MessageBubble = ({ 
//   message, 
//   isCurrentUser, 
//   showAvatar = false, 
//   onLongPress,
//   onPress 
// }) => {
//   return (
//     <View style={[
//       chatStyles.messageContainer,
//       isCurrentUser ? chatStyles.currentUserMessage : chatStyles.otherUserMessage
//     ]}>
//       {showAvatar && !isCurrentUser && (
//         <View style={chatStyles.messageAvatar}>
//           {message.sender.profile_picture ? (
//             <Image
//               source={{ uri: message.sender.profile_picture }}
//               style={chatStyles.smallAvatar}
//             />
//           ) : (
//             <View style={[chatStyles.smallAvatar, chatStyles.defaultAvatar]}>
//               <Text style={chatStyles.smallAvatarText}>
//                 {message.sender.first_name?.[0]?.toUpperCase() || 'U'}
//               </Text>
//             </View>
//           )}
//         </View>
//       )}
      
//       <TouchableOpacity
//         style={[
//           chatStyles.messageBubble,
//           isCurrentUser ? chatStyles.currentUserBubble : chatStyles.otherUserBubble,
//           !showAvatar && !isCurrentUser && chatStyles.continuousMessage
//         ]}
//         onPress={onPress}
//         onLongPress={() => onLongPress?.(message)}
//         delayLongPress={300}
//       >
//         <Text style={[
//           chatStyles.messageText,
//           isCurrentUser ? chatStyles.currentUserText : chatStyles.otherUserText
//         ]}>
//           {message.content}
//         </Text>
        
//         <View style={chatStyles.messageFooter}>
//           <Text style={[
//             chatStyles.messageTime,
//             isCurrentUser ? chatStyles.currentUserTime : chatStyles.otherUserTime
//           ]}>
//             {formatMessageTime(message.created_at)}
//           </Text>
          
//           {isCurrentUser && message.status && (
//             <Text style={chatStyles.messageStatus}>
//               {message.status === 'sent' ? '✓' : 
//                message.status === 'delivered' ? '✓✓' : 
//                message.status === 'read' ? '✓✓' : ''}
//             </Text>
//           )}
//         </View>
//       </TouchableOpacity>
//     </View>
//   );
// };