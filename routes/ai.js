const express = require("express");
const wrapAsync = require("../utils/wrapAsync.js");
const aiController = require("../controllers/ai.js");

const router = express.Router();

router.post("/chat", wrapAsync(aiController.chat));

module.exports = router;
