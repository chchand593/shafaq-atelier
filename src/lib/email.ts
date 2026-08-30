// Mock email service for the ShafaQ Atelier store.
// In production this would integrate with Resend/SendGrid.
// For now it logs emails to the server console and an in-memory list
// that can be inspected for QA.

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: "order_confirmation" | "order_status" | "welcome";
  meta?: Record<string, unknown>;
  sentAt: Date;
};

// In-memory log of sent emails (dev only)
const emailLog: EmailMessage[] = [];

export function getEmailLog(): EmailMessage[] {
  return [...emailLog];
}

export function clearEmailLog() {
  emailLog.length = 0;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPKR(value: number) {
  return "PKR " + value.toLocaleString("en-PK");
}

export async function sendOrderConfirmation(params: {
  email: string;
  fullName: string;
  orderNumber: string;
  total: number;
  items: Array<{ name: string; qty: number; price: number; colorName: string; size: string }>;
  payment: string;
  estimatedDelivery: string;
}) {
  const itemsHtml = params.items
    .map(
      (it) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(
          it.name
        )} <span style="color:#888;font-size:12px">(${escapeHtml(it.colorName)}, ${escapeHtml(it.size)})</span></td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">×${it.qty}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPKR(it.price * it.qty)}</td></tr>`
    )
    .join("");

  const html = `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#fdfbf7;padding:32px;color:#1a1a1a">
  <div style="text-align:center;margin-bottom:24px">
    <span style="font-size:24px;letter-spacing:3px;font-weight:600">SHAFAQ</span>
    <span style="display:block;font-size:10px;letter-spacing:4px;color:#c5a065;text-transform:uppercase">ATELIER</span>
  </div>
  <h1 style="font-size:22px;font-weight:400;margin:0 0 8px">Thank you for your order, ${escapeHtml(params.fullName)}</h1>
  <p style="color:#666;margin:0 0 24px">Your abaya is being prepared with care. Here is a summary of your order.</p>
  <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:20px;margin-bottom:20px">
    <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:2px">Order Number</p>
    <p style="margin:0 0 16px;font-weight:600">${escapeHtml(params.orderNumber)}</p>
    <table style="width:100%;font-size:14px">
      <thead><tr><th style="text-align:left;padding:8px 0;border-bottom:2px solid #eee;font-weight:600">Item</th><th style="padding:8px 0;border-bottom:2px solid #eee;text-align:right;font-weight:600">Qty</th><th style="padding:8px 0;border-bottom:2px solid #eee;text-align:right;font-weight:600">Total</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p style="margin:16px 0 0;font-size:16px;font-weight:600;text-align:right">Total: ${formatPKR(params.total)}</p>
  </div>
  <p style="margin:0 0 8px"><strong>Payment:</strong> ${escapeHtml(params.payment)}</p>
  <p style="margin:0 0 8px"><strong>Estimated delivery:</strong> ${escapeHtml(params.estimatedDelivery)}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
  <p style="color:#888;font-size:12px;margin:0">Your Style, Your Modesty, Your Abaya — ShafaQ Atelier</p>
</div>`;

  const text = `Thank you for your order, ${params.fullName}.\n\nOrder: ${params.orderNumber}\nTotal: ${formatPKR(params.total)}\nPayment: ${params.payment}\nEstimated delivery: ${params.estimatedDelivery}\n\nYour Style, Your Modesty, Your Abaya — ShafaQ Atelier`;

  const message: EmailMessage = {
    to: params.email,
    subject: `Order ${params.orderNumber} confirmed — ShafaQ Atelier`,
    html,
    text,
    template: "order_confirmation",
    meta: { orderNumber: params.orderNumber, total: params.total },
    sentAt: new Date(),
  };
  emailLog.push(message);
  console.log(`[EMAIL] Order confirmation sent to ${params.email} for ${params.orderNumber}`);
  return message;
}

export async function sendOrderStatusUpdate(params: {
  email: string;
  fullName: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  total: number;
}) {
  const statusMessages: Record<string, string> = {
    shipped: "Your order has been dispatched and is on its way to you.",
    delivered: "Your order has been delivered. We hope you love your new abaya!",
    cancelled: "Your order has been cancelled. If you have questions, please contact us.",
    processing: "Your order is now being prepared with care.",
  };

  const html = `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#fdfbf7;padding:32px;color:#1a1a1a">
  <div style="text-align:center;margin-bottom:24px">
    <span style="font-size:24px;letter-spacing:3px;font-weight:600">SHAFAQ</span>
    <span style="display:block;font-size:10px;letter-spacing:4px;color:#c5a065;text-transform:uppercase">ATELIER</span>
  </div>
  <h1 style="font-size:22px;font-weight:400;margin:0 0 8px">Order ${escapeHtml(params.orderNumber)} update</h1>
  <p style="color:#666;margin:0 0 24px">Hello ${escapeHtml(params.fullName)},</p>
  <p style="font-size:16px">${statusMessages[params.newStatus] || `Your order status is now: ${escapeHtml(params.newStatus)}.`}</p>
  <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:16px;margin:20px 0">
    <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:2px">Order</p>
    <p style="margin:0;font-weight:600">${escapeHtml(params.orderNumber)}</p>
    <p style="margin:8px 0 0;color:#666">Status: <strong style="text-transform:capitalize">${escapeHtml(params.newStatus)}</strong></p>
  </div>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
  <p style="color:#888;font-size:12px;margin:0">Your Style, Your Modesty, Your Abaya — ShafaQ Atelier</p>
</div>`;

  const text = `Order ${params.orderNumber} update.\n${statusMessages[params.newStatus] || `Status: ${params.newStatus}`}\n\nShafaQ Atelier`;

  const message: EmailMessage = {
    to: params.email,
    subject: `Order ${params.orderNumber} — ${params.newStatus} — ShafaQ Atelier`,
    html,
    text,
    template: "order_status",
    meta: { orderNumber: params.orderNumber, newStatus: params.newStatus },
    sentAt: new Date(),
  };
  emailLog.push(message);
  console.log(`[EMAIL] Order status update sent to ${params.email} for ${params.orderNumber}: ${params.newStatus}`);
  return message;
}
