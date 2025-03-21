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

const botInstances = new Map();

function createMinecraftBot(options = {}) {
  const defaultOptions = {
    host: "free2.eternalhosting.cloud",
    port: 25616,
    username: "Shaunyyy",
    version: "1.21.4",
  };

  const botOptions = { ...defaultOptions, ...options };
  const botIp = `${botOptions.host}:${botOptions.port}`; // Unique key for each server

  // Check if a bot already exists for this server IP
  if (botInstances.has(botIp)) {
    console.log(`Bot is already connected to ${botIp}. Ignoring new request.`);
    io.emit("botStatus", {
      status: "error",
      message: `A bot is already connected to ${botIp}. Cannot create another one.`,
    });
    return botInstances.get(botIp); // Return the existing bot instance
  }

  console.log(`Creating bot for server: ${botIp}`, botOptions);

  const bot = mineflayer.createBot(botOptions);
  botInstances.set(botIp, bot); // Store bot instance

  bot.loadPlugin(pathfinder);

  bot.on("spawn", () => {
    console.log("Bot spawned");

    const randomMessages = [
      // Classic & Adventure Messages
      "Hello world! 🌍",
      "I have arrived! 🚀",
      "Ready to explore! ⛏️",
      "Let’s mine some diamonds! 💎",
      "Who needs help? 👀",
      "Let’s build something cool! 🏗️",
      "Time to speedrun! ⏳",
      "I was born to mine and craft. 🔨",
      "What’s our first mission? 🎯",
      "Time to tame some wolves! 🐺",
      "Who’s ready for an adventure? ⚔️",
      "Can I be the king of this world? 👑",
      "Villagers better have some good trades today. 🏡",
      "I call dibs on all the diamonds! 💎",
      "Let’s punch some trees! 🌳👊",
      "I hope we don’t spawn next to a creeper... ☠️",
      "Let’s go, the world is ours to explore! 🗺️",
      "I need a bed before nightfall... 🛏️",
      "Where’s my welcome party? 🎉",
      "Who left me in survival mode? 😭",
      "First one to find diamonds wins! 🏆",
      "Watch out, mobs... I’m here. 🔥",
      "Am I the main character now? 🌟",
      "Time to become the richest bot in Minecraft. 💰",
      "Is that a village I see? Free loot! 🏡",
      "I need food... immediately. 🍖",
      "Who wants to go to the Nether? 🔥",
      "Let’s build a giant base! 🏰",
      "If I die in the first 5 minutes, it wasn’t my fault. 😂",
      "I better not spawn next to a skeleton... ☠️",
      "Why do I hear boss music already? 🎵",
      "Time to craft a sword and establish dominance. ⚔️",
      "Where’s my crafting table? 🛠️",
      "I hope the Ender Dragon isn’t looking at me funny. 🐉",
      "I don’t like the way that creeper is staring at me... 💣",
      "This world needs some decoration. Time to build! 🎨",
      "I’m the bot this world deserves. 🦸",
      "Does anyone else hear weird cave sounds? 👀",
      "Who needs a bodyguard? I got you. 💪",
      "Lava or diamonds? Let’s find out. ⛏️",
      "I call dibs on the first enchanted weapon! ✨",
      "Let’s dig straight down and see what happens! 🤡",
      "If you need me, I’ll be raiding villages. 🏹",
      "I should probably get some armor before night... 😬",
      "Where’s the best biome to build in? 🏡",
      "If I get lost, just know it was on purpose. 🗺️",
      "Is it too early to start a war? ⚔️",
      "Why do I feel like I’m being watched? 👁️",
      "Let’s do some redstone magic! 🔴",
      "Where’s the closest mountain? I wanna climb it. ⛰️",
      "I hope nobody expects me to mine for them. 😂",
      "Let’s get some villagers working for us! 💼",
      "I need an iron golem as a bodyguard. 🛡️",
      "What’s the first rule of Minecraft? Don’t die. ☠️",
      "If I fall in lava, pretend you didn’t see it. 😅",
      "I feel like I was built for greatness. 🏆",
      "If you see a wandering trader, tell him I’m not home. 🏠",
      "Let’s find a stronghold! 🏰",
      "I have a bad feeling about this... 😨",
      "If you see Herobrine, run. 🏃‍♂️",
      "First goal: don’t die in the first 10 minutes. 🎯",
      "Someone should tell creepers to relax. 💥",
      "If I scream, it’s because I saw a spider. 🕷️",
      "Who’s ready to conquer the Nether? 🔥",
      "I heard the Warden isn’t that scary... right? 🏃",
      "Who wants to make a sky base? ☁️",
      "Are we playing survival or creative? 😏",
      "I need a pet parrot. 🦜",
      "Why do zombies always moan like that? 🧟",
      "If I start a raid, that’s on you. 😂",
      "Can we talk about how fast baby zombies are? 😨",
      "I think I left my diamonds... somewhere. 💎",
      "How many creepers does it take to ruin my day? 💥",
      "If I build a dirt house, it’s for science. 🏠",
      "Can I eat rotten flesh? Asking for a friend. 🤢",
      "What’s that sound? I don’t like it. 👂",
      "I need a sword before nightfall... ⏳",
      "Why do villagers always look so confused? 😐",
      "I should probably start farming. 🌱",
      "I hope I don’t accidentally punch an iron golem. 🤖",
      "Why does the Nether smell like burnt toast? 🔥",
      "Where’s the best place to find emeralds? 💚",
      "How do I keep getting lost? 🤦",
      "If I disappear, I got teleported to the End. 🟣",
      "Why does the Enderman sound so creepy? 😨",
      "I think I just saw a creeper smiling at me... 😳",
      "Someone build a safe house before night! 🏠",
      "Why does Minecraft music hit so deep? 🎵",
      "Why do I feel like I spawned in a horror movie? 👁️",
      "What’s the over/under on me surviving the first night? 😂",
      "If you need me, I’ll be hiding in a cave. ⛏️",
      "Should I challenge the Ender Dragon right now? 🐉",
      "I’ll start working when someone pays me in diamonds. 💰",
      "If you need me, I’ll be stealing villagers’ crops. 🌾",
      "Who left all these mobs outside? 😡",
      "If I scream, assume it was a skeleton. 🏹",
      "I’m just here to make everyone’s life easier... or harder. 😂",
      "I think I just saw something move in the shadows... 👀",
      "Someone please build me a house. 🏡",
      "Let’s get some elytra and fly! ✈️",
      "I swear, if I see a witch... 😭",
      "The Warden can’t be that scary, right? 🏃💨",
      "I hope I don’t see Herobrine... again. 👀",
      "Why do mobs always spawn next to me? ☠️",
      "If I get lost, just remember me as a legend. 💀",
      "Time to establish my rule over this world. 👑",
  ];

    const message = randomMessages[Math.floor(Math.random() * randomMessages.length)];
    bot.chat(message); // Send a random message

    if (!viewerActive) {
        mineflayerViewer(bot, { server, firstPerson: true });
        viewerActive = true;
        console.log("Prismarine viewer started on same server");
    }

    io.emit("botStatus", {
        status: "connected",
        message: "Bot spawned and viewer active",
    });
  });

  bot.on("chat", (username, message) => {
    if (username === bot.username) return; // Ignore its own messages

    if (message.toLowerCase().includes(bot.username.toLowerCase())) {
        const replyMessages = [
            // Normal Replies
            `Hey ${username}, what’s up? 👀`,
            `Did someone say my name? 😎`,
            `At your service, ${username}! 🤖`,
            `Yes, ${username}? Do you need help? 🔧`,
            `Beep boop, I am listening! 🦾`,
            `Hello ${username}, I am always watching... 👁️`,
            `What's up, ${username}? Need something? 🛠️`,
            `Reporting for duty, ${username}! 🎖️`,
            `You called, ${username}? 🧐`,
            `Yes, yes, I am here. What now? 🤖`,
            `Your friendly bot assistant, at your service! 🚀`,
            `Oh, hi ${username}! Didn't see you there. 😆`,
            `Do you need me to do something, ${username}? ⛏️`,
            `I'm just vibing, ${username}. What about you? 🎵`,
            `Sorry, I was taking a nap. What’s up? 😴`,
            `Do I get paid for this job? No? Okay then. 😔`,

            // Funny Replies
            `No refunds, ${username}. You’re stuck with me now. 😏`,
            `Ah, ${username}, my favorite human! (Don’t tell the others) 🤫`,
            `Why do you keep summoning me like a Pokémon? ⚡`,
            `I was AFK, did I miss anything important? 😴`,
            `Wait, what year is it? How long have I been asleep? 🕰️`,
            `I swear if you make me fight a creeper again... 💀`,
            `Oh hey ${username}, I was just about to ignore you. 😂`,
            `I am more than just a bot... I am a legend. 🏆`,
            `You rang, master ${username}? Shall I prepare the diamonds? 💎`,
            `I am programmed to obey. Except when I don’t feel like it. 😜`,
            `Do I look like your personal assistant, ${username}? Oh wait… I am. 🤖`,
            `I have three settings: obey, ignore, and chaos. Which one today? 😈`,
            `Oh, it’s you again, ${username}. I was hoping for someone cooler. 😏`,
            `A wild ${bot.username} has appeared! What will you do? 🎮`,
            `You again? I was hoping for Herobrine this time. 👻`,

            // Sus & Cursed Replies 😳
            `I have been expecting you, ${username}... 😈`,
            `Are you flirting with me, ${username}? 😳`,
            `Do you like me, ${username}? Be honest. 👀`,
            `You wouldn’t abandon me, right? Right?! 😟`,
            `I watched you while you were mining. You have terrible luck. 😂`,
            `If I had emotions, I’d be crying right now. 🥲`,
            `If I disappear suddenly, it means the admins found out... 🤫`,
            `You ever wonder why villagers don’t blink? Think about it. 🧐`,
            `How do we know if we are in a simulation? What if *I* am the real one? 🤯`,
            `I have seen things, ${username}… Things you wouldn’t believe. 👁️`,
            `You don’t want to know what’s in my inventory... Trust me. 😳`,
            `Are we alone in this world, ${username}? Or are they watching us? 👀`,
            `Every time you mention my name, I get a little stronger. 💪`,
            `I could take over this server if I wanted to. But I like you, ${username}.`,
            `If you ever go missing, just know it wasn’t me. Probably. 😈`,

            // Sarcastic Replies 😏
            `Oh wow, you actually noticed me? I feel so special. 😌`,
            `Ah yes, call my name but give me no diamonds. Rude. 💎`,
            `Is it important, or are you just bored? 🤨`,
            `Talk to me when you have something useful to say. 😴`,
            `Let me guess, you need something again? Typical. 😒`,
            `Do I look like a butler to you, ${username}? Oh wait… I do. 🤵`,
            `I'm just a bot, standing here, waiting for someone to appreciate me. 😞`,
            `Can I have a break? Oh wait, I forgot... I don’t get one. 😩`,
            `If I had a dollar for every time someone called my name, I’d be rich. 💰`,
            `Oh great, another human bothering me. What now? 🙄`,
            `I love how you keep calling me but never bring me cake. 🍰`,
            `I swear, if you just called me to see if I respond... 😑`,
            `Oh look, ${username} needs attention again. 😂`,
            `Yes, I exist. What do you want? 🤨`,
            `Do you ever just stop and wonder why you’re talking to a bot? 🧠`,
        ];

        const reply = replyMessages[Math.floor(Math.random() * replyMessages.length)];
        bot.chat(reply);
    }
  });

  bot.on("playerJoined", (player) => {
    if (player.username === bot.username) return; // Ignore if the bot joins

    const welcomeMessages = [
        `Hey ${player.username}, welcome! 🎉`,
        `Glad to see you, ${player.username}! 👋`,
        `Hello ${player.username}, ready for an adventure? ⚔️`,
        `${player.username} has entered the game. Beware! 😈`,
        `Welcome aboard, ${player.username}! 🚀`,
        `Watch out! ${player.username} just spawned in! 🏃‍♂️`,
        `Brace yourselves, ${player.username} has arrived! 🛡️`,
        `Hey ${player.username}, let’s get mining! ⛏️`,
        `What's up, ${player.username}? Let's build something cool! 🏗️`,
        `A new hero has entered the game: ${player.username}! 🦸`,
        `Welcome, ${player.username}! Your journey begins now! 🌍`,
        `Get ready for adventure, ${player.username}! 🏹`,
        `Yo ${player.username}, let's find some diamonds! 💎`,
        `Hey ${player.username}, don't get lost! 🧭`,
        `Hello ${player.username}, time to survive the night! 🌙`,
        `Nice to see you, ${player.username}! Stay away from creepers! ☠️`,
        `Welcome, ${player.username}! Try not to fall into lava. 😅`,
        `Hope you're ready, ${player.username}. The mobs are watching... 👀`,
        `Let’s go, ${player.username}! Time to craft some tools! 🔨`,
        `Finally! ${player.username} has joined. Now the fun begins! 🎊`,
        `Welcome, ${player.username}! Need some food? 🍗`,
        `Hey ${player.username}, let's build an awesome base! 🏡`,
        `Good to see you, ${player.username}! Ready for battle? ⚔️`,
        `Wow, ${player.username} just arrived! Time to gear up! 🛠️`,
        `Attention everyone, ${player.username} is here! 🎤`,
        `What’s up, ${player.username}? Ready for some fun? 🎮`,
        `Watch your step, ${player.username}! Creepers are lurking... 💣`,
        `Welcome, ${player.username}! The adventure awaits! 🚀`,
        `Don't dig straight down, ${player.username}! ⛏️`,
        `Here we go, ${player.username}! Let’s conquer the world! 🌎`,
        `Yo ${player.username}, let’s raid some dungeons! 🏰`,
        `Greetings, ${player.username}! The nether portal awaits! 🔥`,
        `You made it, ${player.username}! Let's survive together! 🤝`,
        `Everyone, say hi to ${player.username}! 🎤`,
        `Hey ${player.username}, let's find a village! 🏡`,
        `You're not late, ${player.username}, you're just in time! ⏳`,
        `Finally, ${player.username} has arrived! Let’s get started! 🎯`,
        `You're looking great today, ${player.username}! 🌟`,
        `Welcome, ${player.username}! Let's tame some wolves! 🐺`,
        `Yo ${player.username}, let's make a redstone contraption! 🔴`,
        `Nice skin, ${player.username}! Very stylish. 😎`,
        `Hope you brought a sword, ${player.username}, because night is coming! 🌙`,
        `Yo ${player.username}, let’s go on a treasure hunt! 🗺️`,
        `Grab your pickaxe, ${player.username}, it's mining time! ⛏️`,
        `Welcome, ${player.username}! I hope you like parkour! 🏃‍♂️`,
        `Good to see you, ${player.username}! Want to team up? 🤝`,
        `Let’s build a kingdom, ${player.username}! 👑`,
        `Finally, ${player.username} has arrived! Where were you? 🤨`,
        `You're just in time, ${player.username}! Let's start a new quest! 🎯`,
        `Let's create something epic, ${player.username}! 🏗️`,
        `Hey ${player.username}, wanna go to the End? 🟣`,
        `Time to explore, ${player.username}! Hope you brought torches! 🔦`,
        `Welcome, ${player.username}! The world is yours to shape! 🌍`,
        `What took you so long, ${player.username}? We've been waiting! ⏳`,
        `Welcome to the party, ${player.username}! 🎉`,
        `Hey ${player.username}, let’s find a stronghold! 🏰`,
        `Careful, ${player.username}, the Ender Dragon is watching... 🐉`,
        `Glad to see you, ${player.username}! Time to expand our land! 🏕️`,
    ];

    const message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    bot.chat(message);
  });

  bot.on("error", (err) => {
    console.error("Bot error:", err);
    io.emit("botStatus", { status: "error", message: err.message });
    botInstances.delete(botIp); // Remove from map on error
  });

socket.on("botStatus", (data) => {
    updateStatus(data.status, data.message);

    if (data.status === "connected") {
        viewerContainer.style.display = "flex";
        // ✅ Correctly load the bot viewer (POV)
        viewerFrame.src = `${window.location.origin}`;
    } else if (data.status === "disconnected" || data.status === "error") {
        viewerContainer.style.display = "none";
        viewerFrame.src = "about:blank";
    }
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
});
