const express = require("express");
require("dotenv").config();
const cors = require("cors");

const processDocumentRouter = require("./processDocument");
const generateFunnelFlowRouter = require("./generateFunnelFlow");
const chatFunnelEditRouter = require("./chatFunnelEdit");
const generateVideoRouter = require("./generateVideo");
const generateScriptRouter = require("./generateScript");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

app.use(processDocumentRouter);
app.use(generateFunnelFlowRouter);
app.use(chatFunnelEditRouter);
app.use(generateVideoRouter);
app.use(generateScriptRouter);

app.get("/", (req, res) => {
    res.send("Welcome to the HeyGen & AI Document Processing API!");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});