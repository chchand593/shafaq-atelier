import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const AMOUNTS = [5000, 10000, 15000, 25000, 50000];

// POST /api/gift-cards — purchase a gift card
export async function POST(request: Request) {
  const body = (await request.json()) as {
    amount?: number;
    buyerName?: string;
    buyerEmail?: string;
    recipientName?: string;
    recipientEmail?: string;
    message?: string;
  };

  if (!body.amount || !AMOUNTS.includes(body.amount)) {
    return NextResponse.json(
      { error: "Please select a valid gift card amount." },
      { status: 400 }
    );
  }
  if (!body.recipientName?.trim() || !body.recipientEmail?.trim()) {
    return NextResponse.json(
      { error: "Recipient name and email are required." },
      { status: 400 }
    );
  }

  const code = "LMGC-" + Date.now().toString(36).toUpperCase().slice(-8);

  const giftCard = await db.giftCard.create({
    data: {
      code,
      amount: body.amount,
      balance: body.amount,
      buyerName: body.buyerName?.trim() || null,
      buyerEmail: body.buyerEmail?.trim() || null,
      recipientName: body.recipientName.trim(),
      recipientEmail: body.recipientEmail.trim().toLowerCase(),
      message: body.message?.trim() || null,
      status: "active",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  return NextResponse.json({
    ok: true,
    giftCard: {
      code: giftCard.code,
      amount: giftCard.amount,
      balance: giftCard.balance,
      recipientName: giftCard.recipientName,
      recipientEmail: giftCard.recipientEmail,
      message: giftCard.message,
    },
  });
}

// GET /api/gift-cards?[code=...] — check a gift card balance
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const card = await db.giftCard.findUnique({ where: { code } });
  if (!card) {
    return NextResponse.json({ error: "Gift card not found" }, { status: 404 });
  }
  if (card.status !== "active") {
    return NextResponse.json({
      error: `This gift card is ${card.status}.`,
    }, { status: 400 });
  }

  return NextResponse.json({
    code: card.code,
    balance: card.balance,
    amount: card.amount,
    status: card.status,
  });
}
