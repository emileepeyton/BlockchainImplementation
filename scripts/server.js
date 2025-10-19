// server.js
const express = require("express");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const logs = await fetchLogsFromBlockchain();
    const grouped = groupLogs(logs);
    const html = fs.readFileSync(path.join(__dirname, "views/index.html"), "utf8");
    const renderedHtml = injectLogsIntoTemplate(html, grouped);
    res.send(renderedHtml);
  } catch (error) {
    res.status(500).send(`<pre>Error:\n${error.message}\n${error.stack}</pre>`);
  }
});

app.get("/refresh", (req, res) => res.redirect("/"));

async function fetchLogsFromBlockchain() {
  const contractAddress = fs.readFileSync("deployedAddress.txt", "utf8").trim();
  const [signer] = await hre.ethers.getSigners();
  const logChain = await hre.ethers.getContractAt("LogChain", contractAddress, signer);

  const logCount = await logChain.getLogCount();
  const logs = [];

  for (let i = 0; i < logCount; i++) {
    const [generated, captured, user, action, sha256Hash, md5Hash] = await logChain.getLog(i);
    logs.push({
      id: i,
      generated: new Date(Number(generated) * 1000),
      captured: new Date(Number(captured) * 1000),
      user,
      action,
      sha256Hash,
      md5Hash
    });
  }

  logs.sort((a, b) => b.generated - a.generated);
  return logs;
}

function extractRecordId(actionString) {
  const match = String(actionString).match(/\[RecordID:(\d+)\]/);
  return match ? match[1] : null;
}

function extractEventId(actionString) {
  const match = String(actionString).match(/\[EventID:([^\]]+)\]/);
  return match ? match[1] : null;
}

function groupLogs(logs) {
  const grouped = { Application: [], System: [], Security: [] };
  logs.forEach(log => {
    const [type, source] = log.user.split(":", 2);
    if (grouped[type]) {
      const sourceOnly = source || log.user;
      const recordId = extractRecordId(log.action);
      const eventId = extractEventId(log.action);
      grouped[type].push({ ...log, user: sourceOnly, recordId, eventId });
    }
  });
  return grouped;
}

function injectLogsIntoTemplate(html, groupedLogs) {
  let logHtml = "";
  for (const [type, logs] of Object.entries(groupedLogs)) {
    logHtml += `<div id="${type}" class="log-container ${type === "Application" ? "active" : ""}">`;
    if (logs.length === 0) {
      logHtml += `<p>No ${type} logs available.</p>`;
    } else {
      logs.forEach(log => {
        logHtml += `
          <div class="log">
            <h3>📄 Log #${log.id}</h3>
            <p><strong>Time Generated:</strong> ${log.generated.toLocaleString()}</p>
            <p><strong>Time Captured:</strong> ${log.captured.toLocaleString()}</p>
            <p><strong>Source:</strong> ${log.user}</p>
            <p><strong>Event ID:</strong> ${log.eventId ?? "n/a"}</p>
            <p><strong>Record ID:</strong> ${log.recordId ?? "n/a"}</p>
            <p><strong>Action / Message:</strong> ${escapeHtml(truncate(log.action, 1000))}</p>
            <p><strong>SHA-256:</strong> <code>${log.sha256Hash}</code></p>
            <p><strong>MD5:</strong> <code>${log.md5Hash}</code></p>
          </div>`;
      });
    }
    logHtml += `</div>`;
  }

  return html.replace("{{LOG_SECTIONS}}", logHtml);
}

function truncate(str, n) {
  if (!str) return "";
  str = String(str);
  return str.length > n ? str.slice(0, n) + "… (truncated)" : str;
}

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.listen(port, () => {
  console.log(`Forensic Log Viewer running at http://localhost:${port}`);
});
