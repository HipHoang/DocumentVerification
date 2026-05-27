import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const shortenAddress = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");


const roleLabelMap = {
  admin: "Quản trị viên",
  university: "Đại học",
  student: "Sinh viên",
  verified_student: "Sinh viên",
  pending_student: "Chờ xác minh",
  public: "Công khai",
};

const roleBadgeColorMap = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  university: "bg-blue-100 text-blue-700 border-blue-200",
  student: "bg-emerald-100 text-emerald-700 border-emerald-200",
  verified_student: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending_student: "bg-amber-100 text-amber-700 border-amber-200",
  public: "bg-gray-100 text-gray-600 border-gray-200",
};

const getDisplayName = ({ role, userName, walletAddress }) => {
  const name = (userName || "").trim();
  if (name) return name;
  const safeRole = role || "public";
  return roleLabelMap[safeRole] || "Người dùng";
};

const Header = () => {
  const {
    walletAddress,
    role,
    disconnectWallet,
    connectWallet,
    userName,
    effectiveRole,
  } = useAuth();

  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Track scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const safeRole = effectiveRole || role || "public";

  const roleLabel = useMemo(() => roleLabelMap[safeRole] || safeRole, [safeRole]);
  const roleBadgeColor = useMemo(() => roleBadgeColorMap[safeRole] || "bg-gray-100 text-gray-600", [safeRole]);
  const displayName = useMemo(() => getDisplayName({ role: safeRole, userName, walletAddress }), [safeRole, userName, walletAddress]);

  const handleLogout = () => {
    setProfileOpen(false);
    disconnectWallet();
    navigate("/");
  };

  const handleConnect = async () => {
    setError("");
    try {
      await connectWallet();
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  const handleGetStarted = async () => {
    setError("");
    try {
      await connectWallet();
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || String(err));
    }
  };

  // Click outside handler for profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!profileOpen) return;
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };

    const handleKey = (e) => {
      if (e.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [profileOpen]);

  // Mobile menu outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".menu-btn")) setMobileMenuOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-strong shadow-sm"
          : "glass"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 group"
              aria-label="Go to home"
            >
              <div className="relative">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-2 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
              </div>
              <span className="text-lg font-bold tracking-tight text-gray-900">
                DocVerify
              </span>
            </button>

            {walletAddress && (
              <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadgeColor}`}>
                {roleLabel}
              </span>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {walletAddress ? (
              <div className="relative" ref={profileRef}>
                {/* Profile trigger — div wrapper prevents nested button issues */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setProfileOpen((v) => !v)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setProfileOpen((v) => !v); } }}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-gray-200/60 bg-white/60 hover:bg-white/80 transition-all duration-200 hover:shadow-sm cursor-pointer select-none"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <span className="relative flex items-center justify-center shrink-0">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                      {displayName?.[0]?.toUpperCase() || "U"}
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                  </span>

                  <span className="hidden md:flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold text-gray-900">{displayName}</span>
                    <span className="text-[10px] text-gray-500">{shortenAddress(walletAddress)}</span>
                  </span>

                  {/* Messages shortcut — span avoids nested button error */}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileOpen(false);
                      navigate("/messages");
                    }}
                    className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 transition-colors cursor-pointer"
                    title="Tin nhắn"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setProfileOpen(false); navigate("/messages"); } }}
                  >
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
                      className="text-gray-500"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${profileOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200/60 bg-white/95 backdrop-blur shadow-lg shadow-gray-200/50 overflow-hidden animate-scale-in"
                  >
                    {/* Profile header */}
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                          {displayName?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">{displayName}</div>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleBadgeColor}`}>
                              {roleLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 p-2.5 bg-white rounded-xl border border-gray-100">
                        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Wallet</div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-mono text-gray-700 truncate">{walletAddress}</div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(walletAddress);
                              } catch (e) {
                                // silent
                              }
                            }}
                            className="shrink-0 px-2.5 py-1 text-[10px] font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
                          >
                            Sao chép
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/dashboard");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Bảng điều khiển
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/messages");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Tin nhắn
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 p-1.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={handleConnect}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white/70 border border-gray-200/70 rounded-2xl hover:bg-white hover:border-gray-300 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Kết nối
                </button>

                <button
                  onClick={handleGetStarted}
                  className="py-2 px-5 text-sm font-medium text-white bg-gradient-to-br from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 rounded-2xl transition-all shadow-sm hover:shadow-md"
                >
                  Bắt đầu
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                className="menu-btn p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className={`md:hidden transition-all duration-200 overflow-hidden ${mobileMenuOpen ? "max-h-64 opacity-100 pb-4" : "max-h-0 opacity-0"}`}>
          <div className="rounded-2xl border border-gray-200/60 bg-white/90 backdrop-blur shadow-sm">
            {walletAddress ? (
              <div className="p-3 space-y-1">
                <div className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 mb-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
                    {displayName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{displayName}</div>
                    <div className="text-xs text-gray-500 font-mono">{shortenAddress(walletAddress)}</div>
                  </div>
                </div>
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Bảng điều khiển
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate("/messages"); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Tin nhắn
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                <button
                  type="button"
                  onClick={handleConnect}
                  className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-2xl text-sm font-medium transition-colors"
                >
                  Kết nối
                </button>
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-br from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white px-4 py-3 rounded-2xl text-sm font-medium transition-colors"
                >
                  Bắt đầu
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error toast */}
        {error && (
          <div className="pb-3">
            <div className="relative max-w-2xl mx-auto px-4">
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 animate-fade-in">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;