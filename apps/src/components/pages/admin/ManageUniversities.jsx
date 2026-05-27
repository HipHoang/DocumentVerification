import { useState, useEffect } from "react";
import { useContract } from "../../../hooks/useContract";
import { useAuth } from "../../../context/AuthContext";
// Đảm bảo các hàm này đã được export trong blockchain.service.js
import { addUniversity, removeUniversity, getUserInfo } from "../../../services/blockchain.service";
import {
  addUniversityToFirestore,
  deleteUniversityFromFirestore,
  getAllUniversities,
  suspendUniversity,
  activateUniversity,
  revokeUniversity,
} from "../../../services/university.service";
import { ethers } from "ethers";

// Status configuration
const STATUS_CONFIG = {
  active: {
    label: "Hoạt động",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badge: "bg-emerald-500",
  },
  suspended: {
    label: "Tạm ngưng",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    badge: "bg-orange-500",
  },
  revoked: {
    label: "Đã thu hồi",
    color: "bg-red-100 text-red-700 border-red-200",
    badge: "bg-red-500",
  },
};

const FILTER_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Hoạt động" },
  { key: "suspended", label: "Tạm ngưng" },
  { key: "revoked", label: "Đã thu hồi" },
];

const ManageUniversities = () => {
  const { contract } = useContract();
  const { walletAddress, role, isAdmin } = useAuth();

  const [uniAddress, setUniAddress] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [allowedDomain, setAllowedDomain] = useState("");
  const [address, setAddress] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // Track which university is being acted upon
  const [universities, setUniversities] = useState([]);
  const [filteredUniversities, setFilteredUniversities] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
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

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const data = await getAllUniversities();

        const formatted = data.map((uni) => ({
          id: uni.id,
          address: uni.walletAddress,
          name: uni.name,
          allowedDomain: uni.allowedDomain || "",
          physicalAddress: uni.address || "",
          timestamp: uni.createdAt?.toDate?.().toLocaleDateString?.() || "Unknown",
          status: uni.status || "active", // Default to active for backward compatibility
        }));

        setUniversities(formatted);
      } catch (err) {
        console.error(err);
        showError("Không tải được danh sách trường.");
      }
    };

    loadUniversities();
  }, []);

  // Filter universities based on active filter tab
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredUniversities(universities);
    } else {
      setFilteredUniversities(universities.filter(uni => uni.status === activeFilter));
    }
  }, [universities, activeFilter]);

  // Get count for each status
  const getStatusCounts = () => {
    const counts = { all: universities.length, active: 0, suspended: 0, revoked: 0 };
    universities.forEach(uni => {
      if (counts[uni.status] !== undefined) {
        counts[uni.status]++;
      }
    });
    return counts;
  };

  // --------------------------------------------
  // 3. Xử lý Thêm University
  // --------------------------------------------
  const handleAddUniversity = async () => {
    try {
      if (!uniAddress.trim() || !universityName.trim() || !allowedDomain.trim() || !address.trim()) {
        return showError("Vui lòng nhập đầy đủ tên, địa chỉ ví, email domain và địa chỉ.");
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

      // Clean allowedDomain (remove leading '@' if present)
      const cleanedAllowedDomain = allowedDomain.trim().startsWith("@")
        ? allowedDomain.trim().substring(1)
        : allowedDomain.trim();

      const tx = await addUniversity(contract, uniAddress.trim(), universityName.trim());

      // If blockchain transaction is successful, save to Firestore
      const firestoreResult = await addUniversityToFirestore(
        universityName.trim(),
        uniAddress.trim(),
        cleanedAllowedDomain,
        address.trim()
      );

      if (!firestoreResult.success) {
        throw new Error("Failed to save university metadata to Firestore.");
      }

      showMessage(`✅ Đã thêm: ${universityName.trim()}`);

      // Cập nhật UI
      const newUni = {
        address: uniAddress.trim(),
        name: universityName.trim(),
        allowedDomain: cleanedAllowedDomain,
        physicalAddress: address.trim(), // Renamed to avoid conflict with wallet address
        timestamp: new Date().toLocaleDateString()
      };

      setUniversities(prev => [newUni, ...prev]);
      setUniAddress("");
      setUniversityName("");
      setAllowedDomain("");
      setAddress("");

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
  const handleRemoveUniversity = async (uniWalletAddress, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi quyền của trường: ${name}?`)) return;

    try {
      setLoadingRemove(true);

      // 1. Remove from blockchain
      await removeUniversity(contract, uniWalletAddress);

      // 2. Delete from Firestore (so it won't appear in RegisterStudent dropdown)
      const firestoreResult = await deleteUniversityFromFirestore(uniWalletAddress);
      if (!firestoreResult.success) {
        console.warn("Firestore deletion warning:", firestoreResult.error || firestoreResult.message);
      }

      showMessage(`✅ Đã thu hồi quyền của: ${name}`);
      setUniversities(prev => prev.filter(u => u.address.toLowerCase() !== uniWalletAddress.toLowerCase()));
    } catch (err) {
      showError(`Lỗi khi xóa: ${err.message}`);
    } finally {
      setLoadingRemove(false);
    }
  };

  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Handle status actions
  const handleSuspendUniversity = async (uniWalletAddress, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn tạm ngưng trường: ${name}?`)) return;

    try {
      setLoadingAction(uniWalletAddress);
      const result = await suspendUniversity(uniWalletAddress);

      if (result.success) {
        showMessage(`✅ Đã tạm ngưng: ${name}`);
        setUniversities(prev => prev.map(u =>
          u.address.toLowerCase() === uniWalletAddress.toLowerCase()
            ? { ...u, status: "suspended" }
            : u
        ));
      } else {
        showError(`Lỗi khi tạm ngưng: ${result.error}`);
      }
    } catch (err) {
      showError(`Lỗi khi tạm ngưng: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleActivateUniversity = async (uniWalletAddress, name) => {
    try {
      setLoadingAction(uniWalletAddress);
      const result = await activateUniversity(uniWalletAddress);

      if (result.success) {
        showMessage(`✅ Đã kích hoạt: ${name}`);
        setUniversities(prev => prev.map(u =>
          u.address.toLowerCase() === uniWalletAddress.toLowerCase()
            ? { ...u, status: "active" }
            : u
        ));
      } else {
        showError(`Lỗi khi kích hoạt: ${result.error}`);
      }
    } catch (err) {
      showError(`Lỗi khi kích hoạt: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRevokeUniversity = async (uniWalletAddress, name) => {
    if (!window.confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn thu hồi vĩnh viễn trường: ${name}? Hành động này không thể hoàn tác!`)) return;

    try {
      setLoadingAction(uniWalletAddress);
      const result = await revokeUniversity(uniWalletAddress);

      if (result.success) {
        showMessage(`✅ Đã thu hồi: ${name}`);
        setUniversities(prev => prev.map(u =>
          u.address.toLowerCase() === uniWalletAddress.toLowerCase()
            ? { ...u, status: "revoked" }
            : u
        ));
      } else {
        showError(`Lỗi khi thu hồi: ${result.error}`);
      }
    } catch (err) {
      showError(`Lỗi khi thu hồi: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

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
            Trạng thái: Đã kết nối
          </span>
          <p className="text-sm font-mono text-gray-400">{formatAddress(walletAddress)}</p>
        </div>
      </div>

      {/* Thông báo */}
      {(message || error) && (
        <div className={`mb-6 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${message ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
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
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email Domain</label>
                <input
                  type="text"
                  value={allowedDomain}
                  onChange={(e) => setAllowedDomain(e.target.value)}
                  placeholder="VD: hcmus.edu.vn"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Địa chỉ thực (Physical Address)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: 227 Nguyễn Văn Cừ, Quận 5, TP.HCM"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <button
                onClick={handleAddUniversity}
                disabled={loadingAdd || !uniAddress.trim() || !universityName.trim() || !allowedDomain.trim() || !address.trim()}
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
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  🏫 Danh sách đối tác
                  <span className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-md">{filteredUniversities.length}</span>
                </h2>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2">
                  {FILTER_TABS.map(tab => {
                    const count = getStatusCounts()[tab.key] || 0;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          activeFilter === tab.key
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        {tab.label}
                        {count > 0 && (
                          <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                            activeFilter === tab.key
                              ? "bg-indigo-500 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredUniversities.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 font-medium">
                    {activeFilter === "all"
                      ? "Chưa có trường đại học nào được đăng ký."
                      : `Không có trường nào ở trạng thái "${FILTER_TABS.find(t => t.key === activeFilter)?.label}".`}
                  </p>
                </div>
              ) : (
                filteredUniversities.map((uni, idx) => {
                  const statusConfig = STATUS_CONFIG[uni.status] || STATUS_CONFIG.active;
                  const isLoading = loadingAction === uni.address;

                  return (
                    <div key={idx} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                          {uni.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">{uni.name}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.badge} mr-1`}></span>
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 font-medium mt-1">
                            <p><span className="font-bold">Địa chỉ ví:</span> <span className="font-mono">{uni.address}</span></p>
                            {uni.allowedDomain && <p><span className="font-bold">Email Domain:</span> {uni.allowedDomain}</p>}
                            {uni.physicalAddress && <p><span className="font-bold">Địa chỉ:</span> {uni.physicalAddress}</p>}
                            <p className="text-gray-500 italic text-xs mt-1">Đăng ký vào: {uni.timestamp}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {uni.status === "active" && (
                          <>
                            <button
                              onClick={() => handleSuspendUniversity(uni.address, uni.name)}
                              disabled={isLoading}
                              className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Tạm ngưng"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRevokeUniversity(uni.address, uni.name)}
                              disabled={isLoading}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Thu hồi vĩnh viễn"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </button>
                          </>
                        )}

                        {uni.status === "suspended" && (
                          <>
                            <button
                              onClick={() => handleActivateUniversity(uni.address, uni.name)}
                              disabled={isLoading}
                              className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Kích hoạt lại"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRevokeUniversity(uni.address, uni.name)}
                              disabled={isLoading}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Thu hồi vĩnh viễn"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </button>
                          </>
                        )}

                        {uni.status === "revoked" && (
                          <span className="text-gray-400 text-sm italic">Đã thu hồi</span>
                        )}

                        {isLoading && (
                          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin ml-2"></div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUniversities;