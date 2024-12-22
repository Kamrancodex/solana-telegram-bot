import { createConnection, getConnection, getRepository } from "typeorm";
import { User } from "../entities/User";

export const Database = {
  async connect() {
    try {
      const connection = await createConnection({
        type: "postgres",
        host: "localhost",
        port: 5432,
        username: "myuser",
        password: "mypassword",
        database: "mydatabase",
        entities: [User],
        synchronize: true,
        logging: false,
      });
      console.log("Database connection established");
      return connection;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AlreadyHasActiveConnectionError"
      ) {
        console.log("Using existing database connection");
        return getConnection();
      }
      console.error("Error connecting to the database:", error);
      throw new Error("Database connection error");
    }
  },

  async insertUser(userData: Partial<User>) {
    try {
      const userRepository = getRepository(User);
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log("User inserted:", user);
      return user;
    } catch (error) {
      console.error("Error inserting user:", error);
      throw new Error("Failed to insert user");
    }
  },

  async getUserByTelegramId(telegramId: string) {
    if (!telegramId || telegramId.trim() === "") {
      throw new Error("Invalid Telegram ID provided");
    }

    const user = await User.findOne({ where: { telegramId } });
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },
};
