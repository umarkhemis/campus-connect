
// services/WebSocketService.js
import ConnectionAPI from './connectionService';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.roomId = null;
    this.reconnectInterval = null;
    this.heartbeatInterval = null;
    this.connectionPromise = null;
  }

  async connect(roomId) {
    // Prevent multiple simultaneous connections
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._doConnect(roomId);
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  async _doConnect(roomId) {
    try {
      this.roomId = roomId;
      const token = await ConnectionAPI.getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const wsUrl = ConnectionAPI.getWebSocketUrl(roomId, token);
      console.log('Connecting to WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('WebSocket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this._startHeartbeat();
          this.emit('connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            this.emit(data.type, data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this._stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          // Don't auto-reconnect if it was a clean close
          if (event.code !== 1000) {
            this._scheduleReconnect();
          }
          
          resolve(); // Don't reject on close, it's expected behavior
        };
        
        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };
      });
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectInterval = setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnecting', { attempt: this.reconnectAttempts });
      this.connect(this.roomId).catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send({ type: 'heartbeat' });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect() {
    console.log('Disconnecting WebSocket');
    
    // Clear reconnection attempts
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    this._stopHeartbeat();
    
    if (this.ws) {
      // Close with normal closure code
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.roomId = null;
    this.reconnectAttempts = 0;
  }

  send(data) {
    if (!this.ws || !this.isConnected) {
      console.warn('WebSocket not connected, cannot send message:', data);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }

  // Utility methods
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      roomId: this.roomId,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED
    };
  }

  // Send specific message types
  sendChatMessage(content) {
    return this.send({
      type: 'chat_message',
      content: content.trim()
    });
  }

  sendTypingIndicator(isTyping) {
    return this.send({
      type: 'typing',
      is_typing: isTyping
    });
  }

  sendReadReceipt(messageId) {
    return this.send({
      type: 'read_receipt',
      message_id: messageId
    });
  }
}

// Create and export a singleton instance
export default new WebSocketService();
























// class WebSocketService {
//   constructor() {
//     this.ws = null;
//     this.listeners = {};
//     this.isConnected = false;
//     this.reconnectAttempts = 0;
//     this.maxReconnectAttempts = 5;
//     this.roomId = null;
//     this.token = null;
//   }

//   async connect(roomId) {
//     try {
//       this.roomId = roomId;
//       this.token = await ConnectionAPI.getAuthToken();
      
//       if (!this.token) {
//         throw new Error('No auth token available');
//       }

//       const wsUrl = ConnectionAPI.getWebSocketUrl(roomId, this.token);
//       console.log('Connecting to WebSocket:', wsUrl);
      
//       this.ws = new WebSocket(wsUrl);
      
//       this.ws.onopen = () => {
//         console.log('WebSocket connected');
//         this.isConnected = true;
//         this.reconnectAttempts = 0;
//         this.emit('connected');
//       };
      
//       this.ws.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
//           this.emit(data.type, data);
//         } catch (error) {
//           console.error('Error parsing WebSocket message:', error);
//         }
//       };
      
//       this.ws.onclose = (event) => {
//         console.log('WebSocket disconnected:', event.code, event.reason);
//         this.isConnected = false;
//         this.emit('disconnected');
        
//         // Only attempt reconnect if it wasn't a manual close
//         if (event.code !== 1000) {
//           this.attemptReconnect();
//         }
//       };
      
//       this.ws.onerror = (error) => {
//         console.error('WebSocket error:', error);
//         this.emit('error', error);
//       };

//     } catch (error) {
//       console.error('Failed to connect WebSocket:', error);
//       this.emit('error', error);
//     }
//   }

//   attemptReconnect() {
//     if (this.reconnectAttempts < this.maxReconnectAttempts && this.roomId) {
//       this.reconnectAttempts++;
//       const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000); // Exponential backoff
      
//       setTimeout(() => {
//         console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
//         this.connect(this.roomId);
//       }, delay);
//     } else {
//       console.log('Max reconnection attempts reached');
//       this.emit('reconnection_failed');
//     }
//   }

//   disconnect() {
//     if (this.ws) {
//       this.ws.close(1000, 'Manual disconnect'); // 1000 = normal closure
//       this.ws = null;
//       this.isConnected = false;
//       this.roomId = null;
//       this.token = null;
//     }
//   }

//   send(data) {
//     if (this.ws && this.isConnected) {
//       try {
//         this.ws.send(JSON.stringify(data));
//         return true;
//       } catch (error) {
//         console.error('Error sending WebSocket message:', error);
//         return false;
//       }
//     }
//     console.warn('WebSocket not connected, cannot send message');
//     return false;
//   }

//   on(event, callback) {
//     if (!this.listeners[event]) {
//       this.listeners[event] = [];
//     }
//     this.listeners[event].push(callback);
//   }

//   off(event, callback) {
//     if (this.listeners[event]) {
//       this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
//     }
//   }

//   emit(event, data) {
//     if (this.listeners[event]) {
//       this.listeners[event].forEach(callback => {
//         try {
//           callback(data);
//         } catch (error) {
//           console.error('Error in WebSocket event listener:', error);
//         }
//       });
//     }
//   }

//   // Utility methods
//   getConnectionStatus() {
//     return {
//       isConnected: this.isConnected,
//       reconnectAttempts: this.reconnectAttempts,
//       roomId: this.roomId
//     };
//   }

//   // Clean up all listeners
//   removeAllListeners() {
//     this.listeners = {};
//   }
// }

// export default new WebSocketService();