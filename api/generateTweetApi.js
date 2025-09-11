const express = require("express");
const { generateTweetText } = require("./services/GenerateTweet");
const router = express.Router();

// POST /generate-tweet-api
router.post("/generate-tweet-api", async (req, res) => {
  try {
    const { businessData, hasMedia } = req.body;
    if (!businessData) {
      return res.status(400).json({ error: "Missing businessData" });
    }
    const tweetResult = await generateTweetText(businessData, !!hasMedia);
    res.json({ tweetText: tweetResult });
  } catch (error) {
    console.error("Error in /api/generate-tweet:", error);
    res.status(500).json({ error: "Failed to generate tweet" });
  }
});

module.exports = router;
