import { useState } from "react";

export const useWallet = () => {
  const [account, setAccount] = useState("");

  const connect = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(accounts[0]);
  };

  return { account, connect };
};
