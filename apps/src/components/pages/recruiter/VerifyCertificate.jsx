import { useState } from "react";
import { useContract } from "../../../hooks/useContract";
import { verifyDegree } from "../../../services/blockchain.service";

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

const VerifyCertificate = () => {
  const { contract } = useContract();
  const [file, setFile] = useState(null);
  const [hashInput, setHashInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setHashInput("");
      setError("");
      setResult(null);
    }
  };

  const handleVerify = async () => {
    setError("");
    setResult(null);

    try {
      if (!contract) {
        setError("Contract not initialized. Please connect your wallet.");
        return;
      }

      if (!hashInput.trim()) {
        setError("Please enter a degree hash.");
        return;
      }

      setLoading(true);
      const data = await verifyDegree(contract, hashInput.trim());

      if (!data.valid) {
        setResult({ valid: false });
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Verify Degree</h1>
        <p className="text-gray-500 mt-1">Enter a degree hash to verify its authenticity.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Degree Hash</label>
          <input
            type="text"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="0x..."
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg disabled:opacity-50 transition"
        >
          {loading ? "Verifying..." : "Verify Degree"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            {result.valid ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-green-100 text-green-600 p-1.5 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-green-700 font-semibold">Degree is valid!</p>
                </div>
                <div className="space-y-1.5 text-sm text-gray-700">
                  <p>
                    <strong className="text-gray-900">Student Name:</strong>{" "}
                    {result.studentName}
                  </p>
                  <p>
                    <strong className="text-gray-900">Degree Name:</strong>{" "}
                    {result.degreeName}
                  </p>
                  <p>
                    <strong className="text-gray-900">Student Address:</strong>{" "}
                    {formatAddress(result.student)}
                  </p>
                  <p>
                    <strong className="text-gray-900">Issuer:</strong>{" "}
                    {formatAddress(result.issuer)}
                  </p>
                  <p>
                    <strong className="text-gray-900">Issued On:</strong>{" "}
                    {new Date(result.timestamp * 1000).toLocaleDateString()}
                  </p>
                </div>
                {result.cid && (
                  <a
                    href={`${IPFS_GATEWAY}${result.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View document on IPFS
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="ml-1"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="bg-red-100 text-red-600 p-1.5 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <p className="text-red-600 font-semibold">
                  Degree not found or has been revoked.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyDegree;
