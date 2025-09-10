const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<your-openai-key>";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "<your-gemini-key>";

const IS_GEMINI = false;
const IS_OLLAMA = true;

function buildEditPrompt({ businessId, message, nodes, edges }) {
  const graph = { nodes, edges };
  return `You are a senior marketing strategist and product designer collaborating iteratively with a user to refine a ReactFlow-based marketing funnel.

Context:
- businessId: ${businessId || "unknown"}
- current_graph (JSON): ${JSON.stringify(graph)}

Task:
- Apply the user's instruction to improve the funnel structure.
- You may add, remove, or rename nodes; add/remove edges; regroup stages.
- Keep ids stable where possible. New ids must be unique strings.
- Ensure the output remains a valid, connected funnel from the root to leaves.
- Prefer clear, human-readable labels.
- Ensure Instagram and Twitter are present if social channels are relevant.
- Depth should be practical (up to 5 levels if needed), but keep it concise.

User instruction:
"""
${message}
"""

Return ONLY JSON with this exact structure (no markdown, no commentary):
{
  "assistant_message": "short rationale of changes",
  "nodes": [ { "id": "string", "position": { "x": number, "y": number }, "data": { "label": "string" } } ],
  "edges": [ { "id": "string", "source": "string", "target": "string" } ]
}`;
}

function parseAIResponse(raw) {
  try {
    if (typeof raw === "object") return raw;
    const jsonMatch = raw.match(/\{[\s\S]*\}$/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(raw);
  } catch (e) {
    return { assistant_message: "Failed to parse AI output; no changes applied.", nodes: [], edges: [] };
  }
}

router.post("/chat-funnel-edit", async (req, res) => {
  try {
    const { businessId, message, nodes, edges } = req.body || {};
    if (!message || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({ error: "Missing required fields: message, nodes, edges" });
    }

    const prompt = buildEditPrompt({ businessId, message, nodes, edges });

    let responseText;
    if (IS_OLLAMA) {
      const ollamaResponse = await axios.post(
        "http://localhost:11434/api/generate",
        { model: "llama3", prompt, stream: false },
        { timeout: 300000 }
      );
      responseText = ollamaResponse.data.response;
    } else if (IS_GEMINI) {
      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] }
      );
      responseText = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      const openaiResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an expert marketing strategist and graph editor." },
            { role: "user", content: prompt },
          ],
        },
        { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" } }
      );
      responseText = openaiResponse.data.choices?.[0]?.message?.content;
    }

    const parsed = parseAIResponse(responseText);

    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return res.status(200).json({
        assistant_message: parsed?.assistant_message || "No valid update received.",
        visualizationData: { nodes, edges },
      });
    }

    return res.status(200).json({
      assistant_message: parsed.assistant_message || "Applied requested changes.",
      visualizationData: { nodes: parsed.nodes, edges: parsed.edges },
    });
  } catch (error) {
    console.error("/chat-funnel-edit error:", error.response?.data || error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
