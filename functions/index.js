/**
 * Cloud Functions for Firebase - Telegram Bot Integration
 * This function handles incoming messages from a Telegram Bot and
 * provides donation summaries to members.
 */

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// Bot Token should be set in Firebase Config or Environment Variables
// For simplicity, we'll suggest the user to use Firebase Secrets in production
// but for now we expect it in the environment.
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Utility to convert numbers to Bengali numerals
 */
const toBengaliNumber = (number) => {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(number).replace(/\d/g, (d) => bnDigits[d]);
};

/**
 * Send a message back to Telegram
 */
const sendMessage = async (chatId, text) => {
  if (!BOT_TOKEN) {
    console.error("Missing TELEGRAM_BOT_TOKEN environment variable");
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error(
      "Error sending message to Telegram:",
      error.response?.data || error.message,
    );
  }
};

/**
 * Handle the /start command
 */
const handleStart = async (chatId) => {
  const welcomeMessage =
    `👋 *আমাদের প্রজেক্টে আপনাকে স্বাগতম!* \n\n` +
    `আপনার ডোনেশন সামারি দেখতে দয়া করে আপনার *মেম্বার আইডি* (উদা: \`G2-123456\`) এখানে লিখুন।`;
  await sendMessage(chatId, welcomeMessage);
};

/**
 * Handle member lookup and summary
 */
const handleLookup = async (chatId, inputId) => {
  const cleanId = inputId.trim();

  try {
    // 1. Find Member (by displayId or uniqueId)
    let memberSnap = await db
      .collection("members")
      .where("displayId", "==", cleanId)
      .limit(1)
      .get();

    if (memberSnap.empty) {
      memberSnap = await db
        .collection("members")
        .where("uniqueId", "==", cleanId)
        .limit(1)
        .get();
    }

    if (memberSnap.empty) {
      await sendMessage(
        chatId,
        `❌ দুঃখিত, *${cleanId}* আইডির কোনো সদস্য খুঁজে পাওয়া যায়নি। দয়া করে সঠিক আইডিটি দিন।`,
      );
      return;
    }

    const member = memberSnap.docs[0].data();
    const memberId = member.uniqueId;
    const memberName = member.name;
    const displayId = member.displayId || member.uniqueId;

    // 2. Fetch Approved Donations
    const donationsSnap = await db
      .collection("donations")
      .where("memberId", "==", memberId)
      .where("status", "==", "approved")
      .orderBy("date", "desc")
      .get();

    let totalAmount = 0;
    let donationHistory = "";

    if (donationsSnap.empty) {
      donationHistory = "_এখনো কোনো অনুমোদিত ডোনেশন পাওয়া যায়নি।_";
    } else {
      donationsSnap.docs.forEach((doc) => {
        const d = doc.data();
        const amt = Number(d.amount) || 0;
        totalAmount += amt;
        donationHistory += `• ${d.month}: ৳${toBengaliNumber(amt)}\n`;
      });
    }

    // 3. Construct Bengali Message
    const summaryMessage =
      `👤 *সদস্য:* ${memberName}\n` +
      `📑 *আইডি:* ${displayId}\n\n` +
      `💰 *ডোনেশন সামারি:*\n${donationHistory}\n` +
      `🏆 *মোট ডোনেশন:* ৳*${toBengaliNumber(totalAmount)}*`;

    await sendMessage(chatId, summaryMessage);
  } catch (error) {
    console.error("Error during lookup:", error);
    await sendMessage(
      chatId,
      "⚠️ দুঃখিত, তথ্য খোঁজার সময় একটি সমস্যা হয়েছে। দয়া করে পরে চেষ্টা করুন।",
    );
  }
};

/**
 * Main Webhook Entry Point
 */
exports.telegramBotWebhook = onRequest({ cors: true }, async (req, res) => {
  // Check if it's a valid Telegram update
  if (!req.body || !req.body.message) {
    res.status(200).send("OK");
    return;
  }

  const { chat, text } = req.body.message;
  const chatId = chat.id;

  if (!text) {
    res.status(200).send("OK");
    return;
  }

  if (text === "/start") {
    await handleStart(chatId);
  } else {
    // Treat any other text as a Member ID lookup
    await handleLookup(chatId, text);
  }

  res.status(200).send("OK");
});
