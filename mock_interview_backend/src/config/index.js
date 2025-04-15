require("dotenv").config()

const config = {
  port: process.env.PORT,
  geminiApiKey: process.env.GEMINI_API_KEY,
}

module.exports = config
