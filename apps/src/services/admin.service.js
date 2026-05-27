import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLLECTIONS = {
  universities: "universities",
  students: "students",
};

const STUDENT_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

const UNIVERSITY_STATUS = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  REVOKED: "revoked",
};

/**
 * Calculate monthly activity from items with createdAt field
 */
const calculateMonthlyActivity = (items, dateField = "createdAt") => {
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

export const getAdminStatistics = async () => {
  try {
    // Fetch all collections concurrently
    const [universitiesSnap, studentsSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.universities)),
      getDocs(collection(db, COLLECTIONS.students)),
    ]);

    const totalUniversities = universitiesSnap.size;
    const totalStudents = studentsSnap.size;

    // Filter students by status
    const verifiedStudentsQuery = query(
      collection(db, COLLECTIONS.students),
      where("status", "==", STUDENT_STATUS.VERIFIED)
    );
    const pendingStudentsQuery = query(
      collection(db, COLLECTIONS.students),
      where("status", "==", STUDENT_STATUS.PENDING)
    );
    const rejectedStudentsQuery = query(
      collection(db, COLLECTIONS.students),
      where("status", "==", STUDENT_STATUS.REJECTED)
    );

    const [verifiedSnap, pendingSnap, rejectedSnap] = await Promise.all([
      getDocs(verifiedStudentsQuery),
      getDocs(pendingStudentsQuery),
      getDocs(rejectedStudentsQuery),
    ]);

    const verifiedStudents = verifiedSnap.size;
    const pendingStudents = pendingSnap.size;
    const rejectedStudents = rejectedSnap.size;

    const universitiesData = universitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const allStudentsData = studentsSnap.docs.map(doc => doc.data());

    // Count universities by status (with backward compatibility)
    let activeUniversities = 0;
    let suspendedUniversities = 0;
    let revokedUniversities = 0;
    let pendingUniversities = 0;

    universitiesData.forEach(uni => {
      const status = uni.status || "active"; // Default to active for backward compatibility
      switch (status) {
        case UNIVERSITY_STATUS.ACTIVE:
          activeUniversities++;
          break;
        case UNIVERSITY_STATUS.SUSPENDED:
          suspendedUniversities++;
          break;
        case UNIVERSITY_STATUS.REVOKED:
          revokedUniversities++;
          break;
        default:
          activeUniversities++;
      }
    });

    const universityStatistics = universitiesData.map(uni => {
      const uniStudents = allStudentsData.filter(student => student.universityWallet === uni.walletAddress);
      const totalUniStudents = uniStudents.length;
      const verifiedUniStudents = uniStudents.filter(student => student.status === STUDENT_STATUS.VERIFIED).length;
      const pendingUniStudents = uniStudents.filter(student => student.status === STUDENT_STATUS.PENDING).length;
      const rejectedUniStudents = uniStudents.filter(student => student.status === STUDENT_STATUS.REJECTED).length;

      return {
        universityName: uni.name,
        walletAddress: uni.walletAddress,
        allowedDomain: uni.allowedDomain,
        status: uni.status || "active", // Ensure status field exists
        totalStudents: totalUniStudents,
        verifiedStudents: verifiedUniStudents,
        pendingStudents: pendingUniStudents,
        rejectedStudents: rejectedUniStudents,
      };
    });

    // Calculate monthly activity trends
    const monthlyStudentActivity = calculateMonthlyActivity(allStudentsData, "createdAt");
    const monthlyVerifiedActivity = calculateMonthlyActivity(
      allStudentsData.filter(s => s.status === STUDENT_STATUS.VERIFIED),
      "verifiedAt"
    );

    return {
      totalUniversities,
      totalStudents,
      verifiedStudents,
      pendingStudents,
      rejectedStudents,
      universityStatistics,
      // University status breakdown
      activeUniversities,
      suspendedUniversities,
      revokedUniversities,
      pendingUniversities,
      // Monthly activity trends for charts
      monthlyStudentActivity,
      monthlyVerifiedActivity,
    };
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    throw error;
  }
};
