import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const shortenAddress = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");

const Header = () => {
  const { walletAddress, role, disconnectWallet, connectWallet } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const safeRole = role || "Guest";

  const handleLogout = () => {
    disconnectWallet();
    navigate("/");
  };

  const handleConnect = async () => {
    setError("");
    try {
      await connectWallet();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGetStarted = async () => {
    setError("");
    try {
      await connectWallet();
      navigate("/role-select");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".menu-btn")) setMobileMenuOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const navLinks = [
    { title: "Features", path: "#" },
    { title: "Integrations", path: "#" },
    { title: "Customers", path: "#" },
    { title: "Pricing", path: "#" },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white pb-3 md:pb-0 md:text-sm ${mobileMenuOpen ? "shadow-lg rounded-xl border mx-2 mt-2 md:shadow-none md:border-none md:mx-0 md:mt-0" : "border-b"}`}>
      <div className="gap-x-14 items-center max-w-7xl mx-auto px-4 md:flex md:px-8">
        <div className="flex items-center justify-between py-4 md:block">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">DocVerify</span>
          </div>

          <div className="md:hidden">
            <button className="menu-btn text-gray-500 hover:text-gray-800" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className={`flex-1 items-center mt-6 md:mt-0 md:flex ${mobileMenuOpen ? "block" : "hidden"}`}>
          <ul className="justify-center items-center space-y-6 md:flex md:space-x-6 md:space-y-0">
            {navLinks.map((item, idx) => (
              <li key={idx} className="text-gray-700 hover:text-gray-900">
                <a href={item.path}>{item.title}</a>
              </li>
            ))}
          </ul>

          <div className="flex-1 flex items-center justify-end mt-6 md:mt-0 gap-3">
            <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold uppercase">
              {safeRole}
            </span>

            {walletAddress ? (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-mono text-gray-700">{shortenAddress(walletAddress)}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={handleConnect} className="text-gray-700 hover:text-gray-900 font-medium">
                  Connect
                </button>
                <button
                  onClick={handleGetStarted}
                  className="flex items-center gap-x-1 py-2 px-4 text-white bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="absolute top-full right-4 mt-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 max-w-xs">
          {error}
        </div>
      )}
    </header>
  );
};

export default Header;
