// protect page
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "index.html";
}

// get data
const name = localStorage.getItem("savedName");
const email = localStorage.getItem("savedEmail");
const address = localStorage.getItem("savedAddress");
const role = localStorage.getItem("savedRole");

// show basic info
document.getElementById("name").textContent = name || "-";
document.getElementById("email").textContent = email || "-";
document.getElementById("address").textContent = address || "-";
document.getElementById("role").textContent = role || "-";

// owner extra info
if (role === "owner") {
  document.getElementById("ownerSection").style.display = "block";

  document.getElementById("restaurantName").textContent =
    localStorage.getItem("restaurantName") || "-";

  document.getElementById("restaurantAddress").textContent =
    localStorage.getItem("restaurantAddress") || "-";

  document.getElementById("foodType").textContent =
    localStorage.getItem("restaurantFoodType") || "-";
}

// go back
function goBack() {
  const role = localStorage.getItem("userRole");

  if (role === "owner") {
    window.location.href = "owner.html";
  } else {
    window.location.href = "customer.html";
  }
}function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");

  window.location.href = "index.html"; 
}