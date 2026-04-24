const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const { TwitterApi } = require("twitter-api-v2");
const { postTweet, generateTweet } = require("./services/postTweet");

const router = express.Router();

const HASURA_GRAPHQL_URL = process.env.DOC_HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;
const TWITTER_CLIENT_ID = process.env.CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.CLIENT_SECRET;
const TWITTER_CALLBACK_URL =
  process.env.TWITTER_CALLBACK_URL ||
  "https://8caa-2401-4900-c339-eda5-e110-14be-2435-1511.ngrok-free.app/auth/twitter/callback";
const twitterOAuthClient = new TwitterApi({
  clientId: TWITTER_CLIENT_ID,
  clientSecret: TWITTER_CLIENT_SECRET,
});

// Demo-safe in-memory stores. Move to DB/Redis for production usage.
const oauthSessions = new Map();
const userTokens = new Map();

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

// GET /auth/twitter/login?userId=<your-user-id>
router.get("/auth/twitter/login", async (req, res) => {
  try {
    const userId = (req.query.userId || "default-user").toString();
    const state = crypto.randomBytes(16).toString("hex");
    const { url, codeVerifier } = twitterOAuthClient.generateOAuth2AuthLink(
      TWITTER_CALLBACK_URL,
      {
        scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
        state,
      }
    );

    oauthSessions.set(state, { codeVerifier, userId, createdAt: Date.now() });
    return res.redirect(url);
  } catch (error) {
    console.error("Error creating twitter auth link:", error);
    return res.status(500).json({ error: "Failed to create Twitter auth link" });
  }
});

// GET /auth/twitter/callback?state=...&code=...
router.get("/auth/twitter/callback", async (req, res) => {
  const { state, code } = req.query || {};
  const savedSession = state ? oauthSessions.get(state) : null;

  if (!state || !code || !savedSession) {
    return res.status(400).json({ error: "Invalid OAuth callback parameters" });
  }

  try {
    const { client: loggedClient, accessToken, refreshToken, expiresIn } =
      await twitterOAuthClient.loginWithOAuth2({
        code: code.toString(),
        codeVerifier: savedSession.codeVerifier,
        redirectUri: TWITTER_CALLBACK_URL,
      });

    const userMe = await loggedClient.v2.me();
    userTokens.set(savedSession.userId, {
      accessToken,
      refreshToken,
      expiresIn,
      twitterUserId: userMe?.data?.id,
      twitterUsername: userMe?.data?.username,
      savedAt: Date.now(),
    });
    oauthSessions.delete(state);

    return res.json({
      success: true,
      message: "Twitter connected successfully",
      userId: savedSession.userId,
      twitterUser: userMe?.data || null,
    });
  } catch (error) {
    console.error("Twitter OAuth callback failed:", error);
    return res.status(500).json({ error: "Twitter OAuth callback failed" });
  }
});

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
  const { tweetText, mediaFilePath, userId } = req.body;
  try {
    const tokenData = userTokens.get((userId || "default-user").toString());
    await postTweet(tweetText, mediaFilePath, tokenData?.accessToken);
    res.json({ success: true });
  } catch (error) {
    console.error("Error posting tweet:", error);
    res.status(500).json({ error: "Failed to post tweet" });
  }
});

module.exports = router;