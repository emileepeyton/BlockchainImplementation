function showTab(tabName) {
  document.querySelectorAll(".log-container").forEach(div => div.classList.remove("active"));
  document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
  document.getElementById(tabName).classList.add("active");
  document.getElementById(tabName + "-btn").classList.add("active");
  filterLogs();
}

function filterLogs() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const activeTab = document.querySelector(".log-container.active");
  if (!activeTab) return;
  const logs = activeTab.querySelectorAll(".log");
  logs.forEach(log => {
    const text = log.innerText.toLowerCase();
    log.style.display = text.includes(query) ? "block" : "none";
  });
}

function clearSearch() {
  document.getElementById("searchInput").value = "";
  filterLogs();
}
