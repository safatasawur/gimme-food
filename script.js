class FoodItem {
  constructor(id, name, category, ingredients, expiryDate, type) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.ingredients = ingredients;
    this.expiryDate = expiryDate;
    this.type = type; // discount, free, meal, bakery, beverage, etc.
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
  const item = foodItems.find(food => food.id === id);

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

closeModal.addEventListener("click", closeDetailModal);

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeDetailModal();
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".filter-btn.active").classList.remove("active");
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