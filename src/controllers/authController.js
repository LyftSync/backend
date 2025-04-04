import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { config } from "../config/index.js";

export const authController = {
  async register(req, res, next) {
    try {
      const { email, password, fullName, phoneNumber } = req.body;

      if (!email || !password || !fullName || !phoneNumber) {
        return res
          .status(400)
          .json({ message: "All required fields not given" });
      }

      const existingUserByEmail = await User.findByEmail(email);
      if (existingUserByEmail) {
        return res.status(409).json({ message: "Email already in use" });
      }

      const existingUserByPhoneNumber =
        await User.findByPhoneNumber(phoneNumber);
      if (existingUserByPhoneNumber) {
        return res.status(409).json({ message: "Phone number already in use" });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = {
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName,
        phone_number: phoneNumber,
      };

      const createdUser = await User.create(newUser);

      const userResponse = { ...createdUser };
      delete userResponse.password_hash;

      res
        .status(201)
        .json({ message: "User registered successfully", user: userResponse });
    } catch (error) {
      console.error("Registration Error:", error);
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, phoneNumber, password } = req.body;

      if ((!email && !phoneNumber) || !password) {
        return res.status(400).json({
          message: "Either email or phone number, and password are required",
        });
      }

      let user;
      if (email) {
        user = await User.findByEmail(email.toLowerCase());
      } else {
        user = await User.findByPhoneNumber(phoneNumber);
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const payload = {
        userId: user.id,
        email: user.email,
      };

      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      const userResponse = { ...user };
      delete userResponse.password_hash;

      res.json({
        message: "Login successful",
        token,
        user: userResponse,
      });
    } catch (error) {
      console.error("Login Error:", error);
      next(error);
    }
  },
};
