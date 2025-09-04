const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<your-openai-key>";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "<your-gemini-key>";


// const IS_OLLAMA = process.env.IS_OLLAMA === "true";
// const IS_GEMINI = process.env.IS_GEMINI === "true";
// const IS_OLLAMA = process.env.IS_OLLAMA === "true";
// const IS_GEMINI = process.env.IS_GEMINI === "true" || (!process.env.IS_OLLAMA && !process.env.OPENAI_API_KEY);
const IS_GEMINI = false;
const IS_OLLAMA = true;

// **Proceed with Hasura Mutation**
const HASURA_GRAPHQL_URL = process.env.DOC_HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

const parseAIResponse = (response) => {
    try {
        if (typeof response === "object") return response;

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return response;
    } catch (error) {
        console.warn("Failed to parse AI response as JSON: ", error);
        return response;
    }
};

const generateMarketingFunnelPrompt = (businessData) => {
    return `Given the following business data, generate a structured marketing funnel flow that outlines steps from awareness to conversion. Ensure that you are giving the possible ideas and proposed solutions. Generate a JSON File for this.
  
  Business_Data:
  ${JSON.stringify(businessData, null, 2)}
  
  For the funnel output flow:
  
  1. Classify which leverage requires more attention: Media Leverage, Capital Leverage, Labour Leverage, Code Leverage.
  2. Identify channels where processes can be streamlined and improvised for effective digital marketing campaigns.
  3. Consider opportunities in paid advertisements, content, and outreach.
  4. Identify areas for good lead magnet implementation with probable use cases and examples.
  5. Split into stages: awareness, consideration, conversion, and retention.
  6. Suggest maximum 3 best platforms with reasoning aligned to the target audience.
  7. Ensure alignment with industry processes and existing marketing channels.
  
  Return the response in valid JSON format with the following structure:
  {
    "leverage_analysis": {},
    "marketing_channels": {},
    "funnel_stages": {},
    "platform_recommendations": {}
  }`;
};

// Helper function to generate visualization prompt
const generateVisualizationPrompt = (funnelData) => {
    return `Create a ReactFlow visualization for this marketing funnel data. Follow these rules:
  
  1. Create a hierarchical structure with nodes and edges
  2. Include these required properties for nodes:
     - id (unique string)
     - position (x, y coordinates)
     - data (label and any additional info)
  3. Root node should be "Marketing Funnel"
  4. Return valid JSON with 'nodes' and 'edges' arrays
  5. you need to create marketing funnel visualization for the following data:
   ${JSON.stringify(funnelData)}
  6.you need to suggest good marketing platform for the business based on the visualization
  7. give me good examples of social media platforms in diffrent node  and always include minimum instagram and twitter both in it.
  8. give me whole digram of the marketing funnel which reaches the target audience and visualize the data in nodes and edges.
  9.give the visualization for atleast 5 level of depth.
  10.use personliased labeling for the nodes and edges accroding to brands like use brand name etc...
  11. reach the end user with the visualization.
  Expected structure:
  {
    "nodes": [
      { "id": "string", "position": { "x": number, "y": number }, "data": { "label": "string" } }
    ],
    "edges": [
      { "id": "string", "source": "string", "target": "string" }
    ]
  }`;
};

router.post("/generate-funnel-flow", async (req, res) => {
    try {
        const { businessId } = req.body;

        if (!businessId) {
            return res.status(400).json({ error: "Missing businessId in request." });
        }

        // Fetch business data from Hasura
        const query = `
        query GetBusiness($id: uuid!) {
          businesses_by_pk(id: $id) {
            id
            name
            industry
            description
            website
            target_age_group
            target_gender
            customer_interests
            customer_behavior
            marketing_budget
            customer_acquisition_cost
            customer_lifetime_value
            ad_spend_distribution
            social_media_channels
            social_followers
            seo_rank
            email_subscribers
            primary_ad_channels
            content_strategy
            influencer_marketing
            target_location
          }
        }
      `;

        const hasuraResponse = await axios.post(
            HASURA_GRAPHQL_URL,
            {
                query,
                variables: { id: businessId },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
                },
            }
        );

        if (hasuraResponse.data.errors) {
            throw new Error(JSON.stringify(hasuraResponse.data.errors));
        }

        const businessData = hasuraResponse.data.data.businesses_by_pk;

        if (!businessData) {
            return res.status(404).json({ error: "Business not found" });
        }

        // Generate marketing funnel using selected AI service
        let funnelResponse;
        const marketingPrompt = generateMarketingFunnelPrompt(businessData);

        if (IS_OLLAMA) {
            const ollamaResponse = await axios.post(
                "http://127.0.0.1:11434/api/generate",
                {
                    model: "gemma:2b",
                    prompt: marketingPrompt,
                    stream: false,
                }, { timeout: 300000 }
            );
            funnelResponse = ollamaResponse.data.response;
        } else if (IS_GEMINI) {
            const geminiResponse = await axios.post(
                `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [
                        {
                            parts: [{ text: marketingPrompt }],
                        },
                    ],
                }
            );
            funnelResponse =
                geminiResponse.data.candidates[0]?.content?.parts[0]?.text;
        } else {
            const openAiResponse = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert in marketing funnel strategies.",
                        },
                        {
                            role: "user",
                            content: marketingPrompt,
                        },
                    ],
                },
                {
                    headers: {
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            funnelResponse = openAiResponse.data.choices[0]?.message?.content;
        }

        const parsedFunnelResponse = parseAIResponse(funnelResponse);

        // Generate visualization data
        let visualizationResponse;
        const visualizationPrompt =
            generateVisualizationPrompt(parsedFunnelResponse);

        if (IS_OLLAMA) {
            const visualOllamaResponse = await axios.post(
                "http://localhost:11434/api/generate",
                {
                    model: "gemma:2b",
                    prompt: visualizationPrompt,
                    stream: false,
                }, { timeout: 300000 }
            );
            visualizationResponse = visualOllamaResponse.data.response;
        } else if (IS_GEMINI) {
            const visualGeminiResponse = await axios.post(
                `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [
                        {
                            parts: [{ text: visualizationPrompt }],
                        },
                    ],
                }
            );
            visualizationResponse =
                visualGeminiResponse.data.candidates[0]?.content?.parts[0]?.text;
        } else {
            const visualOpenAiResponse = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are a data visualization expert.",
                        },
                        {
                            role: "user",
                            content: visualizationPrompt,
                        },
                    ],
                },
                {
                    headers: {
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            visualizationResponse =
                visualOpenAiResponse.data.choices[0]?.message?.content;
        }

        const parsedVisualizationResponse = parseAIResponse(visualizationResponse);

        return res.json({
            message: "Funnel flow generated successfully",
            funnelData: parsedFunnelResponse,
            visualizationData: parsedVisualizationResponse,
        });
    } catch (error) {
        console.error(
            "Error generating funnel flow:",
            error.response?.data || error.message
        );
        return res.status(500).json({
            error: error.message,
            details: error.response?.data || "No additional details available",
        });
    }
});

module.exports = router;

