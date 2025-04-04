import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { User } from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, config.jwt.secret);

      const user = await User.findById(decoded.userId);

      if (!user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      delete user.password_hash;

      req.user = user;

      next();
    } catch (error) {
      console.error("Token verification failed:", error.message);
      if (error.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ message: "Not authorized, token failed" });
      }
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Not authorized, token expired" });
      }
      return res
        .status(500)
        .json({ message: "Server error during authentication" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
