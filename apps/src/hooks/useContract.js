import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../../shared/constants/contract";

export const useContract = () => {
  const [contract, setContract] = useState(null);
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Case 1: MetaMask exists AND user has connected wallet → use BrowserProvider + signer
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const walletAddr = await signer.getAddress();
          const instance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          setAddress(walletAddr);
          setContract(instance);
          return;
        }
      }

      // Case 2: No MetaMask OR MetaMask locked/unavailable
      // Use a read-only JsonRpcProvider so public /verify works walletless.
      const rpcUrl = import.meta.env?.VITE_RPC_URL;
      if (rpcUrl) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const instance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        setAddress(null);
        setContract(instance);
      } else {
        console.warn(
          "[useContract] VITE_RPC_URL not set; cannot create read-only contract for public verification."
        );
        setAddress(null);
        setContract(null);
      }
    } catch (err) {
      setError(err.message);
      setAddress(null);
      setContract(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!cancelled) await initialize();
    };
    run();

    // Only attach MetaMask listeners if MetaMask is installed
    if (!window.ethereum) return;

    const handleAccounts = (accounts) => {
      if (cancelled) return;
      if (!accounts || accounts.length === 0) {
        // Wallet disconnected/locked → re-init with read-only mode
        initialize();
      } else {
        initialize();
      }
    };

    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", () => window.location.reload());

    return () => {
      cancelled = true;
      window.ethereum.removeListener("accountsChanged", handleAccounts);
    };
  }, [initialize]);

  return { contract, address, error, isLoading, refresh: initialize };
};