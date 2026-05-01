const API = window.API_BASE_URL;

const inventoryGrid = document.getElementById("inventoryGrid");
const requestList = document.getElementById("requestList");
const notificationList = document.getElementById("notificationList");
const foodForm = document.getElementById("foodForm");


function checkAccess() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const role = localStorage.getItem("userRole");

  if (isLoggedIn !== "true" || role !== "owner") {
    window.location.href = "index.html";
  }
}


function getOwnerId() {
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


async function loadInventory() {

  try {
    const res = await fetch(API + "/api/food");
    const rows = await res.json();

    const ownerId = getOwnerId();

    const mine = rows.filter(x => Number(x.owner_id) === Number(ownerId));

    inventoryGrid.innerHTML = "";

    if (!mine.length) {
      inventoryGrid.innerHTML = "<p>No food items yet.</p>";
      return;
    }

    mine.forEach(item => {

      inventoryGrid.innerHTML += `
        <div class="card">
          <span class="badge ${badgeClass(item.type)}">${item.type}</span>
          <h3>${item.name}</h3>
          <p><strong>Restaurant:</strong> ${item.restaurant}</p>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Expiry:</strong> ${item.expiry_date || item.expiryDate}</p>
          <p><strong>Quantity:</strong> ${item.quantity}</p>
        </div>
      `;
    });

  } catch (err) {
    inventoryGrid.innerHTML = "<p>Could not load inventory.</p>";
  }
}


foodForm.addEventListener("submit", async function(e) {
  e.preventDefault();

  const ownerId = getOwnerId();

  const data = {
    owner_id: ownerId,
    restaurant: localStorage.getItem("restaurantName") || "My Restaurant",
    name: document.getElementById("foodName").value,
    category: document.getElementById("foodCategory").value,
    ingredients: document.getElementById("foodIngredients").value.split(","),
    expiryDate: document.getElementById("foodExpiry").value,
    type: document.getElementById("foodType").value,
    quantity: document.getElementById("foodQty").value
  };

  try {

    const res = await fetch(API + "/api/food", {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(data)
    });

    const result = await res.json();

    alert(result.message || "Added");

    foodForm.reset();
    loadInventory();

  } catch (err) {
    alert("Could not add item");
  }
});


async function loadRequests() {

  const ownerId = getOwnerId();

  try {

    const res = await fetch(API + "/api/owner-requests/" + ownerId);
    const rows = await res.json();

    requestList.innerHTML = "";

    const pending = rows.filter(x => x.status === "pending");

    if (!pending.length) {
      requestList.innerHTML = "<p>No pending requests.</p>";
      return;
    }

    pending.forEach(req => {

      requestList.innerHTML += `
        <div class="list-item">
          <p><strong>Request ID:</strong> ${req.id}</p>
          <p><strong>Food ID:</strong> ${req.food_id}</p>
          <p><strong>Customer ID:</strong> ${req.customer_id}</p>
          <p><strong>Date:</strong> ${req.created_at}</p>

          <div class="row">
            <button class="btn green" onclick="approveRequest(${req.id})">Approve</button>
            <button class="btn red" onclick="declineRequest(${req.id})">Decline</button>
          </div>
        </div>
      `;
    });

  } catch (err) {
    requestList.innerHTML = "<p>Could not load requests.</p>";
  }
}


async function approveRequest(id) {

  try {

    const res = await fetch(API + "/api/approve-request/" + id, {
      method:"POST"
    });

    const data = await res.json();

    alert(data.message || "Approved");

    loadRequests();
    loadInventory();
    loadNotifications();

  } catch (err) {
    alert("Could not approve");
  }
}


async function declineRequest(id) {

  try {

    const res = await fetch(API + "/api/decline-request/" + id, {
      method:"POST"
    });

    const data = await res.json();

    alert(data.message || "Declined");

    loadRequests();
    loadNotifications();

  } catch (err) {
    alert("Could not decline");
  }
}


async function loadNotifications() {

  const ownerId = getOwnerId();

  try {

    const res = await fetch(API + "/api/notifications/" + ownerId);
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


window.logout = logout;
window.scrollToSection = scrollToSection;
window.approveRequest = approveRequest;
window.declineRequest = declineRequest;

checkAccess();

loadInventory();
loadRequests();
loadNotifications();

setInterval(loadRequests, 5000);
setInterval(loadNotifications, 5000);
setInterval(loadInventory, 5000);
