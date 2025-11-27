const express = require("express");
const axios = require("axios");
require("dotenv").config();

/**
 * RAG (Retrieval-Augmented Generation) Model for AI-Generated Social Media Scripts
 * 
 * This RAG model enhances social media script generation by:
 * 1. Retrieving relevant social media content patterns from a knowledge base
 * 2. Augmenting AI prompts with proven script templates and best practices
 * 3. Generating more engaging, platform-specific, and conversion-focused scripts
 * 
 * Architecture:
 * - Vector Store: Stores social media script patterns, hooks, CTAs, and best practices
 * - Embedding Model: Converts text to vector representations for semantic search
 * - Retrieval System: Finds most relevant script patterns based on business context and platform
 * - Augmentation: Enhances AI prompts with retrieved script knowledge
 */

const router = express.Router();

// Simulated vector store (in production, this would be a proper vector database like Pinecone, Weaviate, or Chroma)
const SOCIAL_MEDIA_SCRIPT_KNOWLEDGE_BASE = [
  {
    id: "script_001",
    content: "Hook patterns for reels: Start with a question, surprising statistic, bold statement, or relatable problem. First 3 seconds are critical for retention. Examples: 'Did you know that...', 'POV: You just discovered...', 'Stop doing this if you want to...'",
    embedding: null,
    metadata: { platform: "reel", type: "hook", category: "engagement" }
  },
  {
    id: "script_002",
    content: "Instagram Reel structure: Hook (0-3s) → Problem/Value (3-10s) → Solution/Story (10-45s) → CTA (45-60s). Keep it conversational, use natural pauses, and include visual cues in the script.",
    embedding: null,
    metadata: { platform: "instagram", type: "structure", category: "reel" }
  },
  {
    id: "script_003",
    content: "TikTok script patterns: Fast-paced, trend-aware, authentic voice. Use trending sounds, challenges, or formats. Keep scripts under 60 seconds, use quick cuts, and make it shareable. Include hashtags naturally in the script.",
    embedding: null,
    metadata: { platform: "tiktok", type: "pattern", category: "viral" }
  },
  {
    id: "script_004",
    content: "CTA best practices: Clear, action-oriented, and specific. Examples: 'Follow for more tips', 'Save this post', 'Comment your experience', 'Link in bio', 'DM me for details'. Make it easy and low-commitment.",
    embedding: null,
    metadata: { type: "cta", category: "conversion" }
  },
  {
    id: "script_005",
    content: "Storytelling framework: Problem → Agitation → Solution → Transformation. Start with a relatable problem, amplify the pain, present your solution, and show the transformation. Use 'you' language to make it personal.",
    embedding: null,
    metadata: { type: "framework", category: "storytelling" }
  },
  {
    id: "script_006",
    content: "Industry-specific hooks: Tech/Education - 'The one thing nobody tells you about...', E-commerce - 'This product changed everything...', Services - 'Why most people fail at...', B2B - 'The mistake costing businesses...'",
    embedding: null,
    metadata: { type: "hook", category: "industry-specific" }
  },
  {
    id: "script_007",
    content: "Authentic voice patterns: Use conversational language, avoid corporate jargon, include personal anecdotes, use emojis strategically, and match the tone to your audience. Sound like a friend, not a brand.",
    embedding: null,
    metadata: { type: "voice", category: "authenticity" }
  },
  {
    id: "script_008",
    content: "Platform-specific optimization: Instagram - Visual storytelling with captions, TikTok - Trend-aware and fast-paced, LinkedIn - Professional but approachable, Twitter - Concise and punchy, YouTube Shorts - Educational hooks.",
    embedding: null,
    metadata: { type: "optimization", category: "platform-specific" }
  },
  {
    id: "script_009",
    content: "Emotional triggers: Curiosity (questions, mysteries), Fear of missing out (limited time, exclusivity), Social proof (testimonials, numbers), Aspiration (transformation stories), Urgency (act now, limited availability).",
    embedding: null,
    metadata: { type: "psychology", category: "engagement" }
  },
  {
    id: "script_010",
    content: "Script length guidelines: Instagram Reels - 15-60 seconds (optimal 30s), TikTok - 15-60 seconds, YouTube Shorts - 15-60 seconds, LinkedIn - 30-90 seconds, Twitter/X - 15-30 seconds. Shorter is often better for engagement.",
    embedding: null,
    metadata: { type: "guideline", category: "length" }
  }
];

/**
 * Generate embeddings for text (simulated - in production would use OpenAI embeddings, Cohere, or similar)
 * @param {string} text - Text to embed
 * @returns {Array<number>} - Vector embedding
 */
function generateEmbedding(text) {
  // Simulated embedding generation
  // In production: await openai.embeddings.create({ model: "text-embedding-3-small", input: text })
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Array.from({ length: 384 }, (_, i) => Math.sin(hash + i) * 0.5);
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} - Similarity score (0-1)
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Retrieve relevant social media script patterns based on business context and platform
 * @param {Object} businessData - Business information
 * @param {string} platform - Social media platform (reel, tiktok, instagram, etc.)
 * @param {number} topK - Number of top results to return
 * @returns {Array<Object>} - Relevant script knowledge base entries
 */
