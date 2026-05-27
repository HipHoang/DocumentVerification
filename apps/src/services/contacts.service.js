import {
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Normalize wallet address to lowercase.
 */
const normalize = (wallet) => (wallet ? wallet.toLowerCase() : "");

/**
 * ================================
 * BUSINESS CONTACT DISCOVERY
 * ================================
 *
 * This service queries ONLY business-related users.
 * No global search. No arbitrary user lookup.
 *
 * Collections used:
 *   - "students"   : { walletAddress, universityWallet, status, fullName, ... }
 *   - "universities": { walletAddress, name, allowedDomain, ... }
 */

/**
 * Get all allowed contacts for a user based on their role and business relationships.
 * Admin support is ALWAYS injected at position 0 for non-admin users.
 *
 * IMPORTANT: The admin contact uses a special flag wallet "admin_support" as a UI hint.
 * When creating the conversation via findOrCreateConversation, the MessagingPage
 * resolves "admin_support" to the current signed-in admin's real wallet address.
 *
 * The "admin_support" placeholder is NEVER duplicated. If the contacts already
 * include a contact with role "admin", no additional admin_support is added.
 *
 * Returns array of { walletAddress, role, displayName, sourceType }
 *
 * @param {object} currentUser - { walletAddress, role, studentUniversityId? }
 * @returns {Promise<Array>}
 */
export async function getAllowedContacts(currentUser) {
  if (!currentUser?.walletAddress || !currentUser?.role) return [];

  const { role, walletAddress, studentUniversityId } = currentUser;
  const normalizedWallet = normalize(walletAddress);

  let contacts = [];

  switch (role) {
    case "admin":
      contacts = await getAdminContacts(normalizedWallet);
      break;

    case "university":
      contacts = await getUniversityContacts(normalizedWallet);
      break;

    case "pending_student":
    case "verified_student":
      contacts = await getStudentContacts(normalizedWallet, studentUniversityId);
      break;

    default:
      return [];
  }

  // Inject admin support at top for non-admin users
  // "admin_support" placeholder is used so MessagingPage can resolve it.
  // CRITICAL: Only inject if no existing admin contact is already present.
  if (role !== "admin") {
    const adminExists = contacts.some(
      (c) => c.role === "admin" || c.sourceType === "admin_support"
    );
    if (!adminExists) {
      contacts.unshift({
        walletAddress: "admin_support", // special flag, resolved at conversation creation
        role: "admin",
        displayName: "Hỗ trợ hệ thống",
        sourceType: "admin_support",
      });
    }
  }

  return contacts;
}

/**
 * Admin: can contact all universities + all students with pending/verified status.
 * We limit to avoid overwhelming the UI. Admin can always create new conversations
 * from the existing conversation list.
 */
async function getAdminContacts(adminWallet) {
  const contacts = [];

  try {
    // Get all active universities
    const uniQuery = query(
      collection(db, "universities"),
      where("status", "==", "active")
    );
    const uniSnap = await getDocs(uniQuery);
    uniSnap.forEach((d) => {
      const data = d.data();
      const uniWallet = normalize(data.walletAddress);
      if (uniWallet && uniWallet !== adminWallet) {
        contacts.push({
          walletAddress: uniWallet,
          role: "university",
          displayName: data.name || uniWallet.slice(0, 6),
          sourceType: "university",
        });
      }
    });

    // Get recent students (limit to 20 for performance)
    const studentQuery = query(
      collection(db, "students"),
      where("status", "in", ["pending", "verified"]),
      limit(20)
    );
    const studentSnap = await getDocs(studentQuery);
    studentSnap.forEach((d) => {
      const data = d.data();
      const studentWallet = normalize(data.walletAddress);
      if (studentWallet && studentWallet !== adminWallet) {
        contacts.push({
          walletAddress: studentWallet,
          role: data.status === "pending" ? "pending_student" : "verified_student",
          displayName: data.fullName || studentWallet.slice(0, 6),
          sourceType: "student",
          universityWallet: normalize(data.universityWallet),
        });
      }
    });
  } catch (err) {
    console.error("[contacts.service] getAdminContacts error:", err);
  }

  return contacts;
}

/**
 * University: can contact their own students (pending + verified) + admin.
 */
async function getUniversityContacts(uniWallet) {
  const contacts = [];

  try {
    // Get own students (pending + verified)
    const studentQuery = query(
      collection(db, "students"),
      where("universityWallet", "==", uniWallet),
      where("status", "in", ["pending", "verified"])
    );
    const studentSnap = await getDocs(studentQuery);
    studentSnap.forEach((d) => {
      const data = d.data();
      const studentWallet = normalize(data.walletAddress);
      if (studentWallet && studentWallet !== uniWallet) {
        contacts.push({
          walletAddress: studentWallet,
          role: data.status === "pending" ? "pending_student" : "verified_student",
          displayName: data.fullName || studentWallet.slice(0, 6),
          sourceType: "student",
          universityWallet: uniWallet,
        });
      }
    });
  } catch (err) {
    console.error("[contacts.service] getUniversityContacts error:", err);
  }

  return contacts;
}

/**
 * Student (pending or verified): can contact their assigned university + admin.
 *
 * The studentUniversityId comes from the AuthContext (studentUniversityId field).
 * If it's not available, we fall back to querying the students collection.
 */
async function getStudentContacts(studentWallet, studentUniversityId) {
  const contacts = [];

  // Determine the university wallet
  let universityWallet = studentUniversityId
    ? normalize(studentUniversityId)
    : null;

  // Fallback: query students collection if we don't have the university from context
  if (!universityWallet) {
    try {
      const studentQuery = query(
        collection(db, "students"),
        where("walletAddress", "==", studentWallet)
      );
      const studentSnap = await getDocs(studentQuery);
      if (!studentSnap.empty) {
        const data = studentSnap.docs[0].data();
        universityWallet = normalize(data.universityWallet);
      }
    } catch (err) {
      console.error("[contacts.service] getStudentContacts fallback error:", err);
    }
  }

  // Add the assigned university as a contact
  if (universityWallet) {
    try {
      // Try to get university name
      const uniQuery = query(
        collection(db, "universities"),
        where("walletAddress", "==", universityWallet)
      );
      const uniSnap = await getDocs(uniQuery);
      let uniName = universityWallet.slice(0, 6);
      if (!uniSnap.empty) {
        uniName = uniSnap.docs[0].data().name || uniName;
      }

      contacts.push({
        walletAddress: universityWallet,
        role: "university",
        displayName: uniName,
        sourceType: "assigned_university",
      });
    } catch (err) {
      console.error("[contacts.service] getStudentContacts uni lookup error:", err);
    }
  }

  return contacts;
}

/**
 * Check if a contact already has an existing conversation with the current user.
 * Used to filter out contacts that already have conversations.
 *
 * @param {Array} conversations - existing conversation list
 * @param {string} contactWallet - the contact's wallet address
 * @returns {boolean}
 */
export function hasExistingConversation(conversations, contactWallet) {
  if (!conversations?.length || !contactWallet) return false;
  const normalized = normalize(contactWallet);
  return conversations.some((conv) =>
    conv.participants?.some((p) => p === normalized)
  );
}

/**
 * Check if an admin support conversation already exists for the current user.
 * The admin_support placeholder never matches a real wallet in participants,
 * so we detect by checking if any conversation has an admin participant.
 * 
 * This also checks the type field to catch all admin_support conversations.
 */
function hasExistingAdminConversation(conversations) {
  if (!conversations?.length) return false;
  return conversations.some((conv) => {
    const hasAdminRole = Object.values(conv.participantRoles || {}).includes("admin");
    const isAdminType = conv.type === "admin_support";
    return hasAdminRole || isAdminType;
  });
}

/**
 * Filter out contacts that already have conversations.
 *
 * @param {Array} contacts - list of suggested contacts
 * @param {Array} conversations - existing conversation list
 * @returns {Array} - contacts without existing conversations
 */
export function filterNewContacts(contacts, conversations) {
  if (!contacts?.length) return [];
  if (!conversations?.length) return contacts;
  return contacts.filter((c) => {
    // Admin support placeholder: check if any admin conversation already exists
    if (c.sourceType === "admin_support" || c.walletAddress === "admin_support") {
      return !hasExistingAdminConversation(conversations);
    }
    return !hasExistingConversation(conversations, c.walletAddress);
  });
}
