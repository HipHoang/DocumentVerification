import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useContract } from "../hooks/useContract";
import { getUserInfo } from "../services/blockchain.service";
import { getStudentByWallet } from "../services/student.service";


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { contract, address, isLoading: contractLoading, refresh } = useContract();

  const [authState, setAuthState] = useState({
    walletAddress: "",
    role: "public",
    userName: "",
    // Firebase student state
    studentEmail: "",
    studentUniversityId: "",
    emailVerified: null,
    isInitialized: false,
  });

  const [userConnected, setUserConnected] = useState(false);
  const lastCheckedAddress = useRef(null);

  const detectAndSync = useCallback(async (currentContract, currentAddress) => {
    if (!currentAddress) {
      localStorage.clear();
      lastCheckedAddress.current = null;
      setUserConnected(false);
      setAuthState({
        walletAddress: "",
        role: "public",
        userName: "",
        studentEmail: "",
        studentUniversityId: "",
        emailVerified: null,
        isInitialized: true,
      });
      return;
    }

    if (currentAddress === lastCheckedAddress.current) {
      setAuthState((prev) => ({ ...prev, isInitialized: true }));
      return;
    }

    try {
      // 1) Blockchain priority: admin/university/student(has certificates)
      const userInfo = await getUserInfo(currentContract, currentAddress);

      const chainRole = userInfo.role || "public";
      if (chainRole === "admin" || chainRole === "university") {
        lastCheckedAddress.current = currentAddress;
        setAuthState({
          walletAddress: currentAddress,
          role: chainRole,
          userName: userInfo.name || "",
          studentEmail: "",
          studentUniversityId: "",
          emailVerified: null,
          isInitialized: true,
        });
        return;
      }

      // 2) Students must come from Firebase (pending_student / verified_student)
      const studentProfile = await getStudentByWallet(currentAddress);
      let mergedRole = "public";
      let studentEmail = "";
      let studentUniversityId = "";
      let emailVerified = null;

      const firebaseEmail =
        studentProfile?.studentEmail ?? studentProfile?.email ?? "";
      const firebaseUniversityId =
        studentProfile?.universityWallet ?? studentProfile?.universityId ?? "";
      const firebaseEmailVerified =
        studentProfile?.emailVerified ?? null;

      let studentFullName = "";

      if (studentProfile?.status === "pending") {
        mergedRole = "pending_student";
        studentEmail = firebaseEmail;
        studentUniversityId = firebaseUniversityId;
        emailVerified = firebaseEmailVerified;
        studentFullName = studentProfile.fullName || "";
      } else if (studentProfile?.status === "verified") {
        mergedRole = "verified_student";
        studentEmail = firebaseEmail;
        studentUniversityId = firebaseUniversityId;
        emailVerified = firebaseEmailVerified;
        studentFullName = studentProfile.fullName || "";
      } else {
        mergedRole = "public";
      }

      if (mergedRole === "public" && chainRole === "student") {
        if (!studentProfile) {
          mergedRole = "student";
        }
      }

      lastCheckedAddress.current = currentAddress;
      setAuthState({
        walletAddress: currentAddress,
        role: mergedRole,
        userName: studentFullName || userInfo.name || "",
        studentEmail,
        studentUniversityId,
        emailVerified,
        isInitialized: true,
      });

      // Auto-restore connected state if wallet was previously connected
      const wasConnected = localStorage.getItem("walletConnected") === "true";
      if (wasConnected) {
        setUserConnected(true);
      }
    } catch {
      lastCheckedAddress.current = currentAddress;
      setAuthState({
        walletAddress: currentAddress,
        role: "public",
        userName: "",
        studentEmail: "",
        studentUniversityId: "",
        emailVerified: null,
        isInitialized: true,
      });

      // Even on error, restore connected state if previously connected
      const wasConnected = localStorage.getItem("walletConnected") === "true";
      if (wasConnected) {
        setUserConnected(true);
      }
    }

  }, []);

  useEffect(() => {
    if (!contractLoading) {
      detectAndSync(contract, address);
    }
  }, [address, contract, contractLoading, detectAndSync]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not installed.");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await refresh();
    setUserConnected(true);
    localStorage.setItem("walletConnected", "true");
  }, [refresh]);

  const logout = useCallback(async () => {
    localStorage.clear();
    lastCheckedAddress.current = null;
    setUserConnected(false);
    localStorage.setItem("walletConnected", "false");
    setAuthState({
      walletAddress: "",
      role: "public",
      userName: "",
      studentEmail: "",
      studentUniversityId: "",
      emailVerified: null,
      isInitialized: true,
    });
    await refresh();
  }, [refresh]);

  const rawRole = authState.role;
  const effectiveRole = rawRole === "verified_student" ? "student"
    : rawRole === "pending_student" ? "pending_student"
    : rawRole;
  const isStudentLike = rawRole === "student" || rawRole === "verified_student";

  const value = {
    ...authState,
    isLoading: contractLoading,
    userConnected,
    isAdmin: rawRole === "admin",
    isUniversity: rawRole === "university",
    isStudent: rawRole === "student" || rawRole === "verified_student",
    isPendingStudent: rawRole === "pending_student",
    isVerifiedStudent: rawRole === "verified_student",
    isPublic: rawRole === "public",
    effectiveRole,
    isStudentLike,
    connectWallet,
    logout,
    disconnectWallet: logout,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};