"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChats } from "@/hooks/useChats";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import GroupMessageBubble from "./GroupMessageBubble";
import ReplyPreview from "./ReplyPreview";
import { Loader2, MessageCircle } from "lucide-react";
import { generateColorFromString } from "@/lib/colorUtils";

// Define the message structure for our UI
interface Message {
  _id?: string;
  id?: string;
  sender: string;
  senderId?: string;
  senderName?: string;
  text?: string;
  content?: string;
  time?: string;
  createdAt?: string;
  timestamp?: string;
  type: string;
  senderType: string;
  avatar?: string;
  color?: string;
  roomId?: string;
  replyTo?: string;
  videoThumbnail?: string;
  duration?: string;
  _updated?: number;
}

interface GroupChatProps {
  replyingMessage: { sender: string; text: string } | null;
  setReplyingMessage: (msg: any) => void;
  openSubMenu: { index: number; type: string } | null;
  toggleSubMenu: (index: number, type: string) => void;
  room?: any; // The selected chat room
  onBack?: () => void;
}

export default function GroupChat({
  replyingMessage,
  setReplyingMessage,
  openSubMenu,
  toggleSubMenu,
  room,
  onBack,
}: GroupChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [messagesNeedRevaluation, setMessagesNeedRevaluation] = useState<boolean>(false);

  // Refs for scroll management
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const {
    currentRoom,
    messages: chatMessages,
    sendMessage,
    loadMoreMessages,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    error,
    refreshMessages,
    markMessageAsRead
  } = useChats();

  // Debug user object
  useEffect(() => {
    if (user) {
      console.log("✅ User authenticated:", {
        userId: user.userId || user._id,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });

      if (messages.length > 0) {
        const needsCorrection = messages.some((msg) => {
          const isMyMessage = isCurrentUser(msg.senderId || "", msg.sender);
          return isMyMessage && msg.senderType !== "self";
        });

        if (needsCorrection) {
          console.log("🔄 Triggering message re-evaluation");
          setMessagesNeedRevaluation(true);
        }
      }
    }
  }, [user, messages]);

  // Transform chat messages from useChats hook to UI format
  useEffect(() => {
    if (!chatMessages || chatMessages.length === 0) {
      setMessages([]);
      return;
    }

    const formattedMessages = chatMessages.map((msg: any) => {
      const senderName = msg.senderName || msg.sender?.name || 'Unknown';
      const senderId = msg.senderId || msg.sender?._id || '';
      
      const isMyMessage = isCurrentUser(senderId, senderName);
      
      return {
        _id: msg._id,
        sender: senderName,
        senderId: senderId,
        text: msg.content,
        content: msg.content,
        time: new Date(msg.createdAt).toLocaleTimeString([], 
          { hour: '2-digit', minute: '2-digit' }
        ),
        createdAt: msg.createdAt,
        timestamp: msg.createdAt,
        type: msg.type || 'text',
        senderType: isMyMessage ? 'self' : getUserRole(senderId),
        color: getColorForUser(senderId, senderName),
        avatar: '',
      };
    });

    setMessages(formattedMessages);
  }, [chatMessages]);

  // Re-evaluate message senderType when user loads
  useEffect(() => {
    if (!user || messages.length === 0 || !messagesNeedRevaluation) return;

    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((msg) => {
        const isMyMessage = isCurrentUser(msg.senderId || "", msg.sender);
        if (isMyMessage && msg.senderType !== "self") {
          return {
            ...msg,
            senderType: "self",
            _updated: Date.now(),
          };
        }
        return msg;
      });

      setMessagesNeedRevaluation(false);
      return updatedMessages;
    });
  }, [user, messagesNeedRevaluation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current && !isLoadingMore) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isLoadingMore]);

  // Get current user ID
  const getCurrentUserId = (): string | undefined => {
    return user?.userId || user?._id;
  };

  // Get color for user avatar
  const getColorForUser = (senderId: string, senderName: string = ""): string => {
    const nameForColor = senderName || senderId || "unknown";
    return generateColorFromString(nameForColor);
  };

  // Check if message is from current user
  const isCurrentUser = (senderId: string, senderName: string): boolean => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId) return false;

    // Direct ID match
    if (senderId && senderId === currentUserId) {
      return true;
    }

    // Name match
    if (user && user.firstName && user.lastName && senderName) {
      const currentUserName = `${user.firstName} ${user.lastName}`.trim();
      if (currentUserName === senderName) return true;
    }

    // Email match
    if (user && user.email && senderName === user.email) {
      return true;
    }

    return false;
  };

  // Get user role
  const getUserRole = (senderId: string): "teacher" | "student" | "other" => {
    const currentUserId = getCurrentUserId();
    if (senderId === currentUserId) return "teacher";
    
    // Check if sender is a teacher based on your data structure
    const participant = room?.participants?.find((p: any) => 
      p.userId === senderId || p._id === senderId
    );
    
    return participant?.role === 'teacher' ? 'teacher' : 'student';
  };

  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !currentRoom || isSending) return;

    setIsSending(true);
    
    try {
      await sendMessage({
        content: messageInput.trim(),
        roomId: currentRoom._id,
        type: 'text',
      });
      
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  }, [messageInput, currentRoom, isSending, sendMessage]);

  // Handle load more messages (scroll to top)
  const handleLoadMore = async () => {
    if (hasMoreMessages && !isLoadingMore) {
      const scrollContainer = messagesContainerRef.current;
      const scrollHeight = scrollContainer?.scrollHeight;

      await loadMoreMessages();

      // Restore scroll position after loading
      if (scrollContainer && scrollHeight) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight - scrollHeight;
        }, 0);
      }
    }
  };

  // Handle scroll to trigger pagination
  const handleScroll = () => {
    const scrollContainer = messagesContainerRef.current;
    if (
      scrollContainer &&
      scrollContainer.scrollTop < 50 &&
      hasMoreMessages &&
      !isLoadingMore
    ) {
      handleLoadMore();
    }
  };

  // Get room display info
  const getRoomInfo = () => {
    if (!room) return { name: "Select a chat", subtext: "", status: "" };

    const isGroup = room.type === 'group';
    const roomName = room.name || room.displayName || 'Chat';
    
    let participants: any[] = [];
    let onlineCount = 0;

    if (room.participants && Array.isArray(room.participants)) {
      participants = room.participants.filter((p: any) => 
        p.userId !== getCurrentUserId() && p._id !== getCurrentUserId()
      );
      
      onlineCount = room.participants.filter((p: any) => p.isOnline).length;
    }

    const totalCount = room.participants?.length || 0;
    
    let status = isGroup ? 'Group chat' : 'Offline';
    if (isGroup) {
      if (onlineCount === 0) status = 'Group chat';
      else if (onlineCount === totalCount) status = 'All members online';
      else status = `${onlineCount} members online`;
    } else {
      status = participants[0]?.isOnline ? 'Online' : 'Offline';
    }

    let subtext = '';
    if (isGroup && participants.length > 0) {
      if (participants.length <= 3) {
        subtext = participants.map((p: any) => p.name || 'User').join(', ');
      } else {
        subtext = `${participants.slice(0, 2).map((p: any) => p.name || 'User').join(', ')} and ${participants.length - 2} others`;
      }
    }

    return {
      name: roomName,
      subtext,
      status,
      participants: room.participants || [],
    };
  };

  const { name: roomName, subtext: participantsText, status: onlineStatus, participants } = getRoomInfo();

  // Group messages by date
  const groupMessagesByDate = () => {
    const grouped: { [key: string]: any[] } = {};

    messages.forEach((message) => {
      const messageDate = message.createdAt ? new Date(message.createdAt) : new Date();
      const dateKey = messageDate.toDateString();

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });

    // Sort dates chronologically
    const sortedDates = Object.keys(grouped).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const sortedGrouped: { [key: string]: any[] } = {};
    sortedDates.forEach((date) => {
      sortedGrouped[date] = grouped[date];
    });

    return sortedGrouped;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);

    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const messageMidnight = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate()
    );
    const yesterday = new Date(todayMidnight);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageMidnight.getTime() === todayMidnight.getTime()) {
      return "Today";
    }
    if (messageMidnight.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    return messageDate.toLocaleDateString();
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-white">
      <ChatHeader
        avatar={room?.avatarInfo?.type === 'image' ? room.avatarInfo.value : "/icons/chat.svg"}
        name={roomName}
        status={onlineStatus}
        subtext={participantsText}
        participants={participants}
        currentUserId={getCurrentUserId()}
        onBack={onBack}
        showBackButton={true}
      />

      <div
        className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gray-50"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {/* Loading indicator for more messages */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        )}

        {/* Main loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-500">Loading messages...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
              onClick={() => refreshMessages()}
            >
              Retry
            </button>
          </div>
        ) : !room ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center p-8">
              <p className="text-sm text-gray-500 mb-2">
                Select a chat to start messaging
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center p-8">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500 mb-4">
                This is the beginning of your conversation in this chat room.
              </p>
              <p className="text-sm text-gray-400">
                Send a message below to get started.
              </p>
            </div>
          </div>
        ) : (
          (() => {
            const groupedMessages = groupMessagesByDate();
            return Object.entries(groupedMessages).map(
              ([dateKey, dayMessages]) => (
                <div key={dateKey}>
                  {/* Date divider */}
                  <div className="flex justify-center my-4">
                    <div className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                      {formatDate(new Date(dateKey))}
                    </div>
                  </div>

                  {/* Messages for this date */}
                  {dayMessages.map((msg, index) => (
                    <GroupMessageBubble
                      key={`${msg._id || `${dateKey}-${index}`}-${msg._updated || ''}`}
                      msg={{
                        sender: msg.sender,
                        text: msg.text || msg.content || "",
                        time: msg.time || "",
                        type: msg.type,
                        senderType: msg.senderType,
                        avatar: msg.avatar || "/icons/user-placeholder.svg",
                        color: msg.color || "text-[#F39C12]",
                        videoThumbnail: msg.videoThumbnail,
                        duration: msg.duration,
                      }}
                      index={index}
                      openSubMenu={openSubMenu}
                      toggleSubMenu={toggleSubMenu}
                      setReplyingMessage={setReplyingMessage}
                    />
                  ))}
                </div>
              )
            );
          })()
        )}

        {/* Sending indicator */}
        {isSending && (
          <div className="flex justify-end">
            <div className="bg-blue-100 text-blue-600 px-3 py-2 rounded-lg max-w-xs flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Sending...</span>
            </div>
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {replyingMessage && (
        <ReplyPreview
          replyingMessage={replyingMessage}
          onCancel={() => setReplyingMessage(null)}
        />
      )}

      <MessageInput
        value={messageInput}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setMessageInput(e.target.value)
        }
        onSend={handleSendMessage}
        disabled={!room || isSending}
        placeholder={
          !room
            ? "Select a chat to start messaging"
            : isSending
            ? "Sending message..."
            : "Type a message..."
        }
      />
    </div>
  );
}