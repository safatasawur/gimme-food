class FoodItem {
  constructor(id, name, category, ingredients, expiryDate, type) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.ingredients = ingredients;
    this.expiryDate = expiryDate;
    this.type = type;
  }
}

const foodItems = [
  new FoodItem(
    1,
    "Chicken Biryani",
    "Meal",
    ["Rice", "Chicken", "Spices", "Yogurt"],
    "2026-03-30",
    "discount"
  ),
  new FoodItem(
    2,
    "Vegetable Sandwich",
    "Bakery",
    ["Bread", "Tomato", "Lettuce", "Cheese"],
    "2026-03-29",
    "free"
  ),
  new FoodItem(
    3,
    "Iced Coffee",
    "Beverage",
    ["Milk", "Coffee", "Sugar", "Ice"],
    "2026-03-30",
    "beverage"
  ),
  new FoodItem(
    4,
    "Pasta Alfredo",
    "Meal",
    ["Pasta", "Cream", "Cheese", "Herbs"],
    "2026-03-31",
    "meal"
  ),
  new FoodItem(
    5,
    "Chocolate Muffin",
    "Bakery",
    ["Flour", "Cocoa", "Eggs", "Sugar"],
    "2026-03-30",
    "bakery"
  ),
  new FoodItem(
    6,
    "Fruit Juice",
    "Beverage",
    ["Orange", "Apple", "Mango"],
    "2026-03-29",
    "discount"
  )
];

const inventoryGrid = document.getElementById("inventoryGrid");
const filterButtons = document.querySelectorAll(".filter-btn");

const modal = document.getElementById("detailModal");
const closeModal = document.getElementById("closeModal");

const modalName = document.getElementById("modalName");
const modalCategory = document.getElementById("modalCategory");
const modalType = document.getElementById("modalType");
const modalExpiry = document.getElementById("modalExpiry");
const modalIngredients = document.getElementById("modalIngredients");

// Add Item modal elements
const addItemBtn = document.getElementById("addItemBtn");
const addItemModal = document.getElementById("addItemModal");
const closeAddModal = document.getElementById("closeAddModal");
const addItemForm = document.getElementById("addItemForm");

const foodNameInput = document.getElementById("foodName");
const foodCategoryInput = document.getElementById("foodCategory");
const foodIngredientsInput = document.getElementById("foodIngredients");
const foodExpiryInput = document.getElementById("foodExpiry");
const foodTypeInput = document.getElementById("foodType");

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

  items.forEach((item) => {
    const card = document.createElement("div");
    card.classList.add("food-card");

    card.innerHTML = `
      <div class="food-header">
        <div class="food-title">${item.name}</div>
        <span class="food-badge ${getBadgeClass(item.type)}">${getBadgeLabel(item.type)}</span>
      </div>

      <div class="food-details">
        <p><strong>Category:</strong> ${item.category}</p>
        <p><strong>Expiry:</strong> ${item.expiryDate}</p>
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
  modalIngredients.textContent = item.ingredients.join(", ");

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

function getNextId() {
  if (foodItems.length === 0) return 1;
  return Math.max(...foodItems.map((item) => item.id)) + 1;
}
const form = document.getElementById("addItemForm");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const items = JSON.parse(localStorage.getItem("foodItems")) || [];

  const newItem = {
    id: Date.now(),
    restaurant: localStorage.getItem("restaurantName") || "My Restaurant",
    name: document.getElementById("foodName").value,
    category: document.getElementById("foodCategory").value,
    type: document.getElementById("foodType").value,
    expiryDate: document.getElementById("foodExpiry").value,
    quantity: 1,
    ingredients: document.getElementById("foodIngredients").value
  };

  items.push(newItem);

  localStorage.setItem("foodItems", JSON.stringify(items));

  alert("Item added ✔");

  form.reset();
  location.reload();
});

closeModal.addEventListener("click", closeDetailModal);
addItemBtn.addEventListener("click", openAddItemModal);
closeAddModal.addEventListener("click", closeAddItemModal);

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeDetailModal();
  }

  if (e.target === addItemModal) {
    closeAddItemModal();
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const activeButton = document.querySelector(".filter-btn.active");
    if (activeButton) {
      activeButton.classList.remove("active");
    }

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

renderFoodItems(foodItems);
window.openModal = openModal;