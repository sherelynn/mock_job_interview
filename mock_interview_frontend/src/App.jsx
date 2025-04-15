import React, { useState, useRef, useEffect } from "react"
import axios from "axios"
import "./App.css"

// DEFINE BASE URL FOR BACKEND
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

function App() {
  /*========== STATE VARIABLES ==========*/
  const [jobTitle, setJobTitle] = useState("")
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([]) // { sender: 'user'/'ai', text: '...' }
  const [userInput, setUserInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [interviewState, setInterviewState] = useState("setup") // 'setup', 'ongoing', 'finished'
  const chatEndRef = useRef(null) // To auto-scroll chat

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  /*========== HANDLER FUNCTIONS ==========*/
  // Function to handle starting the interview
  const handleStartInterview = async e => {
    // Prevent form submission reload
    e.preventDefault()

    // Validate job title input
    if (!jobTitle.trim()) {
      setError("Please enter a valid job title.")
      return
    }

    setIsLoading(true)

    setError(null)

    setMessages([]) // Clear previous messages

    setInterviewState("setup") // Reset state

    setConversationId(null)

    try {
      // Make API call to start the interview
      const response = await axios.post(`${BACKEND_URL}/api/interview/start`, {
        jobTitle,
      })

      // Logging response for debugging
      console.log("Interview started:", response.data)

      // Destructure response data
      const {
        conversationId: newConversationId,
        message: firstQuestion,
        interviewState: state,
      } = response.data

      setConversationId(newConversationId)

      setMessages([{ sender: "ai", text: firstQuestion }])

      setInterviewState(state)

      setJobTitle("") // Clear input after starting
    } catch (err) {
      console.error("Error starting interview:", err)
      setError(
        err.response?.data?.error ||
          "Failed to start interview. Is the backend running?"
      )
      setInterviewState("setup") // Remain in setup on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async e => {
    // Prevent form submission reload
    e.preventDefault()

    // Validate user input
    if (!userInput.trim() || !conversationId || interviewState !== "ongoing") {
      // Don't send empty messages or if interview isn't ongoing
      return
    }

    const userMessage = userInput

    setMessages(prev => [...prev, { sender: "user", text: userMessage }])

    setUserInput("") // Clear input field immediately

    setIsLoading(true)

    setError(null)

    try {
      // Continue the interview
      // Make API call to send user message and get AI response
      const response = await axios.post(
        `${BACKEND_URL}/api/interview/continue`,
        {
          conversationId,
          message: userMessage,
        }
      )

      // Destructure or extract message and interview state from response
      const { message: aiResponse, interviewState: newState } = response.data

      setMessages(prev => [...prev, { sender: "ai", text: aiResponse }])

      setInterviewState(newState) // Update interview state ('ongoing' or 'finished')
    } catch (err) {
      console.error("Error sending message:", err)
      const errorMsg =
        err.response?.data?.error || "Failed to get response from AI."
      setError(errorMsg)

      setMessages(prev => [
        ...prev,
        { sender: "system", text: `Error: ${errorMsg}` },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-container">
      <h1>Mock Interview Practice</h1>

      {interviewState === "setup" && (
        <form onSubmit={handleStartInterview} className="interview-setup">
          <label htmlFor="jobTitle">Enter Job Title to Interview For:</label>
          <input
            type="text"
            id="jobTitle"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            placeholder="e.g., Software Engineer at Turners Cars"
            required
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !jobTitle.trim()}>
            {isLoading ? "Starting..." : "Start Interview"}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      )}

      {(interviewState === "ongoing" || interviewState === "finished") && (
        <>
          <div className="chat-window">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <strong>
                  {msg.sender === "ai"
                    ? "Interviewer:"
                    : msg.sender === "user"
                    ? "You:"
                    : "System:"}
                </strong>
                {/* Render text with line breaks */}
                {/* Replace the buggy message display code with this */}
                {msg.text
                  ? msg.text.split("\n").map(
                      (
                        line,
                        i // Added .text here
                      ) => (
                        <React.Fragment key={i}>
                          {line}
                          <br />
                        </React.Fragment>
                      )
                    )
                  : "Message not available."}
              </div>
            ))}
            {isLoading && (
              <div className="message ai">
                <strong>Interviewer:</strong> Thinking...
              </div>
            )}
            {/* Element to scroll to */}
            <div ref={chatEndRef} />
          </div>

          {interviewState === "ongoing" && (
            <form onSubmit={handleSendMessage} className="input-area">
              <textarea
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="Type your answer here..."
                rows="3"
                required
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !userInput.trim()}>
                {isLoading ? "Sending..." : "Send Answer"}
              </button>
              {error && <p className="error-message below-input">{error}</p>}
            </form>
          )}

          {interviewState === "finished" && (
            <div className="interview-finished">
              <p>
                <strong>Interview Finished.</strong>
              </p>
              <button
                onClick={() => {
                  // Reset logic to allow starting a new interview
                  setInterviewState("setup")
                  setMessages([])
                  setConversationId(null)
                  setError(null)
                  setJobTitle("") // Clear job title state too if needed
                }}>
                Start New Interview
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
