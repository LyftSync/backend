import express from "express";
const router = express.Router();
import {
  updateUserProfile,
  getUserProfile,
  getUserReviews,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

router.put("/profile", protect, updateUserProfile);
router.get("/:userId", getUserProfile);
router.get("/:userId/reviews", getUserReviews);

export default router;
