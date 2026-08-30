import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLoyaltyInfo } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

// GET /api/loyalty — get the signed-in user's loyalty balance + transactions
export async function GET() {
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
  const info = await getLoyaltyInfo(user.id);
  return NextResponse.json({ loyalty: info });
}
