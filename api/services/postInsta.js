import fs from "fs";
import loginInstagram from "./instaClient.js";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_INSTAGRAM_MODEL || "gemini-2.5-flash";

const genAI = GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    })
  : null;

/* ---------------------------------------------------------------------- */
/* 1. Prompt Builder for Instagram Caption                                */
/* ---------------------------------------------------------------------- */
function buildInstagramPrompt(context) {
  return `
You are a world-class Instagram social strategist.

Write an engaging Instagram caption for this business context:
${JSON.stringify(context, null, 2)}

Rules:
- Up to 200 characters
- Friendly and modern tone
- 1–2 relevant hashtags
- Light use of emojis allowed (max 2)
- Should feel human, natural, and not AI-written
- No hard selling — subtle value and personality
- No line breaks
  `;
}

/* ---------------------------------------------------------------------- */
/* 2. Clean/Sanitize Output                                               */
/* ---------------------------------------------------------------------- */
function sanitizeCaption(text) {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim().slice(0, 300);
}

/* ---------------------------------------------------------------------- */
/* 3. Generate Instagram Caption (Gemini)                                 */
/* ---------------------------------------------------------------------- */
export async function generateInstagramCaption(context) {
  if (!context || typeof context !== "object") {
    throw new Error("context is required for caption generation");
  }

  if (!genAI) {
    throw new Error("Missing GEMINI_API_KEY/GOOGLE_API_KEY for caption generation");
  }

  const prompt = buildInstagramPrompt(context);

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  const caption = sanitizeCaption(response.text);

  if (!caption) throw new Error("Gemini returned an empty caption");

  return caption;
}

/* ---------------------------------------------------------------------- */
/* 4. Post an Image to Instagram                                          */
/* ---------------------------------------------------------------------- */
export async function postInstagramImage(caption, mediaFilePath) {
  try {
    const ig = await loginInstagram();

    const imageBuffer = fs.readFileSync(mediaFilePath);

    const publishResult = await ig.publish.photo({
      file: imageBuffer,
      caption: caption || "",
    });

    console.log("📸 Instagram post published:", publishResult);
    return publishResult;
  } catch (error) {
    console.error("❌ Failed to post to Instagram:", error);
    throw error;
  }
}
