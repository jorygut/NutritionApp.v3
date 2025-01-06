import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerBackTitle: 'Go Back',
          headerBackTitleStyle: { fontSize: 16, color: 'blue' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="stats/trends"
          options={{
            headerTitle: 'Trends',
          }}
        />
        <Stack.Screen
          name="stats/measurements"
          options={{
            headerTitle: 'Your Stats',
          }}
        />
        <Stack.Screen
          name="goals/goal1"
          options={{
            headerTitle: 'Nutrition Goals',
          }}
        />
        <Stack.Screen
          name="goals/goal2"
          options={{
            headerTitle: 'Weight Logs',
          }}
        />
        <Stack.Screen
          name="goals/coachSettings"
          options={{
            headerTitle: 'Virtual Coach',
          }}
        />
        <Stack.Screen
          name="add/addFood"
          options={{
            headerTitle: 'Add Food',
          }}
        />
        <Stack.Screen
          name="add/addDetails"
          options={{
            headerTitle: 'Food Details',
          }}
        />
        <Stack.Screen
          name="add/seeDetails"
          options={{
            headerTitle: 'Details',
          }}
        />
        <Stack.Screen
          name="stats/weightLogs"
          options={{
            headerTitle: 'Weight History',
          }}
        />
        <Stack.Screen
          name="goals/calculateCalories"
          options={{
            headerTitle: 'Calculate Your Calorie Needs',
          }}
        />
        <Stack.Screen
          name="settings/login"
          options={{
            headerTitle: 'Login',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
