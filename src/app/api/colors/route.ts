import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/colors — customer-facing color palette. Only active colors are
// returned. Ordered by sortOrder asc, then name asc. No auth required.
//
// Robustness: wrapped in try/catch — returns `{ colors: [] }` (200) on any
// unexpected error so the Custom Abaya builder renders an empty color list
// instead of an error page.
export async function GET() {
  try {
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
  } catch (e) {
    console.error("[/api/colors] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ colors: [] });
  }
}
