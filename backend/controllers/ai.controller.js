const catchAsync = require("../middlewares/catchAsyncErrors");
const aiService = require("../services/ai.service")
const FoodItem = require("../models/foodItem");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

const Restaurant = require("../models/restaurant");
const {analyzeReviewsWithAI}= require("../services/aiReviewAnalyzer")

const Review = require("../models/reviewModel");

exports.generateFoodAI = catchAsync(async (req,res) =>{
    const {name,category,spiceLevel,price} = req.body;
    if(!name || !category || !spiceLevel || !price){
        return res.status(400).json({
            success:false,
            message:"name, category,spiceLevel and price are required"
        })
    }

    const aiData = await aiService.generateDishDescription({
        name,
        category,spiceLevel,
        price
    })

    res.status(200).json({
        success:true,
        data:aiData,
    })
}
)

exports.generateAndSaveFoodAI = catchAsync(async(req,res) =>{
    const {foodId} = req.params;

    const food = await FoodItem.findById(foodId);
    if(!food){
        return res.status(404).json({
            success:false,
            message:"Food item not found"
        })
    }

    const aiData = await aiService.generateDishDescription({
        name: food.name,
        category:food.category || "Veg",
        spiceLevel:food.spiceLevel || "Medium",
        price:food.price
    })

    food.aiDescription = aiData.description;
    food.aiTags = aiData.tags;
    food.aiAllergens = aiData.allergens;
    food.aiServes = aiData.serves;
    food.aiBestFor = aiData.bestFor;
    await food.save();
    res.status(200).json({
        success:true,
        message:"AI metadata generated and saved",
        data:aiData,
    })
})

exports.analyzeRestaurantReviews = catchAsync(async(req,res) =>{
    try{
          const {id} = req.params;
          const restaurant = await Restaurant.findById(id);

          if(!restaurant) {
            return res.status(404).json({message:"Restaurant not found"})
          }

          if(!restaurant.reviews.length){
            return res.status(400).json({message:"No reviews to analyze"})
          }

          const aiData = await analyzeReviewsWithAI(restaurant.reviews);

          console.log("AI DATA:", aiData);

          restaurant.reviewSentiment = aiData.sentiment;
          restaurant.reviewSummaryBullets = aiData.summaryBullets;
          restaurant.reviewTopMentions = aiData.topMentions;

          await restaurant.save();
          res.status(200).json({success:true, aiData})
    }catch(error){
        res.status(500).json({message:error.message})
    }
})



exports.addReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { name, rating, Comment } = req.body;

  const restaurant = await Restaurant.findById(id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: "Restaurant not found",
    });
  }

  // Add Review
  restaurant.reviews.push({
    name,
    rating,
    Comment,
  });

  // Update Review Count
  restaurant.numOfReviews =
    restaurant.reviews.length;

  // Update Average Rating
  const totalRatings =
    restaurant.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

  restaurant.ratings =
    totalRatings / restaurant.reviews.length;

  // AI Review Analysis
  try {
    const aiData = await analyzeReviewsWithAI(
      restaurant.reviews
    );

    restaurant.reviewSentiment =
      aiData.sentiment;

    restaurant.reviewSummaryBullets =
      aiData.summaryBullets;

    restaurant.reviewTopMentions =
      aiData.topMentions;
  } catch (error) {
    console.log(
      "AI Analysis Failed:",
      error.message
    );
  }

  await restaurant.save();

  res.status(200).json({
    success: true,
    message: "Review Added Successfully",
    restaurant,
  });
});




exports.getReviewSummary = catchAsync(async (req, res) => {
    const { restaurantId } = req.body;
    
    // Fetch reviews from your DB
    const reviews = await Review.find({ restaurant: restaurantId });
    const reviewText = reviews.map(r => r.comment).join(" ");

    const summary = await aiService.generateReviewSummary(reviewText);

    res.status(200).json({
        success: true,
        data: { summary }
    });
});

// Add this to the bottom of backend/controllers/ai.controller.js


exports.generateReviewSummary = catchAsync(async (req, res) => {
    const { restaurantId } = req.body;

    // 2. Find the restaurant by ID to get the embedded reviews array
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant || !restaurant.reviews || restaurant.reviews.length === 0) {
        return res.status(200).json({
            success: true,
            data: { summary: "No reviews found for this restaurant yet. 😊" }
        });
    }

    // 3. Map the comments (Note: your JSON uses "Comment" with a capital C)
    const reviewText = restaurant.reviews
        .map(r => r.Comment || r.comment) 
        .join(". ");

    // 4. Send to Groq AI
    const summary = await aiService.generateReviewSummary(reviewText);

    res.status(200).json({
        success: true,
        data: { summary }
    });
});