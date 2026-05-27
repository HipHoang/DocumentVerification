import { useMemo, useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useContract } from "../../../hooks/useContract";
import {
  verifyCertificate,
  verifyByShareToken,
} from "../../../services/blockchain.service";
import CertificatePreview from "../common/CertificatePreview";

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

const isBytes32 = (v) => /^0x[0-9a-fA-F]{64}$/.test(v?.trim());

const VerifyCertificate = () => {
  const { contract, isLoading: contractLoading, error: contractError } = useContract();
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <ManualVerifyForm
        contract={contract}
        contractLoading={contractLoading}
        contractError={contractError}
      />
    </div>
  );
};

export default VerifyCertificate;

const ManualVerifyForm = ({ contract, contractLoading, contractError }) => {
  const [hashInput, setHashInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [verifyMode, setVerifyMode] = useState(null);
  const inputRef = useRef(null);
  const location = useLocation();
  const autoVerifiedRef = useRef(false);

  useEffect(() => {
    if (autoVerifiedRef.current) return;

    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get("token");
    if (!tokenFromUrl || !contract) return;

    autoVerifiedRef.current = true;
    setHashInput(tokenFromUrl);

    runVerification(contract, tokenFromUrl);
  }, [contract]);

  const runVerification = async (verificationContract, token) => {
    if (!token || !verificationContract) return;

    setLoading(true);
    setError("");
    setResult(null);
    setVerifyMode(null);

    try {
      const input = token.trim();
      const isB32 = /^0x[0-9a-fA-F]{64}$/.test(input);

      if (isB32) {
        try {
          const data = await verifyCertificate(verificationContract, input);
          if (data?.valid) {
            setResult({ ...data, mode: "hash" });
            setVerifyMode("hash");
            return;
          }
        } catch {
        }

        try {
          const data = await verifyByShareToken(verificationContract, input);
          setResult({ ...data, mode: "token" });
          setVerifyMode("token");
          return;
        } catch {
          setError("Không tìm thấy chứng chỉ hoặc mã chia sẻ không hợp lệ.");
        }
      } else {
        try {
          const data = await verifyCertificate(verificationContract, input);
          if (data?.valid) {
            setResult({ ...data, mode: "hash" });
            setVerifyMode("hash");
          } else {
            setError("Không tìm thấy chứng chỉ hoặc chứng chỉ đã bị thu hồi.");
          }
        } catch (err) {
          setError(err.message || "Xác minh thất bại. Vui lòng kiểm tra lại dữ liệu nhập.");
        }
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi không mong muốn.");
    } finally {
      setLoading(false);
    }
  };

  const rpcAvailable = useMemo(() => {
    return !!import.meta.env?.VITE_RPC_URL;
  }, []);

  const getRpcError = () => {
    if (!rpcAvailable) {
      return "Dịch vụ xác minh chưa được cấu hình. Vui lòng thêm VITE_RPC_URL vào file .env.";
    }
    if (contractError) {
      return `Không thể kết nối blockchain: ${contractError}`;
    }
    return null;
  };

  const handleVerifySmart = async () => {
    setError("");
    setResult(null);
    setVerifyMode(null);

    if (contractLoading) {
      setError("Đang kết nối blockchain, vui lòng thử lại...");
      return;
    }

    if (!contract) {
      const rpcErr = getRpcError();
      setError(rpcErr || "Không thể kết nối blockchain RPC.");
      return;
    }

    const input = hashInput.trim();
    if (!input) {
      setError("Vui lòng nhập mã băm chứng chỉ hoặc mã chia sẻ.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const isB32 = isBytes32(input);

      if (isB32) {
        try {
          const data = await verifyCertificate(contract, input);
          if (data?.valid) {
            setResult({ ...data, mode: "hash" });
            setVerifyMode("hash");
            return;
          }
        } catch {
        }

        try {
          const data = await verifyByShareToken(contract, input);
          setResult({ ...data, mode: "token" });
          setVerifyMode("token");
          return;
        } catch {
          setError("Không tìm thấy chứng chỉ hoặc mã chia sẻ không hợp lệ.");
        }
      } else {
        try {
          const data = await verifyCertificate(contract, input);
          if (data?.valid) {
            setResult({ ...data, mode: "hash" });
            setVerifyMode("hash");
          } else {
            setError("Không tìm thấy chứng chỉ hoặc chứng chỉ đã bị thu hồi.");
          }
        } catch (err) {
          setError(err.message || "Xác minh thất bại. Vui lòng kiểm tra lại dữ liệu nhập.");
        }
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi không mong muốn.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleVerifySmart();
    }
  };

  const formatAddress = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");

  const isTokenMode = verifyMode === "token";

  const resetForm = () => {
    setHashInput("");
    setResult(null);
    setError("");
    setVerifyMode(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 lg:py-16">
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full mb-5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-700">Xác minh công khai</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Cổng xác minh chứng chỉ
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
          Nhập mã băm chứng chỉ hoặc mã chia sẻ để kiểm tra tính xác thực trên blockchain.
          Không cần kết nối ví.
        </p>
      </div>

      {!rpcAvailable && !contractLoading && (
        <div className="mb-6 animate-fade-in-up">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Lỗi cấu hình</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Thiếu VITE_RPC_URL cho public verification. 
                Vui lòng thêm RPC URL vào file <code className="bg-amber-100 px-1 rounded text-[11px]">apps/.env</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {contractLoading && (
        <div className="mb-6 animate-fade-in-up">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
            <span className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
            <div>
              <p className="text-sm font-medium text-blue-800">Đang kết nối blockchain...</p>
              <p className="text-xs text-blue-600 mt-0.5">Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full border border-slate-200 rounded-xl px-10 py-3.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition bg-slate-50/50 placeholder:text-slate-400"
                placeholder="Nhập mã băm (0x...) hoặc mã chia sẻ"
              />
              {hashInput && (
                <button
                  onClick={resetForm}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={handleVerifySmart}
              disabled={loading || contractLoading}
              className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3.5 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Đang xác minh...
                </>
              ) : contractLoading ? (
                "Đang kết nối..."
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Xác minh
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Hệ thống tự động phát hiện: mã chia sẻ (share token) hoặc mã băm chứng chỉ (certificate hash).
          </p>

          {error && (
            <div className="mt-5 animate-fade-in">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Xác minh thất bại</p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {result && !error && (
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className={`mb-6 p-5 rounded-2xl border flex items-start gap-4 ${
            result.valid
              ? "bg-emerald-50 border-emerald-200"
              : "bg-red-50 border-red-200"
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              result.valid ? "bg-emerald-100" : "bg-red-100"
            }`}>
              {result.valid ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className={`text-lg font-bold ${
                  result.valid ? "text-emerald-800" : "text-red-800"
                }`}>
                  {result.valid ? "Chứng chỉ hợp lệ" : "Chứng chỉ đã bị thu hồi"}
                </h3>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  verifyMode === "hash"
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : "bg-purple-100 text-purple-700 border-purple-200"
                }`}>
                  {verifyMode === "hash" ? "Xác minh hash" : "Mã chia sẻ"}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                result.valid ? "text-emerald-600" : "text-red-600"
              }`}>
                Chứng chỉ này đã được xác thực trên mạng blockchain Ethereum Sepolia
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h4 className="font-semibold text-slate-900">Xem trước chứng chỉ</h4>
                </div>
                <div className="p-5">
                  {result.cid ? (
                    <CertificatePreview cid={result.cid} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <p className="text-sm">Không có tài liệu đính kèm</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h4 className="font-semibold text-slate-900">Thông tin chứng chỉ</h4>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Trạng thái</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                      result.valid
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-red-50 border-red-200"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${result.valid ? "bg-emerald-500" : "bg-red-500"}`} />
                      <span className={`text-xs font-semibold ${result.valid ? "text-emerald-700" : "text-red-700"}`}>
                        {result.valid ? "Đã xác thực" : "Đã thu hồi"}
                      </span>
                    </div>
                  </div>

                  {result.studentName && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tên sinh viên</p>
                      <p className="text-sm font-semibold text-slate-900">{result.studentName}</p>
                    </div>
                  )}

                  {result.universityName && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Trường cấp</p>
                      <p className="text-sm font-semibold text-slate-900">{result.universityName}</p>
                    </div>
                  )}

                  {result.issuer && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Người cấp</p>
                      <p className="text-xs font-mono text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-100">
                        {formatAddress(result.issuer)}
                      </p>
                    </div>
                  )}

                  {result.timestamp && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Ngày cấp</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(result.timestamp * 1000).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}

                  {isTokenMode && result.tokenRevoked !== undefined && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Trạng thái mã</p>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        result.tokenRevoked
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {result.tokenRevoked ? "Đã thu hồi" : "Còn hiệu lực"}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Blockchain</p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-indigo-50 rounded-lg p-2.5 border border-indigo-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 shrink-0">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                        <line x1="6" y1="6" x2="6.01" y2="6" />
                        <line x1="6" y1="18" x2="6.01" y2="18" />
                      </svg>
                      <span>Ethereum Sepolia</span>
                    </div>
                  </div>

                  {result.cid && (
                    <div className="pt-2">
                      <a
                        href={`${IPFS_GATEWAY}${result.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-2 w-full justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Xem trên IPFS
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={resetForm}
                className="mt-4 w-full text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-3 transition-all"
              >
                Xác minh chứng chỉ khác
              </button>
            </div>
          </div>
        </div>
      )}

      {!result && !error && !contractLoading && (
        <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Chưa tìm thấy chứng chỉ</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            Nhập mã băm hoặc mã chia sẻ ở trên để bắt đầu xác minh.
          </p>
        </div>
      )}
    </div>
  );
};