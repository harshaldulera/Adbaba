const axios = require("axios");

async function generateTweetText(businessData, hasMedia) {
  let prompt = `Generate a compelling and engaging tweet based on the following business data. The tweet should be concise, attention-grabbing, and optimized for engagement (likes, shares, and comments). It should align with the brand’s tone and target audience. Feel free to add relevant hashtags, emojis, and a call-to-action where appropriate.

Here is the business data:
${JSON.stringify(businessData)}

Guidelines:
  • Keep it within Twitter's character limit (280 characters).
  • Use a casual, professional, or witty tone depending on the business context.
  • Highlight key selling points, promotions, or unique aspects.
  • Encourage engagement by asking a question, using a call-to-action, or leveraging trends.
  • If relevant, include hashtags and emojis for better reach.
`;

  if (hasMedia) {
    prompt += `

Now Generate:
  • A caption that complements the tweet and provides context for the media.
  • A dialogue script for the user to create a content video, where they speak about the post in an engaging way.
  • The script should be conversational, engaging, and designed to capture the audience's attention within the first few seconds.
  
Return the response in valid JSON format with the following keys:
{
  "caption": "Your generated caption",
  "dialogue": "Your generated dialogue string only"
}
  `;
  } else {
    prompt += `

Now, generate a tweet following these guidelines based on the provided business data.
Return the response as text only with the tweet content.
`;
  }

  console.log("Generated prompt:", prompt);

  const url = "http://localhost:11434/api/generate";
  const data = {
    model: "llama3",
    prompt: prompt,
    stream: false,
  };

  try {
    const response = await axios.post(url, data);
    // Fix: Ollama API returns {response.data.response} not {response.data.message.content}
    const fullContent =
      response.data.response || response.data.message?.content;

    console.log("Raw API Response:", fullContent);

    if (hasMedia) {
      // Extract JSON content safely
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonResponse = JSON.parse(jsonMatch[0]);
        return jsonResponse;
      } else {
        throw new Error("Invalid JSON response from API");
      }
    }

    const tweetContent = fullContent
      ? fullContent.replace(/<think>[\s\S]*?<\/think>/, "").trim()
      : "";
    console.log("Generated Tweet:", tweetContent);
    return { tweetContent };
  } catch (error) {
    console.error("❌ Error generating tweet with Ollama API:", error.message);
    return { error: "Failed to generate tweet" };
  }
}

module.exports = { generateTweetText };
