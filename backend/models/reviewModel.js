const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: [true, "Please provide a rating"],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: [true, "Please provide a comment"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Review", reviewSchema);