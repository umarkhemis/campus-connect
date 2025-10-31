
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    // Add your custom fonts here if needed
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth screens - no tabs */}
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        
        {/* Main app with tabs - Protected */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        
        {/* Modal/standalone screens - Protected */}
        <Stack.Screen 
          name="change-password" 
          options={{ 
            presentation: 'modal',
            title: 'Change Password',
            headerShown: true,
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff'
          }} 
        />
        <Stack.Screen 
          name="edit-profile" 
          options={{ 
            presentation: 'modal',
            title: 'Edit Profile',
            headerShown: true,
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff'
          }} 
        />
        <Stack.Screen 
          name="post-details" 
          options={{ 
            presentation: 'modal',
            title: 'Post Details',
            headerShown: true,
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff'
          }} 
        />
        
        {/* Keep your existing forum and lost-found as stack groups - Protected */}
        <Stack.Screen name="forum" options={{ headerShown: false }} />
        <Stack.Screen name="lost-found" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}






















































// import { Stack } from 'expo-router';
// import { useFonts } from 'expo-font';
// // import { SplashScreen } from 'expo-splash-screen';
// import * as SplashScreen from 'expo-splash-screen'
// import { useEffect } from 'react';

// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   const [loaded] = useFonts({
//     // Add your custom fonts here if needed
//   });

//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!loaded) {
//     return null;
//   }

//   return (
//     <Stack screenOptions={{ headerShown: false }}>
//       {/* Auth screens - no tabs */}
//       {/* <Stack.Screen name="index" /> */}
//       <Stack.Screen name="login" />
//       <Stack.Screen name="register" />
      
//       {/* Main app with tabs */}
//       <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      
//       {/* Modal/standalone screens */}
//       <Stack.Screen 
//         name="change-password" 
//         options={{ 
//           presentation: 'modal',
//           title: 'Change Password',
//           headerShown: true,
//           headerStyle: { backgroundColor: '#667eea' },
//           headerTintColor: '#fff'
//         }} 
//       />
//       <Stack.Screen 
//         name="edit-profile" 
//         options={{ 
//           presentation: 'modal',
//           title: 'Edit Profile',
//           headerShown: true,
//           headerStyle: { backgroundColor: '#667eea' },
//           headerTintColor: '#fff'
//         }} 
//       />
//       <Stack.Screen 
//         name="post-details" 
//         options={{ 
//           presentation: 'modal',
//           title: 'Post Details',
//           headerShown: true,
//           headerStyle: { backgroundColor: '#667eea' },
//           headerTintColor: '#fff'
//         }} 
//       />
      
//       {/* Keep your existing forum and lost-found as stack groups */}
//       <Stack.Screen name="forum" options={{ headerShown: false }} />
//       <Stack.Screen name="lost-found" options={{ headerShown: false }} />
//     </Stack>
//   );
// }




























// / import { Tabs } from "expo-router";

// export default function RootLayout() {
//   return (
//     <Tabs>
//       {/* The screens will be automatically picked up from the file structure, e.g., app/events.tsx and app/clubs.tsx */}
//     </Tabs>
//   );
// }
