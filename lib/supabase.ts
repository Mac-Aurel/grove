import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = '_chunk_count';

async function secureStoreSet(key: string, value: string): Promise<void> {
  const chunks = Math.ceil(value.length / CHUNK_SIZE);
  await SecureStore.setItemAsync(key + CHUNK_COUNT_SUFFIX, String(chunks));
  for (let i = 0; i < chunks; i++) {
    await SecureStore.setItemAsync(
      `${key}_chunk_${i}`,
      value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
    );
  }
}

async function secureStoreGet(key: string): Promise<string | null> {
  const countStr = await SecureStore.getItemAsync(key + CHUNK_COUNT_SUFFIX);
  if (!countStr) return null;
  const count = parseInt(countStr, 10);
  let value = '';
  for (let i = 0; i < count; i++) {
    const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
    if (chunk === null) return null;
    value += chunk;
  }
  return value;
}

async function secureStoreRemove(key: string): Promise<void> {
  const countStr = await SecureStore.getItemAsync(key + CHUNK_COUNT_SUFFIX);
  if (countStr) {
    const count = parseInt(countStr, 10);
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
    }
  }
  await SecureStore.deleteItemAsync(key + CHUNK_COUNT_SUFFIX);
}

const nativeStorage = {
  getItem: secureStoreGet,
  setItem: secureStoreSet,
  removeItem: secureStoreRemove,
};

const webStorage = {
  getItem: (key: string): Promise<string | null> => {
    return Promise.resolve(localStorage.getItem(key));
  },
  setItem: (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const storage = Platform.OS === 'web' ? webStorage : nativeStorage;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
