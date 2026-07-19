import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { getMenus, addItemToMenu, createMenu } from "../redux/actions/menuActions"; 
import { getRestaurants } from "../redux/actions/restaurantAction";
import Fooditem from "./Fooditem";
import axios from "axios";

const Menu = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { menus, menuId, loading, error, addingItem, addError } = useSelector(
    (state) => state.menus
  );

  const { isAuthenticated, user } = useSelector((state) => state.user);

  const [showMenuCreate, setShowMenuCreate] = useState(false);
  const [newMenuCategory, setNewMenuCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToAdd, setItemToAdd] = useState({ category: "", foodItemId: "" });
  const [availableItems, setAvailableItems] = useState([]);
  const [creatingFood, setCreatingFood] = useState(false);

  // AI Review Summary States
  const [reviewSummary, setReviewSummary] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [newFood, setNewFood] = useState({
    name: "",
    price: "",
    description: "",
    stock: "",
    imageUrl: "",
  });

  useEffect(() => {
    dispatch(getMenus(id));
    dispatch(getRestaurants());
  }, [dispatch, id]);

  const fetchItems = async () => {
    try {
      const { data } = await axios.get(`/api/v1/eats/items/${id}`);
      setAvailableItems(data.data);
    } catch (err) {
      console.error("failed to load items", err);
    }
  };

  // Function to handle AI Review Summary using Groq
  const handleReviewSummary = async () => {
    setLoadingSummary(true);
    setShowReviewModal(true);
    try {
      const { data } = await axios.post(
        "/api/v1/ai/generate-review-summary",
        { restaurantId: id },
        { withCredentials: true }
      );
      setReviewSummary(data.data.summary);
    } catch (err) {
      console.error("Failed to fetch summary", err);
      setReviewSummary("Could not generate summary at this time. Enjoy your meal! 😊");
    } finally {
      setLoadingSummary(false);
    }
  };

  const submitMenuCreation = async (e) => {
    e.preventDefault();
    if (!newMenuCategory) return;

    const result = await dispatch(
      createMenu({ restaurantId: id, category: newMenuCategory })
    );

    if (createMenu.fulfilled.match(result)) {
      dispatch(getMenus(id)); 
      setShowMenuCreate(false);
      setNewMenuCategory("");
    }
  };

  const submitNewFood = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newFood,
        price: parseFloat(newFood.price) || 0,
        stock: parseInt(newFood.stock) || 0,
        restaurant: id,
      };

      const { data } = await axios.post("/api/v1/eats/item", payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      const created = data.data;
      setAvailableItems((prev) => [...prev, created]);
      setItemToAdd({ ...itemToAdd, foodItemId: created._id });
      setCreatingFood(false);
      setNewFood({ name: "", price: "", description: "", stock: "", imageUrl: "" });
      return created;
    } catch (err) {
      console.error("unable to create food item", err);
      alert(err.response?.data?.message || err.message);
      return null;
    }
  };

  return (
    <div>
      {loading ? (
        <p>Loading menus...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : menus && menus.length > 0 ? (
        menus.map((menu) => {
          const deleteMenu = async () => {
            if (!window.confirm("Delete this menu category?")) return;
            try {
              await axios.delete(`/api/v1/eats/stores/${id}/menus/${menu._id}`, {
                withCredentials: true,
              });
              dispatch(getMenus(id));
            } catch (err) {
              console.error(err);
              alert(err.response?.data?.message || "Unable to delete menu");
            }
          };

          return (
            <div key={menu._id}>
              <div className="d-flex align-items-center">
                <h2 className="mr-2">{menu.category}</h2>
                {isAuthenticated && user && user.role === "admin" && (
                  <>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setItemToAdd({ category: menu.category, foodItemId: "" });
                        fetchItems();
                        setShowAddModal(true);
                      }}
                    >
                      + item
                    </button>
                    <button className="btn btn-sm btn-danger ml-2" onClick={deleteMenu}>
                      Delete
                    </button>
                  </>
                )}
              </div>
              <hr />
              {menu.items && menu.items.length > 0 ? (
                <div className="row">
                  {menu.items.map((fooditem) => (
                    <Fooditem key={fooditem._id} fooditem={fooditem} restaurant={id} />
                  ))}
                </div>
              ) : (
                <p>No items available in this category</p>
              )}
            </div>
          );
        })
      ) : (
        <p>No menus Available</p>
      )}

      {/* Action Buttons */}
      <div className="my-3 d-flex">
        {isAuthenticated && user && user.role === "admin" && (
          <button className="btn btn-primary" onClick={() => setShowMenuCreate(true)}>
            + Add Menu
          </button>
        )}
        <button className="btn btn-info ml-2" onClick={handleReviewSummary}>
          AI Review Summary ✨
        </button>
      </div>

      {/* AI Review Summary Modal */}
      {showReviewModal && (
        <div className="create-modal">
          <div className="create-content">
            <h3>AI Review Summary</h3>
            <hr />
            {loadingSummary ? (
              <p>Generating summary with Groq AI... 🪄</p>
            ) : (
              <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>{reviewSummary}</p>
            )}
            <button className="btn btn-secondary mt-3" onClick={() => setShowReviewModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Menu Modal */}
      {showMenuCreate && (
        <div className="create-modal">
          <div className="create-content">
            <h3>Create Menu Category</h3>
            <form onSubmit={submitMenuCreation}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newMenuCategory}
                  onChange={(e) => setNewMenuCategory(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary" type="submit">Create</button>
              <button className="btn btn-secondary ml-2" type="button" onClick={() => setShowMenuCreate(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="create-modal">
          <div className="create-content">
            <h3>Add Food Item</h3>
            {addError && <p className="text-danger">{addError}</p>}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const created = await submitNewFood(e);
                if (created && created._id) {
                  dispatch(
                    addItemToMenu({
                      menuId,
                      category: itemToAdd.category,
                      foodItemId: created._id,
                      restaurantId: id,
                    })
                  ).then(() => {
                    dispatch(getMenus(id));
                    setShowAddModal(false);
                  });
                }
              }}
            >
              <div className="form-group">
                <label>Menu Category</label>
                <select
                  className="form-control"
                  value={itemToAdd.category}
                  onChange={(e) => setItemToAdd({ ...itemToAdd, category: e.target.value })}
                  required
                >
                  <option value="">Select</option>
                  {menus.map((m) => (
                    <option key={m._id} value={m.category}>{m.category}</option>
                  ))}
                </select>
              </div>

              <h5 className="mt-3">Create New Food Item</h5>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Name"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Price"
                  value={newFood.price}
                  onChange={(e) => setNewFood({ ...newFood, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group d-flex">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Description"
                  value={newFood.description}
                  onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="btn btn-sm btn-info ml-2"
                  onClick={async () => {
                    if (!newFood.name) return alert("Enter name first");
                    try {
                      const { data } = await axios.post(
                        "/api/v1/ai/generate-food-ai",
                        {
                          name: newFood.name,
                          category: itemToAdd.category || "",
                          spiceLevel: "Medium",
                          price: newFood.price || 0,
                        },
                        { withCredentials: true }
                      );
                      setNewFood({ ...newFood, description: data.data.description });
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  AI desc
                </button>
              </div>
              <div className="form-group">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Stock"
                  value={newFood.stock}
                  onChange={(e) => setNewFood({ ...newFood, stock: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Image URL"
                  value={newFood.imageUrl}
                  onChange={(e) => setNewFood({ ...newFood, imageUrl: e.target.value })}
                />
              </div>
              <button className="btn btn-primary" type="submit">Add</button>
              <button className="btn btn-secondary ml-2" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;