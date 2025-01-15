/** @format */

require("dotenv").config();
const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");
const User = require("./models/user");
const { SocksProxyAgent } = require("socks-proxy-agent");

const newMessageText = `
سلام وقت بخیر🌹

مراحل تسویه و درخواست برای ارسال بار:

1⃣ ارسال تصویر فیش واریزی به آیدی 

@Vimabarbari


2⃣ فوروارد کردن تمامی ترازوها و موجودی هایی که باید تحویل بگیرید. ( ریپلای نکنید❌)

3⃣ ارسال نام، شماره تماس، آدرس و کدپستی ( ریپلای نکنید❌)

📣 مهلت تسویه پست و ترازوها نهایت ۲۴ ساعت بوده. بعد از آن شامل جریمه و جایگزینی میشود.

❌ مهلت نگهداری وسایل نهایتا ۱ ماه میباشد. بعد از این زمان مجموعه مسئولیتی در قبال سلامت وسایل تحویل نگرفته‌ی شما ندارد.

✅ ارسال وسایل برای هر دوره فقط با اعلام درخواست ارسال شما و در زمان معین شده انجام می‌شود. (بدون اعلام درخواست شما وسیله ای ارسال نمیشود.)

از اعتماد شما به مجموعه ویما سپاسگذاریم
`;

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEFAULT_DESCRIPTION = process.env.DEFAULT_DESCRIPTION;
const DEFAULT_ADMIN_ID = process.env.DEFAULT_ADMIN_ID;
const PROXY = process.env.PROXY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB successfully.");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

const proxyUrl = "socks5h://127.0.0.1:1080"; // Shadowsocks proxy running on localhost
const agent = new SocksProxyAgent(proxyUrl);

// Create a bot instance
const bot = new TelegramBot(TOKEN, {
  polling: true,
  request: {
    agent: agent,
  },
});

console.log("Bot has started successfully.");

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Inline keyboard with buttons
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "راهنمای سفارش", callback_data: "button1" },
          { text: "پروفایل من", callback_data: "button2" },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, "یکی از گزینه های زیر را انتخاب نماییدث:", options);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  // Inline keyboard with buttons
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "پیگیری سفارش", callback_data: "button1" },
          { text: "پروفایل من", callback_data: "button2" },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, newMessageText);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  try {
    let user = await User.findOne({ telegramId: chatId });

    if (!user) {
      user = new User({
        telegramId: chatId,
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        language: msg.from.language_code,
      });

      await user.save();
      bot.sendMessage(chatId, "اطلاعات شما قبلا ثبت شده است.");
    }
  } catch (error) {
    console.error("Error interacting with the database:", error.message);
    bot.sendMessage(chatId, "An error occurred while processing your data.");
  }
});

// Handle button clicks
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (query.data === "button1") {
    // Simulate sending the /help command
    bot.processUpdate({
      update_id: query.update_id,
      message: {
        message_id: query.message.message_id,
        from: query.from,
        chat: query.message.chat,
        date: Math.floor(Date.now() / 1000),
        text: "/help",
      },
    });
  } else if (data === "button2") {
    bot.sendMessage(chatId, "You clicked Button 2!");
  }
});

// Handle incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  console.log(chatId);

  bot
    .getChat(chatId)
    .then((chat) => {
      console.log("User ID:", chat.id);
    })
    .catch((error) => {
      console.error("Error fetching user info:", error.message);
    });

  // Check if the message contains a photo
  if (msg.photo && msg.caption) {
    // Extract usernames with @ from the caption
    const matches = msg.caption.match(/@\w+/g);

    const chatId = msg.chat.id; // This is the numeric ID of the user
    const userInfo = `
        User Info:
        ID: ${chatId}
        Username: @${msg || "No username"}
        First Name: ${msg.from.first_name || "No first name"}
        Last Name: ${msg.from.last_name || "No last name"}
        Language: ${msg.from.language_code || "No language"}
          `;

    // Send the user their numeric ID
    bot.sendMessage(chatId, `Here is your numeric Telegram ID:\n${userInfo}`);

    // Log the user info in the console
    console.log("User Info:", userInfo);

    if (matches) {
      // Send the photo to the extracted usernames
      for (const username of matches) {
        console.log("user" + username);

        // Handle incoming messages

        try {
          await bot.sendPhoto(
            username,
            msg.photo[msg.photo.length - 1].file_id,
            {
              caption: `${DEFAULT_DESCRIPTION}\n\nSender: @${
                msg.from.username || "Unknown"
              }`,
            }
          );

          console.log(`Photo sent to ${username}.`);
        } catch (error) {
          console.error(`Error sending to ${username}:`, error.message);

          bot.sendMessage(
            -4542929426,
            `Error sending to ${username}: ${error.message}`
          );

          if (error.response && error.response.statusCode === 403) {
            // Notify the sender that the user has not started the bot
            bot.sendMessage(
              chatId,
              `Error: User ${username} has not started the bot, and the message cannot be sent.`
            );
          } else {
            // Send an error message to the default admin ID
            try {
              await bot.sendPhoto(
                DEFAULT_ADMIN_ID,
                msg.photo[msg.photo.length - 1].file_id,
                {
                  caption: `Error sending to ${username}: ${
                    error.message
                  }\n\nOriginal sender: @${msg.from.username || "Unknown"}`,
                }
              );
              console.log(
                `Photo sent to default admin ID (${DEFAULT_ADMIN_ID}).`
              );
            } catch (adminError) {
              console.error(
                `Error sending to default admin ID (${DEFAULT_ADMIN_ID}):`,
                adminError.message
              );
            }
          }
        }
      }
    } else {
      // If no username was found
      bot.sendMessage(chatId, "No username with @ found in the caption.");
    }
  } else if (msg.photo) {
    bot.sendMessage(
      chatId,
      "Please include a username with @ in the photo caption."
    );
  }
});

