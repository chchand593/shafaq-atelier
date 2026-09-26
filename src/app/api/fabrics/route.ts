import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/fabrics — customer-facing fabric list for the Customized Abaya
// builder. Only active fabrics are returned, ordered by sortOrder asc. No auth.
//
// Robustness: wrapped in try/catch — returns `{ fabrics: [] }` (200) on any
// unexpected error so the Custom Abaya builder renders an empty fabric list
// instead of an error page.
export async function GET() {
  try {
    const fabrics = await db.fabric.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        additionalPrice: true,
        themeValue: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ fabrics });
  } catch (e) {
    console.error("[/api/fabrics] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ fabrics: [] });
  }
}
