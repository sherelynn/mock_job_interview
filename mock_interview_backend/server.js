//========== Main Entry Point ==========//
//========== Startup Server ==========//

const app = require("./src/app") // Import the configured Express app
const config = require("./src/config") // Import PORT from config

const PORT = config.port

app.listen(PORT, () => {
  console.log(`Server is running on http://localhostL:${PORT}`)
})
