import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (excluding password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

// Middleware to check if user is a driver (or 'both')
const isDriver = (req, res, next) => {
  if (req.user && (req.user.role === "driver" || req.user.role === "both")) {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as a driver");
  }
};

// Middleware to check if user is a rider (or 'both')
const isRider = (req, res, next) => {
  if (req.user && (req.user.role === "rider" || req.user.role === "both")) {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as a rider");
  }
};

export { protect, isDriver, isRider };
