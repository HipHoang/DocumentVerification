import React, { useLayoutEffect, useRef, useCallback } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

const ChatPanel = ({
  messages,
  activeConversation,
  otherParticipant,
  currentWallet,
  loading,
  onSendMessage,
  onBack,
  sending,
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll to latest message using container scrollTo (not scrollIntoView)
  const scrollToBottom = useCallback((smooth = false) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useLayoutEffect(() => {
    if (loading) return;

    // Only scroll once messages have loaded
    if (messages.length > 0) {
      // Determine if this is a new message arriving (not initial load)
      const isNewMessage = messages.length > prevMessageCountRef.current;
      const isInitialLoad = prevMessageCountRef.current === 0;

      // Smooth scroll only for new message arrivals, not initial load
      const shouldAnimate = isNewMessage && !isInitialLoad;
      scrollToBottom(shouldAnimate);
    }

    prevMessageCountRef.current = messages.length;
  }, [messages, loading, scrollToBottom]);

  // Format date for separator
  const formatDateSeparator = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">
      {/* Chat Header */}
      {otherParticipant && (
        <ChatHeader otherParticipant={otherParticipant} onBack={onBack} />
      )}

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-1"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.03) 0%, transparent 50%)",
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 w-full ${
                  i % 2 === 0 ? "justify-start pl-2" : "justify-end pr-2"
                }`}
              >
                <div
                  className={`rounded-2xl animate-pulse ${
                    i % 2 === 0
                      ? "bg-gray-200 w-48 h-10"
                      : "bg-indigo-100 w-36 h-10"
                  }`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-300"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h.01" />
                <path d="M12 10h.01" />
                <path d="M16 10h.01" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-gray-500 mb-1">
              Chưa có tin nhắn
            </h4>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện với{" "}
              <span className="font-medium text-gray-500">
                {otherParticipant?.displayName || "người dùng"}
              </span>
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isOwn =
                msg.sender?.toLowerCase() === currentWallet?.toLowerCase();
              const prevMsg = index > 0 ? messages[index - 1] : null;

              // Show date separator if different day
              const showDateSeparator =
                prevMsg &&
                msg.createdAt &&
                prevMsg.createdAt &&
                new Date(msg.createdAt).toDateString() !==
                  new Date(prevMsg.createdAt).toDateString();

              return (
                <React.Fragment key={msg.id || index}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px bg-gray-200 w-8" />
                        <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                          <span className="text-[11px] text-gray-500 font-medium">
                            {formatDateSeparator(msg.createdAt)}
                          </span>
                        </div>
                        <div className="h-px bg-gray-200 w-8" />
                      </div>
                    </div>
                  )}

                  {/* First message date */}
                  {index === 0 && msg.createdAt && (
                    <div className="flex items-center justify-center my-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px bg-gray-200 w-8" />
                        <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                          <span className="text-[11px] text-gray-500 font-medium">
                            {formatDateSeparator(msg.createdAt)}
                          </span>
                        </div>
                        <div className="h-px bg-gray-200 w-8" />
                      </div>
                    </div>
                  )}

                  <MessageBubble message={msg} isOwn={isOwn} />
                </React.Fragment>
              );
            })}

            {/* Sending indicator */}
            {sending && (
              <div className="flex items-end justify-end mb-2 pr-2">
                <div className="bg-indigo-400 text-white px-4 py-3 rounded-[18px] rounded-br-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white/70 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <div className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      {otherParticipant && (
        <MessageInput onSend={onSendMessage} disabled={sending} />
      )}
    </div>
  );
};

export default ChatPanel;