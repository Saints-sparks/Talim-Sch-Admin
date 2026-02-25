"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChats } from "@/hooks/useChats";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageBubble from "./PrivateMessageBubble";
import ReplyPreview from "./ReplyPreview";
import { Loader2, MessageCircle } from "lucide-react";

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
}

interface PrivateChatProps {
  replyingMessage: { sender: string; text: string } | null;
  setReplyingMessage: (msg: any) => void;
  openSubMenu: { index: number; type: string } | null;
  toggleSubMenu: (index: number, type: string) => void;
  room?: any; // The selected chat room
  onBack?: () => void; // Navigation back to chat list
}

export default function PrivateChat({
  replyingMessage,
  setReplyingMessage,
  openSubMenu,
  toggleSubMenu,
  room,
  onBack,
}: PrivateChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  
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
    selectChatRoom
  } = useChats();

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
        text: msg.text || msg.content,
        content: msg.content,
        time: new Date(msg.createdAt).toLocaleTimeString([], 
          { hour: '2-digit', minute: '2-digit' }
        ),
        createdAt: msg.createdAt,
        timestamp: msg.createdAt,
        type: msg.type || 'text',
        senderType: isMyMessage ? 'me' : 'other',
        color: isMyMessage ? 'green' : 'blue',
        avatar: '',
      };
    }).sort((a, b) => 
      new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
    );

    setMessages(formattedMessages);
  }, [chatMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isLoadingMore) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isLoadingMore]);

  // Select room when room prop changes
  useEffect(() => {
    if (room?.roomId) {
      selectChatRoom(room.roomId);
    }
  }, [room?.roomId, selectChatRoom]);

  // Get current user ID
  const getCurrentUserId = (): string | undefined => {
    return user?.userId || user?._id;
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

  // Handle sending a new message
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !currentRoom || isSending) return;

    setIsSending(true);
    
    try {
      await sendMessage({
        content: messageInput.trim(),
        roomId: currentRoom._id,
        type: 'text',
      });
      
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
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

  // Get the other participant's name and avatar
  const getOtherParticipant = () => {
    // For private chat, find the other user in the participants
    if (room?.participants && Array.isArray(room.participants)) {
      const currentUserId = getCurrentUserId();
      const otherUser = room.participants.find(
        (p: any) => {
          const participantId = p.userId || p._id || p.id;
          return participantId !== currentUserId;
        }
      );
      
      if (otherUser) {
        const name = otherUser.firstName && otherUser.lastName 
          ? `${otherUser.firstName} ${otherUser.lastName}`.trim()
          : otherUser.name || otherUser.email || 'Unknown User';
          
        return {
          name,
          avatar: otherUser.userAvatar || otherUser.avatar || '/icons/direct-message.svg',
          status: otherUser.isOnline ? 'Online' : 'Offline'
        };
      }
    }
    
    return {
      name: room?.displayName || room?.name || 'Private Chat',
      avatar: '/icons/direct-message.svg',
      status: ''
    };
  };

  const otherParticipant = getOtherParticipant();

  // Format date for message grouping
  const formatMessageDate = (date: Date) => {
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
    return messageDate.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const grouped: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const messageDate = message.createdAt ? new Date(message.createdAt) : new Date();
      const dateKey = messageDate.toDateString();

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });

    return grouped;
  };

  const groupedMessages = groupMessagesByDate();
  const dateKeys = Object.keys(groupedMessages).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="w-full h-full flex flex-col relative bg-white">
      <ChatHeader
        avatar={otherParticipant.avatar}
        name={otherParticipant.name}
        subtext={otherParticipant.status}
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
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Select a chat to start messaging</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No messages yet</p>
            <p className="text-xs text-gray-400">Send a message to start the conversation</p>
          </div>
        ) : (
          dateKeys.map((dateKey) => (
            <div key={dateKey}>
              {/* Date divider */}
              <div className="flex justify-center my-4">
                <div className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                  {formatMessageDate(new Date(dateKey))}
                </div>
              </div>

              {/* Messages for this date */}
              {groupedMessages[dateKey].map((msg, index) => (
                <MessageBubble
                  key={msg._id || `${dateKey}-${index}`}
                  msg={{
                    sender: msg.sender,
                    text: msg.text || msg.content || '',
                    time: msg.time || new Date(msg.createdAt || '').toLocaleTimeString([], 
                      { hour: '2-digit', minute: '2-digit' }
                    ),
                    type: msg.type,
                    senderType: msg.senderType,
                    avatar: msg.avatar || '/icons/user-placeholder.svg',
                    color: msg.color || 'blue',
                  }}
                  index={index}
                  openSubMenu={openSubMenu}
                  toggleSubMenu={toggleSubMenu}
                  setReplyingMessage={setReplyingMessage}
                />
              ))}
            </div>
          ))
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
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageInput(e.target.value)}
        onSend={handleSendMessage}
        disabled={!room || isSending || isLoading}
        placeholder={
          !room 
            ? "Select a chat to start messaging" 
            : isLoading
            ? "Loading messages..."
            : "Type a message..."
        }
      />
    </div>
  );
}