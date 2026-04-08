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
  }, 400);
  if (role === "owner") {
    document.getElementById("ownerFields").classList.remove("hidden");
  } else {
    document.getElementById("ownerFields").classList.add("hidden");
  }
}
function goBack() {
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("roleSelection").classList.remove("hidden");

  // reset owner fields
  document.getElementById("ownerFields").classList.add("hidden");
}

function toggleForm(form) {
  document
    .getElementById("loginForm")
    .classList.toggle("hidden", form === "signup");
  document
    .getElementById("signupForm")
    .classList.toggle("hidden", form !== "signup");
}

function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (email && password) {
    showMessage(currentRole + " logged in successfully ✔");
  } else {
    showMessage("Please fill all fields ❗");
  }
}

function signup() {
  const address = document.getElementById("signupAddress").value;
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  if (name && email && password && address) {
    showMessage(currentRole + " signed up successfully ✔");
  } else {
    showMessage("Please fill all fields ❗");
  }
}

function showMessage(msg) {
  alert(msg);
}
