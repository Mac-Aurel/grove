import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'onboarding_complete';
type Listener = (value: boolean | null) => void;

// Module-level singleton so all hook instances share state
let _state: boolean | null = null;
let _loading = false;
const _listeners = new Set<Listener>();

function broadcast(value: boolean | null): void {
  _state = value;
  _listeners.forEach((fn) => fn(value));
}

async function loadState(): Promise<void> {
  if (_loading || _state !== null) return;
  _loading = true;
  try {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem(KEY)
        : await SecureStore.getItemAsync(KEY);
    broadcast(raw === 'true');
  } catch {
    broadcast(false);
  } finally {
    _loading = false;
  }
}

export interface UseOnboardingResult {
  completed: boolean | null;
  completeOnboarding: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingResult {
  const [completed, setCompleted] = useState<boolean | null>(_state);

  useEffect(() => {
    _listeners.add(setCompleted);
    loadState();
    return () => {
      _listeners.delete(setCompleted);
    };
  }, []);

  const completeOnboarding = async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(KEY, 'true');
      } else {
        await SecureStore.setItemAsync(KEY, 'true');
      }
    } finally {
      broadcast(true);
    }
  };

  return { completed, completeOnboarding };
}
