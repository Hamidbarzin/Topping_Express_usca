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

// Shipping quote endpoint
const SHIPPING_API_URL = "https://ship.stallionexpress.ca/api/v4/rates";
app.post("/api/quote", async (req, res) => {
  try {
    const token = process.env.STALLION_API_TOKEN;
    log(`Quote request received. Token exists: ${!!token}`, "quote");
    if (!token) {
      log("STALLION_API_TOKEN not found in environment", "error");
      return res.status(500).json({ message: "API token not configured" });
    }

    const { origin, destination, package: packageInfo } = req.body || {};
    if (!origin?.country || !origin?.postalCode || !destination?.country || !destination?.postalCode || !packageInfo) {
      return res.status(400).json({ message: "Missing required fields: origin, destination, package" });
    }

    // Clean postal code helper
    const cleanPostalCode = (postalCode, country) => {
      let cleaned = String(postalCode).trim().toUpperCase().replace(/\s+/g, "");
      if (country === "CA") {
        cleaned = cleaned.replace(/^(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)/, "");
      }
      return cleaned;
    };

    const shippingRequest = {
      from_address: {
        country_code: origin.country,
        postal_code: cleanPostalCode(origin.postalCode, origin.country),
      },
      to_address: {
        country_code: destination.country,
        postal_code: cleanPostalCode(destination.postalCode, destination.country),
      },
      weight: Number(packageInfo.weight),
      length: Number(packageInfo.length),
      width: Number(packageInfo.width),
      height: Number(packageInfo.height),
      weight_unit: "kg",
      size_unit: "cm",
      package_contents: "General merchandise",
      value: Number(packageInfo.value || 100),
      currency: "CAD",
    };

    const apiResp = await fetch(SHIPPING_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shippingRequest),
    });

    if (!apiResp.ok) {
      const text = await apiResp.text();
      log(`Shipping API error ${apiResp.status}: ${text}`, "quote");
      return res.status(400).json({ message: "Failed to get shipping quotes" });
    }

    const data = await apiResp.json();
    let rates = [];
    if (Array.isArray(data)) rates = data; else if (data.rates) rates = data.rates;
    if (rates.length === 0) {
      return res.status(400).json({ message: "No shipping rates available" });
    }

    // Transform with pickup and tax, exposing only final price
    const services = rates.map((rate) => {
      const base = Number(rate.total || 0);
      const pickupCost = 10.0;
      const markup = Math.round(base * 0.5 * 100) / 100; // 50% hidden markup
      const subtotalWithPickup = Math.round((base + markup + pickupCost) * 100) / 100;
      const tax = Math.round(subtotalWithPickup * 0.13 * 100) / 100;
      const total = Math.round((subtotalWithPickup + tax) * 100) / 100;

      return {
        service_name: rate.postage_type || "Standard Service",
        carrier: rate.carrier || "Unknown",
        delivery_days: rate.delivery_days || "5-7",
        base: total,
        total,
      };
    });

    res.json({ currency: "CAD", services });
  } catch (err) {
    log(`Quote error: ${err?.message || err}`, "error");
    res.status(500).json({ message: "Internal server error" });
  }
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


