const express = require("express");
const socketIo = require("socket.io");
const mineflayer = require("mineflayer");
const { pathfinder } = require("mineflayer-pathfinder");
const { createBot } = require("mineflayer");
const { mineflayer: mineflayerViewer } = require("prismarine-viewer");

const app = express();
const server = require("http").Server(app);
const serverPort = process.env.PORT || 3001;

// Initialize WebSocket server with CORS support
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Serve static files
app.use(express.static("public"));

// Root route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Bot configuration
let bot = null;
let viewerActive = false;

function createMinecraftBot(options = {}) {
  const defaultOptions = {
    host: "free2.eternalhosting.cloud",
    port: 25616,
    username: "Shaunyyy",
    version: "1.21.4",
  };

  const botOptions = { ...defaultOptions, ...options };

  if (bot) {
    bot.end();
  }

  console.log(`Creating bot with options:`, botOptions);

  bot = createBot(botOptions);

  bot.loadPlugin(pathfinder);

  bot.on("spawn", () => {
    console.log("Bot spawned");

    // Start viewer on port 3000
    if (!viewerActive) {
      mineflayerViewer(bot, { port: 3000, firstPerson: true });
      viewerActive = true;
      console.log("Prismarine viewer started on port 3000");
      io.emit("botStatus", {
        status: "connected",
        message: "Bot spawned and viewer active",
      });
    }
  });

  bot.on("error", (err) => {
    console.error("Bot error:", err);
    io.emit("botStatus", { status: "error", message: err.message });
  });

  bot.on("end", () => {
    console.log("Bot disconnected");
    viewerActive = false;
    io.emit("botStatus", {
      status: "disconnected",
      message: "Bot disconnected",
    });
  });

  return bot;
}

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  // Create bot with provided server details
  socket.on("createBot", (serverDetails) => {
    try {
      createMinecraftBot(serverDetails);
      socket.emit("botStatus", {
        status: "connecting",
        message: "Connecting to server...",
      });
    } catch (err) {
      socket.emit("botStatus", { status: "error", message: err.message });
    }
  });

  // Bot movement controls
  socket.on("moveBot", (direction) => {
    if (!bot) return;

    const controls = {
      forward: () => bot.setControlState("forward", true),
      backward: () => bot.setControlState("back", true),
      left: () => bot.setControlState("left", true),
      right: () => bot.setControlState("right", true),
      jump: () => bot.setControlState("jump", true),
      stop: () => {
        bot.clearControlStates();
      },
    };

    if (controls[direction]) {
      controls[direction]();

      // For keyboard controls, stop movement on keyup event instead of timeout
      // This will be handled by the client
      if (direction !== "stop") {
        // Keep movement active until explicitly stopped
        // This allows for holding down keys for continuous movement
      }
    }
  });

  // Add keyup handler for stopping movement
  socket.on("stopMovement", (control) => {
    if (!bot) return;

    if (control === "all") {
      bot.clearControlStates();
    } else {
      const controlMap = {
        forward: "forward",
        backward: "back",
        left: "left",
        right: "right",
        jump: "jump",
      };

      if (controlMap[control]) {
        bot.setControlState(controlMap[control], false);
        console.log(`Stopped control: ${control}`);
      }
    }
  });
});

// Start the server
server.listen(serverPort, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${serverPort}`);
  console.log(
    "Bot viewer will be available at http://0.0.0.0:3000 after connecting",
  );
});