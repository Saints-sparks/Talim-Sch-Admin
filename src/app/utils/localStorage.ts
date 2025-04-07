'use client';

import { parse, serialize } from 'cookie';

const isBrowser = typeof window !== 'undefined';

export const getLocalStorageItem = (key: string): any | null => {
  if (!isBrowser) return null;

  try {
    // Try to get from localStorage first
    const localStorageData = localStorage.getItem(key);
    if (localStorageData) {
      // Check if it's a JWT token (starts with eyJ)
      if (localStorageData.startsWith('eyJ')) {
        return localStorageData; // Return raw token if it's a JWT
      }
      return JSON.parse(localStorageData);
    }

    // If not in localStorage, try cookies
    const cookies = document.cookie;
    const parsedCookies = parse(cookies);
    const cookieData = parsedCookies[key];
    
    if (cookieData) {
      if (cookieData.startsWith('eyJ')) {
        return cookieData; // Return raw token if it's a JWT
      }
      return JSON.parse(cookieData);
    }
  } catch (error) {
    console.error('Error accessing storage:', error);
    return null;
  }
  
  return null;
};

export const setLocalStorageItem = (key: string, value: any) => {
  if (!isBrowser) return;

  try {
    // If value is a string that looks like a JWT, store directly
    if (typeof value === 'string' && value.startsWith('eyJ')) {
      localStorage.setItem(key, value);
      document.cookie = serialize(key, value, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
        sameSite: 'strict',
      });
    } else {
      // Otherwise stringify the value
      localStorage.setItem(key, JSON.stringify(value));
      document.cookie = serialize(key, JSON.stringify(value), {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
        sameSite: 'strict',
      });
    }
  } catch (error) {
    console.error('Error setting storage:', error);
  }
};