// Test the funnel API endpoint with mock data
const axios = require("axios");

const testFunnelAPI = async () => {
  try {
    console.log("🔄 Testing funnel API endpoint...");

    // Mock business data for testing
    const mockBusinessData = {
      id: "9a561814-25b4-4996-ac24-017035b4e04e",
      name: "Test Coffee Shop",
      industry: "Food & Beverage",
      description: "A local coffee shop specializing in artisanal coffee",
      website: "https://testcoffeeshop.com",
      target_age_group: "25-45",
      target_gender: "All",
      customer_interests: ["Coffee", "Local Business", "Sustainability"],
      customer_behavior: "Regular morning customers, social media active",
      marketing_budget: 5000,
      customer_acquisition_cost: 25,
      customer_lifetime_value: 200,
      ad_spend_distribution: "Social Media 60%, Local Ads 40%",
      social_media_channels: ["Instagram", "Facebook"],
      social_followers: 2500,
      seo_rank: 15,
      email_subscribers: 800,
      primary_ad_channels: ["Instagram", "Facebook"],
      content_strategy: "Daily coffee photos, behind-the-scenes content",
      influencer_marketing: "Local food bloggers",
      target_location: "Urban downtown area",
    };

    // Test the API endpoint
    const response = await axios.post(
      "http://localhost:3000/generate-funnel-flow",
      {
        businessId: "9a561814-25b4-4996-ac24-017035b4e04e",
        mockData: mockBusinessData, // Add mock data to bypass Hasura
      }
    );

    console.log("✅ Funnel API test successful!");
    console.log("Response status:", response.status);
    console.log(
      "Funnel Data:",
      JSON.stringify(response.data.funnelData, null, 2)
    );
    console.log(
      "Visualization Data:",
      JSON.stringify(response.data.visualizationData, null, 2)
    );
  } catch (error) {
    console.error("❌ Funnel API test failed!");
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);
    console.error("Error Message:", error.message);
  }
};

testFunnelAPI();

