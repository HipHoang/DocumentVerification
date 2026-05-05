import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ROLES = [
  {
    key: "university",
    label: "University",
    description: "Issue and manage certificates",
    color: "bg-indigo-600 hover:bg-indigo-700",
    icon: "M22 10v6M2 10l10-5 10 5-10 5z",
  },
  {
    key: "student",
    label: "Student",
    description: "View and verify your certificates",
    color: "bg-green-600 hover:bg-green-700",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    key: "admin",
    label: "Admin",
    description: "Manage platform users",
    color: "bg-red-600 hover:bg-red-700",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
];

const RoleSelect = () => {
  // ✅ FIX START: Get setRole with safety check
  const auth = useAuth();
  const { setRole, role: currentRole } = auth || {};
  // ✅ FIX END
  
  const navigate = useNavigate();

  // Redirect if already has role
  useEffect(() => {
    if (currentRole) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentRole, navigate]);

  const selectRole = (roleObj) => {
    // ✅ FIX START: Safety check before calling setRole
    if (typeof setRole !== "function") {
      console.error("setRole is not available - AuthContext may not be initialized");
      // Still navigate even if setRole fails
      navigate("/dashboard");
      return;
    }
    // ✅ FIX END
    
    setRole(roleObj.key);
    // Navigate after setting role
    navigate("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-lg w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Your Role</h1>
          <p className="text-gray-500">Choose the role that matches your account</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => selectRole(r)}
              className={`${r.color} text-white p-5 rounded-xl text-left transition shadow-sm hover:shadow-md flex items-center gap-4`}
            >
              <div className="bg-white/20 p-2.5 rounded-lg">
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
                  <path d={r.icon} />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{r.label}</h3>
                <p className="text-white/80 text-sm">{r.description}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          After selecting a role, navigate using the sidebar.
        </p>
      </div>
    </div>
  );
};

export default RoleSelect;