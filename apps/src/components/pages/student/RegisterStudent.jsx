import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getUniversities, isEmailDomainAllowed, registerStudent } from "../../../services/student.service";

const RegisterStudent = () => {
  // Loại bỏ 'isLoading' vì không dùng đến trong logic này để tránh lỗi Lint
  const { walletAddress, role, userConnected } = useAuth();
  const navigate = useNavigate();

  const [universities, setUniversities] = useState([]);
  const [uniLoading, setUniLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    studentId: "",
    universityId: "",
    email: "",
  });

  // walletAddress từ context được dùng trực tiếp thông qua useMemo để đảm bảo tính nhất quán
  const wallet = useMemo(() => walletAddress || "", [walletAddress]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailDomainValid, setEmailDomainValid] = useState(null);

  const isWalletReadonlyReady = useMemo(() => !!wallet && typeof wallet === "string", [wallet]);

  useEffect(() => {
    // Redirect nếu đã có role (tránh vòng lặp)
    if (role === "verified_student" || role === "student" || role === "pending_student") {
      navigate("/dashboard", { replace: true });
      return;
    }

    const fetchUniversities = async () => {
      try {
        setUniLoading(true);
        const list = await getUniversities();
        setUniversities(list);
      } catch (e) {
        console.error(e);
        setError("Không thể tải danh sách trường. Vui lòng thử lại.");
      } finally {
        setUniLoading(false);
      }
    };

    fetchUniversities();
  }, [navigate, role]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess("");
  };

  // Logic kiểm tra Domain Email real-time
  useEffect(() => {
    const checkDomain = async () => {
      const universityId = form.universityId;
      const email = form.email?.trim() || "";

      if (!universityId || !email || !email.includes("@")) {
        setEmailDomainValid(null);
        return;
      }

      try {
        setEmailChecking(true);
        const ok = await isEmailDomainAllowed({ universityId, email });
        setEmailDomainValid(ok);
      } catch (err) {
        console.error("Domain check error:", err);
        setEmailDomainValid(null);
      } finally {
        setEmailChecking(false);
      }
    };

    const timeoutId = setTimeout(checkDomain, 500); // Debounce 500ms để tránh gọi API liên tục
    return () => clearTimeout(timeoutId);
  }, [form.universityId, form.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userConnected || !wallet) return setError("Vui lòng kết nối MetaMask trước.");
    if (!form.fullName.trim()) return setError("Vui lòng nhập họ tên.");
    if (!form.studentId.trim()) return setError("Vui lòng nhập MSSV.");
    if (!form.universityId) return setError("Vui lòng chọn trường.");

    const studentEmail = form.email.trim();
    if (!studentEmail) return setError("Vui lòng nhập email.");
    if (emailDomainValid === false) return setError("Email không đúng miền trường đã chọn.");
    if (!studentEmail.includes("@")) return setError("Email không hợp lệ.");

    setSubmitting(true);
    try {
      const selectedUniversity = universities.find(
        (u) => u.id === form.universityId
      );

      if (!selectedUniversity?.walletAddress) {
        return setError("Không tìm thấy wallet của trường.");
      }

      await registerStudent({
        fullName: form.fullName,
        studentId: form.studentId,

        // FIX: lưu wallet thật
        universityWallet: selectedUniversity.walletAddress,

        walletAddress: wallet,
        studentEmail,
      });

      setSuccess("Đăng ký thành công! Trạng thái của bạn là PENDING cho đến khi trường xác nhận.");

      // Chờ 1.5s để người dùng thấy thông báo thành công trước khi redirect
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);

    } catch (err) {
      setError(err?.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đăng ký Sinh viên</h1>
        <p className="text-gray-500 mt-1">Đăng ký để trường xác minh danh tính trước khi cấp chứng chỉ.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên</label>
            <input
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="Nguyen Van A"
              type="text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">MSSV</label>
            <input
              value={form.studentId}
              onChange={(e) => handleChange("studentId", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="2212345"
              type="text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trường đại học</label>
            <select
              value={form.universityId}
              onChange={(e) => handleChange("universityId", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            >
              <option value="">Chọn trường</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name || uni.id}
                </option>
              ))}
            </select>
            {uniLoading && <p className="text-xs text-gray-400 mt-1">Đang tải...</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email (dùng để xác minh)</label>
            <input
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="student@university.edu.vn"
              type="email"
            />
            {emailChecking && <p className="text-xs text-blue-500 mt-1 italic">Đang kiểm tra miền email...</p>}
            {emailDomainValid === true && <p className="text-xs text-green-600 mt-1">✓ Miền email hợp lệ.</p>}
            {emailDomainValid === false && <p className="text-xs text-red-600 mt-1">✗ Email không thuộc miền trường đã chọn.</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ ví</label>
            <input
              readOnly
              value={isWalletReadonlyReady ? wallet : "Chưa kết nối ví"}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-mono text-sm bg-gray-50 text-gray-500 outline-none cursor-not-allowed"
              type="text"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={submitting || emailChecking || !userConnected}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            {submitting ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterStudent;