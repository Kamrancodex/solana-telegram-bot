import express from "express";
import { apiController } from "../controller/apiController";

const router = express.Router();

router.post("/start", apiController);

export default router;
