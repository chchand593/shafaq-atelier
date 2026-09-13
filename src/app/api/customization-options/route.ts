import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/customization-options — customer-facing add-on list for the
// Customized Abaya builder. Only active options are returned, ordered by
// optionType asc then sortOrder asc so grouped add-ons render in a stable
// order in the builder UI. No auth required.
export async function GET() {
  const options = await db.customizationOption.findMany({
    where: { active: true },
    orderBy: [{ optionType: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      optionType: true,
      additionalPrice: true,
      sortOrder: true,
    },
  });

  return NextResponse.json({ options });
}
