const mineflayer = require("mineflayer");
const { mineflayer: mineflayerViewer } = require("prismarine-viewer");
const express = require("express");
const socketIo = require("socket.io");
const path = require("path");
const Vec3 = require('vec3');  // Import Vec3 for block positioning
const app = express();
const server = require("http").Server(app);

const serverPort = process.env.PORT || 3000; // Use Render's dynamic port or fallback to 3000

function createBot() {
  const bot = mineflayer.createBot({
    host: "free2.eternalhosting.cloud", // Your server IP
    port: 25616, // Your server port
    username: "Shaunyyy", // Bot username
  });

  bot.on("spawn", () => {
    console.log("Bot joined the server.");

    // Anti-AFK: Randomized movement
    setInterval(() => {
      const actions = ["jump", "sneak", "left", "right"];
      const action = actions[Math.floor(Math.random() * actions.length)];
      bot.setControlState(action, true);
      setTimeout(() => bot.setControlState(action, false), Math.random() * 1500 + 500);
    }, 25000); // Every 25 seconds, performs a random action
  });

  bot.on("end", (reason) => {
    console.log(`Bot disconnected: ${reason}. Reconnecting...`);
    setTimeout(createBot, 5000); // Create a new bot instance
  });

  bot.on("kicked", (reason) => {
    console.log(`Kicked: ${reason}. Rejoining...`);
    setTimeout(createBot, 5000);
  });

  bot.on("error", (err) => {
    console.log(`Error: ${err}`);
  });

  // Define the socket server after the server is created
  const io = socketIo(server);

  io.on("connection", (socket) => {
    console.log("Web client connected");

    socket.on("move", (action) => {
      console.log(`Received action: ${action}`);
      
      switch (action) {
        case "jump":
          bot.setControlState("jump", true);
          setTimeout(() => bot.setControlState("jump", false), 500);
          break;
        case "forward":
          bot.setControlState("forward", true);
          setTimeout(() => bot.setControlState("forward", false), 500); // Move forward for 500ms
          break;
        case "backward":
          // Rotate bot 180 degrees and move forward (which is now the backward direction)
          bot.look(bot.entity.yaw + Math.PI, bot.entity.pitch, true, (err) => {
            if (err) {
              console.log("Error rotating bot:", err);
            } else {
              bot.setControlState("forward", true); // Move forward in the opposite direction
              setTimeout(() => bot.setControlState("forward", false), 500); // Move for 500ms
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
          console.log("Unknown action");
      }
    });
  });
}

// Start the bot
createBot();

// Setup Express to serve the viewer at a public URL
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Serve bot viewer page (e.g., /bot-view)
app.get('/bot-view', (req, res) => {
    res.sendFile(path.join(__dirname, 'bot-view.html'));  // Serve bot viewer page
});

server.listen(serverPort, () => {
    console.log(`Express server running on http://localhost:${serverPort}`);
});
