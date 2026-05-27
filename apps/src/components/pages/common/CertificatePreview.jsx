import { useState, useEffect, useRef } from "react";

const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
];

export const generateIpfsUrl = (cid) => {
  if (!cid) return "";
  if (cid.startsWith("http://") || cid.startsWith("https://")) return cid;
  return `${IPFS_GATEWAYS[0]}${cid}`;
};

async function detectFileType(cid) {
  const url = generateIpfsUrl(cid);
  
  const ext = (url.split(".").pop() || "").toLowerCase();
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "ico"];
  const pdfExt = "pdf";
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    const contentType = response.headers.get("content-type") || "";
    if (contentType.startsWith("image/")) return "image";
    if (contentType.includes("pdf")) return "pdf";
    if (response.ok) {
      if (imageExts.includes(ext)) return "image";
      if (ext === pdfExt) return "pdf";
      return "unknown";
    }
  } catch {
    // fall through
  }

  if (imageExts.includes(ext)) return "image";
  if (ext === pdfExt) return "pdf";
  return "unknown";
}

/* ===================================================================
   FULLSCREEN VIEWER MODAL — Clean, no double scrollbars
   =================================================================== */
const FullscreenModal = ({ cid, url, isImage, onClose }) => {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = cid.split("/").pop() || "certificate";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const handleOpenTab = () => {
    window.open(url, "_blank");
  };

  const handlePrint = () => {
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 md:p-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-gray-500 truncate max-w-[160px] md:max-w-[280px]">
              {cid.split("/")[0]}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="In"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span className="hidden md:inline">In</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
              title="Tải xuống"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="hidden md:inline">Tải xuống</span>
            </button>
            <button
              onClick={handleOpenTab}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              title="Mở tab mới"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span className="hidden md:inline">Mở tab</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition ml-1"
              title="Đóng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - single scroll container, no nested scrollbars */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
          {isImage ? (
            <img
              src={url}
              alt="Certificate"
              className="w-full h-full object-contain p-2"
              style={{ maxHeight: "calc(95vh - 60px)" }}
            />
          ) : (
            <iframe
              src={url}
              title="Certificate preview"
              className="w-full border-0"
              style={{ height: "calc(95vh - 60px)" }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ===================================================================
   CERTIFICATE PREVIEW COMPONENT
   =================================================================== */
const CertificatePreview = ({ cid, compact = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [fileType, setFileType] = useState("loading");

  const cancelledRef = useRef(false);

  if (!cid) return null;

  const url = generateIpfsUrl(cid);
  const isImage = fileType === "image";
  const isPdf = fileType === "pdf";

  useEffect(() => {
    cancelledRef.current = false;
    setFileType("loading");
    setImgError(false);

    detectFileType(cid).then((type) => {
      if (!cancelledRef.current) {
        setFileType(type);
      }
    });

    return () => {
      cancelledRef.current = true;
    };
  }, [cid]);

  const handleDownload = (e) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = url;
    a.download = cid.split("/").pop() || "certificate";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const handleOpenTab = (e) => {
    e.stopPropagation();
    window.open(url, "_blank");
  };

  const handlePrint = (e) => {
    e.stopPropagation();
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    }
  };

  const ActionButtons = () => (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Xem đầy đủ
      </button>
      <button
        onClick={handleDownload}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Tải xuống
      </button>
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        In
      </button>
      <button
        onClick={handleOpenTab}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Mở tab
      </button>
    </div>
  );

  // LOADING state
  if (fileType === "loading") {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-6 card">
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mb-3" />
          <p className="text-sm">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  // IMAGE preview
  if (isImage) {
    return (
      <>
        <div className={`bg-white border border-gray-100 rounded-xl ${compact ? "p-3" : "p-4"} card overflow-hidden`}>
          {imgError ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-sm mb-4">Không thể tải xem trước</p>
              <ActionButtons />
            </div>
          ) : (
            <>
              <div
                className="relative rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer group"
                style={{ maxHeight: compact ? "200px" : "420px" }}
                onClick={() => setShowModal(true)}
              >
                <img
                  src={url}
                  alt="Certificate preview"
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  onError={() => setImgError(true)}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg" />
              </div>
              <div className="mt-3 flex justify-start no-print">
                <ActionButtons />
              </div>
            </>
          )}
        </div>
        {showModal && (
          <FullscreenModal cid={cid} url={url} isImage={true} onClose={() => setShowModal(false)} />
        )}
      </>
    );
  }

  // PDF preview — no double scrollbars
  if (isPdf) {
    const previewHeight = compact ? "320px" : "520px";
    return (
      <>
        <div className={`bg-white border border-gray-100 rounded-xl ${compact ? "p-3" : "p-4"} card overflow-hidden`}>
          <div
            className="rounded-lg overflow-hidden bg-gray-50"
            style={{ height: previewHeight, position: "relative" }}
          >
            <iframe
              src={url}
              title="Certificate PDF"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms"
              style={{ overflow: "hidden" }}
            />
          </div>
          <div className="mt-3 flex justify-start no-print">
            <ActionButtons />
          </div>
        </div>
        {showModal && (
          <FullscreenModal cid={cid} url={url} isImage={false} onClose={() => setShowModal(false)} />
        )}
      </>
    );
  }

  // Unknown type
  return (
    <>
      <div className="bg-white border border-gray-100 rounded-xl p-4 card">
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-gray-300">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="text-sm text-gray-500 mb-1">Chứng chỉ số</p>
          <p className="text-xs text-gray-400 mb-4">Nhấn "Xem đầy đủ" để mở</p>
          <ActionButtons />
        </div>
      </div>
      {showModal && (
        <FullscreenModal cid={cid} url={url} isImage={false} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default CertificatePreview;