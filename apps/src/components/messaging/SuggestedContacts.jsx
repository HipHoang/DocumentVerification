import React from "react";
import { getRoleBadge, getRoleBadgeColor } from "../../utils/messagingPermissions";
import { formatWalletAddress } from "../../services/messaging.service";

const SuggestedContacts = ({ contacts, loading, onStartConversation }) => {
  if (loading) {
    return (
      <div className="pb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">
          Gợi ý liên hệ
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 animate-pulse shrink-0 snap-start"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="w-16 h-3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!contacts?.length) return null;

  return (
    <div className="pb-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 flex items-center gap-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Gợi ý liên hệ
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory px-4">
        {contacts.map((contact) => {
          const isAdmin = contact.role === "admin";
          const isUniversity = contact.role === "university";
          const displayName = isAdmin
            ? "Admin Support"
            : contact.displayName || formatWalletAddress(contact.walletAddress);
          const looksLikeWallet = /^0x[a-fA-F0-9]+/.test(displayName);

          return (
            <button
              key={contact.walletAddress}
              onClick={() => onStartConversation(contact)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:shadow-sm transition-all shrink-0 group snap-start border border-gray-100 hover:border-indigo-200"
              title={`Bắt đầu trò chuyện với ${displayName}`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                    isAdmin
                      ? "bg-gradient-to-br from-purple-500 to-purple-700 ring-1 ring-purple-200"
                      : isUniversity
                      ? "bg-gradient-to-br from-blue-500 to-blue-700"
                      : "bg-gradient-to-br from-emerald-400 to-emerald-600"
                  }`}
                >
                  {isAdmin ? (
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
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  ) : (
                    (displayName || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
              </div>

              {/* Info */}
              <div className="text-left">
                <p className="text-xs font-medium text-gray-700 truncate max-w-[100px]">
                  {displayName}
                </p>
                {looksLikeWallet && !isAdmin && (
                  <p className="text-[9px] text-gray-400 font-mono truncate max-w-[100px]">
                    {formatWalletAddress(contact.walletAddress)}
                  </p>
                )}
                <span
                  className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium ${getRoleBadgeColor(
                    contact.role
                  )}`}
                >
                  {getRoleBadge(contact.role)}
                </span>
              </div>

              {/* Start chat icon */}
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
                className="text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedContacts;