import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { role, walletAddress } = useAuth();
  const navigate = useNavigate();

  const getRoleConfig = () => {
    switch (role) {
      case "university":
        return {
          title: "University Dashboard",
          description: "Issue and manage academic certificates on the blockchain.",
          actions: [
            {
              title: "Issue Certificate",
              description: "Upload and issue a new certificate to a student.",
              path: "/issue",
              color: "bg-indigo-600 hover:bg-indigo-700",
              icon: "M12 4v16m8-8H4",
            },
            {
              title: "My Certificates",
              description: "View all certificates you have issued.",
              path: "/my-certificates",
              color: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
              icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            },
          ],
        };
      case "student":
        return {
          title: "Student Dashboard",
          description: "View your certificates and verify their authenticity.",
          actions: [
            {
              title: "My Certificates",
              description: "View all certificates issued to your wallet.",
              path: "/my-certificates",
              color: "bg-indigo-600 hover:bg-indigo-700",
              icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            },
            {
              title: "Verify Certificate",
              description: "Verify the authenticity of any certificate.",
              path: "/verify",
              color: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            },
          ],
        };
      case "admin":
        return {
          title: "Admin Dashboard",
          description: "Manage universities and employers on the platform.",
          actions: [
            {
              title: "Manage Users",
              description: "Add universities and employers to the whitelist.",
              path: "/manage",
              color: "bg-indigo-600 hover:bg-indigo-700",
              icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
            },
          ],
        };
      default:
        return { title: "Dashboard", description: "", actions: [] };
    }
  };

  const config = getRoleConfig();
  const shortenAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
        <p className="text-gray-500 mt-1">{config.description}</p>
        <p className="text-xs text-gray-400 font-mono mt-2">{shortenAddress(walletAddress)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.actions.map((action) => (
          <button
            key={action.title}
            onClick={() => navigate(action.path)}
            className={`${action.color} p-6 rounded-xl text-left transition shadow-sm hover:shadow-md`}
          >
            <div className="flex items-start justify-between mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={action.icon} />
              </svg>
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
                className="opacity-50"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-base mb-1">{action.title}</h3>
            <p className="text-sm opacity-80">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

