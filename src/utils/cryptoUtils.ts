import secrets from "secrets.js-grempe";
import crypto from "crypto";
import { User } from "../entities/User";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// console.log("ENCRYPTION_KEY:", process.env.ENCRYPTION_KEY);
// console.log("IV:", process.env.IV);

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32 bytes
const IV = Buffer.from(process.env.IV!, "hex"); // 16 bytes

export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${IV.toString("hex")}:${encrypted}`;
}

export function decrypt(text: string): string {
  const [iv, encryptedData] = text.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY,
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Shamir's Secret Sharing
export function splitPrivateKey(
  privateKey: string,
  totalShares: number,
  threshold: number
): string[] {
  return secrets.share(privateKey, totalShares, threshold);
}

export function reconstructPrivateKey(shares: string[]): string {
  return secrets.combine(shares);
}

// Reconstruct logic with error handling
export async function reconstructPrivateKeyFromUser(
  user: User
): Promise<string> {
  if (!user.share1 || !user.share2) {
    throw new Error("Not enough shares to reconstruct the private key");
  }

  return reconstructPrivateKey([decrypt(user.share1), decrypt(user.share2)]);
}
