import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  setDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { generateConversationId, canInitiateChat } from "../utils/messagingPermissions";

const CONVERSATIONS_COLLECTION = "conversations";
const MESSAGES_SUBCOLLECTION = "messages";

/**
 * Normalize wallet address to lowercase for consistent Firestore queries.
 * IMPORTANT: This is applied EVERYWHERE to ensure matching.
 */
const normalizeWallet = (wallet) => {
  if (!wallet) return "";
  return wallet.toLowerCase();
};

/**
 * SECTION A: CONVERSATION SCHEMA
 *
 * {
 *   participants: [wallet1, wallet2],           // ARRAY for array-contains queries
 *   participantRoles: { wallet1: "role", ... },  // Role for each participant
 *   participantsInfo: {                          // Rich metadata (avoids extra lookups)
 *     wallet1: {
 *       displayName: "Nguyễn Văn A",             // Human-readable name
 *       role: "verified_student",
 *     },
 *   },
 *   participantNames: { wallet1: "Name", ... },  // Legacy fallback
 *   lastMessage: "text",
 *   lastMessageAt: <Timestamp>,
 *   unreadCountBy: { wallet1: 0, wallet2: 0 },  // Per-wallet unread counter
 *   type: "verification_support" | "admin_support",
 *   universityId: "0x..." | null,
 *   studentId: "0x..." | null,
 *   createdAt: <Timestamp>,
 *   relatedCertificateHash: "..." | null,
 * }
 */

/**
 * Build a consistent participantsInfo map.
 */
function buildParticipantsInfo(wallet1, role1, name1, wallet2, role2, name2) {
  const w1 = normalizeWallet(wallet1);
  const w2 = normalizeWallet(wallet2);
  return {
    [w1]: { displayName: name1 || w1.slice(0, 6), role: role1 },
    [w2]: { displayName: name2 || w2.slice(0, 6), role: role2 },
  };
}

/**
 * ============================
 * CONVERSATION OPERATIONS
 * ============================
 */

/**
 * Check if a conversation of type "admin_support" already exists
 * for the given user wallet. Prevents duplicate admin conversations.
 */
async function findExistingAdminConversation(userWallet) {
  const normalizedWallet = normalizeWallet(userWallet);
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where("participants", "array-contains", normalizedWallet),
    where("type", "==", "admin_support")
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].id;
  }
  return null;
}

/**
 * Get or create a conversation between two participants.
 * Uses deterministic conversation ID to avoid duplicates.
 *
 * @param {object} currentUser - { walletAddress, role, universityWallet? }
 * @param {object} targetUser - { walletAddress, role, universityWallet?, displayName? }
 * @param {string} [relatedCertificateHash] - optional certificate hash
 * @returns {Promise<{ conversationId: string, isNew: boolean }>}
 */
