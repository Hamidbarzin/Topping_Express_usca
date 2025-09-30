import express from "express";
import path from "path";
import fs from "fs";
import process from "process";

// Resolve __dirname in ESM
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Simple logger
function log(message, source = "server") {
  const ts = new Date().toISOString();
  console.log(`${ts} [${source}] ${message}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Serve static files from server/public
const publicDir = path.resolve(__dirname, "public");
if (!fs.existsSync(publicDir)) {
  log(`Public directory not found at ${publicDir}`, "warn");
}
app.use(express.static(publicDir));

// Catch-all to support client-side routing
app.get("*", (_req, res) => {
  const indexFile = path.join(publicDir, "index.html");
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(500).send("index.html not found");
  }
});

const port = parseInt(process.env.PORT || "10000", 10);
app.listen(port, "0.0.0.0", () => {
  log(`Server listening on 0.0.0.0:${port}`);
});


