import React, { useState, useRef, useEffect, useCallback } from "react";

const MessageInput = ({ onSend, disabled }) => {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input when component mounts/enables
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Auto-resize textarea based on text content
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }, [text]);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setText("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div
        className={`flex items-end gap-2 bg-gray-50 rounded-2xl px-4 py-2.5 transition-all duration-200 ${
          isFocused
            ? "ring-2 ring-indigo-400 bg-white shadow-sm"
            : "hover:bg-gray-100"
        }`}
      >
        {/* Emoji / attachment area (icon placeholder) */}
        <button
          disabled={disabled}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Nhập tin nhắn..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 resize-none min-h-[20px] max-h-[120px] disabled:opacity-50 py-0.5"
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            text.trim() && !disabled
              ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-200/50 scale-100"
              : "bg-gray-200 text-gray-400 cursor-not-allowed scale-95"
          }`}
        >
          {disabled ? (
            <svg
              className="animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2 11 13" />
              <path d="m22 2-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Hint */}
      {!disabled && (
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Nhấn Enter để gửi · Shift+Enter để xuống dòng
        </p>
      )}
    </div>
  );
};

export default MessageInput;