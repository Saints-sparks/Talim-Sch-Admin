import { parse } from 'cookie';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const getLocalStorageItem = (key: string): any | null => {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie;
  const parsedCookies = parse(cookies);
  const userData = parsedCookies[key];
  
  if (userData) {
    try {
      const data = JSON.parse(userData);
      if (data && typeof data === 'object') {
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error parsing data:', error);
      return null;
    }
  }
  return null;
};
