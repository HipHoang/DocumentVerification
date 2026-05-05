import { useState, useEffect, useCallback } from "react";
import { useContract } from "../../../hooks/useContract";
import { useAuth } from "../../../context/AuthContext";
// Đảm bảo các hàm này đã được export trong blockchain.service.js
import { addUniversity, removeUniversity, getUserInfo } from "../../../services/blockchain.service";
import { ethers } from "ethers";

const ManageUniversities = () => {
  const { contract } = useContract();
  const { walletAddress, role, isAdmin } = useAuth();
  
  const [uniAddress, setUniAddress] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // --------------------------------------------
  // 1. Quản lý thông báo
  // --------------------------------------------
  const showMessage = (msg) => {
    setMessage(msg);
    setError("");
    setTimeout(() => setMessage(""), 5000);
  };

  const showError = (msg) => {
    setError(msg);
    setMessage("");
    setTimeout(() => setError(""), 5000);
  };

  // --------------------------------------------
  // 2. Tải danh sách từ LocalStorage (Mock Up cho danh sách)
  // Lưu ý: Smart Contract thường không có hàm listAll, 
  // nên ta lưu cache các địa chỉ đã add để tiện quản lý.
  // --------------------------------------------
  useEffect(() => {
    const savedUnis = localStorage.getItem("registered_universities");
    if (savedUnis) {
      setUniversities(JSON.parse(savedUnis));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("registered_universities", JSON.stringify(universities));
  }, [universities]);

  // --------------------------------------------
  // 3. Xử lý Thêm University
  // --------------------------------------------
  const handleAddUniversity = async () => {
    try {
      if (!uniAddress.trim() || !universityName.trim()) {
        return showError("Vui lòng nhập đầy đủ tên và địa chỉ ví.");
      }
      if (!ethers.isAddress(uniAddress.trim())) {
        return showError("Địa chỉ ví không hợp lệ.");
      }
      if (!contract) {
        return showError("Chưa kết nối được với Smart Contract.");
      }
      if (!isAdmin) {
        return showError("Chỉ Admin mới có quyền thực hiện thao tác này.");
      }

      setLoadingAdd(true);
      
      // Gọi service để tương tác với Blockchain
      const tx = await addUniversity(contract, uniAddress.trim(), universityName.trim());
      console.log("Transaction:", tx);

      showMessage(`✅ Đã thêm: ${universityName.trim()}`);
      
      // Cập nhật UI
      const newUni = { 
        address: uniAddress.trim(), 
        name: universityName.trim(),
        timestamp: new Date().toLocaleDateString()
      };
      
      setUniversities(prev => [newUni, ...prev]);
      setUniAddress("");
      setUniversityName("");
      
    } catch (err) {
      console.error(err);
      showError(err.reason || err.message || "Giao dịch thất bại.");
    } finally {
      setLoadingAdd(false);
    }
  };

  // --------------------------------------------
  // 4. Xử lý Xóa University
  // --------------------------------------------
  const handleRemoveUniversity = async (address, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi quyền của trường: ${name}?`)) return;
    
    try {
      setLoadingRemove(true);
      
      await removeUniversity(contract, address);
      
      showMessage(`✅ Đã thu hồi quyền của: ${name}`);
      setUniversities(prev => prev.filter(u => u.address.toLowerCase() !== address.toLowerCase()));
    } catch (err) {
      showError(`Lỗi khi xóa: ${err.message}`);
    } finally {
      setLoadingRemove(false);
    }
  };

  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Chặn truy cập nếu không phải Admin
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-red-800 mb-2">Truy cập bị từ chối</h2>
          <p className="text-red-600">Bạn cần đăng nhập bằng quyền Admin để xem trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Quản trị Hệ thống</h1>
          <p className="text-gray-500 font-medium italic">Cấp và thu hồi quyền các cơ sở giáo dục</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider mb-2">
            Status: Connected
          </span>
          <p className="text-sm font-mono text-gray-400">{formatAddress(walletAddress)}</p>
        </div>
      </div>

      {/* Thông báo */}
      {(message || error) && (
        <div className={`mb-6 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${
          message ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <p className="font-bold flex items-center gap-2">
            {message ? "✨" : "⚠️"} {message || error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form thêm mới */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-md flex items-center justify-center text-sm">+</span>
              Thêm Trường Mới
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tên Cơ Sở</label>
                <input
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  placeholder="VD: Đại học Bách Khoa"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Địa chỉ ví (Address)</label>
                <input
                  type="text"
                  value={uniAddress}
                  onChange={(e) => setUniAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <button
                onClick={handleAddUniversity}
                disabled={loadingAdd || !uniAddress.trim() || !universityName.trim()}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loadingAdd ? "Đang xử lý..." : "Xác nhận thêm"}
              </button>
            </div>
          </div>
        </div>

        {/* Danh sách */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🏫 Danh sách đối tác
                <span className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-md">{universities.length}</span>
              </h2>
            </div>
            
            <div className="divide-y divide-gray-100">
              {universities.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 font-medium">Chưa có trường đại học nào được đăng ký.</p>
                </div>
              ) : (
                universities.map((uni, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                        {uni.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{uni.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                          <span>{uni.address}</span>
                          <span className="text-gray-200">|</span>
                          <span>{uni.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUniversity(uni.address, uni.name)}
                      disabled={loadingRemove}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                      title="Thu hồi quyền"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUniversities;