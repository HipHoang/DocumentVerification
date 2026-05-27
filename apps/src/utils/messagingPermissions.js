/**
 * Messaging Permission Matrix for DocumentVerification platform.
 *
 * Enforces strict role-based conversation rules:
 *
 * Allowed conversations:
 *   pending_student  <->  assigned university
 *   pending_student  <->  admin
 *   verified_student <->  university
 *   verified_student <->  admin
 *   university       <->  admin
 *
 * Forbidden conversations:
 *   public                        → no messaging access at all
 *   student <-> random student    → forbidden
 *   student <-> unrelated university → forbidden
 */

// Who can access the messaging system at all
export const MESSAGING_ACCESS_ROLES = [
  "admin",
  "university",
  "pending_student",
  "verified_student",
];

// Permission matrix: can role A message role B?
// true = allowed, false = forbidden
const PERMISSION_MATRIX = {
  pending_student: {
    pending_student: false, // student ↔ student forbidden
    verified_student: false,
    university: true, // pending_student → assigned university only (enforced at query level)
    admin: true,
    public: false,
  },
  verified_student: {
    pending_student: false,
    verified_student: false,
    university: true,
    admin: true,
    public: false,
  },
  university: {
    pending_student: true,
    verified_student: true,
    university: false, // university ↔ university forbidden unless admin
    admin: true,
    public: false,
  },
  admin: {
    pending_student: true,
    verified_student: true,
    university: true,
    admin: true, // admin can message other admins
    public: false,
  },
  public: {
    pending_student: false,
    verified_student: false,
    university: false,
    admin: false,
    public: false,
  },
};

/**
 * Returns true if the user's role allows accessing the messaging system.
 */
export function canAccessMessaging(role) {
  return MESSAGING_ACCESS_ROLES.includes(role);
}

/**
 * Returns true if role A is allowed to chat with role B.
 * Does NOT verify university-assignment relationship.
 * Use canInitiateChat() for full permission check.
 */
export function rolesCanMessage(roleA, roleB) {
  const roleANormalized = roleA?.toLowerCase() || "public";
  const roleBNormalized = roleB?.toLowerCase() || "public";
  const matrix = PERMISSION_MATRIX[roleANormalized];
  if (!matrix) return false;
  return matrix[roleBNormalized] === true;
}

/**
 * Full chat permission check.
 * Verifies both role-based permission AND university assignment.
 *
 * @param {object} sender - { role, walletAddress, universityWallet? }
 * @param {object} target - { role, walletAddress }
 * @param {string|null} senderUniversityWallet - sender's assigned university (if student)
 * @param {string|null} targetUniversityWallet - target's assigned university (if student)
 */
export function canInitiateChat(
  sender,
  target,
  senderUniversityWallet = null,
  targetUniversityWallet = null
) {
  if (!canAccessMessaging(sender.role)) return false;
  if (!canAccessMessaging(target.role)) return false;

  // Role-level check
  if (!rolesCanMessage(sender.role, target.role)) return false;

  // University-specific enforcement:
  // If sender is a student, they can only message their assigned university
  if (
    (sender.role === "pending_student" || sender.role === "verified_student") &&
    target.role === "university"
  ) {
    if (
      !senderUniversityWallet ||
      senderUniversityWallet.toLowerCase() !== target.walletAddress.toLowerCase()
    ) {
      return false; // Student cannot message unrelated university
    }
  }

  // If target is a student, they can only be messaged by their assigned university
  if (
    (target.role === "pending_student" || target.role === "verified_student") &&
    sender.role === "university"
  ) {
    if (
      !targetUniversityWallet ||
      targetUniversityWallet.toLowerCase() !== sender.walletAddress.toLowerCase()
    ) {
      return false; // University cannot message unrelated student
    }
  }

  return true;
}

/**
 * Given a user's role and wallet, returns array of roles they can initiate chats with.
 */
export function getAllowedTargetRoles(role) {
  const matrix = PERMISSION_MATRIX[role?.toLowerCase() || "public"];
  if (!matrix) return [];
  return Object.entries(matrix)
    .filter(([, allowed]) => allowed === true)
    .map(([targetRole]) => targetRole);
}

/**
 * Returns display-friendly label for a role.
 */
export function getRoleLabel(role) {
  const labels = {
    admin: "Quản trị viên",
    university: "Trường Đại học",
    pending_student: "Sinh viên (chờ duyệt)",
    verified_student: "Sinh viên đã xác thực",
    public: "Công khai",
  };
  return labels[role] || role;
}

/**
 * Returns short badge label for a role.
 */
export function getRoleBadge(role) {
  const labels = {
    admin: "Admin",
    university: "Trường",
    pending_student: "Chờ duyệt",
    verified_student: "Đã Xác thực",
  };
  return labels[role] || role;
}

/**
 * Returns color class for role badge.
 */
export function getRoleBadgeColor(role) {
  const colors = {
    admin: "bg-purple-100 text-purple-700",
    university: "bg-blue-100 text-blue-700",
    pending_student: "bg-yellow-100 text-yellow-700",
    verified_student: "bg-green-100 text-green-700",
  };
  return colors[role] || "bg-gray-100 text-gray-700";
}

/**
 * Determines conversation type based on participant roles.
 */
export function getConversationType(participantRoles) {
  const roles = Object.values(participantRoles);
  if (roles.includes("admin")) return "admin_support";
  if (roles.includes("university") && roles.includes("pending_student")) return "verification_request";
  if (roles.includes("university") && roles.includes("verified_student")) return "verification_support";
  return "general";
}

/**
 * Generates a consistent conversation ID for a pair of wallets.
 * Wallets are sorted alphabetically to ensure deterministic IDs.
 */
export function generateConversationId(wallet1, wallet2) {
  const sorted = [wallet1.toLowerCase(), wallet2.toLowerCase()].sort();
  return sorted.join("_");
}