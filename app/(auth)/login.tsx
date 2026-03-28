import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { EnvelopeSimple, Eye, EyeSlash } from 'phosphor-react-native';
import { supabase } from '../../lib/supabase';
import { Colors, Radius } from '../../constants/theme';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  return errors;
}

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    const validationErrors = validate(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrors({ general: 'Invalid email or password' });
      return;
    }

    router.replace('/(tabs)/');
  };

  const inputBorder = (field: string): object => ({
    borderColor: errors[field as keyof FormErrors]
      ? '#D94F4F'
      : focusedField === field
      ? Colors.accent
      : Colors.border,
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.back} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to your account.</Text>

          {errors.general ? (
            <View style={styles.generalError}>
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <View>
              <View style={[styles.inputRow, inputBorder('email')]}>
                <EnvelopeSimple size={18} color={focusedField === 'email' ? Colors.accent : Colors.muted} weight="regular" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={Colors.muted}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
              {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
            </View>

            <View>
              <View style={[styles.inputRow, inputBorder('password')]}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.muted}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} activeOpacity={0.7}>
                  {showPassword ? (
                    <EyeSlash size={18} color={Colors.muted} weight="regular" />
                  ) : (
                    <Eye size={18} color={Colors.muted} weight="regular" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/signup')} activeOpacity={0.7}>
            <Text style={styles.switchText}>
              No account yet?{' '}
              <Text style={styles.switchLink}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 48,
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
  generalError: {
    backgroundColor: '#FDF2F2',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#D94F4F',
    padding: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#D94F4F',
  },
  fields: {
    gap: 12,
    marginBottom: 12,
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
    marginTop: 4,
    marginLeft: 4,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.accent,
  },
  buttonPrimary: {
    height: 52,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  switchText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
  },
  switchLink: {
    color: Colors.accent,
    fontWeight: '500',
  },
});