function retrieveRelevantScriptKnowledge(businessData, platform = "reel", topK = 5) {
  // Create query embedding from business data and platform
  const queryText = `
    Industry: ${businessData.industry || 'Unknown'}
    Description: ${businessData.description || ''}
    Target Audience: ${businessData.target_age_group || 'All'} ${businessData.target_gender || 'All'}
    Interests: ${Array.isArray(businessData.customer_interests) ? businessData.customer_interests.join(', ') : businessData.customer_interests || ''}
    Behavior: ${businessData.customer_behavior || 'Unknown'}
    Platform: ${platform}
    Script Type: ${platform === 'reel' ? 'short-form video' : 'social media post'}
  `.trim();
  
  const queryEmbedding = generateEmbedding(queryText);
  
  // Calculate similarity scores for all knowledge base entries
  const scoredEntries = SOCIAL_MEDIA_SCRIPT_KNOWLEDGE_BASE.map(entry => {
    if (!entry.embedding) {
      entry.embedding = generateEmbedding(entry.content);
    }
    
    // Boost score if platform matches
    let similarity = cosineSimilarity(queryEmbedding, entry.embedding);
    if (entry.metadata.platform && entry.metadata.platform.toLowerCase() === platform.toLowerCase()) {
      similarity += 0.2; // Boost for platform match
    }
    
    return {
      ...entry,
      similarity: Math.min(similarity, 1.0), // Cap at 1.0
      score: similarity
    };
  });
  
  // Sort by similarity and return top K
  return scoredEntries
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter(entry => entry.similarity > 0.3); // Threshold for relevance
}

/**
 * Augment social media script prompt with retrieved knowledge
 * @param {string} basePrompt - Original AI prompt
 * @param {Array<Object>} retrievedKnowledge - Retrieved script knowledge base entries
 * @param {string} platform - Social media platform
 * @returns {string} - Augmented prompt
 */
function augmentScriptPromptWithRAG(basePrompt, retrievedKnowledge, platform = "reel") {
  if (!retrievedKnowledge || retrievedKnowledge.length === 0) {
    return basePrompt;
  }
  
  const scriptContext = retrievedKnowledge
    .map((entry, idx) => `[Script Pattern ${idx + 1}] ${entry.content}`)
    .join('\n\n');
  
  return `You are an expert social media content creator with access to a comprehensive knowledge base of proven script patterns, hooks, CTAs, and best practices.

RELEVANT SOCIAL MEDIA SCRIPT KNOWLEDGE BASE:
${scriptContext}

PLATFORM: ${platform}

ORIGINAL TASK:
${basePrompt}

Use the script knowledge base above to create engaging, platform-optimized content. Apply the proven patterns, hooks, and CTAs that match the business context and platform requirements.`;
}

/**
 * RAG-enhanced social media script generation endpoint
 * NOTE: This endpoint is implemented but not currently integrated into the main script flow
 * It demonstrates how RAG would enhance script generation with contextual knowledge retrieval
 */
router.post("/rag-enhanced-script", async (req, res) => {
  try {
    const { businessData, basePrompt, platform = "reel" } = req.body;
    
    if (!businessData) {
      return res.status(400).json({ error: "Missing businessData" });
    }
    
    // Step 1: Retrieve relevant script patterns from knowledge base
    console.log(`🔍 RAG: Retrieving relevant social media script patterns for ${platform}...`);
    const retrievedKnowledge = retrieveRelevantScriptKnowledge(businessData, platform, 5);
    console.log(`✅ RAG: Retrieved ${retrievedKnowledge.length} relevant script patterns`);
    
    // Step 2: Augment the prompt with retrieved knowledge
    const augmentedPrompt = augmentScriptPromptWithRAG(
      basePrompt || "Generate a social media script",
      retrievedKnowledge,
      platform
    );
    
    // Step 3: Generate response using augmented prompt
    // In production, this would call the AI model with the augmented prompt
    // For demo purposes, we return the augmented prompt structure
    
    return res.json({
      success: true,
      message: "RAG-enhanced social media script generation (demo mode)",
      platform: platform,
      retrievedKnowledge: retrievedKnowledge.map(entry => ({
        id: entry.id,
        content: entry.content,
        similarity: entry.similarity.toFixed(3),
        metadata: entry.metadata
      })),
      augmentedPrompt: augmentedPrompt.substring(0, 500) + "...", // Truncated for response
      note: "This RAG model retrieves relevant social media script patterns, hooks, and CTAs from a knowledge base and augments AI prompts for more engaging, platform-optimized script generation."
    });
  } catch (error) {
    console.error("RAG model error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Initialize knowledge base embeddings (would be called on startup in production)
 */
function initializeKnowledgeBase() {
  console.log("📚 Initializing RAG Social Media Script Knowledge Base...");
  SOCIAL_MEDIA_SCRIPT_KNOWLEDGE_BASE.forEach(entry => {
    if (!entry.embedding) {
      entry.embedding = generateEmbedding(entry.content);
    }
  });
  console.log(`✅ RAG Script Knowledge Base initialized with ${SOCIAL_MEDIA_SCRIPT_KNOWLEDGE_BASE.length} entries`);
}

// Export functions for potential use in other modules
module.exports.retrieveRelevantScriptKnowledge = retrieveRelevantScriptKnowledge;
module.exports.augmentScriptPromptWithRAG = augmentScriptPromptWithRAG;
module.exports.generateEmbedding = generateEmbedding;
module.exports.cosineSimilarity = cosineSimilarity;

// Initialize on module load
initializeKnowledgeBase();

module.exports = router;

