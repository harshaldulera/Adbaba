const express = require("express");
require("dotenv").config();

const router = express.Router();

// Initialize Google GenAI
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({});

const generateSocialMediaScriptPrompt = (businessData, scriptType = "reel") => {
    const type = scriptType === "reel" ? "short-form video reel" : "social media post";
    
    return `You are an expert social media content creator. Generate a compelling spoken narration for a ${type} for the following business.

Business Information:
${JSON.stringify(businessData, null, 2)}

Requirements:
1. Create a compelling, engaging spoken narrative that captures attention immediately.
2. Make it authentic, conversational, and relatable to the target audience.
3. Include a clear call-to-action.
4. Keep it concise (approx. 30-60 seconds of speaking time).
5. Use the business name, industry, and key value propositions naturally.
6. Make it feel personal and authentic, not corporate or salesy.
7. Include emotional hooks and storytelling elements.

CRITICAL OUTPUT INSTRUCTIONS:
- Output ONLY the raw spoken text.
- The output must be a single continuous paragraph.
- ABSOLUTELY NO visual descriptions (e.g., no "Visual:", "Scene:", "Cut to:", "Shot of...").
- ABSOLUTELY NO character/speaker labels (e.g., no "Voiceover:", "Narrator:", "Me:").
- ABSOLUTELY NO timecodes (e.g., no "(0-3s)", "[15s]").
- ABSOLUTELY NO markdown formatting (no bold, italics, headers).
- Do not include any introductory or concluding remarks.
- The output must be ready to be fed directly into a Text-to-Speech engine.`;
};

router.post("/generate-script", async (req, res) => {
    try {
        const { businessData, scriptType } = req.body;

        if (!businessData) {
            return res.status(400).json({ 
                error: "Missing businessData in request. The business data should be sent in the request body." 
            });
        }

        // Generate social media script using Gemini
        const prompt = generateSocialMediaScriptPrompt(businessData, scriptType || "reel");

        const responseObj = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        const script = responseObj.text;

        return res.json({
            success: true,
            script: script.trim(),
            scriptType: scriptType || "reel",
        });
    } catch (error) {
        console.error("Error generating social media script:", error.response?.data || error.message);
        return res.status(500).json({
            error: error.message,
            details: error.response?.data || "No additional details available",
        });
    }
});

module.exports = router;

