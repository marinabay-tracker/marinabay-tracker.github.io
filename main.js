// main.js
const firebaseConfig = {
  apiKey: "AIzaSyAAhhXE6qyLfo1MKjgzRGBGBoD1-ZzGzKA",
  authDomain: "marina-test-slips.firebaseapp.com",
  databaseURL: "https://marina-test-slips-default-rtdb.firebaseio.com",
  projectId: "marina-test-slips",
  storageBucket: "marina-test-slips.appspot.com",
  messagingSenderId: "730064607370",
  appId: "1:730064607370:web:82f5aa915ee09afd033573",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let selectedDock = "all";
let selectedStatus = "all";

const formatTimeAgo = (timestamp) => dayjs(timestamp).fromNow();

const renderDock = (dockName, slips) => {
  if (selectedDock !== "all" && selectedDock !== dockName) return;

  const dockBox = document.createElement("div");
  dockBox.className = "dock-box";
  dockBox.innerHTML = `<div class="dock-title">${dockName} Dock</div>`;

  const slipsContainer = document.createElement("div");
  slipsContainer.className = "slips";

  Object.entries(slips).forEach(([slipId, { status, last_updated }]) => {
    const lastTime = new Date(last_updated);
    const isOccupied = status === "occupied";
    const hoursDiff = (Date.now() - lastTime) / 36e5;

    let slipClass = "slip";
    if (isOccupied && hoursDiff > 2) slipClass += " overdue";
    else slipClass += isOccupied ? " occupied" : " open";

    if (selectedStatus !== "all" && !slipClass.includes(selectedStatus)) return;

    const slip = document.createElement("div");
    slip.className = slipClass;
    slip.innerHTML = `
        <span class="slip-number">${slipId}</span>
        <span class="slip-last-updated">${formatTimeAgo(last_updated)}</span>
      `;
    slip.onclick = () => {
      const newStatus = status === "open" ? "occupied" : "open";
      db.ref(`docks/${dockName}/slips/${slipId}`).update({
        status: newStatus,
        last_updated: new Date().toISOString(),
      });
    };
    slipsContainer.appendChild(slip);
  });

  if (slipsContainer.children.length > 0) {
    dockBox.appendChild(slipsContainer);
    document.querySelector(".docks").appendChild(dockBox);
  }
};

const updateDockFilterOptions = (docks) => {
  const filterMenu = document.getElementById("filterMenu");
  const dockLabel = [...filterMenu.children].find((el) => el.classList?.contains("dropdown-group-label") && el.textContent === "Docks");

  const startIndex = [...filterMenu.children].indexOf(dockLabel) + 1;
  let endIndex = startIndex;

  while (filterMenu.children[endIndex]?.dataset?.type === "dock") endIndex++;

  for (let i = endIndex - 1; i >= startIndex; i--) {
    if (filterMenu.children[i].dataset?.value !== "all") filterMenu.children[i].remove();
  }

  const insertAfter = filterMenu.querySelector("div[data-type='dock'][data-value='all']");
  let lastInserted = insertAfter;

  Object.keys(docks)
    .sort((a, b) => {
      if (a.length === b.length) return a.localeCompare(b);
      return a.length - b.length || a.localeCompare(b);
    })
    .forEach((dockName) => {
      const dockOption = document.createElement("div");
      dockOption.dataset.type = "dock";
      dockOption.dataset.value = dockName;
      dockOption.textContent = `${dockName} Dock`;
      lastInserted.insertAdjacentElement("afterend", dockOption);
      lastInserted = dockOption;
    });
};

const loadAllDocks = () => {
  db.ref("docks").on("value", (snapshot) => {
    document.querySelectorAll(".dock-box").forEach((el) => el.remove());
    const docks = snapshot.val() || {};
    updateDockFilterOptions(docks);
    Object.entries(docks).forEach(([dockName, dockData]) => {
      renderDock(dockName, dockData.slips || {});
    });
  });
};

const filterDropdown = document.getElementById("filterDropdown");
const filterToggle = document.getElementById("filterToggle");
const filterMenu = document.getElementById("filterMenu");

filterToggle.addEventListener("click", () => {
  filterDropdown.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (!filterDropdown.contains(e.target)) {
    filterDropdown.classList.remove("open");
  }
});

filterMenu.addEventListener("click", (e) => {
  const { type, value } = e.target.dataset;
  if (!type) return;

  if (type === "dock") selectedDock = value;
  else if (type === "status") selectedStatus = value;

  const dockLabel = selectedDock === "all" ? "All Docks" : `${selectedDock} Dock`;
  const statusLabel = selectedStatus === "all" ? "" : ` | ${capitalize(selectedStatus)}`;
  filterToggle.childNodes[0].nodeValue = `Filter: ${dockLabel}${statusLabel}`;

  filterDropdown.classList.remove("open");
  loadAllDocks();
});

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

window.onload = loadAllDocks;