export async function getOrCreateConversation(
  currentUser,
  targetUser,
  relatedCertificateHash = null
) {
  const senderWallet = normalizeWallet(currentUser.walletAddress);
  const targetWallet = normalizeWallet(targetUser.walletAddress);

  if (senderWallet === targetWallet) {
    throw new Error("Cannot create conversation with yourself");
  }

  // Permission check
  const senderUniversityWallet = currentUser.universityWallet
    ? normalizeWallet(currentUser.universityWallet)
    : null;
  const targetUniversityWallet = targetUser.universityWallet
    ? normalizeWallet(targetUser.universityWallet)
    : null;

  if (
    !canInitiateChat(
      { role: currentUser.role, walletAddress: senderWallet },
      { role: targetUser.role, walletAddress: targetWallet },
      senderUniversityWallet,
      targetUniversityWallet
    )
  ) {
    throw new Error("You are not allowed to start a conversation with this user");
  }

  // Guard: if target is admin, check if an admin_support conversation already exists
  if (targetUser.role === "admin" || targetUser.role === "admin_support") {
    const existingId = await findExistingAdminConversation(senderWallet);
    if (existingId) {
      return { conversationId: existingId, isNew: false };
    }
  }

  const conversationId = generateConversationId(senderWallet, targetWallet);
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const convSnap = await getDoc(convRef);

  if (convSnap.exists()) {
    return { conversationId, isNew: false };
  }

  const participantRoles = {
    [senderWallet]: currentUser.role,
    [targetWallet]: targetUser.role,
  };

  const senderName = currentUser.displayName || senderWallet.slice(0, 6);
  const targetName = targetUser.displayName || targetWallet.slice(0, 6);

  const participantsInfo = buildParticipantsInfo(
    senderWallet, currentUser.role, senderName,
    targetWallet, targetUser.role, targetName
  );

  // Determine conversation type and IDs
  let universityId = null;
  let studentId = null;
  let convType = "verification_support";

  if (currentUser.role === "admin" || targetUser.role === "admin") {
    convType = "admin_support";
  }

  if (
    currentUser.role === "university" &&
    (targetUser.role === "pending_student" || targetUser.role === "verified_student")
  ) {
    universityId = senderWallet;
    studentId = targetWallet;
  } else if (
    targetUser.role === "university" &&
    (currentUser.role === "pending_student" || currentUser.role === "verified_student")
  ) {
    universityId = targetWallet;
    studentId = senderWallet;
  }

  await setDoc(convRef, {
    participants: [senderWallet, targetWallet],
    participantRoles,
    participantNames: {
      [senderWallet]: senderName,
      [targetWallet]: targetName,
    },
    participantsInfo,
    type: convType,
    universityId,
    studentId,
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    relatedCertificateHash: relatedCertificateHash || null,
    unreadCountBy: {
      [senderWallet]: 0,
      [targetWallet]: 0,
    },
  });

  return { conversationId, isNew: true };
}

/**
 * Fetch all conversations for a given user.
 */
export async function getConversations(walletAddress) {
  if (!walletAddress) return [];
  const normalizedWallet = normalizeWallet(walletAddress);
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where("participants", "array-contains", normalizedWallet),
    orderBy("lastMessageAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * ADMIN_SUPPORT_PLACEHOLDER - used in participants array for admin conversations
 * created by non-admin users. The admin user queries for this placeholder
 * to discover conversations where they are the intended recipient.
 */
const ADMIN_SUPPORT_PLACEHOLDER = "admin_support";

/**
 * Subscribe to real-time conversation updates for a user.
 *
 * IMPORTANT: Firestore queries with orderBy() silently exclude documents
 * that are missing the sort field. To avoid hiding conversations that
 * have never been messaged (lastMessageAt = null), we DO NOT use
 * orderBy in the Firestore query. Instead, we sort client-side.
 *
 * For admin users, we run dual queries:
 *   1) conversations where the admin's real wallet is in participants
 *   2) conversations of type "admin_support" (catches all admin-related
 *      conversations regardless of whether the placeholder or real wallet is used)
 * Results are merged and deduplicated by conversation ID.
 */
export function subscribeToConversations(walletAddress, callback, role) {
  if (!walletAddress) {
    callback([]);
    return () => {};
  }

  const normalizedWallet = normalizeWallet(walletAddress);
  const isAdmin = role === "admin";

// Local caches scoped strictly inside this function — fresh per subscription.
  // Declared inside subscribeToConversations to avoid cross-subscription accumulation.
  let conversations1Cache = [];
  let conversations2Cache = [];

  // Defensive re-initialization (prevents any stale state if Firestore callbacks
  // run after unsubscription during rapid remounts)
  conversations1Cache = [];
  conversations2Cache = [];

  // Query 1: conversations where the user's wallet is a direct participant
  // NOTE: No orderBy — we sort client-side to avoid excluding docs missing lastMessageAt
  const q1 = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where("participants", "array-contains", normalizedWallet)
  );

  const unsub1 = onSnapshot(q1, (snapshot1) => {
    const conversations1 = snapshot1.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      lastMessageAt: d.data().lastMessageAt?.toDate?.()?.toISOString() || null,
    }));

    if (!isAdmin) {
      // Deduplicate admin-type conversations for non-admin users.
      // Legacy data may contain multiple admin_support Firestore documents
      // with different IDs (e.g. one with real admin wallet, one with
      // "admin_support" placeholder participants). Keep only the latest.
      const deduplicated = deduplicateAdminConversations(conversations1);
      callback(sortConversationsByTime(deduplicated));
      return;
    }
    // For admin, we need to merge with query 2 results below
    conversations1Cache = conversations1;
    mergeAndCallback();
  });

  if (!isAdmin) {
    return unsub1;
  }

  // Query 2 (admin only): conversations of type "admin_support"
  // This catches all admin conversations regardless of participants array contents.
  // Using type field avoids the need for the "admin_support" placeholder in participants.
  const q2 = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where("type", "==", "admin_support")
  );

  const mergeAndCallback = () => {
    const seen = new Set();
    const merged = [];

    // Add admin's own conversations first
    for (const conv of conversations1Cache) {
      if (!seen.has(conv.id)) {
        seen.add(conv.id);
        merged.push(conv);
      }
    }

    // Then add admin_support type conversations
    for (const conv of conversations2Cache) {
      if (!seen.has(conv.id)) {
        seen.add(conv.id);
        merged.push(conv);
      }
    }

    // Sort by lastMessageAt descending — client-side is safer because:
    // 1) orderBy in Firestore silently excludes docs missing the field
    // 2) Composite indexes for array-contains + orderBy may not exist
    callback(sortConversationsByTime(merged));
  };

  const unsub2 = onSnapshot(q2, (snapshot2) => {
    conversations2Cache = snapshot2.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
      lastMessageAt: d.data().lastMessageAt?.toDate?.()?.toISOString() || null,
    }));
    mergeAndCallback();
  });

  return () => {
    unsub1();
    unsub2();
  };
}

