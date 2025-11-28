const express = require("express");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const { postInstagramImage, generateInstagramCaption } = require("./services/postInsta.js");

const router = express.Router();

// Multer middleware for image upload
const upload = multer({ dest: "uploads/" });

// Generate caption
router.post("/generate-caption", async (req, res) => {
  const { businessData, businessId } = req.body;

  try {
    let context = businessData;

    if (!context && businessId) {
      context = await fetchBusinessDataById(businessId);
    }

    if (!context) {
      return res.status(400).json({ error: "Missing business data" });
    }

    const caption = await generateInstagramCaption(context);
    res.json({ success: true, caption });
  } catch (err) {
    console.error("Caption error:", err);
    res.status(500).json({ error: "Failed to generate caption" });
  }
});

// POST /post-instagram
router.post("/post-instagram", upload.single("image"), async (req, res) => {
  try {
    const caption = req.body.caption;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const result = await postInstagramImage(caption, file.path);

    res.json({
      success: true,
      message: "Instagram post published",
      result
    });
  } catch (err) {
    console.error("IG Post Error:", err);
    res.status(500).json({ error: "Failed to post Instagram" });
  }
});

module.exports = router;