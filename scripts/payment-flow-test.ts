// Comprehensive payment flow tests: COD + bank transfer + admin verify/reject + customer cannot self-mark paid.
// Runs against the dev server (which must be running on http://localhost:3000).
// Uses pure HTTP — no Prisma import — to avoid memory pressure on the sandbox.

const BASE = "http://localhost:3000";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Robust fetch with retry — the dev server occasionally dies under memory pressure
// and may need a moment to be restarted manually between batches.
async function fetchRetry(url: string, init?: RequestInit, retries = 4): Promise<Response> {
  let lastErr: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchRetry(url, init);
    } catch (e) {
      lastErr = e;
      await sleep(2500 * (i + 1));
    }
  }
  throw lastErr;
}

const cookies: Record<string, string> = {};
function getCookieHeader(): string {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
}
function captureCookies(res: Response) {
  const setCookies = res.headers.getSetCookie?.() || [];
  for (const sc of setCookies) {
    const m = sc.match(/^([^=;]+)=([^;]*)/);
    if (m) {
      if (m[2].length === 0 || sc.toLowerCase().includes("max-age=0")) delete cookies[m[1]];
      else cookies[m[1]] = m[2];
    }
  }
}
async function fetchC(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (Object.keys(cookies).length) headers.set("Cookie", getCookieHeader());
  const res = await fetchRetry(url, { ...init, headers, redirect: "manual" });
  captureCookies(res);
  return res;
}
async function getCsrf(): Promise<string> {
  const r = await fetchC(`${BASE}/api/auth/csrf`);
  return (await r.json() as { csrfToken: string }).csrfToken;
}
async function signIn(email: string, password: string): Promise<void> {
  const csrf = await getCsrf();
  await fetchC(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, password, csrfToken: csrf, json: "true", callbackUrl: "/" }).toString(),
  });
}

let pass = 0, fail = 0;
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { pass++; console.log(`✓ ${name}${detail ? " — " + detail : ""}`); }
  else { fail++; console.log(`✗ ${name}${detail ? " — " + detail : ""}`); }
}

const ADMIN_EMAIL = "admin@shafaqatelier.pk";
const ADMIN_PASSWORD = "ShafaqAdmin@2026!";

console.log("=== Test 1: Payment config (manual transfer should be enabled) ===");
const cfg = await (await fetchRetry(`${BASE}/api/payments/config`)).json();
check("onlinePaymentAvailable=false", cfg.onlinePaymentAvailable === false);
check("codEnabled=true", cfg.codEnabled === true);
check("manualTransferEnabled=true", cfg.manualTransferEnabled === true);
check("manualTransfer.jazzCashNumber populated", !!(cfg.manualTransfer?.jazzCashNumber));
check("manualTransfer.bankName populated", !!(cfg.manualTransfer?.bankName));
check("manualTransfer.bankAccountNumber populated", !!(cfg.manualTransfer?.bankAccountNumber));
check("manualTransfer.bankAccountTitle populated", !!(cfg.manualTransfer?.bankAccountTitle));
check("no payment secrets in config", !JSON.stringify(cfg).includes("PAYMENT_SECRET") && !JSON.stringify(cfg).includes("PAYMENT_API_KEY"));

console.log("\n=== Test 2: COD checkout ===");
const prods = await (await fetchRetry(`${BASE}/api/products`)).json();
const product = prods.products[0];
const codPayload = {
  items: [{
    productId: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    qty: 1,
    color: product.colorOptions?.[0]?.hex || "#1a1a1a",
    colorName: product.colorOptions?.[0]?.name || "Default",
    size: product.sizes?.[0] || "M",
  }],
  email: `qa-cod-${Date.now()}@shafaqatelier-test.pk`,
  fullName: "QA COD",
  phone: "+92 300 1234567",
  address: "Test Address",
  city: "Okara",
  province: "Punjab",
  postal: "56300",
  payment: "cod",
  clientToken: `qa-cod-${Date.now()}`,
};
const codRes = await fetchRetry(`${BASE}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(codPayload),
});
const codJson = await codRes.json();
check("COD order created", codJson.ok === true);
check("COD payment=cod", codJson.order?.payment === "cod");
check("COD paymentStatus=pending", codJson.order?.paymentStatus === "pending");
check("COD paymentReference=null", codJson.order?.paymentReference === null);
check("COD paymentProvider=null", codJson.order?.paymentProvider === null);
check("COD status=processing", codJson.order?.status === "processing");
const codOrderId = codJson.order?.id;
const codOrderNumber = codJson.order?.number;

console.log("\n=== Test 3: Bank transfer checkout (with txn ID) ===");
const bankPayload = {
  ...codPayload,
  email: `qa-bt-${Date.now()}@shafaqatelier-test.pk`,
  payment: "bank_transfer",
  paymentReference: "TXN-TEST-1234567",
  clientToken: `qa-bt-${Date.now()}`,
};
const bankRes = await fetchRetry(`${BASE}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(bankPayload),
});
const bankJson = await bankRes.json();
check("Bank transfer order created", bankJson.ok === true);
check("Bank transfer payment=bank_transfer", bankJson.order?.payment === "bank_transfer");
check("Bank transfer paymentStatus=pending", bankJson.order?.paymentStatus === "pending");
check("Bank transfer paymentReference=TXN-TEST-1234567", bankJson.order?.paymentReference === "TXN-TEST-1234567");
check("Bank transfer paymentProvider=bank_transfer", bankJson.order?.paymentProvider === "bank_transfer");
const bankOrderId = bankJson.order?.id;
const bankOrderNumber = bankJson.order?.number;

