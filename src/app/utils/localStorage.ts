"use client";

import { parse, serialize } from "cookie";

const isBrowser = typeof window !== "undefined";

export const getLocalStorageItem = (key: string): any | null => {
  if (!isBrowser) return null;

  try {
    // Try to get from localStorage first
    const localStorageData = localStorage.getItem(key);
    if (localStorageData) {
      // Special handling for token keys - return raw if JWT
      if (
        (key === "accessToken" || key === "token" || key === "refreshToken") &&
        localStorageData.startsWith("eyJ")
      ) {
        return localStorageData; // Return raw token if it's a JWT token key
      }
      // For user data and other keys, always try to parse as JSON
      return JSON.parse(localStorageData);
    }

    // If not in localStorage, try cookies
    const cookies = document.cookie;
    const parsedCookies = parse(cookies);
    const cookieData = parsedCookies[key];

    if (cookieData) {
      // Special handling for token keys - return raw if JWT
      if (
        (key === "accessToken" || key === "token" || key === "refreshToken") &&
        cookieData.startsWith("eyJ")
      ) {
        return cookieData; // Return raw token if it's a JWT token key
      }
      // For user data and other keys, always try to parse as JSON
      return JSON.parse(cookieData);
    }
  } catch (error) {
    console.error(`Error parsing localStorage item '${key}':`, error);
    // If JSON.parse fails, return the raw value for token keys only
    if (key === "accessToken" || key === "token" || key === "refreshToken") {
      const rawData = localStorage.getItem(key);
      if (rawData && rawData.startsWith("eyJ")) {
        return rawData;
      }
    }
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
