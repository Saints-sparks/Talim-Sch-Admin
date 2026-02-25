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
  ONE_TO_ONE = 'one_to_one'
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

export interface ChatMessage {
  _id: string;
  chatRoomId: string;
  senderId: string | Participant;
  text?: string;
  attachments?: Array<{
    url: string;
    type: string;
    name: string;
    size?: number;
  }>;
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  isEdited?: boolean;
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
  type: ChatRoomType.CLASS_GROUP | ChatRoomType.COURSE_GROUP;
  classId?: string;
  courseId?: string;
  termId?: string;
  name?: string;
  participants?: string[];
}

export interface SendMessageDto {
  chatRoomId: string;
  text?: string;
  attachments?: Array<{
    url: string;
    type: string;
    name: string;
    size?: number;
  }>;
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