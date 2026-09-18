"use client";

import { logger } from "@/lib/logger";
import { parse, serialize } from "cookie";

const isBrowser = typeof window !== "undefined";

/**
 * Reads a JSON value previously stored under `key`, falling back to the
 * cookie copy when localStorage is unavailable (private windows, blocked
 * site data).
 *
 * @param key - Storage key.
 * @returns The parsed value, or `null` when absent or unreadable.
 */
export const getLocalStorageItem = <T = unknown>(key: string): T | null => {
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
          return cookieData as T; // a raw JWT, not JSON
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
            return cookieData as T;
          }
          return null;
        }
      }
    }
  } catch (error) {
    logger.error("storage", `Could not read '${key}' from localStorage or cookies`, error);
    return null;
  }

  return null;
};

/**
 * Stores a JSON value under `key`, mirroring it into a cookie so a reload
 * before hydration can still read it.
 *
 * @param key - Storage key.
 * @param value - Any JSON-serialisable value.
 */
export const setLocalStorageItem = (key: string, value: unknown) => {
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
    logger.error("storage", `Could not store '${key}'`, error);
  }
};
