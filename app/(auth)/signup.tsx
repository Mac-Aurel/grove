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
import { EnvelopeSimple, User, Lock } from 'phosphor-react-native';
import { supabase } from '../../lib/supabase';
import { Colors, Radius } from '../../constants/theme';

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  general?: string;
}

function validate(email: string, username: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!username) {
    errors.username = 'Username is required';
  } else if (username.length < 2) {
    errors.username = 'Username must be at least 2 characters';
  } else if (username.length > 30) {
    errors.username = 'Username must be 30 characters or less';
  } else if (!/^[a-z0-9_]+$/.test(username)) {
    errors.username = 'Only lowercase letters, numbers, and underscores';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
}

export default function SignupScreen(): React.JSX.Element {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    const validationErrors = validate(email, username.toLowerCase(), password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.toLowerCase().trim(),
          display_name: username.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrors({ general: error.message });
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

          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.subheading}>Join grove and start planning.</Text>

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
              <View style={[styles.inputRow, inputBorder('username')]}>
                <User size={18} color={focusedField === 'username' ? Colors.accent : Colors.muted} weight="regular" />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={Colors.muted}
                  value={username}
                  onChangeText={(v) => { setUsername(v); setErrors((e) => ({ ...e, username: undefined })); }}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username-new"
                />
              </View>
              {errors.username ? <Text style={styles.fieldError}>{errors.username}</Text> : null}
            </View>

            <View>
              <View style={[styles.inputRow, inputBorder('password')]}>
                <Lock size={18} color={focusedField === 'password' ? Colors.accent : Colors.muted} weight="regular" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.muted}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
              </View>
              {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
            </View>
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
              <Text style={styles.buttonPrimaryText}>Create account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchLink}>Sign in</Text>
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
    marginBottom: 24,
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
