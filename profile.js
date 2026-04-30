// protect page
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "index.html";
}

// get data from currentUser object
const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
const role = localStorage.getItem("userRole") || "customer";

// show basic info
document.getElementById("name").textContent = currentUser.username || "-";
document.getElementById("email").textContent = currentUser.email || "-";
document.getElementById("address").textContent = currentUser.restaurant_address || currentUser.user_city || "-";
document.getElementById("role").textContent = role.charAt(0).toUpperCase() + role.slice(1);

// owner extra info
if (role === "owner") {
  document.getElementById("ownerSection").style.display = "block";

  document.getElementById("restaurantName").textContent =
    currentUser.restaurant_name || "-";

  document.getElementById("restaurantAddress").textContent =
    currentUser.restaurant_address || "-";

  document.getElementById("foodType").textContent =
    currentUser.restaurant_food_type || "-";
}

// go back
window.goBack = function() {
  const role = localStorage.getItem("userRole");

  if (role === "owner") {
    window.location.href = "owner.html";
  } else {
    window.location.href = "customer.html";
  }
}

window.logout = function() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("currentUser");
  window.location.href = "index.html"; 
}