// Handle polling errors
bot.on("polling_error", (error) => {
  console.error("Error connecting to Telegram:", error.message);
});

// Monitor channel posts
bot.on("channel_post", async (msg) => {
  if (msg.chat.id.toString() === CHANNEL_ID) {
    const text = msg.text || msg.caption || ""; // Get text or caption
    const photo = msg.photo ? msg.photo[msg.photo.length - 1].file_id : null; // Get the file_id of the image

    // Extract usernames with @ from the text or caption
    const usernameMatches = text.match(/@\w+/g); // Example: ['@user1', '@user2']

    if (usernameMatches) {
      try {
        // Remove the "@" and fetch user IDs from the database
        const usernames = usernameMatches.map((u) => u.slice(1)); // ['user1', 'user2']
        const users = await User.find({ username: { $in: usernames } }); // Fetch users with matching usernames
        const userIds = users.map((user) => user.telegramId); // Extract telegram IDs

        // Debug missing usernames
        const missingUsernames = usernames.filter(
          (username) => !users.some((user) => user.username === username)
        );
        if (missingUsernames.length > 0) {
          console.log(
            "These usernames were not found in the database:",
            missingUsernames
          );
          bot
            .sendPhoto("-1002440089598", photo, {
              caption: `خطا در ارسال یا شخص مورد نظر ربات را استارت نکرده است:\n${missingUsernames
                .map((username) => `@${username}`)
                .join("\n")}`,
              parse_mode: "HTML", // Use HTML parse mode
            })
            .then(() => {
              console.log("Error message sent to the group.");
            })
            .catch((err) => {
              console.error(
                "Failed to send message to the group:",
                err.message
              );
            });

          console.log("send error to group");
        }

        if (userIds.length > 0) {
          // Send the channel post with image to each user ID
          for (const userId of userIds) {
            try {
              if (photo) {
                // If there's a photo, send it with the caption
                await bot.forwardMessage(userId, msg.chat.id, msg.message_id);
                console.log("Photo forwarded successfully");

                await bot.sendMessage(userId, newMessageText);
                await bot.sendSticker(
                  userId,
                  "CAACAgQAAxkBAAIBYGeE1Igzn8oMWenjNW_rubPJeNYhAALAEQACr9XwUvvzUOCVe4d5NgQ"
                );

                await bot.sendSticker(
                  userId,
                  "CAACAgQAAxkBAAIBX2eE1IZ0URkm1mo2pEIKSZYEPcKiAAIzEgACNELwUgi1GYAx562fNgQ"
                );

                console.log(`sticker  successfully sent to ${userId}`);
              } else {
                const cleanedCaption = text?.replace(/@\w+/g, "");

                // If no photo, send a plain text message
                await bot.sendMessage(userId, cleanedCaption);
                await bot.sendMessage(userId, `${newMessageText}`);
                console.log(`Text message successfully sent to ${userId}`);
              }
            } catch (error) {
              console.error(`Error sending to ${userId}:`, error.message);
            }
          }
        } else {
          console.log("No matching users found in the database.");
        }
      } catch (error) {
        console.error("Error querying the database:", error.message);
      }
    } else {
      console.log("No usernames found in the channel post.");
    }
  }
});

bot.on("message", (msg) => {
  console.log(`Chat ID: ${msg.chat.id}`);
});
