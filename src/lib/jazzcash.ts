// JazzCash payment gateway integration for ShafaQ Atelier.
// Supports: PKR, cards, bank transfers, mobile wallets.
// Sandbox: https://sandbox.jazzcash.com.pk
// Production: https://payments.jazzcash.com.pk
//
// Flow: Hosted Checkout (redirect-based)
// 1. Server creates payment request with signed payload
// 2. Customer redirected to JazzCash hosted page
// 3. Customer pays on JazzCash
// 4. JazzCash sends POST callback to our webhook
// 5. Server verifies callback signature
// 6. Server updates paymentStatus

import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JazzCashPaymentRequest = {
  orderNumber: string;
  amount: number; // in PKR (paisa = amount * 100)
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
};

export type JazzCashPaymentResponse = {
  success: boolean;
  redirectUrl?: string;
  paymentReference: string;
  postData?: Record<string, string>; // form fields to POST to gateway
  message?: string;
};

export type JazzCashCallbackData = {
  orderNumber: string;
  paymentReference: string;
  amount: number; // in paisa
  status: string;
  responseCode: string;
  responseMessage: string;
  signature: string;
};

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  const sandbox = process.env.PAYMENT_SANDBOX === "true";
  return sandbox
    ? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/transactionmanager.aspx"
    : "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/transactionmanager.aspx";
}

function getCredentials() {
  return {
    merchantId: process.env.PAYMENT_MERCHANT_ID || "",
    password: process.env.PAYMENT_API_KEY || "", // JazzCash calls this "Password"
    integritySalt: process.env.PAYMENT_SECRET || "", // JazzCash calls this "Integrity Salt"
    returnUrl: process.env.PAYMENT_RETURN_URL || "",
  };
}

/**
 * Check if JazzCash credentials are properly configured.
 */
export function isJazzCashConfigured(): boolean {
  const c = getCredentials();
  return !!(c.merchantId && c.password && c.integritySalt && c.returnUrl);
}

// ---------------------------------------------------------------------------
// Payment initiation
// ---------------------------------------------------------------------------

/**
 * Create a JazzCash payment request.
 * Returns the data to POST to the JazzCash hosted checkout page.
 * The customer is redirected there to complete payment.
 */
export function createJazzCashPayment(
  req: JazzCashPaymentRequest
): JazzCashPaymentResponse {
  const creds = getCredentials();
  const baseUrl = getBaseUrl();

  if (!isJazzCashConfigured()) {
    return {
      success: false,
      paymentReference: "",
      message: "JazzCash credentials not configured.",
    };
  }

  const paymentReference = `JC${Date.now()}${Math.random().toString(36).slice(-6).toUpperCase()}`;
  const amountPaisa = String(req.amount * 100);
  const expiryMinutes = 30;
  const expiryDateTime = new Date(Date.now() + expiryMinutes * 60 * 1000)
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14) + "00";

  // Build the form fields for JazzCash hosted checkout
  const fields: Record<string, string> = {
    pp_MerchantID: creds.merchantId,
    pp_Password: creds.password,
    pp_ReturnURL: creds.returnUrl,
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14) + "00",
    pp_TxnExpiryDateTime: expiryDateTime,
    pp_TxnRefNo: paymentReference,
    pp_Amount: amountPaisa,
    pp_BillReference: req.orderNumber,
    pp_Description: req.description.slice(0, 100),
    pp_Mobile: req.customerPhone.replace(/\D/g, "").slice(0, 13),
    pp_Email: req.customerEmail.slice(0, 100),
    pp_CNIC: "0000000000000", // optional for hosted checkout
    pp_Language: "EN",
    pp_SubMerchantID: "",
    pp_BankID: "",
    pp_ProductID: "",
    pp_TxnType: "MPAY",
  };

  // Generate the integrity hash (HMAC-SHA256)
  // JazzCash requires concatenating specific field values + Integrity Salt
  // and hashing with the salt as key
  const sortedValues = [
    creds.integritySalt,
    fields.pp_Amount,
    fields.pp_BillReference,
    fields.pp_Description,
    fields.pp_Language,
    fields.pp_MerchantID,
    fields.pp_Password,
    fields.pp_ReturnURL,
    fields.pp_TxnCurrency,
    fields.pp_TxnDateTime,
    fields.pp_TxnExpiryDateTime,
    fields.pp_TxnRefNo,
    fields.pp_CNIC,
    fields.pp_Mobile,
    fields.pp_Email,
    fields.pp_SubMerchantID,
    fields.pp_BankID,
    fields.pp_ProductID,
  ].join("&");

  const hash = crypto
    .createHmac("sha256", creds.integritySalt)
    .update(sortedValues)
    .digest("hex")
    .toUpperCase();

  fields.pp_SecureHash = hash;

  return {
    success: true,
    redirectUrl: baseUrl,
    paymentReference,
    postData: fields,
    message: "Payment initiated. Redirecting to JazzCash.",
  };
}

