const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

// Initialize Google GenAI
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({});

// **Proceed with Hasura Mutation** - COMMENTED OUT, using data from request body instead
// const HASURA_GRAPHQL_URL = process.env.DOC_HASURA_GRAPHQL_URL;
// const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

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
        // Get business data directly from request body (already processed from docs)
        const { businessData } = req.body;

        if (!businessData) {
            return res.status(400).json({ error: "Missing businessData in request. The business data should be sent directly in the request body." });
        }

        // COMMENTED OUT: Fetch business data from Hasura - using data from request body instead
        // const query = `
        // query GetBusiness($id: uuid!) {
        //   businesses_by_pk(id: $id) {
        //     id
        //     name
        //     industry
        //     description
        //     website
        //     target_age_group
        //     target_gender
        //     customer_interests
        //     customer_behavior
        //     marketing_budget
        //     customer_acquisition_cost
        //     customer_lifetime_value
        //     ad_spend_distribution
        //     social_media_channels
        //     social_followers
        //     seo_rank
        //     email_subscribers
        //     primary_ad_channels
        //     content_strategy
        //     influencer_marketing
        //     target_location
        //   }
        // }
        // `;

        // const hasuraResponse = await axios.post(
        //     HASURA_GRAPHQL_URL,
        //     {
        //         query,
        //         variables: { id: businessId },
        //     },
        //     {
        //         headers: {
        //             "Content-Type": "application/json",
        //             "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
        //         },
        //     }
        // );

        // if (hasuraResponse.data.errors) {
        //     throw new Error(JSON.stringify(hasuraResponse.data.errors));
        // }

        // const businessData = hasuraResponse.data.data.businesses_by_pk;

        // if (!businessData) {
        //     return res.status(404).json({ error: "Business not found" });
        // }

        // Generate marketing funnel using Gemini
        const marketingPrompt = generateMarketingFunnelPrompt(businessData);

        const funnelResponseObj = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: marketingPrompt,
        });
        const funnelResponse = funnelResponseObj.text;

        const parsedFunnelResponse = parseAIResponse(funnelResponse);

        // Generate visualization data
        const visualizationPrompt =
            generateVisualizationPrompt(parsedFunnelResponse);

        const visualizationResponseObj = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: visualizationPrompt,
        });
        const visualizationResponse = visualizationResponseObj.text;

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

