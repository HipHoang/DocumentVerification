import { ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const Home = () => {
  const { walletAddress, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden text-white">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />

      <div className="relative z-10 text-center px-4 max-w-lg w-full">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-linear-to-r from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Layer<span className="text-blue-500">Edge</span>
            <span className="text-xs align-top ml-1 text-gray-500 font-normal">beta</span>
          </h1>
        </div>

        <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-8 mb-6">
          <div className="flex justify-center mb-4">
            <AlertCircle size={48} className="text-amber-400" />
          </div>

          <h2 className="text-xl font-bold text-slate-200 mb-2">
            Chào mừng, Người dùng Công khai
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Ví của bạn đã kết nối. Hãy đăng ký sinh viên để được xác minh và truy cập các tính năng dành cho sinh viên.
          </p>

          <div className="bg-slate-800/60 rounded-xl px-4 py-3 mb-6 text-left">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              Ví đã kết nối
            </p>
            <p className="text-slate-300 text-sm font-mono break-all">
              {walletAddress}
            </p>
          </div>

          <div className="text-left text-sm text-slate-400 mb-2">
            <p className="font-medium text-slate-300 mb-3">Các bước tiếp theo</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <span>
                  <span className="text-white font-medium">Đăng ký Sinh viên</span>
                  <span className="text-slate-500 ml-2">— gửi yêu cầu xác minh</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                <span>
                  <span className="text-white font-medium">Đến Bảng điều khiển</span>
                  <span className="text-slate-500 ml-2">— xem các hành động có sẵn</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => (window.location.href = "/register-student")}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 text-white font-medium rounded-full transition-all duration-200"
          >
            Đăng ký SV
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-medium rounded-full transition-all duration-200"
          >
            Đến Bảng điều khiển
          </button>
        </div>

        <button
          onClick={logout}
          className="mt-3 w-full px-8 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-full transition-all duration-200"
        >
          Ngắt kết nối Ví
        </button>
      </div>

      <footer className="absolute bottom-8 text-slate-600 text-[10px] uppercase tracking-widest">
        DocVerify © 2023-2026
      </footer>
    </div>
  );
};

export default Home;