import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";
import { createRideRoute, findRouteByRideId } from "./RideRoute.js";

export async function createRide(rideData) {
  const db = getDB();
  const { route, ...rideDetails } = rideData;
  const ride = { ...rideDetails, createdAt: new Date(), status: "open" };
  const result = await db.collection("rides").insertOne(ride);
  const rideId = result.insertedId;
  if (route && Array.isArray(route)) {
    await createRideRoute(rideId, route);
  }
  return { ...ride, _id: rideId };
}

export async function findRideById(rideId) {
  const db = getDB();
  const ride = await db
    .collection("rides")
    .findOne({ _id: new ObjectId(rideId) });
  if (ride) {
    const routeData = await findRouteByRideId(rideId);
    ride.route = routeData ? routeData.route : [];
  }
  return ride;
}

export async function deleteRide(rideId, userId) {
  const db = getDB();
  const result = await db
    .collection("rides")
    .deleteOne({ _id: new ObjectId(rideId), driverId: new ObjectId(userId) });
  if (result.deletedCount > 0) {
    await db
      .collection("ride_routes")
      .deleteOne({ rideId: new ObjectId(rideId) });
  }
  return result;
}

export async function createRideRequest(rideId, riderId) {
  const db = getDB();
  const request = {
    rideId: new ObjectId(rideId),
    riderId: new ObjectId(riderId),
    status: "pending",
    createdAt: new Date(),
  };
  const result = await db.collection("ride_requests").insertOne(request);
  return { ...request, _id: result.insertedId };
}

export async function findRequestById(requestId) {
  const db = getDB();
  return await db
    .collection("ride_requests")
    .findOne({ _id: new ObjectId(requestId) });
}

export async function updateRequestStatus(requestId, status) {
  const db = getDB();
  return await db
    .collection("ride_requests")
    .updateOne(
      { _id: new ObjectId(requestId) },
      { $set: { status, updatedAt: new Date() } },
    );
}

export async function updateRideStatus(rideId, status) {
  const db = getDB();
  return await db
    .collection("rides")
    .updateOne(
      { _id: new ObjectId(rideId) },
      { $set: { status, updatedAt: new Date() } },
    );
}

export async function decrementRideSeats(rideId) {
  const db = getDB();
  return await db
    .collection("rides")
    .updateOne({ _id: new ObjectId(rideId) }, { $inc: { availableSeats: -1 } });
}
