import type { ChatReplyTo } from "@/components/chat-kit";
import type { CreateChatRoomPayload, CreateGroupChatPayload } from "@/types/apiPayloads";
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
  /** The message this one replies to (a server-side snapshot). */
  replyTo?: ChatReplyTo;
  /** Deleted: `content` and `attachments` are blank; shown as a placeholder. */
  isDeleted?: boolean;
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
  replyToId?: string;
  type?: string;
  duration?: number;
  clientMessageId?: string;
  attachments?: ChatAttachment[];
}

/**
 * Body of `POST /chat/rooms` (the backend DTO); `type` is the app's enum, whose
 * values are the DTO's literals. The DTO has no `name`: a group's name is set
 * through `POST /chat/groups` or `PATCH /chat/rooms/:id`.
 */
export type CreateChatRoomDto = Omit<CreateChatRoomPayload, "type"> & { type: ChatRoomType };

/**
 * Body of `POST /chat/groups` (the backend DTO). The generated `type` omits
 * `custom_group` because the DTO's `@ApiProperty` enum does, but its
 * `@IsEnum` accepts it and the "custom group" form sends it.
 */
export type CreateGroupChatDto = Omit<CreateGroupChatPayload, "type"> & {
  type: CreateGroupChatPayload["type"] | ChatRoomType.CUSTOM_GROUP;
};

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
