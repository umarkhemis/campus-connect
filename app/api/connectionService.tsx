
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

class ConnectionAPI {
  private api: ReturnType<typeof axios.create>;
  private lastUserId: string | null = null;

  constructor() {
    // Create axios instance
    this.api = axios.create({
      baseURL: this.getBaseUrl() + '/api',
      timeout: 10000,
    });

    // Request interceptor to add auth token with automatic refresh
    this.api.interceptors.request.use(
      async (config) => {
        let token = await this.getAuthToken();
        
        // Try to refresh token if it exists but might be expired
        if (token) {
          try {
            // You might want to check token expiry here before making the request
            config.headers.Authorization = `Bearer ${token}`;
          } catch (error) {
            console.log('Token might be expired, attempting refresh...');
            try {
              token = await this.refreshAccessToken();
              config.headers.Authorization = `Bearer ${token}`;
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              // Clear tokens and let the request proceed without auth
              await this.clearTokens();
            }
          }
        }
        
        config.headers['Content-Type'] = 'application/json';
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and automatic token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If we get a 401 and haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed, clearing auth data');
            await this.clearTokens();
            return Promise.reject(refreshError);
          }
        }
        
        // console.error('API request failed:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ===== AUTH SERVICE METHODS =====
  
  getBaseUrl() {  // No longer async
    if (Platform.OS === 'web') {
      return 'http://127.0.0.1:8000';
    } else if (Platform.OS === 'android') {
      return 'http://192.168.130.16:8000';
      // return 'http://10.15.3.90:8000';
    } else {
      return 'http://127.0.0.1:8000';
    }
  }


  // ===== NEW UTILITY METHOD FOR PROFILE PICTURES =====
  getUserProfilePicture(user) {
    if (user?.profile_picture) {
      // Check if it's already a full URL
      if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
        return user.profile_picture;
      }
      
      // Use the same base URL as the API
      const API_BASE_URL = this.getBaseUrl();
      
      // Clean up the path
      const cleanPath = user.profile_picture.startsWith('/') 
        ? user.profile_picture 
        : `/${user.profile_picture}`;
      
      return `${API_BASE_URL}${cleanPath}`;
    }
    
    // Fallback to username-based avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=10b981&color=fff&size=128`;
  }



  // ===== HELPER METHOD FOR GETTING FULL NAME =====
  getFullName(user) {
    if (!user) return 'Unknown User';
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    return fullName || user.username || 'Unknown User';
  }



