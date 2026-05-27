import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getOrCreateAIConversation,
  subscribeToAIMessages,
  getGeminiReply,
} from "../../services/aiChat.service";

const SUGGESTION_CHIPS = [
  {
    label: "Cách xác minh chứng chỉ?",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "CID là gì?",
    icon: "M10 2v2m4-2v2m-7 4h10M5 8h14M4 12h16M4 16h16",
  },
  {
    label: "Cách chia sẻ chứng chỉ?",
    icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
  },
  {
    label: "Blockchain hoạt động ra sao?",
    icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
  },
];

export default function AIChat() {
  const { walletAddress, role } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Initialize conversation
  useEffect(() => {
    if (!walletAddress) return;
    getOrCreateAIConversation(walletAddress, role).then((id) => {
      setConvId(id);
      setInitialized(true);
    });
  }, [walletAddress, role]);

  // Subscribe to messages
  useEffect(() => {
    if (!convId) return;
    const unsub = subscribeToAIMessages(convId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [convId]);

  // Track scroll position
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const handler = () => {
      isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // Auto-scroll when new messages arrive (only if near bottom)
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    if (isNearBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
    }
  }, [messages]);

  // Scroll to bottom when loading starts
  useEffect(() => {
    if (loading) {
      const el = chatRef.current;
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
    }
  }, [loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !convId) return;
    const text = input.trim();
    setInput("");
    setLoading(true);

    try {
      await getGeminiReply(convId, text);
    } catch (err) {
      console.error("[AIChat] send error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (label) => {
    setInput(label);
    // Focus input after a tick
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Messages area */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/80"
      >
        {!initialized ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Xin chào 👋 Tôi là AI hỗ trợ của DocVerify
            </p>
            <p className="text-xs text-gray-400 max-w-xs mb-5">
              Tôi có thể giúp bạn về xác minh chứng chỉ, chia sẻ tài liệu và sử dụng hệ thống.
            </p>

            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-xs sm:max-w-sm">
              {SUGGESTION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip.label)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-xs text-gray-600 hover:text-indigo-700 transition-all shadow-sm hover:shadow"
                >
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
                    className="shrink-0"
                  >
                    <path d={chip.icon} />
                  </svg>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                    AI
                  </div>
                )}

                <div
                  className={`px-3.5 py-2.5 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-indigo-500 text-white rounded-br-md"
                      : "bg-white border border-gray-100 shadow-sm rounded-bl-md"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.text}</div>
                  <div className={`text-[10px] mt-1 ${m.sender === "user" ? "text-white/60" : "text-gray-400"}`}>
                    {formatTime(m.createdAt)}
                  </div>
                </div>

                {m.sender === "user" && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600 shrink-0">
                    U
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2 animate-fade-in">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                  AI
                </div>
                <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200/60 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input
            ref={inputRef}
            className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-400 disabled:opacity-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi..."
            disabled={loading || !initialized}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || !initialized}
            className="mr-1.5 p-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-200 text-white disabled:text-gray-400 transition-colors shrink-0"
            aria-label="Gửi tin nhắn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}