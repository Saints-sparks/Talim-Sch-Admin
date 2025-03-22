import { parse } from 'cookie';
import { User } from '@/app/types/user';

export const getLocalStorageItem = (key: string): User | null => {
  const cookies = document.cookie;
  const parsedCookies = parse(cookies);
  const userData = parsedCookies.user;
  
  if (userData) {
    try {
      return JSON.parse(userData) as User;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};
