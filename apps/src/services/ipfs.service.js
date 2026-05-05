const PINATA_API_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export const uploadToIPFS = async (file) => {
  // 1. Lấy Token từ biến môi trường Vite
  const token = import.meta.env.VITE_PINATA_JWT;

  // 2. Kiểm tra tính hợp lệ của Token và File đầu vào
  if (!file) {
    throw new Error("Vui lòng chọn tệp tin chứng chỉ trước khi phát hành.");
  }

  if (!token || token === "undefined") {
    console.error("LỖI: VITE_PINATA_JWT không tồn tại trong file .env");
    throw new Error("Cấu hình lưu trữ (Pinata JWT) bị thiếu. Vui lòng kiểm tra lại file .env");
  }

  // 3. Kiểm tra định dạng JWT cơ bản (Phòng trường hợp copy-paste thiếu)
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new Error("Định dạng Pinata JWT không hợp lệ. Vui lòng kiểm tra lại mã Token.");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    // Metadata giúp bạn quản lý file trên dashboard Pinata dễ dàng hơn
    const pinataMetadata = JSON.stringify({
      name: `Certificate_${Date.now()}`,
      keyvalues: {
        project: "DocumentVerification",
        originalName: file.name
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    console.log(`[IPFS] Đang tải lên: ${file.name} (${file.size} bytes)...`);

    const response = await fetch(PINATA_API_ENDPOINT, {
      method: "POST",
      headers: {
        // Lưu ý quan trọng: KHÔNG set 'Content-Type', trình duyệt sẽ tự động 
        // thiết lập 'multipart/form-data' kèm boundary chuẩn.
        'Authorization': `Bearer ${token.trim()}`,
      },
      body: formData,
    });

    // 4. Xử lý phản hồi từ Pinata
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("Pinata Error Detail:", errorData);
      throw new Error(errorData.error?.details || response.statusText);
    }

    const data = await response.json();

    if (!data.IpfsHash) {
      throw new Error("Phản hồi từ Pinata không chứa mã CID (IpfsHash).");
    }

    console.log("[IPFS] Tải lên thành công! CID:", data.IpfsHash);
    
    // Trả về CID (IpfsHash) để blockchain.service.js sử dụng lưu vào Smart Contract
    return data.IpfsHash;

  } catch (error) {
    console.error("[IPFS] Lỗi hệ thống:", error.message);
    throw new Error(`Không thể lưu trữ tệp lên IPFS: ${error.message}`);
  }
};