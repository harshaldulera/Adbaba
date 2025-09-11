const express = require("express");
require("dotenv").config();
const cors = require("cors");

const processDocumentRouter = require("./processDocument");
const generateFunnelFlowRouter = require("./generateFunnelFlow");
const chatFunnelEditRouter = require("./chatFunnelEdit");
const generateTweetApiRouter = require("./generateTweetApi");
const postTweetApiRouter = require("./postTweetApi");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;


app.use(processDocumentRouter);
app.use(generateFunnelFlowRouter);
app.use(chatFunnelEditRouter);
app.use(generateTweetApiRouter);
app.use(postTweetApiRouter);

app.get("/", (req, res) => {
  res.send("Welcome to the HeyGen & AI Document Processing API!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
