import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  searchStudentsByMSSV,
  getVerifiedStudentsByUniversity,
  removeVerifiedStudentAccess,
} from "../../../services/student.service";
import { getUniversityStatus } from "../../../services/university.service";

const STATUS_BLOCKED_MESSAGE = {
  suspended: "Tài khoản trường đã bị tạm ngưng. Liên hệ quản trị viên.",
  revoked: "Tài khoản trường đã bị thu hồi. Liên hệ quản trị viên.",
  unknown: "Không thể xác minh trạng thái tài khoản. Liên hệ quản trị viên.",
};

const VerifiedStudents = () => {
  const { role, walletAddress } = useAuth();

  // University status
  const [uniStatus, setUniStatus] = useState(null);
  const [uniStatusLoading, setUniStatusLoading] = useState(true);

  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const [error, setError] = useState("");
  const [actionLoadingWallet, setActionLoadingWallet] = useState(null);


  // All verified students of current university
  const [students, setStudents] = useState([]);

  // Displayed list
  const [displayStudents, setDisplayStudents] = useState([]);

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

  /* =========================================================
      LOAD VERIFIED STUDENTS
  ========================================================= */

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError("");

        if (!walletAddress) {
          setStudents([]);
          setDisplayStudents([]);
          return;
        }

        const data = await getVerifiedStudentsByUniversity(
          walletAddress.toLowerCase()
        );

        const normalized = Array.isArray(data) ? data : [];

        setStudents(normalized);
        setDisplayStudents(normalized);
      } catch (err) {
        console.error(err);

        setError(
          err?.message ||
            "Không thể tải danh sách sinh viên."
        );
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [walletAddress]);

  /* =========================================================
      SEARCH
  ========================================================= */

  useEffect(() => {
    const runSearch = async () => {
      const keyword = query.trim().toLowerCase();

      // Empty => show all
      if (!keyword) {
        setDisplayStudents(students);
        return;
      }

      try {
        setSearching(true);

        // Local filtering first (faster & enough for current university)
        const localFiltered = students.filter((student) => {
          return (
            student?.fullName
              ?.toLowerCase()
              .includes(keyword) ||
            student?.studentId
              ?.toLowerCase()
              .includes(keyword) ||
            student?.studentEmail
              ?.toLowerCase()
              .includes(keyword) ||
            student?.walletAddress
              ?.toLowerCase()
              .includes(keyword)
          );
        });

        // If local found -> use local
        if (localFiltered.length > 0) {
          setDisplayStudents(localFiltered);
          return;
        }

        // Firestore MSSV search fallback
        if (keyword.length >= 2) {
          const firestoreResults =
            await searchStudentsByMSSV(keyword, 30);

          const filtered = firestoreResults.filter(
            (student) =>
              student?.universityWallet?.toLowerCase?.() ===
              walletAddress?.toLowerCase?.()
          );

          setDisplayStudents(filtered);
        } else {
          setDisplayStudents([]);
        }
      } catch (err) {
        console.error(err);

        setError(
          err?.message ||
            "Không thể tìm kiếm sinh viên."
        );
      } finally {
        setSearching(false);
      }
    };

    runSearch();
  }, [query, students, walletAddress]);

  /* =========================================================
      STATS
  ========================================================= */

  const stats = useMemo(() => {
    return {
      total: students.length,
      showing: displayStudents.length,
    };
  }, [students, displayStudents]);

  /* =========================================================
      ACCESS CONTROL
  ========================================================= */

  if (role !== "university") {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
          Bạn không có quyền truy cập trang này.
        </div>
      </div>
    );
  }

  /* =========================================================
      REMOVE / REVOKE ACTIONS
  ========================================================= */

  const handleRemoveAccess = async (studentWallet, studentName) => {
    if (!studentWallet) return;

    if (isBlocked) {
      setError(blockedMessage);
      return;
    }

    const labelName = studentName || "sinh viên";

    if (
      !window.confirm(
        `Hành động này chỉ xóa quyền truy cập xác minh của trường.\n` +
          `Các chứng chỉ đã cấp trên blockchain vẫn còn hiệu lực và có thể xác minh.\n\n` +
          `Tiếp tục xóa quyền truy cập cho: ${labelName}?`
      )
    ) {
      return;
    }

    try {
      setActionLoadingWallet(studentWallet);
      setError("");

      const result = await removeVerifiedStudentAccess(studentWallet, "removed");
      if (result?.success) {
        // Optimistic UI update: remove from list
        setStudents((prev) => prev.filter((s) => s.walletAddress !== studentWallet));
        setDisplayStudents((prev) => prev.filter((s) => s.walletAddress !== studentWallet));
      }
    } catch (err) {
      console.error("[VerifiedStudents] remove access error:", err);
      setError(err?.message || "Không thể xóa quyền truy cập sinh viên.");
    } finally {
      setActionLoadingWallet(null);
    }
  };

  /* =========================================================
      UI
  ========================================================= */

  return (
    <div className="max-w-7xl mx-auto">

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

      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            Sinh viên đã xác minh
          </h1>

          <p className="text-gray-500 mt-2">
            Danh sách sinh viên đã được xác minh.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Tổng SV
            </p>

            <p className="text-2xl font-black text-gray-900">
              {stats.total}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Đang hiển thị
            </p>

            <p className="text-2xl font-black text-indigo-600">
              {stats.showing}
            </p>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* SEARCH */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tìm kiếm sinh viên
        </label>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo MSSV, tên, email hoặc wallet..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
        />

        <div className="mt-2 text-xs text-gray-500">
          {searching
            ? "Đang tìm kiếm..."
            : "Có thể tìm theo MSSV, tên, email hoặc wallet"}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
          <h2 className="font-bold text-gray-900">
            Danh sách sinh viên
          </h2>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : displayStudents.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            Không có sinh viên nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Sinh viên
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    MSSV
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Email
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Ví
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Trạng thái
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Thao tác
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {displayStudents.map((student, index) => (
                  <tr
                    key={
                      student?.id ||
                      student?.walletAddress ||
                      index
                    }
                    className="hover:bg-gray-50 transition"
                  >
                    {/* STUDENT */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {student?.fullName?.charAt(0) || "S"}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">
                            {student?.fullName || "---"}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            SV đã xác minh
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* MSSV */}
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm text-gray-800">
                        {student?.studentId || "---"}
                      </span>
                    </td>

                    {/* EMAIL */}
                    <td className="px-6 py-5">
                      <span className="text-sm text-gray-700">
                        {student?.studentEmail || "---"}
                      </span>
                    </td>

                    {/* WALLET */}
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm text-gray-700">
                        {student?.walletAddress
                          ? `${student.walletAddress.slice(
                              0,
                              8
                            )}...${student.walletAddress.slice(
                              -6
                            )}`
                          : "---"}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        ĐÃ XÁC MINH
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-5">
                      <button
                        onClick={() =>
                          handleRemoveAccess(
                            student?.walletAddress,
                            student?.fullName
                          )
                        }
                        disabled={actionLoadingWallet === student?.walletAddress || isBlocked}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isBlocked
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed border-0"
                            : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                      >
                        {isBlocked
                          ? "Bị khóa"
                          : actionLoadingWallet === student?.walletAddress
                            ? "Đang xử lý..."
                            : "Xóa quyền"}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifiedStudents;