// types/chat.types.ts

export interface User {
  _id: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  schoolId?: string;
  schoolName?: string;
  schoolLogo?: string;
  userAvatar?: string;
  phoneNumber?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  studentId?: string | null;
  classId?: string | null;
  className?: string | null;
  termId?: string;
  devices?: Array<{ deviceToken: string; platform: string }>;
}

export enum ChatRoomType {
  CLASS_GROUP = 'class_group',
  COURSE_GROUP = 'course_group',
  ONE_TO_ONE = 'one_to_one',
  ADMIN_PARENT_GROUP = 'admin_parent_group',
  CUSTOM_GROUP = 'custom_group',
}

export interface Participant {
  _id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userAvatar?: string;
  role?: string;
}

export interface ChatRoom {
  _id: string;
  type: ChatRoomType;
  name?: string;
  participants: string[] | Participant[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: ChatMessage;
  lastMessageAt?: Date;
  isActive: boolean;
  classId?: string;
  courseId?: string;
  termId?: string;
  unreadCount?: number;
}


// types/chat.types.ts

export interface ChatMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  roomId: string;
  isRead: boolean;
  readBy: string[];  // If backend returns array of user IDs (strings)
  type: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

// DTO for sending messages - MUST match backend's CreateMessageDto
export interface SendMessageDto {
  chatRoomId: string;  // Must match backend expectation
  text: string;        // Must match backend expectation
  attachments?: Array<{
    url: string;
    type: string;
    name: string;
    size?: number;
  }>;
}

export interface CreateChatRoomDto {
  type: ChatRoomType;
  participants: string[];
  classId?: string;
  courseId?: string;
  termId?: string;
  name?: string;
}

export interface CreateGroupChatDto {
  type: ChatRoomType.CLASS_GROUP | ChatRoomType.COURSE_GROUP | ChatRoomType.ADMIN_PARENT_GROUP | string;
  classId?: string;
  courseId?: string;
  termId?: string;
  name?: string;
  participants?: string[];
}

export interface MessagesResponse {
  messages: ChatMessage[];
  total: number;
}

export interface CursorMessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface SearchChatRoomsParams {
  searchTerm?: string;
  type?: ChatRoomType;
}
