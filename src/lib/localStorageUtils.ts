"use client";

export const loadStateFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return defaultValue;
    }
    return JSON.parse(serializedState) as T;
  } catch (error) {
    console.warn(`Error loading state for key "${key}" from localStorage:`, error);
    return defaultValue;
  }
};

export const saveStateToLocalStorage = <T>(key: string, state: T): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(key, serializedState);
  } catch (error) {
    console.warn(`Error saving state for key "${key}" to localStorage:`, error);
  }
};
