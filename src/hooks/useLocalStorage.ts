import { useState, useEffect, useCallback, useRef } from 'react';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const keyRef = useRef(key);
  keyRef.current = key;

  const setValue: SetValue<T> = useCallback((value) => {
    try {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? (value as (prev: T) => T)(prev) : value;
        try {
          window.localStorage.setItem(keyRef.current, JSON.stringify(valueToStore));
          window.dispatchEvent(new CustomEvent('local-storage-change', { detail: { key: keyRef.current, value: valueToStore } }));
        } catch (e) {
          console.error(`Error setting localStorage key "${keyRef.current}":`, e);
        }
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {}
      }
    };

    const handleCustomChange = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.key === key) {
        setStoredValue(custom.detail.value);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-change', handleCustomChange as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleCustomChange as EventListener);
    };
  }, [key]);

  return [storedValue, setValue];
}

export function useSystemTheme() {
  const [isDark, setIsDark] = useState(() => 
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  return isDark ? 'dark' : 'light';
}
