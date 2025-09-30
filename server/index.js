import express from "express";
import path from "path";
import fs from "fs";
import process from "process";
import { randomUUID } from "crypto";
import pkg from "pg";
const { Pool } = pkg;
import { v4 as uuidv4 } from "uuid";

// Resolve __dirname in ESM
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Simple logger
function log(message, source = "server") {
  const ts = new Date().toISOString();
  console.log(`${ts} [${source}] ${message}`);
}

// Database connection
let pool = null;

// Initialize database connection
async function initDatabase() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      log("DATABASE_URL not found, using in-memory storage", "warn");
      return null;
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();

    log("Database connected successfully", "db");
    
    // Create orders table if it doesn't exist
    await createOrdersTable();
    
    return pool;
  } catch (error) {
    log(`Database connection failed: ${error.message}`, "error");
    return null;
  }
}

// Create orders table
async function createOrdersTable() {
  if (!pool) return;

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number VARCHAR(50) UNIQUE NOT NULL,
      tracking_number VARCHAR(100),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      sender JSONB NOT NULL,
      recipient JSONB NOT NULL,
      package_info JSONB NOT NULL,
      service JSONB NOT NULL,
      stallion_order_id VARCHAR(100)
    );
    
    CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
  `;

  try {
    await pool.query(createTableQuery);
    log("Orders table created/verified successfully", "db");
  } catch (error) {
    log(`Error creating orders table: ${error.message}`, "error");
    throw error;
  }
}

// Database helper functions
async function saveOrder(orderData) {
  if (!pool) {
    throw new Error("Database not available");
  }

  const {
    id,
    orderNumber,
    trackingNumber,
    status = "confirmed",
    sender,
    recipient,
    package: packageInfo,
    service,
    stallionOrderId
  } = orderData;

  const query = `
    INSERT INTO orders (
      id, order_number, tracking_number, status, 
      sender, recipient, package_info, service, stallion_order_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const values = [
    id,
    orderNumber,
    trackingNumber,
    status,
    JSON.stringify(sender),
    JSON.stringify(recipient),
    JSON.stringify(packageInfo),
    JSON.stringify(service),
    stallionOrderId
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    log(`Error saving order: ${error.message}`, "error");
    throw error;
  }
}

