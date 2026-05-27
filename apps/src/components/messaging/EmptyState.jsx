import React from "react";

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
      {/* Modern illustration */}
      <div className="relative mb-8">
        <div className="w-36 h-36 rounded-full bg-indigo-50 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="72"
            height="72"
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
        {/* Decorative elements */}
        <div className="absolute -top-1 -right-1 w-10 h-10 bg-indigo-200 rounded-full opacity-50" />
        <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-indigo-100 rounded-full" />
        <div className="absolute top-1/2 -right-4 w-4 h-4 bg-purple-200 rounded-full opacity-40" />
      </div>

      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        Tin nhắn của bạn
      </h3>
      <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed mb-8">
        Chọn một cuộc hội thoại từ danh sách bên trái để xem tin nhắn
      </p>

      {/* Feature hints */}
      <div className="grid grid-cols-1 gap-2.5 w-72">
        <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center flex-shrink-0">
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
              className="text-green-600"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Xác thực nhanh</p>
            <p className="text-xs text-gray-400">Trao đổi với trường đại học</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
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
              className="text-blue-600"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Bảo mật</p>
            <p className="text-xs text-gray-400">Dữ liệu được mã hóa an toàn</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center flex-shrink-0">
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
              className="text-purple-600"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Hỗ trợ nhanh</p>
            <p className="text-xs text-gray-400">Phản hồi từ Admin trong giờ làm việc</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;