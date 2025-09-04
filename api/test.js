// testFunnel.js
import axios from "axios";

const BUSINESS_ID = "ea2a070b-8595-45b0-8569-466fd0626e3c"; // <-- your businessId
const API_URL = "http://localhost:3000/generate-funnel-flow";

const testFunnel = async () => {
  try {
    console.log("🔄 Sending request to generate funnel flow...");
    const response = await axios.post(API_URL, {
      businessId: BUSINESS_ID,
    });

    console.log("✅ Funnel generation succeeded!");
    console.log("Funnel Data:\n", JSON.stringify(response.data.funnelData, null, 2));
    console.log("Visualization Data:\n", JSON.stringify(response.data.visualizationData, null, 2));
  } catch (error) {
    console.error("❌ Funnel generation failed!");
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);
    console.error("Error Message:", error.message);
  }
};

testFunnel();
