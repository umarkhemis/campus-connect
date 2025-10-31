

import React, { useRef, useEffect } from 'react';
import { 
  FlatList, 
  View, 
  StyleSheet,
  RefreshControl, 
  Text
} from 'react-native';
import MessageBubble from './message-bubble';
import { groupMessagesByDate } from '../utils/chatUtils';

const ChatRoom = ({ messages, loading, onLoadMore, hasMoreMessages }) => {
  const flatListRef = useRef(null);
  
  // Reverse messages so newest appear at bottom (normal chat behavior)
  const reversedMessages = [...messages].reverse();
  
  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      // Use scrollToEnd instead of scrollToIndex for better performance
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const renderMessage = ({ item }) => (
    <MessageBubble message={item} />
  );

  const handleLoadMore = () => {
    if (hasMoreMessages && !loading) {
      onLoadMore();
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={reversedMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={handleLoadMore}
            title="Loading more messages..."
            tintColor="#007AFF"
            titleColor="#007AFF"
          />
        }
        style={styles.flatList}
        contentContainerStyle={styles.contentContainer}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100
        }}
        // Remove inverted and all transform styles
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  flatList: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateText: {
    backgroundColor: '#e0e0e0',
    color: '#666',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default ChatRoom;

























// import React, { useRef, useEffect } from 'react';
// import { 
//   FlatList, 
//   View, 
//   StyleSheet,
//   RefreshControl, 
//   Platform
// } from 'react-native';
// import MessageBubble from './message-bubble';
// import { groupMessagesByDate } from '../utils/chatUtils';

// const ChatRoom = ({ messages, loading, onLoadMore }) => {
//   const flatListRef = useRef(null);
//   const groupedMessages = groupMessagesByDate(messages);

//   useEffect(() => {
//     // Auto-scroll to bottom when new messages arrive
//     if (messages.length > 0) {
//       flatListRef.current?.scrollToIndex({ index: 0, animated: true });
//     }
//   }, [messages.length]);

//   const renderMessage = ({ item }) => (
//     <MessageBubble message={item} />
//   );

//   const renderDateSeparator = (date) => (
//     <View style={styles.dateSeparator}>
//       <Text style={styles.dateText}>{date}</Text>
//     </View>
//   );

//   return (
//     <FlatList
//       ref={flatListRef}
//       data={messages}
//       renderItem={renderMessage}
//       keyExtractor={(item) => item.id}
//       inverted
//       showsVerticalScrollIndicator={false}
//       onEndReached={onLoadMore}
//       onEndReachedThreshold={0.1}
//       refreshControl={
//         <RefreshControl refreshing={loading} onRefresh={onLoadMore} />
//       }
//       style={Platform.OS === 'web' ? { transform: [{ scaleY: -1 }] } : {} }
//       contentContainerStyle={Platform.OS === 'web' ? { transform: [{ scaleY: -1 }] } : {}}
//       style={styles.container}
//     />
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   dateSeparator: {
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   dateText: {
//     backgroundColor: '#e0e0e0',
//     color: '#666',
//     fontSize: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
// });

// export default ChatRoom;