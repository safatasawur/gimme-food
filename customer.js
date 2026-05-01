const API = window.API_BASE_URL;

let availableFood = [];

const foodGrid = document.getElementById("foodGrid");
const historyList = document.getElementById("historyList");
const notificationList = document.getElementById("notificationList");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");


function checkAccess() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const role = localStorage.getItem("userRole");

  if (isLoggedIn !== "true" || role !== "customer") {
    window.location.href = "index.html";
  }
}


function getUserId() {
  return localStorage.getItem("user_id");
}


function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}


function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({
    behavior: "smooth"
  });
}


function badgeClass(type) {
  if (type === "discount") return "discount";
  if (type === "free") return "free";
  return "regular";
}


async function loadFood() {
  try {
    const res = await fetch(API + "/api/food");
    availableFood = await res.json();
    renderFood(availableFood);
  } catch (err) {
    console.log(err);
  }
}


function renderFood(items) {

  foodGrid.innerHTML = "";

  if (!items.length) {
    foodGrid.innerHTML = "<p>No food found.</p>";
    return;
  }

  items.forEach(item => {

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <span class="badge ${badgeClass(item.type)}">${item.type}</span>
      <h3>${item.name}</h3>
      <p><strong>Restaurant:</strong> ${item.restaurant}</p>
      <p><strong>Category:</strong> ${item.category}</p>
      <p><strong>Expiry:</strong> ${item.expiry_date || item.expiryDate}</p>
      <p><strong>Available:</strong> ${item.quantity}</p>

      <button class="btn"
        onclick="requestFood(${item.id}, ${item.owner_id})"
        ${item.quantity < 1 ? "disabled" : ""}>
        ${item.quantity < 1 ? "Unavailable" : "Request Food"}
      </button>
    `;

    foodGrid.appendChild(card);
  });
}


function filterFood() {

  const search = searchInput.value.toLowerCase();
  const type = typeFilter.value.toLowerCase();
  const category = categoryFilter.value.toLowerCase();

  const filtered = availableFood.filter(item => {

    const a =
      item.name.toLowerCase().includes(search) ||
      item.restaurant.toLowerCase().includes(search);

    const b =
      type === "all" ||
      item.type.toLowerCase() === type;

    const c =
      category === "all" ||
      item.category.toLowerCase() === category;

    return a && b && c;
  });

  renderFood(filtered);
}


async function requestFood(foodId, ownerId) {

  const customerId = getUserId();

  try {

    const res = await fetch(API + "/api/request-food", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        food_id: foodId,
        customer_id: customerId,
        owner_id: ownerId
      })
    });

    const data = await res.json();

    alert(data.message || "Request sent");

    loadFood();
    loadHistory();
    loadNotifications();

  } catch (err) {
    alert("Request failed");
  }
}


async function loadHistory() {

  const customerId = getUserId();

  try {

    const res = await fetch(API + "/api/owner-requests/" + customerId);
    const rows = await res.json();

    historyList.innerHTML = "";

    const mine = rows.filter(x => Number(x.customer_id) === Number(customerId));

    if (!mine.length) {
      historyList.innerHTML = "<p>No requests yet.</p>";
      return;
    }

    mine.forEach(item => {

      historyList.innerHTML += `
        <div class="list-item">
          <p><strong>Food ID:</strong> ${item.food_id}</p>
          <p><strong>Status:</strong> ${item.status}</p>
          <p><strong>Date:</strong> ${item.created_at}</p>
        </div>
      `;
    });

  } catch (err) {
    historyList.innerHTML = "<p>Could not load requests.</p>";
  }
}


async function loadNotifications() {

  const userId = getUserId();

  try {

    const res = await fetch(API + "/api/notifications/" + userId);
    const rows = await res.json();

    notificationList.innerHTML = "";

    if (!rows.length) {
      notificationList.innerHTML = "<p>No notifications.</p>";
      return;
    }

    rows.forEach(n => {
      notificationList.innerHTML += `
        <div class="list-item">
          <p>${n.message}</p>
          <p class="small">${n.created_at}</p>
        </div>
      `;
    });

  } catch (err) {
    notificationList.innerHTML = "<p>Could not load notifications.</p>";
  }
}


searchInput.addEventListener("input", filterFood);
typeFilter.addEventListener("change", filterFood);
categoryFilter.addEventListener("change", filterFood);

window.requestFood = requestFood;
window.logout = logout;
window.scrollToSection = scrollToSection;

checkAccess();
loadFood();
loadHistory();
loadNotifications();

setInterval(loadNotifications, 5000);
setInterval(loadFood, 5000);
