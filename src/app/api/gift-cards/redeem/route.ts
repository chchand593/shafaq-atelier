import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/gift-cards/redeem — redeem a gift card for a given amount
// Body: { code, amount } → returns { ok, applied, remainingBalance }
export async function POST(request: Request) {
  const { code, amount } = (await request.json()) as {
    code?: string;
    amount?: number;
  };

  if (!code?.trim()) {
    return NextResponse.json({ error: "Gift card code is required." }, { status: 400 });
  }
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid redemption amount." }, { status: 400 });
  }

  const card = await db.giftCard.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!card) {
    return NextResponse.json({ error: "Gift card not found." }, { status: 404 });
  }
  if (card.status !== "active") {
    return NextResponse.json(
      { error: `This gift card is ${card.status}.` },
      { status: 400 }
    );
  }

  const applied = Math.min(amount, card.balance);
  const newBalance = card.balance - applied;

  await db.giftCard.update({
    where: { id: card.id },
    data: {
      balance: newBalance,
      status: newBalance === 0 ? "redeemed" : "active",
    },
  });

  return NextResponse.json({
    ok: true,
    code: card.code,
    applied,
    remainingBalance: newBalance,
  });
}
