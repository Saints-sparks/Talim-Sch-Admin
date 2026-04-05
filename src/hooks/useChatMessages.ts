// hooks/useChatMessages.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { chatService } from '@/services/chatServices';
import { ChatMessage } from '@/types/chat.types';
import { toast } from 'react-toastify';

export interface UseChatMessagesReturn {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isLoadingNewer: boolean;
  hasMoreOlder: boolean;
  hasMoreNewer: boolean;
  error: string | null;
  totalCount: number;
  
  // Pagination cursors
  oldestCursor: string | undefined;
  newestCursor: string | undefined;
  
  // Actions
  fetchMessages: (roomId: string, options?: FetchMessagesOptions) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  loadNewerMessages: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (messageId: string) => void;
  clearMessages: () => void;
  reset: () => void;
}

interface FetchMessagesOptions {
  limit?: number;
  cursor?: string;
  direction?: 'before' | 'after';
  replaceExisting?: boolean;
  force?: boolean; // Add force option to bypass throttling
}

// Throttling configuration
const FETCH_THROTTLE_MS = 5000; // 5 seconds minimum between fetches for same room
const PAGINATION_THROTTLE_MS = 2000; // 2 seconds between pagination requests

const createAsyncDebounce = (fn: () => Promise<void>, waitMs: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let previousResolve: (() => void) | null = null;

  return () =>
    new Promise<void>((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Resolve the previous queued caller since its invocation is superseded.
      if (previousResolve) {
        previousResolve();
      }

      previousResolve = resolve;

      timeoutId = setTimeout(async () => {
        timeoutId = null;
        previousResolve = null;

        try {
          await fn();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, waitMs);
    });
};

export const useChatMessages = (): UseChatMessagesReturn => {
  const { isAuthenticated, accessToken } = useAuth();
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isLoadingNewer, setIsLoadingNewer] = useState<boolean>(false);
  const [hasMoreOlder, setHasMoreOlder] = useState<boolean>(true);
  const [hasMoreNewer, setHasMoreNewer] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  // Pagination cursors
  const [oldestCursor, setOldestCursor] = useState<string | undefined>();
  const [newestCursor, setNewestCursor] = useState<string | undefined>();
  
  // Refs for throttling
  const currentRoomIdRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Throttling refs
  const lastFetchTimeRef = useRef<Map<string, number>>(new Map());
  const pendingFetchRef = useRef<Map<string, boolean>>(new Map());
  const lastPaginationTimeRef = useRef<number>(0);
  
  // Request cache to prevent duplicate in-flight requests
  const inFlightRequestsRef = useRef<Map<string, Promise<any>>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear all maps
      lastFetchTimeRef.current.clear();
      pendingFetchRef.current.clear();
      inFlightRequestsRef.current.clear();
    };
  }, []);

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Generate a cache key for a request
   */
  const getRequestKey = useCallback((roomId: string, options: FetchMessagesOptions): string => {
    return `${roomId}:${options.cursor || 'initial'}:${options.direction || 'before'}:${options.limit || 50}`;
  }, []);

  /**
   * Check if we should throttle this request
   */
  const shouldThrottle = useCallback((roomId: string, options: FetchMessagesOptions): boolean => {
    const now = Date.now();
    
    // If force is true, don't throttle
    if (options.force) return false;
    
    // For pagination requests (with cursor)
    if (options.cursor) {
      return (now - lastPaginationTimeRef.current) < PAGINATION_THROTTLE_MS;
    }
    
    // For initial fetches
    const lastFetch = lastFetchTimeRef.current.get(roomId) || 0;
    return (now - lastFetch) < FETCH_THROTTLE_MS;
  }, []);

  /**
   * Fetch messages with cursor-based pagination
   */
