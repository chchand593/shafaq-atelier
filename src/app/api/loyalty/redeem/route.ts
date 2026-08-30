import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redeemPoints, MIN_REDEEM_POINTS, pointsToPKR } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

// POST /api/loyalty/redeem — redeem points (returns the PKR value to apply)
// Body: { points } → returns { ok, appliedPKR, remainingPoints }
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { points } = (await request.json()) as { points?: number };
  if (!points || points < MIN_REDEEM_POINTS) {
    return NextResponse.json(
      { error: `Minimum ${MIN_REDEEM_POINTS} points required to redeem.` },
      { status: 400 }
    );
  }
  if (user.loyaltyPoints < points) {
    return NextResponse.json(
      { error: "Insufficient points balance." },
      { status: 400 }
    );
  }

  const ok = await redeemPoints(user.id, points, null, "Redeemed at checkout");
  if (!ok) {
    return NextResponse.json({ error: "Failed to redeem points." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    appliedPKR: pointsToPKR(points),
    redeemedPoints: points,
    remainingPoints: user.loyaltyPoints - points,
  });
}
