import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { EnvelopeSimple } from 'phosphor-react-native';
import { supabase } from '../../lib/supabase';
import { Colors, Radius } from '../../constants/theme';

export default function ForgotPasswordScreen(): React.JSX.Element {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [focusedField, setFocusedField] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address');
      return;
    }

    setEmailError('');
    setLoading(true);

    await supabase.auth.resetPasswordForEmail(email.trim());

    setLoading(false);
    setSubmitted(true);
  };

  const borderColor = emailError
    ? '#D94F4F'
    : focusedField
    ? Colors.accent
    : Colors.border;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Reset password</Text>
          <Text style={styles.subheading}>
            Enter your email and we'll send you a reset link.
          </Text>

          {submitted ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Check your inbox</Text>
              <Text style={styles.successBody}>
                If an account exists for {email}, you'll receive a password reset link shortly.
              </Text>
            </View>
          ) : (
            <>
              <View>
                <View style={[styles.inputRow, { borderColor }]}>
                  <EnvelopeSimple
                    size={18}
                    color={focusedField ? Colors.accent : Colors.muted}
                    weight="regular"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={Colors.muted}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setEmailError(''); }}
                    onFocus={() => setFocusedField(true)}
                    onBlur={() => setFocusedField(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                  />
                </View>
                {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonPrimaryText}>Send reset link</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  back: {
    marginBottom: 32,
  },
  backText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.muted,
  },
  heading: {
    fontFamily: 'Playfair Display',
    fontSize: 28,
    color: Colors.text,
    marginBottom: 8,
  },
  subheading: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.muted,
    marginBottom: 32,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.text,
  },
  fieldError: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#D94F4F',
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  buttonPrimary: {
    height: 52,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPrimaryText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successBox: {
    backgroundColor: '#F2F7F1',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    padding: 20,
  },
  successTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  successBody: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
  },
});
