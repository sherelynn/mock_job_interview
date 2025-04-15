const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai")
const config = require("../config/index")

//========== GEMINI SETUP ==========//

const genAI = new GoogleGenerativeAI(config.geminiApiKey)

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro-exp-03-25", // or another suitable model
})

const generationConfig = {
  temperature: 1, // Controls randomness (adjust as needed)
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536, // Maximum tokens in the response
  responseMimeType: "text/plain", // Response format
}

const safetySettings = [
  // Adjust safety settings as needed
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

// In-memory store for conversation (Replace with DB)
const conversations = {} // { conversationId: { chat: ChatSession, jobTitle: string, questionCount: number, history: Array } }

const MAX_QUESTIONS = 7 // "Tell me about yourself" + 6 follow-up questions

//================ EXPORTED SERVICE ===============//
//========== START NEW INTERVIEW SESSION ==========//

const startInterviewSession = async jobTitle => {
  // Create a unique conversation ID at the start of each session
  const conversationId = `conversation_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}`

  //========== INITIAL PROMPT ==========//
  // This prompt is designed to guide the AI in conducting a structured interview, ensuring that it asks relevant questions and provides constructive feedback based on the candidate's responses. The prompt is tailored to the specific job title, making it more relevant and effective for the interview process.
  const initialPrompt = `You are an expert interviewer evaluating a candidate for the role of ${jobTitle}. Your goal is to assess the candidate's suitability for this role. Start the interview by asking the candidate: "Tell me about yourself." After the candidate responds, ask at least 6 relevant follow-up questions, one at a time, based on their previous answers and the requirement of the ${jobTitle} role. Do not ask all questions at once. Keep your questions concise and typical for a job interview. Do not reveal you are an AI. Maintain a professional and neutral tone. After the 6th follow-up question has been answered by the candidate (meaning the candidate has provided 7 answers in total, including the response to "Tell me about yourself."), provide a feedback on their overall performance. The feedback should summarize their strengths and suggest specific areas for improvement related to their answer and the ${jobTitle} role. Start the feedback with "Okay, that concludes the main part of the interview. Here's some feedback on our conversation: ". Do not ask any more questions after giving feedback.`

  try {
    // Start a new chat session with the initial prompt
    const chat = await model.startChat({
      history: [{ role: "user", parts: [{ text: initialPrompt }] }],
      generationConfig,
      safetySettings,
    })

    // Send initial message to trigger the first question ("Tell me about yourself")
    const result = await chat.sendMessage("Start the interview")

    // Extract the first question from the response
    const firstQuestion = result.response.text()

    // Check for safety blocks in the response
    if (
      result.response.promptFeedback &&
      result.response.promptFeedback.blockReason
    ) {
      console.error(
        `[${conversationId}] Initial prompt blocked due to safety settings: `,
        result.response.promptFeedback
      )
      throw new Error(
        `Request blocked due to safety settings. ${result.response.promptFeedback.blockReason} Please revise the job title.`
      )
    }

    // Store the conversation details
    conversations[conversationId] = {
      chat,
      jobTitle,
      questionCount: 1,
      history: [
        { role: "user", parts: [{ text: initialPrompt }] },
        { role: "model", parts: [{ text: firstQuestion }] },
      ],
    }

    // Log the start of the interview session for debugging
    console.log(
      `[${conversationId}] Interview session started for ${jobTitle}. First question generated.`
    )

    // Return the conversation ID and the first question
    return { conversationId, firstQuestion }
  } catch (error) {
    // Handle errors during the session start
    console.error("Error starting interview session:", error)
    // Rethrow or handle specific errors (like safety block)
    if (error.message.includes("Request blocked due to safety settings")) {
      throw error // Re-throw the specific safety error
    }
    // Handle other errors
    throw new Error("Failed to start interview session")
  }
}

//======================= EXPORTED SERVICE ===================//
//========== CONTINUE AN EXISTING INTERVIEW SESSION ==========//

const continueInterviewSession = async (conversationId, userResponse) => {
  // Retrieve the conversation session using the conversationId
  const session = conversations[conversationId] //

  if (!session) {
    throw new Error("Conversation not found.") // Specific error for controller
  }

  // Extract the chat session and question count
  const { chat, questionCount } = session

  try {
    // Log the user response for debugging
    console.log(
      `[${conversationId}] Service received User Answer ${questionCount}: ${userResponse.substring(
        0,
        50
      )}...`
    )
    // Push the user's response to the session history
    session.history.push({ role: "user", parts: [{ text: userResponse }] })

    // Send the user's message to the ongoing chat
    const result = await chat.sendMessage(userResponse)

    // Extract the AI's response from the result
    const aiResponseText = result.response.text()

    // Check for safety blocks in the response
    if (
      result.response.promptFeedback &&
      result.response.promptFeedback.blockReason
    ) {
      console.error(
        `[${conversationId}] Response blocked due to safety settings:`,
        result.response.promptFeedback
      )
      throw new Error(
        `AI response blocked due to safety settings (${result.response.promptFeedback.blockReason}). Please try phrasing your answer differently.`
      )
    }

    // Log the AI's response for debugging
    session.history.push({ role: "model", parts: [{ text: aiResponseText }] })

    // Increment the question count
    session.questionCount += 1

    // Set default state of interview as ongoing - to be changed if max questions reached
    let interviewState = "ongoing"

    // Check if the maximum number of questions has been reached
    if (session.questionCount > MAX_QUESTIONS) {
      // Change interview state to finished
      interviewState = "finished"

      // Log the end of the interview session
      console.log(
        `[${conversationId}] Service determined interview finished. Feedback provided.`
      )

      // Optional: Clean up finished conversations after a delay?
      // setTimeout(() => delete conversations[conversationId], 60000); // Clean up after 1 min
    } else {
      // Log the AI's question for debugging
      console.log(
        `[${conversationId}] Service generated AI Question ${
          session.questionCount
        }: ${aiResponseText.substring(0, 50)}...`
      )
    }

    // Return the AI's response and the current state of the interview
    return { aiResponse: aiResponseText, interviewState } //
  } catch (error) {
    // Handle errors during the session continuation
    console.error(
      `[${conversationId}] Gemini Service Error - continueInterviewSession:`,
      error
    )
    // Re-throw or handle specific errors
    if (error.message.includes("AI response blocked due to safety settings")) {
      throw error // Re-throw the specific safety error
    }
    // Handle generic errors
    throw new Error("Failed to get response from AI service.")
  }
}

module.exports = { startInterviewSession, continueInterviewSession }
