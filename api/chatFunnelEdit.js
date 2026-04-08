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

function extractFirstJsonObject(text) {
  if (typeof text !== "string") return null;
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (ch === "\\") {
        escaping = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function normalizeAIOutput(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  const assistantMessage =
    parsed.assistant_message ||
    parsed.assistantMessage ||
    parsed.message ||
    "Applied requested changes.";

  const nodes = Array.isArray(parsed.nodes)
    ? parsed.nodes
    : Array.isArray(parsed?.visualizationData?.nodes)
      ? parsed.visualizationData.nodes
      : null;

  const edges = Array.isArray(parsed.edges)
    ? parsed.edges
    : Array.isArray(parsed?.visualizationData?.edges)
      ? parsed.visualizationData.edges
      : null;

  if (!Array.isArray(nodes) || !Array.isArray(edges)) return null;
  return { assistant_message: assistantMessage, nodes, edges };
}

function parseAIResponse(raw) {
  try {
    if (typeof raw === "object") {
      const normalized = normalizeAIOutput(raw);
      return normalized || { assistant_message: "No valid graph returned.", nodes: [], edges: [] };
    }

    const text = String(raw || "").trim();
    const withoutFences = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const direct = (() => {
      try {
        return JSON.parse(withoutFences);
      } catch {
        return null;
      }
    })();
    if (direct) {
      const normalized = normalizeAIOutput(direct);
      if (normalized) return normalized;
    }

    const extracted = extractFirstJsonObject(withoutFences);
    if (extracted) {
      const parsed = JSON.parse(extracted);
      const normalized = normalizeAIOutput(parsed);
      if (normalized) return normalized;
    }

    return { assistant_message: "Failed to parse AI output; no changes applied.", nodes: [], edges: [] };
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
      model: "gemini-3-flash-preview",
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
