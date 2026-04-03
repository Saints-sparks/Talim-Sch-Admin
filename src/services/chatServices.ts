// services/chatServices.ts
import { apiClient } from '@/lib/apiClient';
import { 
  ChatRoom, 
  ChatMessage, 
  CreateChatRoomDto,
  CreateGroupChatDto,
  SendMessageDto,
  MessagesResponse,
  CursorMessagesResponse,
  SearchChatRoomsParams
} from '@/types/chat.types';

// Helper function to get current user from localStorage
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
  }
  return null;
};

// Helper function to get user display name
const getUserDisplayName = (user: any): string => {
  if (!user) return 'You';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`.trim();
  } else if (user.firstName) {
    return user.firstName;
  } else if (user.email) {
    return user.email;
  }
  return 'You';
};

class ChatService {
  private readonly baseUrl = '/chat';

  private normalizeRoomPayload(payload: any): ChatRoom {
    const room = payload?.data || payload?.chatRoom || payload?.room || payload?.result || payload;
    return {
      ...room,
      _id: room?._id || room?.id || room?.roomId,
      participants: room?.participants || [],
    } as ChatRoom;
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    try {
      const text = await response.text();
      if (!text) return `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(text);
        const message = parsed?.message || parsed?.error || parsed?.details;
        if (Array.isArray(message)) return message.join(', ');
        if (typeof message === 'string') return message;
      } catch {
        // response body is plain text; fall through
      }
      return text;
    } catch {
      return `HTTP ${response.status}`;
    }
  }
  
  // Debouncing mechanism
  private pendingRequests: Map<string, Promise<CursorMessagesResponse>> = new Map();
  private requestTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private cachedResponses: Map<string, { data: CursorMessagesResponse; timestamp: number }> = new Map();
  
  // Debounce delay in milliseconds (10 seconds)
  private readonly DEBOUNCE_DELAY = 10000;

  /**
   * Create a new chat room
   * POST /chat/rooms
   */
  async createChatRoom(data: CreateChatRoomDto): Promise<ChatRoom> {
    try {
      console.log('📤 Creating chat room with data:', JSON.stringify(data, null, 2));
      
      const response = await apiClient.post(`${this.baseUrl}/rooms`, data);
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await this.extractErrorMessage(response);
        console.error('❌ Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const raw = await response.json();
      const result = this.normalizeRoomPayload(raw);
      if (!result?._id) {
        throw new Error('Invalid chat room response: missing room id');
      }
      console.log('✅ Chat room created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating chat room:', error);
      throw error;
    }
  }

  /**
   * Create a group chat room
   * POST /chat/groups
   */
  async createGroupChat(data: CreateGroupChatDto): Promise<ChatRoom> {
    try {
      console.log('📤 Creating group chat with data:', JSON.stringify(data, null, 2));
      
      const response = await apiClient.post(`${this.baseUrl}/groups`, data);
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await this.extractErrorMessage(response);
        console.error('❌ Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const text = await response.text();
      console.log('📥 Raw response:', text);

      if (!text) {
        throw new Error('Empty response from server');
      }

      let raw: any;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON response from server');
      }

      const result = this.normalizeRoomPayload(raw);
      if (!result?._id) {
        throw new Error('Invalid group response: missing room id');
      }

      console.log('✅ Group created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating group chat:', error);
      throw error;
    }
  }
  
  /**
   * Get all chat rooms for the authenticated user
   * GET /chat/rooms
   */
  async getUserChatRooms(): Promise<ChatRoom[]> {
    try {
      console.log('📤 Fetching user chat rooms');

      let response = await apiClient.get(`${this.baseUrl}/rooms?_ts=${Date.now()}`, {
        cache: 'no-store',
      });

      console.log('📥 Response status:', response.status);

      // Some environments still return 304; retry with cache-buster to force fresh body.
      if (response.status === 304) {
        const cacheBuster = `_ts=${Date.now()}`;
        response = await apiClient.get(`${this.baseUrl}/rooms?${cacheBuster}`, {
          cache: 'no-store',
        });
        console.log('📥 Retried rooms fetch status:', response.status);
      }

      if (response.status === 204) {
        console.log('📥 No chat rooms found');
        return [];
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch rooms'}`);
      }

      const text = await response.text();
      if (!text) {
        console.log('📥 Empty rooms response body');
        return [];
      }

      const result = JSON.parse(text);
      const rooms = Array.isArray(result) ? result : [];
      console.log(`📥 Fetched ${rooms.length} chat rooms`);
      return rooms;
    } catch (error) {
      console.error('❌ Error fetching user chat rooms:', error);
      throw error;
    }
  }

  /**
   * Search chat rooms
   * GET /chat/rooms/search
   */
  async searchChatRooms(params: SearchChatRoomsParams): Promise<ChatRoom[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
      if (params.type) queryParams.append('type', params.type);
      
      const url = `${this.baseUrl}/rooms/search?${queryParams.toString()}`;
      console.log('📤 Searching chat rooms:', url);
      
      const response = await apiClient.get(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`📥 Found ${result.length} chat rooms`);
      return result;
    } catch (error) {
      console.error('❌ Error searching chat rooms:', error);
      throw error;
    }
  }

  /**
   * Get messages from a chat room with pagination
   * GET /chat/rooms/{roomId}/messages
   */
  async getChatRoomMessages(
    roomId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagesResponse> {
    try {
      const url = `${this.baseUrl}/rooms/${roomId}/messages?page=${page}&limit=${limit}`;
      console.log('📤 Fetching messages:', url);
      
      const response = await apiClient.get(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`📥 Fetched ${result.messages?.length || 0} messages`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching chat room messages:', error);
      throw error;
    }
  }

  /**
   * Clear timeout for a specific request key
   */
  private clearRequestTimeout(key: string): void {
    const timeout = this.requestTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.requestTimeouts.delete(key);
    }
  }

  /**
   * Generate a cache key for the request
   */
  private generateCacheKey(roomId: string, limit: number, cursor?: string, direction?: string): string {
    return `${roomId}:${limit}:${cursor || 'initial'}:${direction || 'before'}`;
  }

  /**
   * Get messages from a chat room with cursor-based pagination - Debounced version
   * GET /chat/rooms/{roomId}/messages/cursor
   */
  async getChatRoomMessagesWithCursor(
    roomId: string,
    limit: number = 50,
    cursor?: string,
    direction: 'before' | 'after' = 'before'
  ): Promise<CursorMessagesResponse> {
    const cacheKey = this.generateCacheKey(roomId, limit, cursor, direction);
    const now = Date.now();
    
    console.log(`📋 Request for ${cacheKey}`);

    // Check if there's a cached response that's less than 10 seconds old
    const cached = this.cachedResponses.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.DEBOUNCE_DELAY) {
      console.log(`✅ Returning cached response for ${cacheKey} (${Math.round((now - cached.timestamp)/1000)}s old)`);
      return cached.data;
    }

    // Clear any existing timeout for this key
    this.clearRequestTimeout(cacheKey);

    // If there's already a pending request for this key, return that promise
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`⏳ Request already in progress for ${cacheKey}, returning existing promise`);
      return this.pendingRequests.get(cacheKey)!;
    }

    // Check when the last request was made
    const lastRequest = this.lastRequestTime.get(cacheKey) || 0;
    const timeSinceLastRequest = now - lastRequest;

    // If we've made a request within the last 10 seconds, wait until 10 seconds have passed
    if (timeSinceLastRequest < this.DEBOUNCE_DELAY && lastRequest > 0) {
      const waitTime = this.DEBOUNCE_DELAY - timeSinceLastRequest;
      console.log(`⏱️ Debouncing: Last request was ${Math.round(timeSinceLastRequest/1000)}s ago, waiting ${Math.round(waitTime/1000)}s`);

      // Create a delayed promise
      const delayedPromise = new Promise<CursorMessagesResponse>((resolve, reject) => {
        const timeout = setTimeout(async () => {
          try {
            console.log(`🔄 Executing debounced request for ${cacheKey}`);
            const result = await this.executeMessagesRequest(roomId, limit, cursor, direction, cacheKey);
            this.pendingRequests.delete(cacheKey);
            this.lastRequestTime.set(cacheKey, Date.now());
            
            // Cache the result
            this.cachedResponses.set(cacheKey, {
              data: result,
              timestamp: Date.now()
            });
            
            resolve(result);
          } catch (error) {
            this.pendingRequests.delete(cacheKey);
            reject(error);
          } finally {
            this.requestTimeouts.delete(cacheKey);
          }
        }, waitTime);

        this.requestTimeouts.set(cacheKey, timeout);
      });

      this.pendingRequests.set(cacheKey, delayedPromise);
      return delayedPromise;
    }

    // No recent request, execute immediately
    console.log(`🚀 Executing immediate request for ${cacheKey}`);
    const requestPromise = this.executeMessagesRequest(roomId, limit, cursor, direction, cacheKey);
    this.pendingRequests.set(cacheKey, requestPromise);
    
    try {
      const result = await requestPromise;
      this.lastRequestTime.set(cacheKey, Date.now());
      
      // Cache the result
      this.cachedResponses.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Execute the actual API request for cursor-based messages
   */
  private async executeMessagesRequest(
    roomId: string,
    limit: number,
    cursor?: string,
    direction: 'before' | 'after' = 'before',
    cacheKey: string
  ): Promise<CursorMessagesResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', String(limit));
      queryParams.append('direction', direction);
      if (cursor) queryParams.append('cursor', cursor);
      
      const url = `${this.baseUrl}/rooms/${roomId}/messages/cursor?${queryParams.toString()}`;
      console.log(`📡 Making API request to: ${url}`);
      
      const response = await apiClient.get(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Request successful for ${cacheKey}, hasMore: ${data.hasMore}`);
      return data;
    } catch (error) {
      console.error(`❌ Error in executeMessagesRequest for ${cacheKey}:`, error);
      throw error;
    }
  }

// services/chatServices.ts - Updated sendMessage transformation

async sendMessage(data: SendMessageDto): Promise<ChatMessage> {
  console.log('📤 ChatService.sendMessage - Data:', JSON.stringify(data, null, 2));
  
  try {
    const url = `${this.baseUrl}/messages`;
    console.log('📤 Sending to URL:', url);
    
    const response = await apiClient.post(url, data);
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('❌ Error response body:', errorText);
      } catch (e) {
        console.error('❌ Could not read error response body');
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
    }
    
    const responseData = await response.json();
    console.log('✅ Raw response data:', responseData);
    
    // Get current user info from localStorage (for fallback name)
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.userId || currentUser?._id || '';
    
    // Extract senderId properly - it might be an object with _id
    let senderId = responseData.senderId;
    if (typeof senderId === 'object' && senderId !== null) {
      senderId = senderId._id || senderId.toString();
    }
    
    console.log('📨 Extracted senderId:', senderId, 'Current userId:', currentUserId);
    
    // Determine sender name
    let senderName = responseData.senderName || 'Unknown';
    
    // Transform backend response
    const transformedMessage: ChatMessage = {
      _id: responseData._id || responseData.id,
      senderId: senderId,  // Use the extracted string ID
      senderName: senderName,
      content: responseData.text || responseData.content || '',
      roomId: responseData.roomId || responseData.chatRoomId || data.chatRoomId,
      isRead: responseData.isRead || false,
      readBy: responseData.readBy || [],
      type: responseData.type || 'text',
      duration: responseData.duration,
      createdAt: new Date(responseData.createdAt),
      updatedAt: new Date(responseData.updatedAt)
    };
    
    console.log('✅ Transformed message:', transformedMessage);
    
    // Clear cache for this room
    this.clearRoomCache(data.chatRoomId);
    
    return transformedMessage;
  } catch (error) {
    console.error('❌ ChatService.sendMessage - Error:', error);
    throw error;
  }
}

  /**
   * Clear cache for a specific room
   */
  private clearRoomCache(roomId: string): void {
    console.log(`🧹 Clearing cache for room ${roomId}`);
    
    // Clear all cached responses that start with this roomId
    for (const key of this.cachedResponses.keys()) {
      if (key.startsWith(roomId)) {
        this.cachedResponses.delete(key);
      }
    }
    
    // Also clear any pending timeouts for this room
    for (const key of this.requestTimeouts.keys()) {
      if (key.startsWith(roomId)) {
        this.clearRequestTimeout(key);
      }
    }
    
    // Clear pending requests for this room
    for (const key of this.pendingRequests.keys()) {
      if (key.startsWith(roomId)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Mark a message as read
   * PATCH /chat/messages/{messageId}/read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      console.log(`📤 Marking message ${messageId} as read`);
      
      const response = await apiClient.patch(`${this.baseUrl}/messages/${messageId}/read`, {});
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      console.log(`✅ Message ${messageId} marked as read`);
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Get unread message count
   * GET /chat/messages/unread/count
   */
  async getUnreadMessageCount(): Promise<number> {
    try {
      console.log('📤 Fetching unread message count');
      
      const response = await apiClient.get(`${this.baseUrl}/messages/unread/count`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const count = await response.json();
      console.log(`📥 Unread count: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ Error fetching unread message count:', error);
      throw error;
    }
  }

  /**
   * Get participants of a chat room
   * GET /chat/rooms/{roomId}/participants
   */
  async getChatRoomParticipants(roomId: string): Promise<string[]> {
    try {
      console.log(`📤 Fetching participants for room ${roomId}`);
      
      const response = await apiClient.get(`${this.baseUrl}/rooms/${roomId}/participants`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const participants = await response.json();
      console.log(`📥 Found ${participants.length} participants`);
      return participants;
    } catch (error) {
      console.error('❌ Error fetching chat room participants:', error);
      throw error;
    }
  }

  /**
   * Add participant to a chat room
   * POST /chat/rooms/{roomId}/participants/{userId}
   */
  async addParticipant(roomId: string, userId: string): Promise<ChatRoom> {
    try {
      console.log(`📤 Adding participant ${userId} to room ${roomId}`);
      
      const response = await apiClient.post(
        `${this.baseUrl}/rooms/${roomId}/participants/${userId}`,
        {}
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const updatedRoom = await response.json();
      console.log('✅ Participant added successfully:', updatedRoom);
      return updatedRoom;
    } catch (error) {
      console.error('❌ Error adding participant:', error);
      throw error;
    }
  }

  /**
   * Remove participant from a chat room
   * PATCH /chat/rooms/{roomId}/participants/{userId}/remove
   */
  async removeParticipant(roomId: string, userId: string): Promise<ChatRoom> {
    try {
      console.log(`📤 Removing participant ${userId} from room ${roomId}`);
      
      const response = await apiClient.patch(
        `${this.baseUrl}/rooms/${roomId}/participants/${userId}/remove`,
        {}
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const updatedRoom = await response.json();
      console.log('✅ Participant removed successfully:', updatedRoom);
      return updatedRoom;
    } catch (error) {
      console.error('❌ Error removing participant:', error);
      throw error;
    }
  }


  // Add this to your chatServices.ts file

// In chatServices.ts - Update the addParticipantsToRoom method

/**
 * Add multiple participants to a chat room
 */
async addParticipantsToRoom(roomId: string, userIds: string[]): Promise<ChatRoom> {
  try {
    // Fix: Use the correct endpoint path
    const response = await apiClient.post(
      `${this.baseUrl}/rooms/${roomId}/participants/batch`,  // ✅ Added /participants/batch
      { participantIds: userIds }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add participants');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in addParticipantsToRoom:', error);
    throw error;
  }
}
}

export const chatService = new ChatService();