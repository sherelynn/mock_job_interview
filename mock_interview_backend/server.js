//========== Main Entry Point ==========//
//========== Startup Server ==========//

const app = require("./src/app") // Import the configured Express app
const config = require("./src/config") // Import PORT from config

//========== VALIDATE ESSENTIAL CONFIG ==========//
if (!config.geminiApiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables.")
  process.exit(1) // Exit if the API key is missing
}

//========== PORT ==========//

const PORT = config.port

app.listen(PORT, () => {
  console.log(`Server is running on http://localhostL:${PORT}`)
})
