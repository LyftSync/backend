import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
//import { User } from "../models/User.js";

const connectedUsers = new Map();

const initializeSocketIO = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      console.error("Socket Auth Error: No token provided");
      return next(new Error("Authentication error: No token"));
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret);

      socket.user = decoded;

      console.log(`Socket authenticated: User ${socket.user.userId}`);
      next();
    } catch (err) {
      console.error("Socket Auth Error:", err.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}, UserID: ${socket.user.userId}`);

    if (!connectedUsers.has(socket.user.userId)) {
      connectedUsers.set(socket.user.userId, new Set());
    }

    connectedUsers.get(socket.user.userId).add(socket.id);
    console.log("Current connected users:", Array.from(connectedUsers.keys()));

    socket.join(socket.user.userId.toString());

    socket.on("updateLocation", (locationData) => {
      console.log(
        `Received location from User ${socket.user.userId}:`,
        locationData,
      );
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `User disconnected: ${socket.id}, UserID: ${socket.user.userId}, Reason: ${reason}`,
      );

      if (connectedUsers.has(socket.user.userId)) {
        const userSocketIds = connectedUsers.get(socket.user.userId);
        userSocketIds.delete(socket.id);
        if (userSocketIds.size === 0) {
          connectedUsers.delete(socket.user.userId);
        }
      }
      console.log(
        "Current connected users:",
        Array.from(connectedUsers.keys()),
      );
    });

    socket.on("error", (err) => {
      console.error(
        `Socket error for user ${socket.user?.userId} on socket ${socket.id}:`,
        err,
      );
    });
  });

  console.log("Socket.IO initialized and handlers attached.");
};

export default initializeSocketIO;
