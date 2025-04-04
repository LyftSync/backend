import express from "express";
import { rideController } from "../controllers/rideController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, rideController.createRide);

router.get("/:id", protect, rideController.getRideDetails);

export default router;