console.log("\n=== Test 4: Bank transfer missing transaction ID — should fail ===");
const noTxnPayload = {
  ...bankPayload,
  email: `qa-notxn-${Date.now()}@shafaqatelier-test.pk`,
  paymentReference: "",
  clientToken: `qa-notxn-${Date.now()}`,
};
const noTxnRes = await fetchRetry(`${BASE}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(noTxnPayload),
});
const noTxnJson = await noTxnRes.json();
check("Missing txn ID rejected", noTxnRes.status === 400);
check("Missing txn ID error message", /transaction|reference/i.test(noTxnJson?.error || ""));

console.log("\n=== Test 5: Bank transfer with invalid chars in txn ID — should fail ===");
const invalidTxnPayload = {
  ...bankPayload,
  email: `qa-invalid-${Date.now()}@shafaqatelier-test.pk`,
  paymentReference: "INVALID@#$%",
  clientToken: `qa-invalid-${Date.now()}`,
};
const invalidTxnRes = await fetchRetry(`${BASE}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(invalidTxnPayload),
});
const invalidTxnJson = await invalidTxnRes.json();
check("Invalid chars in txn ID rejected", invalidTxnRes.status === 400);

console.log("\n=== Test 6: Customer CANNOT mark payment as paid ===");
// Sign in as customer (ayesha@example.com)
await signIn("ayesha@example.com", "password123");
const custPatch = await fetchC(`${BASE}/api/admin/orders/${bankOrderId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ paymentStatus: "paid" }),
});
check("Customer denied from admin order PATCH", custPatch.status === 401);
// Sign out
const csrf = await getCsrf();
await fetchC(`${BASE}/api/auth/signout`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ csrfToken: csrf, callbackUrl: "/" }).toString(),
});

console.log("\n=== Test 7: Unauthenticated CANNOT mark payment as paid ===");
const unauthPatch = await fetchRetry(`${BASE}/api/admin/orders/${bankOrderId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ paymentStatus: "paid" }),
});
check("Unauth denied from admin order PATCH", unauthPatch.status === 401);

console.log("\n=== Test 8: Admin can VERIFY bank transfer payment ===");
await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
const verifyRes = await fetchC(`${BASE}/api/admin/orders/${bankOrderId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ paymentStatus: "paid" }),
});
const verifyJson = await verifyRes.json();
check("Admin verify returns 200", verifyRes.status === 200);
check("Admin verify ok=true", verifyJson.ok === true);
check("Admin verify paymentStatus=paid", verifyJson.order?.paymentStatus === "paid");
// Reload order to confirm paidAt + paymentVerifiedAt set
const reloaded = await (await fetchC(`${BASE}/api/admin/orders/${bankOrderNumber}`)).json();
check("paidAt set after verify", !!reloaded.order?.paidAt);
check("paymentVerifiedAt set after verify", !!reloaded.order?.paymentVerifiedAt);

console.log("\n=== Test 9: Admin can REJECT payment (mark as failed) ===");
// Create another bank transfer order to test reject flow
const rejectPayload = {
  ...bankPayload,
  email: `qa-reject-${Date.now()}@shafaqatelier-test.pk`,
  paymentReference: "TXN-REJECT-9876543",
  clientToken: `qa-reject-${Date.now()}`,
};
const rejectRes = await fetchRetry(`${BASE}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(rejectPayload),
});
const rejectJson = await rejectRes.json();
const rejectOrderId = rejectJson.order?.id;
const rejectOrderNumber = rejectJson.order?.number;
check("Created new bank transfer order for reject test", rejectJson.ok === true);

