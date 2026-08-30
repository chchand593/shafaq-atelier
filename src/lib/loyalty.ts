// Loyalty points system for the ShafaQ Atelier store.
// Points are earned on purchases (1 point per PKR 100 spent) and
// redeemable at checkout (1 point = PKR 1).

import { db } from "@/lib/db";

export const POINTS_PER_PKR = 100; // earn 1 point per PKR 100 spent
export const POINT_VALUE_PKR = 1; // 1 point = PKR 1
export const MIN_REDEEM_POINTS = 100; // minimum to redeem

export function pointsEarnedFor(total: number): number {
  return Math.floor(total / POINTS_PER_PKR);
}

export function pointsToPKR(points: number): number {
  return points * POINT_VALUE_PKR;
}

// Award points to a user after an order. Creates a PointTransaction + updates balance.
export async function awardPoints(
  userId: string,
  points: number,
  orderId: string | null,
  description: string
) {
  if (points <= 0) return;
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { increment: points } },
    }),
    db.pointTransaction.create({
      data: {
        userId,
        points,
        type: "earned",
        description,
        orderId,
      },
    }),
  ]);
}

// Redeem points for a user. Returns true if successful, false if insufficient.
export async function redeemPoints(
  userId: string,
  points: number,
  orderId: string | null,
  description: string
): Promise<boolean> {
  if (points < MIN_REDEEM_POINTS) return false;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.loyaltyPoints < points) return false;

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { decrement: points } },
    }),
    db.pointTransaction.create({
      data: {
        userId,
        points: -points,
        type: "redeemed",
        description,
        orderId,
      },
    }),
  ]);
  return true;
}

// Get a user's loyalty info (balance + recent transactions).
export async function getLoyaltyInfo(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true },
  });
  if (!user) return null;
  const transactions = await db.pointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return {
    balance: user.loyaltyPoints,
    pointsValue: pointsToPKR(user.loyaltyPoints),
    canRedeem: user.loyaltyPoints >= MIN_REDEEM_POINTS,
    minRedeem: MIN_REDEEM_POINTS,
    transactions: transactions.map((t) => ({
      id: t.id,
      points: t.points,
      type: t.type,
      description: t.description,
      createdAt: t.createdAt,
    })),
  };
}
