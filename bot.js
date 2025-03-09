const mineflayer = require("mineflayer");
const { mineflayer: mineflayerViewer } = require("prismarine-viewer");
const express = require("express");
const socketIo = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const serverPort = process.env.PORT || 3000;

// Prevent multiple server instances
if (!global.serverStarted) {
  server.listen(serverPort, () => {
    console.log(`🚀 Server running at https://mc-bot-27pe.onrender.com/`);
  });
  global.serverStarted = true;
}

// Serve a basic response to confirm server is running
app.get("/", (req, res) => {
  res.send("✅ The Minecraft bot server is running! Go to /viewer for the bot's POV.");
});

// Initialize WebSocket server with CORS support
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

function createBot() {
  if (global.bot) {
    console.log("⚠️ Existing bot detected. Removing...");
    try {
      global.bot.end();
    } catch (err) {
      console.log(`⚠️ Error disconnecting previous bot: ${err}`);
    }
  }

  global.bot = mineflayer.createBot({
    host: "free2.eternalhosting.cloud",
    port: 25616,
    username: "Shaunyyy",
  });

  global.bot.once("spawn", () => {
    console.log("✅ Bot joined the server.");
    try {
      mineflayerViewer(global.bot, { output: server, firstPerson: true });
      console.log(`🎥 Bot POV available at: https://mc-bot-27pe.onrender.com/viewer`);
    } catch (err) {
      console.log(`⚠️ Error initializing viewer: ${err}`);
    }
  });

  global.bot._client.on("resource_pack_send", (data) => {
    console.log("📦 Resource pack received.");
    global.bot._client.write("resource_pack_receive", { hash: data.hash, result: 3 });
    global.bot._client.write("resource_pack_receive", { hash: data.hash, result: 0 });
  });

  global.bot.on("end", (reason) => {
    console.log(`⚠️ Bot disconnected: ${reason}. Reconnecting in 5s...`);
    setTimeout(createBot, 5000);
  });

  global.bot.on("kicked", (reason) => {
    console.log(`❌ Kicked: ${reason}. Rejoining in 5s...`);
    setTimeout(createBot, 5000);
  });

  global.bot.on("error", (err) => {
    console.log(`⚠️ Error: ${err}`);
  });
}

// Start the bot
createBot();
