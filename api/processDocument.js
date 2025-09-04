const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const FormData = require("form-data");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<your-openai-key>";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "<your-gemini-key>";


// const IS_OLLAMA = process.env.IS_OLLAMA === "true";
// const IS_GEMINI = process.env.IS_GEMINI === "true";
// const IS_OLLAMA = process.env.IS_OLLAMA === "true";
// const IS_GEMINI = process.env.IS_GEMINI === "true" || (!process.env.IS_OLLAMA && !process.env.OPENAI_API_KEY); 
const IS_GEMINI = true;
const IS_OLLAMA = false;


// **Proceed with Hasura Mutation**
const HASURA_GRAPHQL_URL = process.env.DOC_HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

async function insertTweetSuggestion(tweetData) {
    const mutationQuery = `
    mutation MyMutation($object: tweet_suggestions_insert_input!) {
      insert_tweet_suggestions_one(object: $object) {
        id
      }
    }
  `;

    const variables = {
        object: {
            business_id: tweetData.business_id || "",
            caption: tweetData.caption || "",
            script: tweetData.script || "",
            video_id: tweetData.video_id || "",
        },
    };

    try {
        const response = await axios.post(
            HASURA_GRAPHQL_URL,
            {
                query: mutationQuery,
                variables,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
                },
            }
        );

        if (response.data.errors) {
            throw new Error(JSON.stringify(response.data.errors));
        }

        console.log(
            "Inserted tweet suggestion ID:",
            response.data.data.insert_tweet_suggestions_one.id
        );
        return response.data.data.insert_tweet_suggestions_one;
    } catch (error) {
        console.error("❌ Error inserting tweet suggestion:", error.message);
        return { error: "Failed to insert tweet suggestion" };
    }
}

/**
 * POST /process-document
 * Accepts a document file and sends it to either OpenAI, Gemini, or Ollama for processing.
 */
