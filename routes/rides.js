import {
  getRidesController,
  createRideController,
  deleteRideController,
  requestRideController,
  handleRequestController,
} from "../controllers/rides.js";
import { authMiddleware } from "../middleware/auth.js";

export async function ridesRouter(req) {
  const url = new URL(req.url);
  const authResult = await authMiddleware(req);
  if (authResult) return authResult;

  if (req.method === "GET" && url.pathname === "/rides") {
    return await getRidesController(req);
  }
  if (req.method === "POST" && url.pathname === "/rides") {
    return await createRideController(req);
  }
  if (
    req.method === "DELETE" &&
    url.pathname.match(/^\/rides\/[a-f0-9]{24}$/)
  ) {
    const rideId = url.pathname.split("/")[2];
    return await deleteRideController(req, rideId);
  }
  if (
    req.method === "POST" &&
    url.pathname.match(/^\/rides\/[a-f0-9]{24}\/request$/)
  ) {
    const rideId = url.pathname.split("/")[2];
    return await requestRideController(req, rideId);
  }
  if (
    req.method === "POST" &&
    url.pathname.match(/^\/rides\/[a-f0-9]{24}\/request\/[a-f0-9]{24}$/)
  ) {
    const rideId = url.pathname.split("/")[2];
    const requestId = url.pathname.split("/")[4];
    return await handleRequestController(req, rideId, requestId);
  }
  return null;
}