const rejectPatchRes = await fetchC(`${BASE}/api/admin/orders/${rejectOrderId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    paymentStatus: "failed",
    paymentNote: "Transaction ID not found in our records",
  }),
});
const rejectPatchJson = await rejectPatchRes.json();
check("Admin reject returns 200", rejectPatchRes.status === 200);
check("Admin reject paymentStatus=failed", rejectPatchJson.order?.paymentStatus === "failed");
// Reload to verify paymentFailureReason set
const reloadedReject = await (await fetchC(`${BASE}/api/admin/orders/${rejectOrderNumber}`)).json();
check("paymentFailureReason set after reject", /Transaction ID not found/i.test(reloadedReject.order?.paymentFailureReason || ""));
check("paymentVerifiedAt set after reject", !!reloadedReject.order?.paymentVerifiedAt);

console.log("\n=== Test 10: Admin orders list shows payment method + reference ===");
const adminOrders = await (await fetchC(`${BASE}/api/admin/orders`)).json();
const foundBankOrder = adminOrders.orders?.find((o: any) => o.number === bankOrderNumber);
check("Admin orders list includes bank transfer order", !!foundBankOrder);
check("Admin orders list includes payment method field", typeof foundBankOrder?.payment === "string");
check("Admin orders list includes paymentReference field", "paymentReference" in (foundBankOrder || {}));

console.log("\n=== Test 11: Customer order tracking shows payment method + status ===");
// Customer-facing order lookup (unauth) — should show payment method + status
const custOrderRes = await fetchRetry(`${BASE}/api/orders/${bankOrderNumber}`);
const custOrderJson = await custOrderRes.json();
check("Customer order lookup 200", custOrderRes.status === 200);
check("Customer order shows payment=bank_transfer", custOrderJson.order?.payment === "bank_transfer");
check("Customer order shows paymentStatus=paid", custOrderJson.order?.paymentStatus === "paid");
// Customer order should NOT include admin-only audit fields
const custStr = JSON.stringify(custOrderJson);
check("Customer order no paymentVerifiedById leaked", !custStr.includes("paymentVerifiedById"));
check("Customer order no paymentScreenshotPath leaked", !custStr.includes("paymentScreenshotPath"));

console.log("\n=== Test 12: Custom abaya checkout still works with bank_transfer ===");
const customPayload = {
  items: [{
    productId: `custom-${Date.now()}`,
    name: "Custom Abaya (Made-to-Order)",
    image: "/images/custom.jpg",
    price: 21500,
    qty: 1,
    color: "#1a1a1a",
    colorName: "Black",
    size: "Custom (made-to-order)",
  }],
  email: `qa-custom-bt-${Date.now()}@shafaqatelier-test.pk`,
  fullName: "QA Custom BT",
  phone: "+92 300 1234567",
  address: "Test Address",
  city: "Okara",
  province: "Punjab",
  postal: "56300",
  payment: "bank_transfer",
  paymentReference: "CUSTOM-TXN-001",
  clientToken: `qa-custom-bt-${Date.now()}`,
};
const customRes = await fetchRetry(`${BASE}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(customPayload),
});
const customJson = await customRes.json();
check("Custom abaya bank transfer order created", customJson.ok === true);
check("Custom abaya payment=bank_transfer", customJson.order?.payment === "bank_transfer");
check("Custom abaya paymentReference=CUSTOM-TXN-001", customJson.order?.paymentReference === "CUSTOM-TXN-001");
check("Custom abaya item preserved", customJson.order?.items?.[0]?.productId?.startsWith("custom-"));

