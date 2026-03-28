import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useSession } from '../hooks/useSession';
import { Colors } from '../constants/theme';
import '../global.css';

function useAuthRedirect(): void {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(tabs)/');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    }
  }, [session, loading, segments]);
}

function RootLayoutNav(): React.JSX.Element {
  useAuthRedirect();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default function RootLayout(): React.JSX.Element {
  const { loading } = useSession();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color={Colors.accent} />
      </View>
    );
  }

  return <RootLayoutNav />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
