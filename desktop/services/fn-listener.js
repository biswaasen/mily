const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

let child = null;
let onDown = null;
let onUp = null;
let onInterrupted = null;
let restartTimer = null;
let stopped = false;

function resolveBinary() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "fn-listener");
  }
  return path.join(__dirname, "..", "native", "fn-listener");
}

function startFnListener({ down, up, interrupted } = {}) {
  stopped = false;
  onDown = down || null;
  onUp = up || null;
  onInterrupted = interrupted || null;

  stopFnListener(false);

  const bin = resolveBinary();
  if (!fs.existsSync(bin)) {
    console.error("[Fn] Binary missing:", bin, "— run npm run build:fn");
    return false;
  }

  try {
    child = spawn(bin, [], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (err) {
    console.error("[Fn] Failed to spawn:", err.message);
    return false;
  }

  let buffer = "";
  child.stdout.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const msg = line.trim();
      if (msg === "READY") console.log("[Fn] Listener ready");
      else if (msg === "FN_DOWN") onDown && onDown();
      else if (msg === "FN_UP") onUp && onUp();
      else if (msg === "FN_INTERRUPTED") onInterrupted && onInterrupted();
    }
  });

  child.stderr.on("data", (chunk) => {
    console.error("[Fn]", chunk.toString("utf8").trim());
  });

  child.on("exit", (code, signal) => {
    child = null;
    if (!stopped) {
      console.warn(`[Fn] Exited (code=${code}, signal=${signal}) — restarting`);
      clearTimeout(restartTimer);
      restartTimer = setTimeout(() => {
        if (!stopped) startFnListener({ down: onDown, up: onUp, interrupted: onInterrupted });
      }, 1500);
    }
  });

  return true;
}

function stopFnListener(markStopped = true) {
  if (markStopped) stopped = true;
  clearTimeout(restartTimer);
  restartTimer = null;
  if (child && !child.killed) {
    try { child.kill("SIGTERM"); } catch (_) {}
  }
  child = null;
}

module.exports = { startFnListener, stopFnListener, resolveBinary };
