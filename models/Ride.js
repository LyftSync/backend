import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    address: { type: String, trim: true },
  },
  { _id: false },
);

const RideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startLocation: { type: LocationSchema, required: true },
    endLocation: { type: LocationSchema, required: true },
    // For searching rides along a route (future enhancement)
    // routePolyline: { type: String },
    departureTime: { type: Date, required: true },
    estimatedArrivalTime: { type: Date },
    availableSeats: { type: Number, required: true, min: 0, default: 1 },
    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "completed",
        "cancelled_by_driver",
        "cancelled_by_system",
      ],
      default: "pending",
    },
    pricePerSeat: { type: Number, default: 0 },
    passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

// Create a 2dsphere index on startLocation for geospatial queries
RideSchema.index({ "startLocation.coordinates": "2dsphere" });
RideSchema.index({ "endLocation.coordinates": "2dsphere" });
RideSchema.index({ driver: 1, status: 1 });
RideSchema.index({ departureTime: 1, status: 1 });

export default mongoose.model("Ride", RideSchema);
