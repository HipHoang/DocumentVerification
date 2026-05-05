// import { useState, useEffect } from "react";
// import { ethers } from "ethers";
// import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../../shared/constants/contract";

// const isMetaMaskReady = async (timeoutMs = 2000) => {
//   const startTime = Date.now();

//   const poll = () => {
//     return new Promise((resolve) => {
//       const check = () => {
//         if (window.ethereum) {
//           resolve(true);
//         } else if (Date.now() - startTime >= timeoutMs) {
//           console.warn("[Contract] ⚠️ MetaMask poll timeout");
//           resolve(false);
//         } else {
//           setTimeout(check, 100);
//         }
//       };
//       check();
//     });
//   };

//   return poll();
// };


// export const useContract = () => {
//   const [contract, setContract] = useState(null);
//   const [signer, setSigner] = useState(null);
//   const [address, setAddress] = useState(null);
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;

//     const initializeContract = async () => {
//       if (cancelled) return;

//       setIsLoading(true);
//       setError(null);

//       try {
//         // 1. Poll for MetaMask/wallet (prevent race condition)
//         console.log("[Contract] ⏳ Polling for window.ethereum...");
//         const ready = await isMetaMaskReady(2000);

//         if (!ready) {
//           throw new Error("MetaMask (or other EVM wallet) not detected after 2s timeout.");
//         }

//         console.log("[Contract] ✅ MetaMask ready");

//         // 2. Get provider and signer from ethers v6
//         let provider;
//         let walletSigner = null;
//         let walletAddress = null;

//         if (window.ethereum) {
//           provider = new ethers.BrowserProvider(window.ethereum);
//           try {
//             walletSigner = await provider.getSigner();
//             walletAddress = await walletSigner.getAddress();
//             console.log("[Contract] ✅ Signer address:", walletAddress);
//           } catch (signerError) {
//             console.warn("[Contract] ⚠️ No signer available, using provider for read-only. ", signerError.message);
//           }
//         } else {
//           // Fallback to a default provider if MetaMask is not present for public users.
//           // In a real app, you might use a public RPC URL here.
//           provider = ethers.getDefaultProvider();
//           console.warn("[Contract] ⚠️ window.ethereum not found. Using default provider for read-only.");
//         }

//         if (!provider) {
//           throw new Error("No Ethereum provider available.");
//         }

//         // 3. Validate CONTRACT_ADDRESS exists
//         if (!CONTRACT_ADDRESS) {
//           throw new Error("VITE_CONTRACT_ADDRESS undefined in .env");
//         }

//         // 4. Validate CONTRACT_ABI exists and is array
//         if (!CONTRACT_ABI || !Array.isArray(CONTRACT_ABI)) {
//           throw new Error("Invalid CONTRACT_ABI: not an array");
//         }

//         // 5. Create contract instance
//         const certificateContract = new ethers.Contract(
//           CONTRACT_ADDRESS,
//           CONTRACT_ABI,
//           walletSigner || provider
//         );

//         console.log("[Contract] ✅ Contract initialized at:", CONTRACT_ADDRESS);

//         if (!cancelled) {
//           setContract(certificateContract);
//           setSigner(walletSigner);
//           setAddress(walletAddress);
//           // Only set signer and address if they exist
//           if (walletSigner) {
//             setSigner(walletSigner);
//             setAddress(walletAddress);
//           } else {
//             setSigner(null);
//             setAddress(null);
//           }
//         }
//       } catch (err) {
//         const errorMsg = err.message || "Unknown error";
//         console.error("[Contract] ❌ Init error:", errorMsg);

//         if (!cancelled) {
//           setError(errorMsg);
//           setContract(null);
//         }
//       } finally {
//         if (!cancelled) {
//           setIsLoading(false);
//         }
//       }
//     };

//     // Start initialization
//     initializeContract();

//     // Listen for wallet changes
//     const handleAccountsChanged = (accounts) => {
//       console.log("[Contract] 🔄 accountsChanged:", accounts?.length || 0);
//       if (!cancelled) {
//         // Re-initialize on account change
//         initializeContract();
//       }
//     };

