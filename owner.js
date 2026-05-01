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
  new FoodItem(
    1,
    "Green Bowl",
    "Chicken Biryani",
    "Meal",
    ["Rice", "Chicken", "Spices", "Yogurt"],
    "2026-03-30",
    "discount",
    3
  ),
  new FoodItem(
    2,
    "Bake House",
    "Vegetable Sandwich",
    "Bakery",
    ["Bread", "Tomato", "Lettuce", "Cheese"],
    "2026-03-29",
    "free",
    2
  ),
  new FoodItem(
    3,
    "Cafe Bliss",
    "Iced Coffee",
    "Beverage",
    ["Milk", "Coffee", "Sugar", "Ice"],
    "2026-03-30",
    "beverage",
    4
  ),
  new FoodItem(
    4,
    "Pasta Point",
    "Pasta Alfredo",
    "Meal",
    ["Pasta", "Cream", "Cheese", "Herbs"],
    "2026-03-31",
    "meal",
    1
  ),
  new FoodItem(
    5,
    "Bake House",
    "Chocolate Muffin",
    "Bakery",
    ["Flour", "Cocoa", "Eggs", "Sugar"],
    "2026-03-30",
    "bakery",
    5
  ),
  new FoodItem(
    6,
    "Fresh Sip",
    "Fruit Juice",
    "Beverage",
    ["Orange", "Apple", "Mango"],
    "2026-03-29",
    "discount",
    2
  )
];

function getFoodItems() {
  const saved = JSON.parse(localStorage.getItem("foodItems"));
  if (saved && Array.isArray(saved)) {
    return saved;
  }

  localStorage.setItem("foodItems", JSON.stringify(defaultFoodItems));
  return defaultFoodItems;
}

// Try to sync local inventory with server if available
async function syncInventoryWithServer() {
  try {
    const resp = await fetch(window.API_BASE_URL + '/api/food');
    if (!resp.ok) return;
    const data = await resp.json();
    if (Array.isArray(data) && data.length) {
      localStorage.setItem('foodItems', JSON.stringify(data));
      foodItems = data;
      renderFoodItems(foodItems);
    }
  } catch (err) {
    console.warn('Could not sync inventory with server', err);
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
        <p><strong>Expiry:</strong> ${item.expiryDate}</p>
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
  modalExpiry.textContent = item.expiryDate;
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
  addItemForm.reset();
}

addItemForm.addEventListener("submit", function (e) {
  e.preventDefault();

  foodItems = getFoodItems();

  const newItem = {
    id: Date.now(),
    restaurant: localStorage.getItem("restaurantName") || "My Restaurant",
    name: document.getElementById("foodName").value.trim(),
    category: document.getElementById("foodCategory").value,
    ingredients: document.getElementById("foodIngredients").value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    expiryDate: document.getElementById("foodExpiry").value,
    type: document.getElementById("foodType").value,
    quantity: 1
  };

  foodItems.push(newItem);
  saveFoodItems(foodItems);

  // Sync with server
  (async function() {
    try {
      const resp = await fetch(window.API_BASE_URL + '/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant: newItem.restaurant,
          name: newItem.name,
          category: newItem.category,
          ingredients: newItem.ingredients,
          expiryDate: newItem.expiryDate,
          type: newItem.type,
          quantity: newItem.quantity
        })
      });
      if (!resp.ok) {
        console.warn('Server add-food responded with', resp.status);
      }
    } catch (err) {
      console.warn('Network error adding food to server', err);
    }
  })();

  closeAddItemModal();
  renderFoodItems(foodItems);
  alert("Item added successfully ✔");
});

closeModal.addEventListener("click", closeDetailModal);
addItemBtn.addEventListener("click", openAddItemModal);
closeAddModal.addEventListener("click", closeAddItemModal);

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

    foodItems = getFoodItems();

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

renderFoodItems(foodItems);
window.openModal = openModal;

function checkAccess() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userRole = localStorage.getItem("userRole");

  if (isLoggedIn !== "true" || userRole !== "owner") {
    window.location.href = "index.html";
  }
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

checkAccess();
syncInventoryWithServer();

fetch('/owner-requests')
fetch('/approve-request/3',{method:'POST'})
fetch('/decline-request/3',{method:'POST'})
