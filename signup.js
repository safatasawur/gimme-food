let currentRole = "";

function selectRole(role) {
  currentRole = role;

  const roleBox = document.getElementById("roleSelection");
  roleBox.style.animation = "fadeOut 0.4s forwards";

  setTimeout(() => {
    roleBox.classList.add("hidden");
    document.getElementById("authSection").classList.remove("hidden");
    document.getElementById("roleTitle").innerText =
      role.charAt(0).toUpperCase() + role.slice(1) + " Portal";

    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("signupForm").classList.add("hidden");
    document.getElementById("ownerFields").classList.add("hidden")
  }, 400);
}

function goBack() {
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("roleSelection").classList.remove("hidden");
  document.getElementById("ownerFields").classList.add("hidden");
}

function toggleForm(form) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const ownerFields = document.getElementById("ownerFields");

  loginForm.classList.toggle("hidden", form === "signup");
  signupForm.classList.toggle("hidden", form !== "signup");

  if (form === "signup" && currentRole === "owner") {
    ownerFields.classList.remove("hidden");
  } else {
    ownerFields.classList.add("hidden");
  }
}

function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const savedEmail = localStorage.getItem("savedEmail");
  const savedPassword = localStorage.getItem("savedPassword");
  const savedRole = localStorage.getItem("savedRole");

  if (!email || !password) {
    showMessage("Please fill all fields ❗");
    return;
  }

  if (email === savedEmail && password === savedPassword && currentRole === savedRole) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", currentRole);
    localStorage.setItem("userEmail", email);

    showMessage(currentRole + " logged in successfully ✔");

    if (currentRole === "owner") {
      window.location.href = "owner.html";
    } else if (currentRole === "customer") {
      window.location.href = "customer.html";
    }
  } else {
    showMessage("Invalid email, password, or role ❗");
  }
}

function signup() {
  const name = document.getElementById("signupName").value.trim();
  const address = document.getElementById("signupAddress").value.trim();
  const city = document.getElementById("cityInput").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (currentRole === "owner") {
    const restaurantName = document.getElementById("restaurantName").value.trim();
    const restaurantAddress = document.getElementById("restaurantAddress").value.trim();
    const foodType = document.getElementById("foodType").value.trim();

    if (!restaurantName || !restaurantAddress || !foodType) {
      showMessage("Please fill all owner fields ❗");
      return;
    }

    localStorage.setItem("restaurantName", restaurantName);
    localStorage.setItem("restaurantAddress", restaurantAddress);
    localStorage.setItem("restaurantFoodType", foodType);
  }

  if (!name || !address || !city || !email || !password) {
    showMessage("Please fill all fields ❗");
    return;
  }

  localStorage.setItem("savedName", name);
  localStorage.setItem("savedAddress", address);
  localStorage.setItem("savedCity", city);
  localStorage.setItem("savedEmail", email);
  localStorage.setItem("savedPassword", password);
  localStorage.setItem("savedRole", currentRole);

  showMessage(currentRole + " signed up successfully ✔");
  toggleForm("login");
}

function showMessage(msg) {
  alert(msg);
}