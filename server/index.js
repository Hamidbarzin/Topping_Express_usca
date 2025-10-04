import express from "express";
import path from "path";
import fs from "fs";
import process from "process";
import { randomUUID } from "crypto";
import pkg from "pg";
const { Pool } = pkg;
import { v4 as uuidv4 } from "uuid";

// Import configuration and services
import { config } from "./config.js";
import { initMailer, sendCustomerConfirmation, sendAdminNotification } from "./mailer.js";

// Resolve __dirname in ESM
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    if (!config.databaseUrl) {
      log("DATABASE_URL not found, using in-memory storage", "warn");
      return null;
    }

    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.nodeEnv === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();

    log("✅ Database connected successfully", "db");
    
    // Create orders table if it doesn't exist
    await createOrdersTable();
    
    return pool;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, "error");
    return null;
  }
}

// Create orders table
async function createOrdersTable() {
  if (!pool) return;

  try {
    // Enable pgcrypto extension for gen_random_uuid() on older PostgreSQL versions
    // (PostgreSQL 13+ has gen_random_uuid() built-in without needing this)
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    log("PostgreSQL extensions verified", "db");
  } catch (error) {
    // Ignore error if extension already exists or if using PostgreSQL 13+
    log(`Extension check: ${error.message}`, "info");
  }

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

// Email service (initialized from mailer module)
let postmarkClient = null;

// Get app URL for emails
function getAppUrl() {
  return process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || "https://topping-express-usca.onrender.com";
}

// Email templates
function createCustomerEmailTemplate(order, appUrl = getAppUrl()) {
  const trackingUrl = `${appUrl}/track?number=${order.trackingNumber}`;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3); // 3 days from now

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${order.orderNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 30px; }
        .order-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: bold; color: #495057; }
        .info-value { color: #212529; }
        .tracking-section { text-align: center; margin: 30px 0; }
        .tracking-button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
        .tracking-button:hover { background: #218838; }
        .address-section { display: flex; gap: 20px; margin: 20px 0; }
        .address-box { flex: 1; background: #f8f9fa; padding: 15px; border-radius: 6px; }
        .address-title { font-weight: bold; color: #495057; margin-bottom: 10px; }
        .package-details { background: #e3f2fd; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        .footer a { color: #667eea; text-decoration: none; }
        @media (max-width: 600px) { .address-section { flex-direction: column; } .info-row { flex-direction: column; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚚 Topping Courier</h1>
            <p>Your order has been confirmed!</p>
        </div>
        
        <div class="content">
            <h2>Order Confirmation</h2>
            <p>Dear ${order.recipient.name},</p>
            <p>Thank you for choosing Topping Courier! Your order has been successfully created and is being processed.</p>
            
            <div class="order-info">
                <div class="info-row">
                    <span class="info-label">Order Number:</span>
                    <span class="info-value"><strong>${order.orderNumber}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tracking Number:</span>
                    <span class="info-value"><strong>${order.trackingNumber}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Service:</span>
                    <span class="info-value">${order.service.name} (${order.service.carrier})</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Estimated Delivery:</span>
                    <span class="info-value">${estimatedDelivery.toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value" style="color: #28a745; font-weight: bold;">${order.status.toUpperCase()}</span>
                </div>
            </div>

            <div class="address-section">
                <div class="address-box">
                    <div class="address-title">📤 From (Sender)</div>
                    <div><strong>${order.sender.name}</strong></div>
                    <div>${order.sender.address1}</div>
                    ${order.sender.address2 ? `<div>${order.sender.address2}</div>` : ''}
                    <div>${order.sender.city}, ${order.sender.province} ${order.sender.postalCode}</div>
                    <div>${order.sender.country}</div>
                    <div>📞 ${order.sender.phone}</div>
                    <div>✉️ ${order.sender.email}</div>
                </div>
                
                <div class="address-box">
                    <div class="address-title">📥 To (Recipient)</div>
                    <div><strong>${order.recipient.name}</strong></div>
                    <div>${order.recipient.address1}</div>
                    ${order.recipient.address2 ? `<div>${order.recipient.address2}</div>` : ''}
                    <div>${order.recipient.city}, ${order.recipient.province} ${order.recipient.postalCode}</div>
                    <div>${order.recipient.country}</div>
                    <div>📞 ${order.recipient.phone}</div>
                    <div>✉️ ${order.recipient.email}</div>
                </div>
            </div>

            <div class="package-details">
                <h3>📦 Package Details</h3>
                <div class="info-row">
                    <span class="info-label">Weight:</span>
                    <span class="info-value">${order.package.weight} lbs</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Dimensions:</span>
                    <span class="info-value">${order.package.dimensions.length}" × ${order.package.dimensions.width}" × ${order.package.dimensions.height}"</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Value:</span>
                    <span class="info-value">$${order.package.value} CAD</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Description:</span>
                    <span class="info-value">${order.package.description}</span>
                </div>
            </div>

            <div class="tracking-section">
                <h3>Track Your Package</h3>
                <p>Use your tracking number to monitor your package's progress:</p>
                <a href="${trackingUrl}" class="tracking-button">Track Package Now</a>
                <p style="margin-top: 15px; font-size: 14px; color: #6c757d;">
                    Tracking Number: <strong>${order.trackingNumber}</strong>
                </p>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 6px;">
                <h3>📞 Need Help?</h3>
                <p>If you have any questions about your order, please contact us:</p>
                <p>
                    <strong>Email:</strong> <a href="mailto:support@toppingcourier.ca">support@toppingcourier.ca</a><br>
                    <strong>Phone:</strong> <a href="tel:+1-800-TOPPING">1-800-TOPPING</a><br>
                    <strong>Website:</strong> <a href="${appUrl}">${appUrl.replace(/^https?:\/\//, '')}</a>
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2024 Topping Courier Inc. All rights reserved.</p>
            <p>This email was sent regarding order ${order.orderNumber}</p>
        </div>
    </div>
</body>
</html>
  `;
}

function createAdminEmailTemplate(order, appUrl = getAppUrl()) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order - ${order.orderNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .order-summary { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .info-box { background: #e9ecef; padding: 15px; border-radius: 6px; }
        .info-title { font-weight: bold; color: #495057; margin-bottom: 10px; border-bottom: 2px solid #dee2e6; padding-bottom: 5px; }
        .info-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; }
        .info-label { font-weight: bold; color: #495057; }
        .info-value { color: #212529; }
        .urgent { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        @media (max-width: 600px) { .info-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 New Order Received</h1>
            <p>Order #${order.orderNumber} - ${order.trackingNumber}</p>
        </div>
        
        <div class="content">
            <div class="urgent">
                <strong>⚠️ Action Required:</strong> A new order has been created and requires processing.
            </div>

            <div class="order-summary">
                <h2>📋 Order Summary</h2>
                <div class="info-row">
                    <span class="info-label">Order Number:</span>
                    <span class="info-value"><strong>${order.orderNumber}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tracking Number:</span>
                    <span class="info-value"><strong>${order.trackingNumber}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Service:</span>
                    <span class="info-value">${order.service.name} (${order.service.carrier})</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value" style="color: #28a745; font-weight: bold;">${order.status.toUpperCase()}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Created:</span>
                    <span class="info-value">${new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Stallion Order ID:</span>
                    <span class="info-value">${order.stallionOrderId || 'N/A'}</span>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <div class="info-title">📤 Sender Information</div>
                    <div><strong>${order.sender.name}</strong></div>
                    <div>${order.sender.address1}</div>
                    ${order.sender.address2 ? `<div>${order.sender.address2}</div>` : ''}
                    <div>${order.sender.city}, ${order.sender.province} ${order.sender.postalCode}</div>
                    <div>${order.sender.country}</div>
                    <div>📞 ${order.sender.phone}</div>
                    <div>✉️ ${order.sender.email}</div>
                    ${order.sender.company ? `<div>🏢 ${order.sender.company}</div>` : ''}
                </div>
                
                <div class="info-box">
                    <div class="info-title">📥 Recipient Information</div>
                    <div><strong>${order.recipient.name}</strong></div>
                    <div>${order.recipient.address1}</div>
                    ${order.recipient.address2 ? `<div>${order.recipient.address2}</div>` : ''}
                    <div>${order.recipient.city}, ${order.recipient.province} ${order.recipient.postalCode}</div>
                    <div>${order.recipient.country}</div>
                    <div>📞 ${order.recipient.phone}</div>
                    <div>✉️ ${order.recipient.email}</div>
                    ${order.recipient.company ? `<div>🏢 ${order.recipient.company}</div>` : ''}
                </div>
            </div>

            <div class="info-box">
                <div class="info-title">📦 Package & Service Details</div>
                <div class="info-row">
                    <span class="info-label">Weight:</span>
                    <span class="info-value">${order.package.weight} lbs</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Dimensions:</span>
                    <span class="info-value">${order.package.dimensions.length}" × ${order.package.dimensions.width}" × ${order.package.dimensions.height}"</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Value:</span>
                    <span class="info-value">$${order.package.value} CAD</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Description:</span>
                    <span class="info-value">${order.package.description}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Service Price:</span>
                    <span class="info-value">$${order.service.price} ${order.service.currency}</span>
                </div>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 6px;">
                <h3>🔗 Quick Actions</h3>
                <p>
                    <strong>Track Package:</strong> <a href="${appUrl}/track?number=${order.trackingNumber}">View Tracking</a><br>
                    <strong>Stallion Dashboard:</strong> <a href="https://dashboard.stallionexpress.ca">Open Dashboard</a><br>
                    <strong>Order Management:</strong> <a href="${appUrl}/admin/orders">View All Orders</a>
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2024 Topping Courier Inc. - Admin Notification</p>
            <p>Order ID: ${order.id} | Generated: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Send email notifications
async function sendOrderNotifications(order) {
  try {
    // Send customer confirmation email
    const customerResult = await sendCustomerConfirmation(order);
    if (customerResult.success) {
      log(`✅ Customer email sent to ${order.recipient.email}`, "email");
    } else {
      log(`⚠️  Customer email not sent: ${customerResult.reason || customerResult.error}`, "warn");
    }
  } catch (error) {
    log(`❌ Failed to send customer email: ${error.message}`, "error");
  }

  try {
    // Send admin notification email
    const adminResult = await sendAdminNotification(order);
    if (adminResult.success) {
      log(`✅ Admin email sent to ${config.adminEmail}`, "email");
    } else {
      log(`⚠️  Admin email not sent: ${adminResult.reason || adminResult.error}`, "warn");
    }
  } catch (error) {
    log(`❌ Failed to send admin email: ${error.message}`, "error");
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
    database: pool ? "connected" : "disconnected",
    email: postmarkClient ? "connected" : "disconnected",
    nodeEnv: config.nodeEnv
  });
});

// Debug endpoint (development only)
app.get("/api/debug/env", (_req, res) => {
  if (config.nodeEnv === 'production') {
    return res.status(403).json({ error: "Not available in production" });
  }
  
  res.json({
    nodeEnv: config.nodeEnv,
    port: config.port,
    envVars: {
      DATABASE_URL: config.databaseUrl ? "✓ Set" : "✗ Missing",
      STALLION_API_KEY: config.stallionApiKey ? "✓ Set" : "✗ Missing",
      STALLION_API_URL: config.stallionApiUrl,
      POSTMARK_API_KEY: config.postmarkApiKey ? "✓ Set" : "✗ Missing",
      POSTMARK_FROM_EMAIL: config.postmarkFromEmail,
      ADMIN_EMAIL: config.adminEmail,
      SESSION_SECRET: config.sessionSecret ? "✓ Set" : "✗ Missing"
    }
  });
});

// Shipping quote endpoint
app.post("/api/quote", async (req, res) => {
  try {
    log(`Quote request received. API configured: ${!!config.stallionApiKey}`, "quote");
    if (!config.stallionApiKey) {
      log("❌ STALLION_API_KEY not configured", "error");
      return res.status(500).json({ 
        message: "Shipping API not configured",
        error: "STALLION_API_KEY missing"
      });
    }

    // Support both formats: {origin, destination, package} and {sender, recipient, packageInfo}
    const body = req.body || {};
    const origin = body.origin || body.sender;
    const destination = body.destination || body.recipient;
    const packageInfo = body.package || body.packageInfo;
    
    if (!origin?.country || !origin?.postalCode || !destination?.country || !destination?.postalCode || !packageInfo) {
      return res.status(400).json({ message: "Missing required fields: origin/sender, destination/recipient, package/packageInfo" });
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
        country_code: origin.country,
        postal_code: cleanPostalCode(origin.postalCode, origin.country),
        city: origin.city || "",
        province: origin.province || ""
      },
      to_address: {
        country: destination.country,
        country_code: destination.country,
        postal_code: cleanPostalCode(destination.postalCode, destination.country),
        city: destination.city || "",
        province: destination.province || ""
      },
      weight: parseFloat(packageInfo.weight) || 1,
      weight_unit: "lbs",
      length: parseFloat(packageInfo.dimensions?.length) || 10,
      width: parseFloat(packageInfo.dimensions?.width) || 10,
      height: parseFloat(packageInfo.dimensions?.height) || 10,
      size_unit: "in",
      value: parseFloat(packageInfo.value) || 0,
      currency: "CAD",
      package_contents: packageInfo.description || "General Package"
    };

    log(`Making request to Stallion API: ${config.stallionApiUrl}/api/v4/rates`, "quote");

    const response = await fetch(`${config.stallionApiUrl}/api/v4/rates`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.stallionApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(shippingRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`❌ Stallion API error ${response.status}: ${errorText}`, "error");
      
      // Provide helpful error messages
      let errorMessage = "Failed to get shipping rates";
      if (response.status === 401) {
        errorMessage = "Invalid API credentials - check STALLION_API_KEY";
      } else if (response.status === 400) {
        errorMessage = "Invalid postal codes or package details";
      } else if (response.status >= 500) {
        errorMessage = "Stallion API service unavailable";
      }
      
      return res.status(200).json({ 
        rates: [],
        error: {
          message: errorMessage,
          details: errorText,
          status: response.status
        }
      });
    }

    const data = await response.json();
    log(`✅ Received ${data?.rates?.length || 0} rates from Stallion API`, "quote");
    
    // Ensure rates is always an array
    if (!data || !Array.isArray(data.rates)) {
      return res.status(200).json({ 
        rates: [],
        error: {
          message: "No rates available",
          details: "API returned invalid response"
        }
      });
    }
    
    res.json(data);

  } catch (err) {
    log(`Quote error: ${err?.message || err}`, "error");
    res.status(200).json({ 
      rates: [],
      error: {
        message: "Internal server error",
        details: err?.message || "Unknown error"
      }
    });
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
    if (!config.stallionApiKey) {
      log("❌ STALLION_API_KEY not configured", "error");
      return res.status(500).json({
        success: false,
        message: "Shipping API not configured"
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
    const stallionResponse = await fetch(`${config.stallionApiUrl}/api/v1/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.stallionApiKey}`,
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

    // Send email notifications (non-blocking)
    try {
      await sendOrderNotifications(orderData);
    } catch (emailError) {
      log(`Email notification failed for order ${orderNumber}: ${emailError.message}`, "error");
      // Don't fail the order creation if emails fail
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
    if (!config.stallionApiKey) {
      log("❌ STALLION_API_KEY not configured", "error");
      return res.status(500).json({
        success: false,
        message: "Shipping API not configured"
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
    const stallionResponse = await fetch(`${config.stallionApiUrl}/api/v1/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.stallionApiKey}`,
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

    // Send email notifications (non-blocking)
    try {
      await sendOrderNotifications(orderData);
    } catch (emailError) {
      log(`Email notification failed for order ${orderNumber}: ${emailError.message}`, "error");
      // Don't fail the order creation if emails fail
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
log(`🔍 PUBLIC DIR PATH: ${publicDir}`, "debug");
log(`🔍 __dirname: ${__dirname}`, "debug");
log(`🔍 Current working directory: ${process.cwd()}`, "debug");

if (!fs.existsSync(publicDir)) {
  log(`❌ Public directory NOT FOUND at ${publicDir}`, "error");
  log(`📁 Available directories in ${__dirname}:`, "debug");
  try {
    const files = fs.readdirSync(__dirname);
    files.forEach(file => {
      const fullPath = path.join(__dirname, file);
      const stats = fs.statSync(fullPath);
      log(`  - ${file} ${stats.isDirectory() ? '[DIR]' : '[FILE]'}`, "debug");
    });
  } catch (err) {
    log(`Error reading directory: ${err.message}`, "error");
  }
} else {
  log(`✅ Public directory found at ${publicDir}`, "startup");
  try {
    const files = fs.readdirSync(publicDir);
    log(`📁 Files in public directory (${files.length} items):`, "startup");
    files.forEach(file => {
      const fullPath = path.join(publicDir, file);
      const stats = fs.statSync(fullPath);
      log(`  - ${file} ${stats.isDirectory() ? '[DIR]' : '[FILE]'} (${stats.size} bytes)`, "startup");
    });
    
    const indexPath = path.join(publicDir, "index.html");
    if (fs.existsSync(indexPath)) {
      const indexStats = fs.statSync(indexPath);
      log(`✅ index.html found! (${indexStats.size} bytes)`, "startup");
    } else {
      log(`❌ index.html NOT FOUND in public directory!`, "error");
    }
  } catch (err) {
    log(`Error reading public directory: ${err.message}`, "error");
  }
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
    // Log startup configuration
    log(`🚀 Starting Topping Express API Server`, "startup");
    log(`   NODE_ENV: ${config.nodeEnv}`, "startup");
    log(`   PORT: ${config.port}`, "startup");
    
    // Initialize database
    await initDatabase();
    
    // Initialize email service
    postmarkClient = initMailer();
    
    const host = "0.0.0.0"; // Always bind to 0.0.0.0 for Docker/Render
    
    app.listen(config.port, host, () => {
      log(`✅ Server listening on ${host}:${config.port}`, "server");
      log(`📊 Database: ${pool ? "✓ Connected" : "✗ Disconnected (using in-memory)"}`, "server");
      log(`📧 Email: ${postmarkClient ? "✓ Configured" : "✗ Disabled"}`, "server");
      log(`🔑 Stallion API: ${config.stallionApiKey ? "✓ Configured" : "✗ Missing"}`, "server");
      
      if (config.nodeEnv === 'production') {
        log(`🌐 Production mode - using Render environment variables`, "server");
      }
    });
  } catch (error) {
    log(`❌ Failed to start server: ${error.message}`, "error");
    process.exit(1);
  }
}

// Start the server
startServer();