import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    reviewType: {
      type: String,
      enum: ["driver_review", "rider_review"],
      required: true,
    },
  },
  { timestamps: true },
);

ReviewSchema.index({ ride: 1, reviewer: 1, reviewee: 1 }, { unique: true });
ReviewSchema.index({ reviewee: 1 });

// Middleware to update user's average rating after a new review is saved
ReviewSchema.post("save", async function () {
  const User = mongoose.model("User");
  const revieweeId = this.reviewee;

  const stats = await mongoose.model("Review").aggregate([
    { $match: { reviewee: revieweeId } },
    {
      $group: {
        _id: "$reviewee",
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(revieweeId, {
      averageRating: stats[0].averageRating.toFixed(1),
      totalRatings: stats[0].totalRatings,
    });
  } else {
    await User.findByIdAndUpdate(revieweeId, {
      averageRating: 0,
      totalRatings: 0,
    });
  }
});

export default mongoose.model("Review", ReviewSchema);
