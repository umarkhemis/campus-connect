

import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Alert 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const MessageInput = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleImagePicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageFile = {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'image.jpg',
      };
      onSend('', 'image', imageFile);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.attachButton}
        onPress={handleImagePicker}
      >
        <Ionicons name="camera" size={24} color="#007AFF" />
      </TouchableOpacity>
      
      <TextInput
        style={styles.textInput}
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message..."
        multiline
        maxLength={1000}
        onFocus={() => setIsTyping(true)}
        onBlur={() => setIsTyping(false)}
      />
      
      <TouchableOpacity 
        style={[
          styles.sendButton,
          message.trim() ? styles.sendButtonActive : styles.sendButtonInactive
        ]}
        onPress={handleSend}
        disabled={!message.trim()}
      >
        <Ionicons 
          name="send" 
          size={20} 
          color={message.trim() ? '#fff' : '#ccc'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 20,
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  sendButtonInactive: {
    backgroundColor: '#f0f0f0',
  },
});

export default MessageInput;