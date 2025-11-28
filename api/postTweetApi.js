const express = require("express");
const axios = require("axios");
const { postTweet, generateTweet } = require("./services/postTweet");

const router = express.Router();

const HASURA_GRAPHQL_URL = process.env.DOC_HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

async function fetchBusinessDataById(businessId) {
  if (!businessId || !HASURA_GRAPHQL_URL || !HASURA_ADMIN_SECRET) {
    return null;
  }

  const query = `
    query BusinessByPk($id: uuid!) {
      businesses_by_pk(id: $id) {
        id
        name
        industry
        description
        website
        founded_year
        hq_location
        business_size
        target_age_group
        target_gender
        customer_interests
        customer_behavior
        marketing_budget
        customer_acquisition_cost
        content_strategy
        target_location
        social_media_channels
        primary_ad_channels
      }
    }
  `;

  try {
    const response = await axios.post(
      HASURA_GRAPHQL_URL,
      { query, variables: { id: businessId } },
      {
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
        },
      }
    );

    if (response.data.errors) {
      console.error("Hasura errors:", response.data.errors);
      return null;
    }

    return response.data.data.businesses_by_pk;
  } catch (error) {
    console.error("Failed to fetch business data from Hasura:", error.message);
    return null;
  }
}

// POST /generate-tweet
router.post("/generate-tweet", async (req, res) => {
  const { businessData, businessId } = req.body || {};

  try {
    let context = businessData;

    if (!context && businessId) {
      context = await fetchBusinessDataById(businessId);
      if (!context) {
        return res.status(404).json({
          error: "Business data not found for provided businessId",
        });
      }
    }

    if (!context) {
      return res.status(400).json({
        error: "Provide businessData or businessId in the request body",
      });
    }

    const tweet = await generateTweet(context);

    res.json({ success: true, tweet });
  } catch (error) {
    console.error("Error generating tweet:", error);
    res.status(500).json({ error: "Failed to generate tweet" });
  }
});

// POST /post-tweet
router.post("/post-tweet", async (req, res) => {
  const { tweetText, mediaFilePath } = req.body;
  try {
    await postTweet(tweetText, mediaFilePath);
    res.json({ success: true });
  } catch (error) {
    console.error("Error posting tweet:", error);
    res.status(500).json({ error: "Failed to post tweet" });
  }
});

module.exports = router;