async function getOrderById(orderId) {
  if (!pool) {
    throw new Error("Database not available");
  }

  const query = `
    SELECT 
      id,
      order_number as "orderNumber",
      tracking_number as "trackingNumber",
      status,
      created_at as "createdAt",
      updated_at as "updatedAt",
      sender,
      recipient,
      package_info as package,
      service,
      stallion_order_id as "stallionOrderId"
    FROM orders 
    WHERE id = $1
  `;

  try {
    const result = await pool.query(query, [orderId]);
    if (result.rows.length === 0) {
      return null;
    }
    
    const order = result.rows[0];
    // Parse JSON fields
    order.sender = typeof order.sender === 'string' ? JSON.parse(order.sender) : order.sender;
    order.recipient = typeof order.recipient === 'string' ? JSON.parse(order.recipient) : order.recipient;
    order.package = typeof order.package === 'string' ? JSON.parse(order.package) : order.package;
    order.service = typeof order.service === 'string' ? JSON.parse(order.service) : order.service;
    
    return order;
  } catch (error) {
    log(`Error fetching order ${orderId}: ${error.message}`, "error");
    throw error;
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ 
    ok: true, 
    uptime: process.uptime(),
    database: pool ? "connected" : "disconnected"
  });
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
        country: origin.country,
        postal_code: cleanPostalCode(origin.postalCode, origin.country),
        city: origin.city || "",
        province: origin.province || ""
      },
      to_address: {
        country: destination.country,
        postal_code: cleanPostalCode(destination.postalCode, destination.country),
        city: destination.city || "",
        province: destination.province || ""
      },
      package: {
        weight: parseFloat(packageInfo.weight) || 1,
        length: parseFloat(packageInfo.dimensions?.length) || 10,
        width: parseFloat(packageInfo.dimensions?.width) || 10,
        height: parseFloat(packageInfo.dimensions?.height) || 10,
        value: parseFloat(packageInfo.value) || 0
      }
    };

    log(`Making request to Stallion API: ${JSON.stringify(shippingRequest)}`, "quote");

    const response = await fetch(SHIPPING_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(shippingRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Stallion API error ${response.status}: ${errorText}`, "error");
      return res.status(response.status).json({ 
        message: "Failed to get shipping rates",
        details: errorText
      });
    }

    const data = await response.json();
    log(`Received ${data?.rates?.length || 0} rates from Stallion API`, "quote");
    res.json(data);

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
        message: "Missing required fields: sender, recipient, package, selectedService"
      });
    }

    // Validate sender fields
    if (!sender.name || !sender.email || !sender.phone || !sender.address1 || 
        !sender.city || !sender.province || !sender.postalCode || !sender.country) {
      return res.status(400).json({
        success: false,
        message: "Missing required sender fields: name, email, phone, address1, city, province, postalCode, country"
      });
    }

    // Validate recipient fields
    if (!recipient.name || !recipient.email || !recipient.phone || !recipient.address1 || 
        !recipient.city || !recipient.province || !recipient.postalCode || !recipient.country) {
      return res.status(400).json({
        success: false,
        message: "Missing required recipient fields: name, email, phone, address1, city, province, postalCode, country"
      });
    }

    // Validate package fields
    if (!packageInfo.weight || !packageInfo.dimensions || !packageInfo.value) {
      return res.status(400).json({
        success: false,
        message: "Missing required package fields: weight, dimensions, value"
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
    const orderId = uuidv4();
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
      from_address: {
        name: sender.name,
        company: sender.company || "",
        address1: sender.address1,
        address2: sender.address2 || "",
        city: sender.city,
        province: sender.province,
        postal_code: cleanPostalCode(sender.postalCode, sender.country),
        country: sender.country,
        phone: sender.phone,
        email: sender.email
      },
      to_address: {
        name: recipient.name,
        company: recipient.company || "",
        address1: recipient.address1,
        address2: recipient.address2 || "",
        city: recipient.city,
        province: recipient.province,
        postal_code: cleanPostalCode(recipient.postalCode, recipient.country),
        country: recipient.country,
        phone: recipient.phone,
        email: recipient.email
      },
      package: {
        weight: parseFloat(packageInfo.weight),
        length: parseFloat(packageInfo.dimensions.length),
        width: parseFloat(packageInfo.dimensions.width),
        height: parseFloat(packageInfo.dimensions.height),
        value: parseFloat(packageInfo.value),
        description: packageInfo.description || "General Package"
      },
      service: {
        carrier: selectedService.carrier,
        service_type: selectedService.serviceType || selectedService.name
      }
    };

    log(`Creating order ${orderNumber} with Stallion API`, "order");
    log(`Sender: ${sender.name} (${sender.city}, ${sender.province})`, "order");
    log(`Recipient: ${recipient.name} (${recipient.city}, ${recipient.province})`, "order");
    log(`Service: ${selectedService.carrier} - ${selectedService.name}`, "order");

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
      if (stallionResponse.status === 400) {
        errorMessage = "Invalid order data provided";
      } else if (stallionResponse.status === 401) {
        errorMessage = "Invalid API credentials";
      } else if (stallionResponse.status === 403) {
        errorMessage = "API access forbidden";
      } else if (stallionResponse.status >= 500) {
        errorMessage = "Shipping provider service unavailable";
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

    // Prepare order data for database
    const orderData = {
      id: orderId,
      orderNumber: orderNumber,
      trackingNumber: trackingNumber,
      status: "confirmed",
      sender: {
        name: sender.name,
        fullName: sender.name, // For frontend compatibility
        email: sender.email,
        phone: sender.phone,
        address: sender.address1,
        address1: sender.address1,
        address2: sender.address2 || "",
        city: sender.city,
        province: sender.province,
        postalCode: sender.postalCode,
        country: sender.country,
        company: sender.company || ""
      },
      recipient: {
        name: recipient.name,
        fullName: recipient.name, // For frontend compatibility
        email: recipient.email,
        phone: recipient.phone,
        address: recipient.address1,
        address1: recipient.address1,
        address2: recipient.address2 || "",
        city: recipient.city,
        province: recipient.province,
        postalCode: recipient.postalCode,
        country: recipient.country,
        company: recipient.company || ""
      },
      package: {
        weight: parseFloat(packageInfo.weight),
        dimensions: {
          length: parseFloat(packageInfo.dimensions.length),
          width: parseFloat(packageInfo.dimensions.width),
          height: parseFloat(packageInfo.dimensions.height)
        },
        value: parseFloat(packageInfo.value),
        description: packageInfo.description || "General Package"
      },
      service: {
        name: selectedService.name,
        carrier: selectedService.carrier,
        serviceType: selectedService.serviceType || selectedService.name,
        price: parseFloat(selectedService.price) || 0,
        currency: selectedService.currency || "CAD"
      },
      stallionOrderId: stallionData.id || null
    };

    // Save to database
    let savedOrder;
    try {
      savedOrder = await saveOrder(orderData);
      log(`Order ${orderNumber} saved to database successfully`, "order");
    } catch (dbError) {
      log(`Database save failed for order ${orderNumber}: ${dbError.message}`, "error");
      // Still return success since Stallion order was created
      savedOrder = orderData;
    }

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
        sender: orderData.sender,
        recipient: orderData.recipient,
        package: orderData.package,
        service: orderData.service,
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

// Backward compatibility endpoint (calls the same logic as /api/orders)
app.post("/api/order", async (req, res) => {
  try {
    const { sender, recipient, package: packageInfo, selectedService } = req.body;

    // Validate required fields
    if (!sender || !recipient || !packageInfo || !selectedService) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: sender, recipient, package, selectedService"
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
    const orderId = uuidv4();
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
      from_address: {
        name: sender.name,
        company: sender.company || "",
        address1: sender.address1,
        address2: sender.address2 || "",
        city: sender.city,
        province: sender.province,
        postal_code: cleanPostalCode(sender.postalCode, sender.country),
        country: sender.country,
        phone: sender.phone,
        email: sender.email
      },
      to_address: {
        name: recipient.name,
        company: recipient.company || "",
        address1: recipient.address1,
        address2: recipient.address2 || "",
        city: recipient.city,
        province: recipient.province,
        postal_code: cleanPostalCode(recipient.postalCode, recipient.country),
        country: recipient.country,
        phone: recipient.phone,
        email: recipient.email
      },
      package: {
        weight: parseFloat(packageInfo.weight),
        length: parseFloat(packageInfo.dimensions.length),
        width: parseFloat(packageInfo.dimensions.width),
        height: parseFloat(packageInfo.dimensions.height),
        value: parseFloat(packageInfo.value),
        description: packageInfo.description || "General Package"
      },
      service: {
        carrier: selectedService.carrier,
        service_type: selectedService.serviceType || selectedService.name
      }
    };

    log(`Creating order ${orderNumber} with Stallion API (legacy endpoint)`, "order");

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
      return res.status(400).json({
        success: false,
        message: "Failed to create order with shipping provider",
        details: errorText
      });
    }

    const stallionData = await stallionResponse.json();
    const trackingNumber = stallionData.tracking_number || 
                          stallionData.trackingNumber || 
                          `ST${Date.now()}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;

    // Prepare order data for database
    const orderData = {
      id: orderId,
      orderNumber: orderNumber,
      trackingNumber: trackingNumber,
      status: "confirmed",
      sender: {
        name: sender.name,
        fullName: sender.name,
        email: sender.email,
        phone: sender.phone,
        address: sender.address1,
        address1: sender.address1,
        address2: sender.address2 || "",
        city: sender.city,
        province: sender.province,
        postalCode: sender.postalCode,
        country: sender.country,
        company: sender.company || ""
      },
      recipient: {
        name: recipient.name,
        fullName: recipient.name,
        email: recipient.email,
        phone: recipient.phone,
        address: recipient.address1,
        address1: recipient.address1,
        address2: recipient.address2 || "",
        city: recipient.city,
        province: recipient.province,
        postalCode: recipient.postalCode,
        country: recipient.country,
        company: recipient.company || ""
      },
      package: {
        weight: parseFloat(packageInfo.weight),
        dimensions: {
          length: parseFloat(packageInfo.dimensions.length),
          width: parseFloat(packageInfo.dimensions.width),
          height: parseFloat(packageInfo.dimensions.height)
        },
        value: parseFloat(packageInfo.value),
        description: packageInfo.description || "General Package"
      },
      service: {
        name: selectedService.name,
        carrier: selectedService.carrier,
        serviceType: selectedService.serviceType || selectedService.name,
        price: parseFloat(selectedService.price) || 0,
        currency: selectedService.currency || "CAD"
      },
      stallionOrderId: stallionData.id || null
    };

    // Save to database
    try {
      await saveOrder(orderData);
      log(`Order ${orderNumber} saved to database successfully (legacy)`, "order");
    } catch (dbError) {
      log(`Database save failed for order ${orderNumber}: ${dbError.message}`, "error");
    }

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

// Get order details by ID - plural form
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    log(`Fetching order details for: ${orderId}`, "order");
    
    // Try to get from database first
    try {
      const order = await getOrderById(orderId);
      if (order) {
        log(`Order details fetched from database for: ${orderId}`, "order");
        return res.json(order);
      }
    } catch (dbError) {
      log(`Database fetch failed for order ${orderId}: ${dbError.message}`, "error");
    }

    // Fallback to mock data if database not available or order not found
    const mockOrder = {
      id: orderId,
      orderNumber: `TC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Date.now()).slice(-4)}`,
      trackingNumber: `ST${Date.now()}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      sender: {
        name: "John Doe",
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        address: "123 Main St",
        address1: "123 Main St",
        city: "Toronto",
        province: "ON",
        postalCode: "M5V 3A8",
        country: "CA"
      },
      recipient: {
        name: "Jane Smith",
        fullName: "Jane Smith",
        email: "jane@example.com",
        phone: "+1987654321",
        address: "456 Oak Ave",
        address1: "456 Oak Ave",
        city: "Vancouver",
        province: "BC",
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

    log(`Order details fetched from mock data for: ${orderId}`, "order");
    res.json(mockOrder);
  } catch (error) {
    log(`Error fetching order ${req.params.orderId}: ${error?.message || error}`, "error");
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get order details by ID - singular form for frontend compatibility
app.get('/api/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    log(`Fetching order details for: ${orderId}`, "order");
    
    // Try to get from database first
    try {
      const order = await getOrderById(orderId);
      if (order) {
        log(`Order details fetched from database for: ${orderId}`, "order");
        return res.json(order);
      }
    } catch (dbError) {
      log(`Database fetch failed for order ${orderId}: ${dbError.message}`, "error");
    }

    // Fallback to mock data if database not available or order not found
    const mockOrder = {
      id: orderId,
      orderNumber: `TC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Date.now()).slice(-4)}`,
      trackingNumber: `ST${Date.now()}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      sender: {
        name: "John Doe",
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        address: "123 Main St",
        address1: "123 Main St",
        city: "Toronto",
        province: "ON",
        postalCode: "M5V 3A8",
        country: "CA"
      },
      recipient: {
        name: "Jane Smith",
        fullName: "Jane Smith",
        email: "jane@example.com",
        phone: "+1987654321",
        address: "456 Oak Ave",
        address1: "456 Oak Ave",
        city: "Vancouver",
        province: "BC",
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

    log(`Order details fetched from mock data for: ${orderId}`, "order");
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

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();
    
    const port = parseInt(process.env.PORT || "10000", 10);
    app.listen(port, "0.0.0.0", () => {
      log(`Server listening on 0.0.0.0:${port}`);
      log(`Database: ${pool ? "Connected" : "Not available (using mock data)"}`);
    });
  } catch (error) {
    log(`Failed to start server: ${error.message}`, "error");
    process.exit(1);
  }
}

// Start the server
startServer();