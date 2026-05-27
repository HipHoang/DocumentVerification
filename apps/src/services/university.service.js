import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export const addUniversityToFirestore = async (name, walletAddress, allowedDomain, address) => {
  try {
    const docRef = await addDoc(collection(db, "universities"), {
      name,
      walletAddress: walletAddress.toLowerCase(),
      allowedDomain,
      address,
      status: "active",
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (e) {
    console.error("Error adding university document: ", e);
    return { success: false, error: e };
  }
};

export const deleteUniversityFromFirestore = async (walletAddress) => {
  try {
    if (!walletAddress) {
      throw new Error("Wallet address is required to delete university");
    }

    const q = query(
      collection(db, "universities"),
      where("walletAddress", "==", walletAddress.toLowerCase())
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No university found with wallet address: ${walletAddress}`);
      return { success: true, message: "University not found in Firestore (already deleted or never existed)" };
    }

    const deletePromises = [];
    querySnapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(db, "universities", docSnapshot.id)));
    });

    await Promise.all(deletePromises);
    return { success: true, message: "University deleted from Firestore" };
  } catch (e) {
    console.error("Error deleting university document: ", e);
    return { success: false, error: e };
  }
};

export const getAllUniversities = async () => {
  try {
    const snap = await getDocs(collection(db, "universities"));

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      status: doc.data().status || "active",
    }));
  } catch (e) {
    console.error("Error fetching universities:", e);
    return [];
  }
};

export const getUniversityStatus = async (walletAddress) => {
  try {
    if (!walletAddress) return "unknown";

    const q = query(
      collection(db, "universities"),
      where("walletAddress", "==", walletAddress.toLowerCase())
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return "unknown";
    }

    const docData = querySnapshot.docs[0].data();
    return docData.status || "active";
  } catch (e) {
    console.error("[getUniversityStatus] Error:", e);
    return "unknown";
  }
};

export const updateUniversityStatus = async (walletAddress, newStatus) => {
  try {
    if (!walletAddress) {
      throw new Error("Wallet address is required to update university status");
    }

    const validStatuses = ["active", "suspended", "revoked"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const q = query(
      collection(db, "universities"),
      where("walletAddress", "==", walletAddress.toLowerCase())
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: "University not found in Firestore" };
    }

    const updatePromises = [];
    querySnapshot.forEach((docSnapshot) => {
      updatePromises.push(
        updateDoc(doc(db, "universities", docSnapshot.id), {
          status: newStatus,
          updatedAt: serverTimestamp(),
        })
      );
    });

    await Promise.all(updatePromises);
    return { success: true, message: `University status updated to ${newStatus}` };
  } catch (e) {
    console.error("Error updating university status:", e);
    return { success: false, error: e.message || "Failed to update status" };
  }
};

export const suspendUniversity = async (walletAddress) => {
  return updateUniversityStatus(walletAddress, "suspended");
};

export const activateUniversity = async (walletAddress) => {
  return updateUniversityStatus(walletAddress, "active");
};

export const revokeUniversity = async (walletAddress) => {
  return updateUniversityStatus(walletAddress, "revoked");
};

const normalizeWalletAddress = (address) => {
  if (!address) return "";
  return address.toLowerCase();
};

const getStudentsByUniversity = async (universityWallet) => {
  try {
    const normalizedWallet = normalizeWalletAddress(universityWallet);
    if (!normalizedWallet) {
      return [];
    }

    const studentsRef = collection(db, "students");
    const q = query(
      studentsRef,
      where("universityWallet", "==", normalizedWallet)
    );

    const querySnapshot = await getDocs(q);
    const students = [];
    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });

    return students;
  } catch (error) {
    console.error("Error fetching students by university:", error);
    if (error.code === "failed-precondition") {
      return await getAllStudentsFiltered(universityWallet);
    }
    return [];
  }
};

const getAllStudentsFiltered = async (universityWallet) => {
  try {
    const normalizedWallet = normalizeWalletAddress(universityWallet);
    const studentsRef = collection(db, "students");
    const querySnapshot = await getDocs(studentsRef);
    const students = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.universityWallet?.toLowerCase() === normalizedWallet) {
        students.push({ id: doc.id, ...data });
      }
    });
    return students;
  } catch (error) {
    console.error("Error fetching all students:", error);
    return [];
  }
};

const calculateMonthlyActivity = (items, dateField) => {
  const monthlyData = {};

  const today = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthName = date.toLocaleString("en", {
      month: "short",
      year: "numeric",
    });
    months.push({ key: monthKey, name: monthName, count: 0 });
  }

  items.forEach((item) => {
    const date = item[dateField];
    if (date) {
      const jsDate = date.toDate ? date.toDate() : new Date(date);
      const monthKey = `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, "0")}`;
      const month = months.find((m) => m.key === monthKey);
      if (month) {
        month.count++;
      }
    }
  });

  return months;
};

export const getUniversityAnalytics = async (universityWallet) => {
  try {
    const students = await getStudentsByUniversity(universityWallet);

    const verifiedStudents = students.filter(
      (s) => s.status === "verified"
    );
    const pendingStudents = students.filter(
      (s) => s.status === "pending"
    );
    const rejectedStudents = students.filter(
      (s) => s.status === "rejected"
    );

    const recentlyVerified = verifiedStudents
      .sort((a, b) => {
        const dateA = a.verifiedAt?.toDate
          ? a.verifiedAt.toDate().getTime()
          : new Date(a.verifiedAt || 0).getTime();
        const dateB = b.verifiedAt?.toDate
          ? b.verifiedAt.toDate().getTime()
          : new Date(b.verifiedAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    const monthlyStudentActivity = calculateMonthlyActivity(
      students,
      "createdAt"
    );

    const statusDistribution = [
      { name: "Verified", value: verifiedStudents.length, color: "#10B981" },
      { name: "Pending", value: pendingStudents.length, color: "#F59E0B" },
      { name: "Rejected", value: rejectedStudents.length, color: "#EF4444" },
    ];

    const result = {
      totalVerified: verifiedStudents.length,
      totalPending: pendingStudents.length,
      totalRejected: rejectedStudents.length,
      totalCertificates: 0,
      recentlyVerified,
      recentCertificates: [],
      statusDistribution,
      monthlyStudentActivity,
      monthlyCertificateActivity: [],
      rawStudents: students,
      rawCertificates: [],
    };

    return result;
  } catch (error) {
    console.error("Error fetching university analytics:", error);
    return null;
  }
};

export const getUniversityName = async (universityWallet) => {
  try {
    const normalizedWallet = normalizeWalletAddress(universityWallet);
    if (!normalizedWallet) return "Unknown University";

    const q = query(
      collection(db, "universities"),
      where("walletAddress", "==", normalizedWallet)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return "Unknown University";
    }

    const data = querySnapshot.docs[0].data();
    return data.name || "Unknown University";
  } catch (error) {
    console.error("Error fetching university name:", error);
    return "Unknown University";
  }
};