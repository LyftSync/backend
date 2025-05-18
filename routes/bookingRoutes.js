import express from "express";
const router = express.Router({ mergeParams: true });
import {
  createBooking,
  getMyBookingRequests,
  updateBookingStatus,
  getBookingById,
} from "../controllers/bookingController.js";
import { protect, isRider } from "../middleware/authMiddleware.js";

router.post("/", protect, isRider, createBooking);

router.get("/my-requests", protect, isRider, getMyBookingRequests);
router.patch("/:bookingId/status", protect, updateBookingStatus);
router.get("/:bookingId", protect, getBookingById);

export default router;