// ---------------------------------------------------------------------------
// Callback verification
// ---------------------------------------------------------------------------

/**
 * Verify a JazzCash callback/payment response.
 * JazzCash sends a POST to our return URL with payment result + signature.
 * We must verify the signature before trusting the result.
 */
export function verifyJazzCashCallback(
  formData: Record<string, string>
): {
  valid: boolean;
  orderNumber?: string;
  paymentReference?: string;
  amount?: number; // in PKR (converted from paisa)
  status: "paid" | "failed" | "pending";
  responseCode?: string;
  responseMessage?: string;
  message?: string;
} {
  const creds = getCredentials();

  // Extract the secure hash from the response
  const receivedHash = formData.pp_SecureHash || formData["pp_SecureHash"] || "";
  if (!receivedHash) {
    return { valid: false, status: "failed", message: "Missing secure hash." };
  }

  // Rebuild the hash from the response fields (excluding pp_SecureHash)
  const fieldsToHash: string[] = [creds.integritySalt];
  const fieldKeys = [
    "pp_Amount",
    "pp_BillReference",
    "pp_Language",
    "pp_MerchantID",
    "pp_Password",
    "pp_ReturnURL",
    "pp_TxnCurrency",
    "pp_TxnDateTime",
    "pp_TxnExpiryDateTime",
    "pp_TxnRefNo",
    "pp_CNIC",
    "pp_Mobile",
    "pp_Email",
    "pp_SubMerchantID",
    "pp_BankID",
    "pp_ProductID",
    "pp_TxnType",
  ];

  for (const key of fieldKeys) {
    if (formData[key]) {
      fieldsToHash.push(formData[key]);
    }
  }

  // Add response fields that JazzCash includes in the hash
  const responseFields = [
    "pp_ResponseCode",
    "pp_ResponseMessage",
    "pp_RetreivalReferenceNo",
    "pp_Amount",
  ];

  // JazzCash callback hash: salt + sorted response values
  // The exact fields depend on the API version. We use the documented approach:
  // Concat all field values in a specific order + salt, then HMAC-SHA256
  const allValues: string[] = [creds.integritySalt];

  // Add all form values in alphabetical order of keys (excluding pp_SecureHash)
  const sortedKeys = Object.keys(formData)
    .filter((k) => k !== "pp_SecureHash" && k !== "pp_Securehash" && formData[k])
    .sort();

  for (const key of sortedKeys) {
    allValues.push(formData[key]);
  }

  const expectedHash = crypto
    .createHmac("sha256", creds.integritySalt)
    .update(allValues.join("&"))
    .digest("hex")
    .toUpperCase();

  // Verify signature
  if (receivedHash.toUpperCase() !== expectedHash) {
    return {
      valid: false,
      status: "failed",
      message: "Signature verification failed — possible tampering.",
    };
  }

  // Extract result
  const responseCode = formData.pp_ResponseCode || "";
  const responseMessage = formData.pp_ResponseMessage || "";
  const amountPaisa = parseInt(formData.pp_Amount || "0", 10);
  const amountPKR = Math.round(amountPaisa / 100);
  const orderNumber = formData.pp_BillReference || "";
  const paymentReference = formData.pp_TxnRefNo || "";

  // JazzCash response codes: "000" = success, others = failure
  const isPaid = responseCode === "000";

  return {
    valid: true,
    orderNumber,
    paymentReference,
    amount: amountPKR,
    status: isPaid ? "paid" : "failed",
    responseCode,
    responseMessage,
  };
}
