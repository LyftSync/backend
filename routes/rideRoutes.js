import express from "express";
const router = express.Router();
import {
  createRide,
  searchRides,
  getMyOfferedRides,
  getRideById,
  updateRide,
  updateRideStatus,
  getRideBookings,
} from "../controllers/rideController.js";
import { protect, isDriver } from "../middleware/authMiddleware.js";
import bookingRoutes from "./bookingRoutes.js";

router.use("/:rideId/bookings", bookingRoutes);

router.post("/", protect, isDriver, createRide);
router.get("/", searchRides);
router.get("/my-offered", protect, isDriver, getMyOfferedRides);
router.get("/:rideId", getRideById);
router.put("/:rideId", protect, isDriver, updateRide);
router.patch("/:rideId/status", protect, isDriver, updateRideStatus);
router.get("/:rideId/bookings", protect, isDriver, getRideBookings);

export default router;
