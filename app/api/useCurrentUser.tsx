

// First, create this custom hook (useCurrentUser.js)
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);

  const loadUser = async () => {
    try {
      setUserLoading(true);
      setUserError(null);

      // Try AsyncStorage first
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setUserLoading(false);
        return user;
      }

      // If no stored data, try to get from token payload or API
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Try to fetch user profile from API
      const response = await axios.get('http://127.0.0.1:8000/api/users/current/');
    
      const user = response.data;
      
      // Store for future use
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      setCurrentUser(user);
      
      return user;
    } catch (error) {
      console.error('Error loading user:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['user_data', 'access_token']);
      }

      setUserError(error.message);
      setCurrentUser(null);
      return null;
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const refreshUser = () => {
    return loadUser();
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['user_data', 'access_token']);
      delete axios.defaults.headers.common['Authorization'];
      setCurrentUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };


  const updateUser = async (updatedData) => {
    try {
      const response = await axios.patch('http://127.0.0.1:8000/api/users/me/', updatedData);
      const user = response.data;
      
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      setCurrentUser(user);
      
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };



  return {
    currentUser,
    userLoading,
    userError,
    refreshUser
  };
};