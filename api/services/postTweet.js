import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { twitterClient } from "./twitterClient.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_TWEET_MODEL || "gemini-2.5-flash";
const genAI = GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    })
  : null;

function buildTweetPrompt(businessData) {
  return `
You are a top-tier social media strategist. Write a viral Twitter post for this business context:
${JSON.stringify(businessData, null, 2)}

Rules:
- Max 200 characters
- Punchy, modern tone
- 1 relevant hashtag
- No emojis
- Should feel human, not AI-generated
- Promote the brand indirectly (no hard selling)
`;
}

function sanitizeTweet(text) {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim().slice(0, 240); // keep well under 280 chars
}

async function generateTweet(businessData) {
  if (!businessData || typeof businessData !== "object") {
    throw new Error("businessData is required to generate a tweet");
  }

  if (!genAI) {
    throw new Error("Missing GEMINI_API_KEY/GOOGLE_API_KEY for tweet generation");
  }

  const prompt = buildTweetPrompt(businessData);
  const responseObj = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  const tweet = sanitizeTweet(responseObj.text);

  if (!tweet) {
    throw new Error("Gemini returned an empty tweet");
  }

  return tweet;
}

async function postTweet(tweetText, mediaFilePath) {
  try {
    let mediaId;
    if (mediaFilePath) {
      const mediaData = fs.readFileSync(mediaFilePath);
      const mimeType = "image/jpeg"; // Adjust this if you expect different image types

      mediaId = await twitterClient.v1.uploadMedia(mediaData, { mimeType });
    }

    const response = await twitterClient.v2.tweet({
      text: tweetText,
      media: mediaId ? { media_ids: [mediaId] } : undefined, // Only include media if mediaId is defined
    });
    console.log("✅ Tweet posted:", response);
  } catch (error) {
    console.error("❌ Error posting tweet:", error);
    throw error;
  }
}

export { postTweet, generateTweet };