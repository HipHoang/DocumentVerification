import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { X, Wallet, ShieldCheck, Search, ExternalLink } from "lucide-react";

const ConnectModal = ({ isOpen, onClose }) => {
  const { connectWallet } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const wallets = [
    { id: "metamask", name: "MetaMask", icon: "🦊", description: "Đã cài đặt", active: true },
    { id: "rainbow", name: "Rainbow", icon: "🌈", description: "Được đề xuất", active: false },
    { id: "okx", name: "OKX Wallet", icon: "⬛", description: "Được đề xuất", active: false },
    { id: "phantom", name: "Phantom", icon: "👻", description: "Được đề xuất", active: false },
  ];

  const handleConnect = async (id) => {
    if (id !== "metamask") return;
    try {
      await connectWallet();
      onClose();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleVerifyClick = () => {
    onClose();
    navigate("/verify");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Left: Wallet List */}
        <div className="w-full md:w-1/2 p-6 md:p-8 border-r border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Kết nối Ví</h3>

          <div className="space-y-2.5">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Đã cài đặt</p>
            {wallets.filter((w) => w.active).map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-50 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{wallet.name}</p>
                    <p className="text-[10px] text-blue-500 font-medium">{wallet.description}</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </button>
            ))}

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-3">Ví khác</p>
            {wallets.filter((w) => !w.active).map((wallet) => (
              <button
                key={wallet.id}
                disabled
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-transparent bg-slate-50 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="text-2xl grayscale">{wallet.icon}</span>
                  <p className="font-semibold text-sm">{wallet.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="w-full md:w-1/2 p-6 md:p-8 bg-slate-50 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Ví là gì?</h3>

          <div className="space-y-5 flex-1">
            <div className="flex gap-3.5">
              <div className="mt-0.5 text-blue-600 shrink-0">
                <Wallet size={24} />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Lưu trữ tài sản số</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Ví dùng để gửi, nhận và lưu trữ chứng chỉ số cũng như NFT một cách an toàn.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5">
              <div className="mt-0.5 text-blue-600 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Đăng nhập không mật khẩu</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Thay vì nhập mật khẩu, chỉ cần kết nối ví để truy cập bảng điều khiển của bạn.
                </p>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="my-5 border-t border-slate-200" />

          {/* Verify for employers CTA */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                <Search size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-indigo-900">Xác minh cho nhà tuyển dụng</p>
                <p className="text-xs text-indigo-600/80 mt-0.5 leading-relaxed">
                  Kiểm tra tính xác thực của chứng chỉ mà không cần kết nối ví.
                </p>
                <button
                  onClick={handleVerifyClick}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                >
                  <ExternalLink size={12} />
                  Xác minh ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;