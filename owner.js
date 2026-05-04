class FoodItem {
  constructor(id, restaurant, name, category, ingredients, expiryDate, type, quantity) {
    this.id = id;
    this.restaurant = restaurant;
    this.name = name;
    this.category = category;
    this.ingredients = ingredients;
    this.expiryDate = expiryDate;
    this.type = type;
    this.quantity = quantity;
  }
}

const defaultFoodItems = [
  new FoodItem(1, "Green Bowl", "Chicken Biryani", "Meal", ["Rice", "Chicken", "Spices", "Yogurt"], "2026-03-30", "discount", 3),
  new FoodItem(2, "Bake House", "Vegetable Sandwich", "Bakery", ["Bread", "Tomato", "Lettuce", "Cheese"], "2026-03-29", "free", 2),
  new FoodItem(3, "Cafe Bliss", "Iced Coffee", "Beverage", ["Milk", "Coffee", "Sugar", "Ice"], "2026-03-30", "beverage", 4),
  new FoodItem(4, "Pasta Point", "Pasta Alfredo", "Meal", ["Pasta", "Cream", "Cheese", "Herbs"], "2026-03-31", "meal", 1),
  new FoodItem(5, "Bake House", "Chocolate Muffin", "Bakery", ["Flour", "Cocoa", "Eggs", "Sugar"], "2026-03-30", "bakery", 5),
  new FoodItem(6, "Fresh Sip", "Fruit Juice", "Beverage", ["Orange", "Apple", "Mango"], "2026-03-29", "discount", 2)
];

const API_URL = window.API_BASE_URL || "http://localhost:5000";
const currentUserId = localStorage.getItem("userId");

function getFoodItems() {
  const saved = JSON.parse(localStorage.getItem("foodItems"));
  if (saved && Array.isArray(saved)) return saved;
  localStorage.setItem("foodItems", JSON.stringify(defaultFoodItems));
  return defaultFoodItems;
}

// Sync local inventory with server
async function syncInventoryWithServer() {
  try {
    const resp = await fetch(API_URL + "/api/food");
    if (!resp.ok) return;

    const data = await resp.json();

    if (Array.isArray(data) && data.length) {
      // Filter to only show food belonging to this logged-in owner
      const myFood = data.filter(item => String(item.owner_id) === String(currentUserId));
      localStorage.setItem("foodItems", JSON.stringify(myFood));
      foodItems = myFood;
      renderFoodItems(foodItems);
    }
  } catch (err) {
    console.warn("Could not sync inventory with server", err);
  }
}

function saveFoodItems(items) {
  localStorage.setItem("foodItems", JSON.stringify(items));
}

let foodItems = getFoodItems();

const inventoryGrid = document.getElementById("inventoryGrid");
const filterButtons = document.querySelectorAll(".filter-btn");
const modal = document.getElementById("detailModal");
const closeModal = document.getElementById("closeModal");
const modalName = document.getElementById("modalName");
const modalCategory = document.getElementById("modalCategory");
const modalType = document.getElementById("modalType");
const modalExpiry = document.getElementById("modalExpiry");
const modalIngredients = document.getElementById("modalIngredients");
const addItemBtn = document.getElementById("addItemBtn");
const addItemModal = document.getElementById("addItemModal");
const closeAddModal = document.getElementById("closeAddModal");
const addItemForm = document.getElementById("addItemForm");

function getBadgeClass(type) {
  if (type === "discount") return "badge-discount";
  if (type === "free") return "badge-free";
  return "badge-regular";
}

