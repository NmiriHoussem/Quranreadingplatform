import { useEffect, useState } from 'react';

const DARK_MODE_KEY_GUEST = 'quran_companion_dark_mode_guest';
const DARK_MODE_KEY_AUTH = 'quran_companion_dark_mode_auth';

export const useDarkMode = (isAuthenticated: boolean = false) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Use different keys for guest vs authenticated users
    const storageKey = isAuthenticated ? DARK_MODE_KEY_AUTH : DARK_MODE_KEY_GUEST;
    
    // Check localStorage first
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      return saved === 'true';
    }
    
    // Fall back to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false; // Default to light mode
  });

  // Update dark mode when authentication status changes
  useEffect(() => {
    const storageKey = isAuthenticated ? DARK_MODE_KEY_AUTH : DARK_MODE_KEY_GUEST;
    const saved = localStorage.getItem(storageKey);
    
    if (saved !== null) {
      setIsDarkMode(saved === 'true');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Apply dark mode class on mount and when it changes
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      const storageKey = isAuthenticated ? DARK_MODE_KEY_AUTH : DARK_MODE_KEY_GUEST;
      localStorage.setItem(storageKey, newValue.toString());
      return newValue;
    });
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    const storageKey = isAuthenticated ? DARK_MODE_KEY_AUTH : DARK_MODE_KEY_GUEST;
    localStorage.setItem(storageKey, value.toString());
  };

  return {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
  };
};