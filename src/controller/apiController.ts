import { Request, Response } from "express";
import { createUserInDatabase } from "../services/userService";

export const apiController = async (req: Request, res: Response) => {
  const { telegramId, username } = req.body;

  try {
    const user = await createUserInDatabase(telegramId, username);
    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Error in apiController:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
