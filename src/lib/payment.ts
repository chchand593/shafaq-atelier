// Payment abstraction layer for ShafaQ Atelier.
// Three payment paths:
//   1. COD — fully functional, customer pays in cash on delivery.
//   2. Manual Bank/JazzCash Transfer — customer pays out-of-band, supplies a
//      transaction/reference ID, admin manually verifies and marks as paid.
//   3. Automatic JazzCash Gateway — uses real JazzCash merchant credentials
//      (env vars). Remains DISABLED until real credentials are configured.

import {
  isJazzCashConfigured,
  createJazzCashPayment,
  verifyJazzCashCallback,
  type JazzCashPaymentRequest,
} from "@/lib/jazzcash";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaymentMethod = "cod" | "bank_transfer" | "online";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentResult = {
  success: boolean;
  paymentStatus: PaymentStatus;
  method: PaymentMethod;
  message?: string;
  gatewayReference?: string;
  paymentProvider?: string;
  redirectUrl?: string;
  postData?: Record<string, string>;
};

// ---------------------------------------------------------------------------
// Gateway configuration detection (automatic JazzCash only)
// ---------------------------------------------------------------------------

/**
 * Check whether automatic JazzCash gateway credentials are configured.
 * This is INDEPENDENT of the manual bank transfer option — manual transfer
 * can be enabled via store settings while automatic gateway stays off.
 */
export function isOnlinePaymentConfigured(): boolean {
  return isJazzCashConfigured();
}

/**
 * Get the configured automatic gateway name (or null).
 */
export function getPaymentGateway(): string | null {
  return isJazzCashConfigured() ? "jazzcash" : null;
}

/**
 * Check if a payment method is available based on the method name.
 * NOTE: For `bank_transfer`, the caller (API layer) must additionally check
 * the StoreSettings.manualTransferEnabled flag — this function only validates
 * the method name is one of the known payment methods. Same for `cod` (caller
 * must check settings.codEnabled).
 */
export function isPaymentMethodAvailable(method: string): boolean {
  return method === "cod" || method === "bank_transfer" || method === "online";
}

// ---------------------------------------------------------------------------
// Payment processing
// ---------------------------------------------------------------------------

/**
 * Process a payment for an order.
 *
 * COD: always succeeds, paymentStatus = "pending" (paid on delivery).
 * Bank Transfer: succeeds, paymentStatus = "pending" (admin verifies later).
 *   The customer-supplied transaction/reference ID is stored on the Order
 *   record by the API layer, NOT here.
 * Online: initiates payment via automatic JazzCash gateway, returns redirect
 *   data. The webhook confirms the payment later — NEVER marks as paid here.
 */
export function processPayment(
  method: PaymentMethod,
  amount: number,
  gatewayData?: {
    orderNumber?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    description?: string;
  }
): PaymentResult {
  switch (method) {
    case "cod":
      return {
        success: true,
        paymentStatus: "pending",
        method: "cod",
        message: "Cash on Delivery — payment due on delivery.",
      };

    case "bank_transfer":
      // Manual transfer — no automatic gateway. Order is created with
      // paymentStatus=pending; admin manually verifies the customer-supplied
      // transaction/reference ID and marks as paid.
      return {
        success: true,
        paymentStatus: "pending",
        method: "bank_transfer",
        paymentProvider: "bank_transfer",
        message: "Manual bank/JazzCash transfer — awaiting customer payment reference and admin verification.",
      };

    case "online":
      if (!isOnlinePaymentConfigured()) {
        return {
          success: false,
          paymentStatus: "failed",
          method: "online",
          message:
            "Online payment is not yet available. Please select Cash on Delivery or Manual Bank Transfer.",
        };
      }

      // Initiate JazzCash automatic gateway payment
      const jcRequest: JazzCashPaymentRequest = {
        orderNumber: gatewayData?.orderNumber || "",
        amount,
        customerName: gatewayData?.customerName || "",
        customerEmail: gatewayData?.customerEmail || "",
        customerPhone: gatewayData?.customerPhone || "",
        description: gatewayData?.description || "ShafaQ Atelier Order",
      };

      const jcResponse = createJazzCashPayment(jcRequest);
      if (!jcResponse.success) {
        return {
          success: false,
          paymentStatus: "failed",
          method: "online",
          message: jcResponse.message || "Failed to initiate payment.",
        };
      }

      return {
        success: true,
        paymentStatus: "pending",
        method: "online",
        gatewayReference: jcResponse.paymentReference,
        paymentProvider: "jazzcash",
        redirectUrl: jcResponse.redirectUrl,
        postData: jcResponse.postData,
        message: "Payment initiated — redirecting to JazzCash.",
      };

    default:
      return {
        success: false,
        paymentStatus: "failed",
        method: method as PaymentMethod,
        message: "Unsupported payment method.",
      };
  }
}

// ---------------------------------------------------------------------------
// Webhook verification (automatic JazzCash gateway only)
// ---------------------------------------------------------------------------

export type WebhookVerificationResult = {
  valid: boolean;
  orderNumber?: string;
  paymentReference?: string;
  amount?: number;
  status?: PaymentStatus;
  responseCode?: string;
  responseMessage?: string;
  message?: string;
};

/**
 * Verify a gateway webhook/callback payload.
 * Delegates to JazzCash callback verification which checks the cryptographic signature.
 * Only used for the AUTOMATIC JazzCash gateway — manual bank transfer does NOT
 * use webhooks; admin verifies manually via /api/admin/orders/[id].
 */
export function verifyWebhookPayload(
  payload: Record<string, string>,
  _signature?: string
): WebhookVerificationResult {
  if (!isOnlinePaymentConfigured()) {
    return { valid: false, message: "Online payment not configured." };
  }

  const result = verifyJazzCashCallback(payload);
  if (!result.valid) {
    return {
      valid: false,
      message: result.message || "Webhook verification failed.",
    };
  }

  return {
    valid: true,
    orderNumber: result.orderNumber,
    paymentReference: result.paymentReference,
    amount: result.amount,
    status: result.status as PaymentStatus,
    responseCode: result.responseCode,
    responseMessage: result.responseMessage,
  };
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

export function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case "pending": return "Pending";
    case "paid": return "Paid";
    case "failed": return "Failed";
    case "refunded": return "Refunded";
    default: return status;
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "paid": return "bg-green-500/15 text-green-700";
    case "pending": return "bg-amber-500/15 text-amber-700";
    case "failed": return "bg-red-500/15 text-red-700";
    case "refunded": return "bg-blue-500/15 text-blue-700";
    default: return "bg-secondary";
  }
}

// Human-readable label for the payment method shown in admin UI.
export function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case "cod": return "Cash on Delivery";
    case "bank_transfer": return "JazzCash / Bank Transfer";
    case "online": return "Online Payment";
    default: return method;
  }
}

