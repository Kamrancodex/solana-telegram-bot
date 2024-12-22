import { v4 as uuidv4 } from "uuid";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import TelegramBot from "node-telegram-bot-api";
import { User } from "../entities/User";
import { encrypt, splitPrivateKey } from "../utils/cryptoUtils";
import { sharesCollection } from "./mongoService";

// Initialize Solana connection
const connection = new Connection("https://api.devnet.solana.com", "finalized");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: true,
});

export async function createUserInDatabase(
  telegramId: string,
  username: string
): Promise<User> {
  const solanaAccount = await createSolanaAccount();

  // Split the private key into 4 shares, requiring 2 shares for reconstruction
  const shares = splitPrivateKey(solanaAccount.privateKey, 4, 2);
  const encryptedShares = shares.map(encrypt);

  // Save 2 shares in PostgreSQL
  const user = User.create({
    id: uuidv4(),
    username,
    telegramId,
    solanaPublicKey: solanaAccount.publicKey,
    share1: encryptedShares[0],
    share2: encryptedShares[1],
    isActive: true,
  });
  await user.save();

  // Save the remaining shares in MongoDB
  await sharesCollection.insertOne({
    telegramId,
    share3: encryptedShares[2],
    share4: encryptedShares[3],
  });

  return user;
}

export async function createSolanaAccount() {
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const privateKey = Buffer.from(keypair.secretKey).toString("hex");

  return { publicKey, privateKey };
}

export async function sendTelegramMessage(chatId: string, message: string) {
  try {
    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error("Failed to send message via Telegram", error);
    throw new Error("Telegram sendMessage failed");
  }
}

export async function sendSol(
  fromPrivateKey: string,
  toPublicKey: string,
  amount: number
) {
  const fromKeypair = Keypair.fromSecretKey(Buffer.from(fromPrivateKey, "hex"));
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: new PublicKey(toPublicKey),
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  const signature = await connection.sendTransaction(transaction, [
    fromKeypair,
  ]);
  await connection.confirmTransaction(signature);
  return signature;
}
