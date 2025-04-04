import { Ride } from "../models/Ride.js";

export const rideController = {
  async createRide(req, res, next) {
    try {
      const { startTime, waypoints } = req.body;
      const riderId = req.user.id;

      if (
        !startTime ||
        !waypoints ||
        !Array.isArray(waypoints) ||
        waypoints.length < 2
      ) {
        return res.status(400).json({
          message:
            "Start time and at least two waypoints (start, end) are required.",
        });
      }
      for (const wp of waypoints) {
        if (
          wp.latitude == null ||
          wp.longitude == null ||
          wp.sequence_order == null
        ) {
          return res.status(400).json({
            message:
              "Each waypoint must have latitude, longitude, and sequence_order.",
          });
        }
      }
      waypoints.sort((a, b) => a.sequence_order - b.sequence_order);

      const rideData = {
        rider_id: riderId,
        start_time: startTime,
        status: "scheduled",
      };

      const waypointsData = waypoints.map((wp) => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
        sequence_order: wp.sequence_order,
        estimated_arrival_time: wp.estimatedArrivalTime,
      }));

      const newRide = await Ride.createWithWaypoints(rideData, waypointsData);

      res
        .status(201)
        .json({ message: "Ride created successfully", ride: newRide });
    } catch (error) {
      console.error("Ride Creation Error:", error);
      if (error.code === "23503") {
        return res.status(400).json({ message: "Invalid rider reference." });
      }
      next(error);
    }
  },

  async getRideDetails(req, res, next) {
    try {
      const rideId = req.params.id;
      const ride = await Ride.findByIdWithWaypoints(rideId);

      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      res.status(200).json(ride);
    } catch (error) {
      console.error("Get Ride Details Error:", error);
      next(error);
    }
  },
};
