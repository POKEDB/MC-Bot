const mineflayer = require("mineflayer");
const { mineflayer: mineflayerViewer } = require("prismarine-viewer");
const express = require("express");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = require("http").Server(app);
const serverPort = process.env.PORT || 3000; // Render assigns a dynamic port

// Initialize WebSocket server with CORS support
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ✅ Define bot-view route **outside** createBot()
app.get("/bot-view", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Minecraft Bot Viewer</title>
      <script src="https://unpkg.com/prismarine-viewer@latest/dist/index.js"></script>
    </head>
    <body style="margin: 0; overflow: hidden;">
      <div id="viewer" style="width: 100vw; height: 100vh;"></div>
      <script>
        // Wait for the bot to be ready
        window.onload = () => {
          fetch("/viewer-data") // Check if viewer is available
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                const viewer = prismarineViewer.createViewer({
                  viewDistance: 6
                });

                viewer.mount(document.getElementById('viewer'));
                viewer.listen();
                console.log("✅ Viewer initialized successfully");
              } else {
                console.error("❌ Viewer initialization failed:", data.error);
              }
            })
            .catch(err => console.error("❌ Failed to fetch viewer data:", err));
        };
      </script>
    </body>
    </html>
  `);
});

// ✅ Define viewer-data route **outside** createBot()
app.get("/viewer-data", (req, res) => {
  if (global.bot) {
    res.json({ success: true });
  } else {
    res.json({ success: false, error: "Bot is not active" });
  }
});

function createBot() {
  global.bot = mineflayer.createBot({
    host: "free2.eternalhosting.cloud",
    port: 25616,
    username: "Shaunyyy",
  });

  global.bot.once("spawn", () => {
    console.log("✅ Bot joined the server.");
    mineflayerViewer(global.bot, { output: server, firstPerson: true });
    console.log("🎥 Bot viewer is now accessible at /bot-view");
  });

  global.bot.on("end", (reason) => {
    console.log(`⚠️ Bot disconnected: ${reason}. Reconnecting...`);
    setTimeout(createBot, 5000);
  });

  global.bot.on("kicked", (reason) => {
    console.log(`❌ Kicked: ${reason}. Rejoining...`);
    setTimeout(createBot, 5000);
  });

  global.bot.on("error", (err) => {
    console.log(`⚠️ Error: ${err}`);
  });

  io.on("connection", (socket) => {
    console.log("🔗 Web client connected");

    socket.on("move", (action) => {
      console.log(`🎮 Received action: ${action}`);

      switch (action) {
        case "jump":
          global.bot.setControlState("jump", true);
          setTimeout(() => global.bot.setControlState("jump", false), 500);
          break;
        case "forward":
          global.bot.setControlState("forward", true);
          setTimeout(() => global.bot.setControlState("forward", false), 500);
          break;
        case "backward":
          global.bot.setControlState("back", true);
          setTimeout(() => global.bot.setControlState("back", false), 500);
          break;
        case "sneak":
          global.bot.setControlState("sneak", true);
          setTimeout(() => global.bot.setControlState("sneak", false), 500);
          break;
        case "left":
          global.bot.setControlState("left", true);
          setTimeout(() => global.bot.setControlState("left", false), 500);
          break;
        case "right":
          global.bot.setControlState("right", true);
          setTimeout(() => global.bot.setControlState("right", false), 500);
          break;
        default:
          console.log("⚠️ Unknown action");
      }
    });
  });
}

createBot();

// ✅ Only one static file handler
app.use(express.static("public", { extensions: ["html"] }));

// Start the server
server.listen(serverPort, () => {
  console.log(`🚀 Server running at http://localhost:${serverPort}`);
});