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
  if (!email || !password) {
    showMessage("Please fill all fields ❗");
    return;
  }

  (async function () {
    try {
      const resp = await fetch(window.API_BASE_URL + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });

      if (resp.ok) {
        const data = await resp.json();
        const role = data.role || currentRole || 'customer';
        const user = data.user || {};

        // === THE FIX: GRAB THE ID FROM THE DATABASE ===
        const actualId = user.user_id || user.seller_id; 

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", role);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userId", actualId); // SAVES THE ID
        localStorage.setItem("currentUser", JSON.stringify(user));
        
        localStorage.setItem("savedName", user.username || "");
        localStorage.setItem("savedEmail", user.email || email);
        localStorage.setItem("savedAddress", user.restaurant_address || user.user_city || "");
        localStorage.setItem("savedRole", role);
        
        if (role === "owner") {
          localStorage.setItem("restaurantName", user.restaurant_name || "");
          localStorage.setItem("restaurantAddress", user.restaurant_address || "");
          window.location.href = "owner.html";
        } else {
          window.location.href = "customer.html";
        }
        return;
      } else {
        showMessage("Server Login Failed: Invalid Credentials");
        return; 
      }
    } catch (err) {
      console.error('Login fetch failed:', err);
      showMessage("Server error. Make sure your Python backend is running.");
    }
  })();
}

async function signup() {
  const name = document.getElementById("signupName").value.trim();
  const address = document.getElementById("signupAddress").value.trim();
  const city = document.getElementById("cityInput").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  let restaurantName = "";
  let restaurantAddress = "";
  let foodType = "";

  if (currentRole === "owner") {
    restaurantName = document.getElementById("restaurantName").value.trim();
    restaurantAddress = document.getElementById("restaurantAddress").value.trim();
    foodType = document.getElementById("foodType").value.trim();

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
  const users = JSON.parse(localStorage.getItem("users")) || [];

  const existingUser = users.find(user => user.email === email);

  if (existingUser) {
    showMessage("This email is already registered ❗");
    return;
  }

  const newUser = {
    name: name,
    address: address,
    city: city,
    email: email,
    password: password,
    role: currentRole,
    restaurantName: currentRole === "owner" ? restaurantName : "",
    restaurantAddress: currentRole === "owner" ? restaurantAddress : "",
    restaurantFoodType: currentRole === "owner" ? foodType : ""
  };

  // Try to register on server first; if it fails, fall back to localStorage
  try {
    const payload = { 
      username: name, 
      email: email, 
      password: password,
      city: city,
      role: currentRole,
      restaurantName: restaurantName,
      restaurantAddress: restaurantAddress
    };
    const resp = await fetch(window.API_BASE_URL + '/api/signup-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (resp.ok) {
      // Server accepted the signup; still keep a local copy for offline flows
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      showMessage(currentRole + " signed up successfully ✔ (online)");
      toggleForm("login");
      return;
    } else {
      const errorData = await resp.json().catch(() => ({}));
      console.warn('Server signup failed', errorData.error || resp.status);
      showMessage("Server Signup Failed: " + (errorData.error || "Email already in use or missing info"));
      return; // Don't fall back to offline if the server rejected it
    }
  } catch (err) {
    // Network/server unreachable - fallback
    console.warn('Signup network error, falling back to localStorage', err);
  }

  // Fallback local save
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
  showMessage(currentRole + " signed up successfully ✔ (offline)");
  toggleForm("login");
}

function showMessage(msg) {
  alert(msg);
}
