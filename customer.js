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
