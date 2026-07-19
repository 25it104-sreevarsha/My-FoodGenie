const Review = require("../models/reviewModel");

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find();
    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};