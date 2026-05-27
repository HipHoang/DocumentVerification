import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  markConversationAsRead,
  getConversation,
  findOrCreateConversation,
  sortConversationsWithPinnedAdmin,
  isAdminConversation,
  getOtherParticipant,
} from "../../services/messaging.service";
import { canAccessMessaging } from "../../utils/messagingPermissions";
import { getAllowedContacts, filterNewContacts } from "../../services/contacts.service";
import ConversationList from "./ConversationList";
import ChatPanel from "./ChatPanel";
import EmptyState from "./EmptyState";

const MessagingPage = () => {
  const {
    walletAddress,
    role,
    studentUniversityId,
    userName,
    userConnected,
  } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const [suggestedContacts, setSuggestedContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  // Refs for unsubscriptions
  const unsubConversationsRef = useRef(null);
  const unsubMessagesRef = useRef(null);

  // Permission check
  if (!userConnected || !canAccessMessaging(role)) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-300"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Truy cập bị hạn chế
          </h3>
          <p className="text-sm text-gray-400 max-w-sm">
            Bạn không có quyền truy cập vào hệ thống tin nhắn. Tính năng này
            dành cho sinh viên, trường đại học và quản trị viên.
          </p>
        </div>
      </div>
    );
  }

  // Subscribe to conversations
  useEffect(() => {
    setLoadingConversations(true);
    setActiveConversation(null);
    setMessages([]);

    if (unsubConversationsRef.current) {
      unsubConversationsRef.current();
    }

    unsubConversationsRef.current = subscribeToConversations(
      walletAddress,
      (conversationsData) => {
        // Apply admin pinning sort
        const sorted = sortConversationsWithPinnedAdmin(
          conversationsData,
          walletAddress
        );
        setConversations(sorted);
        setLoadingConversations(false);
      },
      role
    );

    return () => {
      if (unsubConversationsRef.current) {
        unsubConversationsRef.current();
      }
    };
  }, [walletAddress]);

  // Subscribe to messages when active conversation changes
  useEffect(() => {
    if (unsubMessagesRef.current) {
      unsubMessagesRef.current();
      unsubMessagesRef.current = null;
    }

    if (!activeConversation) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    // Mark as read
    markConversationAsRead(activeConversation.id, walletAddress);

    unsubMessagesRef.current = subscribeToMessages(
      activeConversation.id,
      100,
      (messagesData) => {
        setMessages(messagesData);
        setLoadingMessages(false);
      }
    );

    return () => {
      if (unsubMessagesRef.current) {
        unsubMessagesRef.current();
      }
    };
  }, [activeConversation?.id, walletAddress]);

  // Load suggested contacts based on business relationships
  useEffect(() => {
    if (!walletAddress || !role) return;

    setContactsLoading(true);
    getAllowedContacts({ walletAddress, role, studentUniversityId })
      .then((allContacts) => {
        // Filter out contacts that already have conversations
        const newContacts = filterNewContacts(allContacts, conversations);
        setSuggestedContacts(newContacts);
      })
      .catch((err) => {
        console.error("[MessagingPage] Error loading contacts:", err);
      })
      .finally(() => {
        setContactsLoading(false);
      });
  }, [walletAddress, role, studentUniversityId, conversations]);

  // Handle starting a new conversation from suggested contacts
  const handleStartConversation = useCallback(
    async (contact) => {
      try {
        const conversationId = await findOrCreateConversation(
          {
            walletAddress,
            role,
            displayName: userName || walletAddress.slice(0, 6),
          },
          {
            walletAddress: contact.walletAddress,
            role: contact.role,
            displayName: contact.displayName,
          }
        );

        // Fetch the newly created/retrieved conversation and select it
        const conv = await getConversation(conversationId);
        if (conv) {
          setActiveConversation(conv);
          setShowMobileList(false);
        }
      } catch (err) {
        console.error("[MessagingPage] Error starting conversation:", err);
      }
    },
    [walletAddress, role, userName]
  );

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
    setShowMobileList(false);
  }, []);

  // Handle back to conversation list (mobile)
  const handleBack = useCallback(() => {
    setShowMobileList(true);
  }, []);

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (text) => {
      if (!activeConversation || !text.trim()) return;

      setSending(true);
      try {
        await sendMessage(activeConversation.id, { walletAddress, role }, text);
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setSending(false);
      }
    },
    [activeConversation, walletAddress, role]
  );

  // Get other participant for active conversation
  const otherParticipant = activeConversation
    ? getOtherParticipant(activeConversation, walletAddress)
    : null;

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Main messaging layout */}
      <div className="flex-1 flex overflow-hidden w-full bg-white shadow-sm border-t border-gray-200">
        {/* Conversation List Sidebar */}
        <div
          className={`${
            showMobileList ? "flex" : "hidden"
          } lg:flex w-full lg:w-95 xl:w-110 2xl:w-120 shrink-0 h-full border-r border-gray-200`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={handleSelectConversation}
            currentWallet={walletAddress}
            loading={loadingConversations}
            suggestedContacts={suggestedContacts}
            contactsLoading={contactsLoading}
            onStartConversation={handleStartConversation}
          />
        </div>

        {/* Chat Panel */}
        <div className={`${!showMobileList ? "flex" : "hidden"} lg:flex flex-1 flex-col min-h-0 overflow-hidden`}>
          {activeConversation ? (
            <ChatPanel
              messages={messages}
              activeConversation={activeConversation}
              otherParticipant={otherParticipant}
              currentWallet={walletAddress}
              loading={loadingMessages}
              onSendMessage={handleSendMessage}
              onBack={handleBack}
              sending={sending}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Unread badge indicator */}
      {conversations.some(
        (c) => (c.unreadCountBy?.[walletAddress?.toLowerCase()] || 0) > 0
      ) && !activeConversation && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Tin nhắn chưa đọc
          </span>
        </div>
      )}
    </div>
  );
};

export default MessagingPage;