import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { config } from "./config/index.js";
import initializeSocketIO from "./socket/socketHandler.js";
import authRoutes from "./routes/authRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

initializeSocketIO(io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send({ message: "LyftSyncing in her heart, crack me up, duh" });
});
app.use("/auth", authRoutes);
app.use("/rides", rideRoutes);

const PORT = config.port;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  console.log(`Socket.IO listening on port ${PORT}`);
});

export { io };

export default app;
