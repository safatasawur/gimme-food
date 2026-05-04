// =====================================================
// CUSTOMER REQUESTS PAGE
// =====================================================
const API_URL = window.API_BASE_URL || "http://localhost:5000";
const currentUserId = localStorage.getItem("userId");

// Security Check
if (localStorage.getItem("isLoggedIn") !== "true" || localStorage.getItem("userRole") !== "customer") {
  window.location.href = "index.html";
}

const historyList = document.getElementById("historyList");

async function renderRequestHistory() {
  try {
    // 1. Fetch live data from Python backend
    const resp = await fetch(`${API_URL}/api/customer-requests/${currentUserId}`);
    if (!resp.ok) throw new Error("Server error");
    
    const myRequests = await resp.json();
    historyList.innerHTML = "";

    // 2. If no requests, show empty message
    if (myRequests.length === 0) {
      historyList.innerHTML = `<p class="empty-text">You have not requested any food yet.</p>`;
      return;
    }

    // 3. Render each request
    myRequests.forEach(request => {
      const item = document.createElement("div");
      item.className = "history-item";

      // Determine the correct color badge based on the database status
      let badgeClass = "status-pending";
      let displayStatus = "Pending";

      if (request.status === "approve" || request.status === "approved") {
        badgeClass = "status-approve"; 
        displayStatus = "Approved!";
      } else if (request.status === "decline" || request.status === "declined") {
        badgeClass = "status-decline"; 
        displayStatus = "Declined";
      }

      item.innerHTML = `
        <div class="food-info">
          <p style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">${request.name}</p>
          <p><strong>Restaurant:</strong> ${request.restaurant}</p>
          <p><strong>Type:</strong> ${request.type.charAt(0).toUpperCase() + request.type.slice(1)}</p>
          <p><strong>Requested On:</strong> ${new Date(request.created_at).toLocaleString()}</p>
        </div>
        <div>
          <span class="status-badge ${badgeClass}">${displayStatus}</span>
        </div>
      `;

      historyList.appendChild(item);
    });
  } catch (err) {
    console.error("Error fetching requests:", err);
    historyList.innerHTML = `<p style="color: red;">Error loading requests. Please check your connection.</p>`;
  }
}

// Run immediately when page loads
renderRequestHistory();
