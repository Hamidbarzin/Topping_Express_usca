// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  orders;
  invoices;
  contactMessages;
  constructor() {
    this.orders = /* @__PURE__ */ new Map();
    this.invoices = /* @__PURE__ */ new Map();
    this.contactMessages = /* @__PURE__ */ new Map();
  }
  // Order methods
  async saveOrder(order) {
    this.orders.set(order.id, order);
    return order;
  }
  async getOrder(id) {
    return this.orders.get(id) || null;
  }
  async getAllOrders() {
    return Array.from(this.orders.values());
  }
  // Contact message methods
  async saveContactMessage(message) {
    this.contactMessages.set(message.id, message);
    return message;
  }
  async getContactMessage(id) {
    return this.contactMessages.get(id) || null;
  }
  async getAllContactMessages() {
    return Array.from(this.contactMessages.values());
  }
  // Legacy invoice methods
  async saveInvoice(invoice) {
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }
  async getInvoice(id) {
    return this.invoices.get(id) || null;
  }
  async getAllInvoices() {
    return Array.from(this.invoices.values());
  }
};
var storage = new MemStorage();

// server/routes.ts
import { randomUUID } from "crypto";
import PDFDocument from "pdfkit";

// server/email.ts
import { MailService } from "@sendgrid/mail";
var SENDGRID_API_KEY = "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";
var mailService = null;
if (SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(SENDGRID_API_KEY);
  console.log("\u2705 SendGrid initialized for email delivery!");
} else {
  console.warn("\u26A0\uFE0F  No SendGrid API key available");
}
async function sendEmail(params) {
  if (!mailService || !SENDGRID_API_KEY) {
    console.log("\u{1F4E7} [SIMULATED EMAIL - No SendGrid API Key]");
    console.log(`   To: ${params.to}`);
    console.log(`   From: ${params.from}`);
    console.log(`   Subject: ${params.subject}`);
    console.log(`   Has HTML: ${!!params.html}`);
    console.log(`   Has Attachments: ${!!params.attachments?.length}`);
    console.log("   \u2705 Email simulated successfully");
    return true;
  }
  try {
    const attachments = params.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      type: att.type,
      disposition: "attachment"
    }));
    const sendGridData = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || "",
      html: params.html || "",
      ...attachments && attachments.length > 0 && { attachments }
    };
    await mailService.send(sendGridData);
    console.log(`\u2705 Email sent successfully to ${params.to} via SendGrid!`);
    return true;
  } catch (error) {
    console.error(`\u274C SendGrid error for ${params.to}:`, error.response?.body || error.message);
    return false;
  }
}
async function sendCustomerThankYouEmail(customerEmail, order, pdfBuffer) {
  const subject = `Thank You! Your Order ${order.orderNumber} is Confirmed - Tracking: ${order.trackingNumber}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Topping Courier Inc.</h1>
        <p style="margin: 5px 0 0 0;">87 Windrow Street, Richmond Hill, ON | Tel: 647-339-0222</p>
      </div>
      
      <div style="padding: 30px 20px; background-color: #f8fafc;">
        <div style="background-color: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">\u2705 Thank You, ${order.recipient.name}!</h2>
          <p style="margin: 10px 0 0 0;">Your shipping order is confirmed and ready for pickup.</p>
        </div>

        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">\u{1F4CB} Order Details:</h3>
          <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
          <p style="margin: 5px 0;"><strong>Service:</strong> ${order.selectedService.service_name}</p>
          <p style="margin: 5px 0;"><strong>Carrier:</strong> ${order.selectedService.carrier}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${Number(order.selectedService?.total || 0).toFixed(2)} CAD</p>
          <p style="margin: 5px 0;"><strong>Delivery:</strong> ${order.selectedService.delivery_days} business days</p>
        </div>

        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">\u{1F4E6} Shipping Information:</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h4 style="color: #1e293b; margin: 10px 0 5px 0;">\u{1F4E4} From:</h4>
              <p style="margin: 0; font-size: 14px; color: #475569;">
                ${order.sender.name}<br>
                ${order.sender.address}<br>
                ${order.sender.city}, ${order.sender.province} ${order.sender.postalCode}
              </p>
            </div>
            <div>
              <h4 style="color: #1e293b; margin: 10px 0 5px 0;">\u{1F4E5} To:</h4>
              <p style="margin: 0; font-size: 14px; color: #475569;">
                ${order.recipient.name}<br>
                ${order.recipient.address}<br>
                ${order.recipient.city}, ${order.recipient.province} ${order.recipient.postalCode}
              </p>
            </div>
          </div>
        </div>

        <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #1e40af; margin-top: 0;">\u{1F4E7} Next Steps:</h4>
          <ul style="margin: 5px 0; color: #1e40af;">
            <li>Your invoice is attached to this email</li>
            <li>You will receive pickup and delivery notifications</li>
            <li>Track your package using: <strong>${order.trackingNumber}</strong></li>
            <li>Contact us at 647-339-0222 for any questions</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #64748b; font-size: 14px;">
            Best regards,<br>
            <strong>Topping Courier Inc.</strong><br>
            87 Windrow Street, Richmond Hill, ON<br>
            Tel: 647-339-0222<br>
            Email: info@toppingcourier.ca
          </p>
        </div>
      </div>
    </div>
  `;
  const pdfAttachment = {
    content: pdfBuffer.toString("base64"),
    filename: `invoice-${order.orderNumber}.pdf`,
    type: "application/pdf",
    disposition: "attachment"
  };
  const textBody = `
Thank you for choosing Topping Courier Inc.!

Order Details:
- Order Number: ${order.orderNumber}
- Tracking Number: ${order.trackingNumber}
- Service: ${order.selectedService.service_name}
- Total: $${Number(order.selectedService?.total || 0).toFixed(2)} CAD

Your invoice is attached. Contact us at 647-339-0222 for questions.

Best regards,
Topping Courier Inc.
  `;
  return await sendEmail({
    to: customerEmail,
    from: "info@toppingcourier.ca",
    subject,
    text: textBody,
    html: htmlBody,
    attachments: [pdfAttachment]
  });
}
async function sendAdminNotificationEmail(adminEmail, order, pdfBuffer) {
  const subject = `New Order ${order.orderNumber} - ${order.recipient.name}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New Order Notification</h1>
        <p style="margin: 5px 0 0 0;">Topping Courier Inc.</p>
      </div>
      
      <div style="padding: 30px 20px; background-color: #f8fafc;">
        <div style="background-color: #f59e0b; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">\u{1F4E6} New Order Received</h2>
          <p style="margin: 10px 0 0 0;">Order ${order.orderNumber} from ${order.recipient.name}</p>
        </div>

        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">\u{1F4CB} Order Summary:</h3>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.id}</p>
          <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${order.date}</p>
          <p style="margin: 5px 0;"><strong>Tracking:</strong> ${order.trackingNumber}</p>
          <p style="margin: 5px 0;"><strong>Total:</strong> $${Number(order.selectedService?.total || 0).toFixed(2)} CAD</p>
        </div>

        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">\u{1F464} Customer Information:</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${order.recipient.name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${order.recipient.email}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.recipient.phone}</p>
          ${order.recipient.company ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${order.recipient.company}</p>` : ""}
          ${order.customerNote ? `<p style="margin: 15px 0; padding: 10px; background-color: #fef3c7; border-radius: 5px;"><strong>\u{1F4E7} Email Follow-up:</strong> ${order.customerNote}</p>` : ""}
        </div>

        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">\u{1F69A} Service Details:</h3>
          <p style="margin: 5px 0;"><strong>Service:</strong> ${order.selectedService?.service_name || "Standard Service"}</p>
          <p style="margin: 5px 0;"><strong>Carrier:</strong> ${order.selectedService?.carrier || "Unknown Carrier"}</p>
          <p style="margin: 5px 0;"><strong>Delivery:</strong> ${order.selectedService?.delivery_days || "N/A"} business days</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${Number(order.selectedService?.total || 0).toFixed(2)} CAD</p>
        </div>

        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">\u{1F4E6} Package Details:</h3>
          <p style="margin: 5px 0;"><strong>Dimensions:</strong> ${order.package.length} x ${order.package.width} x ${order.package.height} cm</p>
          <p style="margin: 5px 0;"><strong>Weight:</strong> ${order.package.weight} kg</p>
          <p style="margin: 5px 0;"><strong>Value:</strong> $${order.package.value} CAD</p>
        </div>

        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">\u{1F4CD} Addresses:</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h4 style="color: #1e293b; margin: 10px 0 5px 0;">From:</h4>
              <p style="margin: 0; font-size: 14px; color: #475569;">
                ${order.sender.name}<br>
                ${order.sender.address}<br>
                ${order.sender.city}, ${order.sender.province} ${order.sender.postalCode}<br>
                ${order.sender.phone}
              </p>
            </div>
            <div>
              <h4 style="color: #1e293b; margin: 10px 0 5px 0;">To:</h4>
              <p style="margin: 0; font-size: 14px; color: #475569;">
                ${order.recipient.name}<br>
                ${order.recipient.address}<br>
                ${order.recipient.city}, ${order.recipient.province} ${order.recipient.postalCode}<br>
                ${order.recipient.phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  const pdfAttachment = {
    content: pdfBuffer.toString("base64"),
    filename: `invoice-${order.orderNumber}.pdf`,
    type: "application/pdf",
    disposition: "attachment"
  };
  const textBody = `
NEW ORDER NOTIFICATION - Topping Courier Inc.

Order Summary:
- Order Number: ${order.orderNumber}
- Tracking: ${order.trackingNumber}  
- Total: $${Number(order.selectedService?.total || 0).toFixed(2)} CAD

Customer Information:
- Name: ${order.recipient.name}
- Email: ${order.recipient.email}
- Phone: ${order.recipient.phone}

Service: ${order.selectedService?.service_name || "Standard"} 
Carrier: ${order.selectedService?.carrier || "Unknown"}

Package: ${order.package.length}x${order.package.width}x${order.package.height} cm, ${order.package.weight} kg

Sender: ${order.sender.name} <${order.sender.email}>
Recipient: ${order.recipient.name} <${order.recipient.email}>

Invoice attached.
  `;
  return await sendEmail({
    to: adminEmail,
    from: "info@toppingcourier.ca",
    subject,
    text: textBody,
    html: htmlBody,
    attachments: [pdfAttachment]
  });
}
async function sendInvoiceEmail(customerEmail, companyEmail, invoiceData, pdfBuffer) {
  const invoiceNumber = invoiceData.number;
  const customerName = invoiceData.customerInfo.name;
  const totalAmount = Number(invoiceData.selectedService?.total || 0).toFixed(2);
  const trackingNumber = invoiceData.provisionalTracking;
  const pdfAttachment = {
    content: pdfBuffer.toString("base64"),
    filename: `invoice-${invoiceNumber}.pdf`,
    type: "application/pdf",
    disposition: "attachment"
  };
  const customerEmailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Topping Express</h1>
        <p style="margin: 5px 0 0 0;">Your Invoice is Ready</p>
      </div>
      
      <div style="padding: 30px 20px; background-color: #f8fafc;">
        <h2 style="color: #1e293b; margin-bottom: 20px;">Dear ${customerName},</h2>
        
        <p style="color: #475569; line-height: 1.6;">
          Thank you for choosing Topping Express for your shipping needs. Your invoice has been generated and is attached to this email.
        </p>
        
        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Invoice Details:</h3>
          <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${totalAmount} CAD</p>
          <p style="margin: 5px 0;"><strong>Service:</strong> ${invoiceData.selectedService.service_name}</p>
          <p style="margin: 5px 0;"><strong>Carrier:</strong> ${invoiceData.selectedService.carrier}</p>
        </div>
        
        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #1e293b; margin-top: 0;">\u{1F4CD} Shipping Information</h4>
          <p style="margin: 5px 0; color: #475569;"><strong>From:</strong> ${invoiceData.origin?.city || "N/A"}, ${invoiceData.origin?.province || ""} ${invoiceData.origin?.postal_code || ""}</p>
          <p style="margin: 5px 0; color: #475569;"><strong>To:</strong> ${invoiceData.destination?.city || "N/A"}, ${invoiceData.destination?.province || ""} ${invoiceData.destination?.postal_code || ""}</p>
          <p style="margin: 5px 0; color: #475569;"><strong>Package:</strong> ${invoiceData.package?.length || "N/A"} x ${invoiceData.package?.width || "N/A"} x ${invoiceData.package?.height || "N/A"} cm, ${invoiceData.package?.weight || "N/A"} kg</p>
        </div>
        
        <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #1e40af; margin-top: 0;">\u{1F4E6} Tracking Information</h4>
          <p style="margin: 5px 0; color: #1e40af;"><strong>Provisional Tracking Number:</strong></p>
          <p style="font-family: monospace; font-size: 18px; color: #1e40af; font-weight: bold; margin: 5px 0;">${trackingNumber}</p>
          <p style="color: #1e40af; font-size: 14px; margin: 5px 0;">* Final tracking number will be provided upon shipment processing</p>
        </div>
        
        <p style="color: #475569; line-height: 1.6;">
          Please keep this email and tracking number for your records. You can contact us at 647-339-0222 if you have any questions.
        </p>
        
        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #1e293b; margin-top: 0;">\u{1F4E4} Sender Information:</h4>
          <p style="margin: 5px 0; color: #475569;"><strong>Name:</strong> Topping Courier Inc.</p>
          <p style="margin: 5px 0; color: #475569;"><strong>Company:</strong> Topping Courier Inc.</p>
          <p style="margin: 5px 0; color: #475569;"><strong>Address:</strong> 87 Windrow Street</p>
          <p style="margin: 5px 0; color: #475569;"><strong>Phone:</strong> 647-339-0222</p>
          <p style="margin: 5px 0; color: #475569;"><strong>Email:</strong> info@toppingcourier.ca</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #64748b; font-size: 14px;">
            Best regards,<br>
            <strong>Topping Courier Inc.</strong><br>
            87 Windrow Street<br>
            Tel: 647-339-0222<br>
            Email: info@toppingcourier.ca<br>
            Website: www.toppingcourier.ca
          </p>
        </div>
      </div>
    </div>
  `;
  const companyEmailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New Invoice Generated</h1>
        <p style="margin: 5px 0 0 0;">Topping Express - Internal Notification</p>
      </div>
      
      <div style="padding: 30px 20px; background-color: #f8fafc;">
        <h2 style="color: #1e293b; margin-bottom: 20px;">Invoice Notification</h2>
        
        <p style="color: #475569; line-height: 1.6;">
          A new invoice has been generated for customer: <strong>${customerName}</strong>
        </p>
        
        <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">\u{1F4CB} Invoice Details:</h3>
          <p style="margin: 5px 0;"><strong>Invoice:</strong> ${invoiceNumber}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${invoiceData.customerInfo.phone || "N/A"}</p>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${invoiceData.customerInfo.company || "N/A"}</p>
          <p style="margin: 5px 0;"><strong>Total:</strong> $${totalAmount} CAD</p>
          <p style="margin: 5px 0;"><strong>Service:</strong> ${invoiceData.selectedService.service_name}</p>
          <p style="margin: 5px 0;"><strong>Tracking:</strong> ${trackingNumber}</p>
        </div>
        
        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #1e293b; margin-top: 0;">\u{1F4E6} Shipment Details:</h4>
          <p style="margin: 5px 0; color: #475569;"><strong>From:</strong> ${invoiceData.origin?.city || "N/A"}, ${invoiceData.origin?.province || ""}</p>
          <p style="margin: 5px 0; color: #475569;"><strong>To:</strong> ${invoiceData.destination?.city || "N/A"}, ${invoiceData.destination?.province || ""}</p>
          <p style="margin: 5px 0; color: #475569;"><strong>Package:</strong> ${invoiceData.package?.weight || "N/A"} kg, ${invoiceData.package?.length || "N/A"}x${invoiceData.package?.width || "N/A"}x${invoiceData.package?.height || "N/A"} cm</p>
          <p style="margin: 5px 0; color: #475569;"><strong>Carrier:</strong> ${invoiceData.selectedService.carrier}</p>
        </div>
        
        <p style="color: #475569; line-height: 1.6;">
          The invoice has been automatically sent to the customer at ${customerEmail}.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #64748b; font-size: 14px;">
            <strong>Topping Courier Inc.</strong><br>
            87 Windrow Street<br>
            Tel: 647-339-0222<br>
            Email: info@toppingcourier.ca
          </p>
        </div>
      </div>
    </div>
  `;
  try {
    const customerEmailSent = await sendEmail({
      to: customerEmail,
      from: "info@toppingcourier.ca",
      subject: `Invoice ${invoiceNumber} - Topping Courier`,
      html: customerEmailHTML,
      attachments: [pdfAttachment]
    });
    const companyEmailSent = await sendEmail({
      to: companyEmail,
      from: "info@toppingcourier.ca",
      subject: `New Invoice Generated: ${invoiceNumber}`,
      html: companyEmailHTML,
      attachments: [pdfAttachment]
    });
    return customerEmailSent && companyEmailSent;
  } catch (error) {
    console.error("Failed to send invoice emails:", error);
    return false;
  }
}

