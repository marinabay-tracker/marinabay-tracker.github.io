// ===== Firebase Configuration =====
const firebaseConfig = {
  apiKey: "AIzaSyAAhhXE6qyLfo1MKjgzRGBGBoD1-ZzGzKA",
  authDomain: "marina-test-slips.firebaseapp.com",
  databaseURL: "https://marina-test-slips-default-rtdb.firebaseio.com",
  projectId: "marina-test-slips",
  storageBucket: "marina-test-slips.firebasestorage.app",
  messagingSenderId: "730064607370",
  appId: "1:730064607370:web:82f5aa915ee09afd033573",
};

// ===== Initialize Firebase =====
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== Format time using Day.js =====
function formatTimeAgo(timestamp) {
  return dayjs(timestamp).fromNow(); // Example: "5 minutes ago"
}

// ===== Render a single dock and its slips =====
function renderDock(dockName, slips) {
  const dockBox = document.createElement("div");
  dockBox.className = "dock-box";
  dockBox.innerHTML = `<div class="dock-title">${dockName} Dock</div>`;

  const slipsContainer = document.createElement("div");
  slipsContainer.className = "slips";

  Object.entries(slips).forEach(([slipId, slipData]) => {
    const slip = document.createElement("div");
    const isOccupied = slipData.status === "occupied";
    const lastTime = new Date(slipData.last_updated);
    const now = new Date();
    const hoursDiff = (now - lastTime) / (1000 * 60 * 60); // convert ms to hours

    let slipClass = "slip";
    if (isOccupied && hoursDiff > 2) {
      slipClass += " overdue";
    } else {
      slipClass += isOccupied ? " occupied" : " open";
    }
    slip.className = slipClass;
    slip.innerHTML = `
        <span class="slip-number">${slipId}</span>
        <span class="slip-last-updated">${formatTimeAgo(slipData.last_updated)}</span>
      `;

    // Toggle slip status on click
    slip.onclick = () => {
      const newStatus = slipData.status === "open" ? "occupied" : "open";
      db.ref(`docks/${dockName}/slips/${slipId}`).update({
        status: newStatus,
        last_updated: new Date().toISOString(),
      });
    };

    slipsContainer.appendChild(slip);
  });

  dockBox.appendChild(slipsContainer);
  document.querySelector(".docks").appendChild(dockBox);
}

// ===== Load all docks and render to DOM =====
function loadAllDocks() {
  db.ref("docks").on("value", (snapshot) => {
    // Remove all previous docks
    document.querySelectorAll(".dock-box").forEach((el) => el.remove());

    const docks = snapshot.val() || {};
    Object.entries(docks).forEach(([dockName, dockData]) => {
      renderDock(dockName, dockData.slips || {});
    });
  });
}

// ===== Init on page load =====
window.onload = loadAllDocks;
