const fs = require("fs");
const { twitterClient } = require("./twitterClient.js");

async function postTweet(tweetText, mediaFilePath) {
  try {
    let mediaId;
    if (mediaFilePath) {
      const mediaData = fs.readFileSync(mediaFilePath);
      const mimeType = 'image/jpeg'; // Adjust this if you expect different image types

      mediaId = await twitterClient.v1.uploadMedia(mediaData, { mimeType });
    }

    const response = await twitterClient.v2.tweet({
      text: tweetText,
      media: mediaId ? { media_ids: [mediaId] } : undefined // Only include media if mediaId is defined
    });
    console.log("✅ Tweet posted:", response);
  } catch (error) {
    console.error("❌ Error posting tweet:", error);
  }
}

module.exports = { postTweet };