// server/routes.ts
import fs from "fs";
import path from "path";
var SHIPPING_API_URL = "https://ship.stallionexpress.ca/api/v4/rates";
async function generateOrderInvoicePDF(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      const logoPath = path.join(process.cwd(), "attached_assets", "Topping-Courier-PNG_070319_1756363417572.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 80, height: 40 });
        doc.fontSize(24).fillColor("#2563eb").text("Topping Courier Inc.", 140, 50);
        doc.fontSize(14).fillColor("#ea580c").text("Topping Express", 140, 75);
        doc.fontSize(12).fillColor("#6b7280").text("87 Windrow Street, Richmond Hill, ON", 140, 95);
        doc.text("Tel: 647-339-0222 | Email: info@toppingcourier.ca", 140, 110);
      } else {
        doc.fontSize(24).fillColor("#2563eb").text("Topping Courier Inc.", 50, 50);
        doc.fontSize(12).fillColor("#6b7280").text("87 Windrow Street, Richmond Hill, ON", 50, 80);
        doc.text("Tel: 647-339-0222 | Email: info@toppingcourier.ca", 50, 95);
      }
    } catch (error) {
      console.log("Logo not found, using text header");
      doc.fontSize(24).fillColor("#2563eb").text("Topping Courier Inc.", 50, 50);
      doc.fontSize(12).fillColor("#6b7280").text("87 Windrow Street, Richmond Hill, ON", 50, 80);
      doc.text("Tel: 647-339-0222 | Email: info@toppingcourier.ca", 50, 95);
    }
    doc.fontSize(20).fillColor("#1f2937").text("SHIPPING ORDER", 400, 50);
    doc.fontSize(12).fillColor("#6b7280");
    doc.text(`Order #: ${order.orderNumber}`, 400, 80);
    doc.text(`Date: ${order.date}`, 400, 95);
    doc.rect(50, 145, 500, 40).fillAndStroke("#dbeafe", "#3b82f6");
    doc.fontSize(14).fillColor("#1e40af").text("Tracking Number:", 60, 155);
    doc.fontSize(16).font("Courier").text(order.trackingNumber, 60, 170);
    doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("Recipient Information:", 50, 215);
    doc.fontSize(12).fillColor("#6b7280").font("Helvetica");
    doc.text(`Name: ${order.recipient.fullName}`, 50, 235);
    if (order.recipient.company) doc.text(`Company: ${order.recipient.company}`, 50, 250);
    doc.text(`Email: ${order.recipient.email}`, 50, order.recipient.company ? 265 : 250);
    doc.text(`Phone: ${order.recipient.phone}`, 50, order.recipient.company ? 280 : 265);
    const yPos = order.recipient.company ? 310 : 295;
    doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("From Address:", 50, yPos);
    doc.fontSize(12).fillColor("#6b7280").font("Helvetica");
    doc.text(`${order.sender.fullName}`, 50, yPos + 20);
    if (order.sender.company) doc.text(order.sender.company, 50, yPos + 35);
    doc.text(order.sender.address1, 50, yPos + (order.sender.company ? 50 : 35));
    if (order.sender.address2) doc.text(order.sender.address2, 50, yPos + (order.sender.company ? 65 : 50));
    doc.text(`${order.sender.city}, ${order.sender.province} ${order.sender.postalCode}`, 50, yPos + (order.sender.address2 ? 80 : order.sender.company ? 65 : 50));
    doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("To Address:", 300, yPos);
    doc.fontSize(12).fillColor("#6b7280").font("Helvetica");
    doc.text(`${order.recipient.fullName}`, 300, yPos + 20);
    if (order.recipient.company) doc.text(order.recipient.company, 300, yPos + 35);
    doc.text(order.recipient.address1, 300, yPos + (order.recipient.company ? 50 : 35));
    if (order.recipient.address2) doc.text(order.recipient.address2, 300, yPos + (order.recipient.company ? 65 : 50));
    doc.text(`${order.recipient.city}, ${order.recipient.province} ${order.recipient.postalCode}`, 300, yPos + (order.recipient.address2 ? 80 : order.recipient.company ? 65 : 50));
    const packageY = yPos + 110;
    doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("Package Details:", 50, packageY);
    doc.fontSize(12).fillColor("#6b7280").font("Helvetica");
    doc.text(`Dimensions: ${order.package.length} x ${order.package.width} x ${order.package.height} cm`, 50, packageY + 20);
    doc.text(`Weight: ${order.package.weight} kg`, 50, packageY + 35);
    doc.text(`Declared Value: $${order.package.value || 100} CAD`, 50, packageY + 50);
    doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("Shipping Service:", 50, packageY + 80);
    doc.fontSize(12).fillColor("#6b7280").font("Helvetica");
    doc.text(`Service: ${order.selectedService?.service_name || "Standard Service"}`, 50, packageY + 100);
    doc.text(`Carrier: ${order.selectedService?.carrier || "Unknown Carrier"}`, 50, packageY + 115);
    doc.text(`Delivery: ${order.selectedService?.delivery_days || "N/A"} business days`, 50, packageY + 130);
    const tableY = packageY + 160;
    doc.rect(50, tableY, 500, 105).stroke("#e5e7eb");
    doc.rect(50, tableY, 500, 30).fillAndStroke("#f3f4f6", "#e5e7eb");
    doc.fontSize(12).fillColor("#1f2937").font("Helvetica-Bold").text("Pricing Breakdown", 60, tableY + 10);
    doc.fontSize(11).fillColor("#6b7280").font("Helvetica");
    const total = Number(order.selectedService?.total || 0);
    const pickupCost = 10;
    const subtotalWithTax = Math.max(0, total - pickupCost);
    const baseWithTax = subtotalWithTax / 1.13;
    const tax = Math.max(0, subtotalWithTax - baseWithTax);
    doc.text("Shipping Service", 60, tableY + 45);
    doc.text(`$${baseWithTax.toFixed(2)}`, 450, tableY + 45);
    doc.text("Pickup Service", 60, tableY + 60);
    doc.text(`$${pickupCost.toFixed(2)}`, 450, tableY + 60);
    doc.text("Tax (13%)", 60, tableY + 75);
    doc.text(`$${tax.toFixed(2)}`, 450, tableY + 75);
    doc.rect(50, tableY + 90, 500, 25).fillAndStroke("#dbeafe", "#3b82f6");
    doc.fontSize(12).fillColor("#1e40af").font("Helvetica-Bold");
    doc.text("TOTAL", 60, tableY + 100);
    doc.text(`$${total.toFixed(2)} CAD`, 430, tableY + 100);
    doc.fontSize(10).fillColor("#9ca3af").text(
      "Thank you for choosing Topping Courier Inc. For questions, contact us at 647-339-0222 or info@toppingcourier.ca",
      50,
      tableY + 145,
      { width: 500, align: "center" }
    );
    doc.end();
  });
}
async function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      const logoPath = path.join(process.cwd(), "attached_assets", "Topping-Courier-PNG_070319_1756363417572.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 80, height: 40 });
        doc.fontSize(24).fillColor("#2563eb").text("Topping Courier Inc.", 140, 50);
        doc.fontSize(14).fillColor("#ea580c").text("Topping Express", 140, 75);
        doc.fontSize(12).fillColor("#6b7280").text("87 Windrow Street", 140, 95);
        doc.text("Tel: 647-339-0222", 140, 110);
      } else {
        doc.fontSize(24).fillColor("#2563eb").text("Topping Courier Inc.", 50, 50);
        doc.fontSize(12).fillColor("#6b7280").text("87 Windrow Street", 50, 80);
        doc.text("Tel: 647-339-0222", 50, 95);
      }
    } catch (error) {
      console.log("Logo not found, using text header");
      doc.fontSize(24).fillColor("#2563eb").text("Topping Courier Inc.", 50, 50);
      doc.fontSize(12).fillColor("#6b7280").text("87 Windrow Street", 50, 80);
      doc.text("Tel: 647-339-0222", 50, 95);
    }
    doc.fontSize(20).fillColor("#1f2937").text("INVOICE", 400, 50);
    doc.fontSize(12).fillColor("#6b7280");
    doc.text(`Invoice #: ${invoice.number}`, 400, 80);
    doc.text(`Date: ${invoice.date}`, 400, 95);
    doc.rect(50, 130, 500, 40).fillAndStroke("#dbeafe", "#3b82f6");
    doc.fontSize(14).fillColor("#1e40af").text("Provisional Tracking Number:", 60, 140);
    doc.fontSize(16).font("Courier").text(invoice.provisionalTracking, 60, 155);
    doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("Customer Information:", 50, 200);
    doc.fontSize(12).fillColor("#6b7280").font("Helvetica");
    doc.text(`Name: ${invoice.customerInfo.name}`, 50, 220);
    doc.text(`Email: ${invoice.customerInfo.email}`, 50, 235);
    if (invoice.customerInfo.phone) doc.text(`Phone: ${invoice.customerInfo.phone}`, 50, 250);
    if (invoice.customerInfo.company) doc.text(`Company: ${invoice.customerInfo.company}`, 50, 265);
    doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("Service Details:", 50, 300);
    doc.fontSize(12).fillColor("#6b7280").font("Helvetica");
    doc.text(`Carrier: ${invoice.selectedService.carrier}`, 50, 320);
    doc.text(`Service: ${invoice.selectedService.service_name}`, 50, 335);
    doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("Price Breakdown:", 50, 370);
    doc.fontSize(12).fillColor("#6b7280").font("Helvetica");
    const startY = 390;
    doc.text(`Base Rate:`, 50, startY);
    doc.text(`$${invoice.selectedService.base.toFixed(2)}`, 450, startY);
    doc.text(`Markup (50%):`, 50, startY + 20);
    doc.text(`$${invoice.selectedService.markup.toFixed(2)}`, 450, startY + 20);
    doc.text(`Subtotal:`, 50, startY + 40);
    doc.text(`$${invoice.selectedService.subtotal.toFixed(2)}`, 450, startY + 40);
    doc.text(`Tax (13% HST):`, 50, startY + 60);
    doc.text(`$${invoice.selectedService.tax.toFixed(2)}`, 450, startY + 60);
    doc.moveTo(50, startY + 85).lineTo(500, startY + 85).stroke("#2563eb");
    doc.fontSize(16).fillColor("#1f2937").font("Helvetica-Bold");
    doc.text(`Total Amount:`, 50, startY + 95);
    doc.text(`$${invoice.selectedService.total.toFixed(2)} CAD`, 400, startY + 95);
    doc.end();
  });
}
async function registerRoutes(app2) {
  app2.get("/api/shipping/health", async (req, res) => {
    try {
      const shippingToken = process.env.STALLION_API_TOKEN || process.env.STALLION_TOKEN;
      if (!shippingToken) {
        return res.status(500).json({ ok: false, message: "API token not configured" });
      }
      const testResponse = await fetch(SHIPPING_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${shippingToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from_address: { country_code: "CA", postal_code: "M5V3A8" },
          to_address: { country_code: "CA", postal_code: "V6B1A1" },
          parcels: [{ weight: 1, length: 10, width: 10, height: 10 }],
          weight_unit: "kg",
          size_unit: "cm",
          package_contents: "General merchandise",
          value: 100,
          currency: "CAD"
        })
      });
      res.json({ ok: testResponse.ok, status: testResponse.status });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });
  app2.post("/api/quote", async (req, res) => {
    try {
      const { origin, destination, package: packageInfo } = req.body;
      if (!origin?.country || !origin?.postalCode || !destination?.country || !destination?.postalCode || !packageInfo) {
        return res.status(400).json({ message: "Missing required fields: origin, destination, package" });
      }
      console.log("Quote request:", { origin, destination, packageInfo });
      const shippingToken = process.env.STALLION_API_TOKEN;
      if (!shippingToken) {
        return res.status(500).json({ message: "API token not configured" });
      }
      const cleanPostalCode = (postalCode, country) => {
        let cleaned = postalCode.trim().toUpperCase();
        if (country === "CA") {
          cleaned = cleaned.replace(/^(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\s*/, "");
        }
        cleaned = cleaned.replace(/\s+/g, "");
        return cleaned;
      };
      const shippingRequest = {
        from_address: {
          country_code: origin.country,
          postal_code: cleanPostalCode(origin.postalCode, origin.country)
        },
        to_address: {
          country_code: destination.country,
          postal_code: cleanPostalCode(destination.postalCode, destination.country)
        },
        weight: Number(packageInfo.weight),
        length: Number(packageInfo.length),
        width: Number(packageInfo.width),
        height: Number(packageInfo.height),
        weight_unit: "kg",
        size_unit: "cm",
        package_contents: "General merchandise",
        value: Number(packageInfo.value || 100),
        currency: "CAD"
      };
      console.log("Sending to Shipping API:", JSON.stringify(shippingRequest, null, 2));
      const shippingResponse = await fetch(SHIPPING_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${shippingToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(shippingRequest)
      });
      if (!shippingResponse.ok) {
        const errorText = await shippingResponse.text();
        console.error("Shipping API error:", errorText);
        return res.status(400).json({ message: "Failed to get shipping quotes" });
      }
      const shippingData = await shippingResponse.json();
      let rates = [];
      if (Array.isArray(shippingData)) {
        rates = shippingData;
      } else if (shippingData.rates && Array.isArray(shippingData.rates)) {
        rates = shippingData.rates;
      }
      console.log("Processing rates:", rates.length, "items");
      if (rates.length === 0) {
        return res.status(400).json({ message: "No shipping rates available" });
      }
      const services = rates.map((rate) => {
        const base = Number(rate.total || 0);
        const pickupCost = 10;
        const markup = Math.round(base * 0.5 * 100) / 100;
        const subtotalWithPickup = Math.round((base + markup + pickupCost) * 100) / 100;
        const tax = Math.round(subtotalWithPickup * 0.13 * 100) / 100;
        const total = Math.round((subtotalWithPickup + tax) * 100) / 100;
        return {
          service_name: rate.postage_type || "Standard Service",
          carrier: rate.carrier || "Unknown",
          delivery_days: rate.delivery_days || "5-7",
          base: total,
          // Show only final price to customer
          total
        };
      });
      console.log("Final services:", services.length);
      res.json({
        currency: "CAD",
        services
      });
    } catch (error) {
      console.error("Quote error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/shipping/quote", async (req, res) => {
    try {
      const { origin, destination, parcels } = req.body;
      if (!origin?.country || !origin?.postal_code || !destination?.country || !destination?.postal_code || !parcels?.length) {
        return res.status(400).json({ message: "Missing required fields: origin, destination, parcels" });
      }
      console.log("Received request:", { origin, destination, parcels });
      const shippingToken = process.env.STALLION_API_TOKEN || process.env.STALLION_TOKEN;
      if (!shippingToken) {
        return res.status(500).json({ message: "API token not configured" });
      }
      const cleanPostalCode = (postalCode, country) => {
        let cleaned = postalCode.trim().replace(/\s+/g, "").toUpperCase();
        if (country === "CA") {
          cleaned = cleaned.replace(/^(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)/, "");
        }
        return cleaned;
      };
      const firstParcel = parcels[0];
      const shippingRequest = {
        from_address: {
          country_code: origin.country,
          postal_code: cleanPostalCode(origin.postal_code, origin.country)
        },
        to_address: {
          country_code: destination.country,
          postal_code: cleanPostalCode(destination.postal_code, destination.country)
        },
        weight: Number(firstParcel.weight),
        length: Number(firstParcel.length),
        width: Number(firstParcel.width),
        height: Number(firstParcel.height),
        weight_unit: "kg",
        size_unit: "cm",
        package_contents: "General merchandise",
        value: 100,
        currency: "CAD"
      };
      console.log("Sending to Shipping API:", JSON.stringify(shippingRequest, null, 2));
      const shippingResponse = await fetch(SHIPPING_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${shippingToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(shippingRequest)
      });
      if (!shippingResponse.ok) {
        const errorText = await shippingResponse.text();
        console.error("Shipping API error status:", shippingResponse.status);
        console.error("Shipping API error response:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          console.error("Shipping API parsed error:", JSON.stringify(errorJson, null, 2));
        } catch (e) {
          console.error("Could not parse error as JSON");
        }
        return res.status(shippingResponse.status).json({ message: "Failed to get shipping rates from Stallion Express", details: errorText });
      }
      const shippingData = await shippingResponse.json();
      console.log("Shipping API response:", JSON.stringify(shippingData, null, 2));
      if (!shippingData.success || !shippingData.rates || shippingData.rates.length === 0) {
        return res.status(404).json({ message: "No shipping rates available for this route" });
      }
      const services = shippingData.rates.map((service) => {
        const base = Number(service.total || 0);
        const pickupCost = 10;
        const markup = base * 0.5;
        const subtotalWithPickup = base + markup + pickupCost;
        const tax = subtotalWithPickup * 0.13;
        const total = Number((subtotalWithPickup + tax).toFixed(2));
        let carrier = "Unknown";
        let serviceName = service.postage_type || "Standard Service";
        if (service.postage_type) {
          if (service.postage_type.includes("Canada Post")) {
            carrier = "Canada Post";
          } else if (service.postage_type.includes("UPS")) {
            carrier = "UPS";
          } else if (service.postage_type.includes("Fleet Optics")) {
            carrier = "Fleet Optics";
          }
        }
        return {
          carrier,
          service_code: service.postage_type_id?.toString() || "standard",
          service_name: serviceName,
          delivery_days: service.delivery_days,
          base: total,
          // Show only final price to customer
          total,
          raw: service
          // Keep original for debugging
        };
      });
      res.json({
        currency: "CAD",
        services
      });
    } catch (error) {
      console.error("Stallion quote error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/order", async (req, res) => {
    try {
      const { sender, recipient, package: packageInfo, selectedService } = req.body;
      if (!sender || !recipient || !packageInfo || !selectedService) {
        return res.status(400).json({ message: "Missing required order data" });
      }
      const orderId = randomUUID();
      const today = /* @__PURE__ */ new Date();
      const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
      const sequence = String(Date.now()).slice(-4);
      const orderNumber = `TC-${dateStr}-${sequence}`;
      const trackingNumber = `ST${Date.now()}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;
      const order = {
        id: orderId,
        orderNumber,
        date: today.toISOString().split("T")[0],
        sender,
        recipient,
        package: packageInfo,
        selectedService,
        trackingNumber,
        invoiceFilePath: `/invoices/${orderNumber}.pdf`
      };
      const savedOrder = await storage.saveOrder(order);
      const pdfBuffer = await generateOrderInvoicePDF(savedOrder);
      console.log(`\u{1F4E7} Order ${savedOrder.orderNumber} - Customer Contact Details:`);
      console.log(`   \u{1F4E4} Sender: ${sender.name} <${sender.email}> | Phone: ${sender.phone}`);
      console.log(`   \u{1F4E5} Recipient: ${recipient.name} <${recipient.email}> | Phone: ${recipient.phone}`);
      console.log(`   \u{1F4A1} Customer emails will be sent after domain verification`);
      try {
        await sendCustomerThankYouEmail(recipient.email, savedOrder, pdfBuffer);
        console.log(`\u2705 Recipient email sent to: ${recipient.email}`);
      } catch (error) {
        console.log(`\u26A0\uFE0F  Recipient email failed: ${recipient.email}`);
      }
      if (sender.email && sender.email !== recipient.email) {
        try {
          await sendCustomerThankYouEmail(sender.email, savedOrder, pdfBuffer);
          console.log(`\u2705 Sender email sent to: ${sender.email}`);
        } catch (error) {
          console.log(`\u26A0\uFE0F  Sender email failed: ${sender.email}`);
        }
      }
      try {
        const adminOrder = {
          ...savedOrder,
          customerNote: `Customer emails: Sender: ${sender.email}, Recipient: ${recipient.email}`
        };
        await sendAdminNotificationEmail(
          "info@toppingcourier.ca",
          adminOrder,
          pdfBuffer
        );
        console.log(`\u{1F4CB} Order ${savedOrder.orderNumber} - Customer Emails:`);
        console.log(`   \u{1F4E4} Sender: ${sender.email}`);
        console.log(`   \u{1F4E5} Recipient: ${recipient.email}`);
      } catch (error) {
        console.log("Admin email failed (non-critical):", error?.message || error);
      }
      res.json(savedOrder);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  app2.get("/api/order/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Failed to retrieve order" });
    }
  });
  app2.get("/api/order/:id/pdf", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const pdfBuffer = await generateOrderInvoicePDF(order);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });
  app2.post("/api/invoice", async (req, res) => {
    try {
      const { selectedService, customerInfo, origin, destination, package: packageInfo } = req.body;
      if (!selectedService || !customerInfo) {
        return res.status(400).json({ message: "Missing selectedService or customerInfo" });
      }
      const invoiceId = randomUUID();
      const today = /* @__PURE__ */ new Date();
      const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
      const sequence = String(Date.now()).slice(-4);
      const invoiceNumber = `TC-${dateStr}-${sequence}`;
      const provisionalTracking = `ST${Date.now().toString()}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;
      const invoice = {
        id: invoiceId,
        number: invoiceNumber,
        date: today.toISOString().split("T")[0],
        provisionalTracking,
        selectedService,
        customerInfo,
        origin,
        destination,
        package: packageInfo
      };
      const savedInvoice = await storage.saveInvoice(invoice);
      const pdfBuffer = await generateInvoicePDF(savedInvoice);
      const companyEmail = "info@toppingcourier.ca";
      if (customerInfo.email) {
        const emailSent = await sendInvoiceEmail(
          customerInfo.email,
          companyEmail,
          savedInvoice,
          pdfBuffer
        );
        if (emailSent) {
          console.log(`Invoice ${invoiceNumber} emailed to ${customerInfo.email} and ${companyEmail}`);
        } else {
          console.warn(`Failed to send invoice email for ${invoiceNumber}`);
        }
      }
      res.json({
        ...savedInvoice,
        invoiceNumber: savedInvoice.number,
        provisionalTracking: savedInvoice.provisionalTracking
      });
    } catch (error) {
      console.error("Invoice generation error:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });
  app2.get("/api/invoice/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Failed to retrieve invoice" });
    }
  });
  app2.get("/api/invoice/:id/pdf", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice.number}.pdf`);
      doc.pipe(res);
      doc.fontSize(24).text("Topping Courier Inc.", 50, 50);
      doc.fontSize(12).text("87 Windrow Street", 50, 80);
      doc.text("Tel: 647-339-0222", 50, 95);
      doc.fontSize(18).text("INVOICE", 400, 50);
      doc.fontSize(12).text(`Invoice #: ${invoice.number}`, 400, 80);
      doc.text(`Date: ${invoice.date}`, 400, 95);
      doc.fontSize(14).text("Bill To:", 50, 150);
      doc.fontSize(12).text(`${invoice.customerInfo.name}`, 50, 170);
      if (invoice.customerInfo.company) {
        doc.text(`${invoice.customerInfo.company}`, 50, 185);
        doc.text(`${invoice.customerInfo.email}`, 50, 200);
        doc.text(`${invoice.customerInfo.phone}`, 50, 215);
      } else {
        doc.text(`${invoice.customerInfo.email}`, 50, 185);
        doc.text(`${invoice.customerInfo.phone}`, 50, 200);
      }
      const serviceY = invoice.customerInfo.company ? 250 : 235;
      doc.fontSize(14).text("Service Details:", 50, serviceY);
      doc.fontSize(12).text(`Carrier: ${invoice.selectedService.carrier}`, 50, serviceY + 20);
      doc.text(`Service: ${invoice.selectedService.service_name}`, 50, serviceY + 35);
      if (invoice.selectedService.delivery_days) {
        doc.text(`Delivery: ${invoice.selectedService.delivery_days} business days`, 50, serviceY + 50);
      }
      const startY = serviceY + 85;
      doc.fontSize(14).text("Pricing Breakdown:", 50, startY);
      doc.fontSize(12).text(`Base Rate (Stallion): $${invoice.selectedService.base.toFixed(2)}`, 50, startY + 25);
      doc.text(`Service Markup (50%): $${invoice.selectedService.markup.toFixed(2)}`, 50, startY + 40);
      doc.text(`Subtotal: $${invoice.selectedService.subtotal.toFixed(2)}`, 50, startY + 55);
      doc.text(`Tax (13%): $${invoice.selectedService.tax.toFixed(2)}`, 50, startY + 70);
      doc.fontSize(16).text(`Total: $${invoice.selectedService.total.toFixed(2)} CAD`, 50, startY + 100);
      doc.fontSize(14).text("Tracking Information:", 50, startY + 140);
      doc.fontSize(12).text(`Provisional Tracking: ${invoice.provisionalTracking}`, 50, startY + 160);
      doc.text("(Final tracking number will be provided when shipment is processed)", 50, startY + 175);
      doc.end();
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });
  app2.post("/api/test-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address required" });
      }
      const testEmailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Topping Courier</h1>
            <p style="margin: 5px 0 0 0;">Test Email</p>
          </div>
          
          <div style="padding: 30px 20px; background-color: #f8fafc;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Email System Test</h2>
            
            <p style="color: #475569; line-height: 1.6;">
              This is a test message to verify the Topping Courier email system functionality.
            </p>
            
            <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #1e293b; margin-top: 0;">\u{1F4EC} Sender Information:</h4>
              <p style="margin: 5px 0; color: #475569;"><strong>Name:</strong> Topping Courier Inc.</p>
              <p style="margin: 5px 0; color: #475569;"><strong>Company:</strong> Topping Courier Inc.</p>
              <p style="margin: 5px 0; color: #475569;"><strong>Address:</strong> 87 Windrow Street</p>
              <p style="margin: 5px 0; color: #475569;"><strong>Phone:</strong> 647-339-0222</p>
              <p style="margin: 5px 0; color: #475569;"><strong>Email:</strong> info@toppingcourier.ca</p>
            </div>
            
            <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin-top: 0;">\u2705 Email System Working</h4>
              <p style="margin: 5px 0; color: #1e40af;">
                If you received this message, the email system is working properly!
              </p>
            </div>
            
            <p style="color: #475569; line-height: 1.6;">
              Now invoices will be automatically sent to customers and your company email.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px;">
                Best regards,<br>
                <strong>Topping Courier Inc.</strong><br>
                87 Windrow Street<br>
                Tel: 647-339-0222
              </p>
            </div>
          </div>
        </div>
      `;
      const emailSent = await sendEmail({
        to: email,
        from: "info@toppingcourier.ca",
        subject: "Topping Courier - Email System Test",
        html: testEmailHTML
      });
      if (emailSent) {
        res.json({
          success: true,
          message: `Test email sent successfully to ${email}`
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send test email"
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send test email"
      });
    }
  });
  app2.post("/api/track", async (req, res) => {
    try {
      const { trackingNumber } = req.body;
      if (!trackingNumber) {
        return res.status(400).json({ message: "Tracking number is required" });
      }
      const internalTrackingRegex = /^TC-\d{8}-\d{4}$/;
      if (internalTrackingRegex.test(trackingNumber)) {
        const orders = await storage.getAllOrders();
        const order = orders.find((o) => o.trackingNumber === trackingNumber);
        if (order) {
          return res.json({
            status: order.status || "confirmed",
            lastUpdate: order.date,
            location: "Topping Express Facility, Richmond Hill, ON",
            estimatedDelivery: "Within 1-3 business days",
            orderNumber: order.orderNumber,
            service: order.selectedService
          });
        }
      }
      try {
        const shippingResponse = await fetch(`${SHIPPING_API_URL}/tracking/${trackingNumber}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${process.env.STALLION_API_TOKEN}`,
            "Content-Type": "application/json"
          }
        });
        if (shippingResponse.ok) {
          const shippingData = await shippingResponse.json();
          return res.json(shippingData);
        }
      } catch (stallionError) {
        console.log("Stallion tracking API not available:", stallionError);
      }
      return res.status(404).json({
        message: "Tracking number not found. Please check the number and try again."
      });
    } catch (error) {
      console.error("Tracking error:", error);
      res.status(500).json({
        message: "Unable to track package at this time. Please try again later."
      });
    }
  });
  app2.post("/api/contact", async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({
          message: "Name, email, and message are required"
        });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Please provide a valid email address"
        });
      }
      const contactMessage = {
        id: randomUUID(),
        name,
        email,
        phone: phone || "",
        subject: subject || "",
        message,
        submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "new",
        read: false
      };
      await storage.saveContactMessage(contactMessage);
      const contactHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Topping Express</h1>
            <p style="margin: 5px 0 0 0;">New Contact Form Submission</p>
          </div>
          
          <div style="padding: 30px 20px; background-color: #f8fafc;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Contact Details</h2>
            
            <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 10px 0; color: #475569;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 10px 0; color: #475569;"><strong>Email:</strong> ${email}</p>
              ${phone ? `<p style="margin: 10px 0; color: #475569;"><strong>Phone:</strong> ${phone}</p>` : ""}
              ${subject ? `<p style="margin: 10px 0; color: #475569;"><strong>Subject:</strong> ${subject}</p>` : ""}
            </div>
            
            <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #1e293b; margin-top: 0;">Message:</h4>
              <p style="color: #475569; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px;">
                Submitted on ${(/* @__PURE__ */ new Date()).toLocaleString()}<br>
                <strong>Topping Express Contact System</strong>
              </p>
            </div>
          </div>
        </div>
      `;
      const adminEmailSent = await sendEmail({
        to: "info@toppingcourier.ca",
        from: "info@toppingcourier.ca",
        subject: `New Contact Form: ${subject || "General Inquiry"}`,
        html: contactHTML
      });
      const customerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Topping Express</h1>
            <p style="margin: 5px 0 0 0;">Thank You for Contacting Us</p>
          </div>
          
          <div style="padding: 30px 20px; background-color: #f8fafc;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Hi ${name},</h2>
            
            <p style="color: #475569; line-height: 1.6;">
              Thank you for reaching out to Topping Express! We have received your message and will get back to you within 24 hours.
            </p>
            
            <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin-top: 0;">Your Message Summary:</h4>
              ${subject ? `<p style="margin: 5px 0; color: #1e40af;"><strong>Subject:</strong> ${subject}</p>` : ""}
              <p style="margin: 5px 0; color: #1e40af;"><strong>Submitted:</strong> ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
            </div>
            
            <p style="color: #475569; line-height: 1.6;">
              If you need immediate assistance, please call us at <strong>647-339-0222</strong> during business hours.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px;">
                Best regards,<br>
                <strong>Topping Express Team</strong><br>
                87 Windrow Street, Richmond Hill, ON<br>
                Tel: 647-339-0222 | Email: info@toppingcourier.ca
              </p>
            </div>
          </div>
        </div>
      `;
      const customerEmailSent = await sendEmail({
        to: email,
        from: "info@toppingcourier.ca",
        subject: "Thank you for contacting Topping Express",
        html: customerHTML
      });
      res.json({
        success: true,
        message: "Message sent successfully! We will get back to you soon.",
        messageId: contactMessage.id
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send message. Please try again later."
      });
    }
  });
  app2.get("/api/admin/contact-messages", async (req, res) => {
    try {
      const messages = await storage.getAllContactMessages();
      const sortedMessages = messages.sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      res.json(sortedMessages);
    } catch (error) {
      console.error("Get contact messages error:", error);
      res.status(500).json({
        message: "Failed to retrieve contact messages"
      });
    }
  });
  app2.patch("/api/admin/contact-messages/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const message = await storage.getContactMessage(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      message.read = true;
      await storage.saveContactMessage(message);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark message read error:", error);
      res.status(500).json({
        message: "Failed to mark message as read"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
