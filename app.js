// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAhhXE6qyLfo1MKjgzRGBGBoD1-ZzGzKA",
  authDomain: "marina-test-slips.firebaseapp.com",
  databaseURL: "https://marina-test-slips-default-rtdb.firebaseio.com",
  projectId: "marina-test-slips",
  storageBucket: "marina-test-slips.firebasestorage.app",
  messagingSenderId: "730064607370",
  appId: "1:730064607370:web:82f5aa915ee09afd033573"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Define your dock names here (fixed)
const dockNames = ["L", "A", "B", "C", "G"];

// Convert ISO date to "smart" human-readable time
function formatSmartTime(isoString) {
  const time = new Date(isoString);
  const now = new Date();
  const diff = Math.floor((now - time) / 1000);
  if (diff < 60) return `${diff} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 172800) return `Yesterday`;
  return time.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Load and render all docks
function loadSlips() {
  db.ref("docks").on("value", (snapshot) => {
    const docks = snapshot.val() || {};
    const container = document.getElementById("dock-container");
    container.innerHTML = ""; // Clear previous content

    dockNames.forEach((dockName) => {
      const dockData = docks[dockName] || {};
      const slips = dockData.slips || {};

      const dockDiv = document.createElement("div");
      dockDiv.className = "dock";
      dockDiv.innerHTML = `<h2>${dockName} Dock</h2>`;

      const slipsDiv = document.createElement("div");
      slipsDiv.className = "slips";

      Object.entries(slips).forEach(([slipId, slipData]) => {
        const slipDiv = document.createElement("div");
        slipDiv.className = `slip ${slipData.status}`;
        const time = formatSmartTime(slipData.last_updated);
        slipDiv.innerHTML = `
          <div><strong>${slipId}</strong></div>
          <div>${slipData.status === "open" ? "✅ Open" : "❌ Occupied"}</div>
          <div style="font-size: 12px;">${time}</div>
        `;
        // Toggle open/occupied on click
        slipDiv.onclick = () => toggleSlip(dockName, slipId, slipData.status);
        slipsDiv.appendChild(slipDiv);
      });

      dockDiv.appendChild(slipsDiv);
      container.appendChild(dockDiv);
    });
  });
}

// Toggle slip status and update Firebase
function toggleSlip(dock, slip, currentStatus) {
  const newStatus = currentStatus === "open" ? "occupied" : "open";
  db.ref(`docks/${dock}/slips/${slip}`).update({
    status: newStatus,
    last_updated: new Date().toISOString()
  });
}

// Start the app
window.onload = loadSlips;