

import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import { formatMessageTime } from '../utils/dateUtils';
import { isCurrentUser } from '../utils/messageUtils';

const MessageBubble = ({ message }) => {
  const isOwn = isCurrentUser(message.sender.id);
  
  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'text':
        return (
          <Text 
            style={[
              styles.messageText,
              isOwn ? styles.ownMessageText : styles.otherMessageText
            ]}
            
            textAlign="left"
            allowFontScaling={false}
          >
            {message.content}
          </Text>
        );
      case 'image':
        return (
          <Image 
            source={{ uri: message.file }} 
            style={styles.messageImage}
            resizeMode="cover"
          />
        );
      case 'file':
        return (
          <TouchableOpacity style={styles.fileContainer}>
            <Text 
              style={styles.fileName}
              textAlign="left"
              allowFontScaling={false}
            >
              📎 {message.file.split('/').pop()}
            </Text>
          </TouchableOpacity>
        );
      default:
        return (
          <Text 
            style={[
              styles.messageText,
              isOwn ? styles.ownMessageText : styles.otherMessageText
            ]}
            textAlign="left"
            allowFontScaling={false}
          >
            {message.content}
          </Text>
        );
    }
  };

  return (
    <View style={[
      styles.container,
      isOwn ? styles.ownMessage : styles.otherMessage,
      // Fix for inverted FlatList causing upside-down content
      Platform.OS === 'web' && styles.webFix
    ]}>
      <View style={[
        styles.bubble,
        isOwn ? styles.ownBubble : styles.otherBubble
      ]}>
        {renderMessageContent()}
        <View style={styles.messageInfo}>
          <Text style={[
            styles.timestamp,
            isOwn ? styles.ownTimestamp : styles.otherTimestamp
          ]}
          textAlign="left"
          allowFontScaling={false}
          >
            {formatMessageTime(message.created_at)}
          </Text>
          {isOwn && (
            <Text 
              style={styles.status}
              textAlign="right"
              allowFontScaling={false}
            >
              {message.is_read ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 4,
    // Ensure proper orientation
    flexDirection: 'column',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    // Ensure text flows correctly
    flexDirection: 'column',
  },
  ownBubble: {
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    // Fix text direction and alignment
    textAlign: 'left',
    writingDirection: 'ltr',
    ...(Platform.OS === 'web' && {
      direction: 'ltr',
    }),
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  fileContainer: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  fileName: {
    color: '#333',
    fontSize: 14,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  ownTimestamp: {
    color: '#fff',
  },
  otherTimestamp: {
    color: '#666',
  },
  status: {
    fontSize: 11,
    color: '#fff',
    marginLeft: 4,
    textAlign: 'right',
  },
  // Web-specific fix for inverted FlatList
  webFix: Platform.OS === 'web' ? {
    transform: [{ scaleY: 1 }], // Ensure no vertical flipping
  } : {},
});

export default MessageBubble;





































// import React from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   TouchableOpacity,
//   StyleSheet 
// } from 'react-native';
// import { formatMessageTime } from '../utils/dateUtils';
// import { isCurrentUser } from '../utils/messageUtils';

// const MessageBubble = ({ message }) => {
//   const isOwn = isCurrentUser(message.sender.id);
  
//   const renderMessageContent = () => {
//     switch (message.message_type) {
//       case 'text':
//         return <Text style={styles.messageText}>{message.content}</Text>;
//       case 'image':
//         return (
//           <Image 
//             source={{ uri: message.file }} 
//             style={styles.messageImage}
//             resizeMode="cover"
//           />
//         );
//       case 'file':
//         return (
//           <TouchableOpacity style={styles.fileContainer}>
//             <Text style={styles.fileName}>📎 {message.file.split('/').pop()}</Text>
//           </TouchableOpacity>
//         );
//       default:
//         return <Text style={styles.messageText}>{message.content}</Text>;
//     }
//   };

//   return (
//     <View style={[
//       styles.container,
//       isOwn ? styles.ownMessage : styles.otherMessage
//     ]}>
//       <View style={[
//         styles.bubble,
//         isOwn ? styles.ownBubble : styles.otherBubble
//       ]}>
//         {renderMessageContent()}
//         <View style={styles.messageInfo}>
//           <Text style={[
//             styles.timestamp,
//             isOwn ? styles.ownTimestamp : styles.otherTimestamp
//           ]}>
//             {formatMessageTime(message.created_at)}
//           </Text>
//           {isOwn && (
//             <Text style={styles.status}>
//               {message.is_read ? '✓✓' : '✓'}
//             </Text>
//           )}
//         </View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginVertical: 2,
//     paddingHorizontal: 4,
//   },
//   ownMessage: {
//     alignItems: 'flex-end',
//   },
//   otherMessage: {
//     alignItems: 'flex-start',
//   },
//   bubble: {
//     maxWidth: '80%',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 18,
//   },
//   ownBubble: {
//     backgroundColor: '#007AFF',
//   },
//   otherBubble: {
//     backgroundColor: '#E5E5EA',
//   },
//   messageText: {
//     fontSize: 16,
//     lineHeight: 20,
//   },
//   messageImage: {
//     width: 200,
//     height: 200,
//     borderRadius: 12,
//   },
//   fileContainer: {
//     padding: 8,
//     backgroundColor: 'rgba(255,255,255,0.1)',
//     borderRadius: 8,
//   },
//   fileName: {
//     color: '#333',
//     fontSize: 14,
//   },
//   messageInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 4,
//     justifyContent: 'space-between',
//   },
//   timestamp: {
//     fontSize: 11,
//     opacity: 0.7,
//   },
//   ownTimestamp: {
//     color: '#fff',
//   },
//   otherTimestamp: {
//     color: '#666',
//   },
//   status: {
//     fontSize: 11,
//     color: '#fff',
//     marginLeft: 4,
//   },
// });

// export default MessageBubble;