/**
 * Deduplicate admin-type conversations for non-admin users.
 * Legacy data may contain multiple admin_support Firestore documents
 * with different IDs (e.g. one created with the real admin wallet in
 * participants, another with the "admin_support" placeholder).
 *
 * Strategy:
 * 1. Separate admin-type conversations from regular ones.
 * 2. If 0-1 admin convs → no work needed.
 * 3. If 2+ admin convs → prefer the one with a REAL admin participant
 *    (not placeholder "admin_support" wallet). Among real ones, keep
 *    the most recently active.
 * 4. If ALL have placeholder wallets → keep most recently active.
 *
 * This ensures a real admin conversation (with proper display) wins
 * over a stale placeholder-only conversation.
 *
 * @param {Array} conversations - list of conversation objects
 * @returns {Array} deduplicated list
 */
function deduplicateAdminConversations(conversations) {
  if (!conversations?.length) return conversations || [];

  const adminConvs = [];
  const regularConvs = [];

  for (const conv of conversations) {
    const hasAdminRole = Object.values(conv.participantRoles || {}).includes("admin");
    const isAdminType = conv.type === "admin_support";
    if (hasAdminRole || isAdminType) {
      adminConvs.push(conv);
    } else {
      regularConvs.push(conv);
    }
  }

  if (adminConvs.length <= 1) {
    return conversations;
  }

  // Prefer conversations where the OTHER participant is a real wallet,
  // not the "admin_support" placeholder string.
  const realAdminConvs = adminConvs.filter((conv) =>
    conv.participants?.some((p) => p !== "admin_support")
  );

  if (realAdminConvs.length > 0) {
    // Keep only the most recently active real-admin conversation
    realAdminConvs.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
    return [...regularConvs, realAdminConvs[0]];
  }

  // Fallback: all admin convs use placeholder wallets, keep latest
  adminConvs.sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });

  return [...regularConvs, adminConvs[0]];
}

/**
 * Sort conversations by lastMessageAt descending.
 * Conversations with null lastMessageAt are placed at the end.
 */
