import Header from "./Header";
import SideBar from "./SideBar";
import Footer from "./Footer";
import { useAuth } from "../../context/AuthContext";

const Layout = ({ children }) => {
  const { walletAddress, role } = useAuth();
  const safeRole = role || "Guest";
  const shortenAddress = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Not connected");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SideBar />
      <main className="pt-16 min-h-screen ml-64 p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
      <Footer />

      <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-xs font-mono rounded-lg p-3 shadow-lg z-50 opacity-90 hover:opacity-100 transition">
        <div className="space-y-1">
          <p>
            <span className="text-gray-400">Wallet:</span> {shortenAddress(walletAddress)}
          </p>
          <p>
            <span className="text-gray-400">Role:</span> {safeRole}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Layout;
