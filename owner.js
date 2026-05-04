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
// SLEEK NOTIFICATION DROPDOWN MENU
// =====================================================

// 1. Inject custom CSS so it looks perfect on both pages
const notifStyle = document.createElement('style');
notifStyle.innerHTML = `
  .notif-dropdown {
    position: absolute;
    top: 50px; /* Drops right below the bell */
    right: 0;
    width: 320px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    border: 1px solid #e5e7eb;
    z-index: 9999;
    display: none; /* Hidden by default */
    flex-direction: column;
    overflow: hidden;
  }
  .notif-dropdown.show { display: flex; }
  .notif-header {
    padding: 15px 20px;
    border-bottom: 1px solid #e5e7eb;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #111;
  }
  .notif-body { max-height: 300px; overflow-y: auto; padding: 10px; }
  .notif-item {
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    background: #fdf2f2;
    border-left: 4px solid #e74c3c;
  }
  .notif-item:last-child { margin-bottom: 0; }
  .notif-footer { padding: 10px; border-top: 1px solid #e5e7eb; background: #f9fafb; }
  .clear-btn {
    width: 100%; padding: 10px; background: #e74c3c; color: white;
    border: none; border-radius: 8px; cursor: pointer; font-weight: bold;
  }
  .clear-btn:hover { background: #c0392b; }
`;
document.head.appendChild(notifStyle);

// 2. Build the HTML and attach it exactly to the navigation area
const bell = document.getElementById("notificationBell");

if (bell && bell.parentElement) {
  // Force the navigation container to hold the dropdown properly
  bell.parentElement.style.position = "relative"; 
  
  bell.parentElement.insertAdjacentHTML('beforeend', `
    <div class="notif-dropdown" id="notifDropdown">
      <div class="notif-header">
        <span>Alerts</span>
        <button id="closeNotifDropdown" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888;">&times;</button>
      </div>
      <div class="notif-body" id="notifList">
        <p style="padding: 10px; color: #666; text-align: center;">Loading...</p>
      </div>
      <div class="notif-footer">
        <button class="clear-btn" id="markReadBtn">Clear All Alerts</button>
      </div>
    </div>
  `);
}

// 3. Add the logic to open, close, and clear
const notifDropdown = document.getElementById("notifDropdown");
const closeNotifDropdown = document.getElementById("closeNotifDropdown");
const notifList = document.getElementById("notifList");
const markReadBtn = document.getElementById("markReadBtn");

if (bell && notifDropdown) {
  // Open/Close when clicking the bell
  bell.addEventListener("click", async (e) => {
    e.preventDefault();
    notifDropdown.classList.toggle("show");
    
    // Only load if opening
    if (!notifDropdown.classList.contains("show")) return;

    notifList.innerHTML = "<p style='padding: 10px; color: #666; text-align: center;'>Loading...</p>";

    try {
      const resp = await fetch(`${API_URL}/api/notifications/${currentUserId}`);
      const notifications = await resp.json();
      const unread = notifications.filter(n => n.is_read === 0 || n.is_read === false);

      if (unread.length === 0) {
        notifList.innerHTML = "<p style='padding: 10px; color:#666; text-align:center;'>No new alerts.</p>";
      } else {
        notifList.innerHTML = "";
        unread.forEach(n => {
          const item = document.createElement("div");
          item.className = "notif-item";
          item.innerHTML = `
            <p style="margin:0; color:#333; font-weight:bold; font-size: 14px;">${n.message}</p>
            <small style="color:#888; font-size: 11px;">${new Date(n.created_at).toLocaleString()}</small>
          `;
          notifList.appendChild(item);
        });
      }
    } catch (err) {
      notifList.innerHTML = "<p style='padding: 10px; color:#e74c3c; text-align:center;'>Error loading alerts.</p>";
    }
  });

  // Close when clicking the "X"
  if (closeNotifDropdown) {
    closeNotifDropdown.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // Stop click from jumping to bell
      notifDropdown.classList.remove("show");
    });
  }

  // Close when clicking anywhere outside the dropdown
  window.addEventListener("click", (e) => {
    if (notifDropdown.classList.contains("show") && !bell.contains(e.target) && !notifDropdown.contains(e.target)) {
      notifDropdown.classList.remove("show");
    }
  });

  // Clear Alerts
  if (markReadBtn) {
    markReadBtn.addEventListener("click", async () => {
      try {
        await fetch(`${API_URL}/api/mark-notifications-read/${currentUserId}`, { method: "POST" });
        const countBadge = document.getElementById("notifCount");
        if(countBadge) countBadge.style.display = "none";
        notifDropdown.classList.remove("show");
      } catch (err) {
        console.error("Error clearing alerts", err);
      }
    });
  }
}
