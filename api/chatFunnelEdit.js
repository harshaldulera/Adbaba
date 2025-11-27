const express = require("express");
require("dotenv").config();

const router = express.Router();

const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({});

function buildEditPrompt({ businessId, message, nodes, edges }) {
  const graph = { nodes, edges };
  
  // NOTE: RAG Model Enhancement (Available but not currently integrated)
  // The RAG model is primarily designed for AI-Generated Social Media Script enhancement.
  // See api/ragModel.js and api/generateScript.js for RAG implementation details.
  
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

    // Generate response using Gemini
    const responseObj = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const responseText = responseObj.text;

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
