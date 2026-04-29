if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "index.html";
}

if (localStorage.getItem("userRole") !== "customer") {
  window.location.href = "index.html";
}

const historyList = document.getElementById("historyList");

function getRequests() {
  return JSON.parse(localStorage.getItem("customerRequests")) || [];
}

async function submitFoodRequest(data) {
  const resp = await fetch(window.API_BASE_URL + '/api/request-food', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    throw new Error('Failed to submit food request');
  }
  return resp.json();
}

function renderRequestHistory() {
  const requests = getRequests();
  const userEmail = localStorage.getItem("userEmail");

  const myRequests = requests.filter(
    request => request.userEmail === userEmail
  );

  historyList.innerHTML = "";

  if (myRequests.length === 0) {
    historyList.innerHTML = `<p class="empty-text">You have not requested any food yet.</p>`;
    return;
  }

  myRequests.forEach(request => {
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

renderRequestHistory();