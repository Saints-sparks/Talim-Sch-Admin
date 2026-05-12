"use client";

import { parse, serialize } from "cookie";

const isBrowser = typeof window !== "undefined";

export const getLocalStorageItem = (key: string): any | null => {
  if (!isBrowser) return null;

  try {
    const readStorageValue = (storageData: string | null | undefined) => {
      if (storageData === null || storageData === undefined) return undefined;

      // Special handling for token keys - return raw if JWT
      if (
        (key === "accessToken" || key === "token" || key === "refreshToken") &&
        storageData.startsWith("eyJ")
      ) {
        return storageData; // Return raw token if it's a JWT token key
      }
      // For user data and other keys, always try to parse as JSON
      try {
        return JSON.parse(storageData);
      } catch (parseError) {
        // If parsing fails, return raw data for tokens
        if (
          key === "accessToken" ||
          key === "token" ||
          key === "refreshToken"
        ) {
          return storageData;
        }
        return null;
      }
    };

    // Try to get from localStorage first
    const localStorageValue = readStorageValue(localStorage.getItem(key));
    if (localStorageValue !== undefined) {
      return localStorageValue;
    }

    // Then try sessionStorage for session-only logins
    const sessionStorageValue = readStorageValue(sessionStorage.getItem(key));
    if (sessionStorageValue !== undefined) {
      return sessionStorageValue;
    }

    // If not in localStorage, try cookies
    const cookies = document.cookie;
    if (cookies) {
      const parsedCookies = parse(cookies);
      const cookieData = parsedCookies[key];

      if (cookieData !== null && cookieData !== undefined) {
        // Special handling for token keys - return raw if JWT
        if (
          (key === "accessToken" ||
            key === "token" ||
            key === "refreshToken") &&
          cookieData.startsWith("eyJ")
        ) {
          return cookieData; // Return raw token if it's a JWT token key
        }
        // For user data and other keys, always try to parse as JSON
        try {
          return JSON.parse(cookieData);
        } catch (parseError) {
          // If parsing fails, return raw data for tokens
          if (
            key === "accessToken" ||
            key === "token" ||
            key === "refreshToken"
          ) {
            return cookieData;
          }
          return null;
        }
      }
    }
  } catch (error) {
    console.error(
      `Error accessing localStorage/cookies for key '${key}':`,
      error
    );
    return null;
  }

  return null;
};

export const setLocalStorageItem = (key: string, value: any) => {
  if (!isBrowser) return;

  try {
    // If value is a string that looks like a JWT, store directly
    if (typeof value === "string" && value.startsWith("eyJ")) {
      localStorage.setItem(key, value);
      document.cookie = serialize(key, value, {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
        sameSite: "strict",
      });
    } else {
      // Otherwise stringify the value
      localStorage.setItem(key, JSON.stringify(value));
      document.cookie = serialize(key, JSON.stringify(value), {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
        sameSite: "strict",
      });
    }
  } catch (error) {
    console.error("Error setting storage:", error);
  }
};
