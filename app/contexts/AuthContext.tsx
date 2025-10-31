

// contexts/AuthContext.js - Corrected AuthProvider using ConnectionAPI
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import ConnectionAPI from '../api/connectionService'; 
import axios from 'axios';
import { Platform } from 'react-native';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Helper function to get base URL (since ConnectionAPI.getBaseUrl() might be private)
  const getBaseUrl = () => {
    // You can either make getBaseUrl() public in ConnectionAPI or define it here
    if (Platform.OS === 'web') {
      return 'http://localhost:8000';
    } else if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    } else {
      return 'http://127.0.0.1:8000';
    }
  };

  useEffect(() => {
    // Initialize auth state on app start
    initializeAuth();
  }, []);

  useEffect(() => {
    // Handle navigation based on auth state
    if (!isInitialized) return;

    const isAuthScreen = ['login', 'register'].includes(segments[0]);
    
    if (!user && !isAuthScreen) {
      // Redirect to login if not authenticated and not on auth screen
      router.replace('/login');
    } else if (user && isAuthScreen) {
      // Redirect to main app if authenticated and on auth screen
      // Fixed: Use correct route path
      router.replace('/auth/dashboard'); 
    }
  }, [user, segments, isInitialized]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated using your existing API
      const isAuthenticated = await ConnectionAPI.isAuthenticated();
      
      if (isAuthenticated) {
        // Try to get cached user first, then fetch from API if needed
        let userData = await ConnectionAPI.getCachedUser();
        
        if (!userData) {
          // If no cached user, fetch from API
          userData = await ConnectionAPI.getCurrentUser();
        }
        
        if (userData) {
          setUser(userData);
          console.log('User authenticated:', userData.username);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // If there's an error, clear any potentially corrupted auth data
      await ConnectionAPI.clearTokens();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const signIn = async (credentials) => {
    try {
      setIsLoading(true);
      
      // Fixed: Proper axios usage instead of mixing fetch and axios
        //   const response = await ConnectionAPI.login(credentials);
        //     if (response.success) {
        //     const userData = await ConnectionAPI.getCurrentUser();
        //     setUser(userData);
        //     }
        //     return response;
        //   });
        const response = await axios.post(`${getBaseUrl()}/api/login/`, credentials, {
        headers: {
            'Content-Type': 'application/json',
        },
        });
    
      // Fixed: axios response structure is different from fetch
      const data = response.data;
      
      // Fixed: Check response status correctly for axios
      if (response.status === 200 && data.access && data.refresh) {
        // Use your existing method to handle login success
        await ConnectionAPI.handleLoginSuccess(
          data.access, 
          data.refresh, 
          data.user
        );
        
        // Get the current user (will use cached data)
        const userData = await ConnectionAPI.getCurrentUser();
        setUser(userData);
        
        return { success: true };
      } else {
        throw new Error(data.message || data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle axios error structure
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'An error occurred during login';
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (credentials) => {
    try {
      setIsLoading(true);
      
      // Fixed: Proper axios usage instead of mixing fetch and axios
      const response = await axios.post(`${getBaseUrl()}/api/register/`, credentials, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Fixed: axios response structure
      const data = response.data;
      
      // Fixed: Check response status correctly for axios
      if (response.status === 200 || response.status === 201) {
        return { 
          success: true, 
          message: data.message || 'Registration successful'
        };
      } else {
        throw new Error(data.message || data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle axios error structure
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'An error occurred during registration';
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Use your existing logout handler
      await ConnectionAPI.handleLogout();
      setUser(null);
      
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, clear the user state and redirect
      setUser(null);
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      
      // Use your existing method to refresh user data
      const userData = await ConnectionAPI.refreshCurrentUser();
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails due to auth issues, sign out
      if (error.message?.includes('log in') || error.message?.includes('Session expired')) {
        await signOut();
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    // Use your existing debug method
    return await ConnectionAPI.checkAuthStatus();
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    refreshUser,
    checkAuthStatus,
    isLoading,
    isAuthenticated: !!user,
    // Expose some of your API methods for convenience
    api: {
      getStudents: () => ConnectionAPI.getStudents(),
      sendConnectionRequest: (receiverId) => ConnectionAPI.sendConnectionRequest(receiverId),
      respondToRequest: (requestId, action) => ConnectionAPI.respondToRequest(requestId, action),
      cancelRequest: (requestId) => ConnectionAPI.cancelRequest(requestId),
      getMyRequests: () => ConnectionAPI.getMyRequests(),
      getMyConnections: () => ConnectionAPI.getMyConnections(),
      removeConnection: (connectionId) => ConnectionAPI.removeConnection(connectionId),
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Alternative approach: Add these methods to your ConnectionAPI class
// If you prefer to keep API calls in your ConnectionAPI, add these methods:

/*
// Add to your ConnectionAPI class:

async login(credentials) {
  try {
    const response = await axios.post(`${this.getBaseUrl()}/api/login/`, credentials);
    const { access, refresh, user } = response.data;
    
    // Use existing method to handle login success
    await this.handleLoginSuccess(access, refresh, user);
    
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Login failed';
    return { success: false, error: errorMessage };
  }
}

async register(credentials) {
  try {
    const response = await axios.post(`${this.getBaseUrl()}/api/register/`, credentials);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Registration failed';
    return { success: false, error: errorMessage };
  }
}

// Then in your AuthContext, you would use:
const result = await ConnectionAPI.login(credentials);
if (result.success) {
  const userData = await ConnectionAPI.getCurrentUser();
  setUser(userData);
}
return result;
*/


















































// // contexts/AuthContext.js - AuthProvider using your ConnectionAPI
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { useRouter, useSegments } from 'expo-router';
// import ConnectionAPI from '../api/connectionService'; 
// import axios from 'axios';

// const AuthContext = createContext({});

// export function useAuth() {
//   return useContext(AuthContext);
// }

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const router = useRouter();
//   const segments = useSegments();

//   useEffect(() => {
//     // Initialize auth state on app start
//     initializeAuth();
//   }, []);

//   useEffect(() => {
//     // Handle navigation based on auth state
//     if (!isInitialized) return;

//     const isAuthScreen = ['login', 'register'].includes(segments[0]);
    
//     if (!user && !isAuthScreen) {
//       // Redirect to login if not authenticated and not on auth screen
//       router.replace('/login');
//     } else if (user && isAuthScreen) {
//       // Redirect to main app if authenticated and on auth screen
//       router.replace('/auth/dashboard');
//     }
//   }, [user, segments, isInitialized]);

//   const initializeAuth = async () => {
//     try {
//       setIsLoading(true);
      
//       // Check if user is authenticated using your existing API
//       const isAuthenticated = await ConnectionAPI.isAuthenticated();
      
//       if (isAuthenticated) {
//         // Try to get cached user first, then fetch from API if needed
//         let userData = await ConnectionAPI.getCachedUser();
        
//         if (!userData) {
//           // If no cached user, fetch from API
//           userData = await ConnectionAPI.getCurrentUser();
//         }
        
//         if (userData) {
//           setUser(userData);
//           console.log('User authenticated:', userData.username);
//         }
//       }
//     } catch (error) {
//       console.error('Auth initialization error:', error);
//       // If there's an error, clear any potentially corrupted auth data
//       await ConnectionAPI.clearTokens();
//     } finally {
//       setIsLoading(false);
//       setIsInitialized(true);
//     }
//   };

//   const signIn = async (credentials) => {
//     try {
//       setIsLoading(true);
      
//       // You'll need to add a login method to your ConnectionAPI
//       // For now, I'll show how it would work with your existing structure
//       const response = await axios.post(ConnectionAPI.getBaseUrl() + '/api/login/', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(credentials),
//       });
      
//       const data = await response.json();
      
//       if (response.ok && data.access && data.refresh) {
//         // Use your existing method to handle login success
//         await ConnectionAPI.handleLoginSuccess(
//           data.access, 
//           data.refresh, 
//           data.user
//         );
        
//         // Get the current user (will use cached data)
//         const userData = await ConnectionAPI.getCurrentUser();
//         setUser(userData);
        
//         return { success: true };
//       } else {
//         throw new Error(data.message || data.error || 'Login failed');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       return { 
//         success: false, 
//         error: error.message || 'An error occurred during login'
//       };
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const signUp = async (credentials) => {
//     try {
//       setIsLoading(true);
      
//       // Add register endpoint call
//       const response = await axios.post(ConnectionAPI.getBaseUrl() + '/api/register/', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(credentials),
//       });
      
//       const data = await response.json();
      
//       if (response.ok) {
//         return { 
//           success: true, 
//           message: data.message || 'Registration successful'
//         };
//       } else {
//         throw new Error(data.message || data.error || 'Registration failed');
//       }
//     } catch (error) {
//       console.error('Registration error:', error);
//       return { 
//         success: false, 
//         error: error.message || 'An error occurred during registration'
//       };
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const signOut = async () => {
//     try {
//       setIsLoading(true);
      
//       // Use your existing logout handler
//       await ConnectionAPI.handleLogout();
//       setUser(null);
      
//       router.replace('/login');
//     } catch (error) {
//       console.error('Error signing out:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const refreshUser = async () => {
//     try {
//       setIsLoading(true);
      
//       // Use your existing method to refresh user data
//       const userData = await ConnectionAPI.refreshCurrentUser();
//       setUser(userData);
      
//       return userData;
//     } catch (error) {
//       console.error('Error refreshing user:', error);
//       // If refresh fails due to auth issues, sign out
//       if (error.message?.includes('log in')) {
//         await signOut();
//       }
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const checkAuthStatus = async () => {
//     // Use your existing debug method
//     return await ConnectionAPI.checkAuthStatus();
//   };

//   const value = {
//     user,
//     signIn,
//     signUp,
//     signOut,
//     refreshUser,
//     checkAuthStatus,
//     isLoading,
//     isAuthenticated: !!user,
//     // Expose some of your API methods for convenience
//     api: {
//       getStudents: () => ConnectionAPI.getStudents(),
//       sendConnectionRequest: (receiverId) => ConnectionAPI.sendConnectionRequest(receiverId),
//       respondToRequest: (requestId, action) => ConnectionAPI.respondToRequest(requestId, action),
//       cancelRequest: (requestId) => ConnectionAPI.cancelRequest(requestId),
//       getMyRequests: () => ConnectionAPI.getMyRequests(),
//       getMyConnections: () => ConnectionAPI.getMyConnections(),
//       removeConnection: (connectionId) => ConnectionAPI.removeConnection(connectionId),
//     }
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// }