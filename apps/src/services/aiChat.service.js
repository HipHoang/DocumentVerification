import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "../config/firebase";

const AI_COLLECTION = "ai_conversations";
const MESSAGES_SUBCOLLECTION = "messages";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000;

const SYSTEM_PROMPT = `Bạn là trợ lý hỗ trợ cho hệ thống DocVerify — nền tảng xác thực văn bằng blockchain.

Vai trò của bạn:
- Hỗ trợ người dùng hiểu cách sử dụng hệ thống DocVerify
- Giải thích về xác thực chứng chỉ trên blockchain (Ethereum Sepolia)
- Giải thích các vai trò: admin (quản trị viên), university (đại học), student (sinh viên), pending_student (chờ xác minh), verified_student (đã xác thực)
- Hướng dẫn sử dụng tính năng nhắn tin giữa các vai trò
- Giải thích về IPFS (lưu trữ phi tập trung) và cách xem chứng chỉ
- Giải thích về CID (mã định danh nội dung) của chứng chỉ
- Hỗ trợ khắc phục sự cố cơ bản: kết nối ví, xem chứng chỉ, chia sẻ chứng chỉ

Giới hạn:
- CHỈ trả lời các câu hỏi liên quan đến hệ thống DocVerify, blockchain, IPFS, chứng chỉ số
- Trả lời ngắn gọn (2-4 câu), bằng tiếng Việt
- Không đưa ra lời khuyên pháp lý, tài chính
- Nếu câu hỏi KHÔNG liên quan đến DocVerify, trả lời: "Tôi chủ yếu hỗ trợ về hệ thống DocVerify và chứng chỉ số. Bạn cần giúp gì về xác minh chứng chỉ, blockchain hay IPFS?"
- Nếu không biết câu trả lời, hãy nói: "Tôi chưa có thông tin về vấn đề này. Bạn có thể liên hệ admin qua mục Tin nhắn để được hỗ trợ."`;

const FALLBACK_REPLIES = {
  general: "Hiện tại AI đang quá tải. Tôi có thể hỗ trợ về xác minh chứng chỉ, chia sẻ tài liệu và sử dụng hệ thống DocVerify. Bạn cần giúp gì?",
  verification: "Để xác minh chứng chỉ, bạn có thể vào mục Xác minh CC và nhập mã chứng chỉ. Hệ thống sẽ kiểm tra trên blockchain Ethereum Sepolia.",
  sharing: "Bạn có thể chia sẻ chứng chỉ bằng cách tạo link chia sẻ trong mục Chứng chỉ của tôi. Người nhận có thể xem chứng chỉ mà không cần kết nối ví.",
  blockchain: "DocVerify sử dụng blockchain Ethereum Sepolia để lưu trữ và xác minh chứng chỉ. Mỗi chứng chỉ được ghi lên blockchain với hash duy nhất, đảm bảo không thể giả mạo.",
  ipfs: "IPFS là hệ thống lưu trữ phi tập trung. Chứng chỉ của bạn được lưu trên IPFS qua Pinata, giúp tài liệu luôn sẵn sàng và không thể bị xóa.",
  wallet: "Để kết nối ví, bạn cần cài MetaMask và chọn mạng Ethereum Sepolia. Sau đó nhấn Bắt đầu hoặc Kết nối trên trang chủ DocVerify.",
};

function getFallbackReply(userMessage) {
  const msg = (userMessage || "").toLowerCase();
  if (msg.includes("xác minh") || msg.includes("verify") || msg.includes("kiểm tra")) return FALLBACK_REPLIES.verification;
  if (msg.includes("chia sẻ") || msg.includes("share") || msg.includes("gửi")) return FALLBACK_REPLIES.sharing;
  if (msg.includes("blockchain") || msg.includes("ether") || msg.includes("hợp đồng")) return FALLBACK_REPLIES.blockchain;
  if (msg.includes("ipfs") || msg.includes("cid") || msg.includes("lưu trữ")) return FALLBACK_REPLIES.ipfs;
  if (msg.includes("ví") || msg.includes("wallet") || msg.includes("kết nối") || msg.includes("metamask")) return FALLBACK_REPLIES.wallet;
  return FALLBACK_REPLIES.general;
}

function checkRateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    return { allowed: false, waitMs: MIN_REQUEST_INTERVAL - elapsed };
  }
  lastRequestTime = now;
  return { allowed: true, waitMs: 0 };
}

export async function getOrCreateAIConversation(userWallet, role) {
  if (!userWallet) throw new Error("userWallet is required");

  const wallet = userWallet.toLowerCase();
  const convId = `ai_${wallet}`;
  const convRef = doc(db, AI_COLLECTION, convId);
  const snap = await getDoc(convRef);

  if (!snap.exists()) {
    await setDoc(convRef, {
      userWallet: wallet,
      role: role || "public",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
    });
  }

  return convId;
}

export function subscribeToAIMessages(conversationId, callback) {
  if (!conversationId) {
    callback([]);
    return () => {};
  }

  const messagesRef = collection(
    doc(db, AI_COLLECTION, conversationId),
    MESSAGES_SUBCOLLECTION
  );

  const q = query(
    messagesRef,
    orderBy("createdAt", "asc"),
    limit(100)
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

export async function saveUserMessage(conversationId, text) {
  if (!conversationId || !text?.trim()) return;

  const convRef = doc(db, AI_COLLECTION, conversationId);
  const messagesRef = collection(convRef, MESSAGES_SUBCOLLECTION);

  await setDoc(doc(messagesRef), {
    sender: "user",
    text: text.trim(),
    createdAt: serverTimestamp(),
  });

  await updateDoc(convRef, {
    updatedAt: serverTimestamp(),
    messageCount: increment(1),
  });
}

export async function saveAIMessage(conversationId, text) {
  if (!conversationId) return;

  const convRef = doc(db, AI_COLLECTION, conversationId);
  const messagesRef = collection(convRef, MESSAGES_SUBCOLLECTION);

  await setDoc(doc(messagesRef), {
    sender: "ai",
    text: text,
    createdAt: serverTimestamp(),
  });
}

async function callGemini(prompt, retryCount = 0) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              { text: `Người dùng hỏi: ${prompt}` },
              { text: "Trả lời bằng tiếng Việt, ngắn gọn 2-4 câu." },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 429 && retryCount < 1) {
      await new Promise((r) => setTimeout(r, 2000));
      return callGemini(prompt, retryCount + 1);
    }

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply || !reply.trim()) {
      throw new Error("Empty Gemini response");
    }

    return reply.trim();
  } catch (error) {
    clearTimeout(timeout);

    if (retryCount < 1 && (error.message?.includes("429") || error.name === "AbortError")) {
      if (error.name === "AbortError") throw new Error("TIMEOUT");
      await new Promise((r) => setTimeout(r, 2000));
      return callGemini(prompt, retryCount + 1);
    }

    throw error;
  }
}

export async function getGeminiReply(conversationId, userMessage) {
  try {
    await saveUserMessage(conversationId, userMessage);
  } catch (err) {
    console.error("[AIChat] saveUserMessage error:", err);
  }

  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    const rateMessage = `⏳ Vui lòng chờ vài giây trước khi gửi tiếp.`;
    try {
      await saveAIMessage(conversationId, rateMessage);
    } catch {}
    return rateMessage;
  }

  try {
    const reply = await callGemini(userMessage);
    try {
      await saveAIMessage(conversationId, reply);
    } catch {}
    return reply;
  } catch (error) {
    console.error("[AIChat] Gemini error:", error?.message || error);

    const fallback = getFallbackReply(userMessage);
    try {
      await saveAIMessage(conversationId, fallback);
    } catch {}
    return fallback;
  }
}