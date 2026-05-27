import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  formatMessageTime,
  getOtherParticipant,
  resolveUserDisplayName,
  formatWalletAddress,
} from "../../services/messaging.service";
import { getRoleBadge, getRoleBadgeColor } from "../../utils/messagingPermissions";
import SuggestedContacts from "./SuggestedContacts";

/**
 * Check if a display name looks like a raw wallet address.
 */
function looksLikeWalletAddress(name) {
  if (!name) return true;
  return /^0x[a-fA-F0-9]+(\.\.\.[a-fA-F0-9]+)?$/.test(name);
}

/**
 * Hook to resolve real display names for conversations whose stored participant
 * displayName is just a wallet address.
 */
function useResolvedDisplayNames(conversations, currentWallet) {
  const [nameMap, setNameMap] = useState({});

  useEffect(() => {
    if (!conversations?.length || !currentWallet) return;
    const walletsToResolve = new Set();

    conversations.forEach((conv) => {
      const other = getOtherParticipant(conv, currentWallet);
      if (!other) return;
      if (looksLikeWalletAddress(other.displayName)) {
        walletsToResolve.add(other.walletAddress);
      }
    });

    if (walletsToResolve.size === 0) return;
    let cancelled = false;

    const resolveAll = async () => {
      const updates = {};
      await Promise.all(
        Array.from(walletsToResolve).map(async (wallet) => {
          try {
            const name = await resolveUserDisplayName(wallet);
            if (!cancelled && name) {
              updates[wallet.toLowerCase()] = name;
            }
          } catch (err) {
            console.error("[useResolvedDisplayNames] Error resolving", wallet, err);
          }
        })
      );
      if (!cancelled && Object.keys(updates).length > 0) {
        setNameMap((prev) => ({ ...prev, ...updates }));
      }
    };

    resolveAll();
    return () => {
      cancelled = true;
    };
  }, [conversations, currentWallet]);

  return nameMap;
}

const ConversationList = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  currentWallet,
  loading,
  suggestedContacts,
  contactsLoading,
  onStartConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);

  const resolvedNames = useResolvedDisplayNames(conversations, currentWallet);

  // Deduplicate conversations by ID
  const uniqueConversations = useMemo(() => {
    if (!conversations) return [];
    return conversations.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  }, [conversations]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return uniqueConversations || [];
    const query = searchQuery.toLowerCase().trim();
    return (uniqueConversations || []).filter((conv) => {
      const other = getOtherParticipant(conv, currentWallet);
      if (!other) return false;

      // Check both resolved name from Firestore and the raw displayName
      const resolvedName = resolvedNames[other.walletAddress.toLowerCase()];
      // For admin conversations, displayName is hardcoded to "Admin Support"
      // in the render section below; make search find it.
      const isAdmin = other.role === "admin";
      const displayName = isAdmin
        ? "Admin Support"
        : (resolvedName || other.displayName);

      return (
        displayName?.toLowerCase().includes(query) ||
        other.walletAddress?.toLowerCase().includes(query)
      );
    });
  }, [uniqueConversations, searchQuery, currentWallet, resolvedNames]);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-lg font-bold text-gray-800">Tin nhắn</h2>
          {!loading && conversations?.length > 0 && (
            <span className="text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          )}
        </div>

        {/* Search bar */}
        <div className="px-4">
          <div
            className={`w-full flex items-center bg-gray-100 rounded-xl px-3 py-2.5 border-2 transition-all duration-200 ${
              isFocused
                ? "border-indigo-400 bg-white shadow-sm"
                : "border-transparent"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`flex-shrink-0 transition-colors duration-200 ${
                isFocused ? "text-indigo-500" : "text-gray-400"
              }`}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 ml-2.5"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Contacts */}
      <SuggestedContacts
        contacts={suggestedContacts}
        loading={contactsLoading}
        onStartConversation={onStartConversation}
      />

      {/* Section divider when both contacts and conversations exist */}
      {suggestedContacts?.length > 0 && conversations?.length > 0 && (
        <div className="pb-1 px-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Hội thoại gần đây
          </h3>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-1 px-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-3.5 bg-gray-200 rounded w-28 mb-2" />
                <div className="h-2.5 bg-gray-100 rounded w-44" />
              </div>
            </div>
          ))
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            {searchQuery ? (
              <>
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-300"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">Không tìm thấy hội thoại</p>
                <p className="text-xs text-gray-300 mt-1">Thử tìm kiếm với từ khóa khác</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-300"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">Chưa có hội thoại nào</p>
                <p className="text-xs text-gray-300 mt-1 text-center">
                  Gợi ý liên hệ sẽ xuất hiện ở trên, bấm để bắt đầu trò chuyện
                </p>
              </>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv, currentWallet);
            if (!other) return null;
            const isActive = conv.id === activeConversationId;
            const unreadCount = conv.unreadCountBy?.[currentWallet?.toLowerCase()] || 0;
            const isAdmin = other.role === "admin";

            // Use resolved name from Firestore if available
            const resolvedName = resolvedNames[other.walletAddress.toLowerCase()];
            const displayName = isAdmin
              ? "Admin Support"
              : (resolvedName || other.displayName);

            const isWalletName = looksLikeWalletAddress(displayName) && !isAdmin;

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`w-full flex items-center gap-3 py-3 text-left transition-all duration-150 group border-b border-gray-50 last:border-b-0 ${
                  isActive
                    ? isAdmin
                      ? "bg-purple-50"
                      : "bg-indigo-50"
                    : isAdmin
                    ? "hover:bg-purple-50/60"
                    : "hover:bg-gray-50"
                } ${isAdmin ? "relative" : ""}`}
              >
                {/* Admin indicator line */}
                {isAdmin && (
                  <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-purple-400 rounded-r-full" />
                )}

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${
                      isAdmin
                        ? "bg-gradient-to-br from-purple-500 to-purple-700 ring-2 ring-purple-200"
                        : other.role === "university"
                        ? "bg-gradient-to-br from-blue-500 to-blue-700"
                        : "bg-gradient-to-br from-emerald-400 to-emerald-600"
                    }`}
                  >
                    {isAdmin ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    ) : (
                      (displayName || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <div className={`absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-md ${
                      isAdmin ? "bg-purple-500" : "bg-indigo-500"
                    }`}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-sm font-semibold truncate ${
                        isAdmin ? "text-purple-800" : "text-gray-800"
                      }`}>
                        {displayName}
                      </span>
                      {/* Verified badge for admins */}
                      {isAdmin && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-purple-500 flex-shrink-0"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      )}
                    </div>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {formatMessageTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>

                  {/* Wallet address as muted secondary text (when name is resolved) */}
                  {!isWalletName && !isAdmin && other.walletAddress && (
                    <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                      {formatWalletAddress(other.walletAddress)}
                    </p>
                  )}

                  {/* Last message preview */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs truncate flex-1 ${
                      unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400"
                    }`}>
                      {conv.lastMessage || "Chưa có tin nhắn"}
                    </span>
                  </div>

                  {/* Role badges row */}
                  <div className="mt-1 flex items-center gap-1.5">
                    {isAdmin && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-purple-100 text-purple-700">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="8"
                          height="8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Official
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium ${
                        isAdmin ? "bg-purple-50 text-purple-500" : getRoleBadgeColor(other.role)
                      }`}
                    >
                      {getRoleBadge(other.role)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer with total count */}
      {!loading && conversations?.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center">
            {conversations.length} hội thoại
          </p>
        </div>
      )}
    </div>
  );
};

export default ConversationList;