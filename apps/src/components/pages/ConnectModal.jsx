import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Wallet, ShieldCheck, HelpCircle } from 'lucide-react';

const ConnectModal = ({ isOpen, onClose }) => {
  const { connectWallet } = useAuth();

  if (!isOpen) return null;

  const wallets = [
    { id: 'metamask', name: 'MetaMask', icon: '🦊', description: 'Recent', active: true },
    { id: 'rainbow', name: 'Rainbow', icon: '🌈', description: 'Recommended', active: false },
    { id: 'okx', name: 'OKX Wallet', icon: '⬛', description: 'Recommended', active: false },
    { id: 'phantom', name: 'Phantom', icon: '👻', description: 'Recommended', active: false },
  ];

  const handleConnect = async (id) => {
    if (id === 'metamask') {
      try {
        await connectWallet();
        onClose(); // Đóng modal sau khi kết nối thành công
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row animate-scale-up shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
          <X size={24} />
        </button>

        {/* Left Column: Wallet List */}
        <div className="w-full md:w-1/2 p-8 border-r border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Connect a Wallet</h3>
          
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Installed</p>
            {wallets.filter(w => w.active).map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-50 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">{wallet.name}</p>
                    <p className="text-[10px] text-blue-500">{wallet.description}</p>
                  </div>
                </div>
              </button>
            ))}

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-4">Others</p>
            {wallets.filter(w => !w.active).map((wallet) => (
              <button
                key={wallet.id}
                disabled
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-transparent bg-slate-50 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="text-2xl grayscale">{wallet.icon}</span>
                  <p className="font-bold">{wallet.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Info */}
        <div className="w-full md:w-1/2 p-8 bg-slate-50 flex flex-col justify-center items-center text-center">
          <h3 className="text-xl font-bold text-slate-900 mb-8">What is a Wallet?</h3>
          
          <div className="space-y-8 max-w-60">
            <div className="flex gap-4 text-left">
              <div className="mt-1 text-blue-600"><Wallet size={32} /></div>
              <div>
                <p className="font-bold text-sm text-slate-900">A Home for your Digital Assets</p>
                <p className="text-xs text-slate-500">Wallets are used to send, receive, and store digital certificates and NFTs.</p>
              </div>
            </div>

            <div className="flex gap-4 text-left">
              <div className="mt-1 text-blue-600"><ShieldCheck size={32} /></div>
              <div>
                <p className="font-bold text-sm text-slate-900">A New Way to Log In</p>
                <p className="text-xs text-slate-500">Instead of passwords, just connect your wallet to access your dashboard.</p>
              </div>
            </div>
          </div>

          <button className="mt-12 bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors">
            Get a Wallet
          </button>
          <button className="mt-4 text-xs font-bold text-blue-600 hover:underline">Learn More</button>
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;
