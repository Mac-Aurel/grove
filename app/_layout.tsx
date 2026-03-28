import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSession } from '../hooks/useSession';
import { useOnboarding } from '../hooks/useOnboarding';
import { Colors } from '../constants/theme';
import '../global.css';

function RootLayoutNav(): React.JSX.Element {
  const { session } = useSession();
  const { completed: onboardingCompleted } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inOnboarding = segments[0] === '(onboarding)';
    const inAuth = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';

    if (!onboardingCompleted) {
      if (!inOnboarding) router.replace('/(onboarding)/');
      return;
    }

    if (session && !inTabs) {
      router.replace('/(tabs)/today');
    } else if (!session && !inAuth) {
      router.replace('/(auth)/welcome');
    }
  }, [session, onboardingCompleted, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
    </Stack>
  );
}

export default function RootLayout(): React.JSX.Element {
  const { loading: sessionLoading } = useSession();
  const { completed: onboardingCompleted } = useOnboarding();

  if (sessionLoading || onboardingCompleted === null) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color={Colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loader: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
