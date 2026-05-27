import { useState } from "react";
import AIChat from "./AIChat";

export default function FloatingAIChat() {
  const [open, setOpen] = useState(false);

  // Mobile: keep widget comfortably tappable
  const containerClass = "fixed bottom-6 right-4 sm:right-6 flex items-center gap-3 z-50";


  return (
    <>
      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-96 h-[520px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200/60 z-50 flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold">Trợ lý DocVerify</div>
                <div className="text-[10px] text-white/70">Hỗ trợ AI 24/7</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Chat component */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <AIChat />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <div className="fixed bottom-6 right-4 sm:right-6 flex items-center gap-3 z-50">
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="group relative flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-gray-200/60 hover:shadow-xl transition-all duration-200 animate-fade-in"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Hỗ trợ AI
            </span>
          </button>
        )}

        <button
          onClick={() => setOpen(!open)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 ${
            open
              ? "bg-gray-800 rotate-90 scale-95"
              : "bg-gradient-to-br from-indigo-600 to-indigo-700 hover:scale-105"
          }`}
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}