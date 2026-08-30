import { NextResponse } from "next/server";
import { isOnlinePaymentConfigured, getPaymentGateway } from "@/lib/payment";
import { getStoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

// GET /api/payments/config — public endpoint that tells the client which payment
// methods are available and what instructions to show for manual bank transfer.
//
// SECURITY: This endpoint NEVER returns payment gateway API secrets. It returns:
// - onlinePaymentAvailable: whether automatic JazzCash gateway is configured (env-based)
// - gateway: the configured gateway name (or null)
// - codEnabled + manualTransferEnabled: which manual payment methods are available
// - manual transfer instructions (JazzCash number, bank details) — these are PUBLIC
//   by design (shown to customers at checkout to know where to send money)
export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json({
    onlinePaymentAvailable: isOnlinePaymentConfigured(),
    gateway: getPaymentGateway(),
    codEnabled: settings.codEnabled,
    manualTransferEnabled: settings.manualTransferEnabled,
    manualTransfer: {
      jazzCashNumber: settings.jazzCashNumber,
      bankName: settings.bankName,
      bankAccountNumber: settings.bankAccountNumber,
      bankAccountTitle: settings.bankAccountTitle,
    },
  });
}
