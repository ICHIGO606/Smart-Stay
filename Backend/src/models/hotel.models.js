import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    city: { type: String, required: true, index: true }, 
    address: { type: String, required: true },
    amenities: [String], 
    starRating: { type: Number, min: 1, max: 5 },
    images: [String], 
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }], 
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }], 
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);
hotelSchema.virtual("averageRating").get(function () {
  if (!this.reviews || this.reviews.length === 0) return 0;

  const total = this.reviews.reduce((sum, review) => {
    return sum + (review.rating || 0);
  }, 0);

  return (total / this.reviews.length).toFixed(1);
});

export const Hotel = mongoose.model("Hotel", hotelSchema);
