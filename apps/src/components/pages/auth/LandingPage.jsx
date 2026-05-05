import React, { useState } from 'react';
import ConnectModal from '../ConnectModal';
import { ShieldCheck } from 'lucide-react';

const LandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden text-white">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>

      <div className="relative z-10 text-center px-4">
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in">
          <div className="bg-linear-to-r from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Layer<span className="text-blue-500">Edge</span>
            <span className="text-xs align-top ml-1 text-gray-500 font-normal">beta</span>
          </h1>
        </div>

        {/* Hero Content */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-full mb-6">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px]">
                  U{i}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400">Trusted by 1M+ Users</p>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-slate-200 mb-4">
            Connect Dashboard
          </h2>
          <p className="text-lg text-slate-400 max-w-md mx-auto">
            To start issuing and verifying academic certificates on the blockchain.
          </p>
        </div>

        {/* Rainbow Glow Button */}
        <div className="relative group inline-block">
          <div className="absolute -inset-1 bg-linear-to-r  from-red-600 via-purple-600 to-blue-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="relative px-12 py-4 bg-white text-slate-950 font-bold rounded-full text-lg hover:scale-105 transition-all duration-300 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && <ConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}

      <footer className="absolute bottom-8 text-slate-600 text-[10px] uppercase tracking-widest">
        LayerEdge © 2023-2026 v2.0.1
      </footer>
    </div>
  );
};

export default LandingPage;