const fetchMessages = useCallback(async (
  roomId: string,
  options: FetchMessagesOptions = {}
): Promise<void> => {
  // Add trace to see what's calling this
  console.group(`🔍 Fetch triggered for room ${roomId}`);
  console.trace('Call stack:');
  console.log('Options:', { roomId, ...options });
  console.groupEnd();

  if (!isAuthenticated || !accessToken) {
    setError('You must be logged in to fetch messages');
    return;
  }
    // Check if there's already a pending request for this exact params
    const requestKey = getRequestKey(roomId, options);
    if (inFlightRequestsRef.current.has(requestKey)) {
      console.log(`⏳ Request already in flight for ${requestKey}`);
      try {
        await inFlightRequestsRef.current.get(requestKey);
      } catch (error) {
        // Request failed, we'll continue to try again
      }
      return;
    }

    // Check if there's a pending fetch for this room (any request)
    if (pendingFetchRef.current.get(roomId)) {
      console.log(`⏳ Fetch already in progress for room ${roomId}`);
      return;
    }

    // Cancel any ongoing requests for different params
    if (abortControllerRef.current && !options.cursor) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const {
      limit = 50,
      cursor,
      direction = 'before',
      replaceExisting = false
    } = options;

    // Set loading state based on whether this is initial load or pagination
    if (!cursor) {
      setIsLoading(true);
      // Mark room as having pending fetch
      pendingFetchRef.current.set(roomId, true);
    } else if (direction === 'before') {
      setIsLoadingMore(true);
    } else {
      setIsLoadingNewer(true);
    }

    setError(null);

    // Create the request promise
    const requestPromise = (async () => {
      try {
        const response = await chatService.getChatRoomMessagesWithCursor(
          roomId,
          limit,
          cursor,
          direction
        );

        // Check if component is still mounted
        if (!isMountedRef.current) return;

        // Update messages based on direction and replaceExisting flag
        if (replaceExisting) {
          setMessages(response.messages);
        } else if (direction === 'before') {
          setMessages(prev => [...response.messages, ...prev]);
        } else if (direction === 'after') {
          setMessages(prev => [...prev, ...response.messages]);
        }

        // Update pagination metadata
        setHasMoreOlder(response.hasMore);
        setOldestCursor(response.prevCursor);
        setNewestCursor(response.nextCursor);

        // Update current room ID
        currentRoomIdRef.current = roomId;

        // Update timing refs
        const now = Date.now();
        lastFetchTimeRef.current.set(roomId, now);
        if (cursor) {
          lastPaginationTimeRef.current = now;
        }

      } catch (err: any) {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
          console.log('Request was cancelled');
          return;
        }

        console.error('Error fetching messages:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch messages';
        
        if (isMountedRef.current) {
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
          setIsLoadingNewer(false);
          // Clear pending flags
          pendingFetchRef.current.delete(roomId);
          inFlightRequestsRef.current.delete(requestKey);
        }
      }
    })();

    // Store the promise
    inFlightRequestsRef.current.set(requestKey, requestPromise);
    await requestPromise;

  }, [isAuthenticated, accessToken, shouldThrottle, getRequestKey]);

  // Create debounced versions of pagination functions
  const debouncedLoadOlder = useCallback(
    createAsyncDebounce(async () => {
      if (!currentRoomIdRef.current) {
        setError('No chat room selected');
        return;
      }

      if (!hasMoreOlder || isLoadingMore || isLoading) {
        return;
      }

      await fetchMessages(currentRoomIdRef.current, {
        cursor: oldestCursor,
        direction: 'before',
        limit: 50
      });
    }, 300),
    [fetchMessages, hasMoreOlder, isLoadingMore, isLoading, oldestCursor]
  );

  const debouncedLoadNewer = useCallback(
    createAsyncDebounce(async () => {
      if (!currentRoomIdRef.current) {
        setError('No chat room selected');
        return;
      }

      if (!hasMoreNewer || isLoadingNewer || isLoading) {
        return;
      }

      await fetchMessages(currentRoomIdRef.current, {
        cursor: newestCursor,
        direction: 'after',
        limit: 50
      });
    }, 300),
    [fetchMessages, hasMoreNewer, isLoadingNewer, isLoading, newestCursor]
  );

  /**
   * Load older messages (pagination backward) - debounced
   */
  const loadOlderMessages = useCallback(async (): Promise<void> => {
    await debouncedLoadOlder();
  }, [debouncedLoadOlder]);

  /**
   * Load newer messages (pagination forward) - debounced
   */
  const loadNewerMessages = useCallback(async (): Promise<void> => {
    await debouncedLoadNewer();
  }, [debouncedLoadNewer]);

  /**
   * Refresh messages (get latest) - with force option
   */
  const refreshMessages = useCallback(async (force = false): Promise<void> => {
    if (!currentRoomIdRef.current) {
      setError('No chat room selected');
      return;
    }

    await fetchMessages(currentRoomIdRef.current, {
      limit: 50,
      replaceExisting: true,
      force
    });
  }, [fetchMessages]);

  /**
   * Add a new message to the list (optimistic update)
   */
  const addMessage = useCallback((message: ChatMessage): void => {
    setMessages(prev => {
      // Check if message already exists
      const exists = prev.some(m => m._id === message._id);
      if (exists) return prev;

      // Add new message and sort by createdAt
      const newMessages = [...prev, message].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      return newMessages;
    });
  }, []);

  /**
   * Update an existing message
   */
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>): void => {
    setMessages(prev => prev.map(msg => 
      msg._id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  /**
   * Remove a message from the list
   */
  const removeMessage = useCallback((messageId: string): void => {
    setMessages(prev => prev.filter(msg => msg._id !== messageId));
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback((): void => {
    setMessages([]);
    setOldestCursor(undefined);
    setNewestCursor(undefined);
    setHasMoreOlder(true);
    setHasMoreNewer(false);
    currentRoomIdRef.current = null;
    
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear timing maps for this room
    if (currentRoomIdRef.current) {
      lastFetchTimeRef.current.delete(currentRoomIdRef.current);
      pendingFetchRef.current.delete(currentRoomIdRef.current);
    }
    
    // Clear in-flight requests
    inFlightRequestsRef.current.clear();
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback((): void => {
    setMessages([]);
    setIsLoading(false);
    setIsLoadingMore(false);
    setIsLoadingNewer(false);
    setHasMoreOlder(true);
    setHasMoreNewer(false);
    setError(null);
    setTotalCount(0);
    setOldestCursor(undefined);
    setNewestCursor(undefined);
    currentRoomIdRef.current = null;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clear all maps
    lastFetchTimeRef.current.clear();
    pendingFetchRef.current.clear();
    inFlightRequestsRef.current.clear();
    lastPaginationTimeRef.current = 0;
  }, []);

  return {
    // State
    messages,
    isLoading,
    isLoadingMore,
    isLoadingNewer,
    hasMoreOlder,
    hasMoreNewer,
    error,
    totalCount,
    
    // Pagination cursors
    oldestCursor,
    newestCursor,
    
    // Actions
    fetchMessages,
    loadOlderMessages,
    loadNewerMessages,
    refreshMessages,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    reset
  };
};