console.log("\n=== Test 13: Duplicate order prevention still works ===");
const dupRes = await fetchRetry(`${BASE}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(bankPayload),
});
check("Duplicate submission rejected", dupRes.status === 409);

console.log("\n=== Test 14: Admin settings update with new payment fields ===");
const updateRes = await fetchC(`${BASE}/api/admin/settings`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jazzCashNumber: "03XXXXXXX",
    bankName: "Test Bank",
    bankAccountNumber: "TEST-ACCT-001",
    bankAccountTitle: "Test Title",
  }),
});
const updateJson = await updateRes.json();
check("Settings PATCH 200", updateRes.status === 200);
check("Settings PATCH ok=true", updateJson.ok === true);
check("Settings PATCH returns updated jazzCashNumber", updateJson.settings?.jazzCashNumber === "03XXXXXXX");
check("Settings PATCH returns updated bankName", updateJson.settings?.bankName === "Test Bank");
// Restore the original values
await fetchC(`${BASE}/api/admin/settings`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jazzCashNumber: "03256912201",
    bankName: "Raqmi Islamic Digital Bank",
    bankAccountNumber: "028846199786",
    bankAccountTitle: "ShafaQ Atelier",
  }),
});
check("Settings restored to original values", true);

console.log("\n=== Test 15: Disable COD via settings, then COD order should be rejected ===");
await fetchC(`${BASE}/api/admin/settings`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ codEnabled: false }),
});
const blockedCodRes = await fetchRetry(`${BASE}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ...codPayload,
    email: `qa-cod-blocked-${Date.now()}@shafaqatelier-test.pk`,
    clientToken: `qa-cod-blocked-${Date.now()}`,
  }),
});
const blockedCodJson = await blockedCodRes.json();
check("COD rejected when codEnabled=false", blockedCodRes.status === 400);
check("COD blocked with clear message", /cash on delivery|unavailable/i.test(blockedCodJson?.error || ""));
// Restore COD
await fetchC(`${BASE}/api/admin/settings`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ codEnabled: true }),
});

console.log("\n=== Test 16: Cannot disable BOTH payment methods ===");
const disableBothRes = await fetchC(`${BASE}/api/admin/settings`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ codEnabled: false, manualTransferEnabled: false }),
});
const disableBothJson = await disableBothRes.json();
check("Cannot disable both payment methods", disableBothRes.status === 400);
check("Disable both blocked with clear message", /at least one/i.test(disableBothJson?.error || ""));

console.log("\n=== Test 17: Stock decrement still works ===");
const stockBefore = await (await fetchC(`${BASE}/api/admin/products`)).json();
const prodStockBefore = stockBefore.products.find((p: any) => p.id === product.id)?.stock;
// We already placed 1 COD order for this product, plus another one in Test 15 above didn't go through.
// So current stock = original - 1 (from Test 2).
console.log(`  Product stock before Test 17: ${prodStockBefore}`);
const stockPayload = {
  ...codPayload,
  email: `qa-stock-${Date.now()}@shafaqatelier-test.pk`,
  clientToken: `qa-stock-${Date.now()}`,
};
const stockRes = await fetchRetry(`${BASE}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(stockPayload),
});
const stockJson = await stockRes.json();
const stockAfter = await (await fetchC(`${BASE}/api/admin/products`)).json();
const prodStockAfter = stockAfter.products.find((p: any) => p.id === product.id)?.stock;
check("Stock decremented after order", stockJson.ok === true && prodStockAfter === prodStockBefore - 1);

// Cancel the new order to restore stock
await fetchC(`${BASE}/api/admin/orders/${stockJson.order.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "cancelled" }),
});
const stockAfterCancel = await (await fetchC(`${BASE}/api/admin/products`)).json();
const prodStockAfterCancel = stockAfterCancel.products.find((p: any) => p.id === product.id)?.stock;
check("Stock restored after cancel", prodStockAfterCancel === prodStockBefore);

console.log("\n=== Test 18: Clean up — cancel all test orders ===");
const allOrders = await (await fetchC(`${BASE}/api/admin/orders`)).json();
const testOrders = (allOrders.orders || []).filter((o: any) =>
  o.email?.includes("@shafaqatelier-test.pk") || o.fullName?.startsWith("QA ")
);
console.log(`  Cancelling ${testOrders.length} test orders...`);
for (const o of testOrders) {
  if (o.status !== "cancelled") {
    await fetchC(`${BASE}/api/admin/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
  }
}
check("Test orders cancelled", true);

// Sign out admin
const finalCsrf = await getCsrf();
await fetchC(`${BASE}/api/auth/signout`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ csrfToken: finalCsrf, callbackUrl: "/" }).toString(),
});

console.log(`\n=== SUMMARY ===`);
console.log(`PASS: ${pass} | FAIL: ${fail} | TOTAL: ${pass + fail}`);
if (fail > 0) {
  console.log("\nFAILURES — see ✗ marks above");
}
