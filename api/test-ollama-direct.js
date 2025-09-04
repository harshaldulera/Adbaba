// Direct test of Ollama connection without Hasura
const axios = require("axios");

const testOllamaDirect = async () => {
  try {
    console.log("🔄 Testing Ollama connection directly...");

    const testPrompt = `Generate a simple marketing funnel JSON for a coffee shop business. Return only valid JSON with this structure:
    {
      "leverage_analysis": {
        "primary_leverage": "Labour Leverage",
        "reasoning": "Coffee shops rely heavily on skilled baristas and customer service"
      },
      "marketing_channels": {
        "primary_channels": ["Social Media", "Local Partnerships"],
        "reasoning": "Coffee shops benefit from local community engagement"
      },
      "funnel_stages": {
        "awareness": "Local social media posts and community events",
        "consideration": "Free coffee tastings and loyalty programs",
        "conversion": "In-store promotions and mobile ordering",
        "retention": "Loyalty rewards and personalized recommendations"
      },
      "platform_recommendations": {
        "instagram": "Visual content showcasing coffee and atmosphere",
        "facebook": "Local community engagement and events",
        "tiktok": "Behind-the-scenes coffee making content"
      }
    }`;

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "llama3:latest",
        prompt: testPrompt,
        stream: false,
      },
      { timeout: 300000 }
    );

    console.log("✅ Ollama connection successful!");
    console.log("Raw response:", response.data.response);

    // Test JSON parsing
    const cleanResponse = response.data.response.toString().trim();
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      const parsedJson = JSON.parse(jsonString);
      console.log("✅ JSON parsing successful!");
      console.log("Parsed JSON:", JSON.stringify(parsedJson, null, 2));
    } else {
      console.log("❌ No valid JSON found in response");
    }
  } catch (error) {
    console.error("❌ Ollama test failed!");
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
};

testOllamaDirect();
