import React from "react";
import { getRoleBadge, getRoleBadgeColor } from "../../utils/messagingPermissions";
import { formatWalletAddress } from "../../services/messaging.service";

const ChatHeader = ({ otherParticipant, onBack }) => {
  if (!otherParticipant) return null;

  const isAdmin = otherParticipant.role === "admin";
  const isUniversity = otherParticipant.role === "university";

  // Check if displayName is a wallet pattern
  const looksLikeWallet = /^0x[a-fA-F0-9]+/.test(otherParticipant.displayName || "");
  const showWallet = otherParticipant.walletAddress && (looksLikeWallet || isAdmin);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shadow-sm z-10">
      {/* Mobile back button */}
      <button
        onClick={onBack}
        className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Quay lại danh sách hội thoại"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-600"
        >
          <path d="M19 12H5" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${
            isAdmin
              ? "bg-gradient-to-br from-purple-500 to-purple-700 ring-2 ring-purple-200"
              : isUniversity
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
            (otherParticipant.displayName || "?").charAt(0).toUpperCase()
          )}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
      </div>

      {/* Name and role */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold truncate ${
            isAdmin ? "text-purple-800" : "text-gray-800"
          }`}>
            {isAdmin
              ? "Admin Support"
              : otherParticipant.displayName || formatWalletAddress(otherParticipant.walletAddress)}
          </h3>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium flex-shrink-0 ${
              isAdmin
                ? "bg-purple-100 text-purple-700"
                : getRoleBadgeColor(otherParticipant.role)
            }`}
          >
            {isAdmin ? "Hỗ trợ" : getRoleBadge(otherParticipant.role)}
          </span>
        </div>

        {/* Wallet address as secondary text */}
        {showWallet && (
          <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">
            {formatWalletAddress(otherParticipant.walletAddress)}
          </p>
        )}

        {/* Status text */}
        {!showWallet && (
          <p className={`text-xs font-medium ${
            isAdmin ? "text-purple-500" : "text-emerald-500"
          }`}>
            {isAdmin ? "Hỗ trợ xác minh & hệ thống" : "Đang hoạt động"}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Tuỳ chọn">
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
            className="text-gray-400"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;