import { useState, useEffect, useCallback } from "react";

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const checkIfConnected = useCallback(async () => {
    if (!window.ethereum) return null;
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      const addr = accounts?.[0] || null;
      setAccount(addr);
      return addr;
    } catch {
      return null;
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not installed.");
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const addr = accounts?.[0] || null;
      setAccount(addr);
      return addr;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    checkIfConnected();

    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts?.[0] || null);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [checkIfConnected]);

  return { account, isConnecting, connectWallet, checkIfConnected };
};