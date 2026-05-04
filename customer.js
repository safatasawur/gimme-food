// =====================================================
// CUSTOMER SETTINGS & STATE
// =====================================================
const API_URL = window.API_BASE_URL || "http://localhost:5000";
const currentUserId = localStorage.getItem("userId") || 1; 

let availableFood = []; 

const foodGrid = document.getElementById("foodGrid");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");
const logoutBtn = document.getElementById("logoutBtn");
const notifCount = document.getElementById("notifCount");

function checkAccess() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userRole = localStorage.getItem("userRole");

  if (isLoggedIn !== "true" || userRole !== "customer") {
    window.location.href = "index.html";
  }
}

// =====================================================
// 1. FETCH AND RENDER FOOD
// =====================================================
async function loadFoodFromServer() {
  try {
    const resp = await fetch(`${API_URL}/api/food`);
    if (!resp.ok) throw new Error("Server error");

    availableFood = await resp.json();
    filterFood(); // Apply any active filters and render
  } catch (err) {
    console.error("Could not load food:", err);
    if (foodGrid) foodGrid.innerHTML = `<p class="empty-text">Error loading food. Is the server running?</p>`;
  }
}

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
  if (!foodGrid) return;
  foodGrid.innerHTML = "";

  if (items.length === 0) {
    foodGrid.innerHTML = `<p class="empty-text">No food items match your filters.</p>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "food-card";

    // Note: We pass BOTH item.id and item.owner_id to the request function
    card.innerHTML = `
      <span class="badge ${getBadgeClass(item.type)}">${getBadgeLabel(item.type)}</span>
      <h3>${item.name}</h3>
      <p><strong>Restaurant:</strong> ${item.restaurant}</p>
      <p><strong>Category:</strong> ${item.category}</p>
      <p><strong>Expiry:</strong> ${item.expiry_date || 'N/A'}</p>
      <p><strong>Available Portions:</strong> ${item.quantity}</p>
      
      <button class="request-btn" onclick="requestFood(${item.id}, ${item.owner_id})" ${item.quantity < 1 ? "disabled" : ""}>
        ${item.quantity < 1 ? "Not Available" : "Request One Portion"}
      </button>
    `;

    foodGrid.appendChild(card);
  });
}

// =====================================================
// 2. FILTER LOGIC
// =====================================================
function filterFood() {
  const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const selectedType = typeFilter ? typeFilter.value.toLowerCase() : "all";
  const selectedCategory = categoryFilter ? categoryFilter.value.toLowerCase() : "all";

  const filtered = availableFood.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchValue) || 
                          (item.restaurant && item.restaurant.toLowerCase().includes(searchValue));
    const matchesType = selectedType === "all" || item.type.toLowerCase() === selectedType;
    const matchesCategory = selectedCategory === "all" || item.category.toLowerCase() === selectedCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  renderFoodItems(filtered);
}

// =====================================================
// 3. SEND FOOD REQUEST
// =====================================================
window.requestFood = async function(foodId, ownerId) {
  try {
    const payload = {
      food_id: foodId,
      customer_id: currentUserId,
      owner_id: ownerId
    };

    const resp = await fetch(`${API_URL}/api/request-food`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error("Failed to send request");

    alert("Food requested successfully! The restaurant has been notified.");
    
    // Reload food to get updated quantities
    loadFoodFromServer(); 

  } catch (err) {
    console.error("Error sending request:", err);
    alert("There was an error sending your request.");
  }
};

// =====================================================
// 4. POLL FOR NOTIFICATIONS (Approve/Decline)
// =====================================================
async function checkNotifications() {
  if (!notifCount) return;
  try {
    const resp = await fetch(`${API_URL}/api/notifications/${currentUserId}`);
    if (!resp.ok) return;
    
    const notifications = await resp.json();
    
    // Find unread notifications
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

// =====================================================
// EVENT LISTENERS & INITIALIZATION
// =====================================================
if (searchInput) searchInput.addEventListener("input", filterFood);
if (typeFilter) typeFilter.addEventListener("change", filterFood);
if (categoryFilter) categoryFilter.addEventListener("change", filterFood);

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });
}

window.goToProfile = function () {
  window.location.href = "profile.html";
};

// INITIALIZE APP
checkAccess();
loadFoodFromServer();
checkNotifications();

// Poll every 10 seconds for new notifications and updated food inventory
setInterval(checkNotifications, 10000);
setInterval(loadFoodFromServer, 10000);

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
