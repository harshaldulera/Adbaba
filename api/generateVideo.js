const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();
const API_KEY =
  process.env.HEYGEN_API_KEY ||
  "ZDEzN2YyNjZmNzU5NGE3MGFiZTBmODgwYjc5NmRiMGUtMTc1NzYxNjY4OQ==";

/**
 * POST /generate-video
 * Starts generating a video and returns the video ID.
 */
router.post("/generate-video", async (req, res) => {
  try {
    const { dialogue } = req.body;

    console.log("Starting to generate video");

    if (!dialogue || typeof dialogue !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid dialogue text." });
    }

    const payload = {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: "Luca_public",
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: dialogue,
            voice_id: "361c2da0f3684eb6bf08334698ca107b",
          },
          background: {
            type: "color",
            value: "#008000",
          },
        },
      ],
      dimension: {
        width: 1280,
        height: 720,
      },
    };

    const generateResponse = await axios.post(
      "https://api.heygen.com/v2/video/generate",
      payload,
      {
        headers: {
          "X-Api-Key": API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const videoId = generateResponse.data.data.video_id;
    console.log(videoId);

    if (!videoId) {
      return res
        .status(500)
        .json({ error: "Video ID not returned from HeyGen API" });
    }

    console.log(`Video generation started: ${videoId}`);

    return res.json({
      message: "Video generation started",
      videoId: videoId,
    });
  } catch (error) {
    console.error(
      "Error starting video generation:",
      error.response?.data || error.message
    );
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /check-status/:videoId
 * Checks video status using HeyGen v2 API
 */
router.get("/check-status/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;

    const statusRes = await axios.get(
      `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      {
        headers: {
          "X-Api-Key": API_KEY,
        },
      }
    );

    if (statusRes.data.code !== 100) {
      return res.status(500).json({ status: "failed" });
    }

    res.json(statusRes.data.data);
  } catch (error) {
    console.error("Status Check Error:", error.response?.data || error);
    res.status(500).json({ error: "Failed to check video status" });
  }
});



module.exports = router;