  async storeTokens(accessToken: string, refreshToken: string) {
    try {
      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);
      console.log('Tokens stored successfully');
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  async getTokens() {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Error getting tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  }

  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async clearTokens() {
    try {
      await AsyncStorage.multiRemove([
        'access_token', 
        'refresh_token', 
        'user_profile',
        'currentUser',
        'saved_username',
        'remember_me'
      ]);
      this.lastUserId = null; // Reset tracked user ID
      console.log('All tokens and user data cleared');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // async refreshAccessToken() {
  //   const { refreshToken } = await this.getTokens();
  //   if (!refreshToken) {
  //     throw new Error('No refresh token available');
  //   }

  //   try {
  //     const response = await axios.post(`${this.getBaseUrl()}/api/refresh/`, {
  //       refresh: refreshToken,
  //     }, {
  //       timeout: 10000,
  //     });

  //     const { access, refresh } = response.data;
  //     await this.storeTokens(access, refresh || refreshToken);
  //     return access;
  //   } catch (error: any) {
  //     console.error('Token refresh failed:', error);
  //     await this.clearTokens();
  //     throw new Error('Session expired. Please login again.');
  //   }
  // }


  async refreshAccessToken() {
    const { refreshToken } = await this.getTokens();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Fix: getBaseUrl is now synchronous
      const response = await axios.post(`${this.getBaseUrl()}/api/refresh/`, {
        refresh: refreshToken,
      }, {
        timeout: 10000,
      });

      const { access, refresh } = response.data;
      await this.storeTokens(access, refresh || refreshToken);
      return access;
    } catch (error: any) {
      // console.error('Token refresh failed:', error);
      await this.clearTokens();
      throw new Error('Session expired. Please login again.');
    }
  }






  // async login(credentials) {
  //   try {
  //     const response = await this.api.post('/login/', credentials);
  //     const { access, refresh, user } = response.data;
      
  //     // Use existing method to handle login success
  //     await this.handleLoginSuccess(access, refresh, user);
      
  //     return { success: true, data: response.data };
  //   } catch (error) {
  //     const errorMessage = error.response?.data?.message || 
  //     error.response?.data?.error || 
  //     error.message || 
  //     'Login failed';
  //     return { success: false, error: errorMessage };
  //   }
  // }


  async login(credentials) {
    try {
      // console.log('Attempting login with baseURL:', this.getBaseUrl());
      
      const response = await this.api.post('/login/', credentials);
      const { access, refresh, user } = response.data;
      
      // Handle login success
      await this.handleLoginSuccess(access, refresh, user);
      
      return { success: true, data: response.data };
    } catch (error) {
      // console.error('Login failed:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response) {
        // Server responded with error status
        const data = error.response.data;
        errorMessage = data?.detail || data?.message || data?.error || `Server error (${error.response.status})`;
      } else if (error.request) {
        // Request made but no response received
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      return { success: false, error: errorMessage };
    }
  }


  async register(credentials) {
    try {
      const response = await this.api.post('/register/', credentials);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
      error.response?.data?.error || 
      error.message || 
      'Registration failed';
      return { success: false, error: errorMessage };
    }
  }



  async getUserById(userId) {
    try {
      const token = await this.getTokens();
      
      const response = await this.api.get(`/users/${userId}/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
      
    } catch (error) {
      console.error('Get user by ID error:', error);

      if (error.response) {
        
        console.error('Error response:', error.response.status, error.response.data);
        throw new Error(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        
        console.error('No response received:', error.request);
        throw new Error('Network error: No response from server');
      } else {
        
        console.error('Request setup error:', error.message);
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }



  async isAuthenticated() {
    const { accessToken } = await this.getTokens();
    return !!accessToken;
  }

  // ===== USER CACHE METHODS =====

  async clearUserCache() {
    try {
      await AsyncStorage.multiRemove(['access_token', 'currentUser', 'user', 'user_profile']);
      this.lastUserId = null; // Reset tracked user ID
      console.log('User cache cleared successfully');
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }

  // Method to check if the user has changed and clear cache if needed
  async checkAndClearCacheIfUserChanged(newUserId: string | number) {
    if (this.lastUserId && this.lastUserId !== newUserId.toString()) {
      console.log(`User changed from ${this.lastUserId} to ${newUserId}. Clearing cache...`);
      await AsyncStorage.removeItem('currentUser');
    }
    this.lastUserId = newUserId.toString();
  }

  // ===== USER API METHODS =====

  async getCurrentUser(forceRefresh = false, retryCount = 0) {
    const maxRetries = 2;
    
    try {
      // If force refresh is requested, skip cache
      if (!forceRefresh) {
        const cachedUser = await AsyncStorage.getItem('currentUser');
        if (cachedUser) {
          const user = JSON.parse(cachedUser);
          console.log('Using cached user:', user);
          return user;
        }
      }

      // Fetch from API
      console.log(forceRefresh ? 'Force fetching user from API...' : 'Fetching user from API...');
      const response = await this.api.get('/users/current/');
      
      // Handle different response structures
      let userData;
      if (response.data.success) {
        userData = response.data.user;
      } else if (response.data.user) {
        userData = response.data.user;
      } else {
        userData = response.data; // Assume the response IS the user data
      }
      
      // Validate essential user data
      if (!userData.id || !userData.username) {
        throw new Error('Invalid user data received');
      }
      
      // Cache the user data
      await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
      console.log('Fetched and cached user from API:', userData);
      
      return userData;
    } catch (error: any) {
      console.error('Get current user error:', error);
      
      // Retry logic for network errors
      if (retryCount < maxRetries && (error.code === 'NETWORK_ERROR' || !error.response)) {
        console.log(`Retrying getCurrentUser... Attempt ${retryCount + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.getCurrentUser(forceRefresh, retryCount + 1);
      }
      
      // If API fails and not force refresh, try to use cached data as fallback
      if (!forceRefresh) {
        try {
          const cachedUser = await AsyncStorage.getItem('currentUser');
          if (cachedUser) {
            const user = JSON.parse(cachedUser);
            console.log('Using cached user as fallback:', user);
            return user;
          }
        } catch (cacheError) {
          console.error('Cache fallback failed:', cacheError);
        }
      }
      
      // Handle specific error types
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        switch (status) {
          case 401:
            // Clear cache on authentication error
            await this.clearTokens(); // Use the integrated method
            throw new Error('Please log in to continue');
          case 403:
            throw new Error('Access denied');
          case 404:
            throw new Error('User profile not found');
          case 429:
            throw new Error('Too many requests. Please try again later');
          case 500:
            throw new Error('Server error. Please try again later');
          default:
            throw new Error(errorData?.message || errorData?.error || `Server error (${status})`);
        }
      } else if (error.request) {
        throw new Error('Unable to connect to server. Please check your internet connection');
      } else {
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  }
  
  // Method to check if user data is cached and still valid
  async getCachedUser() {
    try {
      const cachedUser = await AsyncStorage.getItem('currentUser');
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
      return null;
    } catch (error) {
      console.error('Error getting cached user:', error);
      return null;
    }
  }

  // Method to refresh user data (force refresh)
  async refreshCurrentUser() {
    try {
      console.log('Refreshing user data...');
      return await this.getCurrentUser(true); // Force refresh
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  }



  

  // ===== CONNECTION API METHODS =====

  async getStudents() {
    const response = await this.api.get('/students/');
    return response.data;
  }

  async sendConnectionRequest(receiverId: string | number) {
    const response = await this.api.post('/send-request/', 
      { receiver_id: receiverId }
    );
    return response.data;
  }

  async respondToRequest(requestId: string | number, action: string) {
    const response = await this.api.post(`/respond-request/${requestId}/`, 
      { action }
    );
    return response.data;
  }

  async cancelRequest(requestId: string | number) {
    const response = await this.api.delete(`/cancel-request/${requestId}/`);
    return response.data;
  }

  async getMyRequests() {
    const response = await this.api.get('/my-requests/');
    return response.data;
  }

  async getMyConnections() {
    try {
      const response = await this.api.get('/my-connections/');
      console.log('Raw connections response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get connections error:', error);
      throw error;
    }
  }

  async removeConnection(connectionId: string | number) {
    const response = await this.api.delete(`/remove-connection/${connectionId}/`);
    return response.data;
  }

  // ===== DEBUG METHODS =====

  // Debug method to check current authentication status
  async checkAuthStatus() {
    try {
      const token = await this.getAuthToken();
      const cachedUser = await this.getCachedUser();
      const isAuth = await this.isAuthenticated();
      
      console.log('=== AUTH STATUS DEBUG ===');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('Is authenticated:', isAuth);
      console.log('Cached user:', cachedUser);
      
      return {
        hasToken: !!token,
        isAuthenticated: isAuth,
        hasCachedUser: !!cachedUser,
        cachedUser: cachedUser
      };
    } catch (error) {
      console.error('Auth status check error:', error);
      return {
        hasToken: false,
        isAuthenticated: false,
        hasCachedUser: false,
        cachedUser: null
      };
    }
  }

  // ===== CONVENIENCE METHODS =====

  // Method to handle login (you can call this after successful login)
  async handleLoginSuccess(accessToken: string, refreshToken: string, userData?: any) {
    try {
      await this.storeTokens(accessToken, refreshToken);
      
      if (userData) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
      }
      
      console.log('Login success handled');
    } catch (error) {
      console.error('Error handling login success:', error);
      throw error;
    }
  }

  // Method to handle logout
  async handleLogout() {
    try {
      await this.clearTokens();
      console.log('Logout handled successfully');
    } catch (error) {
      console.error('Error handling logout:', error);
      throw error;
    }
  }

  

  // ===== FORUM/POSTS API METHODS =====
  async createPost(postData) {
    try {
      const response = await this.api.post('/posts/', postData);
      return response.data;
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  }

  async getPostById(postId) {
    try {
      const response = await this.api.get(`/posts/${postId}/`);
      return response.data;
    } catch (error) {
      console.error('Get post by ID error:', error);
      throw error;
    }
  }

  async likePost(postId) {
    try {
      const response = await this.api.post(`/posts/${postId}/like/`);
      return response.data;
    } catch (error) {
      console.error('Like post error:', error);
      throw error;
    }
  }

  async commentOnPost(postId, commentData) {
    try {
      const response = await this.api.post(`/posts/${postId}/comments/`, commentData);
      return response.data;
    } catch (error) {
      console.error('Comment on post error:', error);
      throw error;
    }
  }
  async getPosts() {
    try {
      const response = await this.api.get('/posts/');
      return response.data;
    } catch (error) {
      console.error('Get posts error:', error);
      throw error;
    }
  }
  async getPostComments(postId) {
    try {
      const response = await this.api.get(`/posts/${postId}/comments/`);
      return response.data;
    } catch (error) {
      console.error('Get post comments error:', error);
      throw error;
    }
  }
  async updatePost(postId, postData) {
    try {
      const response = await this.api.put(`/posts/${postId}/`, postData);
      return response.data;
    } catch (error) {
      console.error('Update post error:', error);
      throw error;
    }
  }

  async reportPost(postId, ) {
    try {
      const response = await this.api.post(`/posts/${postId}/report/`, { post_id: postId },);
      return response.data;
    } catch (error) {
      console.error('Comment on post error:', error);
      throw error;
    }
  }

  // ===== MARKETPLACE API METHODS =====
  async createMarketplaceItem(itemData) {
    try {
      const response = await this.api.post('/marketplace/', itemData);
      return response.data;
    } catch (error) {
      console.error('Create marketplace item error:', error);
      throw error;
    }
  }

  async getMarketplaceItems() {
    try {
      const response = await this.api.get('/marketplace/');
      return response.data;
    } catch (error) {
      console.error('Get marketplace item error:', error);
      throw error;
    }
  }

  async getMarketplaceItemById(itemId) {
    try {
      const response = await this.api.get(`/marketplace/${itemId}/`);
      return response.data;
    } catch (error) {
      console.error('Get marketplace item error:', error);
      throw error;
    }
  }

  async getMarketplaceItemMarkasSold(itemId) {
    try {
      const response = await this.api.patch(`/marketplace/${itemId}/mark_sold/`);
      return response.data;
    } catch (error) {
      console.error('Get marketplace item error:', error);
      throw error;
    }
  }

  async updateMarketplaceItem(itemId, updateData) {
    try {
      const response = await this.api.put(`/marketplace/${itemId}/`, updateData);
      return response.data;
    } catch (error) {
      console.error('Update marketplace item error:', error);
      throw error;
    }
  }

  async deleteMarketplaceItem(itemId) {
    try {
      const response = await this.api.delete(`/marketplace/${itemId}/`);
      return response.data;
    } catch (error) {
      console.error('Delete marketplace item error:', error);
      throw error;
    }
  }

  // ===== LOST & FOUND API METHODS =====
  async createLostFoundItem(itemData) {
    try {
      const response = await this.api.post('/lost-found/', itemData);
      return response.data;
    } catch (error) {
      console.error('Create lost-found item error:', error);
      throw error;
    }
  }

  async getLostFoundItems() {
    try {
      const response = await this.api.get('/lost-found/');
      return response.data;
    } catch (error) {
      console.error('Get lost-found item error:', error);
      throw error;
    }
  }
  async getLostFoundItemById(itemId) {
    try {
      const response = await this.api.get(`/lost-found/${itemId}/`);
      return response.data;
    } catch (error) {
      console.error('Get lost-found item error:', error);
      throw error;
    }
  }

  async updateLostFoundStatus(itemId, status) {
    try {
      const response = await this.api.patch(`/lost-found/${itemId}/`, { status });
      return response.data;
    } catch (error) {
      console.error('Update lost-found status error:', error);
      throw error;
    }
  }

  // ===== EVENTS API METHODS =====
  async rsvpEvent(eventId) {
    try {
      const response = await this.api.post(`/events/${eventId}/rsvp/`);
      return response.data;
    } catch (error) {
      console.error('RSVP event error:', error);
      throw error;
    }
  }

  async getEvents() {
    try {
      const response = await this.api.get(`/events/`);
      return response.data;
    } catch (error) {
      console.error('Get event error:', error);
      throw error;
    }
  }

  // ===== CLUBS API METHODS =====

  async joinLeaveClub(clubId) {
    try {
      const response = await this.api.post(`/clubs/${clubId}/join_leave/`);
      return response.data;
    } catch (error) {
      console.error('Leave club error:', error);
      throw error;
    }
  }

  async getClubs() {
    try {
      const response = await this.api.get('/clubs/');
      return response.data;
    } catch (error) {
      console.error('Get club error:', error);
      throw error;
    }
  }


  async getClubMembers(clubId) {
    try {
      if (!clubId) {
        throw new Error('Club ID is required to get members');
      }    
      const response = await this.api.get(`/clubs/${clubId}/members/`);
      return response.data;
    } catch (error) {
      console.error('Get club members error:', error);
      throw error;
    }
  }


  // ===== PROFILE API METHODS =====
  async updateProfile(profileData) {
    try {
      const response = await this.api.put('/profile/', profileData);
      // Update cached user data
      await AsyncStorage.setItem('currentUser', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async uploadProfileImage(imageData) {
    try {
      const formData = new FormData();
      formData.append('profile_picture', imageData);

      const response = await this.api.post('/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update cached user data
      const updatedUser = await this.getCurrentUser(true); // Force refresh
      return updatedUser;
    } catch (error) {
      console.error('Upload profile image error:', error);
      throw error;
    }
  }

  // ===== MESSAGING API METHODS (for future chat feature) =====
  async getChatRooms() {
    try {
      const response = await this.api.get('/chat/rooms/');
      return response.data;
    } catch (error) {
      console.error('Get chat rooms error:', error);
      throw error;
    }
  }

  async getOrCreateChatRoom(userId: string | number) {
    try {
      const response = await this.api.get(`/chat/room/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Get or create chat room error:', error);
      throw error;
    }
  }

  async getChatMessages(roomId: string | number, page: number = 1) {
    try {
      const response = await this.api.get(`/chat/${roomId}/messages/?page=${page}`);
      return response.data;
    } catch (error) {
      console.error('Get chat messages error:', error);
      throw error;
    }
  }

  async sendMessage(roomId: string | number, content: string, messageType: string = 'text', file?: any) {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('message_type', messageType);
      
      if (file) {
        formData.append('file', file);
      }

      const response = await this.api.post(`/chat/${roomId}/send/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  async markMessagesRead(roomId: string | number) {
    try {
      const response = await this.api.put(`/chat/${roomId}/mark-read/`);
      return response.data;
    } catch (error) {
      console.error('Mark messages read error:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string | number) {
    try {
      const response = await this.api.delete(`/chat/message/${messageId}/delete/`);
      return response.data;
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }

  // WebSocket connection method for real-time chat
  getWebSocketUrl(roomId: string | number, token: string) {
    const baseUrl = this.getBaseUrl().replace('http', 'ws');
    return `${baseUrl}/ws/chat/${roomId}/?token=${token}`;
  }

  // // Method to get WebSocket URL for a specific room
  // getWebSocketUrlForRoom(roomId: string | number) {
  //   const token = this.getAuthToken();
  //   if (!token) {
  //     throw new Error('No authentication token available');
  //   }
  //   return this.getWebSocketUrl(roomId, token);
  // }

  // // ===== WEBSOCKET METHODS =====
  // createWebSocket(roomId, onMessage, onConnect, onDisconnect) {
  //   const token = this.getAuthToken();
  //   const wsUrl = this.getWebSocketUrl(roomId, token);
    
  //   const ws = new WebSocket(wsUrl);
    
  //   ws.onopen = () => {
  //     console.log('WebSocket connected');
  //     onConnect?.();
  //   };
    
  //   ws.onmessage = (event) => {
  //     const data = JSON.parse(event.data);
  //     onMessage?.(data);
  //   };
    
  //   ws.onclose = () => {
  //     console.log('WebSocket disconnected');
  //     onDisconnect?.();
  //   };
    
  //   ws.onerror = (error) => {
  //     console.error('WebSocket error:', error);
  //   };
    
  //   return ws;
  // }

  async getWebSocketUrlForRoom(roomId) {
    const token = await this.getAuthToken(); // Make sure to await the token
    if (!token) {
      throw new Error('No authentication token available');
    }
    return this.getWebSocketUrl(roomId, token);
  }

  // Updated WebSocket creation method (now async)
  async createWebSocket(roomId, onMessage, onConnect, onDisconnect) {
    const token = await this.getAuthToken(); // Await the token here
    const wsUrl = this.getWebSocketUrl(roomId, token);
    
    const ws = new WebSocket(wsUrl);
    
    console.log('WebSocket URL:', wsUrl); 
    ws.onopen = () => {
      console.log('WebSocket connected');
      onConnect?.();
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      onDisconnect?.();
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return ws;
  }













  // Enhanced message search
  async searchMessages(query, roomId = null) {
    try {
      const params = new URLSearchParams({ q: query });
      if (roomId) params.append('room_id', roomId);
      
      const response = await this.api.get(`/chat/search/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Search messages error:', error);
      throw error;
    }
  }

  // Typing indicators
  async sendTypingIndicator(roomId, isTyping) {
    try {
      const response = await this.api.post(`/chat/${roomId}/typing/`, {
        is_typing: isTyping
      });
      return response.data;
    } catch (error) {
      console.error('Send typing indicator error:', error);
      throw error;
    }
  }


  // ===== NOTIFICATION API METHODS =====
  async initializeNotifications() {
    try {
      // Request permission for notifications
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      if (enabled) {
        // Get FCM token and register device
        const fcmToken = await messaging().getTokens();
        await this.registerDevice(fcmToken);
        
        // Setup foreground listener
        this.setupForegroundListener();
      }
      
      return enabled;
    } catch (error) {
      console.error('Initialize notifications error:', error);
      return false;
    }
  }

  setupForegroundListener() {
    return messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification:', remoteMessage);
      // You can show in-app notification here
      return remoteMessage;
    });
  }

  async registerDevice(deviceToken) {
    try {
      const response = await this.api.post('/notifications/register-device/', {
        device_token: deviceToken,
        device_type: Platform.OS === 'ios' ? 'ios' : 'android'
      });
      return response.data;
    } catch (error) {
      console.error('Register device error:', error);
      throw error;
    }
  }

  async getNotifications() {
    try {
      const response = await this.api.get('/notifications/');
      return response.data;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const response = await this.api.post(`/notifications/${notificationId}/read/`);
      return response.data;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return false;
    }
  }

  async markAllNotificationsAsRead() {
    try {
      const response = await this.api.post('/notifications/mark-all-read/');
      return response.data;
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return false;
    }
  }

  async getUnreadNotificationCount() {
    try {
      const response = await this.api.get('/notifications/unread-count/');
      return response.data.unread_count || 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }


}

export default new ConnectionAPI();






















































// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Replace with your actual API URL

// class ConnectionAPI {
//   private api: ReturnType<typeof axios.create>;

//   constructor() {
//     // Create axios instance
//     this.api = axios.create({
//       baseURL: API_BASE_URL,
//       timeout: 10000,
//     });

//     // Request interceptor to add auth token
//     this.api.interceptors.request.use(
//       async (config) => {
//         const token = await this.getAuthToken();
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         config.headers['Content-Type'] = 'application/json';
//         return config;
//       },
//       (error) => {
//         return Promise.reject(error);
//       }
//     );

//     // Response interceptor for error handling
//     this.api.interceptors.response.use(
//       (response) => response,
//       (error) => {
//         console.error('API request failed:', error.response?.data || error.message);
//         return Promise.reject(error);
//       }
//     );
//   }

//   async getAuthToken() {
//     try {
//       const token = await AsyncStorage.getItem('access_token'); // Updated key name
//       return token;
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   }

 


//   async clearUserCache() {
//     try {
//       await AsyncStorage.multiRemove(['access_token', 'currentUser']);
//       this.lastUserId = null; // Reset tracked user ID
//       console.log('User cache cleared successfully');
//     } catch (error) {
//       console.error('Error clearing user cache:', error);
//     }
//   }

//   // Method to check if the user has changed and clear cache if needed
//   async checkAndClearCacheIfUserChanged(newUserId) {
//     if (this.lastUserId && this.lastUserId !== newUserId.toString()) {
//       console.log(`User changed from ${this.lastUserId} to ${newUserId}. Clearing cache...`);
//       await AsyncStorage.removeItem('currentUser');
//     }
//     this.lastUserId = newUserId.toString();
//   }






//   async getCurrentUser(forceRefresh = false, retryCount = 0) {
//     const maxRetries = 2;
    
//     try {
//       // If force refresh is requested, skip cache
//       if (!forceRefresh) {
//         const cachedUser = await AsyncStorage.getItem('currentUser');
//         if (cachedUser) {
//           const user = JSON.parse(cachedUser);
//           console.log('Using cached user:', user);
//           return user;
//         }
//       }

//       // Fetch from API
//       console.log(forceRefresh ? 'Force fetching user from API...' : 'Fetching user from API...');
//       const response = await this.api.get('/users/current/');
      
//       // Handle different response structures
//       let userData;
//       if (response.data.success) {
//         userData = response.data.user;
//       } else if (response.data.user) {
//         userData = response.data.user;
//       } else {
//         userData = response.data; // Assume the response IS the user data
//       }
      
//       // Validate essential user data
//       if (!userData.id || !userData.username) {
//         throw new Error('Invalid user data received');
//       }
      
//       // Cache the user data
//       await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
//       console.log('Fetched and cached user from API:', userData);
      
//       return userData;
//     } catch (error) {
//       console.error('Get current user error:', error);
      
//       // Retry logic for network errors
//       if (retryCount < maxRetries && (error.code === 'NETWORK_ERROR' || !error.response)) {
//         console.log(`Retrying getCurrentUser... Attempt ${retryCount + 1}/${maxRetries}`);
//         await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
//         return this.getCurrentUser(forceRefresh, retryCount + 1);
//       }
      
//       // If API fails and not force refresh, try to use cached data as fallback
//       if (!forceRefresh) {
//         try {
//           const cachedUser = await AsyncStorage.getItem('currentUser');
//           if (cachedUser) {
//             const user = JSON.parse(cachedUser);
//             console.log('Using cached user as fallback:', user);
//             return user;
//           }
//         } catch (cacheError) {
//           console.error('Cache fallback failed:', cacheError);
//         }
//       }
      
//       // Handle specific error types
//       if (error.response) {
//         const status = error.response.status;
//         const errorData = error.response.data;
        
//         switch (status) {
//           case 401:
//             // Clear cache on authentication error
//             await this.clearUserCache();
//             throw new Error('Please log in to continue');
//           case 403:
//             throw new Error('Access denied');
//           case 404:
//             throw new Error('User profile not found');
//           case 429:
//             throw new Error('Too many requests. Please try again later');
//           case 500:
//             throw new Error('Server error. Please try again later');
//           default:
//             throw new Error(errorData?.message || errorData?.error || `Server error (${status})`);
//         }
//       } else if (error.request) {
//         throw new Error('Unable to connect to server. Please check your internet connection');
//       } else {
//         throw new Error(error.message || 'An unexpected error occurred');
//       }
//     }
//   }
  
//   // Method to check if user data is cached and still valid
//   async getCachedUser() {
//     try {
//       const cachedUser = await AsyncStorage.getItem('currentUser');
//       if (cachedUser) {
//         return JSON.parse(cachedUser);
//       }
//       return null;
//     } catch (error) {
//       console.error('Error getting cached user:', error);
//       return null;
//     }
//   }

//   // Method to refresh user data (force refresh)
//   async refreshCurrentUser() {
//     try {
//       console.log('Refreshing user data...');
//       return await this.getCurrentUser(true); // Force refresh
//     } catch (error) {
//       console.error('Error refreshing user data:', error);
//       throw error;
//     }
//   }



//   async getStudents() {
//     const response = await this.api.get('/students/');
//     return response.data;
//   }

//   async sendConnectionRequest(receiverId) {
//     const response = await this.api.post('/send-request/', 
//       { receiver_id: receiverId }
//     );
//     return response.data;
//   }

//   async respondToRequest(requestId, action) {
//     const response = await this.api.post(`/respond-request/${requestId}/`, 
//       { action }
//     );
//     return response.data;
//   }

//   async cancelRequest(requestId) {
//     const response = await this.api.delete(`/cancel-request/${requestId}/`);
//     return response.data;
//   }

//   async getMyRequests() {
//     const response = await this.api.get('/my-requests/');
//     return response.data;
//   }

//   async getMyConnections() {
//     try {
//       const response = await this.api.get('/my-connections/');
//       console.log('Raw connections response:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('Get connections error:', error);
//       throw error;
//     }
//   }

//   async removeConnection(connectionId) {
//     const response = await this.api.delete(`/remove-connection/${connectionId}/`);
//     return response.data;
//   }

//   // Debug method to check current authentication status
//   async checkAuthStatus() {
//     try {
//       const token = await this.getAuthToken();
//       const cachedUser = await this.getCachedUser();
      
//       console.log('=== AUTH STATUS DEBUG ===');
//       console.log('Token exists:', !!token);
//       console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
//       console.log('Cached user:', cachedUser);
      
//       return {
//         hasToken: !!token,
//         hasCachedUser: !!cachedUser,
//         cachedUser: cachedUser
//       };
//     } catch (error) {
//       console.error('Auth status check error:', error);
//       return {
//         hasToken: false,
//         hasCachedUser: false,
//         cachedUser: null
//       };
//     }
//   }
// }

// export default new ConnectionAPI();


































// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Replace with your actual API URL

// class ConnectionAPI {
//   private api: ReturnType<typeof axios.create>;

//   constructor() {
//     // Create axios instance
//     this.api = axios.create({
//       baseURL: API_BASE_URL,
//       timeout: 10000,
//     });

//     // Request interceptor to add auth token
//     this.api.interceptors.request.use(
//       async (config) => {
//         const token = await this.getAuthToken();
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         config.headers['Content-Type'] = 'application/json';
//         return config;
//       },
//       (error) => {
//         return Promise.reject(error);
//       }
//     );

//     // Response interceptor for error handling
//     this.api.interceptors.response.use(
//       (response) => response,
//       (error) => {
//         console.error('API request failed:', error.response?.data || error.message);
//         return Promise.reject(error);
//       }
//     );
//   }

//   async getAuthToken() {
//     try {
//       const token = await AsyncStorage.getItem('access_token'); // Updated key name
//       return token;
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   }


//   async clearUserCache() {
//     try {
//       await AsyncStorage.multiRemove(['access_token', 'currentUser']);
//       console.log('User cache cleared successfully');
//     } catch (error) {
//       console.error('Error clearing user cache:', error);
//     }
//   }


//   async getCurrentUser(retryCount = 0) {
//     const maxRetries = 2;
    
//     try {
//       const response = await this.api.get('/users/current/');
      
//       // Handle different response structures
//       let userData;
//       if (response.data.success) {
//         userData = response.data.user;
//       } else if (response.data.user) {
//         userData = response.data.user;
//       } else {
//         userData = response.data; // Assume the response IS the user data
//       }
      
//       // Validate essential user data
//       if (!userData.id || !userData.username) {
//         throw new Error('Invalid user data received');
//       }
      
//       // Cache the user data
//       await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
      
//       return userData;
//     } catch (error) {
//       console.error('Get current user error:', error);
      
//       // Retry logic for network errors
//       if (retryCount < maxRetries && (error.code === 'NETWORK_ERROR' || !error.response)) {
//         console.log(`Retrying getCurrentUser... Attempt ${retryCount + 1}/${maxRetries}`);
//         await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
//         return this.getCurrentUser(retryCount + 1);
//       }
      
//       // Handle specific error types
//       if (error.response) {
//         const status = error.response.status;
//         const errorData = error.response.data;
        
//         switch (status) {
//           case 401:
//             throw new Error('Please log in to continue');
//           case 403:
//             throw new Error('Access denied');
//           case 404:
//             throw new Error('User profile not found');
//           case 429:
//             throw new Error('Too many requests. Please try again later');
//           case 500:
//             throw new Error('Server error. Please try again later');
//           default:
//             throw new Error(errorData?.message || errorData?.error || `Server error (${status})`);
//         }
//       } else if (error.request) {
//         throw new Error('Unable to connect to server. Please check your internet connection');
//       } else {
//         throw new Error(error.message || 'An unexpected error occurred');
//       }
//     }
//   }
  
//   // Method to check if user data is cached and still valid
//   async getCachedUser() {
//     try {
//       const cachedUser = await AsyncStorage.getItem('currentUser');
//       if (cachedUser) {
//         return JSON.parse(cachedUser);
//       }
//       return null;
//     } catch (error) {
//       console.error('Error getting cached user:', error);
//       return null;
//     }


//   }


//   async getStudents() {
//     const response = await this.api.get('/students/');
//     return response.data;
//   }

//   async sendConnectionRequest(receiverId) {
//     const response = await this.api.post('/send-request/', 
//       { receiver_id: receiverId }
//     );
//     return response.data;
//   }

//   async respondToRequest(requestId, action) {
//     const response = await this.api.post(`/respond-request/${requestId}/`, 
//       { action }
//     );
//     return response.data;
//   }

//   async cancelRequest(requestId) {
//     const response = await this.api.delete(`/cancel-request/${requestId}/`);
//     return response.data;
//   }

//   async getMyRequests() {
//     const response = await this.api.get('/my-requests/');
//     return response.data;
//   }

//   async getMyConnections() {
//     const response = await this.api.get('/my-connections/');
//     return response.data;
//   }

//   async removeConnection(connectionId) {
//     const response = await this.api.delete(`/remove-connection/${connectionId}/`);
//     return response.data;
//   }
// }

// export default new ConnectionAPI();



















































// // services/ConnectionService.js - Complete Connection Service
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Replace with your actual API URL

// class ConnectionService {
//   private api: ReturnType<typeof axios.create>;

//   constructor() {
//     // Create axios instance with base configuration
//     this.api = axios.create({
//       baseURL: API_BASE_URL,
//       timeout: 10000, // 10 seconds timeout
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     // Add request interceptor to automatically add auth token
//     this.api.interceptors.request.use(
//       async (config) => {
//         try {
//           const token = await this.getAuthToken();
//           if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//           }
//         } catch (error) {
//           console.error('Error adding auth token to request:', error);
//         }
//         return config;
//       },
//       (error) => {
//         return Promise.reject(error);
//       }
//     );

//     // Add response interceptor for error handling
//     this.api.interceptors.response.use(
//       (response) => {
//         return response;
//       },
//       (error) => {
//         // Handle common errors
//         if (error.response?.status === 401) {
//           console.log('Authentication expired');
//           // You might want to trigger logout here
//           this.handleAuthError();
//         }
//         return Promise.reject(error);
//       }
//     );
//   }

//   /**
//    * Get authentication token from AsyncStorage
//    * @returns {Promise<string|null>} Auth token or null
//    */
//   async getAuthToken() {
//     try {
//       const token = await AsyncStorage.getItem('access_token'); // Updated key name
//       return token;
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   }

//   /**
//    * Handle authentication errors (token expired, etc.)
//    */
//   async handleAuthError() {
//     try {
//       await AsyncStorage.removeItem('access_token');
//       await AsyncStorage.removeItem('refresh_token');
//       // You might want to navigate to login screen here
//       console.log('Auth tokens cleared due to authentication error');
//     } catch (error) {
//       console.error('Error clearing auth tokens:', error);
//     }
//   }

//   /**
//    * Get all users/students (excluding current user)
//    * @returns {Promise<Array>} List of users
//    */
//   async getUsers() {
//     try {
//       const response = await this.api.get('/users/');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching users:', error);
//       throw this.handleError(error, 'Failed to fetch users');
//     }
//   }

//   /**
//    * Get all connections for current user
//    * @returns {Promise<Array>} List of connections
//    */
//   async getConnections() {
//     try {
//       const response = await this.api.get('/connections/');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching connections:', error);
//       throw this.handleError(error, 'Failed to fetch connections');
//     }
//   }

//   /**
//    * Get only accepted connections
//    * @returns {Promise<Array>} List of accepted connections
//    */
//   async getAcceptedConnections() {
//     try {
//       const response = await this.api.get('/connections/accepted/');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching accepted connections:', error);
//       throw this.handleError(error, 'Failed to fetch accepted connections');
//     }
//   }

//   /**
//    * Get pending connection requests (sent and received)
//    * @returns {Promise<Array>} List of pending requests
//    */
//   async getPendingRequests() {
//     try {
//       const response = await this.api.get('/connections/pending/');
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching pending requests:', error);
//       throw this.handleError(error, 'Failed to fetch pending requests');
//     }
//   }

//   /**
//    * Send connection request to a user
//    * @param {number} receiverId - ID of the user to send request to
//    * @returns {Promise<Object>} Connection object
//    */
//   async sendConnectionRequest(receiverId) {
//     try {
//       const response = await this.api.post(`/connections/send/${receiverId}/`);
//       return response.data;
//     } catch (error) {
//       console.error('Error sending connection request:', error);
//       throw this.handleError(error, 'Failed to send connection request');
//     }
//   }

//   /**
//    * Accept a connection request
//    * @param {number} connectionId - ID of the connection to accept
//    * @returns {Promise<Object>} Updated connection object
//    */
//   async acceptConnectionRequest(connectionId) {
//     try {
//       const response = await this.api.post(`/connections/accept/${connectionId}/`);
//       return response.data;
//     } catch (error) {
//       console.error('Error accepting connection request:', error);
//       throw this.handleError(error, 'Failed to accept connection request');
//     }
//   }

//   /**
//    * Reject a connection request
//    * @param {number} connectionId - ID of the connection to reject
//    * @returns {Promise<Object>} Updated connection object
//    */
//   async rejectConnectionRequest(connectionId) {
//     try {
//       const response = await this.api.post(`/connections/reject/${connectionId}/`);
//       return response.data;
//     } catch (error) {
//       console.error('Error rejecting connection request:', error);
//       throw this.handleError(error, 'Failed to reject connection request');
//     }
//   }

//   /**
//    * Cancel a sent connection request
//    * @param {number} connectionId - ID of the connection to cancel
//    * @returns {Promise<Object>} Response message
//    */
//   async cancelConnectionRequest(connectionId) {
//     try {
//       const response = await this.api.delete(`/connections/cancel/${connectionId}/`);
//       return response.data;
//     } catch (error) {
//       console.error('Error cancelling connection request:', error);
//       throw this.handleError(error, 'Failed to cancel connection request');
//     }
//   }

//   /**
//    * Remove/unfriend an existing connection
//    * @param {number} connectionId - ID of the connection to remove
//    * @returns {Promise<Object>} Response message
//    */
//   async removeConnection(connectionId) {
//     try {
//       const response = await this.api.delete(`/connections/remove/${connectionId}/`);
//       return response.data;
//     } catch (error) {
//       console.error('Error removing connection:', error);
//       throw this.handleError(error, 'Failed to remove connection');
//     }
//   }

//   /**
//    * Get connection status between current user and another user
//    * @param {number} userId - ID of the other user
//    * @param {Array} connections - Array of all connections (optional, to avoid extra API call)
//    * @returns {Promise<Object>} Connection status info
//    */
//   async getConnectionStatus(userId, connections = null) {
//     try {
//       let connectionsData = connections;
      
//       if (!connectionsData) {
//         connectionsData = await this.getConnections();
//       }

//       // Find connection between current user and target user
//       const connection = connectionsData.find(conn => 
//         conn.sender.id === userId || conn.receiver.id === userId
//       );

//       if (!connection) {
//         return { status: 'none', connectionId: null };
//       }

//       // Determine the status from current user's perspective
//       if (connection.status === 'accepted') {
//         return { status: 'accepted', connectionId: connection.id };
//       }

//       if (connection.status === 'rejected') {
//         return { status: 'none', connectionId: null };
//       }

//       if (connection.status === 'pending') {
//         // Determine if current user sent or received the request
//         // Note: We need current user info for this - assuming it's available
//         const currentUserId = await this.getCurrentUserId();
        
//         if (connection.sender.id === currentUserId) {
//           return { status: 'pending_sent', connectionId: connection.id };
//         } else {
//           return { status: 'pending_received', connectionId: connection.id };
//         }
//       }

//       return { status: 'none', connectionId: null };
//     } catch (error) {
//       console.error('Error getting connection status:', error);
//       throw this.handleError(error, 'Failed to get connection status');
//     }
//   }

//   /**
//    * Get current user ID from storage or API
//    * @returns {Promise<number>} Current user ID
//    */
//   async getCurrentUserId() {
//     try {
//       // Try to get from storage first
//       const userId = await AsyncStorage.getItem('current_user_id');
//       if (userId) {
//         return parseInt(userId);
//       }

//       // If not in storage, fetch from API
//       const response = await this.api.get('/auth/me/'); // Adjust endpoint as needed
//       const currentUserId = response.data.id;
      
//       // Store for future use
//       await AsyncStorage.setItem('current_user_id', currentUserId.toString());
//       return currentUserId;
//     } catch (error) {
//       console.error('Error getting current user ID:', error);
//       throw this.handleError(error, 'Failed to get current user ID');
//     }
//   }

//   /**
//    * Search users by username or other criteria
//    * @param {string} query - Search query
//    * @returns {Promise<Array>} List of matching users
//    */
//   async searchUsers(query) {
//     try {
//       const response = await this.api.get('/users/search/', {
//         params: { q: query }
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Error searching users:', error);
//       throw this.handleError(error, 'Failed to search users');
//     }
//   }

//   /**
//    * Get user profile by ID
//    * @param {number} userId - User ID
//    * @returns {Promise<Object>} User profile data
//    */
//   async getUserProfile(userId) {
//     try {
//       const response = await this.api.get(`/users/${userId}/`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching user profile:', error);
//       throw this.handleError(error, 'Failed to fetch user profile');
//     }
//   }

//   /**
//    * Get connection statistics for current user
//    * @returns {Promise<Object>} Connection stats
//    */
//   async getConnectionStats() {
//     try {
//       const [connections, pending] = await Promise.all([
//         this.getAcceptedConnections(),
//         this.getPendingRequests()
//       ]);

//       const currentUserId = await this.getCurrentUserId();
      
//       const pendingSent = pending.filter(conn => conn.sender.id === currentUserId);
//       const pendingReceived = pending.filter(conn => conn.receiver.id === currentUserId);

//       return {
//         totalConnections: connections.length,
//         pendingSent: pendingSent.length,
//         pendingReceived: pendingReceived.length,
//         totalPending: pending.length
//       };
//     } catch (error) {
//       console.error('Error getting connection stats:', error);
//       throw this.handleError(error, 'Failed to get connection stats');
//     }
//   }

//   /**
//    * Bulk operations for connections
//    * @param {Array} connectionIds - Array of connection IDs
//    * @param {string} action - Action to perform ('accept', 'reject', 'cancel')
//    * @returns {Promise<Object>} Results of bulk operation
//    */
//   async bulkConnectionAction(connectionIds, action) {
//     try {
//       const promises = connectionIds.map(id => {
//         switch (action) {
//           case 'accept':
//             return this.acceptConnectionRequest(id);
//           case 'reject':
//             return this.rejectConnectionRequest(id);
//           case 'cancel':
//             return this.cancelConnectionRequest(id);
//           default:
//             throw new Error(`Invalid action: ${action}`);
//         }
//       });

//       const results = await Promise.allSettled(promises);
      
//       const successful = results.filter(result => result.status === 'fulfilled');
//       const failed = results.filter(result => result.status === 'rejected');

//       return {
//         successful: successful.length,
//         failed: failed.length,
//         total: connectionIds.length,
//         errors: failed.map(result => result.reason)
//       };
//     } catch (error) {
//       console.error('Error performing bulk connection action:', error);
//       throw this.handleError(error, 'Failed to perform bulk connection action');
//     }
//   }

//   /**
//    * Standardized error handling
//    * @param {Error} error - The error object
//    * @param {string} defaultMessage - Default error message
//    * @returns {Error} Formatted error
//    */
//   handleError(error, defaultMessage) {
//     if (error.response) {
//       // Server responded with error status
//       const message = error.response.data?.detail || 
//                      error.response.data?.message || 
//                      defaultMessage;
//       const statusCode = error.response.status;
      
//       const formattedError = new Error(message);
//       formattedError.statusCode = statusCode;
//       formattedError.originalError = error;
      
//       return formattedError;
//     } else if (error.request) {
//       // Network error
//       const networkError = new Error('Network error. Please check your connection.');
//       networkError.isNetworkError = true;
//       networkError.originalError = error;
      
//       return networkError;
//     } else {
//       // Other error
//       return new Error(defaultMessage);
//     }
//   }

//   /**
//    * Check if the service is properly configured
//    * @returns {Promise<boolean>} Configuration status
//    */
//   async checkConfiguration() {
//     try {
//       const token = await this.getAuthToken();
//       if (!token) {
//         console.warn('ConnectionService: No auth token found');
//         return false;
//       }

//       // Test API connectivity
//       await this.api.get('/connections/');
//       return true;
//     } catch (error) {
//       console.error('ConnectionService configuration check failed:', error);
//       return false;
//     }
//   }

//   /**
//    * Clear all cached data and reset service
//    */
//   async reset() {
//     try {
//       // Clear relevant AsyncStorage items
//       await AsyncStorage.multiRemove([
//         'access_token',
//         'refresh_token',
//         'current_user_id'
//       ]);
      
//       console.log('ConnectionService reset successfully');
//     } catch (error) {
//       console.error('Error resetting ConnectionService:', error);
//     }
//   }
// }

// // Export singleton instance
// export default new ConnectionService();




































// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Replace with your actual API URL

// class ConnectionService {
//   async getAuthToken() {
//     return await AsyncStorage.getItem('authToken');
//   }

//   async getAuthHeaders() {
//     const token = await this.getAuthToken();
//     return {
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     };
//   }

//   async getStudents() {
//     const headers = await this.getAuthHeaders();
//     const response = await fetch(`${API_BASE_URL}/students/`, {
//       headers,
//     });
//     return response.json();
//   }

//   async sendConnectionRequest(receiverId) {
//     const headers = await this.getAuthHeaders();
//     const response = await fetch(`${API_BASE_URL}/send-request/`, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify({ receiver_id: receiverId }),
//     });
//     return response.json();
//   }

//   async respondToRequest(requestId, action) {
//     const headers = await this.getAuthHeaders();
//     const response = await fetch(`${API_BASE_URL}/respond-request/${requestId}/`, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify({ action }),
//     });
//     return response.json();
//   }

//   async cancelRequest(requestId) {
//     const headers = await this.getAuthHeaders();
//     const response = await fetch(`${API_BASE_URL}/cancel-request/${requestId}/`, {
//       method: 'DELETE',
//       headers,
//     });
//     return response.json();
//   }

//   async getMyRequests() {
//     const headers = await this.getAuthHeaders();
//     const response = await fetch(`${API_BASE_URL}/my-requests/`, {
//       headers,
//     });
//     return response.json();
//   }

//   async getMyConnections() {
//     const headers = await this.getAuthHeaders();
//     const response = await fetch(`${API_BASE_URL}/my-connections/`, {
//       headers,
//     });
//     return response.json();
//   }

//   async removeConnection(connectionId) {
//     const headers = await this.getAuthHeaders();
//     const response = await fetch(`${API_BASE_URL}/remove-connection/${connectionId}/`, {
//       method: 'DELETE',
//       headers,
//     });
//     return response.json();
//   }
// }

// export default new ConnectionService();
