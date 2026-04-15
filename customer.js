let availableFood = JSON.parse(localStorage.getItem("foodItems")) || [];

const foodGrid = document.getElementById("foodGrid");
const historyList = document.getElementById("historyList");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");
const logoutBtn = document.getElementById("logoutBtn");
const viewRequestsBtn = document.getElementById("viewRequestsBtn");
const requestsSection = document.getElementById("requestsSection");

function checkAccess() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userRole = localStorage.getItem("userRole");

  if (isLoggedIn !== "true" || userRole !== "customer") {
    window.location.href = "signup.html";
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

function getRequests() {
  return JSON.parse(localStorage.getItem("customerRequests")) || [];
}

function saveRequests(requests) {
  localStorage.setItem("customerRequests", JSON.stringify(requests));
}

function hasAlreadyRequested(item) {
  const requests = getRequests();
  const userEmail = localStorage.getItem("userEmail");

  return requests.some(
    (request) =>
      request.userEmail === userEmail &&
      request.restaurant === item.restaurant &&
      request.name === item.name
  );
}

function renderFoodItems(items) {
  foodGrid.innerHTML = "";

  if (items.length === 0) {
    foodGrid.innerHTML = `<p class="empty-text">No food items match your filters.</p>`;
    return;
  }

  items.forEach((item) => {
    const alreadyRequested = hasAlreadyRequested(item);

    const card = document.createElement("div");
    card.className = "food-card";

    card.innerHTML = `
      <span class="badge ${getBadgeClass(item.type)}">${getBadgeLabel(item.type)}</span>
      <h3>${item.name}</h3>
      <p><strong>Restaurant:</strong> ${item.restaurant}</p>
      <p><strong>Category:</strong> ${item.category}</p>
      <p><strong>Expiry:</strong> ${item.expiryDate}</p>
      <p><strong>Available Portions:</strong> ${item.quantity}</p>
      <button class="request-btn" onclick="requestFood(${item.id})" ${
        alreadyRequested || item.quantity < 1 ? "disabled" : ""
      }>
        ${
          alreadyRequested
            ? "Already Requested"
            : item.quantity < 1
            ? "Not Available"
            : "Request One Portion"
        }
      </button>
    `;

    foodGrid.appendChild(card);
  });
}

function renderRequestHistory() {
  const requests = getRequests();
  const userEmail = localStorage.getItem("userEmail");

  const myRequests = requests.filter(
    (request) => request.userEmail === userEmail
  );

  historyList.innerHTML = "";

  if (myRequests.length === 0) {
    historyList.innerHTML = `<p class="empty-text">You have not requested any food yet.</p>`;
    return;
  }

  myRequests.forEach((request) => {
    const item = document.createElement("div");
    item.className = "history-item";

    item.innerHTML = `
      <p><strong>Food:</strong> ${request.name}</p>
      <p><strong>Restaurant:</strong> ${request.restaurant}</p>
      <p><strong>Category:</strong> ${request.category}</p>
      <p><strong>Requested On:</strong> ${request.requestedAt}</p>
    `;

    historyList.appendChild(item);
  });
}

function filterFood() {
  const searchValue = searchInput.value.toLowerCase().trim();
  const selectedType = typeFilter.value.toLowerCase();
  const selectedCategory = categoryFilter.value.toLowerCase();

  const filtered = availableFood.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchValue) ||
      item.restaurant.toLowerCase().includes(searchValue);

    const matchesType =
      selectedType === "all" || item.type.toLowerCase() === selectedType;

    const matchesCategory =
      selectedCategory === "all" ||
      item.category.toLowerCase() === selectedCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  renderFoodItems(filtered);
}

function requestFood(id) {
  const item = availableFood.find((food) => food.id === id);
  if (!item) return;

  const userEmail = localStorage.getItem("userEmail");
  const requests = getRequests();

  const alreadyRequested = requests.some(
    (request) =>
      request.userEmail === userEmail &&
      request.restaurant === item.restaurant &&
      request.name === item.name
  );

  if (alreadyRequested) {
    alert("You already requested one portion of this food item.");
    return;
  }

  if (item.quantity < 1) {
    alert("This item is no longer available.");
    return;
  }

  item.quantity -= 1;

  requests.push({
    id: Date.now(),
    userEmail: userEmail,
    name: item.name,
    restaurant: item.restaurant,
    category: item.category,
    requestedAt: new Date().toLocaleString()
  });

  saveRequests(requests);
  renderFoodItems(availableFood);
  renderRequestHistory();

  alert("Food requested successfully ✔");
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  window.location.href = "index.html";
}
function goToProfile() {
  window.location.href = "profile.html";
}
searchInput.addEventListener("input", filterFood);
typeFilter.addEventListener("change", filterFood);
categoryFilter.addEventListener("change", filterFood);
logoutBtn.addEventListener("click", logout);

viewRequestsBtn.addEventListener("click", () => {
  requestsSection.scrollIntoView({ behavior: "smooth" });
});

window.requestFood = requestFood;

checkAccess();
renderFoodItems(availableFood);
renderRequestHistory();