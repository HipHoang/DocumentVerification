import { useAuth } from "../../../context/AuthContext";

const Home = () => {
  const { walletAddress, role, connectWallet } = useAuth();

  console.log("Home wallet:", walletAddress);
  console.log("Home role:", role);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!walletAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md w-full px-6">
          <div className="bg-indigo-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Document Verification DApp</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Secure document verification and certificate issuance powered by Ethereum and IPFS.
          </p>
          <button
            onClick={handleConnect}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200"
          >
            Connect Wallet
          </button>
          <p className="text-xs text-gray-400 mt-4">
            MetaMask or any EVM-compatible wallet required
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center max-w-md w-full px-6">
        <div className="bg-green-100 text-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Wallet Connected</h1>
        <p className="text-gray-500 mb-2">Your wallet is successfully connected.</p>
        <p className="text-sm font-mono text-gray-400">{walletAddress}</p>
        <p className="text-sm text-gray-500 mt-4">Select a role from the sidebar to continue.</p>
      </div>
    </div>
  );
};

export default Home;

