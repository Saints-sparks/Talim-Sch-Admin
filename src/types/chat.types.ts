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
  PARENT_GROUP = 'parent_group',
  CUSTOM_GROUP = 'custom_group',
}

export interface Participant {
  _id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userAvatar?: string | null;
  role?: string;
  isOnline?: boolean;
  isActive?: boolean;
}

/** A room's latest message as the room list carries it (`RoomView.lastMessage`). */
export interface ChatRoomLastMessage {
  _id?: string;
  senderId: string;
  senderName: string;
  type: string;
  /** "See you tomorrow", "Voice note · 0:12", "Photo", "fees.pdf" */
  preview: string;
  /** Deprecated alias of `preview`. */
  content: string;
  createdAt: string | Date;
}

export interface ChatRoom {
  _id: string;
  /** Deprecated alias of `_id`. */
  roomId?: string;
  type: ChatRoomType;
  name?: string;
  /** Groups only. */
  description?: string;
  /** Groups only: picture uploaded with POST /upload/chat-attachment. */
  avatarUrl?: string;
  /** When the current user last read this room. */
  lastReadAt?: string;
  /** `POST /chat/groups` only: an existing class / course group was opened instead. */
  reused?: boolean;
  participants: Participant[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: ChatRoomLastMessage;
  lastMessageAt?: Date;
  isActive: boolean;
  classId?: string;
  courseId?: string;
  termId?: string;
  unreadCount?: number;
}


// types/chat.types.ts

/** Local delivery state of a message this browser sent. Absent on stored messages. */
export type ChatMessageStatus = 'pending' | 'failed';

export interface ChatMessage {
  _id: string;
  /** Set by the sender; matches a pending bubble to the stored message. */
  clientMessageId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  /** The message text (canonical `text`, kept under the name the UI reads). */
  content: string;
  roomId: string;
  isRead: boolean;
  readBy: string[];
  type: string;
  duration?: number;
  attachments?: ChatAttachment[];
  createdAt: Date;
  updatedAt: Date;
  status?: ChatMessageStatus;
  /** Why a failed send failed, safe to show. */
  error?: string;
  /** Local only: upload progress (0–1) per attachment while sending. */
  uploadProgress?: number[];
}

export interface ChatAttachment {
  url: string;
  type: string; // 'image' | 'audio' | 'video' | 'document' | 'file'
  name: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  width?: number;
  height?: number;
  /** Audio only: MP3 rendition to play when present. */
  playbackUrl?: string;
}

// DTO for sending messages - MUST match backend's CreateMessageDto
export interface SendMessageDto {
  chatRoomId: string;
  text: string;
  type?: string;
  duration?: number;
  clientMessageId?: string;
  attachments?: ChatAttachment[];
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

/** The parts of a message the reply preview shows — what "Reply" hands upward. */
export interface ReplyTarget {
  sender: string;
  text?: string;
}

/** A chat room member, normalised from whichever shape the API or socket sent. */
export interface ChatParticipant {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  avatar?: string | null;
  role?: string;
  isOnline?: boolean;
}
