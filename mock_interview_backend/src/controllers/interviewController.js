const geminiService = require("../services/geminiService")

//========== Controller for Start Interview ==========//
const startInterview = async (req, res) => {
  // Extract job title from request body
  const { jobTitle } = req.body

  //========== Basic Input Validation ==========//
  if (!jobTitle || typeof jobTitle !== "string" || jobTitle.trim() === "") {
    return res
      .status(400)
      .json({ error: "Job Title is required and must be a non-empty string." })
  }
  if (jobTitle.length > 100) {
    // Example length validation
    return res
      .status(400)
      .json({ error: "Job Title is too long (max 100 characters)." })
  }
  // Add more validation if needed (e.g., regex for allowed characters)

  try {
    // --- Start Interview Session ---
    console.log(`Controller: Attempting to start interview for "${jobTitle}"`)

    // Call the service to start the interview session and extract the conversation ID and first question
    const { conversationId, firstQuestion } =
      await geminiService.startInterviewSession(jobTitle.trim())

    // Use 201 Created status
    res.status(201).json({
      conversationId,
      message: firstQuestion,
      interviewState: "ongoing", // Initial state
    })

    // Log the successful start of the interview
    console.log(`Controller: Interview ${conversationId} started successfully.`)
  } catch (error) {
    // Log the error for debugging
    console.error("Controller Error - startInterview:", error.message)

    // Handle specific errors from the service
    if (error.message.includes("Request blocked due to safety settings")) {
      return res.status(400).json({ error: error.message })
    }

    // Generic server error for other issues
    res.status(500).json({
      error:
        error.message ||
        "An unexpected error occurred while starting the interview.",
    })
  }
}

//========== Controller for Continue Interview ==========//
const continueInterview = async (req, res) => {
  // Extract conversation ID and user message from request body
  const { conversationId, message } = req.body

  //========== Basic Input Validation ==========//
  // Validate conversation ID
  if (!conversationId || typeof conversationId !== "string") {
    return res.status(400).json({ error: "Conversation ID is required." })
  }

  // Validate message
  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({
      error: "User message is required and must be a non-empty string.",
    })
  }
  if (message.length > 2000) {
    // Example length validation
    return res
      .status(400)
      .json({ error: "Message is too long (max 2000 characters)." })
  }
  // Add more validation if needed

  try {
    // --- Continue Interview Session ---
    console.log(`Controller: Continuing interview ${conversationId}`)

    // Call the service to continue the interview session and extract the AI response and interview state
    const { aiResponse, interviewState } =
      await geminiService.continueInterviewSession(
        conversationId,
        message.trim()
      )

    // Use 200 OK status
    // Send the AI response and interview state back to the client
    res.status(200).json({
      conversationId,
      message: aiResponse,
      interviewState, // 'ongoing' or 'finished'
    })

    // Log the successful continuation of the interview and interview state
    console.log(
      `Controller: Interview ${conversationId} continued. State: ${interviewState}`
    )
  } catch (error) {
    console.error("Controller Error - continueInterview:", error.message)

    // Handle specific known errors from the service
    if (error.message === "Conversation not found.") {
      return res.status(404).json({
        error: "Conversation not found. Please start a new interview.",
      })
    }
    if (error.message.includes("AI response blocked due to safety settings")) {
      return res.status(400).json({ error: error.message })
    }
    // Generic server error
    res.status(500).json({
      error:
        error.message ||
        "An unexpected error occurred while continuing the interview.",
    })
  }
}

module.exports = { startInterview, continueInterview }
