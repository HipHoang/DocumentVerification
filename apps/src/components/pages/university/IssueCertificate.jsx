import { useEffect, useMemo, useRef, useState } from "react";
import { useContract } from "../../../hooks/useContract";
import { useAuth } from "../../../context/AuthContext";
import { uploadToIPFS } from "../../../services/ipfs.service";
import { issueCertificate } from "../../../services/blockchain.service";
import {
  searchStudentsByMSSV,
  getVerifiedStudentsByUniversity,
} from "../../../services/student.service";
import {
  getUniversityStatus,
  getUniversityName,
} from "../../../services/university.service";

const STATUS_BLOCKED_MESSAGE = {
  suspended: "University account is suspended. Contact administrator.",
  revoked: "University account is revoked. Contact administrator.",
  unknown: "University status could not be verified. Contact administrator.",
};

const IssueCertificate = () => {
  const { contract } = useContract();
  const { role, walletAddress } = useAuth();

  const fileInputRef = useRef(null);

  // University status
  const [uniStatus, setUniStatus] = useState(null);
  const [uniStatusLoading, setUniStatusLoading] = useState(true);

  // File
  const [file, setFile] = useState(null);

  // Student source
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Search / suggestion
  const [search, setSearch] = useState("");
  const [mssvQuery, setMssvQuery] = useState("");
  const [studentCandidates, setStudentCandidates] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Selected student
  const [studentSelected, setStudentSelected] = useState(null);

  // Form fields
  const [studentName, setStudentName] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [studentUniversity, setStudentUniversity] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentId, setStudentId] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      LOAD VERIFIED STUDENTS OF CURRENT UNIVERSITY
  ========================================================= */

  useEffect(() => {
    const loadStudents = async () => {
      try {
        if (!walletAddress) return;

        setStudentsLoading(true);

        const data = await getVerifiedStudentsByUniversity(
          walletAddress
        );

        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, [walletAddress]);

  /* =========================================================
      MSSV SEARCH
  ========================================================= */

  useEffect(() => {
    const run = async () => {
      const keyword = mssvQuery.trim();

      if (keyword.length < 2) {
        setStudentCandidates([]);
        return;
      }

      try {
        setCandidateLoading(true);

        const result = await searchStudentsByMSSV(keyword, 8);

        setStudentCandidates(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error(err);
        setStudentCandidates([]);
      } finally {
        setCandidateLoading(false);
      }
    };

    const timeout = setTimeout(run, 300);

    return () => clearTimeout(timeout);
  }, [mssvQuery]);

  /* =========================================================
      FILTERED VERIFIED STUDENTS
  ========================================================= */

  const filteredStudents = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return students;

    return students.filter((s) => {
      return (
        s?.fullName?.toLowerCase().includes(keyword) ||
        s?.studentId?.toLowerCase().includes(keyword) ||
        s?.email?.toLowerCase().includes(keyword) ||
        s?.walletAddress?.toLowerCase().includes(keyword)
      );
    });
  }, [students, search]);

  /* =========================================================
      SELECT STUDENT
  ========================================================= */

  const handleSelectStudent = async (student) => {
    if (!student) return;

    setStudentSelected(student);

    setStudentName(student.fullName || "");
    setStudentAddress(student.walletAddress || "");

    // Email: Firestore stores as studentEmail, not email
    setStudentEmail(student.studentEmail || student.email || "");

    // Student ID (MSSV)
    setStudentId(student.studentId || "");

    // University name: student doc only stores universityWallet (a wallet address).
    // Resolve the university name from Firestore using getUniversityName.
    if (student.universityName) {
      setStudentUniversity(student.universityName);
    } else if (student.universityWallet) {
      // Async fetch the university name from the wallet address
      getUniversityName(student.universityWallet).then((name) => {
        setStudentUniversity(name || "");
      });
    } else {
      setStudentUniversity("");
    }

    setSearch(student.fullName || "");
    setMssvQuery(student.studentId || "");

    setShowSuggestions(false);

    setError("");
  };

  /* =========================================================
      FILE CHANGE
  ========================================================= */

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    const maxSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("Kích thước file vượt quá 10MB.");
      return;
    }

    setFile(selectedFile);

    setError("");
    setSuccess("");
  };

  /* =========================================================
      ISSUE CERTIFICATE
  ========================================================= */

  const handleIssue = async () => {
    try {
      setError("");
      setSuccess("");

      // Validation
      if (!file) {
        return setError("Vui lòng chọn file chứng chỉ.");
      }

      if (!studentName.trim()) {
        return setError("Thiếu tên sinh viên.");
      }

      if (!studentAddress.trim()) {
        return setError("Thiếu địa chỉ ví sinh viên.");
      }

      if (!contract) {
        return setError("Smart contract chưa được khởi tạo.");
      }

      if (role !== "university") {
        return setError(
          "Chỉ tài khoản university mới được phát hành."
        );
      }

      if (isBlocked) {
        return setError(blockedMessage);
      }

      setLoading(true);

      // Upload IPFS
      const cid = await uploadToIPFS(file);

      // Blockchain
      const result = await issueCertificate(
        contract,
        studentName.trim(),
        studentAddress.trim(),
        cid
      );

      setSuccess(
        `Đã phát hành thành công. TX: ${result.txHash.slice(
          0,
          14
        )}...`
      );

      // Reset
      setFile(null);

      setStudentSelected(null);

      setStudentName("");
      setStudentAddress("");
      setStudentUniversity("");
      setStudentEmail("");
      setStudentId("");

      setSearch("");
      setMssvQuery("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.message || "Có lỗi xảy ra khi phát hành chứng chỉ."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
      RENDER
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
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">
          Phát hành chứng chỉ
        </h1>

        <p className="text-gray-500 mt-2">
          Chọn sinh viên đã xác minh và phát hành chứng chỉ lên
          Blockchain.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* =========================================================
            LEFT - VERIFIED STUDENTS
        ========================================================= */}
        <div className="xl:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">
                    Sinh viên đã xác minh
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Chọn nhanh sinh viên để cấp chứng chỉ
                  </p>
                </div>

                <div className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-lg">
                  {students.length}
                </div>
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, MSSV, email..."
                className="mt-4 w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="max-h-162.5 overflow-y-auto">
              {studentsLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Đang tải danh sách sinh viên...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Không có sinh viên phù hợp.
                </div>
              ) : (
                filteredStudents.map((student, index) => {
                  const active =
                    studentSelected?.walletAddress ===
                    student.walletAddress;

                  return (
                    <button
                      key={student.walletAddress || student.id || `student-btn-${index}`}
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full text-left p-4 border-b border-gray-100 transition ${
                        active
                          ? "bg-indigo-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {student.fullName || "Unknown"}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            MSSV: {student.studentId || "---"}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            {student.email || "---"}
                          </p>
                        </div>

                        <div className="text-[11px] font-mono text-gray-400">
                          {student.walletAddress
                            ? `${student.walletAddress.slice(
                                0,
                                6
                              )}...${student.walletAddress.slice(-4)}`
                            : "---"}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT - ISSUE FORM
        ========================================================= */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            {/* SEARCH MSSV */}
            <div className="mb-6 relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tìm sinh viên theo MSSV
              </label>

              <input
                type="text"
                value={mssvQuery}
                onChange={(e) => {
                  setMssvQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Nhập MSSV để tìm nhanh..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              />

              {showSuggestions && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  {candidateLoading ? (
                    <div className="p-4 text-sm text-gray-500">
                      Đang tìm kiếm...
                    </div>
                  ) : studentCandidates.length === 0 ? (
                    <div className="p-4 text-sm text-gray-400">
                      Không tìm thấy sinh viên.
                    </div>
                  ) : (
                    studentCandidates.map((student, idx) => (
                      <button
                        key={student.walletAddress || student.id || `candidate-${idx}`}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-none"
                      >
                        <p className="font-medium text-gray-900">
                          {student.fullName}
                        </p>

                        <p className="text-sm text-gray-500">
                          MSSV: {student.studentId}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {student.email}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* STUDENT INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên sinh viên
                </label>

                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nguyen Van A"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  MSSV
                </label>

                <input
                  type="text"
                  value={studentId}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>

                <input
                  type="text"
                  value={studentEmail}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  University
                </label>

                <input
                  type="text"
                  value={studentUniversity}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-600"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Wallet Address
              </label>

              <input
                type="text"
                value={studentAddress}
                onChange={(e) =>
                  setStudentAddress(e.target.value)
                }
                placeholder="0x..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* FILE */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                File chứng chỉ
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-indigo-400 transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="certificate-file"
                />

                <label
                  htmlFor="certificate-file"
                  className="cursor-pointer"
                >
                  <svg
                    className="mx-auto text-gray-400 mb-3"
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>

                  <p className="text-sm text-gray-700 font-medium">
                    {file
                      ? file.name
                      : "Chọn file hoặc kéo thả vào đây"}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    PDF, PNG, JPG — tối đa 10MB
                  </p>
                </label>
              </div>
            </div>

            {/* ACTION */}
            <button
              onClick={handleIssue}
              disabled={loading || isBlocked}
              className={`w-full font-semibold py-3 rounded-xl transition ${
                isBlocked
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : loading
                    ? "bg-indigo-600 text-white opacity-50"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {isBlocked
                ? "Action blocked — account not active"
                : loading
                  ? "Đang phát hành..."
                  : "Xác nhận phát hành"}
            </button>

            {/* ALERTS */}
            {error && (
              <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
                {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCertificate;