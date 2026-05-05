// import { createContext, useContext, useState, useEffect, useCallback } from "react";
// import { ethers } from "ethers";
// import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../../shared/constants/contract";
// import { getUserInfo } from "../services/blockchain.service";

// const AuthContext = createContext(null);

// // ============================================
// // HELPER: Get contract instance with Ethers v6
// // ============================================
// const getContract = async () => {
//   if (!window.ethereum || !CONTRACT_ADDRESS || !CONTRACT_ABI) return null;
//   try {
//     const provider = new ethers.BrowserProvider(window.ethereum);
//     const signer = await provider.getSigner();
//     return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
//   } catch (err) {
//     console.error("[Auth] getContract error:", err.message);
//     return null;
//   }
// };

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// };

// export const AuthProvider = ({ children }) => {
//   const [walletAddress, setWalletAddress] = useState(() => localStorage.getItem("wallet") || "");
//   const [role, setRoleState] = useState(() => localStorage.getItem("role") || "public");
//   // Thêm state để lưu tên trường đại học (nếu có) từ userInfo
//   const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "");

//   const [isLoading, setIsLoading] = useState(false);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [isUnlocked, setIsUnlocked] = useState(false);

//   // --------------------------------------------
//   // FUNCTION: detectRole - Khớp với blockchain.service.js
//   // --------------------------------------------
//   const detectRole = useCallback(async (address) => {
//     if (!address) return;
    
//     try {
//       const contract = await getContract();
//       if (!contract) return;

//       // getUserInfo hiện tại trả về { role: "...", name: "..." }
//       const userInfo = await getUserInfo(contract, address);

//       setRoleState(userInfo.role);
//       setUserName(userInfo.name || "");

//       localStorage.setItem("wallet", address);
//       localStorage.setItem("role", userInfo.role);
//       if (userInfo.name) localStorage.setItem("userName", userInfo.name);
//       else localStorage.removeItem("userName");

//       console.log("[Auth] ✅ Role detected:", userInfo.role, userInfo.name || "");
//     } catch (err) {
//       console.error("[Auth] ❌ detectRole error:", err.message);
//       setRoleState("public");
//       setUserName("");
//     }
//   }, []);

//   // --------------------------------------------
//   // HELPER: isMetaMaskUnlocked
//   // --------------------------------------------
//   const checkUnlockStatus = useCallback(async () => {
//     if (!window.ethereum) return false;
//     try {
//       const provider = new ethers.BrowserProvider(window.ethereum);
//       const accounts = await provider.listAccounts();
//       const unlocked = accounts.length > 0;
//       setIsUnlocked(unlocked);
//       return unlocked;
//     } catch {
//       return false;
//     }
//   }, []);

//   // --------------------------------------------
//   // EFFECT: Initialize & Listeners
//   // --------------------------------------------
//   useEffect(() => {
//     const init = async () => {
//       const unlocked = await checkUnlockStatus();
//       if (!unlocked) {
//         setWalletAddress("");
//         setRoleState("public");
//         setUserName("");
//         setIsInitialized(true);
//         return;
//       }

//       const provider = new ethers.BrowserProvider(window.ethereum);
//       const accounts = await provider.listAccounts();
//       if (accounts.length > 0) {
//         const addr = accounts[0].address;
//         setWalletAddress(addr);
//         await detectRole(addr);
//       }
//       setIsInitialized(true);
//     };

//     init();

//     if (window.ethereum) {
//       const handleAccounts = async (accounts) => {
//         if (!accounts || accounts.length === 0) {
//           disconnectWallet();
//         } else {
//           const addr = accounts[0];
//           setWalletAddress(addr);
//           await detectRole(addr);
//         }
//       };

//       window.ethereum.on("accountsChanged", handleAccounts);
//       window.ethereum.on("chainChanged", () => window.location.reload());

//       return () => {
//         window.ethereum.removeListener("accountsChanged", handleAccounts);
//       };
//     }
//   }, [detectRole, checkUnlockStatus]);

//   // --------------------------------------------
//   // ACTIONS
//   // --------------------------------------------
//   const connectWallet = useCallback(async () => {
//     if (!window.ethereum) throw new Error("MetaMask not detected.");
//     setIsLoading(true);
//     try {
//       const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
//       const address = accounts[0];
//       setWalletAddress(address);
//       setIsUnlocked(true);
//       await detectRole(address);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [detectRole]);

//   const disconnectWallet = useCallback(() => {
//     setWalletAddress("");
//     setRoleState("public");
//     setUserName("");
//     setIsUnlocked(false);
//     localStorage.clear(); // Xóa sạch để bảo mật
//   }, []);

//   const value = {
//     walletAddress,
//     role,
//     userName, // Export thêm tên người dùng/trường học để hiển thị lên Header
//     isLoading,
//     isInitialized,
//     isUnlocked,
//     isAdmin: role === "admin",
//     isUniversity: role === "university",
//     isPublic: role === "public",
//     connectWallet,
//     disconnectWallet,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// AuthContext.jsx

// import { createContext, useContext, useState, useEffect, useCallback } from "react";
// import { useContract } from "../hooks/useContract";
// import { getUserInfo } from "../services/blockchain.service";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const { contract, address, isLoading: contractLoading } = useContract();
  
//   // State khởi tạo từ LocalStorage nhưng sẽ bị ghi đè ngay lập tức bởi useEffect bên dưới
//   const [walletAddress, setWalletAddress] = useState("");
//   const [role, setRole] = useState("public");
//   const [userName, setUserName] = useState("");
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [isConnecting, setIsConnecting] = useState(false);

//   const detectRole = useCallback(async (currentContract, currentAddress) => {
//     if (!currentContract || !currentAddress) return;
//     try {
//       const userInfo = await getUserInfo(currentContract, currentAddress);
//       setRole(userInfo.role);
//       setUserName(userInfo.name || "");
      
//       localStorage.setItem("wallet", currentAddress);
//       localStorage.setItem("role", userInfo.role);
//       if (userInfo.name) localStorage.setItem("userName", userInfo.name);
//     } catch (err) {
//       console.error("[Auth] Role detection failed:", err);
//       setRole("public");
//     }
//   }, []);

//   useEffect(() => {
//     const sync = async () => {
//       // Chỉ chạy khi useContract đã hoàn tất việc quét ví (Ready)
//       if (!contractLoading) {
//         if (address) {
//           setWalletAddress(address);
//           await detectRole(contract, address);
//         } else {
//           // TRƯỜNG HỢP THEN CHỐT: Nếu MetaMask không trả về address (do Lock/Logout)
//           // Xóa sạch bộ nhớ để "đá" người dùng ra
//           setWalletAddress("");
//           setRole("public");
//           setUserName("");
//           localStorage.clear(); 
//         }
//         setIsInitialized(true);
//       }
//     };
//     sync();
//   }, [address, contract, contractLoading, detectRole]);

//   const connectWallet = async () => {
//     if (!window.ethereum) throw new Error("MetaMask not found.");
//     setIsConnecting(true);
//     try {
//       await window.ethereum.request({ method: "eth_requestAccounts" });
//       // Không cần làm gì thêm, useContract sẽ tự thấy account mới và trigger re-render
//     } catch (error) {
//       console.error("[Auth] Connection error:", error);
//     } finally {
//       setIsConnecting(false);
//     }
//   };

//   const disconnectWallet = () => {
//     setWalletAddress("");
//     setRole("public");
//     setUserName("");
//     localStorage.clear();
//     // Lưu ý: MetaMask không cho phép ngắt kết nối bằng code, chỉ xóa state phía App
//   };

//   const value = {
//     walletAddress,
//     role,
//     userName,
//     isLoading: contractLoading || isConnecting,
//     isInitialized,
//     isAdmin: role === "admin",
//     isUniversity: role === "university",
//     isStudent: role === "student",
//     connectWallet,
//     disconnectWallet,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// };

// import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
// import { useContract } from "../hooks/useContract";
// import { getUserInfo } from "../services/blockchain.service";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const { contract, address, isLoading: contractLoading, refresh } = useContract();
  
//   const lastCheckedRef = useRef("");
  
//   const [walletAddress, setWalletAddress] = useState("");
//   const [role, setRole] = useState("public");
//   const [userName, setUserName] = useState("");
//   const [isInitialized, setIsInitialized] = useState(false);

//   const detectRole = useCallback(async (currentContract, currentAddress) => {
//     if (!currentContract || !currentAddress || currentAddress === lastCheckedRef.current) {
//       return; // Skip redundant check
//     }
    
