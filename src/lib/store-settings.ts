// Server-only store settings helper.
// Returns the singleton StoreSettings row, creating it with defaults if missing.

import { db } from "@/lib/db";

export type StoreSettings = {
  id: string;
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
  // Manual bank transfer payment instructions
  jazzCashNumber: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountTitle: string;
  manualTransferEnabled: boolean;
  codEnabled: boolean;
  updatedAt: Date;
};

const DEFAULT_SETTINGS = {
  businessName: "ShafaQ Atelier",
  businessAddress: "M.A. Jinnah Road, Okara, Punjab, Pakistan",
  businessEmail: "hello@shafaqatelier.pk",
  businessPhone: "+92 300 1234567",
  businessWhatsapp: "+92 300 1234567",
  shippingCharge: 350,
  freeShippingThreshold: 10000,
  lowStockThreshold: 5,
  storeOpen: true,
  announcement: null as string | null,
  jazzCashNumber: "03256912201",
  bankName: "Raqmi Islamic Digital Bank",
  bankAccountNumber: "028846199786",
  bankAccountTitle: "ShafaQ Atelier",
  manualTransferEnabled: true,
  codEnabled: true,
};

// getStoreSettings always returns a valid settings object. If the row does not
// exist yet, it is lazily seeded with the default values above.
export async function getStoreSettings(): Promise<StoreSettings> {
  let row = await db.storeSettings.findUnique({
    where: { id: "default" },
  });
  if (!row) {
    row = await db.storeSettings.create({
      data: { id: "default", ...DEFAULT_SETTINGS },
    });
  }
  return row;
}

// Public, safe-to-expose settings returned to the storefront. Never includes
// secrets, payment API credentials, or anything sensitive. The manual transfer
// fields (jazzCashNumber, bank account details) are intentionally public — they
// are shown to customers during checkout to instruct them where to send money.
export async function getPublicStoreSettings() {
  const s = await getStoreSettings();
  return {
    businessName: s.businessName,
    businessAddress: s.businessAddress,
    businessEmail: s.businessEmail,
    businessPhone: s.businessPhone,
    businessWhatsapp: s.businessWhatsapp,
    shippingCharge: s.shippingCharge,
    freeShippingThreshold: s.freeShippingThreshold,
    lowStockThreshold: s.lowStockThreshold,
    storeOpen: s.storeOpen,
    announcement: s.announcement,
    // Public payment method availability + manual transfer instructions
    codEnabled: s.codEnabled,
    manualTransferEnabled: s.manualTransferEnabled,
    jazzCashNumber: s.jazzCashNumber,
    bankName: s.bankName,
    bankAccountNumber: s.bankAccountNumber,
    bankAccountTitle: s.bankAccountTitle,
  };
}
