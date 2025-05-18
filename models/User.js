import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const VehicleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["motorbike", "scooter"],
      default: "motorbike",
    },
    registrationNumber: { type: String, trim: true, sparse: true },
    licenseNumber: { type: String, trim: true, sparse: true },
    model: { type: String, trim: true },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true, trim: true },
    role: { type: String, enum: ["rider", "driver", "both"], default: "rider" },
    profilePictureUrl: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    vehicleDetails: {
      type: VehicleSchema,
    },
    ridesOfferedCount: { type: Number, default: 0 },
    ridesTakenCount: { type: Number, default: 0 },
    emergencyContacts: [
      {
        name: String,
        phone: String,
      },
    ],
  },
  { timestamps: true },
);

// Password hashing middleware
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Ensure vehicle details are present if user is a driver
UserSchema.pre("save", function (next) {
  if (
    (this.role === "driver" || this.role === "both") &&
    (!this.vehicleDetails ||
      !this.vehicleDetails.registrationNumber ||
      !this.vehicleDetails.licenseNumber)
  ) {
    return next(
      new Error(
        "Vehicle registration number and license number are required for drivers.",
      ),
    );
  }
  next();
});

export default mongoose.model("User", UserSchema);