function sortConversationsByTime(conversations) {
  return [...conversations].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

/**
 * Get a single conversation by ID.
 */
export async function getConversation(conversationId) {
  if (!conversationId) return null;
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const snap = await getDoc(convRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * ============================
 * MESSAGE OPERATIONS
 * ============================
 */

/**
 * Send a message in a conversation.
 */
export async function sendMessage(conversationId, sender, text) {
  if (!conversationId) throw new Error("conversationId is required");
  if (!sender?.walletAddress) throw new Error("sender walletAddress is required");
  if (!text?.trim()) throw new Error("Message text is required");

  const normalizedWallet = normalizeWallet(sender.walletAddress);

  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const convSnap = await getDoc(convRef);

  if (!convSnap.exists()) {
    throw new Error("Conversation not found");
  }

  const convData = convSnap.data();
  // Allow sender if their wallet is in participants, OR if they are admin
  // replying to an admin_support placeholder conversation
  const isDirectParticipant = convData.participants.includes(normalizedWallet);
  const isAdminReplyingToSupport = sender.role === "admin" && convData.participants.includes(ADMIN_SUPPORT_PLACEHOLDER);

  if (!isDirectParticipant && !isAdminReplyingToSupport) {
    throw new Error("You are not a participant in this conversation");
  }

  const messagesRef = collection(convRef, MESSAGES_SUBCOLLECTION);
  const messageRef = await addDoc(messagesRef, {
    sender: normalizedWallet,
    senderRole: sender.role,
    text: text.trim(),
    createdAt: serverTimestamp(),
    read: false,
  });

  const otherParticipant = convData.participants.find(
    (p) => p !== normalizedWallet
  );

  await updateDoc(convRef, {
    lastMessage: text.trim().slice(0, 120),
    lastMessageAt: serverTimestamp(),
    [`unreadCountBy.${otherParticipant}`]: increment(1),
  });

  return { id: messageRef.id };
}

/**
 * Fetch messages for a conversation.
 */
export async function getMessages(conversationId, messageLimit = 50, startAfterDoc = null) {
  if (!conversationId) return [];

  const messagesRef = collection(
    doc(db, CONVERSATIONS_COLLECTION, conversationId),
    MESSAGES_SUBCOLLECTION
  );

  let q;
  if (startAfterDoc) {
    q = query(
      messagesRef,
      orderBy("createdAt", "asc"),
      startAfter(startAfterDoc),
      limit(messageLimit)
    );
  } else {
    q = query(
      messagesRef,
      orderBy("createdAt", "asc"),
      limit(messageLimit)
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
  }));
}

/**
 * Subscribe to real-time messages for a conversation.
 */
export function subscribeToMessages(conversationId, messageLimit, callback) {
  if (!conversationId) {
    callback([]);
    return () => {};
  }

  const messagesRef = collection(
    doc(db, CONVERSATIONS_COLLECTION, conversationId),
    MESSAGES_SUBCOLLECTION
  );

  const q = query(
    messagesRef,
    orderBy("createdAt", "asc"),
    limit(messageLimit || 100)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    }));
    callback(messages);
  });
}

/**
 * Mark a conversation as read.
 */
export async function markConversationAsRead(conversationId, walletAddress) {
  if (!conversationId || !walletAddress) return;
  const normalizedWallet = normalizeWallet(walletAddress);
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  await updateDoc(convRef, {
    [`unreadCountBy.${normalizedWallet}`]: 0,
  });
}

/**
 * ============================
 * CONVERSATION FIND/CREATE
 * ============================
 */

/**
 * Check if an admin_support conversation already exists between admin and a specific user.
 * This prevents duplicate admin conversations being created from either side.
 */
async function findExistingAdminConversationWithUser(adminWallet, userWallet) {
  const normalizedUser = normalizeWallet(userWallet);
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where("participants", "array-contains", normalizedUser),
    where("type", "==", "admin_support")
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].id;
  }
  return null;
}

/**
 * Find or create a conversation between current user and a contact.
 *
 * CRITICAL: If the contact has sourceType "admin_support" and the wallet
 * is the placeholder "admin_support", we first check if an admin_support
 * conversation already exists for this user. If so, return the existing
 * conversation ID — this prevents duplicate admin conversations.
 *
 * ADDITIONALLY: If the CURRENT user is an admin and the contact is a
 * student/university, we check if an admin_support conversation already
 * exists with that user to prevent duplicates from the admin side.
 *
 * @param {object} currentUser - { walletAddress, role, displayName? }
 * @param {object} contact - { walletAddress, role, displayName?, sourceType? }
 * @returns {Promise<string>} conversation ID
 */
