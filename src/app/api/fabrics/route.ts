import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/fabrics — customer-facing fabric list for the Customized Abaya
// builder. Only active fabrics are returned, ordered by sortOrder asc. No auth.
export async function GET() {
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
}
