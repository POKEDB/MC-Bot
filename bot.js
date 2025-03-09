const mineflayer = require("mineflayer");
const { mineflayer: mineflayerViewer } = require("prismarine-viewer");
const express = require("express");
const socketIo = require("socket.io");
const path = require("path");
const Vec3 = require("vec3");

const app = express();
const server = require("http").Server(app);
const serverPort = process.env.PORT || 3000; // Render assigns dynamic ports

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

    // Attach the bot viewer to the same server (NO SEPARATE PORT)
    mineflayerViewer(bot, { output: app, firstPerson: true });
    console.log(`🎥 Bot viewer is running at /bot-view`);

    // Anti-AFK: Randomized movement every 25 seconds
    setInterval(() => {
      const actions = ["jump", "sneak", "left", "right"];
      const action = actions[Math.floor(Math.random() * actions.length)];
      bot.setControlState(action, true);
      setTimeout(() => bot.setControlState(action, false), Math.random() * 1500 + 500);
    }, 25000);
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

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Control page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Redirect /bot-view to the same service (NO SEPARATE PORT)
app.get("/bot-view", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "bot-view.html"));
});

// Start server
server.listen(serverPort, () => {
  console.log(`🚀 Server running at http://localhost:${serverPort}`);
});