export async function findOrCreateConversation(currentUser, contact) {
  if (!currentUser?.walletAddress || !contact?.walletAddress) {
    throw new Error("Both currentUser and contact walletAddress are required");
  }

  const senderWallet = normalizeWallet(currentUser.walletAddress);
  const contactWallet = normalizeWallet(contact.walletAddress);

  // GUARD 1: If this is an admin support conversation (student contacting admin),
  // check if one already exists for this user.
  const isAdminContact = contact.role === "admin" || 
                         contact.sourceType === "admin_support" || 
                         contactWallet === "admin_support";
  if (isAdminContact) {
    const existingId = await findExistingAdminConversation(senderWallet);
    if (existingId) {
      return existingId;
    }
  }

  // GUARD 2: If the CURRENT user is admin and contacting a student/university,
  // check if an admin_support conversation already exists with that user.
  // This prevents duplicates when admin starts a conversation with a user
  // who already has an admin conversation created via the placeholder.
  if (currentUser.role === "admin") {
    const existingId = await findExistingAdminConversationWithUser(senderWallet, contactWallet);
    if (existingId) {
      return existingId;
    }
  }

  // Use real wallets for ID generation
  const conversationId = generateConversationId(senderWallet, contactWallet);
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const convSnap = await getDoc(convRef);

  if (convSnap.exists()) {
    return conversationId;
  }

  const participantRoles = {
    [senderWallet]: currentUser.role,
    [contactWallet]: contact.role,
  };

  const senderName = currentUser.displayName || senderWallet.slice(0, 6);
  const contactName = contact.displayName || contactWallet.slice(0, 6);

  const participantsInfo = buildParticipantsInfo(
    senderWallet, currentUser.role, senderName,
    contactWallet, contact.role, contactName
  );

  let convType = contact.sourceType === "admin_support"
    ? "admin_support"
    : contactWallet === "admin_support"
    ? "admin_support"
    : "verification_support";

  await setDoc(convRef, {
    participants: [senderWallet, contactWallet],
    participantRoles,
    participantNames: {
      [senderWallet]: senderName,
      [contactWallet]: contactName,
    },
    participantsInfo,
    type: convType,
    universityId: null,
    studentId: contact.sourceType === "student" ? contactWallet : null,
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    relatedCertificateHash: null,
    unreadCountBy: {
      [senderWallet]: 0,
      [contactWallet]: 0,
    },
  });

  return conversationId;
}

/**
 * ============================
 * SORTING & UTILITIES
 * ============================
 */

/**
 * Sort conversations so admin conversations are pinned at index 0.
 */
export function sortConversationsWithPinnedAdmin(conversations, currentWallet) {
  if (!conversations?.length) return [];
  const normalizedWallet = normalizeWallet(currentWallet);

  return [...conversations].sort((a, b) => {
    const aIsAdmin =
      a.participantRoles?.[getOtherWalletAddress(a, normalizedWallet)] === "admin";
    const bIsAdmin =
      b.participantRoles?.[getOtherWalletAddress(b, normalizedWallet)] === "admin";

    if (aIsAdmin && !bIsAdmin) return -1;
    if (!aIsAdmin && bIsAdmin) return 1;

    // lastMessageAt is already an ISO string (or null) in this list — no .toMillis()
    const aTime = a.lastMessageAt
      ? new Date(a.lastMessageAt).getTime()
      : 0;
    const bTime = b.lastMessageAt
      ? new Date(b.lastMessageAt).getTime()
      : 0;

    return bTime - aTime;
  });
}

/**
 * Check if a conversation involves an admin participant.
 */
export function isAdminConversation(conversation, currentWallet) {
  if (!conversation?.participantRoles) return false;
  const normalizedWallet = normalizeWallet(currentWallet);
  const otherWallet = getOtherWalletAddress(conversation, normalizedWallet);
  return otherWallet ? conversation.participantRoles[otherWallet] === "admin" : false;
}

/**
 * Get the other participant's wallet from a conversation.
 */
function getOtherWalletAddress(conversation, myWallet) {
  return conversation.participants?.find((p) => p !== myWallet) || null;
}

/**
 * Get the display name for a participant wallet from conversation data.
 * Priority: participantsInfo > participantNames > wallet fallback.
 */
