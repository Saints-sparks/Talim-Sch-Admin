// services/chat.service.ts
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
// services/chat.service.ts - Complete fixed version
class ChatService {
  private readonly baseUrl = '/chat';

  /**
   * Create a new chat room
   */
  async createChatRoom(data: CreateChatRoomDto): Promise<ChatRoom> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/rooms`, data);
      return await response.json();
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  /**
   * Create a group chat room
   */
  async createGroupChat(data: CreateGroupChatDto): Promise<ChatRoom> {
    try {
      console.log('📤 Creating group chat with data:', JSON.stringify(data, null, 2));
      
      const response = await apiClient.post(`${this.baseUrl}/groups`, data);
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const text = await response.text();
      console.log('📥 Raw response:', text);
      
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const result = JSON.parse(text);
      console.log('✅ Group created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating group chat:', error);
      throw error;
    }
  }
  /**
   * Get all chat rooms for the authenticated user
   */
  async getUserChatRooms(): Promise<ChatRoom[]> {
    try {
      // ✅ FIXED: Just /rooms, not /chat/rooms
      const response = await apiClient.get(`${this.baseUrl}/rooms`);
      
      if (response.status === 204) {
        return [];
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user chat rooms:', error);
      throw error;
    }
  }

  /**
   * Search chat rooms
   */
  async searchChatRooms(params: SearchChatRoomsParams): Promise<ChatRoom[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
      if (params.type) queryParams.append('type', params.type);
      
      // ✅ FIXED: Use /rooms/search (not /chat/rooms/search)
      const response = await apiClient.get(
        `${this.baseUrl}/rooms/search?${queryParams.toString()}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error searching chat rooms:', error);
      throw error;
    }
  }

  /**
   * Get messages from a chat room with pagination
   */
  async getChatRoomMessages(
    roomId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagesResponse> {
    try {
      // ✅ This one is correct: /rooms/{roomId}/messages
      const url = `${this.baseUrl}/rooms/${roomId}/messages?page=${page}&limit=${limit}`;
      const response = await apiClient.get(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching chat room messages:', error);
      throw error;
    }
  }

  /**
   * Get messages from a chat room with cursor-based pagination
   */
  async getChatRoomMessagesWithCursor(
    roomId: string,
    limit: number = 50,
    cursor?: string,
    direction: 'before' | 'after' = 'before'
  ): Promise<CursorMessagesResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', String(limit));
      queryParams.append('direction', direction);
      if (cursor) queryParams.append('cursor', cursor);
      
      // ✅ Correct: /rooms/{roomId}/messages/cursor
      const url = `${this.baseUrl}/rooms/${roomId}/messages/cursor?${queryParams.toString()}`;
      const response = await apiClient.get(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching chat room messages with cursor:', error);
      throw error;
    }
  }

  /**
   * Send a message to a chat room
   */
  async sendMessage(data: SendMessageDto): Promise<ChatMessage> {
    try {
      // ✅ Correct: /messages
      const response = await apiClient.post(`${this.baseUrl}/messages`, data);
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      // ✅ Correct: /messages/{messageId}/read
      await apiClient.patch(`${this.baseUrl}/messages/${messageId}/read`, {});
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadMessageCount(): Promise<number> {
    try {
      // ✅ Correct: /messages/unread/count
      const response = await apiClient.get(`${this.baseUrl}/messages/unread/count`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      throw error;
    }
  }

  /**
   * Get participants of a chat room
   */
  async getChatRoomParticipants(roomId: string): Promise<string[]> {
    try {
      // ✅ Correct: /rooms/{roomId}/participants
      const response = await apiClient.get(`${this.baseUrl}/rooms/${roomId}/participants`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching chat room participants:', error);
      throw error;
    }
  }

  /**
   * Add participant to a chat room
   */
  async addParticipant(roomId: string, userId: string): Promise<ChatRoom> {
    try {
      // ✅ Correct: /rooms/{roomId}/participants/{userId}
      const response = await apiClient.post(
        `${this.baseUrl}/rooms/${roomId}/participants/${userId}`,
        {}
      );
      return await response.json();
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }

  /**
   * Remove participant from a chat room
   */
  async removeParticipant(roomId: string, userId: string): Promise<ChatRoom> {
    try {
      // ✅ Correct: /rooms/{roomId}/participants/{userId}/remove
      const response = await apiClient.patch(
        `${this.baseUrl}/rooms/${roomId}/participants/${userId}/remove`,
        {}
      );
      return await response.json();
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();