import { ObjectId } from "mongodb";
import {
  createRide,
  findRideById,
  deleteRide,
  createRideRequest,
  findRequestById,
  updateRequestStatus,
  updateRideStatus,
  decrementRideSeats,
} from "../models/Ride.js";

export async function getRidesController(req) {
  try {
    const {
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      radius = 10,
      departureAfter,
      departureBefore,
      maxSeats,
    } = req.query;

    // Basic validation for coordinates if provided
    if ((originLat || originLng) && (!originLat || !originLng)) {
      return new Response(
        "Both originLat and originLng must be provided together",
        { status: 400 },
      );
    }
    if (
      (destinationLat || destinationLng) &&
      (!destinationLat || !destinationLng)
    ) {
      return new Response(
        "Both destinationLat and destinationLng must be provided together",
        { status: 400 },
      );
    }

    const query = { status: "open" }; // Only show open rides by default

    // Add geographic filtering if coordinates are provided
    if (originLat && originLng) {
      query.startCoords = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(originLng), parseFloat(originLat)],
          },
          $maxDistance: parseInt(radius) * 1000, // Convert km to meters
        },
      };
    }

    if (destinationLat && destinationLng) {
      query.endCoords = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              parseFloat(destinationLng),
              parseFloat(destinationLat),
            ],
          },
          $maxDistance: parseInt(radius) * 1000, // Convert km to meters
        },
      };
    }

    // Add departure time filtering
    if (departureAfter) {
      query.departureTime = { $gte: new Date(departureAfter) };
    }
    if (departureBefore) {
      query.departureTime = {
        ...query.departureTime,
        $lte: new Date(departureBefore),
      };
    }

    // Add available seats filtering
    if (maxSeats) {
      query.availableSeats = { $lte: parseInt(maxSeats) };
    }

    const db = getDB();
    const rides = await db
      .collection("rides")
      .find(query)
      .sort({ departureTime: 1 }) // Sort by soonest departure first
      .toArray();

    // Enhance rides with route data if available
    const enhancedRides = await Promise.all(
      rides.map(async (ride) => {
        const routeData = await findRouteByRideId(ride._id.toString());
        return {
          ...ride,
          route: routeData ? routeData.route : [],
        };
      }),
    );

    return new Response(JSON.stringify(enhancedRides), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response("Server error: " + error.message, { status: 500 });
  }
}

export async function createRideController(req) {
  try {
    const { startCoords, endCoords, departureTime, availableSeats } =
      await req.json();
    if (!startCoords || !endCoords || !departureTime || !availableSeats) {
      return new Response(
        "startCoords, endCoords, departureTime, and availableSeats are required",
        { status: 400 },
      );
    }
    if (
      !Array.isArray(startCoords) ||
      startCoords.length !== 2 ||
      !Array.isArray(endCoords) ||
      endCoords.length !== 2
    ) {
      return new Response(
        "startCoords and endCoords must be [lat, lng] arrays",
        { status: 400 },
      );
    }
    if (availableSeats < 1) {
      return new Response("Available seats must be at least 1", {
        status: 400,
      });
    }
    const ride = await createRide({
      driverId: new ObjectId(req.userId),
      startCoords,
      endCoords,
      departureTime: new Date(departureTime),
      availableSeats: parseInt(availableSeats),
    });
    return new Response(JSON.stringify(ride), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response("Server error: " + error.message, { status: 500 });
  }
}

export async function deleteRideController(req, rideId) {
  try {
    const result = await deleteRide(rideId, req.userId);
    if (result.deletedCount === 0) {
      return new Response("Ride not found or unauthorized", { status: 403 });
    }
    return new Response("Ride deleted", { status: 200 });
  } catch (error) {
    return new Response("Server error: " + error.message, { status: 500 });
  }
}

export async function requestRideController(req, rideId) {
  try {
    const ride = await findRideById(rideId);
    if (!ride) {
      return new Response("Ride not found", { status: 404 });
    }
    if (ride.driverId.toString() === req.userId) {
      return new Response("Cannot request your own ride", { status: 400 });
    }
    if (ride.status !== "open" || ride.availableSeats < 1) {
      return new Response("Ride is not available", { status: 400 });
    }
    const request = await createRideRequest(rideId, req.userId);
    return new Response(JSON.stringify(request), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response("Server error: " + error.message, { status: 500 });
  }
}

export async function handleRequestController(req, rideId, requestId) {
  try {
    const { action } = await req.json();
    if (!["accept", "reject"].includes(action)) {
      return new Response("Invalid action", { status: 400 });
    }
    const ride = await findRideById(rideId);
    if (!ride) {
      return new Response("Ride not found", { status: 404 });
    }
    if (ride.driverId.toString() !== req.userId) {
      return new Response("Unauthorized", { status: 403 });
    }
    const request = await findRequestById(requestId);
    if (!request || request.rideId.toString() !== rideId) {
      return new Response("Request not found", { status: 404 });
    }
    if (request.status !== "pending") {
      return new Response("Request already processed", { status: 400 });
    }
    const status = action === "accept" ? "accepted" : "rejected";
    await updateRequestStatus(requestId, status);
    if (action === "accept") {
      await decrementRideSeats(rideId);
      if (ride.availableSeats - 1 <= 0) {
        await updateRideStatus(rideId, "full");
      }
    }
    return new Response(`Request ${status}`, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response("Server error: " + error.message, { status: 500 });
  }
}
