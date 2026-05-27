import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContract } from '../../../hooks/useContract';
import { verifyByShareToken } from '../../../services/blockchain.service';
import CertificatePreview from './CertificatePreview';

/**
 * Loading spinner component (inline to avoid missing import)
 */
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center gap-3">
    <div className="animate-spin w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full" />
    <p className="text-sm text-gray-500">Đang tải chứng chỉ...</p>
  </div>
);

const SharedCertificateViewer = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { contract, isLoading: contractLoading, error: contractError } = useContract();
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!token) {
        setError('Không tìm thấy token chứng chỉ.');
        setLoading(false);
        return;
      }

      // Wait for contract to initialize
      if (contractLoading) {
        return;
      }

      if (!contract) {
        setError(contractError || 'Không thể kết nối blockchain. Vui lòng thử lại sau.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Use the SAME verifyByShareToken that VerifyCertificate uses successfully
        const data = await verifyByShareToken(contract, token);
        if (data && data.valid) {
          setCertificateData({
            studentName: data.studentName,
            universityName: data.universityName,
            cid: data.cid,
            issuer: data.issuer,
            valid: data.valid,
            timestamp: data.timestamp,
            issueDate: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : null,
            certHash: token,
            tokenRevoked: data.tokenRevoked,
          });
        } else if (data && !data.valid) {
          setError('Chứng chỉ này đã bị thu hồi hoặc không còn hiệu lực.');
        } else {
          setError('Chứng chỉ không tồn tại hoặc token không hợp lệ.');
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError(err.message || 'Không thể tải chứng chỉ. Vui lòng kiểm tra lại đường dẫn.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [token, contract, contractLoading, contractError, navigate]);

  if (loading || contractLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Không thể xác thực</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!certificateData && !loading && !contractLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Chứng chỉ không khả dụng</h2>
          <p className="text-sm text-gray-500 mb-6">Chứng chỉ có thể không tồn tại hoặc đã bị thu hồi.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200/60">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-linear-to-br from-indigo-600 to-indigo-700 text-white p-2 rounded-xl shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900">DocVerify</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Trang chủ
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
        {/* Verification success banner */}
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Xác thực Blockchain thành công</p>
            <p className="text-xs text-emerald-600 mt-0.5">Chứng chỉ này đã được xác thực trên mạng Ethereum Sepolia</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content - Certificate Preview */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h1 className="text-lg font-bold text-gray-900">Chứng chỉ số</h1>
                <p className="text-sm text-gray-500 mt-1">Xem trước chứng chỉ được xác thực trên blockchain</p>
              </div>
              <div className="p-5">
                <CertificatePreview cid={certificateData.cid} />
              </div>
            </div>
          </div>

          {/* Sidebar - Verification Details */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Thông tin xác thực</h2>
              </div>
              <div className="p-5 space-y-5">
                {/* Status */}
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Trạng thái</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-700">Đã xác thực</span>
                  </div>
                </div>

                {/* Student Name */}
                {certificateData.studentName && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Tên sinh viên</p>
                    <p className="text-sm font-semibold text-gray-900">{certificateData.studentName}</p>
                  </div>
                )}

                {/* Issuer */}
                {certificateData.universityName && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Đơn vị cấp</p>
                    <p className="text-sm font-semibold text-gray-900">{certificateData.universityName}</p>
                  </div>
                )}

                {/* Issue Date */}
                {certificateData.issueDate && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Ngày cấp</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(certificateData.issueDate).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {/* Certificate ID */}
                {certificateData.certHash && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Mã chứng chỉ</p>
                    <p className="text-xs font-mono text-gray-600 break-all bg-gray-50 rounded-lg p-2 border border-gray-100">
                      {certificateData.certHash}
                    </p>
                  </div>
                )}

                {/* Blockchain Info */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Blockchain</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-indigo-50 rounded-lg p-2.5 border border-indigo-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 shrink-0">
                      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                      <line x1="6" y1="6" x2="6.01" y2="6" />
                      <line x1="6" y1="18" x2="6.01" y2="18" />
                    </svg>
                    <span>Ethereum Sepolia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedCertificateViewer;