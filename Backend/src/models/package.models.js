import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const itinerarySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
});

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    destinations: [{ type: String, required: true }],
    duration: {
      days: { type: Number, required: true },
      nights: { type: Number, required: true },
    },
    price: { type: Number, required: true },
    images: [{ type: String }],
    itinerary: [itinerarySchema],
    reviews: [{ type: ObjectId, ref: "Review" }],
    createdBy: { type: ObjectId, ref: "User", required: true } // Admin who created
  },
  { timestamps: true }
);

export const Package = mongoose.model("Package", packageSchema);
