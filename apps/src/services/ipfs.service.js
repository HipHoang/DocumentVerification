const PINATA_API_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export const uploadToIPFS = async (file) => {
  const token = import.meta.env.VITE_PINATA_JWT;

  if (!file) {
    throw new Error("Vui lòng chọn tệp tin chứng chỉ trước khi phát hành.");
  }

  if (!token || token === "undefined") {
    throw new Error("Cấu hình lưu trữ (Pinata JWT) bị thiếu. Vui lòng kiểm tra lại file .env");
  }

  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new Error("Định dạng Pinata JWT không hợp lệ. Vui lòng kiểm tra lại mã Token.");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const pinataMetadata = JSON.stringify({
      name: `Certificate_${Date.now()}`,
      keyvalues: {
        project: "DocumentVerification",
        originalName: file.name
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch(PINATA_API_ENDPOINT, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error?.details || response.statusText);
    }

    const data = await response.json();

    if (!data.IpfsHash) {
      throw new Error("Phản hồi từ Pinata không chứa mã CID (IpfsHash).");
    }

    return data.IpfsHash;

  } catch (error) {
    throw new Error(`Không thể lưu trữ tệp lên IPFS: ${error.message}`);
  }
};