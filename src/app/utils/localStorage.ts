import { parse, serialize } from 'cookie';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const getLocalStorageItem = (key: string): any | null => {
  if (typeof window === 'undefined') return null;

  // Try to get from localStorage first
  const localStorageData = localStorage.getItem(key);
  if (localStorageData) {
    try {
      return JSON.parse(localStorageData);
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
    }
  }

  // If not in localStorage, try cookies
  const cookies = document.cookie;
  const parsedCookies = parse(cookies);
  const cookieData = parsedCookies[key];
  
  if (cookieData) {
    try {
      return JSON.parse(cookieData);
    } catch (error) {
      console.error('Error parsing cookie data:', error);
    }
  }
  
  return null;
};

export const setLocalStorageItem = (key: string, value: any) => {
  if (typeof window === 'undefined') return;

  // Store in localStorage
  localStorage.setItem(key, JSON.stringify(value));

  // Also store in cookies
  const cookieValue = JSON.stringify(value);
  document.cookie = serialize(key, cookieValue, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
    sameSite: 'strict',
  });
};

export const removeLocalStorageItem = (key: string) => {
  if (typeof window === 'undefined') return;

  // Remove from localStorage
  localStorage.removeItem(key);

  // Remove from cookies
  document.cookie = serialize(key, '', {
    maxAge: -1,
    path: '/',
  });
};
