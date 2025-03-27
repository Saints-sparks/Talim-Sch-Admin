import { parse } from 'cookie';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const getLocalStorageItem = (): User | null => {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie;
  const parsedCookies = parse(cookies);
  const userData = parsedCookies.user;
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user && typeof user === 'object' && 'id' in user) {
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};
