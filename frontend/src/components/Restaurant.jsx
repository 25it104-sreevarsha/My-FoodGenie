import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteRestaurant } from "../redux/actions/restaurantAction";
import axios from "axios"; // 1. Import axios

const Restaurant = ({ restaurant }) => {
  const dispatch = useDispatch();
  const [showAI, setShowAI] = useState(false);
  const [summary, setSummary] = useState(""); // 2. State for the real summary
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, user } = useSelector((state) => state.user || {});

    // 3. Function to fetch summary from Backend
  const fetchSummary = async () => {
    if (!showAI && !summary) { 
      setLoading(true);
      try {
        // Updated to point to your live Render backend
        const { data } = await axios.post("https://my-foodgenie.onrender.com/api/v1/ai/generate-review-summary", {
          restaurantId: restaurant._id
        });
        setSummary(data.data.summary);
      } catch (err) {
        console.error("AI Summary Error:", err);
        setSummary("Could not generate summary. Enjoy the food! 😊");
      }
      setLoading(false);
    }
    setShowAI(!showAI);
  };
  const handleDelete = () => {
    if (!window.confirm("Delete this restaurant?")) return;
    dispatch(deleteRestaurant(restaurant._id)).catch(() => {
      alert("Unable to delete");
    });
  };

  return (
    <div className="col-12 my-3">
      <div className="card restaurant-card p-3">
        <Link to={`/eats/stores/${restaurant._id}/menus`}>
          <img
            className="restaurant-image"
            src={restaurant.images?.[0]?.url}
            alt={restaurant.name}
          />
        </Link>

        <div className="restaurant-info">
          <h4>{restaurant.name}</h4>
          <p className="rest_address">{restaurant.address}</p>

          <div className="ratings">
            <div className="rating-outer">
              <div
                className="rating-inner"
                style={{ width: `${(restaurant.ratings / 5) * 100}%` }}
              ></div>
            </div>
            <span>({restaurant.numOfReviews} Reviews)</span>
          </div>

          {/* 4. Updated Button */}
          <button className="ai-btn" onClick={fetchSummary}>
            {showAI ? "➖ Hide Summary" : "💬 View Review Summary"}
          </button>
        </div>

        {/* 5. Updated Summary Box */}
        {showAI && (
          <div className="ai-insights-box">
            <div className="ai-status">
              <strong>AI Review Summary:</strong>
              <p className="mt-2">
                {loading ? "Analyzing reviews with Groq AI... 🪄" : summary}
              </p>
            </div>
          </div>
        )}
      </div>

      {isAuthenticated && user && user.role === "admin" && (
        <button className="btn btn-danger btn-sm mt-2" onClick={handleDelete}>
          Delete
        </button>
      )}
    </div>
  );
};

export default Restaurant;