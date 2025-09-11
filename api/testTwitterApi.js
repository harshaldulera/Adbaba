const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();

async function testTweet() {
  try {
    const rwClient = new TwitterApi({
      appKey: process.env.API_KEY,
      appSecret: process.env.API_SECRET,
      accessToken: process.env.ACCESS_TOKEN,
      accessSecret: process.env.ACCESS_SECRET,
    }).readWrite;
    const tweet = await rwClient.v2.tweet("Hello, this is a test.");
    console.log("Tweet response:", tweet);
  } catch (error) {
    console.error("❌ Twitter API test error:", error);
  }
}

testTweet();
