import { ethers } from "ethers";

/* ================================
   HELPERS & CONFIG
================================ */

const getDeployerAddress = () => import.meta.env.VITE_DEFAULT_ADMIN_ADDRESS || "";

const safeCall = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (err) {
    console.warn("[safeCall] Managed Error:", err?.message);
    return fallback;
  }
};

const getSignerAddress = async (contract) => {
  const signer = contract?.runner;
  if (!signer?.getAddress) throw new Error("Signer unavailable. Please connect wallet.");
  return await signer.getAddress();
};

/* ================================
   AUTH / ROLES (Mapping-based)
================================ */

export const getUserInfo = async (contract, address) => {
  try {
    if (!contract || !address) return { role: "public", name: "" };

    // 1. Kiểm tra Admin (mapping hoặc owner function)
    const adminAddress = await contract.admin(); // Dựa trên plan của Blackbox
    if (adminAddress.toLowerCase() === address.toLowerCase()) {
      return { role: "admin", name: "System Admin" };
    }

    // 2. Kiểm tra University bằng mapping (Phải dùng universities vì là mapping)
    // Blackbox xác nhận mapping trả về bool
    const isUni = await contract.universities(address);
    
    if (isUni === true) {
      // Lấy tên từ mapping universityNames
      const uniName = await contract.universityNames(address);
      console.log(`[Auth] Detected Role: university (${uniName})`);
      return { role: "university", name: uniName };
    }

    // 3. Mặc định là Public
    return { role: "public", name: "" };
  } catch (error) {
    console.error("[Auth] Error in getUserInfo:", error);
    return { role: "public", name: "" };
  }
};

/* ================================
   CORE FUNCTIONS
================================ */

/**
 * Tạo Hash định danh cho chứng chỉ (Off-chain) 
 * Giúp đảm bảo tính duy nhất trước khi ghi đè lên Blockchain
 */
export const generateCertHash = (studentName, cid, studentAddress, issuerAddress) => {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string", "address", "address", "uint256"],
      [studentName.trim(), cid.trim(), studentAddress, issuerAddress, Date.now()]
    )
  );
};

export const issueCertificate = async (contract, studentName, studentAddress, cid) => {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const issuer = await getSignerAddress(contract);
    // Lưu ý: Smart contract của bạn yêu cầu nhận 1 bytes32 hash làm định danh
    const certHash = generateCertHash(studentName, cid, studentAddress, issuer);

    const tx = await contract.issueCertificate(
      certHash,
      studentName.trim(),
      cid.trim(),
      studentAddress
    );
    
    await tx.wait();
    return { certHash, txHash: tx.hash };
  } catch (err) {
    const msg = err?.reason || err?.message;
    throw new Error(`Phát hành thất bại: ${msg}`);
  }
};

export const verifyCertificate = async (contract, hash) => {
  if (!contract || !hash) throw new Error("Missing parameters");

  try {
    const result = await contract.verifyCertificate(hash);
    // mapping trả về (name, cid, issuer, student, valid, timestamp)
    return {
      studentName: result[0],
      cid: result[1],
      issuer: result[2],
      student: result[3],
      valid: result[4],
      timestamp: Number(result[5]),
      hash: hash
    };
  } catch (err) {
    throw new Error("Không tìm thấy chứng chỉ hoặc mã Hash không hợp lệ.");
  }
};

export const revokeCertificate = async (contract, hash) => {
  try {
    const tx = await contract.revokeCertificate(hash);
    await tx.wait();
    return tx;
  } catch (err) {
    throw new Error(`Thu hồi thất bại: ${err?.reason || err.message}`);
  }
};

/* ================================
   QUERY FUNCTIONS
================================ */

export const getStudentCertificates = async (contract, studentAddress) => {
  try {
    const hashes = await contract.getStudentCertificates(studentAddress);
    const details = await Promise.all(
      hashes.map(h => verifyCertificate(contract, h).catch(() => null))
    );
    return details.filter(d => d !== null && d.valid);
  } catch (err) {
    console.error("Fetch student certs failed:", err);
    return [];
  }
};

export const getIssuedCertificates = async (contract, issuerAddress) => {
  try {
    const hashes = await contract.getIssuedCertificates(issuerAddress);
    const details = await Promise.all(
      hashes.map(async (h) => {
        const cert = await verifyCertificate(contract, h).catch(() => null);
        if (cert) {
          cert.universityName = await safeCall(() => contract.universityNames(cert.issuer), "University");
        }
        return cert;
      })
    );
    return details.filter(d => d !== null);
  } catch (err) {
    console.error("Fetch issued certs failed:", err);
    return [];
  }
};

/* ================================
   ADMIN FUNCTIONS
================================ */

export const addUniversity = async (contract, address, name) => {
  try {
    const tx = await contract.addUniversity(address, name);
    await tx.wait();
    return tx;
  } catch (err) {
    throw new Error(`Lỗi thêm trường: ${err?.reason || err.message}`);
  }
};

export const removeUniversity = async (contract, address) => {
  try {
    const tx = await contract.removeUniversity(address);
    await tx.wait();
    return tx;
  } catch (err) {
    throw new Error(`Lỗi xóa trường: ${err?.reason || err.message}`);
  }
};

/* ================================
   IPFS & UTILS
================================ */

export const uploadToIPFS = async (file) => {
  if (!file) throw new Error("No file provided");
  
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
    },
    body: formData
  });

  if (!response.ok) throw new Error("IPFS Upload Failed");
  const data = await response.json();
  return data.IpfsHash;
};

export const generateShareLink = (certHash) => {
  if (!certHash) return "";
  const payload = btoa(`${certHash}|${Date.now()}`);
  return `${window.location.origin}/verify?code=${payload}`;
};