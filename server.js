import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import { authRouter } from "./routes/auth.js";
import { ridesRouter } from "./routes/rides.js";

dotenv.config();

await connectDB();

const server = Bun.serve({
  port: process.env.PORT || 3000,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);

    // Root endpoint
    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({ message: "Welcome to the Ride-Sharing App API!" }),
        {
          status: 200,
          headers: { "Content-Type": "Application/json" },
        },
      );
    }

    // Auth routes
    const authResponse = await authRouter(req);
    if (authResponse) return authResponse;

    // Ride routes
    const rideResponse = await ridesRouter(req);
    if (rideResponse) return rideResponse;

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
