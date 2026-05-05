import CertificateArtifact from '../abi/Certificate.json';

const getAbi = () => {
  if (!CertificateArtifact?.abi) {
    console.error("❌ ABI not found in artifact!");
    return [];
  }
  if (!Array.isArray(CertificateArtifact.abi)) {
    console.error("❌ ABI is not an array!");
    return [];
  }
  return CertificateArtifact.abi;
};

const getAddress = () => {
  const addr = import.meta.env?.VITE_CONTRACT_ADDRESS;
  if (!addr) {
    console.error("❌ VITE_CONTRACT_ADDRESS not set in .env");
    return null;
  }
  return addr;
};

export const CONTRACT_ABI = getAbi();
export const CONTRACT_ADDRESS = getAddress();

if (CONTRACT_ABI.length > 0) {
  const issueCertFns = CONTRACT_ABI.filter(item => item.name === 'issueCertificate');
  const issueDegFns = CONTRACT_ABI.filter(item => item.name === 'issueDegree');
  console.log("📋 issueCertificate available:", issueCertFns.length > 0);
  console.log("📋 issueDegree available:", issueDegFns.length > 0);
} else {
  console.warn("⚠️ ABI is empty or invalid!");
}
