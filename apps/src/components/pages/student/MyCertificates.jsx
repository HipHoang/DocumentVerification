import { useState, useEffect } from "react";
import { useContract } from "../../hooks/useContract";
import { useAuth } from "../../context/AuthContext";
import { getStudentCertificates, verifyCertificate } from "../../services/blockchain.service";

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

const MyCertificates = () => {
  const { walletAddress } = useAuth();
  const { contract } = useContract();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!contract || !walletAddress) return;
      try {
        setLoading(true);
        const hashes = await getStudentCertificates(contract, walletAddress);
        const certs = [];
        for (const hash of hashes) {
          try {
            const data = await verifyCertificate(contract, hash);
            certs.push({ hash, ...data });
          } catch {
            // skip invalid
          }
        }
        setCertificates(certs);
      } catch (err) {
        setError(err.message || "Failed to fetch certificates.");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [contract, walletAddress]);

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-500 mt-1">View all your issued or received certificates.</p>
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
          <p className="text-gray-500">No certificates found.</p>
          <p className="text-gray-400 text-sm mt-1">Certificates will appear here once issued.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert) => (
            <div
              key={cert.hash}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{cert.studentName}</h3>
                  {cert.valid ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Valid
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Revoked
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <p className="font-mono truncate">Hash: {cert.hash}</p>
                  <p className="font-mono truncate">CID: {cert.cid}</p>
                  <p>Issuer: {formatAddress(cert.issuer)}</p>
                  <p>Issued: {new Date(cert.timestamp * 1000).toLocaleDateString()}</p>
                </div>
              </div>
              <a
                href={`${IPFS_GATEWAY}${cert.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
              >
                View on IPFS
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;

