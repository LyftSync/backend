import asyncHandler from "express-async-handler";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Ride from "../models/Ride.js";
import User from "../models/User.js";

// @desc    Post a review for a user after a completed ride
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { rideId, revieweeId, rating, comment, reviewType } = req.body;
  const reviewerId = req.user._id; // from auth middleware

  if (!rideId || !revieweeId || !rating || !reviewType) {
    res.status(400);
    throw new Error(
      "Ride ID, reviewee ID, rating, and review type are required.",
    );
  }

  if (reviewerId.toString() === revieweeId.toString()) {
    res.status(400);
    throw new Error("You cannot review yourself.");
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    res.status(404);
    throw new Error("Ride not found.");
  }

  if (ride.status !== "completed") {
    res.status(400);
    throw new Error("Reviews can only be submitted for completed rides.");
  }

  // Check if reviewer was part of the ride
  let isReviewerValid = false;
  if (reviewType === "driver_review") {
    // Reviewer is a rider, reviewee is the driver
    if (ride.driver.toString() !== revieweeId) {
      res.status(400);
      throw new Error("Reviewee is not the driver of this ride.");
    }
    const booking = await Booking.findOne({
      ride: rideId,
      rider: reviewerId,
      status: "completed",
    });
    if (booking) isReviewerValid = true;
  } else if (reviewType === "rider_review") {
    // Reviewer is the driver, reviewee is a rider
    if (ride.driver.toString() !== reviewerId.toString()) {
      res.status(403);
      throw new Error(
        "Only the driver of the ride can review a rider for this ride.",
      );
    }
    const booking = await Booking.findOne({
      ride: rideId,
      rider: revieweeId,
      status: "completed",
    });
    if (booking) isReviewerValid = true;
  } else {
    res.status(400);
    throw new Error("Invalid review type.");
  }

  if (!isReviewerValid) {
    res.status(403);
    throw new Error(
      "You are not authorized to review this user for this ride, or the user was not part of this completed ride.",
    );
  }

  const existingReview = await Review.findOne({
    ride: rideId,
    reviewer: reviewerId,
    reviewee: revieweeId,
  });
  if (existingReview) {
    res.status(400);
    throw new Error("You have already reviewed this user for this ride.");
  }

  const review = new Review({
    ride: rideId,
    reviewer: reviewerId,
    reviewee: revieweeId,
    rating,
    comment,
    reviewType,
  });

  const createdReview = await review.save();
  // The post-save hook on Review model will update User's averageRating and totalRatings

  res.status(201).json(createdReview);
});

export { createReview };
