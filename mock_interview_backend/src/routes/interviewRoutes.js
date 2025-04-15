const express = require("express")
const router = express.Router()
const interviewController = require("../controllers/interviewController")

//========== INTERVIEW ROUTES ==========//
// Route to start a new interview session
// POST request to /api/interview/start
router.post("/start", interviewController.startInterview)

// Route to continue an existing interview session
// POST request to /api/interview/continue
router.post("/continue", interviewController.continueInterview)

module.exports = router