export function getParticipantDisplayName(conversation, walletAddress) {
  if (!conversation || !walletAddress) return null;
  const w = normalizeWallet(walletAddress);

  // Priority 1: participantsInfo (richest data)
  if (conversation.participantsInfo?.[w]?.displayName) {
    return conversation.participantsInfo[w].displayName;
  }

  // Priority 2: participantNames (legacy fallback)
  if (conversation.participantNames?.[w]) {
    return conversation.participantNames[w];
  }

  // Final fallback
  return w.slice(0, 6);
}

/**
 * Format a wallet address for display: "0xd2e5...6789"
 */
export function formatWalletAddress(wallet) {
  if (!wallet) return "";
  if (wallet.length <= 10) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

/**
 * Check if a displayName looks like a raw wallet address (truncated or full).
 * Used to decide whether we need to fetch a real name from Firestore.
 */
function looksLikeWalletAddress(name) {
  if (!name) return true;
  // Matches patterns like: 0xd2e5, 0x1234..., 0x1234567890abcdef
  return /^0x[a-fA-F0-9]{1,14}$/.test(name);
}

/**
 * Resolve a human-readable display name for a wallet address by querying
 * the students and universities Firestore collections.
 *
 * @param {string} walletAddress
 * @returns {Promise<string|null>} resolved name or null
 */
export async function resolveUserDisplayName(walletAddress) {
  if (!walletAddress) return null;

  const normalized = walletAddress.toLowerCase();

  try {
    // Check students collection
    const studentQuery = query(
      collection(db, "students"),
      where("walletAddress", "==", normalized)
    );
    const studentSnap = await getDocs(studentQuery);
    if (!studentSnap.empty) {
      const data = studentSnap.docs[0].data();
      if (data.fullName) return data.fullName;
    }

    // Check universities collection
    const uniQuery = query(
      collection(db, "universities"),
      where("walletAddress", "==", normalized)
    );
    const uniSnap = await getDocs(uniQuery);
    if (!uniSnap.empty) {
      const data = uniSnap.docs[0].data();
      if (data.name) return data.name;
    }

    return null;
  } catch (err) {
    console.error("[resolveUserDisplayName] Error resolving name:", err);
    return null;
  }
}

/**
 * Get the other participant's info from a conversation.
 * Uses participantsInfo when available for accurate display names.
 *
 * @returns {{ walletAddress: string, role: string, displayName: string } | null}
 */
export function getOtherParticipant(conversation, myWallet) {
  if (!conversation?.participants) return null;

  const normalizedWallet = normalizeWallet(myWallet);
  const otherWallet = conversation.participants.find(
    (p) => p !== normalizedWallet
  );
  if (!otherWallet) return null;

  const role = conversation.participantRoles?.[otherWallet] || "unknown";

  // Use rich metadata from participantsInfo
  let displayName;
  if (conversation.participantsInfo?.[otherWallet]?.displayName) {
    const rawName = conversation.participantsInfo[otherWallet].displayName;
    // If stored name looks like a wallet address, format it properly
    if (looksLikeWalletAddress(rawName)) {
      displayName = formatWalletAddress(otherWallet);
    } else {
      displayName = rawName;
    }
  } else if (conversation.participantNames?.[otherWallet]) {
    const rawName = conversation.participantNames[otherWallet];
    if (looksLikeWalletAddress(rawName)) {
      displayName = formatWalletAddress(otherWallet);
    } else {
      displayName = rawName;
    }
  } else {
    displayName = formatWalletAddress(otherWallet);
  }

  return { walletAddress: otherWallet, role, displayName };
}

/**
 * Resolve admin_support contact to the actual admin wallet address
 * for conversation creation. This prevents placeholder wallets from
 * breaking admin-side queries.
 *
 * @param {object} contact - suggested contact object
 * @param {string} adminWallet - real admin wallet from auth context
 * @returns {object} resolved contact
 */
export function resolveAdminContact(contact, adminWallet) {
  if (!contact || contact.walletAddress !== "admin_support") return contact;
  if (!adminWallet) return contact;

  return {
    ...contact,
    walletAddress: normalizeWallet(adminWallet),
    displayName: "Admin Support",
  };
}

/**
 * ============================
 * TIME FORMATTING
 * ============================
 */

export function formatMessageTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[date.getDay()];
  }
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatBubbleTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}