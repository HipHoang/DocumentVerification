import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLLECTIONS = {
  universities: "universities",
  students: "students",
};

// Firestore schema uses lowercase statuses per spec
const STUDENT_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
};


const normalizeWallet = (wallet) => (wallet ? wallet.toLowerCase() : "");

const getStudentDocId = (walletAddress) => `wallet_${normalizeWallet(walletAddress)}`;

const getStudentByWalletDocRef = (walletAddress) => {
  const id = getStudentDocId(walletAddress);
  return doc(db, COLLECTIONS.students, id);
};

export const registerStudent = async ({
  fullName,
  studentId,
  universityWallet,
  walletAddress,
  studentEmail,
}) => {
  if (!walletAddress) throw new Error("Wallet address is required");
  if (!studentEmail) throw new Error("Student email is required");
  if (!fullName?.trim()) throw new Error("Full name is required");
  if (!studentId?.trim()) throw new Error("Student ID (MSSV) is required");
  if (!universityWallet) throw new Error("University wallet is required");

  const walletNorm = normalizeWallet(walletAddress);

  const existingStudentSnap = await getDoc(getStudentByWalletDocRef(walletNorm));
  if (existingStudentSnap.exists()) {
    throw new Error("This wallet has already registered.");
  }

  const studentRef = doc(db, COLLECTIONS.students, "wallet_" + walletNorm);

  const studentData = {
    fullName: fullName.trim(),
    studentId: studentId.trim(),
    studentEmail: studentEmail.trim(),
    walletAddress: walletNorm,
      universityWallet: normalizeWallet(universityWallet),
    status: STUDENT_STATUS.PENDING,
    createdAt: serverTimestamp(),
  };

  await setDoc(studentRef, studentData);

  return { walletAddress: walletNorm, status: STUDENT_STATUS.PENDING };
};


export const getPendingStudents = async () => {
  const q = query(
    collection(db, COLLECTIONS.students),
    where("status", "==", STUDENT_STATUS.PENDING)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};


export const approveStudent = async (walletAddress) => {
  if (!walletAddress) throw new Error("walletAddress required");
  const ref = getStudentByWalletDocRef(walletAddress);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Student not found");
  await updateDoc(ref, { status: STUDENT_STATUS.VERIFIED, verifiedAt: serverTimestamp() });
};

export const rejectStudent = async (walletAddress) => {
  if (!walletAddress) throw new Error("walletAddress required");
  const ref = getStudentByWalletDocRef(walletAddress);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Student not found");
  await updateDoc(ref, { status: STUDENT_STATUS.REJECTED, rejectedAt: serverTimestamp() });
};

export const getVerifiedStudents = async () => {
  const q = query(
    collection(db, COLLECTIONS.students),
    where("status", "==", STUDENT_STATUS.VERIFIED)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// University operation: remove verified student access only (no blockchain changes).
// Uses operational Firestore workflow state.
export const removeVerifiedStudentAccess = async (walletAddress, newStatus = "removed") => {
  try {
    if (!walletAddress) throw new Error("walletAddress required");

    const normalized = normalizeWallet(walletAddress);
    if (!normalized) throw new Error("Invalid walletAddress");

    const ref = getStudentByWalletDocRef(normalized);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Student not found");

    // Only allow known operational states; keep it permissive for backward compatibility.
    const allowed = ["removed", "revoked"];
    const statusToSet = allowed.includes(newStatus) ? newStatus : "removed";

    await updateDoc(ref, {
      status: statusToSet,
      updatedAt: serverTimestamp(),
    });

    return { success: true, status: statusToSet };
  } catch (err) {
    console.error("[student.service] removeVerifiedStudentAccess error:", err);
    throw err;
  }
};

export const searchStudentsByMSSV = async (mssvPrefix, limit = 10) => {
  const prefix = (mssvPrefix || "").trim();
  if (!prefix) return [];

  // Firestore prefix search on string field using range query
  // Note: This requires no additional indexed ordering for simple ranges.
  const end = prefix + "\uf8ff";

  const q = query(
    collection(db, COLLECTIONS.students),
    where("status", "==", STUDENT_STATUS.VERIFIED),
    where("studentId", ">=", prefix),
    where("studentId", "<=", end)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, limit);
};


export const getStudentByWallet = async (walletAddress) => {
  if (!walletAddress) return null;
  const ref = getStudentByWalletDocRef(walletAddress);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const getUniversities = async () => {
  const snap = await getDocs(collection(db, COLLECTIONS.universities));
  return snap.docs.map((d) => {
    const data = d.data();

    return {
  id: normalizeWallet(data.walletAddress),
  ...data,

      // backward compatibility
      email: data.studentEmail || "",
      universityId: data.universityWallet || "",
      universityName: data.universityName || "",
    };
  });
};

export const isEmailDomainAllowed = async ({ universityId, email: studentEmail }) => {
  if (!universityId || !studentEmail) return false;

  // universityId is the normalized wallet address (from getUniversities())
  // Query by walletAddress field since Firestore uses auto-generated document IDs
  const q = query(
    collection(db, COLLECTIONS.universities),
    where("walletAddress", "==", universityId.toLowerCase())
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return false;
  }

  const uniDoc = snap.docs[0];
  const uniData = uniDoc.data();
  const allowedDomain = uniData?.allowedDomain || uniData?.emailDomain;

  // Normalize: lowercase, trim, remove leading @
  const normalizeDomain = (domain) => {
    if (!domain) return "";
    return String(domain)
      .toLowerCase()
      .trim()
      .replace(/^@/, "");
  };

  const userDomain = normalizeDomain(studentEmail.split("@").pop());
  const normalizedAllowedDomain = normalizeDomain(allowedDomain);

  return userDomain === normalizedAllowedDomain && userDomain !== "";
};

export const getVerifiedStudentsByUniversity = async (
  universityWallet
) => {
  try {
    const q = query(
      collection(db, "students"),
      where(
  "universityWallet",
  "==",
  normalizeWallet(universityWallet)
),
      where("status", "==", "verified")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const getPendingStudentsByUniversity = async (
  universityWallet
) => {
  if (!universityWallet) return [];

  const q = query(
    collection(db, COLLECTIONS.students),
    where("status", "==", STUDENT_STATUS.PENDING),
    where("universityWallet", "==", universityWallet.toLowerCase())
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};