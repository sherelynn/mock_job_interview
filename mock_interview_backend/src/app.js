const express = require("express")
const cors = require("cors")

//========== INITIALISE EXPRESS ==========//
const app = express()

//========== MIDDLEWARE ==========//
app.use(cors()) // Enable CORS for all origins (adjust for production)
app.use(express.json()) // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })) // Parse form data

//========== LOGGING MIDDLEWARE ==========//
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

//========== BASIC ROOT ROUTE ==========//
app.get("/", (req, res) => {
  res.send("Welcome to the Mock Interview Backend!")
})

//========== MOUNT ROUTES ==========//
// To be added later

//========== NOT FOUND HANDLER ==========//
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" })
})

//========== BASIC GLOBAL ERROR HANDLER ==========//
// Catches errors passed via next(error) from controllers / services
app.use((err, req, res, next) => {
  console.error("Global Error Handler: ", err.stack || err)

  // Avoid sending stack trace in production
  const isProduction = process.env.NODE_ENV === "production"
  const errorResponse = isProduction
    ? { message: "Internal Server Error" }
    : { message: "Internal Server Error", error: err.stack || err }
  res.status(500).json(errorResponse)
})

module.exports = app
