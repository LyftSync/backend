import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Ride from "../models/Ride.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// @desc    Request to book a seat on a ride
// @route   POST /api/rides/:rideId/bookings
// @access  Private (Rider only)
const createBooking = asyncHandler(async (req, res) => {
  const { rideId } = req.params;
  const riderId = req.user._id; // from auth middleware
  const { requestedSeats = 1 } = req.body;

  const ride = await Ride.findById(rideId);

  if (!ride) {
    res.status(404);
    throw new Error("Ride not found");
  }

  if (ride.driver.toString() === riderId.toString()) {
    res.status(400);
    throw new Error("Driver cannot book their own ride");
  }

  if (ride.status !== "pending") {
    res.status(400);
    throw new Error(
      "This ride is no longer available for booking (not in pending state)",
    );
  }

  if (ride.availableSeats < requestedSeats) {
    res.status(400);
    throw new Error("Not enough available seats on this ride");
  }

  const existingBooking = await Booking.findOne({
    ride: rideId,
    rider: riderId,
  });
  if (
    existingBooking &&
    ["pending", "accepted"].includes(existingBooking.status)
  ) {
    res.status(400);
    throw new Error(
      "You already have an active or pending booking for this ride",
    );
  }

  const booking = new Booking({
    ride: rideId,
    rider: riderId,
    requestedSeats,
    status: "pending", // Driver needs to accept
  });

  const createdBooking = await booking.save();

  // Optionally: Notify the driver about the new booking request (e.g., via websockets or push notifications)

  res.status(201).json(createdBooking);
});

// @desc    Get booking requests made by the logged-in rider
// @route   GET /api/bookings/my-requests
// @access  Private (Rider only)
const getMyBookingRequests = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ rider: req.user._id })
    .populate({
      path: "ride",
      select: "startLocation endLocation departureTime status pricePerSeat",
      populate: {
        path: "driver",
        select: "name profilePictureUrl",
      },
    })
    .sort({ createdAt: -1 });
  res.json(bookings);
});

// @desc    Update booking status (by driver or rider)
// @route   PATCH /api/bookings/:bookingId/status
// @access  Private
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body; // 'accepted', 'rejected_by_driver', 'cancelled_by_rider'
  const userId = req.user._id;

  const booking = await Booking.findById(bookingId).populate("ride");

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  const ride = booking.ride; // Ride document is populated

  if (!ride) {
    res.status(404); // Should not happen if booking exists and populated correctly
    throw new Error("Associated ride not found for this booking");
  }

  // --- Authorization and Logic ---
  let updatedBooking;
  // REMOVED: const session = await mongoose.startSession(); // For transaction
  // REMOVED: session.startTransaction();

  try {
    if (ride.driver.toString() === userId.toString()) {
      // Action by Driver
      if (status === "accepted") {
        if (booking.status !== "pending") {
          res.status(400); // Set status before throwing
          throw new Error(
            `Cannot accept a booking that is already ${booking.status}`,
          );
        }
        if (ride.availableSeats < booking.requestedSeats) {
          // REMOVED: await session.abortTransaction();
          // REMOVED: session.endSession();
          res.status(400);
          throw new Error(
            "Not enough seats available on the ride to accept this booking.",
          );
        }

        ride.availableSeats -= booking.requestedSeats;
        ride.passengers.push(booking.rider);
        booking.status = "accepted";

        await ride.save(); // REMOVED: { session }
        updatedBooking = await booking.save(); // REMOVED: { session }
        // Optionally: Notify rider of acceptance
      } else if (status === "rejected_by_driver") {
        if (!["pending", "accepted"].includes(booking.status)) {
          res.status(400); // Set status before throwing
          throw new Error(`Cannot reject a booking that is ${booking.status}`);
        }
        // If it was an accepted booking being rejected (e.g. driver change of plans before ride start)
        if (booking.status === "accepted") {
          ride.availableSeats += booking.requestedSeats;
          ride.passengers.pull(booking.rider);
          await ride.save(); // REMOVED: { session }
        }
        booking.status = "rejected_by_driver";
        updatedBooking = await booking.save(); // REMOVED: { session }
        // Optionally: Notify rider of rejection
      } else {
        res.status(400); // Set status before throwing
        throw new Error("Invalid status update for driver");
      }
    } else if (booking.rider.toString() === userId.toString()) {
      // Action by Rider
      if (status === "cancelled_by_rider") {
        if (!["pending", "accepted"].includes(booking.status)) {
          res.status(400); // Set status before throwing
          throw new Error(
            `Cannot cancel a booking that is already ${booking.status}`,
          );
        }
        if (booking.status === "accepted") {
          // If ride is not yet active/completed, give back seat
          if (["pending", "active"].includes(ride.status)) {
            ride.availableSeats += booking.requestedSeats;
            ride.passengers.pull(booking.rider);
            await ride.save(); // REMOVED: { session }
          }
        }
        booking.status = "cancelled_by_rider";
        updatedBooking = await booking.save(); // REMOVED: { session }
        // Optionally: Notify driver of cancellation
      } else {
        res.status(400); // Set status before throwing
        throw new Error("Invalid status update for rider");
      }
    } else {
      // REMOVED: await session.abortTransaction();
      // REMOVED: session.endSession();
      res.status(403);
      throw new Error("Not authorized to update this booking");
    }

    // REMOVED: await session.commitTransaction();
    // REMOVED: session.endSession();
    res.json(updatedBooking);
  } catch (error) {
    // REMOVED: await session.abortTransaction(); // This would also fail if session couldn't start
    // REMOVED: session.endSession();
    
    // Ensure a status code is set if not already.
    // If error originated from one of the specific checks above, status would already be set.
    // If it's a generic save error, default to 400 or let errorHandler decide 500.
    if (res.statusCode === 200) { // If no specific error status was set before this catch
        res.status(400); 
    }
    throw new Error(error.message || "Booking status update failed"); // Let global errorHandler handle this
  }
});

// @desc    Get details of a specific booking
// @route   GET /api/bookings/:bookingId
// @access  Private
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate({
      path: "ride",
      populate: { path: "driver", select: "name profilePictureUrl" },
    })
    .populate("rider", "name profilePictureUrl");

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Authorization: Only rider or driver of the associated ride can view
  if (
    booking.rider._id.toString() !== req.user._id.toString() &&
    booking.ride.driver._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to view this booking");
  }

  res.json(booking);
});

export {
  createBooking,
  getMyBookingRequests,
  updateBookingStatus,
  getBookingById,
};
