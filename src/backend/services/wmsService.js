import Warehouse from '../models/Warehouse';
import AdminAlert from '../models/AdminAlert';
import nodemailer from 'nodemailer';

/**
 * WMS Service — shared utilities for WMS ↔ E-commerce synchronization.
 */

const WMS_API_KEY = process.env.WMS_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@exporthub.com';

/**
 * Validate the WMS API key from the request header.
 */
export function validateWmsApiKey(req) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== WMS_API_KEY) {
    return false;
  }
  return true;
}

/**
 * Resolve a WMS warehouse code (e.g., 'NP', 'UK', 'GB') to a MongoDB warehouse document.
 */
export async function resolveWarehouse(warehouseCode) {
  const code = warehouseCode.toUpperCase();
  
  // Try countryCode first
  let warehouse = await Warehouse.findOne({ countryCode: code, status: 'Active' });

  // 2. Fallback to default
  if (!warehouse) {
    if (code === 'GB') {
      warehouse = await Warehouse.findOne({ name: /uk/i, status: 'Active' });
    } else {
      warehouse = await Warehouse.findOne({ name: /nepal/i, status: 'Active' });
    }
  }

  return warehouse;
}

/**
 * Create an admin alert and optionally send an email notification.
 */
export async function createAdminAlert({ type, severity, title, message, metadata = {} }) {
  const alert = await AdminAlert.create({
    type,
    severity,
    title,
    message,
    metadata,
  });

  // Send email for warning and critical alerts
  if (severity === 'warning' || severity === 'critical') {
    try {
      await sendAlertEmail(alert);
      alert.emailSent = true;
      await alert.save();
    } catch (err) {
      console.error('Failed to send alert email:', err.message);
    }
  }

  return alert;
}

/**
 * Send an alert email via nodemailer.
 * Uses environment variables for SMTP configuration.
 */
async function sendAlertEmail(alert) {
  // Only attempt if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    console.log('[WMS Alert Email] SMTP not configured, skipping email. Alert:', alert.title);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const severityColors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444',
  };

  await transporter.sendMail({
    from: `"ExportHub Alerts" <${process.env.SMTP_USER || 'noreply@exporthub.com'}>`,
    to: ADMIN_EMAIL,
    subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${severityColors[alert.severity] || '#666'}; padding: 16px 24px; color: white;">
          <h2 style="margin: 0; font-size: 18px;">${alert.title}</h2>
          <p style="margin: 4px 0 0; opacity: 0.9; font-size: 12px; text-transform: uppercase;">${alert.type} · ${alert.severity}</p>
        </div>
        <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <p style="margin: 0 0 16px; color: #374151;">${alert.message}</p>
          ${alert.metadata ? `
            <div style="background: white; border: 1px solid #e5e7eb; padding: 12px; border-radius: 4px;">
              <pre style="margin: 0; font-size: 12px; color: #6b7280; white-space: pre-wrap;">${JSON.stringify(alert.metadata, null, 2)}</pre>
            </div>
          ` : ''}
          <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af;">
            Generated at ${new Date().toISOString()} · ExportHub WMS
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Stub: Notify the WMS that an order has been allocated.
 * In production, this would POST to the WMS webhook URL.
 */
export async function notifyWmsOrderAllocated(orderData) {
  // In production, POST to WMS_WEBHOOK_URL
  console.log('[WMS Sync] Order allocated to warehouse:', {
    orderNumber: orderData.orderNumber,
    warehouseId: orderData.warehouseId,
    items: orderData.items?.length || 0,
  });
  
  // Stub: always return success
  return { success: true, message: 'Order allocation notification sent (stub)' };
}