//     const handleChainChanged = () => {
//       console.log("[Contract] 🔄 chainChanged - reloading...");
//       window.location.reload();
//       window.myContract = certificateContract;
//     };

//     const handleDisconnect = () => {
//       console.log("[Contract] 🔴 wallet disconnected");
//       if (!cancelled) {
//         setContract(null);
//         setSigner(null);
//         setAddress(null);
//         setError("Wallet disconnected");
//       }
//     };

//     if (window.ethereum) {
//       window.ethereum.on("accountsChanged", handleAccountsChanged);
//       window.ethereum.on("chainChanged", handleChainChanged);
//       window.ethereum.on("disconnect", handleDisconnect);
//     }

//     return () => {
//       cancelled = true;
//       if (window.ethereum) {
//         window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
//         window.ethereum.removeListener("chainChanged", handleChainChanged);
//         window.ethereum.removeListener("disconnect", handleDisconnect);
//       }
//     };
//   }, []);

//   return { contract, signer, address, error, isLoading };
// };

// import { useState, useEffect } from "react";
// import { ethers } from "ethers";
// import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../../shared/constants/contract";

// const isMetaMaskReady = async (timeoutMs = 2000) => {
//   const startTime = Date.now();
//   const poll = () => {
//     return new Promise((resolve) => {
//       const check = () => {
//         if (window.ethereum) resolve(true);
//         else if (Date.now() - startTime >= timeoutMs) resolve(false);
//         else setTimeout(check, 100);
//       };
//       check();
//     });
//   };
//   return poll();
// };

// export const useContract = () => {
//   const [contract, setContract] = useState(null);
//   const [address, setAddress] = useState(null);
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;

//     const initialize = async () => {
//       if (cancelled) return;
//       setIsLoading(true);
//       setError(null);

//       try {
//         const ready = await isMetaMaskReady(2000);
//         if (!ready) throw new Error("MetaMask not detected after 2s.");

//         const provider = new ethers.BrowserProvider(window.ethereum);
//         const accounts = await provider.listAccounts();

//         if (accounts.length > 0) {
//           const signer = await provider.getSigner();
//           const walletAddr = await signer.getAddress();
//           const instance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

//           if (!cancelled) {
//             setAddress(walletAddr);
//             setContract(instance);
//           }
//         } else {
//           // Quan trọng: Nếu không có account nào, xóa trạng thái cũ ngay
//           if (!cancelled) {
//             setAddress(null);
//             setContract(null);
//           }
//         }
//       } catch (err) {
//         if (!cancelled) setError(err.message);
//       } finally {
//         if (!cancelled) setIsLoading(false);
//       }
//     };

//     initialize();

//     const handleAccounts = (accounts) => {
//       console.log("[Contract] 🔄 Accounts changed:", accounts.length);
//       initialize(); // Khởi tạo lại để đồng bộ address/contract
//     };

//     if (window.ethereum) {
//       window.ethereum.on("accountsChanged", handleAccounts);
//       window.ethereum.on("chainChanged", () => window.location.reload());
//       window.ethereum.on("disconnect", () => {
//         setAddress(null);
//         setContract(null);
//       });
//     }

//     return () => {
//       cancelled = true;
//       if (window.ethereum) {
//         window.ethereum.removeListener("accountsChanged", handleAccounts);
//       }
//     };
//   }, []);

//   return { contract, address, error, isLoading };
// };

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../../shared/constants/contract";

export const useContract = () => {
  const [contract, setContract] = useState(null);
  const [address, setAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncWithWallet = useCallback(async () => {
    if (!window.ethereum) {
      setIsLoading(false);
      return null;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const walletAddr = accounts[0].address;
        const instance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        console.log("[Contract] Synced address:", walletAddr);
        setAddress(walletAddr);
        setContract(instance);
        return { instance, walletAddr };
      } else {
        console.log("[Contract] Synced: disconnected");
        setAddress(null);
        setContract(null);
        return null;
      }
    } catch (err) {
      console.error("[Contract Hook] Sync error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncWithWallet();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", syncWithWallet);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", syncWithWallet);
      }
    };
  }, [syncWithWallet]);

  return { contract, address, isLoading, refresh: syncWithWallet };
};