//     lastCheckedRef.current = currentAddress;
    
//     try {
//       const userInfo = await getUserInfo(currentContract, currentAddress);
//       setRole(userInfo.role || "public");
//       setUserName(userInfo.name || "");
//       localStorage.setItem("wallet", currentAddress);
//       localStorage.setItem("role", userInfo.role || "public");
//       if (userInfo.name) localStorage.setItem("userName", userInfo.name);
//     } catch (err) {
//       console.error("[AuthContext] Role check failed:", err);
//       setRole("public");
//       localStorage.setItem("role", "public");
//     }
//   }, []);

//   // Stable sync: Only trigger on address change + loading complete
//   useEffect(() => {
//     if (!contractLoading) {
//       if (address) {
//         setWalletAddress(address);
//         detectRole(contract, address);
//       } else {
//         // Disconnected: Clear immediately
//         setWalletAddress("");
//         setRole("public");
//         setUserName("");
//         localStorage.clear();
//       }
//       setIsInitialized(true);
//     }
//   }, [address, contractLoading, detectRole]); // Removed 'contract' dep (stable from hook)

//   const connectWallet = async () => {
//     if (!window.ethereum) return alert("Please install MetaMask");
//     try {
//       await window.ethereum.request({ method: "eth_requestAccounts" });
//       const result = await refresh(); // Ép useContract quét lại ngay lập tức
//       if (result) {
//         await detectRole(result.instance, result.walletAddr);
//       }
//     } catch (error) {
//       console.error("Connect error:", error);
//     }
//   };

//   const logout = useCallback(async () => {
//     await refresh(); // Force useContract to detect disconnect
//     setWalletAddress("");
//     setRole("public");
//     setUserName("");
//     localStorage.clear();
//     lastCheckedRef.current = "";
//     console.log("[Auth] Logged out - cleared state");
//   }, [refresh]);

//   const value = {
//     walletAddress,
//     role,
//     userName,
//     isInitialized: isInitialized && !contractLoading,
//     isAdmin: role === "admin",
//     isUniversity: role === "university",
//     isStudent: role === "student",
//     connectWallet,
//     logout,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => useContext(AuthContext);
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useContract } from "../hooks/useContract";
import { getUserInfo } from "../services/blockchain.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { contract, address, isLoading: contractLoading, refresh } = useContract();
  
  const [authState, setAuthState] = useState({
    walletAddress: "",
    role: "public",
    userName: "",
    isInitialized: false
  });

  // Ref dùng để ghi nhớ địa chỉ cuối cùng đã check thành công
  const lastCheckedAddress = useRef(null);

  const detectAndSync = useCallback(async (currentContract, currentAddress) => {
    // Nếu địa chỉ ví không đổi thì không chạy lại (Chặn vòng lặp vô tận)
    if (currentAddress === lastCheckedAddress.current && authState.isInitialized) return;

    if (!currentAddress) {
      setAuthState({ walletAddress: "", role: "public", userName: "", isInitialized: true });
      lastCheckedAddress.current = null;
      return;
    }

    try {
      const userInfo = await getUserInfo(currentContract, currentAddress);
      lastCheckedAddress.current = currentAddress;
      
      setAuthState({
        walletAddress: currentAddress,
        role: userInfo.role,
        userName: userInfo.name,
        isInitialized: true
      });
    } catch (err) {
      setAuthState(prev => ({ ...prev, isInitialized: true }));
    }
  }, [authState.isInitialized]);

  useEffect(() => {
    if (!contractLoading) {
      detectAndSync(contract, address);
    }
  }, [address, contract, contractLoading, detectAndSync]);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      // useContract sẽ tự lo phần re-render
    } catch (error) {
      console.error("Connect error:", error);
    }
  };

  const logout = async () => {
    localStorage.clear();
    setAuthState({ walletAddress: "", role: "public", userName: "", isInitialized: true });
    lastCheckedAddress.current = null;
    if (refresh) await refresh(); // Gọi refresh từ hook để quét lại trạng thái ví
    window.location.href = "/"; // Force redirect về Landing Page
  };

  const value = {
    ...authState,
    isAdmin: authState.role === "admin",
    isUniversity: authState.role === "university",
    connectWallet,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);