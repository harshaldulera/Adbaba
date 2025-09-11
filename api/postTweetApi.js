const express = require("express");
const { postTweet } = require("./services/postTweet");
const router = express.Router();

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
