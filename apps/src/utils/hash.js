import { ethers } from "ethers";

export const hashFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const hash = ethers.keccak256(bytes);
  return hash;
};
