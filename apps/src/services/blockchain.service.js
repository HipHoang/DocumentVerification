import { ethers } from "ethers";

const safeCall = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (err) {
    return fallback;
  }
};

const getSignerAddress = async (contract) => {
  const signer = contract?.runner;
  if (!signer?.getAddress) throw new Error("Signer unavailable.");
  return await signer.getAddress();
};

export const getUserInfo = async (contract, address) => {
  try {
    if (!contract || !address) return { role: "public", name: "" };

    const adminAddress = await contract.admin();
    if (adminAddress.toLowerCase() === address.toLowerCase()) {
      return { role: "admin", name: "System Admin" };
    }

    const isUni = await contract.universities(address);
    if (isUni === true) {
      const uniName = await contract.universityNames(address);
      return { role: "university", name: uniName };
    }

    const isStud = await contract.isStudent(address);
    if (isStud === true) {
      return { role: "student", name: "" };
    }

    return { role: "public", name: "" };
  } catch (error) {
    console.error("[Auth] getUserInfo error:", error);
    return { role: "public", name: "" };
  }
};

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
    const certHash = generateCertHash(studentName, cid, studentAddress, issuer);
    const tx = await contract.issueCertificate(certHash, studentName.trim(), cid.trim(), studentAddress);
    await tx.wait();
    return { certHash, txHash: tx.hash };
  } catch (err) {
    throw new Error(`Phát hành thất bại: ${err?.reason || err?.message}`);
  }
};

export const verifyCertificate = async (contract, hash) => {
  if (!contract || !hash) throw new Error("Missing parameters");
  try {
    const result = await contract.verifyCertificate(hash);
    return {
      studentName: result[0],
      universityName: result[1],
      cid: result[2],
      issuer: result[3],
      valid: result[4],
      timestamp: Number(result[5]),
      hash,
    };
  } catch {
    throw new Error("Không tìm thấy chứng chỉ hoặc hash không hợp lệ.");
  }
};

export const revokeCertificate = async (contract, hash) => {
  try {
    const tx = await contract.revokeCertificate(hash);
    await tx.wait();
    return tx;
  } catch (err) {
    throw new Error(`Thu hồi thất bại: ${err?.reason || err?.message}`);
  }
};

export const getStudentCertificates = async (contract, studentAddress) => {
  try {
    const hashes = await contract.getStudentCertificates(studentAddress);
    return Array.from(hashes);
  } catch (err) {
    console.error("Fetch student certs failed:", err);
    return [];
  }
};

export const getIssuedCertificates = async (contract, issuerAddress) => {
  try {
    const hashes = await contract.getUniversityIssuedCertificates(issuerAddress);
    const details = await Promise.all(
      hashes.map(async (h) => {
        const cert = await verifyCertificate(contract, h).catch(() => null);
        if (cert) {
          cert.universityName = await safeCall(
            () => contract.universityNames(cert.issuer),
            "University"
          );
        }
        return cert;
      })
    );
    return details.filter((d) => d !== null);
  } catch (err) {
    console.error("Fetch issued certs failed:", err);
    return [];
  }
};

export const createShareToken = async (contract, certHash) => {
  try {
    const tx = await contract.createShareToken(certHash);
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((log) => {
        try { return contract.interface.parseLog(log); } catch { return null; }
      })
      .find((e) => e?.name === "ShareTokenCreated");

    const shareToken = event?.args?.shareToken;
    return { shareToken, txHash: tx.hash };
  } catch (err) {
    throw new Error(`Tạo share token thất bại: ${err?.reason || err?.message}`);
  }
};

export const revokeShareToken = async (contract, shareToken) => {
  try {
    const tx = await contract.revokeShareToken(shareToken);
    await tx.wait();
    return tx;
  } catch (err) {
    throw new Error(`Thu hồi share token thất bại: ${err?.reason || err?.message}`);
  }
};

export const verifyByShareToken = async (contract, shareToken) => {
  try {
    if (!contract) throw new Error("Contract not initialized. Check RPC configuration.");

    const bytes32Token = shareToken.startsWith("0x") ? shareToken : `0x${shareToken}`;

    if (!/^0x[0-9a-fA-F]{64}$/.test(bytes32Token)) {
      throw new Error("Invalid token format: share token must be a valid bytes32 hex string.");
    }

    const result = await contract.verifyByShareToken(bytes32Token);
    const tokenRevoked = await contract.isShareTokenRevoked(bytes32Token);

    return {
      studentName: result[0],
      universityName: result[1],
      cid: result[2],
      issuer: result[3],
      valid: result[4],
      timestamp: Number(result[5]),
      tokenRevoked,
    };
  } catch (err) {
    const msg = err?.message || err?.reason || String(err);

    if (
      msg.includes("RPC") ||
      msg.includes("connection") ||
      msg.includes("network") ||
      msg.includes("NetworkError") ||
      msg.includes("fetch") ||
      msg.includes("timeout") ||
      msg.includes("could not detect network")
    ) {
      throw new Error(`RPC error: ${msg}`);
    }

    if (
      msg.includes("Invalid token") ||
      msg.includes("execution reverted") ||
      msg.includes("CALL_EXCEPTION") ||
      msg.includes("not found")
    ) {
      throw new Error("Invalid token: share token không tồn tại hoặc không hợp lệ.");
    }

    if (msg.includes("Invalid token format")) {
      throw new Error(msg);
    }

    if (msg.includes("Contract not initialized")) {
      throw new Error(msg);
    }

    console.error("[verifyByShareToken] Unhandled error:", err);
    throw new Error(`Share token verification failed: ${msg}`);
  }
};

export const addUniversity = async (contract, address, name) => {
  try {
    const tx = await contract.addUniversity(address, name);
    await tx.wait();
    return tx;
  } catch (err) {
    throw new Error(`Lỗi thêm trường: ${err?.reason || err?.message}`);
  }
};

export const removeUniversity = async (contract, address) => {
  try {
    const tx = await contract.removeUniversity(address);
    await tx.wait();
    return tx;
  } catch (err) {
    throw new Error(`Lỗi xóa trường: ${err?.reason || err?.message}`);
  }
};

export const uploadToIPFS = async (file) => {
  if (!file) throw new Error("No file provided");
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}` },
    body: formData,
  });
  if (!response.ok) throw new Error("IPFS Upload Failed");
  const data = await response.json();
  return data.IpfsHash;
};

export const generateShareLink = (shareToken) => {
  if (!shareToken) return "";
  return `${window.location.origin}/verify?token=${shareToken}`;
};