const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

async function testUpload() {
  try {
    // Create form-data and attach the PDF
    const formData = new FormData();
    formData.append("doc", fs.createReadStream("./nike-growth-story.pdf"));

    // Send request to your API
    const response = await axios.post(
      "http://localhost:3000/process-document",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    console.log("✅ Response from API:");
    console.dir(response.data, { depth: null });
  } catch (error) {
    console.error("❌ Upload failed:");
    console.error(error.response?.data || error.message);
  }
}

testUpload();