function getBadgeLabel(type) {
  if (type === "discount") return "Discount";
  if (type === "free") return "Free Food";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function renderFoodItems(items) {
  if (!inventoryGrid) return;
  inventoryGrid.innerHTML = "";

  if (items.length === 0) {
    inventoryGrid.innerHTML = `<p>No food items found.</p>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.classList.add("food-card");

    card.innerHTML = `
      <div class="food-header">
        <div class="food-title">${item.name}</div>
        <span class="food-badge ${getBadgeClass(item.type)}">${getBadgeLabel(item.type)}</span>
      </div>

      <div class="food-details">
        <p><strong>Restaurant:</strong> ${item.restaurant || "-"}</p>
        <p><strong>Category:</strong> ${item.category}</p>
        <p><strong>Expiry:</strong> ${item.expiry_date || item.expiryDate || "-"}</p>
        <p><strong>Quantity:</strong> ${item.quantity ?? 1}</p>
      </div>

      <div class="card-actions">
        <button class="detail-btn" onclick="openModal(${item.id})">See Detail</button>
      </div>
    `;

    inventoryGrid.appendChild(card);
  });
}

function openModal(id) {
  const item = foodItems.find((food) => food.id === id);
  if (!item) return;

  modalName.textContent = item.name;
  modalCategory.textContent = item.category;
  modalType.textContent = getBadgeLabel(item.type);
  modalExpiry.textContent = item.expiry_date || item.expiryDate || "-";
  modalIngredients.textContent = Array.isArray(item.ingredients)
    ? item.ingredients.join(", ")
    : item.ingredients;

  modal.classList.remove("hidden");
}

function closeDetailModal() {
  modal.classList.add("hidden");
}

function openAddItemModal() {
  addItemModal.classList.remove("hidden");
}

function closeAddItemModal() {
  addItemModal.classList.add("hidden");
  if(addItemForm) addItemForm.reset();
}

if (addItemForm) {
  addItemForm.addEventListener("submit", function (e) {
    e.preventDefault();

    foodItems = getFoodItems();
    
    const newItem = {
      id: Date.now(),
      restaurant: localStorage.getItem("restaurantName") || "My Restaurant",
      name: document.getElementById("foodName").value.trim(),
      category: document.getElementById("foodCategory").value,
      ingredients: document
        .getElementById("foodIngredients")
        .value.split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      expiryDate: document.getElementById("foodExpiry").value,
      type: document.getElementById("foodType").value,
      quantity: 1,
    };

    // Sync with server immediately
    (async function () {
      try {
        const resp = await fetch(API_URL + "/api/food", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner_id: currentUserId, // Linked to correct owner
            restaurant: newItem.restaurant,
            name: newItem.name,
            category: newItem.category,
            ingredients: newItem.ingredients.join(", "),
            expiryDate: newItem.expiryDate,
            type: newItem.type,
            quantity: newItem.quantity,
          }),
        });

        if (!resp.ok) {
          console.warn("Server add-food responded with", resp.status);
          alert("Database Error: Could not save food to server.");
        } else {
          syncInventoryWithServer();
          alert("Item added successfully ✔");
        }
      } catch (err) {
        console.warn("Network error adding food to server", err);
      }
    })();

    closeAddItemModal();
  });
}

if (closeModal) closeModal.addEventListener("click", closeDetailModal);
if (addItemBtn) addItemBtn.addEventListener("click", openAddItemModal);
if (closeAddModal) closeAddModal.addEventListener("click", closeAddItemModal);

window.addEventListener("click", (e) => {
  if (e.target === modal) closeDetailModal();
  if (e.target === addItemModal) closeAddItemModal();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const activeButton = document.querySelector(".filter-btn.active");
    if (activeButton) activeButton.classList.remove("active");

    button.classList.add("active");
    const filter = button.dataset.filter;
    
    if (filter === "all") {
      renderFoodItems(foodItems);
      return;
    }

    const filteredItems = foodItems.filter((item) => {
      return (
        item.type.toLowerCase() === filter.toLowerCase() ||
        item.category.toLowerCase() === filter.toLowerCase()
      );
    });

    renderFoodItems(filteredItems);
  });
});

window.openModal = openModal;

function checkAccess() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userRole = localStorage.getItem("userRole");

  if (isLoggedIn !== "true" || userRole !== "owner") {
    window.location.href = "index.html";
  }
}

// =====================================================
// NOTIFICATIONS & REQUESTS LOGIC
// =====================================================
const requestsGrid = document.getElementById("requestsGrid");
const notifCount = document.getElementById("notifCount");

async function loadOwnerRequests() {
  if (!requestsGrid) return;
  try {
    const resp = await fetch(`${API_URL}/api/owner-requests/${currentUserId}`);
    if (!resp.ok) return;
    const requests = await resp.json();
    
    requestsGrid.innerHTML = "";
    const pendingReqs = requests.filter(r => r.status === 'pending');

    if (pendingReqs.length === 0) {
      requestsGrid.innerHTML = `<p style="color: #666;">No pending requests at the moment.</p>`;
      return;
    }

    pendingReqs.forEach(req => {
      const card = document.createElement("div");
      card.classList.add("food-card"); 
      card.innerHTML = `
        <div class="food-header">
          <div class="food-title">Request #${req.id}</div>
          <span class="food-badge badge-discount">Needs Action</span>
        </div>
        <div class="food-details">
          <p><strong>Food ID:</strong> ${req.food_id}</p>
          <p><strong>Customer ID:</strong> ${req.customer_id}</p>
          <p><strong>Time:</strong> ${new Date(req.created_at).toLocaleTimeString()}</p>
        </div>
        <div class="card-actions" style="gap: 10px; display: flex; margin-top: 15px;">
          <button class="primary-btn" onclick="handleFoodRequest(${req.id}, 'approve')" style="background: #27ae60; flex: 1;">Approve</button>
          <button class="secondary-btn" onclick="handleFoodRequest(${req.id}, 'decline')" style="background: #e74c3c; color: white; border: none; flex: 1;">Decline</button>
        </div>
      `;
      requestsGrid.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading requests:", err);
  }
}

window.handleFoodRequest = async function(reqId, action) {
  const endpoint = action === 'approve' 
    ? `${API_URL}/api/approve-request/${reqId}` 
    : `${API_URL}/api/decline-request/${reqId}`;

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    
    await resp.json();
    alert(`Request ${action}d successfully!`); 
    
    loadOwnerRequests(); 
    syncInventoryWithServer(); 
  } catch (err) {
    console.error(`Error trying to ${action} request:`, err);
  }
}

async function checkNotifications() {
  if (!notifCount) return;
  try {
    const resp = await fetch(`${API_URL}/api/notifications/${currentUserId}`);
    if (!resp.ok) return;
    const notifications = await resp.json();
    
    const unread = notifications.filter(n => n.is_read === 0 || n.is_read === false);
    
    if (unread.length > 0) {
      notifCount.style.display = "inline";
      notifCount.innerText = `(${unread.length})`;
    } else {
      notifCount.style.display = "none";
    }
  } catch (err) {
    console.error("Error checking notifications:", err);
  }
}

// INITIALIZE APP
checkAccess();
syncInventoryWithServer();
loadOwnerRequests();
checkNotifications();

// Polling setup
setInterval(loadOwnerRequests, 10000); 
setInterval(checkNotifications, 10000);

// =====================================================
// NOTIFICATION POPUP WINDOW
// =====================================================

// 1. Dynamically create the Modal in the HTML so we don't have to edit the HTML files
document.body.insertAdjacentHTML('beforeend', `
  <div class="modal hidden" id="notifModal">
    <div class="modal-content">
      <button class="close-btn" id="closeNotifModal">&times;</button>
      <h2>Your Alerts</h2>
      <div id="notifList" style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;"></div>
      <button class="primary-btn" id="markReadBtn" style="margin-top: 20px; width: 100%; background: #e74c3c; border:none;">Clear All Alerts</button>
    </div>
  </div>
`);

// 2. Grab the elements
const notifModal = document.getElementById("notifModal");
const closeNotifModal = document.getElementById("closeNotifModal");
const notifList = document.getElementById("notifList");
const notificationBell = document.getElementById("notificationBell");
const markReadBtn = document.getElementById("markReadBtn");

// 3. Open modal and load messages when Bell is clicked
if (notificationBell) {
  notificationBell.addEventListener("click", async (e) => {
    e.preventDefault();
    notifList.innerHTML = "<p>Loading...</p>";
    notifModal.classList.remove("hidden");

    try {
      const resp = await fetch(`${API_URL}/api/notifications/${currentUserId}`);
      const notifications = await resp.json();
      const unread = notifications.filter(n => n.is_read === 0 || n.is_read === false);

      if (unread.length === 0) {
        notifList.innerHTML = "<p style='color:#666;'>No new alerts.</p>";
      } else {
        notifList.innerHTML = "";
        unread.forEach(n => {
          const item = document.createElement("div");
          item.style = "padding: 12px; background: #fdf2f2; border-radius: 8px; border-left: 4px solid #e74c3c;";
          item.innerHTML = `
            <p style="margin:0; color:#333; font-weight:bold;">${n.message}</p>
            <small style="color:#888;">${new Date(n.created_at).toLocaleString()}</small>
          `;
          notifList.appendChild(item);
        });
      }
    } catch (err) {
      notifList.innerHTML = "<p>Error loading alerts.</p>";
    }
  });
}

// 4. Close the Modal
closeNotifModal.addEventListener("click", () => notifModal.classList.add("hidden"));
window.addEventListener("click", (e) => {
  if (e.target === notifModal) notifModal.classList.add("hidden");
});

// 5. Clear Alerts and reset the Bell
markReadBtn.addEventListener("click", async () => {
  try {
    await fetch(`${API_URL}/api/mark-notifications-read/${currentUserId}`, { method: "POST" });
    
    // Hide the bell number and close the modal
    const countBadge = document.getElementById("notifCount");
    if(countBadge) countBadge.style.display = "none";
    
    notifModal.classList.add("hidden");
    alert("Alerts cleared!");
  } catch (err) {
    console.error("Error clearing alerts", err);
  }
});
