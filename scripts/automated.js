// automated.js
const { exec } = require("child_process");
const fs = require("fs");
const crypto = require("crypto");
const hre = require("hardhat");

const LAST_LOG_FILE = "last-log.json";
const LOG_TYPES = ["Application", "System", "Security"];

function getLastTimestamps() {
  try {
    const data = fs.readFileSync(LAST_LOG_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}
function saveLastTimestamps(timestamps) {
  fs.writeFileSync(LAST_LOG_FILE, JSON.stringify(timestamps ?? {}, null, 2), "utf8");
}

// Parse blocks from: Get-WinEvent | Format-List TimeCreated, LogName, ProviderName, Id, RecordId, Message
function parseLogBlock(block) {
  const timeMatch     = block.match(/TimeCreated\s*:\s*(.+)/);
  const logNameMatch  = block.match(/LogName\s*:\s*(.+)/);
  const providerMatch = block.match(/ProviderName\s*:\s*(.+)/);
  const idMatch       = block.match(/Id\s*:\s*(.+)/);
  const recIdMatch    = block.match(/RecordId\s*:\s*(.+)/);
  const msgMatch      = block.match(/Message\s*:\s*([\s\S]+?)(?=\r?\n\S|$)/);

  const timeStr   = timeMatch ? timeMatch[1].trim() : null;
  const timestamp = timeStr ? new Date(timeStr).getTime() : null;

  // Normalize message to a single line for stable hashing/display
  const rawMessage = msgMatch ? msgMatch[1] : "";
  const cleanMessage = rawMessage
    .replace(/\r\n/g, "\n")      // CRLF -> LF
    .replace(/\t/g, " ")         // tabs -> spaces
    .replace(/[ \t]+\n/g, "\n")  // strip trailing spaces at EOL
    .replace(/\n[ \t]+/g, "\n")  // strip indentation after newlines
    .replace(/\s+/g, " ")        // collapse all whitespace runs
    .trim();

  return {
    timestamp,
    timeCreatedIso: timeStr ? new Date(timeStr).toISOString() : null,
    logName:   logNameMatch ? logNameMatch[1].trim() : "Unknown",
    provider:  providerMatch ? providerMatch[1].trim() : "Unknown Source",
    eventId:   idMatch ? idMatch[1].trim() : "n/a",
    recordId:  recIdMatch ? recIdMatch[1].trim() : "n/a",
    message:   cleanMessage || "No message",
  };
}

function computeHashes(generatedTime, messageForHash) {
  const input = `${generatedTime}|${messageForHash}`;
  console.log("Canonical string:", JSON.stringify(input));
  const sha256 = crypto.createHash("sha256").update(input, "utf8").digest("hex");
  const md5    = crypto.createHash("md5").update(input, "utf8").digest("hex");
  return { sha256, md5, canonical: input };
}

async function processLogType(logType, logChain, lastTimestamps) {
  return new Promise((resolve) => {
    const cmd =
      `powershell "Get-WinEvent -LogName ${logType} -MaxEvents 50 | ` +
      `Format-List TimeCreated, LogName, ProviderName, Id, RecordId, Message"`;

    exec(cmd, async (err, stdout) => {
      if (err) {
        console.error(`PowerShell error for ${logType}:`, err.message);
        return resolve();
      }

      const blocks = stdout.split(/\r?\n\r?\n/).map(b => b.trim()).filter(Boolean);
      const parsed = blocks.map(parseLogBlock).filter(l => l.timestamp && l.provider);

      const lastTs  = lastTimestamps[logType] || 0;
      const newLogs = lastTs === 0 ? parsed.slice(0, 3) : parsed.filter(l => l.timestamp > lastTs);

      let maxTs = lastTs;
      for (const log of newLogs.reverse()) {
        try {
          const generated = Math.floor(log.timestamp / 1000);
          const captured  = Math.floor(Date.now() / 1000);

          const user   = `${log.logName}:${log.provider}`;
          const action = `[EventID:${log.eventId}] [RecordID:${log.recordId}] ${log.message}`;

          console.log("pieces:", {
            generated,
            user,
            action
          });

          const { sha256, md5, canonical } = computeHashes(generated, action);

          const tx = await logChain.addLog(
            generated,
            captured,
            user,
            action,
            sha256,
            md5
          );
          await tx.wait();

          console.log(`Logged [${log.logName}]`);
          console.log(`  Source     : ${log.provider}`);
          console.log(`  EventID    : ${log.eventId}`);
          console.log(`  RecordID   : ${log.recordId}`);
          console.log(`  Generated  : ${new Date(generated * 1000).toISOString()}`);
          console.log(`  Captured   : ${new Date(captured * 1000).toISOString()}`);
          console.log(`  SHA-256    : ${sha256}`);
          console.log(`  MD5        : ${md5}`);
          console.log(`  CANONICAL  : ${canonical}`);

          if (log.timestamp > maxTs) maxTs = log.timestamp;
        } catch (e) {
          console.error(`Failed to log [${logType}]:`, e.message);
        }
      }

      lastTimestamps[logType] = maxTs;
      resolve();
    });
  });
}

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const contractAddress = fs.readFileSync("deployedAddress.txt", "utf8").trim();
  const logChain = await hre.ethers.getContractAt("LogChain", contractAddress, signer);

  const lastTimestamps = getLastTimestamps();

  for (const logType of LOG_TYPES) {
    await processLogType(logType, logChain, lastTimestamps);
  }

  saveLastTimestamps(lastTimestamps);
}

main().catch(err => {
  console.error("Fatal error in automated.js:", err);
  process.exit(1);
});
