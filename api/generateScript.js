const express = require("express");
require("dotenv").config();

const router = express.Router();

// Initialize Google GenAI
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({});

const generateSocialMediaScriptPrompt = (businessData, scriptType = "reel") => {
    const type = scriptType === "reel" ? "short-form video reel" : "social media post";
    
    return `You are an expert social media content creator. Generate an engaging ${type} script for the following business.

Business Information:
${JSON.stringify(businessData, null, 2)}

Requirements:
1. Create a compelling, engaging ${type} script that captures attention within the first 3 seconds
2. Make it authentic, conversational, and relatable to the target audience
3. Include a clear call-to-action
4. Keep it concise and punchy (15-60 seconds)
5. Use the business name, industry, and key value propositions naturally
6. Make it feel personal and authentic, not corporate or salesy
7. Include emotional hooks and storytelling elements
8. For reels: Make it suitable for video narration with natural pauses and emphasis
9. Don't include any audio cues like [pause], [emphasis], [break], etc as this would directly be send to text to speech engine.

Return ONLY the script text which would be said by the avatar, no markdown, no explanations, just the script content that can be directly used.`;
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

