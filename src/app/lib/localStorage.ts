type LocalStorageItem = {
  schoolId: string;
  // Add other user properties as needed
};

export const getLocalStorageItem = (key: string): LocalStorageItem | null => {
  if (typeof window === 'undefined') return null;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export const setLocalStorageItem = (key: string, value: LocalStorageItem): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};