router.post("/process-document", upload.single("doc"), async (req, res) => {
    console.log("Processing document...");

    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ error: "Missing document file in request." });
        }

        const filePath = req.file.path;
        const fileName = req.file.originalname;
        const generateUUID = uuidv4();
        console.log(generateUUID);
        const prompt = `I will provide a company representation document containing details about the company, its industry, clients, past marketing experiences, and target audience.

Based on this document, extract and structure relevant data into the following JSON fields:
{
  "name": "Company Name (Required)",
  "industry": "Industry (Required)",
  "description": "Tagline/One-line description (Required)",
  "website": "Website URL (Required)",
  "founded_year": "Year of establishment (Optional)",
  "hq_location": "HQ Location (Required)",
  "business_size": "Number of employees (Optional)",
  "target_age_group": "Target audience age range (Required)",
  "target_gender": "Target gender (Required: Male, Female, Other, All)",
  "customer_interests": "Key interests of the target audience (Optional)",
  "customer_behavior": "Customer engagement/behavior insights (Optional)",
  "marketing_budget": "Total marketing budget (Optional)",
  "customer_acquisition_cost": "Cost to acquire a customer (Optional)",
  "customer_lifetime_value": "Predicted revenue per customer (Optional)",
  "ad_spend_distribution": {
    "affiliate_marketing": "Percentage (Optional)",
    "social_media": "Percentage (Optional)",
    "search_engine": "Percentage (Optional)"
  },
  "website_traffic": "Number of website visitors (Optional)",
  "social_media_channels": ["List of social media platforms used (Optional)"],
  "social_followers": {
    "platform": "Number of followers per platform (Optional)"
  },
  "seo_rank": "SEO ranking position (Optional)",
  "email_subscribers": "Number of email subscribers (Optional)",
  "primary_ad_channels": ["Main advertising platforms (Optional)"],
  "content_strategy": ["Types of content used (Optional)"],
  "influencer_marketing": "Boolean: true for Yes, false for No (Optional)",
  "target_location": ["Key markets/regions targeted (Optional)"]
}
  Instructions:
	-	Required fields must always be filled.
	-	Optional fields can be left null if no relevant data is found.
	-	Ensure accurate extraction and mapping of details.
	-	Return the final structured data in valid JSON format.
`;

        let aiResponse;

        console.log("IS_OLLAMA:", IS_OLLAMA);
        console.log("IS_GEMINI:", IS_GEMINI);

        // **Using Ollama (No need to upload the document)**
        if (IS_OLLAMA) {
            console.log("Using Ollama AI...");

            // Read the document text (only needed for Ollama)
            const documentText = fs.readFileSync(filePath, "utf-8");

            const ollamaPayload = {
                model: "llama3.1",
                prompt: `${prompt}\n\n${documentText}`,
                stream: false,
            };

            const ollamaResponse = await axios.post(
                "http://localhost:11434/api/generate",
                ollamaPayload,
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            aiResponse = ollamaResponse.data.response || ollamaResponse.data.text;
            console.log("Ollama response:", aiResponse);
        }

        // **Using Gemini API**
        else if (IS_GEMINI) {
            console.log("Uploading file to Gemini API...");

            // Read file content to base64 (Gemini requires base64 encoded files)
            const fileData = fs.readFileSync(filePath, { encoding: "base64" });

            const geminiPayload = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: "application/pdf", // Change based on file type
                                    data: fileData,
                                },
                            },
                        ],
                    },
                ],
            };

            const geminiResponse = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                geminiPayload,
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            aiResponse = geminiResponse.data.candidates[0]?.content?.parts[0]?.text;
            console.log("Gemini response:", aiResponse);

            // **Fix: Clean up the response before parsing JSON**
            let extractedData;
            try {
                const cleanedResponse = aiResponse.replace(/```json|```/g, "").trim();
                extractedData = JSON.parse(cleanedResponse);

                extractedData.id = generateUUID;

                // **Convert comma-separated strings to arrays**
                function parseToArray(value) {
                    return typeof value === "string"
                        ? value.split(",").map((item) => item.trim())
                        : value;
                }

                extractedData.customer_interests = parseToArray(
                    extractedData.customer_interests
                );
                extractedData.social_media_channels = parseToArray(
                    extractedData.social_media_channels
                );
                extractedData.primary_ad_channels = parseToArray(
                    extractedData.primary_ad_channels
                );
                extractedData.content_strategy = parseToArray(
                    extractedData.content_strategy
                );
                extractedData.target_location = parseToArray(
                    extractedData.target_location
                );
            } catch (parseError) {
                console.error("Error parsing Gemini response:", parseError.message);
                return res.status(500).json({ error: "Failed to parse AI response." });
            }

            const mutationQuery = `
mutation MyMutation($object: businesses_insert_input!) {
  insert_businesses_one(object: $object) {
    id
    ad_spend_distribution
    business_size
    content_strategy
    customer_acquisition_cost
    customer_behavior
    customer_interests
    customer_lifetime_value
    description
    email_subscribers
    founded_year
    hq_location
    industry
    influencer_marketing
    marketing_budget
    name
    primary_ad_channels
    seo_rank
    social_followers
    social_media_channels
    target_age_group
    target_gender
    target_location
    website
    website_traffic
  }
}
  `;

            const hasuraPayload = {
                query: mutationQuery,
                variables: {
                    object: {
                        id: extractedData.id || "",
                        name: extractedData.name || "",
                        industry: extractedData.industry || "",
                        description: extractedData.description || "",
                        website: extractedData.website || "",
                        founded_year: extractedData.founded_year || null,
                        hq_location: extractedData.hq_location || "",
                        business_size: extractedData.business_size || null,
                        target_age_group: extractedData.target_age_group || null,
                        target_gender: extractedData.target_gender || "",
                        customer_interests: extractedData.customer_interests || null,
                        customer_behavior: extractedData.customer_behavior || "",
                        marketing_budget: extractedData.marketing_budget || null,
                        customer_acquisition_cost:
                            extractedData.customer_acquisition_cost || null,
                        customer_lifetime_value:
                            extractedData.customer_lifetime_value || null,
                        ad_spend_distribution: extractedData.ad_spend_distribution || null,
                        website_traffic: extractedData.website_traffic || null,
                        social_media_channels: extractedData.social_media_channels || null,
                        social_followers: extractedData.social_followers || null,
                        seo_rank: extractedData.seo_rank || null,
                        email_subscribers: extractedData.email_subscribers || null,
                        primary_ad_channels: extractedData.primary_ad_channels || null,
                        content_strategy: extractedData.content_strategy || null,
                        influencer_marketing: extractedData.influencer_marketing || false,
                        target_location: extractedData.target_location || null,
                    },
                },
            };

            try {
                const hasuraResponse = await axios.post(
                    HASURA_GRAPHQL_URL,
                    hasuraPayload,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "x-hasura-admin-secret": HASURA_ADMIN_SECRET, // Use your Hasura admin secret
                        },
                    }
                );

                console.log("Hasura response:", hasuraResponse.data);

                if (hasuraResponse.data.errors) {
                    throw new Error(JSON.stringify(hasuraResponse.data.errors));
                }

                const insertedId = hasuraResponse.data.data.insert_businesses_one.id;
                try {
                    const tweetResponse = await axios.get(
                        "http://localhost:3002/api/generate-tweet/" +
                        insertedId +
                        "?hasMedia=true"
                    );
                    console.log(tweetResponse);

                    const videoResponse = await axios.post(
                        "http://localhost:3000/generate-video",
                        {
                            dialogue: tweetResponse.data.tweetText.dialogue,
                        }
                    );
                    if (videoResponse.data?.videoId) {
                        console.log("Video ID:", videoResponse.data.videoId);

                        try {
                            await insertTweetSuggestion({
                                business_id: insertedId,
                                caption: tweetResponse.data.tweetText.caption,
                                script: tweetResponse.data.tweetText.dialogue,
                                video_id: videoResponse.data?.videoId,
                            });
                        } catch (error) {
                            console.error("Unable to insert tweet suggestion");
                        }
                    }
                } catch (error) {
                    console.log("error:", error);
                }
                return res.json({
                    message: "Document processed and data inserted successfully",
                    businessId: insertedId,
                    response: extractedData,
                    hasuraData: hasuraResponse.data.data.insert_businesses_one,
                });
            } catch (hasuraError) {
                console.error("Hasura mutation error:", hasuraError.message);
                return res
                    .status(500)
                    .json({ error: "Failed to insert data into Hasura" });
            }
        }

        // **Using OpenAI (Upload document first)**
        else {
            console.log("Uploading file to OpenAI...");

            // Create form-data for OpenAI file upload
            const formData = new FormData();
            formData.append("file", fs.createReadStream(filePath));
            formData.append("purpose", "assistants");

            // Upload file to OpenAI
            const uploadResponse = await axios.post(
                "https://api.openai.com/v1/files",
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                    },
                }
            );

            const fileId = uploadResponse.data.id;
            console.log(`File uploaded successfully. OpenAI File ID: ${fileId}`);

            const openAiPayload = {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert at document analysis.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                file_ids: [fileId], // OpenAI no longer supports this, might need file search API instead
            };

            const openAiResponse = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                openAiPayload,
                {
                    headers: {
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            aiResponse = openAiResponse.data.choices[0]?.message?.content;
            console.log("OpenAI response:", aiResponse);

            // Delete the file from OpenAI after processing
            await axios.delete(`https://api.openai.com/v1/files/${fileId}`, {
                headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
            });
            console.log(`Deleted file ${fileId} from OpenAI.`);
        }

        // **Delete the local file after processing**
        fs.unlinkSync(filePath);
        console.log(`Deleted local file: ${fileName}`);

        return res.json({
            message: "Document processed successfully",
            response: aiResponse,
        });
    } catch (error) {
        console.error(
            "Error processing document:",
            error.response?.data || error.message
        );
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;