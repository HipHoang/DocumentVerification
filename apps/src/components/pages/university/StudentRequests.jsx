import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  approveStudent,
  rejectStudent,
  getPendingStudentsByUniversity
} from "../../../services/student.service";
import { getUniversityStatus } from "../../../services/university.service";

const STATUS_BLOCKED_MESSAGE = {
  suspended: "Tài khoản trường đã bị tạm ngưng. Liên hệ quản trị viên.",
  revoked: "Tài khoản trường đã bị thu hồi. Liên hệ quản trị viên.",
  unknown: "Không thể xác minh trạng thái tài khoản. Liên hệ quản trị viên.",
};

const StudentRequests = () => {
  const { role, walletAddress } = useAuth();

  // University status
  const [uniStatus, setUniStatus] = useState(null);
  const [uniStatusLoading, setUniStatusLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);

  /* =========================================================
      LOAD UNIVERSITY STATUS
  ========================================================= */

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setUniStatusLoading(true);
        const status = await getUniversityStatus(walletAddress);
        setUniStatus(status);
      } catch {
        setUniStatus("unknown");
      } finally {
        setUniStatusLoading(false);
      }
    };
    if (walletAddress) {
      fetchStatus();
    }
  }, [walletAddress]);

  const isBlocked = uniStatus && uniStatus !== "active";
  const blockedMessage = STATUS_BLOCKED_MESSAGE[uniStatus] || STATUS_BLOCKED_MESSAGE.unknown;

  const fetchPending = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getPendingStudentsByUniversity(walletAddress);
      setStudents(list);
    } catch (e) {
      setError(e?.message || "Không thể tải danh sách yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (studentWallet) => {
    setError("");
    if (isBlocked) {
      setError(blockedMessage);
      return;
    }
    try {
      await approveStudent(studentWallet);
      await fetchPending();
    } catch (e) {
      setError(e?.message || "Không thể duyệt sinh viên.");
    }
  };

  const handleReject = async (studentWallet) => {
    setError("");
    if (isBlocked) {
      setError(blockedMessage);
      return;
    }
    try {
      await rejectStudent(studentWallet);
      await fetchPending();
    } catch (e) {
      setError(e?.message || "Không thể từ chối sinh viên.");
    }
  };

  if (role !== "university") {
    return (
      <div className="max-w-3xl mx-auto p-6 text-gray-700">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* STATUS BANNER */}
      {!uniStatusLoading && isBlocked && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{blockedMessage}</span>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Yêu cầu sinh viên</h1>
        <p className="text-gray-500 mt-2">
          Xem và duyệt/từ chối các đăng ký sinh viên đang chờ xác minh.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Đang tải...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Không có yêu cầu nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-6 py-3 text-gray-600 font-medium">Sinh viên</th>
                  <th className="px-6 py-3 text-gray-600 font-medium">MSSV</th>
                  <th className="px-6 py-3 text-gray-600 font-medium">Trường</th>
                  <th className="px-6 py-3 text-gray-600 font-medium">Email</th>
                  <th className="px-6 py-3 text-gray-600 font-medium">Ví</th>
                  <th className="px-6 py-3 text-gray-600 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{s.fullName}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-800">{s.studentId}</td>
                    <td className="px-6 py-4 text-gray-800">{s.universityWallet}</td>
                    <td className="px-6 py-4 text-gray-800">{s.studentEmail}</td>
                    <td className="px-6 py-4 font-mono text-gray-800">{s.walletAddress}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(s.walletAddress)}
                          disabled={isBlocked}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                            isBlocked
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {isBlocked ? "Bị khóa" : "Duyệt"}
                        </button>
                        <button
                          onClick={() => handleReject(s.walletAddress)}
                          disabled={isBlocked}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                            isBlocked
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed border-0"
                              : "bg-red-50 hover:bg-red-100 border border-red-200 text-red-700"
                          }`}
                        >
                          {isBlocked ? "Bị khóa" : "Từ chối"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={fetchPending}
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition border border-gray-200"
        >
          Làm mới
        </button>
      </div>
    </div>
  );
};

export default StudentRequests;