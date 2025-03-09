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
  global.bot = mineflayer.createBot({
    host: "free2.eternalhosting.cloud",
    port: 25616,
    username: "Shaunyyy",
  });

  global.bot.once("spawn", () => {
    console.log("✅ Bot joined the server.");
    mineflayerViewer(global.bot, { output: server, firstPerson: true });
    console.log("🎥 Bot viewer is now accessible at https://mc-bot-27pe.onrender.com/");
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
}

createBot();

// Start the server
server.listen(serverPort, () => {
  console.log(`🚀 Server running at https://mc-bot-27pe.onrender.com/`);
});