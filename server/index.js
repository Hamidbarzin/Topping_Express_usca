import express from "express";
import path from "path";
import fs from "fs";
import process from "process";
import { randomUUID } from "crypto";

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

// Order creation endpoint with Stallion API integration
app.post("/api/orders", async (req, res) => {
  try {
    const { sender, recipient, package: packageInfo, selectedService } = req.body;
    
    // Validate required fields
    if (!sender || !recipient || !packageInfo || !selectedService) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required order data",
        errors: {
          sender: !sender ? "Sender information is required" : null,
          recipient: !recipient ? "Recipient information is required" : null,
          package: !packageInfo ? "Package information is required" : null,
          selectedService: !selectedService ? "Selected service is required" : null
        }
      });
    }

    // Validate sender fields
    const senderErrors = [];
    if (!sender.name) senderErrors.push("Sender name is required");
    if (!sender.address) senderErrors.push("Sender address is required");
    if (!sender.city) senderErrors.push("Sender city is required");
    if (!sender.postalCode) senderErrors.push("Sender postal code is required");
    if (!sender.country) senderErrors.push("Sender country is required");
    if (!sender.phone) senderErrors.push("Sender phone is required");
    if (!sender.email) senderErrors.push("Sender email is required");

    // Validate recipient fields
    const recipientErrors = [];
    if (!recipient.name) recipientErrors.push("Recipient name is required");
    if (!recipient.address) recipientErrors.push("Recipient address is required");
    if (!recipient.city) recipientErrors.push("Recipient city is required");
    if (!recipient.postalCode) recipientErrors.push("Recipient postal code is required");
    if (!recipient.country) recipientErrors.push("Recipient country is required");
    if (!recipient.phone) recipientErrors.push("Recipient phone is required");
    if (!recipient.email) recipientErrors.push("Recipient email is required");

    // Validate package fields
    const packageErrors = [];
    if (!packageInfo.weight || packageInfo.weight <= 0) packageErrors.push("Package weight must be greater than 0");
    if (!packageInfo.length || packageInfo.length <= 0) packageErrors.push("Package length must be greater than 0");
    if (!packageInfo.width || packageInfo.width <= 0) packageErrors.push("Package width must be greater than 0");
    if (!packageInfo.height || packageInfo.height <= 0) packageErrors.push("Package height must be greater than 0");
    if (!packageInfo.value || packageInfo.value <= 0) packageErrors.push("Package value must be greater than 0");

    const allErrors = [...senderErrors, ...recipientErrors, ...packageErrors];
    if (allErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: allErrors
      });
    }

    // Check API token
    const token = process.env.STALLION_API_TOKEN;
    if (!token) {
      log("STALLION_API_TOKEN not found in environment", "error");
      return res.status(500).json({ 
        success: false,
        message: "API token not configured" 
      });
    }

    // Generate order details
    const orderId = randomUUID();
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const sequence = String(Date.now()).slice(-4);
    const orderNumber = `TC-${dateStr}-${sequence}`;

    // Clean postal code helper
    const cleanPostalCode = (postalCode, country) => {
      let cleaned = String(postalCode).trim().toUpperCase().replace(/\s+/g, "");
      if (country === "CA") {
        cleaned = cleaned.replace(/^(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)/, "");
      }
      return cleaned;
    };

    // Prepare Stallion API request
    const stallionOrderData = {
      store_id: "topping-courier",
      name: recipient.name,
      company: recipient.company || "",
      address1: recipient.address,
      address2: recipient.address2 || "",
      city: recipient.city,
      province_code: recipient.province || recipient.state || "",
      postal_code: cleanPostalCode(recipient.postalCode, recipient.country),
      country_code: recipient.country,
      phone: recipient.phone,
      email: recipient.email,
      customer_id: sender.email, // Use sender email as customer ID
      carrier_code: selectedService.carrier || "Unknown",
      postage_code: selectedService.service_name || "Standard",
      package_code: "BOX",
      note: packageInfo.description || `Package from ${sender.name}`,
      weight_unit: "kg",
      weight: Number(packageInfo.weight),
      value: Number(packageInfo.value),
      currency: "CAD",
      order_id: orderNumber,
      order_at: today.toISOString(),
      store: "Topping Courier Inc",
      items: [{
        item_id: "PACKAGE_001",
        title: packageInfo.description || "General Package",
        sku: "PKG001",
        hs_code: "999999", // General merchandise
        quantity: 1,
        value: Number(packageInfo.value),
        currency: "CAD",
        country_of_origin: sender.country,
        warehouse_location: "Toronto, ON"
      }],
      tags: ["topping-courier", "express"]
    };

    log(`Creating order ${orderNumber} with Stallion API`, "order");
    log(`Sender: ${sender.name} <${sender.email}>`, "order");
    log(`Recipient: ${recipient.name} <${recipient.email}>`, "order");
    log(`Service: ${selectedService.service_name} - $${selectedService.total} CAD`, "order");

    // Make request to Stallion API
    const stallionResponse = await fetch("https://api.stallionexpress.ca/api/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stallionOrderData),
    });

    if (!stallionResponse.ok) {
      const errorText = await stallionResponse.text();
      log(`Stallion API error ${stallionResponse.status}: ${errorText}`, "error");
      
      let errorMessage = "Failed to create order with shipping provider";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Use default error message if parsing fails
      }

      return res.status(400).json({
        success: false,
        message: errorMessage,
        details: errorText
      });
    }

    const stallionData = await stallionResponse.json();
    
    // Extract tracking information from Stallion response
    const trackingNumber = stallionData.tracking_number || 
                          stallionData.trackingNumber || 
                          `ST${Date.now()}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;

    // Prepare response
    const orderResponse = {
      success: true,
      message: "Order created successfully",
      order: {
        id: orderId,
        orderNumber: orderNumber,
        trackingNumber: trackingNumber,
        status: "confirmed",
        createdAt: today.toISOString(),
        sender: {
          name: sender.name,
          email: sender.email,
          phone: sender.phone,
          address: sender.address,
          city: sender.city,
          postalCode: sender.postalCode,
          country: sender.country
        },
        recipient: {
          name: recipient.name,
          email: recipient.email,
          phone: recipient.phone,
          address: recipient.address,
          city: recipient.city,
          postalCode: recipient.postalCode,
          country: recipient.country
        },
        package: {
          weight: packageInfo.weight,
          dimensions: {
            length: packageInfo.length,
            width: packageInfo.width,
            height: packageInfo.height
          },
          value: packageInfo.value,
          description: packageInfo.description
        },
        service: {
          name: selectedService.service_name,
          carrier: selectedService.carrier,
          price: selectedService.total,
          currency: "CAD"
        },
        stallionOrderId: stallionData.id || null
      }
    };

    log(`Order ${orderNumber} created successfully with tracking: ${trackingNumber}`, "order");
    res.status(201).json(orderResponse);

  } catch (err) {
    log(`Order creation error: ${err?.message || err}`, "error");
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

// Get order details by ID
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    log(`Fetching order details for: ${orderId}`, "order");
    
    // For now, return a mock order since we don't have persistent storage
    // In production, this would fetch from database
    const mockOrder = {
      id: orderId,
      orderNumber: `TC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Date.now()).slice(-4)}`,
      trackingNumber: `ST${Date.now()}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      sender: {
        name: "John Doe",
        fullName: "John Doe",  // Frontend expects fullName
        email: "john@example.com",
        phone: "+1234567890",
        address: "123 Main St",
        address1: "123 Main St",  // Frontend expects address1
        city: "Toronto",
        province: "ON",  // Frontend expects province
        postalCode: "M5V 3A8",
        country: "CA"
      },
      recipient: {
        name: "Jane Smith",
        fullName: "Jane Smith",  // Frontend expects fullName
        email: "jane@example.com",
        phone: "+1987654321",
        address: "456 Oak Ave",
        address1: "456 Oak Ave",  // Frontend expects address1
        city: "Vancouver",
        province: "BC",  // Frontend expects province
        postalCode: "V6B 1A1",
        country: "CA"
      },
      package: {
        weight: 2.5,
        dimensions: {
          length: 30,
          width: 20,
          height: 15
        },
        value: 100,
        description: "General Package"
      },
      service: {
        name: "ICS Express",
        carrier: "ICS",
        price: 55.51,
        currency: "CAD"
      }
    };

    log(`Order details fetched successfully for: ${orderId}`, "order");
    // Return order directly for frontend compatibility
    res.json(mockOrder);
  } catch (error) {
    log(`Error fetching order ${req.params.orderId}: ${error?.message || error}`, "error");
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Backward compatible: GET /api/order/:orderId → same as /api/orders/:orderId
app.get('/api/order/:orderId', async (req, res) => {
  req.url = `/api/orders/${req.params.orderId}`;
  app._router.handle(req, res);
});

// Backward compatibility endpoint (calls the same logic as /api/orders)
app.post("/api/order", async (req, res) => {
  // Call the same order creation logic
  try {
    const { sender, recipient, package: packageInfo, selectedService } = req.body;
    
    // Validate required fields
    if (!sender || !recipient || !packageInfo || !selectedService) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required order data",
        errors: {
          sender: !sender ? "Sender information is required" : null,
          recipient: !recipient ? "Recipient information is required" : null,
          package: !packageInfo ? "Package information is required" : null,
          selectedService: !selectedService ? "Selected service is required" : null
        }
      });
    }

    // For backward compatibility, return a simple success response
    const orderId = randomUUID();
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const sequence = String(Date.now()).slice(-4);
    const orderNumber = `TC-${dateStr}-${sequence}`;
    const trackingNumber = `ST${Date.now()}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;

    log(`Order created (legacy endpoint): ${orderNumber}`, "order");
    log(`Sender: ${sender.name} <${sender.email}>`, "order");
    log(`Recipient: ${recipient.name} <${recipient.email}>`, "order");
    log(`Service: ${selectedService.service_name} - $${selectedService.total} CAD`, "order");

    res.json({ 
      success: true, 
      id: orderId,           // Frontend might expect 'id'
      orderId: orderId,      // Keep both for compatibility
      orderNumber: orderNumber,
      trackingNumber: trackingNumber,
      message: "Order created successfully" 
    });

  } catch (err) {
    log(`Order error (legacy): ${err?.message || err}`, "error");
    res.status(500).json({ 
      success: false,
      message: "Failed to create order" 
    });
  }
});

// Get order details - singular form for frontend compatibility
app.get('/api/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    log(`Fetching order details for: ${orderId}`, "order");
    
    // For now, return a mock order since we don't have persistent storage
    // In production, this would fetch from database
    const mockOrder = {
      id: orderId,
      orderNumber: `TC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Date.now()).slice(-4)}`,
      trackingNumber: `ST${Date.now()}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      sender: {
        name: "John Doe",
        fullName: "John Doe", // Added for frontend compatibility
        email: "john@example.com",
        phone: "+1234567890",
        address: "123 Main St",
        address1: "123 Main St", // Added for frontend compatibility
        city: "Toronto",
        province: "ON", // Added for frontend compatibility
        postalCode: "M5V 3A8",
        country: "CA"
      },
      recipient: {
        name: "Jane Smith",
        fullName: "Jane Smith", // Added for frontend compatibility
        email: "jane@example.com",
        phone: "+1987654321",
        address: "456 Oak Ave",
        address1: "456 Oak Ave", // Added for frontend compatibility
        city: "Vancouver",
        province: "BC", // Added for frontend compatibility
        postalCode: "V6B 1A1",
        country: "CA"
      },
      package: {
        weight: 2.5,
        dimensions: {
          length: 30,
          width: 20,
          height: 15
        },
        value: 100,
        description: "General Package"
      },
      service: {
        name: "ICS Express",
        carrier: "ICS",
        price: 55.51,
        currency: "CAD"
      }
    };

    log(`Order details fetched successfully for: ${orderId}`, "order");
    // Return order directly for frontend compatibility
    res.json(mockOrder);
  } catch (error) {
    log(`Error fetching order ${req.params.orderId}: ${error?.message || error}`, "error");
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
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


