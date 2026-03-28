import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radius } from '../../constants/theme';

export default function WelcomeScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.wordmark}>grove</Text>
        <Text style={styles.subtitle}>plan tomorrow, tonight</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => router.push('/(auth)/signup')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonPrimaryText}>Create account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonGhost}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonGhostText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'Playfair Display',
    fontSize: 42,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.muted,
    letterSpacing: 0.1,
  },
  actions: {
    gap: 12,
  },
  buttonPrimary: {
    height: 52,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  buttonGhost: {
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGhostText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: 0.1,
  },
});
