
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

// export function useProtectedRoute() {
const useProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // Return a loading component that can be used directly
  const LoadingComponent = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#667eea" />
    </View>
  );

  return { 
    user, 
    isLoading, 
    isAuthenticated: !!user,
    LoadingComponent 
  };
}
export default useProtectedRoute;   
