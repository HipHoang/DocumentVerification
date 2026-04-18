import { ethers } from "ethers";
import abi from "@shared/abi/Certificate.json";
import { CONTRACT_ADDRESS } from "@shared/constants/contract";

export const getContract = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    abi.abi,
    signer
  );

  return contract;
};