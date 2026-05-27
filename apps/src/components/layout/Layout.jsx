import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import SideBar from "./SideBar";
import Footer from "./Footer";
import FloatingAIChat from "../ai/FloatingAIChat";
import { useAuth } from "../../context/AuthContext";

const Layout = () => {
  const { userConnected } = useAuth();
  const location = useLocation();
  const isMessagesRoute = location.pathname === "/messages";

  return (
    <div className="min-h-screen bg-gray-50/80">
      <Header />
      <SideBar />
      {/* Content wrapper: offset by sidebar width + header height */}
      <div className="ml-64 pt-16 min-h-screen flex flex-col transition-all duration-200">
        <main className={`flex-1 pb-24 ${isMessagesRoute ? "p-0" : "p-6 lg:p-8"}`}>
          {isMessagesRoute ? (
            <Outlet />
          ) : (
            <div className="max-w-6xl mx-auto animate-fade-in">
              <Outlet />
            </div>
          )}
        </main>
        <Footer />
      </div>

      {/* Floating AI Chat - only for authenticated users */}
      {userConnected && <FloatingAIChat />}
    </div>
  );
};

export default Layout;
