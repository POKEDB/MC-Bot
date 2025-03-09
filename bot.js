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

function createBot() {
  const bot = mineflayer.createBot({
    host: "free2.eternalhosting.cloud",
    port: 25616,
    username: "Shaunyyy",
  });

  bot.once("spawn", () => {
    console.log("✅ Bot joined the server.");

    // Serve Prismarine Viewer manually at "/bot-view"
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
            const viewer = prismarineViewer.createViewer({
              viewDistance: 6
            });
            viewer.mount(document.getElementById('viewer'));
            fetch('/ws') // Connect to WebSocket on the same Render service
              .then(() => viewer.listen())
              .catch(err => console.error("WebSocket Error:", err));
          </script>
        </body>
        </html>
      `);
    });

    mineflayerViewer(bot, { output: server, firstPerson: true });

    console.log("🎥 Bot viewer is now accessible at /bot-view");
  });

  bot.on("end", (reason) => {
    console.log(`⚠️ Bot disconnected: ${reason}. Reconnecting...`);
    setTimeout(createBot, 5000);
  });

  bot.on("kicked", (reason) => {
    console.log(`❌ Kicked: ${reason}. Rejoining...`);
    setTimeout(createBot, 5000);
  });

  bot.on("error", (err) => {
    console.log(`⚠️ Error: ${err}`);
  });

  io.on("connection", (socket) => {
    console.log("🔗 Web client connected");

    socket.on("move", (action) => {
      console.log(`🎮 Received action: ${action}`);

      switch (action) {
        case "jump":
          bot.setControlState("jump", true);
          setTimeout(() => bot.setControlState("jump", false), 500);
          break;
        case "forward":
          bot.setControlState("forward", true);
          setTimeout(() => bot.setControlState("forward", false), 500);
          break;
        case "backward":
          bot.look(bot.entity.yaw + Math.PI, bot.entity.pitch, true, (err) => {
            if (err) console.log("⚠️ Error rotating bot:", err);
            else {
              bot.setControlState("forward", true);
              setTimeout(() => bot.setControlState("forward", false), 500);
            }
          });
          break;
        case "sneak":
          bot.setControlState("sneak", true);
          setTimeout(() => bot.setControlState("sneak", false), 500);
          break;
        case "left":
          bot.setControlState("left", true);
          setTimeout(() => bot.setControlState("left", false), 500);
          break;
        case "right":
          bot.setControlState("right", true);
          setTimeout(() => bot.setControlState("right", false), 500);
          break;
        default:
          console.log("⚠️ Unknown action");
      }
    });
  });
}

createBot();

// Serve static files (index.html and CSS)
app.use(express.static(path.join(__dirname, "public")));

// Control page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start the server
server.listen(serverPort, () => {
  console.log(`🚀 Server running at http://localhost:${serverPort}`);
});
