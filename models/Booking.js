import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // pickupLocation: { type: LocationSchema },
    // dropoffLocation: { type: LocationSchema },
    requestedSeats: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected_by_driver",
        "cancelled_by_rider",
        "completed",
        "no_show_rider",
      ],
      default: "pending",
    },
    bookingTime: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

BookingSchema.index({ ride: 1, rider: 1 }, { unique: true });
BookingSchema.index({ rider: 1, status: 1 });
BookingSchema.index({ ride: 1, status: 1 });

export default mongoose.model("Booking", BookingSchema);
