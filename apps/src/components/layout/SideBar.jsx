import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { subscribeToConversations } from "../../services/messaging.service";
import { canAccessMessaging } from "../../utils/messagingPermissions";

// Messaging icon path
const MESSAGING_ICON = "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z";

const SideBar = () => {
  const {
    effectiveRole,
    isPendingStudent,
    disconnectWallet,
    isStudentLike,
    walletAddress,
    role,
  } = useAuth();

  // Unread message count badge for the Sidebar "Tin nhắn" link
  const [unreadCount, setUnreadCount] = useState(0);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!walletAddress || !canAccessMessaging(role)) {
      setUnreadCount(0);
      return;
    }

    unsubRef.current = subscribeToConversations(walletAddress, (conversations) => {
      const total = (conversations || []).reduce((sum, conv) => {
        return sum + (conv.unreadCountBy?.[walletAddress?.toLowerCase()] || 0);
      }, 0);
      setUnreadCount(total);
    }, role);

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [walletAddress, role]);

  // Menu items for each role
  const MENU_ITEMS = {
    admin: [
      { name: "Bảng điều khiển", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { name: "Tin nhắn", path: "/messages", icon: MESSAGING_ICON },
      { name: "Quản lý Trường", path: "/manage-universities", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m4-4h1m-1 4h1m4-4h1" },
    ],
    university: [
      { name: "Bảng điều khiển", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { name: "Tin nhắn", path: "/messages", icon: MESSAGING_ICON },
      { name: "Yêu cầu SV", path: "/student-requests", icon: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" },
      { name: "SV đã xác minh", path: "/verified-students", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM2 9a15 15 0 0112-7 15 15 0 0112 7" },
      { name: "Cấp chứng chỉ", path: "/issue", icon: "M12 4v16m8-8H4" },
      { name: "Lịch sử", path: "/history", icon: "M3 12h18M7 7h10M7 17h10" },
      { name: "Thống kê", path: "/university-analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    ],
    student: [
      { name: "Bảng điều khiển", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { name: "Tin nhắn", path: "/messages", icon: MESSAGING_ICON },
      { name: "Chứng chỉ của tôi", path: "/my-certificates", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ],
    public: [
      { name: "Bảng điều khiển", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { name: "Đăng ký SV", path: "/register-student", icon: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" },
      { name: "Xác minh CC", path: "/verify", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    ],
  };

  const menuItems = isPendingStudent
    ? [
      { name: "Bảng điều khiển", path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
        { name: "Tin nhắn", path: "/messages", icon: MESSAGING_ICON },
        { name: "Trạng thái xác minh", path: "/dashboard", icon: "M9 12h6m-6 4h6m-6-8h6" },
      ]
    : MENU_ITEMS[effectiveRole] || MENU_ITEMS.public;

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200/60 flex flex-col z-40 transition-all duration-200">
      {/* Logo area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <span className="font-bold text-sm text-gray-800">Điều hướng</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 no-nested-scrollbar">
        {menuItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            end={item.path === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
              }`
            }
          >
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
              className="shrink-0"
            >
              <path d={item.icon} />
            </svg>
            <span className="flex-1">{item.name}</span>
            {item.name === "Tin nhắn" && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-100 p-3 space-y-2">
        <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
            {effectiveRole === "pending_student" ? "Chờ duyệt" : effectiveRole}
          </p>
        </div>
        <button
          onClick={disconnectWallet}
          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 py-2.5 rounded-xl text-sm font-medium transition-colors border border-red-100 hover:border-red-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default SideBar;