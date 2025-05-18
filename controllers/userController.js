import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Review from "../models/Review.js";

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id); // req.user from auth middleware

  if (user) {
    user.name = req.body.name || user.name;
    user.profilePictureUrl =
      req.body.profilePictureUrl || user.profilePictureUrl;
    user.emergencyContacts =
      req.body.emergencyContacts || user.emergencyContacts;

    if (req.body.phone && req.body.phone !== user.phone) {
      const phoneExists = await User.findOne({ phone: req.body.phone });
      if (phoneExists && phoneExists._id.toString() !== user._id.toString()) {
        res.status(400);
        throw new Error("Phone number already in use");
      }
      user.phone = req.body.phone;
    }

    // Only allow role update if it's a valid transition (e.g. rider to both)
    // For simplicity, let's assume role changes require specific validation or are limited
    if (
      req.body.role &&
      (req.body.role === "driver" || req.body.role === "both")
    ) {
      if (
        !req.body.vehicleDetails ||
        !req.body.vehicleDetails.registrationNumber ||
        !req.body.vehicleDetails.licenseNumber
      ) {
        res.status(400);
        throw new Error(
          "Vehicle registration and license number are required for drivers.",
        );
      }
      user.role = req.body.role;
      user.vehicleDetails = req.body.vehicleDetails || user.vehicleDetails;
    } else if (req.body.role && req.body.role === "rider") {
      user.role = req.body.role;
      user.vehicleDetails = undefined; // Clear vehicle details if becoming just a rider
    }

    if (req.body.password) {
      user.password = req.body.password; // Mongoose pre-save hook will hash it
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      profilePictureUrl: updatedUser.profilePictureUrl,
      vehicleDetails: updatedUser.vehicleDetails,
      emergencyContacts: updatedUser.emergencyContacts,
      token: req.headers.authorization.split(" ")[1], // Or generate a new one if you prefer
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Get public profile of a user
// @route   GET /api/users/:userId
// @access  Public (or Private if you want only logged in users to see profiles)
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select(
    "name profilePictureUrl averageRating totalRatings role ridesOfferedCount ridesTakenCount createdAt",
  );

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Get reviews for a specific user
// @route   GET /api/users/:userId/reviews
// @access  Public (or Private)
const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate("reviewer", "name profilePictureUrl")
    .populate("ride", "startLocation.address endLocation.address departureTime")
    .sort({ createdAt: -1 });

  res.json(reviews);
});

export { updateUserProfile, getUserProfile, getUserReviews };
