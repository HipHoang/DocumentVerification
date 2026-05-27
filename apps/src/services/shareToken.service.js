import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLLECTION = "shareTokens";

/**
 * Get the Firestore document ID for a given certificate hash.
 * Uses certHash as the doc ID for deterministic lookups.
 */
const getShareTokenDocId = (certHash) => `token_${certHash.toLowerCase()}`;

const getShareTokenDocRef = (certHash) => {
  const id = getShareTokenDocId(certHash);
  return doc(db, COLLECTION, id);
};

/**
 * Save share token metadata to Firestore after successful creation.
 */
export const saveShareToken = async ({
  certHash,
  shareToken,
  shareUrl,
  walletAddress,
}) => {
  if (!certHash || !shareToken) throw new Error("certHash and shareToken required");

  const ref = getShareTokenDocRef(certHash);
  const data = {
    certHash: certHash.toLowerCase(),
    shareToken,
    shareUrl,
    walletAddress: walletAddress?.toLowerCase() || "",
    tokenRevoked: false,
    sharedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, data, { merge: true });
  return { id: ref.id, ...data };
};

/**
 * Update token revoked status in Firestore.
 */
export const markShareTokenRevoked = async (certHash) => {
  if (!certHash) throw new Error("certHash required");

  const ref = getShareTokenDocRef(certHash);
  await updateDoc(ref, {
    tokenRevoked: true,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Get share token info from Firestore by certificate hash.
 * Returns null if no token exists.
 */
export const getShareTokenByCertHash = async (certHash) => {
  if (!certHash) return null;

  const ref = getShareTokenDocRef(certHash);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return { id: snap.id, ...snap.data() };
};

/**
 * Get all share tokens for a wallet address.
 * Used to hydrate MyCertificates state on load.
 */
export const getShareTokensByWallet = async (walletAddress) => {
  if (!walletAddress) return [];

  const q = query(
    collection(db, COLLECTION),
    where("walletAddress", "==", walletAddress.toLowerCase())
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Delete share token document (cleanup).
 */
export const deleteShareToken = async (certHash) => {
  if (!certHash) throw new Error("certHash required");
  const ref = getShareTokenDocRef(certHash);
  await deleteDoc(ref);
};