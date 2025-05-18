import express from "express";
const router = express.Router();
import { createReview } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

router.post("/", protect, createReview);

export default router;
