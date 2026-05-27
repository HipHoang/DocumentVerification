import { useState, useEffect, useCallback } from "react";
import { useContract } from "../../../hooks/useContract";
import { useAuth } from "../../../context/AuthContext";
import { getIssuedCertificates } from "../../../services/blockchain.service";

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

const CertificateHistory = () => {
  const { walletAddress } = useAuth();
  const { contract } = useContract();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCertificates = useCallback(async () => {
    if (!contract || !walletAddress) return;

    try {
      setLoading(true);
      setError("");

      const issuedData = await getIssuedCertificates(contract, walletAddress);
      setCertificates(issuedData);
    } catch (err) {
      console.error("[CertificateHistory] Error:", err.message);
      setError(err.message || "Không thể tải lịch sử.");
    } finally {
      setLoading(false);
    }
  }, [contract, walletAddress]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
  const formatDate = (timestamp) => timestamp ? new Date(timestamp * 1000).toLocaleDateString() : "N/A";

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải lịch sử...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          📜 Lịch sử cấp chứng chỉ
        </h1>
        <p className="text-xl text-gray-600 mt-2">Tất cả chứng chỉ do trường bạn cấp</p>
      </div>

      {error && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-800">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            {error}
          </div>
        </div>
      )}

      {certificates.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-400 mb-6">
            <path d="M12 2v20M2 12h20"/>
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có chứng chỉ nào</h2>
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            Cấp chứng chỉ đầu tiên bằng trang Cấp chứng chỉ.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {certificates.map((cert, idx) => (
            <div key={cert.hash || cert.id || cert.certificateId || `cert-${idx}`} className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:border-indigo-300 transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4 mb-6">
                <div className="shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    cert.valid
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {cert.valid ? "Hợp lệ" : "Đã thu hồi"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-gray-900 truncate">{cert.studentName}</h3>
                  <p className="text-sm text-gray-600">{cert.universityName || "Trường của bạn"}</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Sinh viên</span>
                  <code className="text-sm font-mono">{formatAddress(cert.student)}</code>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">IPFS CID</span>
                  <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded truncate">{cert.cid}</code>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Ngày cấp</span>
                  <span className="text-sm font-medium">{formatDate(cert.timestamp)}</span>
                </div>
              </div>

              <a
                href={`${IPFS_GATEWAY}${cert.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all group-hover:scale-[1.02]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Xem tài liệu
              </a>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <button
          onClick={fetchCertificates}
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-8 rounded-xl transition-all border border-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Làm mới
        </button>
      </div>
    </div>
  );
};

export default CertificateHistory;