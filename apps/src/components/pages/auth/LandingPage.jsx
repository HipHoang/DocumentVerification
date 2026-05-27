import React, { useState } from "react";
import { ShieldCheck, ArrowRight, ChevronRight, BookOpen, Award, Building2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import ConnectModal from "../common/ConnectModal";

const FloatingOrb = ({ className, size, color1, color2, delay }) => (
  <div
    className={`absolute rounded-full blur-3xl opacity-20 animate-float ${className}`}
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle at center, ${color1}, ${color2})`,
      animationDelay: `${delay}s`,
      animationDuration: `${6 + delay}s`,
    }}
  />
);

const LandingPage = () => {
  const { isInitialized, connectWallet } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  const handleGetStarted = async () => {
    if (!window.ethereum) {
      setIsModalOpen(true);
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col relative overflow-hidden text-white">
      {/* Premium gradient orbs */}
      <FloatingOrb className="-top-32 -left-32" size="500px" color1="#3b82f6" color2="#8b5cf6" delay={0} />
      <FloatingOrb className="-bottom-40 -right-32" size="600px" color1="#7c3aed" color2="#ec4899" delay={2} />
      <FloatingOrb className="top-1/3 right-1/4" size="300px" color1="#06b6d4" color2="#3b82f6" delay={4} />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[64px_64px]" />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-20">
        {/* Top badge */}
        <div className="animate-fade-in-up mb-10">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-2 rounded-full">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#020617] bg-linear-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[10px] font-medium"
                >
                  U{i}
                </div>
              ))}
            </div>
            <span className="text-sm text-slate-400">Được tin dùng bởi <span className="text-slate-300 font-semibold">1M+</span> người dùng</span>
          </div>
        </div>

        {/* Logo + Brand */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="bg-linear-to-br from-blue-500 via-blue-600 to-purple-600 p-3.5 rounded-2xl shadow-lg shadow-blue-500/25">
            <ShieldCheck size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Doc<span className="text-blue-400">Verify</span>
              <span className="text-xs align-top ml-1.5 text-gray-500 font-normal bg-white/5 px-2 py-0.5 rounded-full">beta</span>
            </h1>
          </div>
        </div>

        {/* Hero text */}
        <div className="text-center max-w-2xl mb-12 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-linear-to-r from-white via-slate-100 to-slate-300 mb-6 leading-tight">
            Kết nối Bảng điều khiển
          </h2>
          <p className="text-lg md:text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
            Bắt đầu cấp và xác minh chứng chỉ học thuật trên blockchain một cách an toàn và minh bạch.
          </p>
          {error && (
            <p className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 inline-block">{error}</p>
          )}
        </div>

        {/* CTA Button */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
          <div className="relative group inline-block">
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-300" />
            <button
              onClick={handleGetStarted}
              disabled={!isInitialized}
              className="relative px-10 py-4 bg-white text-slate-900 font-bold rounded-full text-lg hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group/btn"
            >
              {isInitialized ? (
                <>
                  Bắt đầu
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              ) : (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent mr-1" />
                  Đang tải...
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-3xl w-full animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          {[
            { icon: BookOpen, title: "Cấp chứng chỉ", desc: "Phát hành chứng chỉ số trên blockchain" },
            { icon: Award, title: "Xác minh ngay", desc: "Xác thực chứng chỉ trong vài giây" },
            { icon: Building2, title: "Dành cho doanh nghiệp", desc: "Tích hợp xác minh cho nhà tuyển dụng" },
          ].map((item, i) => (
            <div
              key={i}
              className="group bg-white/3 backdrop-blur-sm border border-white/6 hover:border-white/15 rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.06] hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-3 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-colors">
                <item.icon size={20} className="text-blue-400" />
              </div>
              <h3 className="font-semibold text-sm text-slate-200 mb-1">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ConnectModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setError(""); }}
        />
      )}

      {/* Footer */}
      <footer className="relative z-10 text-center pb-6 text-slate-700 text-[10px] uppercase tracking-widest">
        DocVerify © 2023-2026
      </footer>
    </div>
  );
};

export default LandingPage;