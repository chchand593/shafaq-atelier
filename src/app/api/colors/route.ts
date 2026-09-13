import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/colors — customer-facing color palette. Only active colors are
// returned. Ordered by sortOrder asc, then name asc. No auth required.
export async function GET() {
  const colors = await db.color.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      hex: true,
      sortOrder: true,
    },
  });

  return NextResponse.json({ colors });
}
