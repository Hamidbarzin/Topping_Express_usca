// Email service using Postmark
import postmark from "postmark";
import { config } from "./config.js";

let postmarkClient = null;

// Initialize Postmark client
export function initMailer() {
  if (!config.postmarkApiKey) {
    console.log('[mailer] ⚠️  Postmark API key not configured - emails will be disabled');
    return null;
  }
  
  try {
    postmarkClient = new postmark.ServerClient(config.postmarkApiKey);
    console.log('[mailer] ✅ Postmark client initialized');
    return postmarkClient;
  } catch (error) {
    console.error('[mailer] ❌ Failed to initialize Postmark:', error.message);
    return null;
  }
}

// Send order confirmation to customer
export async function sendCustomerConfirmation(order) {
  if (!postmarkClient) {
    console.log('[mailer] Email disabled - skipping customer confirmation');
    return { success: false, reason: 'Email service not configured' };
  }
  
  try {
    const trackingUrl = order.tracking_number 
      ? `https://topping-express-usca.onrender.com/track/${order.tracking_number}`
      : 'Tracking number will be provided once shipment is processed';
    
    const result = await postmarkClient.sendEmail({
      From: config.postmarkFromEmail,
      To: order.recipient.email,
      Subject: `Order Confirmation - ${order.order_number}`,
      HtmlBody: `
        <h2>Thank you for your order!</h2>
        <p>Your order has been received and is being processed.</p>
        
        <h3>Order Details:</h3>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        ${order.tracking_number ? `<p><strong>Tracking Number:</strong> ${order.tracking_number}</p>` : ''}
        
        <h3>Shipping Information:</h3>
        <p><strong>From:</strong> ${order.sender.fullName}, ${order.sender.city}, ${order.sender.province}</p>
        <p><strong>To:</strong> ${order.recipient.fullName}, ${order.recipient.city}, ${order.recipient.province}</p>
        
        <h3>Package Details:</h3>
        <p><strong>Weight:</strong> ${order.package_info.weight} ${order.package_info.weightUnit}</p>
        <p><strong>Dimensions:</strong> ${order.package_info.length} x ${order.package_info.width} x ${order.package_info.height} ${order.package_info.dimensionUnit}</p>
        
        ${order.tracking_number ? `<p><a href="${trackingUrl}">Track your shipment</a></p>` : ''}
        
        <p>If you have any questions, please contact us at ${config.adminEmail}</p>
        
        <p>Best regards,<br>Topping Express Team</p>
      `,
      TextBody: `
Order Confirmation - ${order.order_number}

Thank you for your order!

Order Number: ${order.order_number}
Status: ${order.status}
${order.tracking_number ? `Tracking Number: ${order.tracking_number}` : ''}

From: ${order.sender.fullName}, ${order.sender.city}, ${order.sender.province}
To: ${order.recipient.fullName}, ${order.recipient.city}, ${order.recipient.province}

Package: ${order.package_info.weight} ${order.package_info.weightUnit}
Dimensions: ${order.package_info.length} x ${order.package_info.width} x ${order.package_info.height} ${order.package_info.dimensionUnit}

${order.tracking_number ? `Track: ${trackingUrl}` : ''}

Contact: ${config.adminEmail}
      `,
      MessageStream: 'outbound'
    });
    
    console.log('[mailer] ✅ Customer confirmation sent:', result.MessageID);
    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('[mailer] ❌ Failed to send customer confirmation:', error.message);
    return { success: false, error: error.message };
  }
}

// Send order notification to admin
export async function sendAdminNotification(order) {
  if (!postmarkClient) {
    console.log('[mailer] Email disabled - skipping admin notification');
    return { success: false, reason: 'Email service not configured' };
  }
  
  try {
    const result = await postmarkClient.sendEmail({
      From: config.postmarkFromEmail,
      To: config.adminEmail,
      Subject: `New Order Received - ${order.order_number}`,
      HtmlBody: `
        <h2>New Order Notification</h2>
        
        <h3>Order Details:</h3>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        ${order.tracking_number ? `<p><strong>Tracking Number:</strong> ${order.tracking_number}</p>` : ''}
        ${order.stallion_order_id ? `<p><strong>Stallion Order ID:</strong> ${order.stallion_order_id}</p>` : ''}
        
        <h3>Sender:</h3>
        <p>${order.sender.fullName}<br>
        ${order.sender.company ? `${order.sender.company}<br>` : ''}
        ${order.sender.address1}<br>
        ${order.sender.address2 ? `${order.sender.address2}<br>` : ''}
        ${order.sender.city}, ${order.sender.province} ${order.sender.postalCode}<br>
        ${order.sender.country}<br>
        Phone: ${order.sender.phone}<br>
        Email: ${order.sender.email}</p>
        
        <h3>Recipient:</h3>
        <p>${order.recipient.fullName}<br>
        ${order.recipient.company ? `${order.recipient.company}<br>` : ''}
        ${order.recipient.address1}<br>
        ${order.recipient.address2 ? `${order.recipient.address2}<br>` : ''}
        ${order.recipient.city}, ${order.recipient.province} ${order.recipient.postalCode}<br>
        ${order.recipient.country}<br>
        Phone: ${order.recipient.phone}<br>
        Email: ${order.recipient.email}</p>
        
        <h3>Package:</h3>
        <p><strong>Weight:</strong> ${order.package_info.weight} ${order.package_info.weightUnit}<br>
        <strong>Dimensions:</strong> ${order.package_info.length} x ${order.package_info.width} x ${order.package_info.height} ${order.package_info.dimensionUnit}<br>
        <strong>Type:</strong> ${order.package_info.packageType}<br>
        <strong>Description:</strong> ${order.package_info.description || 'N/A'}</p>
        
        <h3>Service:</h3>
        <p><strong>Carrier:</strong> ${order.service.carrier}<br>
        <strong>Service:</strong> ${order.service.serviceName}<br>
        <strong>Price:</strong> $${order.service.price}</p>
      `,
      MessageStream: 'outbound'
    });
    
    console.log('[mailer] ✅ Admin notification sent:', result.MessageID);
    return { success: true, messageId: result.MessageID };
  } catch (error) {
    console.error('[mailer] ❌ Failed to send admin notification:', error.message);
    return { success: false, error: error.message };
  }
}
