/** @format */

const TelegramBot = require("node-telegram-bot-api");

// Your bot token from BotFather
const TOKEN = "7539303928:AAFKMvcVdM_GvR60QszK7tnWYyZ__jHk3RY";

// Create a bot instance
const bot = new TelegramBot(TOKEN, { polling: true });

console.log("Bot is running...");

// Handle incoming messages
bot.on("message", (msg) => {
  const chatId = msg.chat.id; // This is the numeric ID of the user
  const userInfo = `
User Info:
ID: ${chatId}
Username: @${msg.from.username || "No username"}
First Name: ${msg.from.first_name || "No first name"}
Last Name: ${msg.from.last_name || "No last name"}
Language: ${msg.from.language_code || "No language"}
  `;

  // Send the user their numeric ID
  bot.sendMessage(chatId, `Here is your numeric Telegram ID:\n${userInfo}`);

  // Log the user info in the console
  console.log("User Info:", userInfo);
});
