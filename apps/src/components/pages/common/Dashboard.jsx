import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "../admin/AdminDashboard";

const Dashboard = () => {
  const { role, walletAddress } = useAuth();
  const navigate = useNavigate();

  const getRoleConfig = () => {
    switch (role) {
      case "university":
        return {
          title: "Bảng điều khiển Trường ĐH",
          description: "Cấp và quản lý chứng chỉ học thuật trên blockchain.",
          actions: [
            {
              title: "Yêu cầu SV",
              description: "Duyệt hoặc từ chối yêu cầu xác minh sinh viên.",
              path: "/student-requests",
              color: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
              icon: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2",
            },
            {
              title: "SV đã xác minh",
              description: "Tìm kiếm sinh viên đã xác minh theo MSSV.",
              path: "/verified-students",
              color: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
              icon: "M16 11c1.657 0 3-1.343 3-3S17.657 5 16 5s-3 1.343-3 3 1.343 3 3 3zM19.07 19.07A9 9 0 005.93 19.07",
            },
            {
              title: "Cấp chứng chỉ",
              description: "Tải lên và cấp chứng chỉ mới cho sinh viên.",
              path: "/issue",
              color: "bg-indigo-600 hover:bg-indigo-700",
              icon: "M12 4v16m8-8H4",
            },
            {
              title: "Lịch sử chứng chỉ",
              description: "Xem tất cả chứng chỉ đã cấp.",
              path: "/history",
              color: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
              icon: "M3 12h18M7 7h10M7 17h10",
            },
            {
              title: "Xác minh CC",
              description: "Xác minh tính xác thực của chứng chỉ.",
              path: "/verify",
              color: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            },
          ],
        };
      case "pending_student":
        return {
          title: "Đang chờ xác minh",
          description:
            "Yêu cầu xác minh sinh viên của bạn đang chờ trường duyệt.",
          isPending: true,
          actions: [
            {
              title: "Xác minh CC",
              description: "Xác minh tính xác thực của chứng chỉ.",
              path: "/verify",
              color:
                "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            },
          ],
        };
      case "student":
      case "verified_student":
        return {
          title: "Bảng điều khiển Sinh viên",
          description: "Xem chứng chỉ của bạn và xác minh tính xác thực.",
          actions: [
            {
              title: "Chứng chỉ của tôi",
              description: "Xem tất cả chứng chỉ được cấp cho ví của bạn.",
              path: "/my-certificates",
              color: "bg-indigo-600 hover:bg-indigo-700",
              icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            },
            {
              title: "Xác minh CC",
              description: "Xác minh tính xác thực của chứng chỉ.",
              path: "/verify",
              color: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            },
          ],
        };
      case "admin":
        return {
          title: "Bảng điều khiển Quản trị",
          description: "Tổng quan phân tích và quản lý.",
          isAdmin: true,
          actions: [
            {
              title: "Quản lý người dùng",
              description: "Thêm trường đại học và nhà tuyển dụng vào danh sách.",
              path: "/manage-universities",
              color: "bg-indigo-600 hover:bg-indigo-700",
              icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
            },
            {
              title: "Xác minh CC",
              description: "Xác minh tính xác thực của chứng chỉ.",
              path: "/verify",
              color: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            },
          ],
        };
      case "public":
        return {
          title: "Xác minh",
          description: "Xác minh chứng chỉ bằng mã băm hoặc liên kết chia sẻ.",
          actions: [
            {
              title: "Xác minh CC",
              description: "Xác minh tính xác thực của chứng chỉ.",
              path: "/verify",
              color:
                "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            },
          ],
        };
      default:
        return { title: "Bảng điều khiển", description: "", actions: [] };
    }
  };

  const config = getRoleConfig();
  const shortenAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
        <p className="text-gray-500 mt-1">{config.description}</p>
        <p className="text-xs text-gray-400 font-mono mt-2">{shortenAddress(walletAddress)}</p>
      </div>

      {config.isAdmin && (
        <div className="mb-8">
          <AdminDashboard />
        </div>
      )}

      {config.isPending && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <h3 className="font-semibold text-amber-800">Trạng thái xác minh: Đang chờ</h3>
              <p className="text-sm text-amber-700 mt-1">
                Đăng ký của bạn đã được gửi. Vui lòng đợi trường duyệt tài khoản.
                Bạn vẫn có thể sử dụng công cụ <strong>Xác minh CC</strong> trong thời gian chờ.
              </p>
            </div>
          </div>
        </div>
      )}

      {config.actions.length > 0 && (
        <>
          {config.isAdmin && (
            <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác Quản trị</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.actions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className={`${action.color} p-6 rounded-xl text-left transition shadow-sm hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={action.icon} />
                  </svg>
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
                    className="opacity-50"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
                <h3 className="font-semibold text-base mb-1">{action.title}</h3>
                <p className="text-sm opacity-80">{action.description}</p>
              </button>
            ))}
          </div>
        </>
      )}

    </div>
  );
};

export default Dashboard;