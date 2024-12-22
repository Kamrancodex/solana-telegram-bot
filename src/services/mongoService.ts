import { MongoClient } from "mongodb";

// Replace the connection string with your MongoDB URL
const MONGO_URI = "xxx/cryptoserver";
const DATABASE_NAME = "mydatabase";

let mongoClient: MongoClient;
export let sharesCollection: any;

export async function connectMongoDB() {
  try {
    mongoClient = new MongoClient(MONGO_URI);

    await mongoClient.connect();
    console.log("MongoDB connected successfully!");

    const mongoDb = mongoClient.db(DATABASE_NAME);
    sharesCollection = mongoDb.collection("user_shares");

    console.log(`MongoDB collection ready: ${sharesCollection.collectionName}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("MongoDB connection failed");
  }
}

export async function closeMongoDB() {
  await mongoClient.close();
  console.log("MongoDB connection closed.");
}
