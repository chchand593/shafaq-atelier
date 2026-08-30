import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { getStoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

const MAX_FIELD = 200;
const MAX_ANNOUNCEMENT = 500;

// GET /api/admin/settings — fetch current store settings (admin only)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const s = await getStoreSettings();
  return NextResponse.json({
    settings: {
      businessName: s.businessName,
      businessAddress: s.businessAddress,
      businessEmail: s.businessEmail,
      businessPhone: s.businessPhone,
      businessWhatsapp: s.businessWhatsapp,
      shippingCharge: s.shippingCharge,
      freeShippingThreshold: s.freeShippingThreshold,
      lowStockThreshold: s.lowStockThreshold,
      storeOpen: s.storeOpen,
      announcement: s.announcement ?? "",
      // Manual transfer payment instructions (admin-editable)
      jazzCashNumber: s.jazzCashNumber,
      bankName: s.bankName,
      bankAccountNumber: s.bankAccountNumber,
      bankAccountTitle: s.bankAccountTitle,
      manualTransferEnabled: s.manualTransferEnabled,
      codEnabled: s.codEnabled,
    },
  });
}

// PATCH /api/admin/settings — update editable store settings (admin only)
// Payment gateway API credentials (PAYMENT_SECRET, PAYMENT_API_KEY, PAYMENT_MERCHANT_ID)
// remain in environment variables and are NEVER writable here.
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<{
    businessName: string;
    businessAddress: string;
    businessEmail: string;
    businessPhone: string;
    businessWhatsapp: string;
    shippingCharge: number;
    freeShippingThreshold: number;
    lowStockThreshold: number;
    storeOpen: boolean;
    announcement: string | null;
    jazzCashNumber: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountTitle: string;
    manualTransferEnabled: boolean;
    codEnabled: boolean;
  }>;

  const clean: Record<string, unknown> = {};

  if (body.businessName !== undefined) {
    const v = String(body.businessName).trim();
    if (v.length === 0) return NextResponse.json({ error: "Business name cannot be empty." }, { status: 400 });
    if (v.length > MAX_FIELD) return NextResponse.json({ error: `Business name too long (max ${MAX_FIELD}).` }, { status: 400 });
    clean.businessName = v;
  }

  if (body.businessAddress !== undefined) {
    const v = String(body.businessAddress).trim();
    if (v.length === 0) return NextResponse.json({ error: "Address cannot be empty." }, { status: 400 });
    if (v.length > MAX_FIELD) return NextResponse.json({ error: `Address too long (max ${MAX_FIELD}).` }, { status: 400 });
    clean.businessAddress = v;
  }

  if (body.businessEmail !== undefined) {
    const v = String(body.businessEmail).trim();
    if (v.length === 0) return NextResponse.json({ error: "Email cannot be empty." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    clean.businessEmail = v;
  }

  if (body.businessPhone !== undefined) {
    const v = String(body.businessPhone).trim();
    if (v.length === 0) return NextResponse.json({ error: "Phone cannot be empty." }, { status: 400 });
    if (v.length > MAX_FIELD) return NextResponse.json({ error: `Phone too long (max ${MAX_FIELD}).` }, { status: 400 });
    clean.businessPhone = v;
  }

  if (body.businessWhatsapp !== undefined) {
    const v = String(body.businessWhatsapp).trim();
    if (v.length > MAX_FIELD) return NextResponse.json({ error: `WhatsApp too long (max ${MAX_FIELD}).` }, { status: 400 });
    clean.businessWhatsapp = v;
  }

  if (body.shippingCharge !== undefined) {
    const n = Math.round(Number(body.shippingCharge));
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Shipping charge must be a non-negative number." }, { status: 400 });
    if (n > 100000) return NextResponse.json({ error: "Shipping charge too high." }, { status: 400 });
    clean.shippingCharge = n;
  }

  if (body.freeShippingThreshold !== undefined) {
    const n = Math.round(Number(body.freeShippingThreshold));
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Free shipping threshold must be a non-negative number." }, { status: 400 });
    if (n > 1000000) return NextResponse.json({ error: "Free shipping threshold too high." }, { status: 400 });
    clean.freeShippingThreshold = n;
  }

  if (body.lowStockThreshold !== undefined) {
    const n = Math.round(Number(body.lowStockThreshold));
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Low stock threshold must be a non-negative number." }, { status: 400 });
    if (n > 10000) return NextResponse.json({ error: "Low stock threshold too high." }, { status: 400 });
    clean.lowStockThreshold = n;
  }

  if (body.storeOpen !== undefined) {
    clean.storeOpen = Boolean(body.storeOpen);
  }

  if (body.announcement !== undefined) {
    const v = body.announcement === null ? null : String(body.announcement).trim();
    if (v !== null && v.length > MAX_ANNOUNCEMENT) {
      return NextResponse.json({ error: `Announcement too long (max ${MAX_ANNOUNCEMENT}).` }, { status: 400 });
    }
    clean.announcement = v && v.length > 0 ? v : null;
  }

  // --- Manual transfer payment settings ---
  if (body.jazzCashNumber !== undefined) {
    const v = String(body.jazzCashNumber).trim();
    if (v.length === 0) return NextResponse.json({ error: "JazzCash number cannot be empty when manual transfer is enabled." }, { status: 400 });
    if (v.length > MAX_FIELD) return NextResponse.json({ error: `JazzCash number too long (max ${MAX_FIELD}).` }, { status: 400 });
    clean.jazzCashNumber = v;
  }

  if (body.bankName !== undefined) {
    const v = String(body.bankName).trim();
    if (v.length === 0) return NextResponse.json({ error: "Bank name cannot be empty when manual transfer is enabled." }, { status: 400 });
    if (v.length > MAX_FIELD) return NextResponse.json({ error: `Bank name too long (max ${MAX_FIELD}).` }, { status: 400 });
    clean.bankName = v;
  }

  if (body.bankAccountNumber !== undefined) {
    const v = String(body.bankAccountNumber).trim();
    if (v.length === 0) return NextResponse.json({ error: "Bank account number cannot be empty when manual transfer is enabled." }, { status: 400 });
    if (v.length > MAX_FIELD) return NextResponse.json({ error: `Bank account number too long (max ${MAX_FIELD}).` }, { status: 400 });
    clean.bankAccountNumber = v;
  }

  if (body.bankAccountTitle !== undefined) {
    const v = String(body.bankAccountTitle).trim();
    if (v.length === 0) return NextResponse.json({ error: "Bank account title cannot be empty when manual transfer is enabled." }, { status: 400 });
    if (v.length > MAX_FIELD) return NextResponse.json({ error: `Bank account title too long (max ${MAX_FIELD}).` }, { status: 400 });
    clean.bankAccountTitle = v;
  }

  if (body.manualTransferEnabled !== undefined) {
    clean.manualTransferEnabled = Boolean(body.manualTransferEnabled);
  }

  if (body.codEnabled !== undefined) {
    clean.codEnabled = Boolean(body.codEnabled);
  }

  // Sanity: at least one payment method must remain available so customers can
  // actually place orders. COD OR manual transfer OR automatic JazzCash (env)
  // — at least one of the three.
  if (clean.codEnabled === false && clean.manualTransferEnabled === false) {
    return NextResponse.json(
      { error: "At least one payment method (COD or Manual Transfer) must be enabled." },
      { status: 400 }
    );
  }

  if (Object.keys(clean).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  // Ensure the singleton row exists, then update.
  await getStoreSettings();
  const updated = await db.storeSettings.update({
    where: { id: "default" },
    data: clean,
  });

  return NextResponse.json({
    ok: true,
    settings: {
      businessName: updated.businessName,
      businessAddress: updated.businessAddress,
      businessEmail: updated.businessEmail,
      businessPhone: updated.businessPhone,
      businessWhatsapp: updated.businessWhatsapp,
      shippingCharge: updated.shippingCharge,
      freeShippingThreshold: updated.freeShippingThreshold,
      lowStockThreshold: updated.lowStockThreshold,
      storeOpen: updated.storeOpen,
      announcement: updated.announcement ?? "",
      jazzCashNumber: updated.jazzCashNumber,
      bankName: updated.bankName,
      bankAccountNumber: updated.bankAccountNumber,
      bankAccountTitle: updated.bankAccountTitle,
      manualTransferEnabled: updated.manualTransferEnabled,
      codEnabled: updated.codEnabled,
    },
  });
}
