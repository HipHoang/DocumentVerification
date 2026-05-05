import { useState } from "react";
import { useContract } from "../../../hooks/useContract";
import { useAuth } from "../../../context/AuthContext";
import { hashFile } from "../../../utils/hash"; 
import { uploadToIPFS } from "../../../services/ipfs.service";
import { issueCertificate } from "../../../services/blockchain.service";

const IssueCertificate = () => {
  const { contract } = useContract();
  const { role } = useAuth();

  const [file, setFile] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setSuccess("");
  };

  const handleIssue = async () => {
    setError("");
    setSuccess("");

    // 1. Validation logic
    if (!file) return setError("Vui lòng chọn tệp tin chứng chỉ.");
    if (!studentName.trim()) return setError("Vui lòng nhập tên sinh viên.");
    if (!studentAddress.trim()) return setError("Vui lòng nhập địa chỉ ví sinh viên.");
    if (!contract) return setError("Hợp đồng chưa được khởi tạo. Vui lòng kết nối ví.");
    if (role !== "university") return setError("Chỉ tài khoản trường đại học mới có quyền phát hành.");

    setLoading(true);

    try {
      // 2. Tải file lên IPFS để lấy CID
      // Hàm này đã được đổi tên trong ipfs.service.js
      const cid = await uploadToIPFS(file);

      // 3. Gọi Smart Contract qua blockchain.service.js
      // Lưu ý: Trong blockchain.service.js, thứ tự tham số là (contract, studentName, studentAddress, cid)
      // Hàm issueCertificate bên trong service sẽ tự tạo Hash định danh
      const result = await issueCertificate(
        contract, 
        studentName.trim(), 
        studentAddress.trim(), 
        cid
      );

      console.log("Phát hành thành công:", result);
      setSuccess(`Chứng chỉ đã được ghi lên Blockchain! TX: ${result.txHash.substring(0, 10)}...`);
      
      // 4. Reset form
      setFile(null);
      setStudentName("");
      setStudentAddress("");
      // Reset input file thủ công nếu cần
      document.getElementById("certificate-file").value = "";
      
    } catch (err) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Phát hành chứng chỉ</h1>
        <p className="text-gray-500 mt-1">Tải lên tệp tin và lưu trữ thông tin bằng chứng lên Blockchain.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-xl">
        {/* Form Inputs */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tên sinh viên</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="VD: Nguyen Van A"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ ví (Wallet Address)</label>
          <input
            type="text"
            value={studentAddress}
            onChange={(e) => setStudentAddress(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="0x..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tệp tin chứng chỉ (Minh chứng)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="certificate-file"
            />
            <label htmlFor="certificate-file" className="cursor-pointer">
              <svg className="mx-auto text-gray-400 mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm text-gray-600">
                {file ? file.name : "Chọn file hoặc kéo thả vào đây"}
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (Tối đa 10MB)</p>
            </label>
          </div>
        </div>

        <button
          onClick={handleIssue}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg disabled:opacity-50 transition"
        >
          {loading ? "Đang xử lý..." : "Xác nhận phát hành"}
        </button>

        {/* Notifications */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
            {success}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueCertificate;