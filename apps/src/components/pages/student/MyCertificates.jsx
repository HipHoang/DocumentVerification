import { useState, useEffect, useCallback } from "react";
import { useContract } from "../../../hooks/useContract";
import { useAuth } from "../../../context/AuthContext";
import {
  getStudentCertificates,
  verifyCertificate,
  createShareToken,
  revokeShareToken,
  generateShareLink,
} from "../../../services/blockchain.service";
import {
  saveShareToken,
  markShareTokenRevoked,
  getShareTokensByWallet,
} from "../../../services/shareToken.service";
import { resolveUserDisplayName, formatWalletAddress } from "../../../services/messaging.service";
import CertificatePreview from "../common/CertificatePreview";

const MyCertificates = () => {
  const { walletAddress } = useAuth();
  const { contract } = useContract();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [issuerNames, setIssuerNames] = useState({}); // wallet -> resolved name

  // shareTokens: keyed by certHash, value = { shareToken, shareUrl, loading, error, success, revoked, revoking }
  const [shareTokens, setShareTokens] = useState({});
  const [tokensLoaded, setTokensLoaded] = useState(false);

  // Load existing share tokens from Firestore on mount
  const loadExistingTokens = useCallback(async () => {
    if (!walletAddress) {
      setTokensLoaded(true);
      return;
    }
    try {
      const tokens = await getShareTokensByWallet(walletAddress);
      const tokenMap = {};
      for (const t of tokens) {
        if (t.certHash && t.shareToken) {
          tokenMap[t.certHash] = {
            shareToken: t.shareToken,
            shareUrl: t.shareUrl || generateShareLink(t.shareToken),
            revoked: t.tokenRevoked === true,
            revoking: false,
            loading: false,
            error: "",
            success: "",
          };
        }
      }
      if (Object.keys(tokenMap).length > 0) {
        setShareTokens((prev) => ({ ...prev, ...tokenMap }));
      }
    } catch (err) {
      console.warn("[MyCertificates] Failed to load tokens from Firestore:", err);
    } finally {
      setTokensLoaded(true);
    }
  }, [walletAddress]);

  useEffect(() => {
    loadExistingTokens();
  }, [loadExistingTokens]);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!contract) return;
      if (!walletAddress || !String(walletAddress).trim()) {
        setCertificates([]);
        setError("Thiếu địa chỉ ví. Vui lòng kết nối ví.");
        return;
      }
      try {
        setLoading(true);
        setError("");
        const hashes = await getStudentCertificates(contract, walletAddress);
        const certs = [];
        const issuerWallets = new Set();
        for (const hash of hashes) {
          try {
            const data = await verifyCertificate(contract, hash);
            certs.push({ hash, ...data });
            if (data.issuer) {
              issuerWallets.add(data.issuer.toLowerCase());
            }
          } catch {
            // skip invalid
          }
        }
        setCertificates(certs);

        // Resolve issuer names
        if (issuerWallets.size > 0) {
          const nameMap = {};
          await Promise.all(
            Array.from(issuerWallets).map(async (issuer) => {
              try {
                const name = await resolveUserDisplayName(issuer);
                if (name) {
                  nameMap[issuer] = name;
                }
              } catch (err) {
                console.warn("[MyCertificates] Failed to resolve issuer name:", issuer, err);
              }
            })
          );
          setIssuerNames(nameMap);
        }
      } catch (err) {
        setError(err.message || "Không thể tải chứng chỉ.");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [contract, walletAddress]);

  const getTokenState = (certHash) => {
    return shareTokens[certHash] || {};
  };

  const updateTokenState = (certHash, partial) => {
    setShareTokens((prev) => ({
      ...prev,
      [certHash]: { ...prev[certHash], ...partial },
    }));
  };

  const handleCreateShareLink = async (certHash) => {
    if (getTokenState(certHash).loading || getTokenState(certHash).revoking) return;

    updateTokenState(certHash, {
      loading: true,
      error: "",
      success: "",
    });

    try {
      if (!contract) throw new Error("Hợp đồng không khả dụng. Vui lòng kết nối ví.");

      // If a token already exists in Firestore and is not revoked, reuse it
      const existingState = getTokenState(certHash);
      if (existingState.shareToken && !existingState.revoked) {
        updateTokenState(certHash, {
          loading: false,
          success: "Liên kết chia sẻ đã tồn tại!",
          error: "",
        });
        return;
      }

      const result = await createShareToken(contract, certHash);
      if (!result || !result.shareToken) throw new Error("Không thể tạo mã chia sẻ.");
      const shareUrl = generateShareLink(result.shareToken);

      // Persist to Firestore
      try {
        await saveShareToken({
          certHash,
          shareToken: result.shareToken,
          shareUrl,
          walletAddress,
        });
      } catch (fsErr) {
        console.warn("[MyCertificates] Failed to persist token to Firestore:", fsErr);
        // Continue anyway — UI will still show the token for this session
      }

      updateTokenState(certHash, {
        shareToken: result.shareToken,
        shareUrl,
        loading: false,
        success: "Liên kết chia sẻ đã được tạo thành công!",
        error: "",
        revoked: false,
        revoking: false,
      });
    } catch (err) {
      updateTokenState(certHash, {
        loading: false,
        error: err.message || "Không thể tạo liên kết chia sẻ.",
        success: "",
      });
    }
  };

  const handleRevokeShareToken = async (certHash) => {
    const state = getTokenState(certHash);
    if (!state.shareToken || state.revoking || state.revoked) return;

    updateTokenState(certHash, {
      revoking: true,
      error: "",
      success: "",
    });

    try {
      await revokeShareToken(contract, state.shareToken);

      // Persist revoke to Firestore
      try {
        await markShareTokenRevoked(certHash);
      } catch (fsErr) {
        console.warn("[MyCertificates] Failed to persist revoke to Firestore:", fsErr);
      }

      updateTokenState(certHash, {
        revoked: true,
        revoking: false,
        success: "Mã chia sẻ đã thu hồi thành công.",
        error: "",
      });
    } catch (err) {
      updateTokenState(certHash, {
        revoking: false,
        error: err.message || "Không thể thu hồi mã chia sẻ.",
        success: "",
      });
    }
  };

  const handleCopyShareLink = async (shareUrl, certHash) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      updateTokenState(certHash, { success: "Đã sao chép vào clipboard!" });
      setTimeout(() => {
        updateTokenState(certHash, (prev) => {
          if (prev.success === "Đã sao chép vào clipboard!") {
            return { success: "" };
          }
          return prev;
        });
      }, 2000);
    } catch {
      updateTokenState(certHash, { error: "Không thể sao chép vào clipboard." });
    }
  };

  const handleCopyToken = async (shareToken, certHash) => {
    try {
      await navigator.clipboard.writeText(shareToken);
      updateTokenState(certHash, { success: "Đã sao chép mã!" });
      setTimeout(() => {
        updateTokenState(certHash, (prev) => {
          if (prev.success === "Đã sao chép mã!") {
            return { success: "" };
          }
          return prev;
        });
      }, 2000);
    } catch {
      updateTokenState(certHash, { error: "Không thể sao chép mã." });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chứng chỉ của tôi</h1>
        <p className="text-gray-500 mt-1">Xem tất cả chứng chỉ đã được cấp hoặc nhận.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p className="text-gray-500">Không tìm thấy chứng chỉ.</p>
          <p className="text-gray-400 text-sm mt-1">Chứng chỉ sẽ xuất hiện ở đây sau khi được cấp.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert) => {
            const tokenState = getTokenState(cert.hash);
            const issuerWallet = cert.issuer?.toLowerCase();
            const issuerName = issuerNames[issuerWallet] || null;

            return (
              <div
                key={cert.hash}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  {/* Document preview */}
                  {cert.cid && (
                    <div className="mb-4">
                      <CertificatePreview cid={cert.cid} compact={true} />
                    </div>
                  )}

                  {/* Certificate info + actions row */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-gray-900">{cert.studentName}</h3>
                        {cert.valid ? (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            Hợp lệ
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            Đã thu hồi
                          </span>
                        )}
                      </div>

                      {/* Certificate metadata card */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2.5">
                        {/* Issuer info - Show name prominently */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
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
                              className="text-blue-600"
                            >
                              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                              <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 mb-0.5">Đơn vị cấp</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {issuerName || formatWalletAddress(cert.issuer)}
                            </p>
                            {issuerName && (
                              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                Địa chỉ ví: {formatWalletAddress(cert.issuer)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="h-px bg-gray-200" />

                        {/* Certificate details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Ngày cấp</p>
                            <p className="text-sm font-medium text-gray-700">
                              {new Date(cert.timestamp * 1000).toLocaleDateString("vi-VN", {
                                day: "numeric",
                                month: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-xs text-gray-500 mb-0.5">Mã giao dịch</p>
                            <p className="text-sm font-mono text-gray-500 truncate" title={cert.hash}>
                              {formatWalletAddress(cert.hash)}
                            </p>
                          </div>
                        </div>

                        {cert.cid && (
                          <>
                            <div className="h-px bg-gray-200" />
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Mã tài liệu (CID)</p>
                              <p className="text-xs font-mono text-gray-500 truncate">{cert.cid}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Share Token Section */}
                      {tokenState.shareToken && !tokenState.revoked && (
                        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-indigo-700">Mã chia sẻ:</span>
                            <span className="text-xs font-mono text-indigo-600 truncate">{tokenState.shareToken}</span>
                            <button
                              onClick={() => handleCopyToken(tokenState.shareToken, cert.hash)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 underline whitespace-nowrap"
                            >
                              Sao chép
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-indigo-700">URL chia sẻ:</span>
                            <span className="text-xs font-mono text-indigo-600 truncate">{tokenState.shareUrl}</span>
                            <button
                              onClick={() => handleCopyShareLink(tokenState.shareUrl, cert.hash)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 underline whitespace-nowrap"
                            >
                              Sao chép
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Revoked indicator */}
                      {tokenState.revoked && (
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-xs text-gray-500">
                            Mã chia sẻ đã bị thu hồi.
                            {tokenState.shareToken && (
                              <span className="ml-1 font-mono block mt-1 truncate">{tokenState.shareToken}</span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Success message */}
                      {tokenState.success && (
                        <div className="mt-3 p-2 bg-green-50 text-green-700 rounded-lg text-xs border border-green-200">
                          {tokenState.success}
                        </div>
                      )}

                      {/* Error message */}
                      {tokenState.error && (
                        <div className="mt-3 p-2 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
                          {tokenState.error}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:items-end">
                      {/* Create Share Link button */}
                      {(!tokenState.shareToken || tokenState.revoked) && (
                        <button
                          onClick={() => handleCreateShareLink(cert.hash)}
                          disabled={tokenState.loading || !cert.valid}
                          className="inline-flex items-center justify-center bg-green-50 text-green-700 hover:bg-green-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                        >
                          {tokenState.loading ? (
                            <>
                              <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-green-700 mr-2"></span>
                              Đang tạo...
                            </>
                          ) : (
                            "Tạo liên kết chia sẻ"
                          )}
                        </button>
                      )}

                      {/* Revoke Share Token button */}
                      {tokenState.shareToken && !tokenState.revoked && (
                        <button
                          onClick={() => handleRevokeShareToken(cert.hash)}
                          disabled={tokenState.revoking}
                          className="inline-flex items-center justify-center bg-red-50 text-red-700 hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                        >
                          {tokenState.revoking ? (
                            <>
                              <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-700 mr-2"></span>
                              Đang thu hồi...
                            </>
                          ) : (
                            "Thu hồi mã chia sẻ"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;