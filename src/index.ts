import express from "express";
import routes from "./routes/routes";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
import { Database } from "./services/database";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import TelegramBot from "node-telegram-bot-api";
import { createUserInDatabase, sendSol } from "./services/userService";
import { connectMongoDB, sharesCollection } from "./services/mongoService";
import { reconstructPrivateKey, decrypt } from "./utils/cryptoUtils";

dotenv.config();
// console.log("Telegram Bot Token:", process.env.TELEGRAM_BOT_TOKEN);

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

// Initialize database connections
(async () => {
  try {
    // Connect to PostgreSQL
    await Database.connect();

    // Connect to MongoDB
    await connectMongoDB();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
})();

// Initialize Solana connection
// const connection = new Connection("https://api.mainnet-beta.solana.com");
const connection = new Connection("https://api.devnet.solana.com", "finalized");

// Telegram bot commands
bot.onText(/\/start/, async (msg) => {
  console.log("Received /start command:", msg);

  const chatId = msg.chat.id;
  const username = msg.chat.username || `User_${chatId}`;

  try {
    console.log("Creating a new user...");
    const user = await createUserInDatabase(chatId.toString(), username);
    console.log("User created:", user);

    await bot.sendMessage(
      chatId,
      `Welcome, ${username}! Your Solana account has been created.`
    );
    await bot.sendMessage(
      chatId,
      `Your public key is: ${user.solanaPublicKey}`
    );
    await bot.sendMessage(chatId, "What would you like to do next?", {
      reply_markup: {
        keyboard: [
          [{ text: "Check Balance" }],
          [{ text: "Send SOL" }],
          [{ text: "Receive SOL" }],
          [{ text: "Get Private Key" }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  } catch (error) {
    console.error("Error in /start command:", error);
    await bot.sendMessage(
      chatId,
      "An error occurred while creating your account. Please try again."
    );
  }
});

//check balance

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "Check Balance") {
    try {
      // Fetch the user from the database
      const user = await Database.getUserByTelegramId(chatId.toString());

      if (!user || !user.solanaPublicKey) {
        await bot.sendMessage(
          chatId,
          "Could not find your Solana account. Please start the bot again."
        );
        return;
      }

      // Get the balance of the user's public key
      const balance = await connection.getBalance(
        new PublicKey(user.solanaPublicKey)
      );
      const solBalance = balance / LAMPORTS_PER_SOL; // Convert lamports to SOL

      await bot.sendMessage(
        chatId,
        `Your current Solana balance is: ${solBalance.toFixed(4)} SOL`
      );
    } catch (error) {
      console.error("Error fetching balance:", error);
      await bot.sendMessage(
        chatId,
        "An error occurred while fetching your balance. Please try again."
      );
    }
  }
});

//send sol
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Handle "Send SOL" command
  if (text === "Send SOL") {
    try {
      await bot.sendMessage(chatId, "Please enter the recipient's public key:");
      bot.once("message", async (recipientMsg) => {
        const recipientPublicKey = recipientMsg.text?.trim();

        if (
          !recipientPublicKey ||
          !PublicKey.isOnCurve(new PublicKey(recipientPublicKey))
        ) {
          await bot.sendMessage(
            chatId,
            "Invalid recipient public key. Please try again."
          );
          return;
        }

        await bot.sendMessage(
          chatId,
          "Please enter the amount of SOL to send:"
        );
        bot.once("message", async (amountMsg) => {
          const amount = parseFloat(amountMsg.text?.trim() || "0");

          if (isNaN(amount) || amount <= 0) {
            await bot.sendMessage(
              chatId,
              "Invalid amount. Please enter a positive number."
            );
            return;
          }

          try {
            // Fetch user shares from PostgreSQL and MongoDB
            const user = await Database.getUserByTelegramId(chatId.toString());
            if (!user || !user.share1 || !user.share2) {
              await bot.sendMessage(
                chatId,
                "Could not retrieve your account details. Please try again."
              );
              return;
            }

            const mongoShares = await sharesCollection.findOne({
              telegramId: chatId.toString(),
            });
            if (!mongoShares || !mongoShares.share3 || !mongoShares.share4) {
              await bot.sendMessage(
                chatId,
                "Could not retrieve your account details. Please try again."
              );
              return;
            }

            // Reconstruct private key
            const reconstructedPrivateKey = reconstructPrivateKey([
              decrypt(user.share1),
              decrypt(user.share2),
              decrypt(mongoShares.share3),
              decrypt(mongoShares.share4),
            ]);

            // Send SOL
            const transactionSignature = await sendSol(
              reconstructedPrivateKey,
              recipientPublicKey,
              amount
            );

            await bot.sendMessage(
              chatId,
              `Transaction successful! Signature: ${transactionSignature}`
            );
          } catch (error) {
            console.error("Error sending SOL:", error);
            await bot.sendMessage(
              chatId,
              "An error occurred while sending SOL. Please try again."
            );
          }
        });
      });
    } catch (error) {
      console.error("Error in Send SOL flow:", error);
      await bot.sendMessage(chatId, "An error occurred. Please try again.");
    }
  }
});

// Express app setup
const app = express();
const port = 3000;

app.use(express.json());
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
