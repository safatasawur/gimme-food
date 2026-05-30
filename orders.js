// =====================================================
// ORDERS DASHBOARD (OWNER)
// =====================================================
const API_URL = window.API_BASE_URL || "http://localhost:5000";
const currentUserId = localStorage.getItem("userId") || 1;

// Basic Security Check
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "index.html";
}

const requestsGrid = document.getElementById("requestsGrid");
const notifCount = document.getElementById("notifCount");
const notificationBell = document.getElementById("notificationBell");
function translateStatus(status) {
  if (!status) return "";

  const key = status.toString().toLowerCase();

  if (key === "approve" || key === "approved") return t("approvedStatus");
  if (key === "decline" || key === "declined") return t("declinedStatus");
  if (key === "pending") return t("pendingStatus");

  return status;
}
window.logout = function() {
  localStorage.clear();
  window.location.href = "index.html";
};
function translateNotificationMessage(message) {
  if (!message) return "";

  const key = message.toLowerCase();

  if (key.includes("new food request")) {
    return t("newFoodRequest");
  }

  if (key.includes("approved")) {
    return t("requestApprovedNotification");
  }

  if (key.includes("declined")) {
    return t("requestDeclinedNotification");
  }

  return message;
}

// =====================================================
// 1. FETCH AND RENDER ORDERS
// =====================================================
async function loadOwnerRequests() {
  if (!requestsGrid) return;
  try {
    const resp = await fetch(`${API_URL}/api/owner-requests/${currentUserId}`);
    if (!resp.ok) throw new Error("Failed to load requests");

    const requests = await resp.json();
    requestsGrid.innerHTML = "";

    if (requests.length === 0) {
      requestsGrid.innerHTML = `<p style="color: #666; padding: 20px; background: white; border-radius: 12px; width: 100%;">${t("noPendingOrders")}</p>`;
      return;
    }

    requests.forEach(req => {
      const card = document.createElement("div");
      card.className = "food-card";
      
      // Dynamic border color based on status
      let borderColor = "#f39c12"; // Pending (Orange)
      if (req.status === 'approve' || req.status === 'approved') borderColor = "#27ae60"; // Green
      if (req.status === 'decline' || req.status === 'declined') borderColor = "#e74c3c"; // Red
      card.style.borderLeft = `4px solid ${borderColor}`;
let actionButtons = "";

if (req.status === "pending") {
  actionButtons = `
    <div style="display: flex; gap: 10px; margin-top: 15px;">
      <button class="btn-approve" onclick="updateRequestStatus(${req.id || req.req_id}, 'approve')">
  ${t("approve")}
</button>
<button class="btn-decline" onclick="updateRequestStatus(${req.id || req.req_id}, 'decline')">
  ${t("decline")}
</button>
    </div>
  `;
} else {
  const isApproved = req.status === "approve" || req.status === "approved";

  const displayStatus = isApproved
    ? t("approvedStatus")
    : t("declinedStatus");

  const statusClass = isApproved
    ? "status-approved"
    : "status-declined";

  actionButtons = `
    <div class="status-display ${statusClass}">
      ${t("statusLabel")} ${displayStatus}
    </div>
  `;
}

      card.innerHTML = `
  <h3>${t("orderLabel")} #${req.id || req.req_id}</h3>
  <p><strong>${t("foodIdLabel")}</strong> ${req.food_id}</p>
  <p><strong>${t("customerIdLabel")}</strong> ${req.customer_id}</p>
  <p><strong>${t("requestedOnLabel")}</strong> ${new Date(req.created_at).toLocaleString()}</p>
  ${actionButtons}
`;
      requestsGrid.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading requests:", err);
    requestsGrid.innerHTML = `<p style="color: red;">Error loading orders. Please check your connection.</p>`;
  }
}

// =====================================================
// 2. UPDATE ORDER STATUS (WIRED TO YOUR EXACT PYTHON ROUTES)
// =====================================================
window.updateRequestStatus = async function(requestId, newStatus) {
  try {
    // Check if we are approving or declining to hit the right Python route
    const endpoint = newStatus === 'approve' ? `/api/approve-request/${requestId}` : `/api/decline-request/${requestId}`;
    
    const resp = await fetch(`${API_URL}${endpoint}`, {
      method: "POST"
    });

    // if (!resp.ok) throw new Error("Failed to update status");
    // loadOwnerRequests(); // Refresh the board instantly to show the green or red badge
  if (!resp.ok) throw new Error("Failed to update status");

if (newStatus === "approve") {
  alert(t("requestApprovedSuccess"));
} else {
  alert(t("requestDeclinedSuccess"));
}

loadOwnerRequests();
  } catch (err) {
    console.error("Error updating status:", err);
    alert(t("updateOrderError"));
  }
};

// =====================================================
// 3. SLEEK NOTIFICATION DROPDOWN MENU
// =====================================================
const notifStyle = document.createElement('style');
notifStyle.innerHTML = `
  .notif-dropdown {
    position: absolute;
    top: 50px;
    right: 0;
    width: 320px;
    background: #13131a;
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.45);
    border: 1px solid #2a2a3a;
    z-index: 9999;
    display: none;
    flex-direction: column;
    overflow: hidden;
  }

  .notif-dropdown.show {
    display: flex;
  }

  .notif-header {
    padding: 15px 20px;
    border-bottom: 1px solid #2a2a3a;
    font-weight: 800;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #f0f0f5;
    background: #13131a;
  }

  .notif-body {
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
    background: #13131a;
  }

  .notif-item {
    padding: 12px;
    border-radius: 10px;
    margin-bottom: 8px;
    background: rgba(34, 197, 94, 0.10);
    border-left: 4px solid #22c55e;
  }

  .notif-item:last-child {
    margin-bottom: 0;
  }

  .notif-item p {
    margin: 0;
    color: #f0f0f5 !important;
    font-weight: 700;
    font-size: 14px;
  }

  .notif-item small {
    color: #8888a0 !important;
    font-size: 11px;
  }

  .notif-footer {
    padding: 10px;
    border-top: 1px solid #2a2a3a;
    background: #13131a;
  }

  .clear-btn {
    width: 100%;
    padding: 10px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 800;
  }

  .clear-btn:hover {
    box-shadow: 0 8px 24px rgba(34,197,94,0.25);
    transform: translateY(-1px);
  }
`;
document.head.appendChild(notifStyle);

if (notificationBell && notificationBell.parentElement) {
notificationBell.parentElement.insertAdjacentHTML('beforeend', `
  <div class="notif-dropdown" id="notifDropdown">
    <div class="notif-header">
      <span>${t("alerts")}</span>
      <button id="closeNotifDropdown" style="background:none;border:none;font-size:20px;cursor:pointer;color:#8888a0;">&times;</button>
    </div>
    <div class="notif-body" id="notifList">
      <p style="padding: 10px; color: #8888a0; text-align: center;">${t("loading")}</p>
    </div>
    <div class="notif-footer">
      <button class="clear-btn" id="markReadBtn">${t("clearAllAlerts")}</button>
    </div>
  </div>
`);
}

const notifDropdown = document.getElementById("notifDropdown");
const closeNotifDropdown = document.getElementById("closeNotifDropdown");
const notifList = document.getElementById("notifList");
const markReadBtn = document.getElementById("markReadBtn");

if (notificationBell && notifDropdown) {
  notificationBell.addEventListener("click", async (e) => {
    e.preventDefault();
    notifDropdown.classList.toggle("show");

    if (!notifDropdown.classList.contains("show")) return;

notifList.innerHTML = `<p style='padding: 10px; color: #8888a0; text-align: center;'>${t("loading")}</p>`;
    try {
      const resp = await fetch(`${API_URL}/api/notifications/${currentUserId}`);
      const notifications = await resp.json();
      const unread = notifications.filter(n => n.is_read === 0 || n.is_read === false);

      if (unread.length === 0) {
notifList.innerHTML = `<p style='padding: 10px; color:#8888a0; text-align:center;'>${t("noNewAlerts")}</p>`;      } else {
        notifList.innerHTML = "";

        unread.forEach(n => {
          const item = document.createElement("div");
          item.className = "notif-item";
          item.innerHTML = `
            <p style="margin:0; color:#333; font-weight:bold; font-size: 14px;">${translateNotificationMessage(n.message)}</p>
            <small style="color:#888; font-size: 11px;">${new Date(n.created_at).toLocaleString()}</small>
          `;
          notifList.appendChild(item);
        });
      }
    } catch (err) {
      notifList.innerHTML = `<p style='padding: 10px; color:#e74c3c; text-align:center;'>${t("errorLoadingAlerts")}</p>`;
    }
  });
}

   

  if (closeNotifDropdown) closeNotifDropdown.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); notifDropdown.classList.remove("show"); });
  window.addEventListener("click", (e) => { if (notifDropdown.classList.contains("show") && !notificationBell.contains(e.target) && !notifDropdown.contains(e.target)) notifDropdown.classList.remove("show"); });
  if (markReadBtn) markReadBtn.addEventListener("click", async () => {
    try {
      await fetch(`${API_URL}/api/mark-notifications-read/${currentUserId}`, { method: "POST" });
      if(notifCount) notifCount.style.display = "none";
      notifDropdown.classList.remove("show");
    } catch (err) {}
  });


async function checkNotifications() {
  if (!notifCount) return;
  try {
    const resp = await fetch(`${API_URL}/api/notifications/${currentUserId}`);
    if (!resp.ok) return;
    const notifications = await resp.json();
    const unread = notifications.filter(n => n.is_read === 0 || n.is_read === false);
    if (unread.length > 0) {
      notifCount.style.display = "inline";
      notifCount.innerText = `(${unread.length})`;
    } else {
      notifCount.style.display = "none";
    }
  } catch (err) {}
}

// =====================================================
// INITIALIZE
// =====================================================
loadOwnerRequests();
checkNotifications();
setInterval(checkNotifications, 10000);
setInterval(loadOwnerRequests, 10000);
