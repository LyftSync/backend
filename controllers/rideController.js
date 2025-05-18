import asyncHandler from "express-async-handler";
import Ride from "../models/Ride.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// @desc    Create a new ride offer
// @route   POST /api/rides
// @access  Private (Driver only)
const createRide = asyncHandler(async (req, res) => {
  const {
    startLocation, // { coordinates: [lng, lat], address: "..." }
    endLocation, // { coordinates: [lng, lat], address: "..." }
    departureTime,
    estimatedArrivalTime,
    availableSeats = 1,
    pricePerSeat = 0,
    notes,
  } = req.body;

  if (
    !startLocation ||
    !startLocation.coordinates ||
    !endLocation ||
    !endLocation.coordinates ||
    !departureTime
  ) {
    res.status(400);
    throw new Error(
      "Start location, end location, and departure time are required.",
    );
  }
  if (new Date(departureTime) < new Date()) {
    res.status(400);
    throw new Error("Departure time cannot be in the past.");
  }

  const ride = new Ride({
    driver: req.user._id, // from auth middleware
    startLocation,
    endLocation,
    departureTime,
    estimatedArrivalTime,
    availableSeats,
    pricePerSeat,
    notes,
    status: "pending",
  });

  const createdRide = await ride.save();

  // Increment driver's ridesOfferedCount
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { ridesOfferedCount: 1 },
  });

  res.status(201).json(createdRide);
});

// @desc    Search/list available rides
// @route   GET /api/rides
// @access  Public (or Private)
const searchRides = asyncHandler(async (req, res) => {
  const {
    fromLat,
    fromLng,
    toLat,
    toLng,
    departureAfter,
    seats = 1,
    maxDistanceKm = 10,
  } = req.query; // maxDistance in KM for pickup

  const query = {
    status: "pending", // Only show pending rides
    departureTime: {
      $gte: departureAfter ? new Date(departureAfter) : new Date(),
    },
    availableSeats: { $gte: parseInt(seats) },
  };

  if (fromLat && fromLng) {
    query.startLocation = {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(fromLng), parseFloat(fromLat)],
        },
        $maxDistance: maxDistanceKm * 1000, // Convert KM to meters
      },
    };
  }

  // Note: Searching by toLat/toLng (destination) with $nearSphere is more complex if you want rides *passing through*
  // A simpler approach for now is to filter on an exact match or allow users to see all rides and filter client-side
  // For more advanced route matching, you'd need polylines and more complex geo queries.
  // For this prototype, we'll keep destination matching simple or omit strict server-side destination matching.

  const rides = await Ride.find(query)
    .populate(
      "driver",
      "name profilePictureUrl averageRating vehicleDetails.type",
    )
    .sort({ departureTime: 1 }) // Sort by soonest departure
    .limit(50); // Limit results for performance

  res.json(rides);
});

// @desc    Get rides offered by the logged-in driver
// @route   GET /api/rides/my-offered
// @access  Private (Driver only)
const getMyOfferedRides = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ driver: req.user._id })
    .populate("passengers", "name profilePictureUrl")
    .sort({ createdAt: -1 });
  res.json(rides);
});

// @desc    Get details of a specific ride
// @route   GET /api/rides/:rideId
// @access  Public (or Private)
const getRideById = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.rideId)
    .populate(
      "driver",
      "name profilePictureUrl averageRating phone vehicleDetails",
    )
    .populate("passengers", "name profilePictureUrl");

  if (ride) {
    res.json(ride);
  } else {
    res.status(404);
    throw new Error("Ride not found");
  }
});

// @desc    Update ride details
// @route   PUT /api/rides/:rideId
// @access  Private (Driver only, Owner only)
const updateRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    res.status(404);
    throw new Error("Ride not found");
  }

  if (ride.driver.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this ride");
  }

  if (ride.status !== "pending") {
    res.status(400);
    throw new Error("Cannot update ride that is not in pending state");
  }

  const {
    startLocation,
    endLocation,
    departureTime,
    estimatedArrivalTime,
    availableSeats,
    pricePerSeat,
    notes,
  } = req.body;

  ride.startLocation = startLocation || ride.startLocation;
  ride.endLocation = endLocation || ride.endLocation;
  ride.departureTime = departureTime || ride.departureTime;
  ride.estimatedArrivalTime = estimatedArrivalTime || ride.estimatedArrivalTime;
  ride.availableSeats =
    availableSeats !== undefined ? availableSeats : ride.availableSeats;
  ride.pricePerSeat =
    pricePerSeat !== undefined ? pricePerSeat : ride.pricePerSeat;
  ride.notes = notes || ride.notes;

  // Ensure departure time is not in the past if updated
  if (departureTime && new Date(departureTime) < new Date()) {
    res.status(400);
    throw new Error("Departure time cannot be in the past.");
  }

  const updatedRide = await ride.save();
  res.json(updatedRide);
});

// @desc    Update ride status (e.g., start, complete, cancel)
// @route   PATCH /api/rides/:rideId/status
// @access  Private (Driver only, Owner only)
const updateRideStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'active', 'completed', 'cancelled_by_driver'
  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    res.status(404);
    throw new Error("Ride not found");
  }

  if (ride.driver.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this ride status");
  }

  const validStatusTransitions = {
    pending: ["active", "cancelled_by_driver"],
    active: ["completed", "cancelled_by_driver"], // A driver might need to cancel an active ride in emergencies
    // completed, cancelled_by_driver, cancelled_by_system are terminal states for driver actions
  };

  if (
    !validStatusTransitions[ride.status] ||
    !validStatusTransitions[ride.status].includes(status)
  ) {
    res.status(400);
    throw new Error(`Cannot transition ride from ${ride.status} to ${status}`);
  }

  ride.status = status;

  // Handle side-effects of status change
  if (status === "cancelled_by_driver") {
    // Notify booked passengers, change booking statuses to 'cancelled_by_system' or similar
    await Booking.updateMany(
      { ride: ride._id, status: { $in: ["pending", "accepted"] } },
      { $set: { status: "rejected_by_driver" } }, // Or a new status like 'ride_cancelled'
    );
    // Potentially refund passengers if payment was involved (future)
  } else if (status === "completed") {
    // Update ridesTakenCount for all accepted passengers
    const bookings = await Booking.find({ ride: ride._id, status: "accepted" });
    for (const booking of bookings) {
      await User.findByIdAndUpdate(booking.rider, {
        $inc: { ridesTakenCount: 1 },
      });
      booking.status = "completed"; // Also mark booking as completed
      await booking.save();
    }
  }

  const updatedRide = await ride.save();
  res.json(updatedRide);
});

// @desc    Get booking requests for a driver's ride
// @route   GET /api/rides/:rideId/bookings
// @access  Private (Driver only, Owner only)
const getRideBookings = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.rideId);

  if (!ride) {
    res.status(404);
    throw new Error("Ride not found");
  }

  if (ride.driver.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view bookings for this ride");
  }

  const bookings = await Booking.find({ ride: req.params.rideId })
    .populate("rider", "name profilePictureUrl averageRating")
    .sort({ createdAt: 1 }); // Show oldest requests first

  res.json(bookings);
});

export {
  createRide,
  searchRides,
  getMyOfferedRides,
  getRideById,
  updateRide,
  updateRideStatus,
  getRideBookings,
};
