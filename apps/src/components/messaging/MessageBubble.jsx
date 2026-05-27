import React from "react";
import { formatBubbleTime } from "../../services/messaging.service";
import { getRoleBadge, getRoleBadgeColor } from "../../utils/messagingPermissions";

const MessageBubble = ({ message, isOwn }) => {
  const { text, createdAt, senderRole } = message;

  return (
    <div
      className={`flex flex-col mb-1 ${
        isOwn ? "items-end" : "items-start"
      }`}
    >
      {/* Sender role chip for other's messages (subtle) */}
      {!isOwn && senderRole && (
        <span className="text-[10px] text-gray-400 mb-0.5 ml-1">
          {getRoleBadge(senderRole)}
        </span>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[80%] md:max-w-[70%] px-3.5 py-2.5 break-words leading-relaxed ${
          isOwn
            ? "bg-indigo-500 text-white rounded-[18px] rounded-br-[4px]"
            : "bg-white text-gray-800 rounded-[18px] rounded-bl-[4px] shadow-sm border border-gray-100"
        }`}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>

      {/* Timestamp + status */}
      <div
        className={`flex items-center gap-1.5 mt-0.5 px-1 ${
          isOwn ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <span className="text-[11px] text-gray-400">
          {formatBubbleTime(createdAt)}
        </span>
        {isOwn && (
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-indigo-300"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MessageBubble);